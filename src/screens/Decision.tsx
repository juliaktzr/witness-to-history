import { ChoiceButton } from '../components/ChoiceButton'
import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import type { Scenario } from '../content/types'

interface Props {
  scenario: Scenario
  onDecide: (outcomeId: string) => void
  onBack: () => void
}

export function Decision({ scenario, onDecide, onBack }: Props) {
  const { decision } = scenario
  return (
    <Frame
      kicker="Your decision"
      title={decision.prompt}
      actions={
        <button type="button" className="btn" onClick={onBack}>
          Talk to people first
        </button>
      }
    >
      <div className="callout">
        <p className="callout-label">What you know, and what you do not</p>
        <ContentText value={decision.context} label="decision context" />
      </div>
      <h2 className="section-heading">Pick one</h2>
      <ul className="choice-list">
        {decision.options.map((o, i) => (
          <li key={i}>
            <ChoiceButton text={o.text} label={`option ${i + 1}`} onClick={() => onDecide(o.outcome)} />
          </li>
        ))}
      </ul>
    </Frame>
  )
}
