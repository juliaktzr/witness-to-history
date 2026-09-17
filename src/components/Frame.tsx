import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  /** Small line above the heading, e.g. "Briefing 1 of 2". */
  kicker?: string
  title?: string
  children: ReactNode
  /** Buttons rendered in a sticky footer. */
  actions?: ReactNode
}

/**
 * Common page layout. Moves keyboard focus to the heading whenever the screen
 * changes so screen reader and keyboard users are not stranded.
 */
export function Frame({ kicker, title, children, actions }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [title, kicker])

  return (
    <main className="frame">
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
