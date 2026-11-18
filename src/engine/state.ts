import { END, type Scenario } from '../content/types'

export type Screen =
  | { kind: 'era-select' }
  | { kind: 'briefing'; index: number }
  | { kind: 'hub' }
  | { kind: 'dialogue'; figureId: string; nodeId: string }
  | { kind: 'decision' }
  | { kind: 'outcome'; outcomeId: string }
  | { kind: 'reveal'; outcomeId: string }
  | { kind: 'reflection'; outcomeId: string }

/** The chapters of one play session, in order. Shown as the tracker above each scenario screen. */
export const JOURNEY = ['briefing', 'people', 'decision', 'outcome', 'history', 'reflect'] as const
export type JourneyStep = (typeof JOURNEY)[number]

/** Which chapter a screen belongs to, as an index into JOURNEY (-1 for era select). */
export function stepIndex(screen: Screen): number {
  switch (screen.kind) {
    case 'era-select':
      return -1
    case 'briefing':
      return 0
    case 'hub':
    case 'dialogue':
      return 1
    case 'decision':
      return 2
    case 'outcome':
      return 3
    case 'reveal':
      return 4
    case 'reflection':
      return 5
  }
}

/**
 * One line of a conversation, kept so the journal can show what was said.
 * 'start' marks the beginning of a talk (a figure can be visited again);
 * 'figure' is a dialogue node the figure said; 'you' is the student's pick.
 */
export type TalkEntry =
  | { kind: 'start'; figureId: string }
  | { kind: 'figure'; figureId: string; nodeId: string }
  | { kind: 'you'; figureId: string; text: string }

export interface GameState {
  scenario: Scenario | null
  screen: Screen
  /** Figure IDs the student has finished talking to at least once. */
  visited: string[]
  /** ID of the map place the student's avatar is currently standing at, if the scenario has a map. */
  avatarPlace: string | null
  /** True for the one render right after the student's last visit completes the figure list, so the hub can celebrate it once. */
  justCompletedAll: boolean
  /** Every conversation this era, in order. Cleared when the era starts over. */
  talkLog: TalkEntry[]
  /** Furthest chapter reached (index into JOURNEY). Chapters up to here can be revisited from the tracker; later ones are locked. */
  furthest: number
  /** The student's most recent decision, so the tracker can go back to its outcome, history, and reflection. */
  outcomeId: string | null
}

export type Action =
  | { type: 'choose-scenario'; scenario: Scenario }
  | { type: 'briefing-next' }
  | { type: 'briefing-back' }
  | { type: 'open-figure'; figureId: string }
  | { type: 'move-avatar'; placeId: string }
  | { type: 'dialogue-choice'; next: string; text: string }
  | { type: 'leave-dialogue' }
  | { type: 'go-to-decision' }
  | { type: 'back-to-hub' }
  | { type: 'decide'; outcomeId: string }
  | { type: 'outcome-next' }
  | { type: 'reveal-next' }
  | { type: 'restart' }
  | { type: 'quit' }
  | { type: 'clear-celebration' }
  | { type: 'go-to-step'; step: JourneyStep }

export const initialState: GameState = {
  scenario: null,
  screen: { kind: 'era-select' },
  visited: [],
  avatarPlace: null,
  justCompletedAll: false,
  talkLog: [],
  furthest: -1,
  outcomeId: null,
}

function visitFigure(state: GameState, figureId: string): { visited: string[]; justCompletedAll: boolean } {
  const visited = markVisited(state.visited, figureId)
  const justCompletedAll =
    visited.length > state.visited.length && !!state.scenario && state.scenario.figures.every((f) => visited.includes(f.id))
  return { visited, justCompletedAll }
}

function markVisited(visited: string[], figureId: string): string[] {
  return visited.includes(figureId) ? visited : [...visited, figureId]
}

/** Runs each action, then records the furthest chapter reached so far. */
export function reducer(state: GameState, action: Action): GameState {
  const next = step(state, action)
  const reached = stepIndex(next.screen)
  return reached > next.furthest ? { ...next, furthest: reached } : next
}

