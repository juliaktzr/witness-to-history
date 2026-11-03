import { useEffect, useRef, type ReactNode } from 'react'

/** The chapters of one play session, in order. Shown as a tracker above each scenario screen. */
const STEPS = [
  { id: 'briefing', label: 'Briefing' },
  { id: 'people', label: 'People' },
  { id: 'decision', label: 'Decision' },
  { id: 'outcome', label: 'Outcome' },
  { id: 'history', label: 'History' },
  { id: 'reflect', label: 'Reflect' },
] as const

export type JourneyStep = (typeof STEPS)[number]['id']

interface Props {
  /** Small line above the heading, e.g. "Briefing 1 of 2". */
  kicker?: string
  title?: string
  /** Where this screen sits in the play session. Omit to hide the tracker. */
  step?: JourneyStep
  children: ReactNode
  /** Buttons rendered after the content, so students scroll past the text to reach them. */
  actions?: ReactNode
}

function JourneyTracker({ step }: { step: JourneyStep }) {
  const current = STEPS.findIndex((s) => s.id === step)
  return (
    <ol className="journey" aria-label="Your journey">
      {STEPS.map((s, i) => (
        <li
          key={s.id}
          className={`journey-step ${i < current ? 'is-done' : ''} ${i === current ? 'is-current' : ''}`}
          aria-current={i === current ? 'step' : undefined}
        >
          <span className="journey-gem" aria-hidden="true">
            {i < current ? '✓' : i + 1}
          </span>
          <span className="journey-label">{s.label}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * Common page layout. Moves keyboard focus to the heading whenever the screen
 * changes so screen reader and keyboard users are not stranded.
 */
export function Frame({ kicker, title, step, children, actions }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [title, kicker])

  return (
    <main className="frame">
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
