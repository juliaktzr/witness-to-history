// The student's own little character on the map. Purely cosmetic and purely
// local: it never touches the story, is never sent anywhere, and there is no
// account behind it. If storage is unavailable we fall back to the default.

export type HatStyle = 'none' | 'tricorn' | 'cap' | 'bonnet' | 'straw'
export type HairStyle = 'short' | 'long' | 'tied' | 'curly'

export interface AvatarPrefs {
  skin: string
  coat: string
  hair: HairStyle
  hairColor: string
  hat: HatStyle
}

const KEY = 'wth_avatar_prefs_v2'
const OLD_KEY = 'wth_avatar_prefs_v1'

export const SKIN_TONES = ['#f6dfc8', '#e8c39e', '#d2a276', '#b07b52', '#835231', '#4e3120']
export const COAT_COLORS = ['#6e2410', '#2b5c3a', '#1f4e79', '#7a4a1f', '#5c3566', '#8a1f3d', '#3d3d3d', '#a8843a']
export const HAIR_COLORS = ['#1d1a14', '#4a2f1a', '#8a5a2b', '#c9a15a', '#b5b5b5', '#7a2e0e']

export const HAT_OPTIONS: { id: HatStyle; label: string }[] = [
  { id: 'none', label: 'No hat' },
  { id: 'tricorn', label: 'Tricorn' },
  { id: 'cap', label: 'Cap' },
  { id: 'bonnet', label: 'Bonnet' },
  { id: 'straw', label: 'Straw hat' },
]

export const HAIR_OPTIONS: { id: HairStyle; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
  { id: 'tied', label: 'Tied back' },
  { id: 'curly', label: 'Curly' },
]

export const DEFAULT_PREFS: AvatarPrefs = {
  skin: SKIN_TONES[1],
  coat: COAT_COLORS[0],
  hair: 'short',
  hairColor: HAIR_COLORS[1],
  hat: 'tricorn',
}

function isHat(v: unknown): v is HatStyle {
  return HAT_OPTIONS.some((h) => h.id === v)
}
function isHair(v: unknown): v is HairStyle {
  return HAIR_OPTIONS.some((h) => h.id === v)
}

export function loadAvatarPrefs(): AvatarPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      return {
        skin: typeof p?.skin === 'string' ? p.skin : DEFAULT_PREFS.skin,
        coat: typeof p?.coat === 'string' ? p.coat : DEFAULT_PREFS.coat,
        hair: isHair(p?.hair) ? p.hair : DEFAULT_PREFS.hair,
        hairColor: typeof p?.hairColor === 'string' ? p.hairColor : DEFAULT_PREFS.hairColor,
        hat: isHat(p?.hat) ? p.hat : DEFAULT_PREFS.hat,
      }
    }
    // Migrate the first version (color + hat on/off).
    const old = localStorage.getItem(OLD_KEY)
    if (old) {
      const p = JSON.parse(old)
      return {
        ...DEFAULT_PREFS,
        coat: typeof p?.color === 'string' ? p.color : DEFAULT_PREFS.coat,
        hat: p?.hat === true ? 'tricorn' : 'none',
      }
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_PREFS
}

export function saveAvatarPrefs(prefs: AvatarPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // Storage disabled or full. Not saving just means it resets next visit.
  }
}
