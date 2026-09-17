// Mirrors the JSON shape in CONTENT_SCHEMA.md. Keep the two in sync.

export interface ImageRef {
  src: string
  alt: string
}

/** A "you are here" pin drawn over a briefing image. x and y are percent of the image. */
export interface ImageMarker {
  x: number
  y: number
  label: string
}

export interface BriefingScreen {
  id: string
  heading: string
  text: string
  image?: ImageRef
  marker?: ImageMarker
  sources: string[]
}

export interface Figure {
  id: string
  name: string
  role: string
  isRealPerson: boolean
  portrait?: ImageRef
  startNode: string
  /** ID of the place on the town map where this figure stands. */
  place?: string
}

export interface DialogueChoice {
  text: string
  next: string // dialogue node ID or "END"
}

export interface DialogueNode {
  figure: string
  text: string
  sources: string[]
  choices: DialogueChoice[]
}

export interface DecisionOption {
  text: string
  outcome: string
}

export interface Decision {
  prompt: string
  context: string
  options: DecisionOption[]
}

export interface Outcome {
  title: string
  text: string
  sources: string[]
}

export interface Reveal {
  text: string
  sources: string[]
}

export interface ReflectionPrompt {
  id: string
  prompt: string
}

export type SourceType =
  | 'document'
  | 'image'
  | 'map'
  | 'letter'
  | 'newspaper'
  | 'secondary'

export interface Source {
  title: string
  creator: string
  date: string
  type: SourceType
  url: string
  excerpt?: string
}

export type PlaceKind =
  | 'meeting_house'
  | 'shop'
  | 'farm'
  | 'house'
  | 'church'
  | 'tavern'
  | 'dock'
  | 'field'
  | 'signpost'
  | 'other'

/** One building or spot on the illustrated town map. x and y are percent of the map. */
export interface MapPlace {
  id: string
  label: string
  kind: PlaceKind
  x: number
  y: number
}

export interface ScenarioMap {
  places: MapPlace[]
  /** Place ID where the student is standing. */
  here?: string
}

export interface Scenario {
  id: string
  title: string
  era: string
  year: number
  location: string
  summary: string
  coverImage?: ImageRef
  briefing: BriefingScreen[]
  figures: Figure[]
  dialogue: Record<string, DialogueNode>
  /** Optional. When present the figure hub is drawn as a town map. */
  map?: ScenarioMap
  decision: Decision
  outcomes: Record<string, Outcome>
  reveal: Reveal
  reflection: ReflectionPrompt[]
  sources: Record<string, Source>
}

export const END = 'END'

/** True when a content field is an unfinished placeholder. */
export function isPlaceholder(value: string | undefined | null): boolean {
  if (value == null) return true
  const trimmed = value.trim()
  return trimmed === '' || trimmed.toUpperCase().startsWith('TODO')
}
