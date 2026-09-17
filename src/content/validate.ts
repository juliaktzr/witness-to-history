import { END, isPlaceholder, type Scenario } from './types.ts'

export interface ValidationIssue {
  /** Where in the file the problem is, e.g. "dialogue.merchant_risk.text" */
  path: string
  message: string
}

export interface ValidationResult {
  /** Problems that make the scenario unplayable. */
  errors: ValidationIssue[]
  /** Unfinished content. The scenario still runs with visible placeholders. */
  warnings: ValidationIssue[]
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Checks a parsed JSON value against CONTENT_SCHEMA.md.
 * Written for content authors: messages say which sheet cell to fix.
 */
export function validateScenario(raw: unknown): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const err = (path: string, message: string) => errors.push({ path, message })
  const warn = (path: string, message: string) => warnings.push({ path, message })

  if (!isObject(raw)) {
    err('(file)', 'The scenario file is not a JSON object.')
    return { errors, warnings }
  }

  // --- Structural checks: these must pass before we can look deeper.
  const requiredStrings = ['id', 'title', 'era', 'location', 'summary'] as const
  for (const key of requiredStrings) {
    if (typeof raw[key] !== 'string') err(key, `Scenario "${key}" must be text.`)
  }
  if (typeof raw.year !== 'number') err('year', 'Scenario "year" must be a number.')
  if (!Array.isArray(raw.briefing)) err('briefing', 'Briefing must be a list of screens.')
  if (!Array.isArray(raw.figures)) err('figures', 'Figures must be a list.')
  if (!isObject(raw.dialogue)) err('dialogue', 'Dialogue must be a table keyed by dialogue ID.')
  if (!isObject(raw.decision)) err('decision', 'Decision is missing.')
  if (!isObject(raw.outcomes)) err('outcomes', 'Outcomes must be a table keyed by outcome ID.')
  if (!isObject(raw.reveal)) err('reveal', 'Reveal is missing.')
  if (!Array.isArray(raw.reflection)) err('reflection', 'Reflection must be a list of prompts.')
  if (!isObject(raw.sources)) err('sources', 'Sources must be a table keyed by source ID.')
  if (errors.length > 0) return { errors, warnings }

  const s = raw as unknown as Scenario
  const dialogueIds = new Set(Object.keys(s.dialogue))
  const outcomeIds = new Set(Object.keys(s.outcomes))
  const sourceIds = new Set(Object.keys(s.sources))
  const figureIds = new Set(s.figures.map((f) => f.id))

  const checkText = (path: string, value: unknown) => {
    if (typeof value !== 'string') {
      err(path, 'This cell must be text.')
    } else if (isPlaceholder(value)) {
      warn(path, 'Unfinished (empty or TODO).')
    }
  }
  const checkSources = (path: string, list: unknown) => {
    if (!Array.isArray(list)) {
      err(path, 'Sources must be a list of source IDs.')
      return
    }
    for (const id of list) {
      if (!sourceIds.has(String(id))) err(path, `Source "${id}" is not in the Sources tab.`)
    }
  }
  const checkImage = (path: string, img: unknown, required: boolean) => {
    if (img == null) {
      if (required) err(path, 'Image is missing.')
      return
    }
    if (!isObject(img)) {
      err(path, 'Image must have "src" and "alt".')
      return
    }
    if (isPlaceholder(img.src as string)) warn(`${path}.src`, 'Image link is unfinished.')
    if (isPlaceholder(img.alt as string)) warn(`${path}.alt`, 'Image needs alt text.')
  }

  // --- Scenario row
  for (const key of requiredStrings) checkText(key, s[key])
  checkImage('coverImage', s.coverImage, false)

