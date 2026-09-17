import { useEffect, useMemo, useReducer, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { SourcePanel } from './components/SourcePanel'
import { SourceViewerContext } from './components/SourceViewerContext'
import { WarningBanner } from './components/WarningBanner'
import { loadScenarios } from './content/loadScenarios'
import { initialState, reducer } from './engine/state'
import { collectScreenText } from './speech/collectScreenText'
import { useReadAloud } from './speech/useReadAloud'
import { Briefing } from './screens/Briefing'
import { Decision } from './screens/Decision'
import { Dialogue } from './screens/Dialogue'
import { EraSelect } from './screens/EraSelect'
import { FigureHub } from './screens/FigureHub'
import { Outcome } from './screens/Outcome'
import { Reflection } from './screens/Reflection'
import { Reveal } from './screens/Reveal'

export default function App() {
  const scenarios = useMemo(loadScenarios, [])
  const [state, dispatch] = useReducer(reducer, initialState)
  const { scenario, screen } = state
  const readAloud = useReadAloud()
  const [openSourceId, setOpenSourceId] = useState<string | null>(null)
  const openSource = openSourceId ? scenario?.sources[openSourceId] : undefined

  // Read the new screen whenever it changes (or when the toggle turns on).
  // Runs after render, so the DOM already shows the new screen.
  const screenKey = `${scenario?.id ?? ''}|${JSON.stringify(screen)}`
  const { enabled, speak, stop } = readAloud
  useEffect(() => {
    if (enabled) speak(collectScreenText())
    else stop()
  }, [enabled, screenKey, speak, stop])

  // Read a source record when its panel opens; go back to silence when it closes.
  useEffect(() => {
    if (!enabled) return
    if (openSourceId) speak(collectScreenText(document.querySelector('.source-panel') ?? undefined))
    else stop()
  }, [enabled, openSourceId, speak, stop])

  // Leaving the scenario closes any open panel.
  useEffect(() => {
    if (!scenario) setOpenSourceId(null)
  }, [scenario])

  const warnings = scenario
    ? scenarios.find((s) => s.scenario?.id === scenario.id)?.validation.warnings ?? []
    : []

  let body
  if (!scenario || screen.kind === 'era-select') {
    body = <EraSelect scenarios={scenarios} onChoose={(s) => dispatch({ type: 'choose-scenario', scenario: s })} />
  } else {
    switch (screen.kind) {
      case 'briefing':
        body = (
          <Briefing
            scenario={scenario}
            index={screen.index}
            onNext={() => dispatch({ type: 'briefing-next' })}
            onBack={() => dispatch({ type: 'briefing-back' })}
          />
        )
        break
      case 'hub':
        body = (
          <FigureHub
            scenario={scenario}
            visited={state.visited}
            onOpenFigure={(figureId) => dispatch({ type: 'open-figure', figureId })}
            onDecide={() => dispatch({ type: 'go-to-decision' })}
          />
        )
        break
      case 'dialogue':
        body = (
          <Dialogue
            scenario={scenario}
            figureId={screen.figureId}
            nodeId={screen.nodeId}
            onChoice={(next) => dispatch({ type: 'dialogue-choice', next })}
            onLeave={() => dispatch({ type: 'leave-dialogue' })}
          />
        )
        break
      case 'decision':
        body = (
          <Decision
            scenario={scenario}
            onDecide={(outcomeId) => dispatch({ type: 'decide', outcomeId })}
            onBack={() => dispatch({ type: 'back-to-hub' })}
          />
        )
        break
      case 'outcome':
        body = <Outcome scenario={scenario} outcomeId={screen.outcomeId} onNext={() => dispatch({ type: 'outcome-next' })} />
        break
      case 'reveal':
        body = <Reveal scenario={scenario} onNext={() => dispatch({ type: 'reveal-next' })} />
        break
      case 'reflection':
        body = (
          <Reflection
            scenario={scenario}
            outcomeId={screen.outcomeId}
            onRestart={() => dispatch({ type: 'restart' })}
            onQuit={() => dispatch({ type: 'quit' })}
          />
        )
        break
    }
  }

  return (
    <SourceViewerContext.Provider value={setOpenSourceId}>
      <AppHeader readAloud={readAloud} />
      <WarningBanner warnings={warnings} />
      {body}
      <SourcePanel sourceId={openSourceId} source={openSource} onClose={() => setOpenSourceId(null)} />
    </SourceViewerContext.Provider>
  )
}
