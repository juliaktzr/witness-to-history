import { useEffect, useRef, useState } from 'react'
import { assetUrl } from '../content/assetUrl'
import { isPlaceholder, type ImageRef } from '../content/types'

interface Props {
  image: ImageRef | null
  /** What the picture is, used when the authors have not written alt text yet. */
  label: string
  onClose: () => void
}

/**
 * Big view of a picture so students can read small print in old documents.
 * Opens at full size (scroll to read); "Fit to screen" shows it whole.
 * Native <dialog>, like the source panel: traps focus, Escape closes.
 */
export function ImageViewer({ image, label, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [fit, setFit] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (image && !d.open) {
      setFit(false)
      d.showModal()
    }
    if (!image && d.open) d.close()
  }, [image])

  const alt = image && !isPlaceholder(image.alt) ? image.alt : `${label} (description coming soon)`

  return (
    <dialog
      ref={ref}
      className="image-viewer"
      aria-label="Look closer"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> itself.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {image && (
        <>
          <div className="image-viewer-bar">
            <button
              type="button"
              className="btn btn-small viewer-icon-btn"
              aria-label={fit ? 'Show full size' : 'Fit to screen'}
              title={fit ? 'Full size' : 'Fit to screen'}
              onClick={() => setFit((f) => !f)}
            >
              <span aria-hidden="true" className={fit ? undefined : 'viewer-fit-glyph'}>{fit ? '🔍' : '⤢'}</span>
            </button>
            <button type="button" className="btn btn-small btn-primary" onClick={onClose}>
              Close ✕
            </button>
          </div>
          <div className={`image-viewer-stage ${fit ? 'is-fit' : ''}`}>
            <img src={assetUrl(image.src)} alt={alt} onClick={() => setFit((f) => !f)} />
          </div>
          <p className="image-viewer-caption">{alt}</p>
        </>
      )}
    </dialog>
  )
}
