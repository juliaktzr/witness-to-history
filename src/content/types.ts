// Mirrors the JSON shape in CONTENT_SCHEMA.md. Keep the two in sync.

export interface ImageRef {
  src: string
  alt: string
}

export interface BriefingScreen {
  id: string
  heading: string
  text: string
  image?: ImageRef
  sources: string[]
}

export interface Figure {
  id: string
  name: string
  role: string
  isRealPerson: boolean
  portrait?: ImageRef
  startNode: string
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
