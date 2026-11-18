import { createContext, useContext } from 'react'
import type { JourneyStep } from '../engine/state'

interface Journey {
  /** Furthest chapter reached (index into JOURNEY). Later chapters show as locked. */
  furthest: number
  /** Opens a chapter; does nothing for locked ones. */
  goTo: (step: JourneyStep) => void
}

/** Lets the tracker in Frame jump between chapters without threading props through every screen. */
export const JourneyContext = createContext<Journey>({ furthest: -1, goTo: () => {} })

export function useJourney() {
  return useContext(JourneyContext)
}
