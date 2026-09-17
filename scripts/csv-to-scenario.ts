#!/usr/bin/env node
/**
 * Converts a folder of CSV files (one per Google Sheet tab, see
 * CONTENT_SCHEMA.md) into one scenario JSON file, then runs the exact same
 * validation the game runs on load and prints every problem in plain English
 * with the tab, row, and column to fix.
 *
 * Usage:
 *   npm run convert -- <folder-of-csvs> [--out content/scenarios/<id>.json]
 *
 * Google Sheets: File > Download > Comma Separated Values (.csv) downloads the
 * CURRENT tab only. Do it once per tab and put all eight files in one folder.
 * File names like "Witness Content - Dialogue.csv" are fine: the script finds
 * each tab by the end of the file name.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import type {
  BriefingScreen,
  DialogueChoice,
  DialogueNode,
  Figure,
  Outcome,
  Scenario,
  Source,
  SourceType,
} from '../src/content/types.ts'
import { validateScenario, type ValidationIssue } from '../src/content/validate.ts'

// ---------------------------------------------------------------------------
// CSV parsing (RFC 4180: quoted cells, doubled quotes, newlines inside cells)
// ---------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  const src = text.replace(/^﻿/, '') // strip BOM that Sheets/Excel add
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

// ---------------------------------------------------------------------------
// Sheet model
// ---------------------------------------------------------------------------

type TabKey = 'scenario' | 'briefing' | 'figures' | 'dialogue' | 'decision' | 'outcomes' | 'reveal' | 'sources'

const TAB_NAMES: Record<TabKey, string> = {
  scenario: 'Scenario',
  briefing: 'Briefing',
  figures: 'Figures',
  dialogue: 'Dialogue',
  decision: 'Decision',
  outcomes: 'Outcomes',
  reveal: 'Reveal and Reflection',
  sources: 'Sources',
}

const REQUIRED_COLUMNS: Record<TabKey, string[]> = {
  scenario: ['id', 'title', 'era', 'year', 'location', 'summary'],
  briefing: ['id', 'order', 'heading', 'text'],
  figures: ['id', 'name', 'role', 'is_real_person', 'start_node'],
  dialogue: ['id', 'figure', 'text'],
  decision: ['prompt', 'context', 'option_1_text', 'option_1_outcome', 'option_2_text', 'option_2_outcome'],
  outcomes: ['id', 'title', 'text'],
  reveal: ['type', 'id', 'text'],
  sources: ['id', 'title', 'creator', 'date', 'type', 'url'],
}

interface Row {
  /** Row number as shown in the spreadsheet (header is row 1). */
  n: number
  cells: Record<string, string>
}

interface Tab {
  key: TabKey
  name: string
  file: string
  columns: string[]
  rows: Row[]
}

interface Problem {
  tab: string
  row?: number
  column?: string
  id?: string
  message: string
}

const errors: Problem[] = []
const warnings: Problem[] = []

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\.csv$/, '').replace(/[\s_-]+/g, ' ').trim()
}

function findTabFile(folder: string, files: string[], key: TabKey): string | null {
  const want = normalizeName(TAB_NAMES[key])
  const matches = files.filter((f) => {
    const n = normalizeName(basename(f))
    return n === want || n.endsWith(' ' + want) || n.endsWith('- ' + want)
  })
  if (matches.length > 1) {
    errors.push({ tab: TAB_NAMES[key], message: `More than one file looks like this tab: ${matches.join(', ')}. Keep one.` })
  }
  return matches[0] ? join(folder, matches[0]) : null
}

