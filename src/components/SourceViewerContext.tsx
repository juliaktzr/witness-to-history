import { createContext, useContext } from 'react'

/** Lets any screen open the source panel without threading props through every component. */
export const SourceViewerContext = createContext<(sourceId: string) => void>(() => {})

export function useOpenSource() {
  return useContext(SourceViewerContext)
}
