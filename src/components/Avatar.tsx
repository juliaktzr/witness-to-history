import type { AvatarPrefs } from '../engine/avatarPrefs'

interface Props {
  prefs: AvatarPrefs
  /** Set for the one place this icon is meaningful on its own (the picker preview). */
  title?: string
}

const INK = '#1d1a14'

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount)))
  const r = ch(n >> 16)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * The student's little figure: head, hair, hat, coat, arms, legs. Pure SVG,
 * so it scales cleanly and costs nothing. Legs and arms carry class names so
 * CSS can swing them while walking.
 */
export function Avatar({ prefs, title }: Props) {
  const { skin, coat, hair, hairColor, hat } = prefs
  const coatDark = shade(coat, -40)
  const vest = shade(coat, 70)
  return (
    <svg
      viewBox="0 0 24 32"
      width="100%"
      height="100%"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className="avatar-svg"
    >
      <ellipse cx="12" cy="30.6" rx="6" ry="1.2" fill="#000" opacity="0.22" />
      <g className="avatar-figure">
        {/* legs (hips at y=22) */}
        <g className="avatar-leg avatar-leg-l">
          <rect x="8.4" y="21.5" width="3" height="7" rx="1" fill={coatDark} stroke={INK} strokeWidth="0.4" />
          <path d="M8 28.2 h4.2 v1.6 h-5 z" fill={INK} />
        </g>
        <g className="avatar-leg avatar-leg-r">
          <rect x="12.6" y="21.5" width="3" height="7" rx="1" fill={coatDark} stroke={INK} strokeWidth="0.4" />
          <path d="M12.2 28.2 h4.2 v1.6 h-5 z" fill={INK} />
        </g>
        {/* back arm */}
        <g className="avatar-arm avatar-arm-l">
          <rect x="4.6" y="13.2" width="2.6" height="8" rx="1.3" fill={coat} stroke={INK} strokeWidth="0.4" />
          <circle cx="5.9" cy="21.6" r="1.3" fill={skin} stroke={INK} strokeWidth="0.4" />
        </g>
        {/* coat */}
        <path d="M6.2 13.2 C6.2 11.4, 8 10.4, 12 10.4 C16 10.4, 17.8 11.4, 17.8 13.2 L18.6 22.4 L5.4 22.4 Z" fill={coat} stroke={INK} strokeWidth="0.5" />
        <path d="M10.2 10.8 L12 16.5 L13.8 10.8 L13.2 22.4 L10.8 22.4 Z" fill={vest} stroke={INK} strokeWidth="0.3" />
        <circle cx="12" cy="17.8" r="0.45" fill={INK} />
        <circle cx="12" cy="19.6" r="0.45" fill={INK} />
        <path d="M9.4 22.4 L12 18.8 L14.6 22.4" fill="none" stroke={coatDark} strokeWidth="0.5" />
        {/* front arm */}
        <g className="avatar-arm avatar-arm-r">
          <rect x="16.8" y="13.2" width="2.6" height="8" rx="1.3" fill={coat} stroke={INK} strokeWidth="0.4" />
          <circle cx="18.1" cy="21.6" r="1.3" fill={skin} stroke={INK} strokeWidth="0.4" />
        </g>
        {/* collar / neck */}
        <rect x="10.6" y="9" width="2.8" height="2.2" fill={skin} />
        <path d="M9.6 11.2 L12 12.6 L14.4 11.2" fill="#f8efdc" stroke={INK} strokeWidth="0.3" />
        {/* hair behind head */}
        {hair === 'long' && <path d="M6.6 7 C6.6 2.8, 17.4 2.8, 17.4 7 L17.8 13.4 L6.2 13.4 Z" fill={hairColor} />}
        {hair === 'tied' && <ellipse cx="12" cy="10.4" rx="1.6" ry="2" fill={hairColor} stroke={INK} strokeWidth="0.3" />}
        {/* head */}
        <circle cx="12" cy="6.4" r="4.3" fill={skin} stroke={INK} strokeWidth="0.5" />
        {/* face */}
        <circle cx="10.5" cy="6.3" r="0.45" fill={INK} />
        <circle cx="13.5" cy="6.3" r="0.45" fill={INK} />
        <path d="M10.7 8.3 Q12 9.4 13.3 8.3" fill="none" stroke={INK} strokeWidth="0.45" strokeLinecap="round" />
        {/* hair on top */}
        {hair === 'short' && <path d="M7.7 6.2 C7.7 2.4, 16.3 2.4, 16.3 6.2 C15 4.6, 9 4.6, 7.7 6.2 Z" fill={hairColor} />}
        {hair === 'long' && <path d="M7.7 6.4 C7.7 2.4, 16.3 2.4, 16.3 6.4 C15.2 4.4, 8.8 4.4, 7.7 6.4 Z" fill={hairColor} />}
        {hair === 'tied' && <path d="M7.7 6.4 C7.7 2.2, 16.3 2.2, 16.3 6.4 C15.4 4.2, 8.6 4.2, 7.7 6.4 Z" fill={hairColor} />}
        {hair === 'curly' && (
          <g fill={hairColor}>
            <circle cx="8.6" cy="4.6" r="1.6" />
            <circle cx="10.6" cy="3" r="1.7" />
            <circle cx="13.4" cy="3" r="1.7" />
            <circle cx="15.4" cy="4.6" r="1.6" />
            <circle cx="12" cy="2.6" r="1.6" />
          </g>
        )}
        {/* hats */}
        {hat === 'tricorn' && (
          <g>
            <path d="M5.2 4.6 C7 1.2, 17 1.2, 18.8 4.6 C16.6 3.6, 14.6 5.2, 12 5.2 C9.4 5.2, 7.4 3.6, 5.2 4.6 Z" fill="#2a2016" stroke={INK} strokeWidth="0.4" />
            <path d="M8.6 3.4 C9.2 0.6, 14.8 0.6, 15.4 3.4 Z" fill="#2a2016" stroke={INK} strokeWidth="0.4" />
            <path d="M5.4 4.5 C7 3.2, 9.6 3.4, 12 4.4" fill="none" stroke="#a8843a" strokeWidth="0.35" />
          </g>
        )}
        {hat === 'cap' && (
          <g>
            <path d="M7.4 5 C7.4 1.4, 16.6 1.4, 16.6 5 Z" fill="#3b2f1e" stroke={INK} strokeWidth="0.4" />
            <path d="M6.6 5 H17.4 V5.9 H6.6 Z" fill="#2a2016" />
          </g>
        )}
        {hat === 'bonnet' && (
          <g>
            <path d="M6.4 7.4 C5.4 1.6, 18.6 1.6, 17.6 7.4 C16.6 5.4, 7.4 5.4, 6.4 7.4 Z" fill="#f3e6c8" stroke={INK} strokeWidth="0.4" />
            <path d="M6.6 7.3 C7.6 6, 16.4 6, 17.4 7.3" fill="none" stroke="#7a2e0e" strokeWidth="0.6" />
            <path d="M15.6 7.4 L17.6 10.2 L15.2 9" fill="#7a2e0e" />
          </g>
        )}
        {hat === 'straw' && (
          <g>
            <ellipse cx="12" cy="4.4" rx="7.2" ry="1.5" fill="#d9c27a" stroke={INK} strokeWidth="0.4" />
            <path d="M8.2 4.2 C8.2 0.8, 15.8 0.8, 15.8 4.2 Z" fill="#e2cd88" stroke={INK} strokeWidth="0.4" />
            <path d="M8.2 3.6 H15.8" stroke="#6e2410" strokeWidth="0.6" />
          </g>
        )}
      </g>
    </svg>
  )
}
