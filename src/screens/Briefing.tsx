import { ContentImage } from '../components/ContentImage'
import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import { SourceList } from '../components/SourceList'
import { isPlaceholder, type Scenario } from '../content/types'

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
      {screen.marker && screen.image ? (
        <figure className="marked-image">
          <ContentImage image={screen.image} label="briefing picture" className="hero-image" />
          <span className="image-marker" style={{ left: `${screen.marker.x}%`, top: `${screen.marker.y}%` }} aria-hidden="true">
            <span className="image-marker-pin" />
          </span>
          <figcaption className="image-marker-caption">
            <span className="image-marker-dot" aria-hidden="true" /> {isPlaceholder(screen.marker.label) ? 'Marker label coming soon' : screen.marker.label}
          </figcaption>
        </figure>
      ) : (
        <ContentImage image={screen.image} label="briefing picture" className="hero-image" />
      )}
      <ol className="progress-dots" aria-hidden="true">
        {scenario.briefing.map((b, i) => (
          <li key={b.id} className={i === index ? 'is-current' : i < index ? 'is-done' : ''} />
        ))}
      </ol>
      <ContentText value={screen.text} label="briefing text" className="lead drop-cap" />
      <SourceList ids={screen.sources} scenario={scenario} />
    </Frame>
  )
}
