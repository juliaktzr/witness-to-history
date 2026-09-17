import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import { SourceList } from '../components/SourceList'
import type { Scenario } from '../content/types'

interface Props {
  scenario: Scenario
  onNext: () => void
}

export function Reveal({ scenario, onNext }: Props) {
  return (
    <Frame
      kicker="Historical reveal"
      title="What really happened"
      actions={
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Think it over
        </button>
      }
    >
      <ContentText value={scenario.reveal.text} label="historical reveal" className="lead" />
      <SourceList ids={scenario.reveal.sources} scenario={scenario} />
    </Frame>
  )
}
