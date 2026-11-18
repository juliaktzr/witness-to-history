import { ContentImage } from '../components/ContentImage'
import { ContentText } from '../components/ContentText'
import { ImageViewer } from '../components/ImageViewer'
import { useJourney } from '../components/JourneyContext'
import { Frame } from '../components/Frame'
import { SourceList } from '../components/SourceList'
import { useState } from 'react'
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
  const [zoomOpen, setZoomOpen] = useState(false)
  // Back on the first briefing leaves the era. Once the student has gone past
  // the briefing and come back via the tracker, hide it so they cannot lose
  // their progress by accident; the tracker takes them forward again.
  const { furthest } = useJourney()
  const showBack = index > 0 || furthest <= 0
  const canZoom = !!screen.image && !isPlaceholder(screen.image.src)
  const picture =
    screen.marker && screen.image ? (
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
    )

  // Picture on the left, story text on the right so students can look at both
  // at once. On narrow screens the columns stack: picture, dots, text, buttons.
  return (
    <Frame kicker={`${scenario.location}, ${scenario.year} · Briefing ${index + 1} of ${total}`} title={screen.heading} step="briefing" wide>
      <div className="briefing-split">
        <div className="briefing-picture">
          {canZoom ? (
            // The whole picture is clickable for mouse and touch; the button is the keyboard and screen reader way in.
            <div className="zoomable" onClick={() => setZoomOpen(true)}>
              {picture}
              <button
                type="button"
                className="zoom-button"
                aria-label="Look closer at the picture"
                title="Look closer"
                onClick={(e) => {
                  e.stopPropagation()
                  setZoomOpen(true)
                }}
              >
                <span aria-hidden="true">🔍</span>
              </button>
            </div>
          ) : (
            picture
          )}
        </div>
        <div className="briefing-side">
          <ol className="progress-dots" aria-hidden="true">
            {scenario.briefing.map((b, i) => (
              <li key={b.id} className={i === index ? 'is-current' : i < index ? 'is-done' : ''} />
            ))}
          </ol>
          <div className="parchment">
            <ContentText value={screen.text} label="briefing text" className="lead drop-cap" terms />
            <SourceList ids={screen.sources} scenario={scenario} />
          </div>
          <div className="frame-actions briefing-actions">
            {showBack && (
              <button type="button" className="btn" onClick={onBack}>
                Back
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={onNext}>
              {last ? 'Meet the people' : 'Next'}
            </button>
          </div>
        </div>
      </div>
      <ImageViewer image={zoomOpen && screen.image ? screen.image : null} label="briefing picture" onClose={() => setZoomOpen(false)} />
    </Frame>
  )
}
