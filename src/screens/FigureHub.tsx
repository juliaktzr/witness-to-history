import type React from 'react'
import { useRef } from 'react'
import { ContentImage } from '../components/ContentImage'
import { ContentText } from '../components/ContentText'
import { Frame } from '../components/Frame'
import { TownMap } from '../components/TownMap'
import { isPlaceholder } from '../content/types'
import type { Scenario } from '../content/types'
import type { AvatarPrefs } from '../engine/avatarPrefs'

interface Props {
  scenario: Scenario
  visited: string[]
  avatarPlace: string | null
  avatarPrefs: AvatarPrefs
  onMoveAvatar: (placeId: string) => void
  onOpenFigure: (figureId: string) => void
  onDecide: () => void
}

/** "Meeting house" -> "the meeting house"; "Mr. Hale's shop" stays as written. */
function placePhrase(label: string): string {
  const words = label.trim().split(/\s+/)
  const properNoun = words.slice(1).some((w) => /^[A-Z]/.test(w)) || /^[A-Z][a-z]*\./.test(words[0])
  return properNoun ? label : `the ${label.charAt(0).toLowerCase()}${label.slice(1)}`
}

export function FigureHub({ scenario, visited, avatarPlace, avatarPrefs, onMoveAvatar, onOpenFigure, onDecide }: Props) {
  /** Figure to open once the character finishes walking. */
  const pending = useRef<{ figureId: string; placeId: string } | null>(null)
  const allVisited = scenario.figures.every((f) => visited.includes(f.id))
  const map = scenario.map && scenario.map.places.length > 0 ? scenario.map : undefined
  const here = map?.places.find((p) => p.id === (avatarPlace ?? map.here))
  const unplaced = map ? scenario.figures.filter((f) => !f.place || !map.places.some((p) => p.id === f.place)) : scenario.figures

  // If the figure has a spot on the map and the student is not already there,
  // walk the character over first. TownMap calls onArrive when the walk ends.
  function handleOpenFigure(figureId: string, placeId?: string) {
    if (map && placeId && map.places.some((p) => p.id === placeId) && placeId !== avatarPlace) {
      pending.current = { figureId, placeId }
      onMoveAvatar(placeId)
    } else {
      pending.current = null
      onOpenFigure(figureId)
    }
  }

  function handleArrive(placeId: string) {
    const p = pending.current
    if (p && p.placeId === placeId) {
      pending.current = null
      onOpenFigure(p.figureId)
    }
  }

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
              You are at {isPlaceholder(here.label) ? 'a place with no name yet' : placePhrase(here.label)}. Pick a person and your character will walk over.
            </p>
          )}
          <TownMap
            map={map}
            figures={scenario.figures}
            visited={visited}
            avatarPlace={avatarPlace}
            avatarPrefs={avatarPrefs}
            onArrive={handleArrive}
            onOpenFigure={handleOpenFigure}
          />
          {unplaced.length > 0 && <p className="fine-print">Not on the map yet: {unplaced.map((f) => f.name).join(', ')}.</p>}
          <h2 className="section-heading">Everyone in town</h2>
        </>
      )}
      <ul className="card-list">
        {scenario.figures.map((f, i) => {
          const done = visited.includes(f.id)
          return (
            <li key={f.id} className="card card-row stagger" style={{ '--i': i } as React.CSSProperties}>
              <ContentImage image={f.portrait} label={`portrait of ${f.name}`} className="portrait" />
              <div className="card-body">
                <h2 className="card-title">
                  {f.name}
                  {done && <span className="badge"> Talked</span>}
                </h2>
                <ContentText value={f.role} label="role" className="muted" />
                {!f.isRealPerson && <p className="fine-print">A composite character based on real people.</p>}
                <button type="button" className="btn btn-primary" onClick={() => handleOpenFigure(f.id, f.place)}>
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
