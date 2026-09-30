// The student's "player card": a nickname plus what they have done so far.
// Like avatarPrefs, it is purely local: no account, no server, nothing sent
// anywhere. If storage is unavailable the game still works; it just forgets.

export interface PlayerProfile {
  name: string
  /** Scenario IDs the student has played through to the reflection. */
  erasCompleted: string[]
  /** "<scenarioId>:<figureId>" for every figure the student has talked to. */
  figuresMet: string[]
}

const KEY = 'wth_profile_v1'
export const NAME_MAX = 20

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

export function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (typeof p?.name !== 'string' || !p.name.trim()) return null
    return { name: p.name.slice(0, NAME_MAX), erasCompleted: strings(p.erasCompleted), figuresMet: strings(p.figuresMet) }
  } catch {
    return null
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // Storage disabled or full. Not saving just means a fresh start next visit.
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}

export function newProfile(name: string): PlayerProfile {
  return { name: name.trim().slice(0, NAME_MAX), erasCompleted: [], figuresMet: [] }
}

function addUnique(list: string[], items: string[]): string[] {
  const fresh = items.filter((i) => !list.includes(i))
  return fresh.length ? [...list, ...fresh] : list
}

export function withFiguresMet(p: PlayerProfile, scenarioId: string, figureIds: string[]): PlayerProfile {
  const figuresMet = addUnique(p.figuresMet, figureIds.map((f) => `${scenarioId}:${f}`))
  return figuresMet === p.figuresMet ? p : { ...p, figuresMet }
}

export function withEraCompleted(p: PlayerProfile, scenarioId: string): PlayerProfile {
  const erasCompleted = addUnique(p.erasCompleted, [scenarioId])
  return erasCompleted === p.erasCompleted ? p : { ...p, erasCompleted }
}

// ---------- Game-feel numbers. Cosmetic only; they never change the story. ----------

const XP_PER_FIGURE = 25
const XP_PER_ERA = 100
const XP_PER_LEVEL = 100

const RANKS = ['Apprentice Witness', 'Town Crier', 'Chronicler', 'Keeper of Records', 'Master Historian']

export interface Standing {
  xp: number
  level: number
  rank: string
  /** 0 to 1: how far into the current level. */
  progress: number
  xpToNext: number
}

export function standing(p: PlayerProfile): Standing {
  const xp = p.figuresMet.length * XP_PER_FIGURE + p.erasCompleted.length * XP_PER_ERA
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const into = xp % XP_PER_LEVEL
  return {
    xp,
    level,
    rank: RANKS[Math.min(level - 1, RANKS.length - 1)],
    progress: into / XP_PER_LEVEL,
    xpToNext: XP_PER_LEVEL - into,
  }
}
