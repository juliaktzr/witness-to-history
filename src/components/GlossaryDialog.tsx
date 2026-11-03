import { useEffect, useRef } from 'react'
import type { GlossaryEntry, Scenario } from '../content/types'
import { SourceList } from './SourceList'

interface Props {
  entry: GlossaryEntry | undefined
  scenario: Scenario | null
  onClose: () => void
}

/** "Word to know": the authored definition of a tapped term. Native <dialog>, like the source panel. */
export function GlossaryDialog({ entry, scenario, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const open = !!entry
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      // showModal focuses the first link (the source); start on the close button instead.
      closeRef.current?.focus()
    }
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="source-panel glossary-dialog"
      aria-labelledby="glossary-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {entry && (
        <div className="source-panel-body">
          <p className="kicker">Word to know</p>
          <h2 id="glossary-title" className="source-panel-title">
            {entry.term}
          </h2>
          <p className="glossary-definition">{entry.definition}</p>
          {scenario && <SourceList ids={entry.sources} scenario={scenario} />}
          <div className="frame-actions">
            <button type="button" className="btn btn-primary" ref={closeRef} onClick={onClose}>
              Got it
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
