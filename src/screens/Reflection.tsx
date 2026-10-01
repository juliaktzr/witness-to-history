import { useState } from 'react'
import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import type { Scenario } from '../content/types'

interface Props {
  scenario: Scenario
  outcomeId: string
  /** Figure IDs the student talked to this playthrough, for the printable summary. */
  visited: string[]
  /** The student's chosen name, if they have set up a player card. */
  playerName?: string
  onRestart: () => void
  onQuit: () => void
}

/**
 * Reflection answers stay in the browser only. There is no server and no
 * saving, by design (see CLAUDE.md). Students can copy their answers out, or
 * use the print button below to turn this page (plus a hidden print-only
 * summary) into a handout via the browser's own "Save as PDF" option.
 */
export function Reflection({ scenario, outcomeId, visited, playerName, onRestart, onQuit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const chosen = scenario.outcomes[outcomeId]
  const metFigures = scenario.figures.filter((f) => visited.includes(f.id))

  return (
    <Frame
      kicker="Reflection"
      title="Look back on your choice"
      actions={
        <>
          <button type="button" className="btn" onClick={() => window.print()}>
            Print or save as PDF
          </button>
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
      <p className="fine-print">
        "Print or save as PDF" opens your browser's print dialog with a one-page summary you can print or
        save, to bring to class.
      </p>

      {/* Hidden on screen; shown only when printing (see the print styles in index.css). */}
      <div className="printable-summary">
        <h1>{scenario.title}</h1>
        <p className="print-meta">
          {scenario.location}, {scenario.year}
          {playerName ? ` · ${playerName}` : ''}
        </p>

        <h2>People I talked to</h2>
        {metFigures.length > 0 ? (
          <ul>
            {metFigures.map((f) => (
              <li key={f.id}>
                {f.name} — {f.role}
              </li>
            ))}
          </ul>
        ) : (
          <p>I did not talk to anyone before deciding.</p>
        )}

        <h2>My decision</h2>
        <ContentText value={scenario.decision.prompt} label="decision prompt" />
        {chosen && (
          <p>
            <strong>What I chose:</strong> {chosen.title}
          </p>
        )}
        {chosen && <ContentText value={chosen.text} label="outcome text" />}

        <h2>What actually happened</h2>
        <ContentText value={scenario.reveal.text} label="historical reveal" />

        <h2>My reflection</h2>
        {scenario.reflection.map((r, i) => (
          <div key={r.id} className="print-reflect-item">
            <p className="print-question">
              Q{i + 1}. <ContentText value={r.prompt} label="reflection question" as="span" />
            </p>
            <p className="print-answer">{answers[r.id]?.trim() || 'No answer written.'}</p>
          </div>
        ))}
      </div>
    </Frame>
  )
}
