import { ContentImage } from '../components/ContentImage'
import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import { SourceList } from '../components/SourceList'
import type { Scenario } from '../content/types'

interface Props {
  scenario: Scenario
  index: number
  onNext: () => void
  onBack: () => void
}

export function Briefing({ scenario, index, onNext, onBack }: Props) {
  const screen = scenario.briefing[index]
  const total = scenario.briefing.length
  const last = index === total - 1
  return (
    <Frame
      kicker={`${scenario.location}, ${scenario.year} · Briefing ${index + 1} of ${total}`}
      title={screen.heading}
      actions={
        <>
          <button type="button" className="btn" onClick={onBack}>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {last ? 'Meet the people' : 'Next'}
          </button>
        </>
      }
    >
      <ContentImage image={screen.image} label="briefing picture" className="hero-image" />
      <ContentText value={screen.text} label="briefing text" className="lead" />
      <SourceList ids={screen.sources} scenario={scenario} />
    </Frame>
  )
}
