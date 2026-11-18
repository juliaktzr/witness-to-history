import { useEffect, useRef, type ReactNode } from 'react'
import { JOURNEY, type JourneyStep } from '../engine/state'
import { useJourney } from './JourneyContext'

const LABELS: Record<JourneyStep, string> = {
  briefing: 'Briefing',
  people: 'People',
  decision: 'Decision',
  outcome: 'Outcome',
  history: 'History',
  reflect: 'Reflect',
}

interface Props {
  /** Small line above the heading, e.g. "Briefing 1 of 2". */
  kicker?: string
  title?: string
  /** Where this screen sits in the play session. Omit to hide the tracker. */
  step?: JourneyStep
  children: ReactNode
  /** Buttons rendered after the content, so students scroll past the text to reach them. */
  actions?: ReactNode
  /** Wider page for side-by-side layouts (briefing picture beside its text). */
  wide?: boolean
}

/**
 * Chapter tracker. Chapters already reached are buttons, so students can go
 * back (for example, reread the briefing before deciding). Chapters not
 * reached yet are locked, in the same dashed style as locked journal pages.
 */
function JourneyTracker({ step }: { step: JourneyStep }) {
  const { furthest, goTo } = useJourney()
  const current = JOURNEY.indexOf(step)
  const reached = Math.max(furthest, current)
  return (
    <nav aria-label="Your journey">
      <ol className="journey">
        {JOURNEY.map((id, i) => {
          const isCurrent = i === current
          const locked = i > reached
          const label = LABELS[id]
          const inner = (
            <>
              <span className="journey-gem" aria-hidden="true">
                {locked ? '🔒' : i < current ? '✓' : i + 1}
              </span>
              <span className="journey-label">{label}</span>
            </>
          )
          return (
            <li
              key={id}
              className={`journey-step ${!isCurrent && !locked ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''} ${locked ? 'is-locked' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isCurrent || locked ? (
                <span className="journey-inner">
                  {inner}
                  {locked && <span className="visually-hidden"> (locked)</span>}
                </span>
              ) : (
                <button type="button" className="journey-inner" onClick={() => goTo(id)} aria-label={`Go back to ${label}`}>
                  {inner}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Common page layout. Moves keyboard focus to the heading whenever the screen
 * changes so screen reader and keyboard users are not stranded.
 */
export function Frame({ kicker, title, step, children, actions, wide }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [title, kicker])

  return (
    <main className={wide ? 'frame frame-wide' : 'frame'}>
      {step && <JourneyTracker step={step} />}
      <header className="frame-header">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 ref={headingRef} tabIndex={-1} className="frame-title">
          {title ?? <span className="placeholder">Content coming soon: title</span>}
        </h1>
      </header>
      <section className="frame-body">{children}</section>
      {actions && <footer className="frame-actions">{actions}</footer>}
    </main>
  )
}
