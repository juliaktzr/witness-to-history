import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import { SourceList } from '../components/SourceList'
import type { Scenario } from '../content/types'

interface Props {
  scenario: Scenario
  outcomeId: string
  onNext: () => void
}

export function Outcome({ scenario, outcomeId, onNext }: Props) {
  const outcome = scenario.outcomes[outcomeId]
  return (
    <Frame
      kicker="What happens next"
      title={outcome?.title}
      actions={
        <button type="button" className="btn btn-primary" onClick={onNext}>
          What really happened?
        </button>
      }
    >
      <ContentText value={outcome?.text} label="outcome text" className="lead" />
      {outcome && <SourceList ids={outcome.sources} scenario={scenario} />}
    </Frame>
  )
}
