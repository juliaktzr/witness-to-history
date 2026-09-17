import type { ReadAloud } from "../speech/useReadAloud";

interface Props {
  readAloud: ReadAloud;
  /** When set, a Home button appears that calls this. */
  onHome?: () => void;
}

/** Persistent top bar. The read-aloud toggle only appears when the browser can speak. */
export function AppHeader({ readAloud, onHome }: Props) {
  const { supported, enabled, speaking, toggle } = readAloud;
  return (
    <div className="app-header">
      <span className="app-header-title">Witness to History</span>
      <div className="app-header-actions">
        {onHome && (
          <button type="button" className="btn btn-small" onClick={onHome}>
            <span aria-hidden="true">⌂ </span>
            Home
          </button>
        )}
        {supported && (
          <button
            type="button"
            className={`btn btn-small ${enabled ? "btn-primary" : ""}`}
            aria-pressed={enabled}
            onClick={toggle}
          >
            <span aria-hidden="true">{speaking ? "🔊" : "🔈"} </span>
            Read aloud {enabled ? "on" : "off"}
          </button>
        )}
      </div>
    </div>
  );
}
