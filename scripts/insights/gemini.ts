// Minimal Gemini API client (free tier). The key is read from the environment by the caller and
// sent only in a request header to Google's fixed endpoint; it is never logged or written to disk.

export class QuotaError extends Error {}
export class AuthError extends Error {}
export class ModelError extends Error {}

export interface GeminiOptions {
  apiKey: string
  model: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

const LANGUAGE_BLOCK = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    summary: { type: 'STRING' },
    impact: { type: 'STRING' },
    keyPoints: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'summary', 'impact', 'keyPoints'],
}

/** Structured-output schema: the model must return all four languages. */
export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: { en: LANGUAGE_BLOCK, km: LANGUAGE_BLOCK, 'zh-CN': LANGUAGE_BLOCK, ko: LANGUAGE_BLOCK },
  required: ['en', 'km', 'zh-CN', 'ko'],
}

/** Sends one prompt and returns the parsed JSON object. */
export async function generateJson(system: string, user: string, opts: GeminiOptions): Promise<unknown> {
  const { apiKey, model, fetchImpl = fetch, timeoutMs = 60_000 } = opts
  if (!/^[\w.-]+$/.test(model)) throw new ModelError(`Invalid model name: ${model}`)

  let res: Response
  try {
    res = await fetchImpl(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
      }),
    })
  } catch (err) {
    throw new Error(`Network error: ${(err as Error).message}`)
  }

  if (res.status === 429) throw new QuotaError('Gemini free-tier quota reached (HTTP 429)')
  if (res.status === 401 || res.status === 403) throw new AuthError(`Gemini rejected the API key (HTTP ${res.status})`)
  if (res.status === 404) throw new ModelError(`Model "${model}" not found. Set the GEMINI_MODEL repository variable to an available model.`)
  if (!res.ok) {
    // Google's error message explains bad requests (e.g. an unsupported schema). It never echoes the key.
    const detail = await res
      .json()
      .then((b: { error?: { message?: string } }) => b.error?.message ?? '')
      .catch(() => '')
    throw new Error(`Gemini HTTP ${res.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`)
  }

  const body = (await res.json()) as {
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }>
    promptFeedback?: { blockReason?: string }
  }
  if (body.promptFeedback?.blockReason) throw new Error(`Prompt blocked: ${body.promptFeedback.blockReason}`)
  const candidate = body.candidates?.[0]
  const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new Error(`Empty response (finish reason: ${candidate?.finishReason ?? 'unknown'})`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Response was not valid JSON')
  }
}