/** Where a tracker chapter leads. Null when it cannot be opened (locked, or no decision made yet). */
function screenForStep(state: GameState, target: JourneyStep): Screen | null {
  if (JOURNEY.indexOf(target) > state.furthest) return null
  switch (target) {
    case 'briefing':
      return { kind: 'briefing', index: 0 }
    case 'people':
      return { kind: 'hub' }
    case 'decision':
      return { kind: 'decision' }
    case 'outcome':
      return state.outcomeId ? { kind: 'outcome', outcomeId: state.outcomeId } : null
    case 'history':
      return state.outcomeId ? { kind: 'reveal', outcomeId: state.outcomeId } : null
    case 'reflect':
      return state.outcomeId ? { kind: 'reflection', outcomeId: state.outcomeId } : null
  }
}

function step(state: GameState, action: Action): GameState {
  const { scenario, screen } = state
  switch (action.type) {
    case 'choose-scenario':
      return {
        scenario: action.scenario,
        screen: { kind: 'briefing', index: 0 },
        visited: [],
        avatarPlace: action.scenario.map?.here ?? null,
        justCompletedAll: false,
        talkLog: [],
        furthest: 0,
        outcomeId: null,
      }

    case 'briefing-next': {
      if (!scenario || screen.kind !== 'briefing') return state
      const next = screen.index + 1
      if (next >= scenario.briefing.length) return { ...state, screen: { kind: 'hub' } }
      return { ...state, screen: { kind: 'briefing', index: next } }
    }

    case 'briefing-back': {
      if (screen.kind !== 'briefing') return state
      if (screen.index === 0) return { ...initialState }
      return { ...state, screen: { kind: 'briefing', index: screen.index - 1 } }
    }

    case 'open-figure': {
      const figure = scenario?.figures.find((f) => f.id === action.figureId)
      if (!figure) return state
      return {
        ...state,
        screen: { kind: 'dialogue', figureId: figure.id, nodeId: figure.startNode },
        talkLog: [
          ...state.talkLog,
          { kind: 'start', figureId: figure.id },
          { kind: 'figure', figureId: figure.id, nodeId: figure.startNode },
        ],
      }
    }

    case 'move-avatar':
      return { ...state, avatarPlace: action.placeId }

    case 'dialogue-choice': {
      if (screen.kind !== 'dialogue') return state
      const said: TalkEntry = { kind: 'you', figureId: screen.figureId, text: action.text }
      if (action.next === END || !scenario?.dialogue[action.next]) {
        return { ...state, ...visitFigure(state, screen.figureId), screen: { kind: 'hub' }, talkLog: [...state.talkLog, said] }
      }
      return {
        ...state,
        screen: { ...screen, nodeId: action.next },
        talkLog: [...state.talkLog, said, { kind: 'figure', figureId: screen.figureId, nodeId: action.next }],
      }
    }

    case 'leave-dialogue': {
      if (screen.kind !== 'dialogue') return state
      return { ...state, ...visitFigure(state, screen.figureId), screen: { kind: 'hub' } }
    }

    case 'go-to-decision':
      return { ...state, screen: { kind: 'decision' } }

    case 'back-to-hub':
      return { ...state, screen: { kind: 'hub' } }

    case 'decide':
      return { ...state, screen: { kind: 'outcome', outcomeId: action.outcomeId }, outcomeId: action.outcomeId }

    case 'outcome-next':
      if (screen.kind !== 'outcome') return state
      return { ...state, screen: { kind: 'reveal', outcomeId: screen.outcomeId } }

    case 'reveal-next':
      if (screen.kind !== 'reveal') return state
      return { ...state, screen: { kind: 'reflection', outcomeId: screen.outcomeId } }

    case 'restart':
      if (!scenario) return initialState
      return {
        scenario,
        screen: { kind: 'briefing', index: 0 },
        visited: [],
        avatarPlace: scenario.map?.here ?? null,
        justCompletedAll: false,
        talkLog: [],
        furthest: 0,
        outcomeId: null,
      }

    case 'quit':
      return initialState

    case 'clear-celebration':
      return { ...state, justCompletedAll: false }

    case 'go-to-step': {
      const target = screenForStep(state, action.step)
      if (!target) return state
      // Leaving a conversation from the tracker counts the same as "End conversation".
      const left = screen.kind === 'dialogue' ? visitFigure(state, screen.figureId) : {}
      return { ...state, ...left, screen: target }
    }
  }
}
