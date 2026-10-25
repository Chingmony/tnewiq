import { XMLParser, XMLValidator } from 'fast-xml-parser'

/** A feed item before normalization. Every field is raw and untrusted. */
export interface RawItem {
  title: string | null
  link: string | null
  guid: string | null
  published: string | null
  updated: string | null
  description: string | null
  imageUrl: string | null
}

export class FeedParseError extends Error {}

const ARRAY_TAGS = new Set(['item', 'entry', 'link', 'enclosure', 'media:content', 'media:thumbnail'])

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: true,
  htmlEntities: false,
  trimValues: true,
  isArray: (name) => ARRAY_TAGS.has(name),
})

type Node = Record<string, unknown>

function text(value: unknown): string | null {
  if (value == null) return null
  if (Array.isArray(value)) return text(value[0])
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') return text((value as Node)['#text'])
  return null
}

function attr(value: unknown, name: string): string | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) return text((value as Node)[`@_${name}`])
  return null
}

function asArray(value: unknown): unknown[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function firstImage(item: Node): string | null {
  for (const enc of asArray(item.enclosure)) {
    if (attr(enc, 'type')?.startsWith('image/')) return attr(enc, 'url')
  }
  for (const media of asArray(item['media:content'])) {
    if (attr(media, 'medium') === 'image' || attr(media, 'type')?.startsWith('image/')) return attr(media, 'url')
  }
  for (const thumb of asArray(item['media:thumbnail'])) {
    const url = attr(thumb, 'url')
    if (url) return url
  }
  return null
}

function rssItem(item: Node): RawItem {
  return {
    title: text(item.title),
    link: text(item.link),
    guid: text(item.guid),
    published: text(item.pubDate) ?? text(item['dc:date']),
    updated: null,
    description: text(item.description) ?? text(item['content:encoded']),
    imageUrl: firstImage(item),
  }
}

function atomLink(entry: Node): string | null {
  const links = asArray(entry.link)
  const html = links.find((l) => {
    const rel = attr(l, 'rel')
    return (rel == null || rel === 'alternate') && (attr(l, 'type') ?? 'text/html') === 'text/html'
  })
  return attr(html ?? links[0], 'href')
}

function atomItem(entry: Node): RawItem {
  return {
    title: text(entry.title),
    link: atomLink(entry),
    guid: text(entry.id),
    published: text(entry.published) ?? text(entry.issued),
    updated: text(entry.updated),
    description: text(entry.summary) ?? text(entry.content),
    imageUrl: firstImage(entry),
  }
}

export function parseFeed(xml: string): RawItem[] {
  // Feeds have no legitimate need for custom entities; refusing them blocks entity-expansion attacks.
  if (/<!ENTITY/i.test(xml)) throw new FeedParseError('Feed declares XML entities; refusing to parse')

  // The parser is lenient with truncated documents, so validate first.
  const valid = XMLValidator.validate(xml)
  if (valid !== true) throw new FeedParseError(`Invalid XML: ${valid.err.msg} (line ${valid.err.line})`)

  let doc: Node
  try {
    doc = parser.parse(xml) as Node
  } catch (err) {
    throw new FeedParseError(`Invalid XML: ${(err as Error).message}`)
  }

  const rss = doc.rss as Node | undefined
  if (rss) {
    const channel = (Array.isArray(rss.channel) ? rss.channel[0] : rss.channel) as Node | undefined
    return asArray(channel?.item).map((i) => rssItem(i as Node))
  }
  const rdf = doc['rdf:RDF'] as Node | undefined
  if (rdf) return asArray(rdf.item).map((i) => rssItem(i as Node))

  const feed = doc.feed as Node | undefined
  if (feed) return asArray(feed.entry).map((e) => atomItem(e as Node))

  throw new FeedParseError('Document is not RSS, RDF or Atom')
}