function loadTab(folder: string, files: string[], key: TabKey): Tab {
  const name = TAB_NAMES[key]
  const file = findTabFile(folder, files, key)
  const empty: Tab = { key, name, file: '', columns: REQUIRED_COLUMNS[key], rows: [] }
  if (!file) {
    errors.push({ tab: name, message: `No CSV file found for the "${name}" tab. Download that tab as CSV into the folder.` })
    return empty
  }
  const grid = parseCsv(readFileSync(file, 'utf8'))
  if (grid.length === 0) {
    errors.push({ tab: name, message: `The file ${basename(file)} is empty.` })
    return empty
  }
  const columns = grid[0].map(normalizeHeader)
  for (const col of REQUIRED_COLUMNS[key]) {
    if (!columns.includes(col)) {
      errors.push({ tab: name, row: 1, message: `Missing the "${col}" column in the header row. Check the spelling.` })
    }
  }
  const rows: Row[] = []
  grid.slice(1).forEach((cells, i) => {
    if (cells.every((c) => c.trim() === '')) return // skip blank lines
    const rec: Record<string, string> = {}
    columns.forEach((col, j) => {
      if (col) rec[col] = (cells[j] ?? '').trim()
    })
    rows.push({ n: i + 2, cells: rec })
  })
  return { key, name, file, columns, rows }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitIds(cell: string | undefined): string[] {
  return (cell ?? '')
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function imageOrUndefined(src: string | undefined, alt: string | undefined) {
  const s = src ?? ''
  const a = alt ?? ''
  if (s === '' && a === '') return undefined
  return { src: s, alt: a }
}

function yesNo(tab: Tab, row: Row, column: string): boolean {
  const v = (row.cells[column] ?? '').toLowerCase()
  if (['yes', 'y', 'true', '1'].includes(v)) return true
  if (['no', 'n', 'false', '0', ''].includes(v)) return false
  errors.push({ tab: tab.name, row: row.n, column, id: row.cells.id, message: `Write "yes" or "no" here, not "${row.cells[column]}".` })
  return false
}

/** Records where each ID lives so validator messages can point at a row. */
const rowIndex: Record<string, Map<string, number>> = {}
function indexIds(tab: Tab) {
  const map = new Map<string, number>()
  for (const row of tab.rows) {
    const id = row.cells.id
    if (!id) {
      errors.push({ tab: tab.name, row: row.n, column: 'id', message: 'This row has no ID. Every row needs a short unique ID.' })
      continue
    }
    if (/[^a-z0-9_]/.test(id)) {
      warnings.push({ tab: tab.name, row: row.n, column: 'id', id, message: `IDs should be lowercase letters, numbers and underscores. "${id}" may cause mismatches.` })
    }
    if (map.has(id)) {
      errors.push({ tab: tab.name, row: row.n, column: 'id', id, message: `The ID "${id}" is already used on row ${map.get(id)} of this tab. IDs must be unique.` })
    } else {
      map.set(id, row.n)
    }
  }
  rowIndex[tab.key] = map
}

// ---------------------------------------------------------------------------
// Build the scenario
// ---------------------------------------------------------------------------

function build(t: Record<TabKey, Tab>): Scenario {
  for (const key of ['briefing', 'figures', 'dialogue', 'outcomes', 'sources'] as const) indexIds(t[key])

  // Scenario (one row)
  if (t.scenario.rows.length === 0) {
    errors.push({ tab: 'Scenario', row: 2, message: 'The Scenario tab needs one filled-in row under the header.' })
  }
  if (t.scenario.rows.length > 1) {
    warnings.push({ tab: 'Scenario', row: t.scenario.rows[1].n, message: 'Only the first row is used. Extra rows are ignored.' })
  }
  const s: Row = t.scenario.rows[0] ?? { n: 2, cells: {} }
  rowIndex.scenario = new Map([['*', s.n]])
  const year = Number(s.cells.year)
  if (t.scenario.rows.length > 0 && !Number.isInteger(year)) {
    errors.push({ tab: 'Scenario', row: s.n, column: 'year', message: `The year must be a whole number, not "${s.cells.year}".` })
  }

  // Briefing, in "order" order
  const briefingRows = [...t.briefing.rows]
  for (const r of briefingRows) {
    if (r.cells.order !== undefined && r.cells.order !== '' && !Number.isFinite(Number(r.cells.order))) {
      errors.push({ tab: 'Briefing', row: r.n, column: 'order', id: r.cells.id, message: `"order" must be a number like 1, 2, 3, not "${r.cells.order}".` })
    }
  }
  briefingRows.sort((a, b) => Number(a.cells.order || a.n) - Number(b.cells.order || b.n))
  const briefing: BriefingScreen[] = briefingRows.map((r) => {
    const b: BriefingScreen = { id: r.cells.id, heading: r.cells.heading ?? '', text: r.cells.text ?? '', sources: splitIds(r.cells.sources) }
    const img = imageOrUndefined(r.cells.image, r.cells.image_alt)
    if (img) b.image = img
    return b
  })

  // Figures
  const figures: Figure[] = t.figures.rows.map((r) => {
    const f: Figure = {
      id: r.cells.id,
      name: r.cells.name ?? '',
      role: r.cells.role ?? '',
      isRealPerson: yesNo(t.figures, r, 'is_real_person'),
      startNode: r.cells.start_node ?? '',
    }
    const img = imageOrUndefined(r.cells.portrait, r.cells.portrait_alt)
    if (img) f.portrait = img
    return f
  })

  // Dialogue: any number of choice_N_text / choice_N_next column pairs
  const choiceNumbers = [...new Set(t.dialogue.columns.map((c) => c.match(/^choice_(\d+)_(text|next)$/)?.[1]).filter(Boolean))]
    .map(Number)
    .sort((a, b) => a - b)
  const dialogue: Record<string, DialogueNode> = {}
  for (const r of t.dialogue.rows) {
    if (!r.cells.id) continue
    const choices: DialogueChoice[] = []
    for (const n of choiceNumbers) {
      const text = r.cells[`choice_${n}_text`] ?? ''
      let next = r.cells[`choice_${n}_next`] ?? ''
      if (text === '' && next === '') continue
      if (next.toUpperCase() === 'END') next = 'END'
      choices.push({ text, next })
    }
    dialogue[r.cells.id] = { figure: r.cells.figure ?? '', text: r.cells.text ?? '', sources: splitIds(r.cells.sources), choices }
  }

  // Decision (one row)
  if (t.decision.rows.length === 0) {
    errors.push({ tab: 'Decision', row: 2, message: 'The Decision tab needs one filled-in row under the header.' })
  }
  const d = t.decision.rows[0]
  rowIndex.decision = new Map([['*', d?.n ?? 2]])
  const optionNumbers = [...new Set(t.decision.columns.map((c) => c.match(/^option_(\d+)_(text|outcome)$/)?.[1]).filter(Boolean))]
    .map(Number)
    .sort((a, b) => a - b)
  const options = d
    ? optionNumbers
        .map((n) => ({ text: d.cells[`option_${n}_text`] ?? '', outcome: d.cells[`option_${n}_outcome`] ?? '' }))
        .filter((o) => o.text !== '' || o.outcome !== '')
    : []

  // Outcomes
  const outcomes: Record<string, Outcome> = {}
  for (const r of t.outcomes.rows) {
    if (r.cells.id) outcomes[r.cells.id] = { title: r.cells.title ?? '', text: r.cells.text ?? '', sources: splitIds(r.cells.sources) }
  }

  // Reveal and Reflection
  const revealRows = t.reveal.rows.filter((r) => (r.cells.type ?? '').toLowerCase() === 'reveal')
  const reflectRows = t.reveal.rows.filter((r) => (r.cells.type ?? '').toLowerCase() === 'reflection')
  const other = t.reveal.rows.filter((r) => !['reveal', 'reflection'].includes((r.cells.type ?? '').toLowerCase()))
  for (const r of other) {
    errors.push({ tab: t.reveal.name, row: r.n, column: 'type', message: `"type" must be "reveal" or "reflection", not "${r.cells.type}".` })
  }
  if (revealRows.length === 0) errors.push({ tab: t.reveal.name, message: 'Add one row with type "reveal".' })
  if (revealRows.length > 1) warnings.push({ tab: t.reveal.name, row: revealRows[1].n, message: 'Only the first "reveal" row is used.' })
  const revealRow = revealRows[0]
  rowIndex.reveal = new Map([['*', revealRow?.n ?? 2]])
  rowIndex.reflection = new Map(reflectRows.map((r) => [r.cells.id, r.n]))
  const reflection = reflectRows.map((r) => ({ id: r.cells.id, prompt: r.cells.text ?? '' }))

  // Sources
  const sources: Record<string, Source> = {}
  const validTypes: SourceType[] = ['document', 'image', 'map', 'letter', 'newspaper', 'secondary']
  for (const r of t.sources.rows) {
    if (!r.cells.id) continue
    const type = (r.cells.type ?? '').toLowerCase() as SourceType
    if (!validTypes.includes(type)) {
      errors.push({ tab: 'Sources', row: r.n, column: 'type', id: r.cells.id, message: `"type" must be one of ${validTypes.join(', ')}, not "${r.cells.type}".` })
    }
    sources[r.cells.id] = { title: r.cells.title ?? '', creator: r.cells.creator ?? '', date: r.cells.date ?? '', type, url: r.cells.url ?? '', excerpt: r.cells.excerpt ?? '' }
  }

  const scenario: Scenario = {
    id: s.cells.id ?? '',
    title: s.cells.title ?? '',
    era: s.cells.era ?? '',
    year,
    location: s.cells.location ?? '',
    summary: s.cells.summary ?? '',
    briefing,
    figures,
    dialogue,
    decision: { prompt: d?.cells.prompt ?? '', context: d?.cells.context ?? '', options },
    outcomes,
    reveal: { text: revealRow?.cells.text ?? '', sources: splitIds(revealRow?.cells.sources) },
    reflection,
    sources,
  }
  const cover = imageOrUndefined(s.cells.cover_image, s.cells.cover_image_alt)
  if (cover) scenario.coverImage = cover
  return scenario
}

// ---------------------------------------------------------------------------
// Translate validator paths (e.g. "dialogue.merchant_intro.choice_1_next")
// into a tab, row and column a content author can find.
// ---------------------------------------------------------------------------

const COLUMN_NAMES: Record<string, string> = {
  'image.src': 'image',
  'image.alt': 'image_alt',
  'portrait.src': 'portrait',
  'portrait.alt': 'portrait_alt',
  'coverImage.src': 'cover_image',
  'coverImage.alt': 'cover_image_alt',
  coverImage: 'cover_image',
  isRealPerson: 'is_real_person',
  startNode: 'start_node',
  prompt: 'text',
}

function locate(issue: ValidationIssue): Problem {
  const { path, message } = issue
  const col = (field: string) => COLUMN_NAMES[field] ?? field
  let m: RegExpMatchArray | null

  if ((m = path.match(/^(id|title|era|year|location|summary)$/))) return { tab: 'Scenario', row: rowIndex.scenario?.get('*'), column: m[1], message }
  if (path.startsWith('coverImage')) return { tab: 'Scenario', row: rowIndex.scenario?.get('*'), column: col(path), message }
  if ((m = path.match(/^briefing\[(.+?)\]\.(.+)$/))) return { tab: 'Briefing', row: rowIndex.briefing?.get(m[1]), id: m[1], column: col(m[2]), message }
  if (path === 'briefing') return { tab: 'Briefing', message }
  if ((m = path.match(/^figures\[(.+?)\]\.(.+)$/))) return { tab: 'Figures', row: rowIndex.figures?.get(m[1]), id: m[1], column: col(m[2]), message }
  if (path === 'figures') return { tab: 'Figures', message }
  if ((m = path.match(/^dialogue\.(.+?)\.(.+)$/))) return { tab: 'Dialogue', row: rowIndex.dialogue?.get(m[1]), id: m[1], column: m[2] === 'choices' ? undefined : m[2], message }
  if ((m = path.match(/^dialogue\.(.+)$/))) return { tab: 'Dialogue', row: rowIndex.dialogue?.get(m[1]), id: m[1], message }
  if ((m = path.match(/^decision\.(.+)$/))) return { tab: 'Decision', row: rowIndex.decision?.get('*'), column: m[1] === 'options' ? undefined : m[1], message }
  if ((m = path.match(/^outcomes\.(.+?)\.(.+)$/))) return { tab: 'Outcomes', row: rowIndex.outcomes?.get(m[1]), id: m[1], column: m[2], message }
  if ((m = path.match(/^reveal\.(.+)$/))) return { tab: TAB_NAMES.reveal, row: rowIndex.reveal?.get('*'), column: m[1], message }
  if ((m = path.match(/^reflection\[(.+?)\]\.(.+)$/))) return { tab: TAB_NAMES.reveal, row: rowIndex.reflection?.get(m[1]), id: m[1], column: col(m[2]), message }
  if (path === 'reflection') return { tab: TAB_NAMES.reveal, message }
  if ((m = path.match(/^sources\.(.+?)\.(.+)$/))) return { tab: 'Sources', row: rowIndex.sources?.get(m[1]), id: m[1], column: m[2], message }
  return { tab: '(unknown)', message: `${path}: ${message}` }
}

function describe(p: Problem): string {
  const where = p.row ? `Row ${p.row} of ${p.tab}` : `${p.tab} tab`
  const id = p.id ? ` (${p.id})` : ''
  const column = p.column ? `, column "${p.column}"` : ''
  return `${where}${id}${column}: ${p.message}`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  const outFlag = args.indexOf('--out')
  const outArg = outFlag >= 0 ? args[outFlag + 1] : undefined
  const folder = args.find((a, i) => !a.startsWith('--') && i !== outFlag + 1)
  if (!folder) {
    console.log('Usage: npm run convert -- <folder-of-csvs> [--out content/scenarios/<id>.json]')
    process.exit(2)
  }
  const dir = resolve(folder)
  if (!existsSync(dir)) {
    console.log(`Folder not found: ${dir}`)
    process.exit(2)
  }
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv'))
  console.log(`Reading ${files.length} CSV file${files.length === 1 ? '' : 's'} from ${dir}\n`)

  const keys = Object.keys(TAB_NAMES) as TabKey[]
  const tabs = Object.fromEntries(keys.map((k) => [k, loadTab(dir, files, k)])) as Record<TabKey, Tab>
  const scenario = build(tabs)
  const result = validateScenario(scenario)
  errors.push(...result.errors.map(locate))
  warnings.push(...result.warnings.map(locate))

  const sortKey = (p: Problem) => `${keys.findIndex((k) => TAB_NAMES[k] === p.tab)}|${String(p.row ?? 0).padStart(5, '0')}`
  const dedupe = (list: Problem[]) => {
    const seen = new Set<string>()
    return list.filter((p) => {
      const k = describe(p)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }
  const uniqueErrors = dedupe(errors).sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
  const uniqueWarnings = dedupe(warnings).sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
  errors.splice(0, errors.length, ...uniqueErrors)
  warnings.splice(0, warnings.length, ...uniqueWarnings)

  if (errors.length) {
    console.log(`${errors.length} problem${errors.length === 1 ? '' : 's'} that must be fixed before the scenario can play:\n`)
    for (const e of errors) console.log('  ✖ ' + describe(e))
    console.log()
  }
  if (warnings.length) {
    console.log(`${warnings.length} unfinished item${warnings.length === 1 ? '' : 's'} (the scenario still plays, with visible placeholders):\n`)
    for (const w of warnings) console.log('  ⚠ ' + describe(w))
    console.log()
  }

  if (errors.length) {
    console.log('No JSON written. Fix the problems above and run again.')
    process.exit(1)
  }

  const out = resolve(outArg ?? join('content', 'scenarios', `${scenario.id}.json`))
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(scenario, null, 2) + '\n')
  console.log(`✔ Wrote ${out}`)
  console.log(`  ${scenario.briefing.length} briefing screens, ${scenario.figures.length} figures, ${Object.keys(scenario.dialogue).length} dialogue lines, ${scenario.decision.options.length} decision options, ${Object.keys(scenario.sources).length} sources.`)
  if (warnings.length === 0) console.log('  No unfinished items. Nice work.')
}

main()
