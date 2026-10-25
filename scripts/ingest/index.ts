// CLI entry: npm run ingest
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ArticlesFileSchema, SCHEMA_VERSION, type ArticlesFile } from '../../src/shared/article.ts'
import { runIngestion, summaryMarkdown } from './run.ts'
import { parseSourcesConfig } from './sources.ts'

const root = path.resolve(import.meta.dirname, '../..')
const sourcesPath = path.join(root, 'sources/sources.json')
const dataDir = path.join(root, 'public/data')
const articlesPath = path.join(dataDir, 'articles.json')
const publicSourcesPath = path.join(dataDir, 'sources.json')
// Not published: longer feed text used only as input for AI insights (see scripts/insights).
const contextPath = path.join(root, '.cache/feed-context.json')

async function readPrevious(): Promise<ArticlesFile | null> {
  try {
    const parsed = ArticlesFileSchema.safeParse(JSON.parse(await readFile(articlesPath, 'utf8')))
    if (parsed.success) return parsed.data
    console.warn('Existing articles.json failed validation; starting fresh.')
  } catch {
    // No previous data yet.
  }
  return null
}

async function writeIfChanged(file: string, content: string): Promise<boolean> {
  const current = await readFile(file, 'utf8').catch(() => null)
  if (current === content) return false
  await writeFile(file, content)
  return true
}

async function main() {
  const sources = parseSourcesConfig(JSON.parse(await readFile(sourcesPath, 'utf8')))
  const previous = await readPrevious()
  const run = await runIngestion({ sources, previous })

  // Validate the whole output before anything is written.
  ArticlesFileSchema.parse(run.file)

  await mkdir(dataDir, { recursive: true })
  const wroteArticles = await writeIfChanged(articlesPath, JSON.stringify(run.file, null, 1) + '\n')
  const publicSources = {
    schemaVersion: SCHEMA_VERSION,
    sources: sources.map(({ id, name, homepage, language, topics }) => ({ id, name, homepage, language, topics })),
  }
  const wroteSources = await writeIfChanged(publicSourcesPath, JSON.stringify(publicSources, null, 1) + '\n')

  await mkdir(path.dirname(contextPath), { recursive: true })
  await writeFile(contextPath, JSON.stringify(run.contexts))

  const summary = summaryMarkdown(run)
  console.log(summary)
  console.log(`articles.json ${wroteArticles ? 'updated' : 'unchanged'}; sources.json ${wroteSources ? 'updated' : 'unchanged'}`)
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)

  if (run.results.every((r) => !r.ok)) {
    console.error('Every source failed. Existing data was kept.')
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
