import type { AvatarPrefs } from "../engine/avatarPrefs";
import { standing, type PlayerProfile } from "../engine/profile";
import type { ReadAloud } from "../speech/useReadAloud";
import { Avatar } from "./Avatar";

interface Props {
  readAloud: ReadAloud;
  profile: PlayerProfile;
  avatarPrefs: AvatarPrefs;
  /** When set, a Home button appears that calls this. */
  onHome?: () => void;
  /** Opens the character: the dashboard between eras, the wardrobe during one. */
  onOpenProfile: () => void;
}

function ReadAloudButton({ readAloud, className = "" }: { readAloud: ReadAloud; className?: string }) {
  const { enabled, speaking, toggle } = readAloud;
  return (
    <button
      type="button"
      className={`btn btn-small ${enabled ? "btn-primary" : ""} ${className}`}
      aria-pressed={enabled}
      onClick={toggle}
    >
      <span aria-hidden="true">{speaking ? "🔊" : "🔈"} </span>
      Read aloud {enabled ? "on" : "off"}
    </button>
  );
}

/** Read-aloud toggle for the title and character screens, which have no header bar. */
export function ReadAloudFloat({ readAloud }: { readAloud: ReadAloud }) {
  if (!readAloud.supported) return null;
  return <ReadAloudButton readAloud={readAloud} className="read-aloud-float" />;
}

/** Persistent top bar. The read-aloud toggle only appears when the browser can speak. */
export function AppHeader({ readAloud, profile, avatarPrefs, onHome, onOpenProfile }: Props) {
  const s = standing(profile);
  return (
    <div className="app-header">
      <span className="app-header-title">Witness to History</span>
      <div className="app-header-actions">
        {onHome && (
          <button type="button" className="btn btn-small btn-icon" onClick={onHome} aria-label="Home">
            <span className="btn-glyph" aria-hidden="true">
              ⌂
            </span>
            <span className="btn-text">Home</span>
          </button>
        )}
        <button
          type="button"
          className="player-chip"
          onClick={onOpenProfile}
          aria-label={`${profile.name}, level ${s.level}. Open character`}
        >
          <span className="player-chip-avatar" aria-hidden="true">
            <Avatar prefs={avatarPrefs} crop="head" />
          </span>
          <span className="player-chip-text" aria-hidden="true">
            <span className="player-chip-name">{profile.name}</span>
            <span className="player-chip-level">Lv {s.level}</span>
          </span>
        </button>
        {readAloud.supported && <ReadAloudButton readAloud={readAloud} />}
      </div>
    </div>
  );
}
