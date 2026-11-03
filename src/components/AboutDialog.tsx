import { useEffect, useRef } from 'react'
import type { Scenario } from '../content/types'

/** "A", "A and B", "A, B and C". */
function listNames(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** Built from isRealPerson, so it fits any scenario and names only the made-up figures. */
export function compositeNote(figures: Scenario['figures']): string | null {
  const madeUp = figures.filter((f) => !f.isRealPerson)
  if (madeUp.length === 0) return null
  const who =
    madeUp.length === figures.length
      ? figures.length === 1
        ? 'The person you meet in this era is a made-up character'
        : 'The people you meet in this era are made-up characters'
      : `${listNames(madeUp.map((f) => f.name))} ${madeUp.length === 1 ? 'is a made-up character' : 'are made-up characters'}`
  return `${who}, based on real people who lived at the time. The laws, documents, and big events are real. What happens after your choice is imagined, until the "What really happened" screen.`
}

interface Props {
  open: boolean
  /** The era in progress, if any, so the characters note can be specific. */
  scenario: Scenario | null
  onClose: () => void
}

/** The small print: who is made up, where pictures come from, what is saved. Native <dialog>, like the source panel. */
export function AboutDialog({ open, scenario, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const characters = scenario ? compositeNote(scenario.figures) : null

  return (
    <dialog
      ref={ref}
      className="source-panel about-dialog"
      aria-labelledby="about-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="source-panel-body">
          <p className="kicker">The fine print</p>
          <h2 id="about-title" className="source-panel-title">
            About this game
          </h2>
          <dl className="about-list">
            <dt>The characters</dt>
            <dd>
              {characters ??
                'Some people you meet are made-up characters, based on real people who lived at the time. The laws, documents, and big events are real. What happens after your choice is imagined, until the "What really happened" screen.'}
            </dd>
            <dt>Pictures and documents</dt>
            <dd>
              Old pictures, maps, and documents come from public archives. Tap any "Based on" link to see where one comes
              from. Portraits of made-up characters are drawings, not pictures of real people.
            </dd>
            <dt>Your progress</dt>
            <dd>Your name, character, and progress are saved only on this device. Nothing is sent anywhere.</dd>
          </dl>
          <div className="frame-actions">
            <button type="button" className="btn btn-primary" onClick={onClose} autoFocus>
              Close
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
