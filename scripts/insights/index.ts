// CLI entry: npm run insights
// Needs GEMINI_API_KEY (a free Google AI Studio key, stored as a GitHub Actions secret). Without it, this step is skipped.
import { appendFile, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ArticlesFileSchema } from '../../src/shared/article.ts'
import { InsightFileSchema } from '../../src/shared/insight.ts'
import { runInsights } from './generate.ts'

const root = path.resolve(import.meta.dirname, '../..')
const articlesPath = path.join(root, 'public/data/articles.json')
const insightsDir = path.join(root, 'public/data/insights')
const contextPath = path.join(root, '.cache/feed-context.json')

const DEFAULT_MODEL = 'gemini-flash-latest'

async function readExisting(validIds: Set<string>): Promise<Map<string, string>> {
  const existing = new Map<string, string>()
  await mkdir(insightsDir, { recursive: true })
  for (const name of await readdir(insightsDir)) {
    if (!name.endsWith('.json')) continue
    const file = path.join(insightsDir, name)
    const parsed = InsightFileSchema.safeParse(JSON.parse(await readFile(file, 'utf8').catch(() => 'null')))
    // Remove insights for articles that aged out, and anything that no longer validates.
    if (!parsed.success || !validIds.has(parsed.data.articleId)) {
      await unlink(file)
      continue
    }
    existing.set(parsed.data.articleId, parsed.data.contentHash)
  }
  return existing
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    console.log('GEMINI_API_KEY is not set; skipping AI insights.')
    return
  }
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL
  const limit = Number(process.env.INSIGHTS_MAX_PER_RUN) || 12
  const delayMs = Number(process.env.INSIGHTS_DELAY_MS) || 6500

  const { articles } = ArticlesFileSchema.parse(JSON.parse(await readFile(articlesPath, 'utf8')))
  const existing = await readExisting(new Set(articles.map((a) => a.id)))
  const contexts = JSON.parse(await readFile(contextPath, 'utf8').catch(() => '{}')) as Record<string, string>

  const result = await runInsights({
    articles,
    existing,
    contexts,
    gemini: { apiKey, model },
    limit,
    delayMs,
    write: async (file) => {
      InsightFileSchema.parse(file)
      await writeFile(path.join(insightsDir, `${file.articleId}.json`), JSON.stringify(file, null, 1) + '\n')
    },
  })

  const pending = articles.filter((a) => existing.get(a.id) !== a.contentHash).length - result.written.length
  const summary = [
    '## AI insights (Gemini free tier)',
    '',
    `- Model: \`${model}\``,
    `- Written this run: **${result.written.length}**`,
    `- Failed: **${result.failed.length}**`,
    `- Still waiting: **${pending}**`,
    result.stoppedBecause ? `- Stopped early: ${result.stoppedBecause}` : '',
    ...result.failed.map((f) => `  - ${f.id}: ${f.error}`),
    '',
  ].join('\n')
  console.log(summary)
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)
}

main().catch((err) => {
  // Never print request details: they could include the key in a header dump.
  console.error(`AI insights failed: ${(err as Error).message}`)
  process.exitCode = 1
})
