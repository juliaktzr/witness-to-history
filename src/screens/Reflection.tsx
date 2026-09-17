import { useState } from 'react'
import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import type { Scenario } from '../content/types'

interface Props {
  scenario: Scenario
  outcomeId: string
  onRestart: () => void
  onQuit: () => void
}

/**
 * Reflection answers stay in the browser only. There is no server and no
 * saving, by design (see CLAUDE.md). Students can copy their answers out.
 */
export function Reflection({ scenario, outcomeId, onRestart, onQuit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const chosen = scenario.outcomes[outcomeId]

  return (
    <Frame
      kicker="Reflection"
      title="Look back on your choice"
      actions={
        <>
          <button type="button" className="btn" onClick={onQuit}>
            Choose another era
          </button>
          <button type="button" className="btn btn-primary" onClick={onRestart}>
            Play again and choose differently
          </button>
        </>
      }
    >
      {chosen && (
        <p className="muted">
          You chose: <strong>{chosen.title}</strong>
        </p>
      )}
      {scenario.reflection.length === 0 && <p className="placeholder">Content coming soon: reflection prompts</p>}
      {scenario.reflection.map((r, i) => (
        <div key={r.id} className="reflect-block">
          <label htmlFor={`reflect-${r.id}`} className="reflect-label">
            <span className="kicker">Question {i + 1}</span>
            <ContentText value={r.prompt} label="reflection question" as="span" />
          </label>
          <textarea
            id={`reflect-${r.id}`}
            rows={4}
            value={answers[r.id] ?? ''}
            onChange={(e) => setAnswers({ ...answers, [r.id]: e.target.value })}
            placeholder="Type your thoughts here. They are not saved anywhere."
          />
        </div>
      ))}
    </Frame>
  )
}
