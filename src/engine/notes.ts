/**
 * The student's journal notes: one text per figure, per scenario. Kept in
 * this browser only (no server), like the character. "Start over" clears
 * them so the next student on a shared Chromebook starts fresh.
 */
export type Notes = Record<string, string>

/** Page ID for the era-wide notes page (not tied to one person). */
export const GENERAL_NOTES = '__era'

const PREFIX = 'wth.notes.'

export function loadNotes(scenarioId: string): Notes {
  try {
    const raw = localStorage.getItem(PREFIX + scenarioId)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    if (!parsed || typeof parsed !== 'object') return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => typeof v === 'string')) as Notes
  } catch {
    return {}
  }
}

export function saveNotes(scenarioId: string, notes: Notes) {
  try {
    localStorage.setItem(PREFIX + scenarioId, JSON.stringify(notes))
  } catch {
    /* private mode or blocked storage: notes still work until the page closes */
  }
}

export function clearAllNotes() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(PREFIX)) localStorage.removeItem(key)
  } catch {
    /* nothing saved, nothing to clear */
  }
}
