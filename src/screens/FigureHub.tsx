import { ContentImage } from '../components/ContentImage'
import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import { TownMap } from '../components/TownMap'
import { isPlaceholder } from '../content/types'
import type { Scenario } from '../content/types'

interface Props {
  scenario: Scenario
  visited: string[]
  onOpenFigure: (figureId: string) => void
  onDecide: () => void
}

export function FigureHub({ scenario, visited, onOpenFigure, onDecide }: Props) {
  const allVisited = scenario.figures.every((f) => visited.includes(f.id))
  const map = scenario.map && scenario.map.places.length > 0 ? scenario.map : undefined
  const here = map?.places.find((p) => p.id === map.here)
  const unplaced = map ? scenario.figures.filter((f) => !f.place || !map.places.some((p) => p.id === f.place)) : scenario.figures
  return (
    <Frame
      kicker={`${scenario.location}, ${scenario.year}`}
      title="Who do you want to talk to?"
      actions={
        <button type="button" className={`btn ${allVisited ? 'btn-primary' : ''}`} onClick={onDecide}>
          {allVisited ? 'Go to the town decision' : 'Skip to the decision'}
        </button>
      }
    >
      <p className="lead">Talk to each person to learn what they know and what worries them.</p>
      {map && (
        <>
          {here && (
            <p className="muted">
              You are at {isPlaceholder(here.label) ? 'a place with no name yet' : `the ${here.label.toLowerCase()}`}. Pick a person on the map, or from the list below.
            </p>
          )}
          <TownMap map={map} figures={scenario.figures} visited={visited} onOpenFigure={onOpenFigure} />
          {unplaced.length > 0 && <p className="fine-print">Not on the map yet: {unplaced.map((f) => f.name).join(', ')}.</p>}
          <h2 className="section-heading">Everyone in town</h2>
        </>
      )}
      <ul className="card-list">
        {scenario.figures.map((f) => {
          const done = visited.includes(f.id)
          return (
            <li key={f.id} className="card card-row">
              <ContentImage image={f.portrait} label={`portrait of ${f.name}`} className="portrait" />
              <div className="card-body">
                <h2 className="card-title">
                  {f.name}
                  {done && <span className="badge"> Talked</span>}
                </h2>
                <ContentText value={f.role} label="role" className="muted" />
                {!f.isRealPerson && <p className="fine-print">A composite character based on real people.</p>}
                <button type="button" className="btn btn-primary" onClick={() => onOpenFigure(f.id)}>
                  {done ? `Talk to ${f.name} again` : `Talk to ${f.name}`}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </Frame>
  )
}
