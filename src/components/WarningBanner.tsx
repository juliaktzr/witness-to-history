import { useState } from 'react'
import type { ValidationIssue } from '../content/validate'

interface Props {
  warnings: ValidationIssue[]
}

/** Yellow bar listing unfinished content. Collapsed by default so it does not crowd students. */
export function WarningBanner({ warnings }: Props) {
  const [open, setOpen] = useState(false)
  if (warnings.length === 0) return null
  return (
    <aside className="warning-banner" aria-label="Unfinished content">
      <button type="button" className="warning-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {warnings.length} unfinished content {warnings.length === 1 ? 'item' : 'items'} {open ? '(hide)' : '(show)'}
      </button>
      {open && (
        <ul className="warning-list">
          {warnings.map((w, i) => (
            <li key={i}>
              <code>{w.path}</code>: {w.message}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
