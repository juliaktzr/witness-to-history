// The student's own little character on the map. Purely cosmetic and purely
// local: it never touches the story, is never sent anywhere, and there is no
// account behind it. If storage is unavailable we fall back to the default.

export type HatStyle = 'none' | 'tricorn' | 'cap' | 'bonnet' | 'mobcap' | 'straw'
export type HairStyle = 'short' | 'long' | 'tied' | 'curly' | 'braid' | 'bun' | 'rolled'
export type OutfitStyle = 'coat' | 'gown' | 'waistcoat' | 'cloak'
export type Expression = 'smile' | 'grin' | 'calm' | 'wonder' | 'determined'
export type Accessory = 'none' | 'spectacles' | 'neckerchief' | 'fichu' | 'satchel'
/** Sticker poses. Never saved; only used for previews. */
export type Pose = 'stand' | 'wave' | 'cheer' | 'think'

export interface AvatarPrefs {
  skin: string
  coat: string
  hair: HairStyle
  hairColor: string
  hat: HatStyle
  outfit: OutfitStyle
  expression: Expression
  accessory: Accessory
  freckles: boolean
}

const KEY = 'wth_avatar_prefs_v2'
const OLD_KEY = 'wth_avatar_prefs_v1'

export const SKIN_TONES = ['#f6dfc8', '#e8c39e', '#d2a276', '#b07b52', '#835231', '#4e3120']
export const COAT_COLORS = ['#6e2410', '#2b5c3a', '#1f4e79', '#7a4a1f', '#5c3566', '#8a1f3d', '#3d3d3d', '#a8843a']
export const HAIR_COLORS = ['#1d1a14', '#4a2f1a', '#8a5a2b', '#c9a15a', '#b5b5b5', '#7a2e0e', '#ece6d8']

export const HAT_OPTIONS: { id: HatStyle; label: string }[] = [
  { id: 'none', label: 'No hat' },
  { id: 'tricorn', label: 'Tricorn' },
  { id: 'cap', label: 'Cap' },
  { id: 'bonnet', label: 'Bonnet' },
  { id: 'mobcap', label: 'Mob cap' },
  { id: 'straw', label: 'Straw hat' },
]

export const HAIR_OPTIONS: { id: HairStyle; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
  { id: 'tied', label: 'Tied back' },
  { id: 'curly', label: 'Curly' },
  { id: 'braid', label: 'Braid' },
  { id: 'bun', label: 'Bun' },
  { id: 'rolled', label: 'Rolled curls' },
]

export const OUTFIT_OPTIONS: { id: OutfitStyle; label: string }[] = [
  { id: 'coat', label: 'Frock coat' },
  { id: 'gown', label: 'Gown and apron' },
  { id: 'waistcoat', label: 'Waistcoat' },
  { id: 'cloak', label: 'Cloak' },
]

export const EXPRESSION_OPTIONS: { id: Expression; label: string }[] = [
  { id: 'smile', label: 'Smile' },
  { id: 'grin', label: 'Grin' },
  { id: 'calm', label: 'Calm' },
  { id: 'wonder', label: 'Curious' },
  { id: 'determined', label: 'Determined' },
]

export const ACCESSORY_OPTIONS: { id: Accessory; label: string }[] = [
  { id: 'none', label: 'Nothing' },
  { id: 'spectacles', label: 'Spectacles' },
  { id: 'neckerchief', label: 'Neckerchief' },
  { id: 'fichu', label: 'Fichu shawl' },
  { id: 'satchel', label: 'Satchel' },
]

export const DEFAULT_PREFS: AvatarPrefs = {
  skin: SKIN_TONES[1],
  coat: COAT_COLORS[0],
  hair: 'short',
  hairColor: HAIR_COLORS[1],
  hat: 'tricorn',
  outfit: 'coat',
  expression: 'smile',
  accessory: 'none',
  freckles: false,
}

function oneOf<T extends string>(options: { id: T }[], v: unknown, fallback: T): T {
  return options.some((o) => o.id === v) ? (v as T) : fallback
}

export function loadAvatarPrefs(): AvatarPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      return {
        skin: typeof p?.skin === 'string' ? p.skin : DEFAULT_PREFS.skin,
        coat: typeof p?.coat === 'string' ? p.coat : DEFAULT_PREFS.coat,
        hair: oneOf(HAIR_OPTIONS, p?.hair, DEFAULT_PREFS.hair),
        hairColor: typeof p?.hairColor === 'string' ? p.hairColor : DEFAULT_PREFS.hairColor,
        hat: oneOf(HAT_OPTIONS, p?.hat, DEFAULT_PREFS.hat),
        // Fields added later: old saves simply get the defaults.
        outfit: oneOf(OUTFIT_OPTIONS, p?.outfit, DEFAULT_PREFS.outfit),
        expression: oneOf(EXPRESSION_OPTIONS, p?.expression, DEFAULT_PREFS.expression),
        accessory: oneOf(ACCESSORY_OPTIONS, p?.accessory, DEFAULT_PREFS.accessory),
        freckles: p?.freckles === true,
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

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

/** A random look for the shuffle button. */
export function randomPrefs(): AvatarPrefs {
  return {
    skin: pick(SKIN_TONES),
    coat: pick(COAT_COLORS),
    hair: pick(HAIR_OPTIONS).id,
    hairColor: pick(HAIR_COLORS),
    hat: pick(HAT_OPTIONS).id,
    outfit: pick(OUTFIT_OPTIONS).id,
    expression: pick(EXPRESSION_OPTIONS).id,
    accessory: pick(ACCESSORY_OPTIONS).id,
    freckles: Math.random() < 0.3,
  }
}
