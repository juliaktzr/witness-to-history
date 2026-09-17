import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Small modal question. Native <dialog>: Escape cancels, focus is trapped and returned. */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={ref} className="source-panel confirm-dialog" aria-labelledby="confirm-title" onClose={onCancel}>
      {open && (
        <div className="source-panel-body">
          <h2 id="confirm-title" className="source-panel-title">
            {title}
          </h2>
          <div className="confirm-body">{children}</div>
          <div className="frame-actions">
            <button type="button" className="btn" onClick={onCancel} autoFocus>
              {cancelLabel}
            </button>
            <button type="button" className="btn btn-primary" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
