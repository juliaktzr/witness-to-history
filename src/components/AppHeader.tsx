import type { AvatarPrefs } from "../engine/avatarPrefs";
import { standing, type PlayerProfile } from "../engine/profile";
import { Avatar } from "./Avatar";
import { GameMenu, type MenuItem } from "./GameMenu";

interface Props {
  profile: PlayerProfile;
  avatarPrefs: AvatarPrefs;
  menuItems: MenuItem[];
  /** Shown as a dot on the menu button, e.g. "Read aloud is on". */
  menuIndicator?: string;
  /** Opens the character: the dashboard between eras, the wardrobe during one. */
  onOpenProfile: () => void;
}

/** Menu for the title and character screens, which have no header bar. */
export function FloatingMenu({ items, indicator }: { items: MenuItem[]; indicator?: string }) {
  return <GameMenu items={items} indicator={indicator} className="game-menu-float" />;
}

/** Persistent top bar: title, the player's badge, and the ☰ menu. */
export function AppHeader({ profile, avatarPrefs, menuItems, menuIndicator, onOpenProfile }: Props) {
  const s = standing(profile);
  return (
    <div className="app-header">
      <span className="app-header-title">Witness to History</span>
      <div className="app-header-actions">
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
        <GameMenu items={menuItems} indicator={menuIndicator} />
      </div>
    </div>
  );
}
