import { useEffect, useRef } from 'react'
import { isPlaceholder, type Source, type SourceType } from '../content/types'
import { ContentText } from './ContentText'

const TYPE_LABELS: Record<SourceType, string> = {
  document: 'Document',
  image: 'Image',
  map: 'Map',
  letter: 'Letter',
  newspaper: 'Newspaper',
  secondary: 'Secondary source (written later by a historian)',
}

interface Props {
  sourceId: string | null
  source: Source | undefined
  onClose: () => void
}

/**
 * Modal panel showing one source record. Uses the native <dialog> element:
 * showModal() traps focus, makes the page behind inert, closes on Escape,
 * and returns focus to the button that opened it.
 */
export function SourcePanel({ sourceId, source, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (sourceId && !dialog.open) dialog.showModal()
    if (!sourceId && dialog.open) dialog.close()
  }, [sourceId])

  if (!sourceId) return <dialog ref={ref} className="source-panel" onClose={onClose} />

  const typeLabel = source && source.type in TYPE_LABELS ? TYPE_LABELS[source.type] : source?.type

  return (
    <dialog
      ref={ref}
      className="source-panel"
      aria-labelledby="source-panel-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> itself, not on its children.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="source-panel-body">
        <p className="kicker">Source</p>
        {source ? (
          <>
            <ContentText as="h2" id="source-panel-title" value={source.title} label="source title" className="source-panel-title" />
            <dl className="source-facts">
              <dt>Created by</dt>
              <dd>
                <ContentText as="span" value={source.creator} label="creator" />
              </dd>
              <dt>Date</dt>
              <dd>
                <ContentText as="span" value={source.date} label="date" />
              </dd>
              <dt>Type</dt>
              <dd>
                <ContentText as="span" value={typeLabel} label="type" />
              </dd>
              <dt>Where to find it</dt>
              <dd>
                {isPlaceholder(source.url) ? (
                  <ContentText as="span" value={source.url} label="archive link" />
                ) : (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    Open the original (new tab)
                  </a>
                )}
              </dd>
            </dl>
            {source.excerpt !== undefined && source.excerpt.trim() !== '' && (
              <>
                <h3 className="section-heading">From the source</h3>
                <ContentText value={source.excerpt} label="excerpt" className="excerpt" />
              </>
            )}
          </>
        ) : (
          <h2 id="source-panel-title" className="source-panel-title">
            <span className="placeholder">Content coming soon: source "{sourceId}"</span>
          </h2>
        )}
        <div className="frame-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  )
}
