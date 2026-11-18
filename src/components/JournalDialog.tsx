import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { isPlaceholder, type Scenario } from '../content/types'
import { GENERAL_NOTES, type Notes } from '../engine/notes'
import type { TalkEntry } from '../engine/state'
import { ContentImage } from './ContentImage'

interface Props {
  open: boolean
  scenario: Scenario
  /** Which person's page to show first. Null opens the general notes page. */
  figureId: string | null
  talkLog: TalkEntry[]
  notes: Notes
  onChangeNote: (pageId: string, text: string) => void
  onClose: () => void
}

/** The conversations for one figure, split into separate talks. */
function talksWith(log: TalkEntry[], figureId: string): TalkEntry[][] {
  const talks: TalkEntry[][] = []
  for (const entry of log) {
    if (entry.figureId !== figureId) continue
    if (entry.kind === 'start' || talks.length === 0) talks.push([])
    if (entry.kind !== 'start') talks[talks.length - 1].push(entry)
  }
  return talks
}

/**
 * Journal: a general notes page the student can write in at any stage, then
 * one page per person. A person's page unlocks once the student starts
 * talking to them in this play-through
 * and shows everything they said plus the student's notes. Tabs follow the
 * ARIA tabs pattern: arrow keys move between pages.
 */
export function JournalDialog({ open, scenario, figureId, talkLog, notes, onChangeNote, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()
  const figures = scenario.figures
  const pageIds = [GENERAL_NOTES, ...figures.map((f) => f.id)]
  const [current, setCurrent] = useState<string>(figureId ?? GENERAL_NOTES)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setCurrent(figureId ?? GENERAL_NOTES)
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open, figureId])

  // Unlocked only by talking to them in this play-through. Notes written
  // earlier are kept and show again once the page unlocks.
  const isUnlocked = (id: string) => talkLog.some((e) => e.kind === 'start' && e.figureId === id)

  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = pageIds.indexOf(current)
    let n = -1
    if (e.key === 'ArrowRight') n = (i + 1) % pageIds.length
    else if (e.key === 'ArrowLeft') n = (i - 1 + pageIds.length) % pageIds.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = pageIds.length - 1
    if (n < 0) return
    e.preventDefault()
    setCurrent(pageIds[n])
    tabRefs.current[n]?.focus()
  }

  const figure = figures.find((f) => f.id === current)
  const pageId = figure ? figure.id : GENERAL_NOTES
  const unlocked = !figure || isUnlocked(figure.id)

  function notesBox(label: string, hint: string) {
    return (
      <>
        <h3 className="section-heading">
          <label htmlFor={`${baseId}-notes`}>{label}</label>
        </h3>
        <p className="fine-print" id={`${baseId}-notes-hint`}>
          {hint}
        </p>
        <textarea
          id={`${baseId}-notes`}
          className="journal-notes"
          rows={6}
          aria-describedby={`${baseId}-notes-hint`}
          value={notes[pageId] ?? ''}
          onChange={(e) => onChangeNote(pageId, e.target.value)}
        />
      </>
    )
  }

  let page
  if (!figure) {
    page = notesBox(
      'My notes',
      'Write anything you notice about this time and place: what is going on, who has power, what people are afraid of.',
    )
  } else if (!unlocked) {
    page = (
      <p className="journal-locked">
        <span aria-hidden="true">🔒</span> Talk to {figure.name} to unlock this page.
      </p>
    )
  } else {
    const talks = talksWith(talkLog, figure.id)
    page = (
      <>
        <p className="journal-role">{isPlaceholder(figure.role) ? '' : figure.role}</p>
        <h3 className="section-heading">What was said</h3>
        {talks.length === 0 ? (
          <p className="muted">Talk to {figure.name} again to see what they say.</p>
        ) : (
          talks.map((talk, t) => (
            <div key={t} className="journal-talk">
              {talks.length > 1 && <p className="journal-talk-label">Talk {t + 1}</p>}
              <ol className="journal-log">
                {talk.map((entry, i) =>
                  entry.kind === 'you' ? (
                    <li key={i} className="journal-line is-you">
                      <span className="journal-who">You:</span> {entry.text}
                    </li>
                  ) : entry.kind === 'figure' ? (
                    <li key={i} className="journal-line">
                      <span className="journal-who">{figure.name}:</span> {scenario.dialogue[entry.nodeId]?.text ?? ''}
                    </li>
                  ) : null,
                )}
              </ol>
            </div>
          ))
        )}
        {notesBox(`My notes about ${figure.name}`, 'What do they want? What are they worried about? What do they not know?')}
      </>
    )
  }

  return (
    <dialog
      ref={ref}
      className="source-panel journal"
      aria-labelledby={`${baseId}-title`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="source-panel-body">
          <div className="journal-head">
            <h2 id={`${baseId}-title`} className="source-panel-title">
              <span aria-hidden="true">📖</span> My journal
            </h2>
            <button type="button" className="btn btn-small" onClick={onClose}>
              Close ✕
            </button>
          </div>

          <div className="journal-tabs" role="tablist" aria-label="Journal pages" onKeyDown={onTabKey}>
            {pageIds.map((id, i) => {
              const f = figures.find((x) => x.id === id)
              const selected = id === pageId
              const locked = !!f && !isUnlocked(id)
              return (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  className={`journal-tab ${locked ? 'is-locked' : ''}`}
                  onClick={() => setCurrent(id)}
                >
                  {f ? (
                    locked ? (
                      <span className="journal-tab-icon" aria-hidden="true">🔒</span>
                    ) : (
                      <ContentImage image={f.portrait} label={`portrait of ${f.name}`} className="journal-tab-portrait" />
                    )
                  ) : (
                    <span className="journal-tab-icon" aria-hidden="true">📝</span>
                  )}
                  <span>{f ? f.name : 'My notes'}</span>
                  {locked && <span className="visually-hidden"> (locked)</span>}
                </button>
              )
            })}
          </div>

          <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${pageId}`} className="journal-page">
            {page}
          </div>
        </div>
      )}
    </dialog>
  )
}