  const checkPercent = (path: string, v: unknown) => {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100) err(path, 'Must be a number from 0 to 100 (percent across the picture).')
  }

  // --- Briefing
  if (s.briefing.length === 0) err('briefing', 'Add at least one briefing screen.')
  s.briefing.forEach((b, i) => {
    const p = `briefing[${b?.id ?? i}]`
    checkText(`${p}.heading`, b.heading)
    checkText(`${p}.text`, b.text)
    checkImage(`${p}.image`, b.image, false)
    checkSources(`${p}.sources`, b.sources)
    if (b.marker != null) {
      if (!isObject(b.marker)) {
        err(`${p}.marker`, 'Marker must have x, y and a label.')
      } else {
        if (!b.image) err(`${p}.marker`, 'A marker needs an image to sit on.')
        checkPercent(`${p}.marker.x`, b.marker.x)
        checkPercent(`${p}.marker.y`, b.marker.y)
        checkText(`${p}.marker.label`, b.marker.label)
      }
    }
  })

  // --- Map (optional)
  const placeIds = new Set<string>()
  if (s.map != null) {
    if (!isObject(s.map) || !Array.isArray(s.map.places)) {
      err('map', 'Map must have a list of places.')
    } else {
      const kinds = ['meeting_house', 'shop', 'farm', 'house', 'church', 'tavern', 'dock', 'field', 'other']
      s.map.places.forEach((pl, i) => {
        const p = `places[${pl?.id ?? i}]`
        if (typeof pl.id !== 'string' || pl.id === '') err(`${p}.id`, 'Place needs an ID.')
        else if (placeIds.has(pl.id)) err(`${p}.id`, `Place ID "${pl.id}" is used twice.`)
        else placeIds.add(pl.id)
        checkText(`${p}.label`, pl.label)
        if (!kinds.includes(pl.kind)) err(`${p}.kind`, `"${pl.kind}" is not a place kind. Use one of: ${kinds.join(', ')}.`)
        checkPercent(`${p}.x`, pl.x)
        checkPercent(`${p}.y`, pl.y)
      })
      if (s.map.places.length === 0) warn('map', 'The map has no places yet, so the hub shows the plain list.')
      if (s.map.here != null && !placeIds.has(s.map.here)) err('map.here', `"${s.map.here}" is not a place ID.`)
    }
  }

  // --- Figures
  if (s.figures.length === 0) err('figures', 'Add at least one figure.')
  s.figures.forEach((f, i) => {
    const p = `figures[${f?.id ?? i}]`
    if (typeof f.id !== 'string' || f.id === '') err(`${p}.id`, 'Figure needs an ID.')
    checkText(`${p}.name`, f.name)
    checkText(`${p}.role`, f.role)
    if (typeof f.isRealPerson !== 'boolean') err(`${p}.isRealPerson`, 'Use yes or no.')
    checkImage(`${p}.portrait`, f.portrait, false)
    if (!dialogueIds.has(f.startNode)) {
      err(`${p}.startNode`, `Start node "${f.startNode}" is not in the Dialogue tab.`)
    }
    if (f.place != null && f.place !== '') {
      if (!s.map) err(`${p}.place`, 'This figure has a place, but the scenario has no Places tab.')
      else if (!placeIds.has(f.place)) err(`${p}.place`, `Place "${f.place}" is not in the Places tab.`)
    }
  })

  // --- Dialogue
  for (const [id, node] of Object.entries(s.dialogue)) {
    const p = `dialogue.${id}`
    if (!figureIds.has(node.figure)) err(`${p}.figure`, `Figure "${node.figure}" does not exist.`)
    checkText(`${p}.text`, node.text)
    checkSources(`${p}.sources`, node.sources)
    if (!Array.isArray(node.choices)) {
      err(`${p}.choices`, 'Choices must be a list.')
      continue
    }
    node.choices.forEach((c, i) => {
      checkText(`${p}.choice_${i + 1}_text`, c.text)
      if (c.next !== END && !dialogueIds.has(c.next)) {
        err(`${p}.choice_${i + 1}_next`, `"${c.next}" is not a dialogue ID or END.`)
      }
    })
  }

  // Reachability: every dialogue node must be reachable from some startNode.
  const reachable = new Set<string>()
  const stack = s.figures.map((f) => f.startNode).filter((id) => dialogueIds.has(id))
  while (stack.length > 0) {
    const id = stack.pop()!
    if (reachable.has(id)) continue
    reachable.add(id)
    for (const c of s.dialogue[id].choices ?? []) {
      if (c.next !== END && dialogueIds.has(c.next)) stack.push(c.next)
    }
  }
  for (const id of dialogueIds) {
    if (!reachable.has(id)) warn(`dialogue.${id}`, 'No choice leads here, so students never see it.')
  }

  // --- Decision
  checkText('decision.prompt', s.decision.prompt)
  checkText('decision.context', s.decision.context)
  if (!Array.isArray(s.decision.options) || s.decision.options.length < 2) {
    err('decision.options', 'The decision needs at least two options.')
  } else {
    s.decision.options.forEach((o, i) => {
      checkText(`decision.option_${i + 1}_text`, o.text)
      if (!outcomeIds.has(o.outcome)) {
        err(`decision.option_${i + 1}_outcome`, `Outcome "${o.outcome}" is not in the Outcomes tab.`)
      }
    })
  }

  // --- Outcomes
  for (const [id, o] of Object.entries(s.outcomes)) {
    checkText(`outcomes.${id}.title`, o.title)
    checkText(`outcomes.${id}.text`, o.text)
    checkSources(`outcomes.${id}.sources`, o.sources)
  }

  // --- Reveal and reflection
  checkText('reveal.text', s.reveal.text)
  checkSources('reveal.sources', s.reveal.sources)
  if (s.reflection.length === 0) warn('reflection', 'No reflection prompts yet.')
  s.reflection.forEach((r, i) => checkText(`reflection[${r?.id ?? i}].prompt`, r.prompt))

  // --- Sources
  for (const [id, src] of Object.entries(s.sources)) {
    checkText(`sources.${id}.title`, src.title)
    if (isPlaceholder(src.url)) warn(`sources.${id}.url`, 'Archive link is unfinished.')
  }

  return { errors, warnings }
}
