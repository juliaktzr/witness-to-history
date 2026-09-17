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

export interface GameState {
  scenario: Scenario | null
  screen: Screen
  /** Figure IDs the student has finished talking to at least once. */
  visited: string[]
}

export type Action =
  | { type: 'choose-scenario'; scenario: Scenario }
  | { type: 'briefing-next' }
  | { type: 'briefing-back' }
  | { type: 'open-figure'; figureId: string }
  | { type: 'dialogue-choice'; next: string }
  | { type: 'leave-dialogue' }
  | { type: 'go-to-decision' }
  | { type: 'back-to-hub' }
  | { type: 'decide'; outcomeId: string }
  | { type: 'outcome-next' }
  | { type: 'reveal-next' }
  | { type: 'restart' }
  | { type: 'quit' }

export const initialState: GameState = {
  scenario: null,
  screen: { kind: 'era-select' },
  visited: [],
}

function markVisited(visited: string[], figureId: string): string[] {
  return visited.includes(figureId) ? visited : [...visited, figureId]
}

export function reducer(state: GameState, action: Action): GameState {
  const { scenario, screen } = state
  switch (action.type) {
    case 'choose-scenario':
      return { scenario: action.scenario, screen: { kind: 'briefing', index: 0 }, visited: [] }

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
      return { ...state, screen: { kind: 'dialogue', figureId: figure.id, nodeId: figure.startNode } }
    }

    case 'dialogue-choice': {
      if (screen.kind !== 'dialogue') return state
      if (action.next === END || !scenario?.dialogue[action.next]) {
        return { ...state, visited: markVisited(state.visited, screen.figureId), screen: { kind: 'hub' } }
      }
      return { ...state, screen: { ...screen, nodeId: action.next } }
    }

    case 'leave-dialogue': {
      if (screen.kind !== 'dialogue') return state
      return { ...state, visited: markVisited(state.visited, screen.figureId), screen: { kind: 'hub' } }
    }

    case 'go-to-decision':
      return { ...state, screen: { kind: 'decision' } }

    case 'back-to-hub':
      return { ...state, screen: { kind: 'hub' } }

    case 'decide':
      return { ...state, screen: { kind: 'outcome', outcomeId: action.outcomeId } }

    case 'outcome-next':
      if (screen.kind !== 'outcome') return state
      return { ...state, screen: { kind: 'reveal', outcomeId: screen.outcomeId } }

    case 'reveal-next':
      if (screen.kind !== 'reveal') return state
      return { ...state, screen: { kind: 'reflection', outcomeId: screen.outcomeId } }

    case 'restart':
      if (!scenario) return initialState
      return { scenario, screen: { kind: 'briefing', index: 0 }, visited: [] }

    case 'quit':
      return initialState
  }
}
