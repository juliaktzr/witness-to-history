import { createContext, useContext } from 'react'
import type { GlossaryMatcher } from '../content/glossary'

interface Glossary {
  /** Null when the era has no glossary, so text renders as plain words. */
  matcher: GlossaryMatcher | null
  openTerm: (termId: string) => void
}

/** Lets any story text underline glossary terms without threading props through every screen. */
export const GlossaryContext = createContext<Glossary>({ matcher: null, openTerm: () => {} })

export function useGlossary() {
  return useContext(GlossaryContext)
}
