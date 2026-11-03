import { isPlaceholder, type GlossaryEntry } from './types.ts'

export interface GlossaryMatcher {
  regex: RegExp
  /** Lowercased phrase -> glossary entry ID. */
  ids: Map<string, string>
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** One case-insensitive, whole-word pattern for every term and its other forms, longest first. */
export function buildMatcher(entries: GlossaryEntry[] | undefined): GlossaryMatcher | null {
  const ids = new Map<string, string>()
  for (const g of entries ?? []) {
    if (isPlaceholder(g.definition)) continue
    for (const phrase of [g.term, ...g.aliases]) {
      const key = phrase?.trim().toLowerCase()
      if (key && !isPlaceholder(phrase) && !ids.has(key)) ids.set(key, g.id)
    }
  }
  if (ids.size === 0) return null
  // Longest first, so "committee of inspection" wins over "committee".
  const alternatives = [...ids.keys()].sort((a, b) => b.length - a.length).map(escape)
  return { regex: new RegExp(`\\b(${alternatives.join('|')})\\b`, 'gi'), ids }
}

export type TextPart = string | { text: string; id: string }

/** Splits text around glossary terms. Only the first mention of each term is marked, so a paragraph does not become a wall of links. */
export function splitTerms(text: string, matcher: GlossaryMatcher): TextPart[] {
  const parts: TextPart[] = []
  const used = new Set<string>()
  let last = 0
  for (const m of text.matchAll(matcher.regex)) {
    const id = matcher.ids.get(m[0].toLowerCase())
    if (!id || used.has(id)) continue
    used.add(id)
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push({ text: m[0], id })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}
