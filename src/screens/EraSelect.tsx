import type React from 'react'
import { ContentImage } from '../components/ContentImage'
import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import type { LoadedScenario } from '../content/loadScenarios'
import type { Scenario } from '../content/types'

interface Props {
  scenarios: LoadedScenario[]
  onChoose: (scenario: Scenario) => void
}

export function EraSelect({ scenarios, onChoose }: Props) {
  return (
    <Frame kicker="Witness to History" title="Choose a moment in time">
      {scenarios.length === 0 && (
        <p className="placeholder">No scenarios found in content/scenarios.</p>
      )}
      <ul className="card-list">
        {scenarios.map(({ file, scenario, validation }, i) =>
          scenario ? (
            <li key={file} className="card stagger" style={{ '--i': i } as React.CSSProperties}>
              <ContentImage image={scenario.coverImage} label="cover" className="card-image" />
              <div className="card-body">
                <p className="kicker">
                  {scenario.era} · {scenario.year}
                </p>
                <h2 className="card-title">{scenario.title}</h2>
                <ContentText value={scenario.location} label="location" className="muted" />
                <ContentText value={scenario.summary} label="summary" />
                <button type="button" className="btn btn-primary" onClick={() => onChoose(scenario)}>
                  Travel to {scenario.year}
                </button>
              </div>
            </li>
          ) : (
            <li key={file} className="card card-error" aria-label={`Scenario ${file} has errors`}>
              <div className="card-body">
                <h2 className="card-title">{file}</h2>
                <p>This scenario cannot load. Fix these in the content sheet:</p>
                <ul className="error-list">
                  {validation.errors.map((e, i) => (
                    <li key={i}>
                      <code>{e.path}</code>: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ),
        )}
      </ul>
    </Frame>
  )
}
