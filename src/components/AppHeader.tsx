import type { ReadAloud } from '../speech/useReadAloud'

interface Props {
  readAloud: ReadAloud
}

/** Persistent top bar. The read-aloud toggle only appears when the browser can speak. */
export function AppHeader({ readAloud }: Props) {
  const { supported, enabled, speaking, toggle } = readAloud
  return (
    <div className="app-header">
      <span className="app-header-title">Witness to History</span>
      {supported && (
        <button
          type="button"
          className={`btn btn-small ${enabled ? 'btn-primary' : ''}`}
          aria-pressed={enabled}
          onClick={toggle}
        >
          <span aria-hidden="true">{speaking ? '🔊' : '🔈'} </span>
          Read aloud {enabled ? 'on' : 'off'}
        </button>
      )}
    </div>
  )
}
