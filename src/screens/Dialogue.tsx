import { ChoiceButton } from '../components/ChoiceButton'
import { ContentImage } from '../components/ContentImage'
import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import { SourceList } from '../components/SourceList'
import type { Scenario } from '../content/types'

interface Props {
  scenario: Scenario
  figureId: string
  nodeId: string
  onChoice: (next: string) => void
  onLeave: () => void
}

export function Dialogue({ scenario, figureId, nodeId, onChoice, onLeave }: Props) {
  const figure = scenario.figures.find((f) => f.id === figureId)
  const node = scenario.dialogue[nodeId]

  if (!figure || !node) {
    // The validator should prevent this; keep a safe exit anyway.
    return (
      <Frame title="Missing dialogue" actions={<button type="button" className="btn" onClick={onLeave}>Back</button>}>
        <p className="placeholder">Content coming soon: dialogue "{nodeId}"</p>
      </Frame>
    )
  }

  return (
    <Frame
      kicker={figure.role}
      title={figure.name}
      actions={
        <button type="button" className="btn" onClick={onLeave}>
          End conversation
        </button>
      }
    >
      <div className="speech">
        <ContentImage image={figure.portrait} label={`portrait of ${figure.name}`} className="portrait" />
        <div className="speech-bubble">
          <ContentText value={node.text} label="what they say" className="lead" />
          <SourceList ids={node.sources} scenario={scenario} />
        </div>
      </div>

      {node.choices.length > 0 ? (
        <>
          <h2 className="section-heading">What do you say?</h2>
          <ul className="choice-list">
            {node.choices.map((c, i) => (
              <li key={i}>
                <ChoiceButton text={c.text} label={`choice ${i + 1}`} onClick={() => onChoice(c.next)} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted">That is all {figure.name} has to say for now.</p>
      )}
    </Frame>
  )
}
