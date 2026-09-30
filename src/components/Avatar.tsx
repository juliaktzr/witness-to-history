import type { AvatarPrefs, Expression, Pose } from '../engine/avatarPrefs'

interface Props {
  prefs: AvatarPrefs
  /** Set for the one place this icon is meaningful on its own (the picker preview). */
  title?: string
  /** Arm pose for stickers. Defaults to standing. */
  pose?: Pose
  /** Overrides the saved expression (stickers). */
  expression?: Expression
  /** 'head' frames head and shoulders (tiles, header chip); 'bust' frames down to the waist. */
  crop?: 'full' | 'bust' | 'head'
}

const INK = '#1d1a14'
const LINEN = '#f6efdf'

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount)))
  const r = ch(n >> 16)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

const VIEWBOX = { full: '0 0 24 32', bust: '2 -0.8 20 24', head: '3.5 -0.8 17 16' }

/** Shoulder pivots, and how far each pose swings each arm (degrees, SVG clockwise). */
const BACK_SHOULDER = '5.9 13.8'
const FRONT_SHOULDER = '18.1 13.8'
const POSE_ANGLES: Record<Pose, { back: number; front: number }> = {
  stand: { back: 0, front: 0 },
  wave: { back: 0, front: -150 },
  cheer: { back: 150, front: -150 },
  think: { back: 0, front: 124 },
}

function Face({ expression, browColor }: { expression: Expression; browColor: string }) {
  const lift = expression === 'wonder' ? -0.45 : 0
  const brows =
    expression === 'determined' ? (
      <>
        <path d="M9.5 5.1 L11.3 5.8" />
        <path d="M12.7 5.8 L14.5 5.1" />
      </>
    ) : (
      <>
        <path d={`M9.6 ${5.6 + lift} Q10.5 ${5.05 + lift} 11.3 ${5.45 + lift}`} />
        <path d={`M12.7 ${5.45 + lift} Q13.5 ${5.05 + lift} 14.4 ${5.6 + lift}`} />
      </>
    )
  let mouth
  switch (expression) {
    case 'grin':
      mouth = (
        <>
          <path d="M10.4 8.05 Q12 10.5 13.6 8.05 Z" fill="#6b1d14" stroke={INK} strokeWidth="0.35" strokeLinejoin="round" />
          <path d="M10.8 8.25 H13.2" stroke="#fff" strokeWidth="0.45" />
        </>
      )
      break
    case 'calm':
      mouth = <path d="M10.9 8.6 Q12 8.95 13.1 8.6" fill="none" stroke={INK} strokeWidth="0.45" strokeLinecap="round" />
      break
    case 'wonder':
      mouth = <ellipse cx="12" cy="8.75" rx="0.6" ry="0.75" fill="#6b1d14" stroke={INK} strokeWidth="0.3" />
      break
    case 'determined':
      mouth = <path d="M10.8 8.7 Q12 8.9 13.2 8.45" fill="none" stroke={INK} strokeWidth="0.5" strokeLinecap="round" />
      break
    default:
      mouth = <path d="M10.7 8.3 Q12 9.4 13.3 8.3" fill="none" stroke={INK} strokeWidth="0.45" strokeLinecap="round" />
  }
  return (
    <g>
      {/* eyes: white, pupil, glint */}
      <ellipse cx="10.5" cy="6.5" rx="0.72" ry="0.62" fill="#fff" />
      <ellipse cx="13.5" cy="6.5" rx="0.72" ry="0.62" fill="#fff" />
      <circle cx="10.6" cy="6.55" r="0.44" fill={INK} />
      <circle cx="13.6" cy="6.55" r="0.44" fill={INK} />
      <circle cx="10.75" cy="6.38" r="0.13" fill="#fff" />
      <circle cx="13.75" cy="6.38" r="0.13" fill="#fff" />
      <g fill="none" stroke={browColor} strokeWidth="0.5" strokeLinecap="round">
        {brows}
      </g>
      <path d="M11.8 7.2 Q12.3 7.6 11.9 7.8" fill="none" stroke={INK} strokeWidth="0.25" strokeLinecap="round" opacity="0.6" />
      {mouth}
    </g>
  )
}

/**
 * The student's little figure: head, hair, hat, outfit, arms, legs. Pure SVG,
 * so it scales cleanly and costs nothing. Legs and arms carry class names so
 * CSS can swing them while walking; poses rotate an outer group so the two
 * never fight over the same transform.
 */
export function Avatar({ prefs, title, pose = 'stand', expression, crop = 'full' }: Props) {
  const { skin, coat, hair, hairColor, hat, outfit, accessory, freckles } = prefs
  const face = expression ?? prefs.expression
  const coatDark = shade(coat, -40)
  const vest = shade(coat, 70)
  const skinDark = shade(skin, -45)
  const brow = shade(hairColor, hairColor === '#ece6d8' || hairColor === '#b5b5b5' ? -70 : -25)
  const angles = POSE_ANGLES[pose]
  const sleeve = outfit === 'waistcoat' ? LINEN : coat
  const legColor = outfit === 'waistcoat' ? shade(coat, -55) : coatDark

  const arm = (side: 'l' | 'r') => {
    const x = side === 'l' ? 4.6 : 16.8
    return (
      <g transform={`rotate(${side === 'l' ? angles.back : angles.front} ${side === 'l' ? BACK_SHOULDER : FRONT_SHOULDER})`}>
        <g className={`avatar-arm avatar-arm-${side}`}>
          <rect x={x} y="13.2" width="2.6" height="8" rx="1.3" fill={sleeve} stroke={INK} strokeWidth="0.4" />
          {outfit === 'gown' && <rect x={x} y="17.4" width="2.6" height="1" fill={LINEN} stroke={INK} strokeWidth="0.25" />}
          <circle cx={x + 1.3} cy="21.6" r="1.3" fill={skin} stroke={INK} strokeWidth="0.4" />
        </g>
      </g>
    )
  }

  return (
    <svg
      viewBox={VIEWBOX[crop]}
      width="100%"
      height="100%"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className="avatar-svg"
    >
      {crop === 'full' && <ellipse cx="12" cy="30.6" rx="6" ry="1.2" fill="#000" opacity="0.22" />}
      <g className="avatar-figure">
        {/* legs (hips at y=22) */}
        <g className="avatar-leg avatar-leg-l">
          <rect x="8.4" y="21.5" width="3" height="7" rx="1" fill={legColor} stroke={INK} strokeWidth="0.4" />
          <path d="M8 28.2 h4.2 v1.6 h-5 z" fill={INK} />
        </g>
        <g className="avatar-leg avatar-leg-r">
          <rect x="12.6" y="21.5" width="3" height="7" rx="1" fill={legColor} stroke={INK} strokeWidth="0.4" />
          <path d="M12.2 28.2 h4.2 v1.6 h-5 z" fill={INK} />
        </g>

        {arm('l')}

        {/* body */}
        {outfit === 'coat' && (
          <>
            <path d="M6.2 13.2 C6.2 11.4, 8 10.4, 12 10.4 C16 10.4, 17.8 11.4, 17.8 13.2 L18.6 22.4 L5.4 22.4 Z" fill={coat} stroke={INK} strokeWidth="0.5" />
            <path d="M10.2 10.8 L12 16.5 L13.8 10.8 L13.2 22.4 L10.8 22.4 Z" fill={vest} stroke={INK} strokeWidth="0.3" />
            <circle cx="12" cy="17.8" r="0.45" fill={INK} />
            <circle cx="12" cy="19.6" r="0.45" fill={INK} />
            <path d="M9.4 22.4 L12 18.8 L14.6 22.4" fill="none" stroke={coatDark} strokeWidth="0.5" />
          </>
        )}
        {outfit === 'waistcoat' && (
          <>
            <path d="M6.2 13.2 C6.2 11.4, 8 10.4, 12 10.4 C16 10.4, 17.8 11.4, 17.8 13.2 L17.6 21.6 L6.4 21.6 Z" fill={LINEN} stroke={INK} strokeWidth="0.5" />
            <path d="M7 12.4 C7.4 11.2, 9 10.9, 10.3 10.9 L12 15.2 L13.7 10.9 C15 10.9, 16.6 11.2, 17 12.4 L17.4 21.8 L12 22.8 L6.6 21.8 Z" fill={coat} stroke={INK} strokeWidth="0.45" />
            <path d="M12 15.2 V22.6" stroke={coatDark} strokeWidth="0.35" />
            <circle cx="12.6" cy="16.8" r="0.4" fill="#d9b45a" />
            <circle cx="12.6" cy="18.6" r="0.4" fill="#d9b45a" />
            <circle cx="12.6" cy="20.4" r="0.4" fill="#d9b45a" />
          </>
        )}
        {outfit === 'gown' && (
          <>
            <path d="M7.4 16.4 L3.8 29.4 Q12 30.8 20.2 29.4 L16.6 16.4 Z" fill={coat} stroke={INK} strokeWidth="0.5" />
            <path d="M6.4 13.2 C6.4 11.4, 8 10.4, 12 10.4 C16 10.4, 17.6 11.4, 17.6 13.2 L16.8 17.2 L7.2 17.2 Z" fill={coat} stroke={INK} strokeWidth="0.5" />
            <path d="M10.2 11 L12 17 L13.8 11 Z" fill={vest} stroke={INK} strokeWidth="0.3" />
            <path d="M10.9 12.6 L13.1 13.4 M10.9 14.2 L12.9 14.9 M13.1 12.6 L10.9 13.4 M13.1 14.2 L11.1 14.9" stroke={coatDark} strokeWidth="0.25" />
            <path d="M9 17.2 L7.8 28.8 Q12 29.6 16.2 28.8 L15 17.2 Z" fill={LINEN} stroke={INK} strokeWidth="0.4" />
            <path d="M7 17.2 H17" stroke={coatDark} strokeWidth="0.6" />
            <path d="M10.4 20 Q12 20.5 13.6 20" fill="none" stroke="#d8ccb0" strokeWidth="0.3" />
          </>
        )}
        {outfit === 'cloak' && (
          <>
            <path d="M6.2 13.2 C6.2 11.4, 8 10.4, 12 10.4 C16 10.4, 17.8 11.4, 17.8 13.2 L18.6 22.4 L5.4 22.4 Z" fill={vest} stroke={INK} strokeWidth="0.5" />
            <path d="M6 11.6 C8 10.2, 16 10.2, 18 11.6 L20.4 24 Q12 25.4 3.6 24 Z" fill={shade(coat, -15)} stroke={INK} strokeWidth="0.5" />
            <path d="M12 11.6 L11 24.8 M12 11.6 L13 24.8" stroke={coatDark} strokeWidth="0.35" />
            <path d="M6.4 11.4 C8.6 13.4, 15.4 13.4, 17.6 11.4 C15.8 12, 8.2 12, 6.4 11.4 Z" fill={coatDark} />
            <circle cx="12" cy="12.4" r="0.7" fill="#d9b45a" stroke={INK} strokeWidth="0.25" />
          </>
        )}

        {accessory === 'satchel' && (
          <g>
            <path d="M7.2 11.6 L16.8 20" stroke="#5a3b1c" strokeWidth="0.9" strokeLinecap="round" />
            <rect x="14.6" y="19" width="4.2" height="3.4" rx="0.6" fill="#7a5128" stroke={INK} strokeWidth="0.35" />
            <path d="M14.6 19.9 H18.8" stroke="#5a3b1c" strokeWidth="0.35" />
          </g>
        )}

        {pose === 'stand' && arm('r')}

        {/* collar / neck */}
        <rect x="10.6" y="9" width="2.8" height="2.2" fill={skin} />
        <path d="M9.6 11.2 L12 12.6 L14.4 11.2" fill={LINEN} stroke={INK} strokeWidth="0.3" />
        {accessory === 'neckerchief' && (
          <g>
            <path d="M9.4 11 Q12 12.2 14.6 11 L12 14.4 Z" fill="#a8322a" stroke={INK} strokeWidth="0.3" />
            <circle cx="12" cy="12.1" r="0.55" fill="#8a2520" />
          </g>
        )}
        {accessory === 'fichu' && (
          <path d="M6.8 11.8 C8.6 11, 10.6 11.2, 12 13.6 C13.4 11.2, 15.4 11, 17.2 11.8 L15.8 15.4 L12 16.8 L8.2 15.4 Z" fill={LINEN} stroke={INK} strokeWidth="0.35" />
        )}

        {/* hair behind head */}
        {hair === 'long' && (
          // Two locks falling onto the shoulders, with the neck showing between them.
          <path
            d="M6.8 7 C6.8 2.8, 17.2 2.8, 17.2 7 L17.5 12.9 Q16.4 13.8 15.3 12.7 L15 9.4 L9 9.4 L8.7 12.7 Q7.6 13.8 6.5 12.9 Z"
            fill={hairColor}
            stroke={INK}
            strokeWidth="0.3"
          />
        )}
        {(hair === 'tied' || hair === 'rolled') && (
          <g>
            <ellipse cx="12" cy="10.4" rx="1.6" ry="2" fill={hairColor} stroke={INK} strokeWidth="0.3" />
            {hair === 'rolled' && <path d="M10.8 9.4 L12 10 L13.2 9.4 L13.2 10.6 L12 10 L10.8 10.6 Z" fill={INK} />}
          </g>
        )}
        {hair === 'bun' && <circle cx="12" cy="2.3" r="1.9" fill={hairColor} stroke={INK} strokeWidth="0.3" />}

        {/* head */}
        <circle cx="12" cy="6.4" r="4.3" fill={skin} stroke={INK} strokeWidth="0.5" />
        <ellipse cx="7.75" cy="6.9" rx="0.55" ry="0.8" fill={skin} stroke={INK} strokeWidth="0.35" />
        <ellipse cx="16.25" cy="6.9" rx="0.55" ry="0.8" fill={skin} stroke={INK} strokeWidth="0.35" />
        <ellipse cx="9.3" cy="7.9" rx="0.75" ry="0.42" fill="#e0806a" opacity="0.35" />
        <ellipse cx="14.7" cy="7.9" rx="0.75" ry="0.42" fill="#e0806a" opacity="0.35" />
        {freckles && (
          <g fill={skinDark}>
            <circle cx="9.1" cy="7.5" r="0.16" />
            <circle cx="9.7" cy="7.8" r="0.16" />
            <circle cx="9.3" cy="8.1" r="0.16" />
            <circle cx="14.9" cy="7.5" r="0.16" />
            <circle cx="14.3" cy="7.8" r="0.16" />
            <circle cx="14.7" cy="8.1" r="0.16" />
          </g>
        )}

        {/* hair on top */}
        {hair === 'short' && <path d="M7.7 6.2 C7.7 2.4, 16.3 2.4, 16.3 6.2 C15 4.6, 9 4.6, 7.7 6.2 Z" fill={hairColor} />}
        {(hair === 'long' || hair === 'braid') && <path d="M7.7 6.4 C7.7 2.4, 16.3 2.4, 16.3 6.4 C15.2 4.4, 8.8 4.4, 7.7 6.4 Z" fill={hairColor} />}
        {(hair === 'tied' || hair === 'bun') && <path d="M7.7 6.4 C7.7 2.2, 16.3 2.2, 16.3 6.4 C15.4 4.2, 8.6 4.2, 7.7 6.4 Z" fill={hairColor} />}
        {hair === 'curly' && (
          <g fill={hairColor}>
            <circle cx="8.6" cy="4.6" r="1.6" />
            <circle cx="10.6" cy="3" r="1.7" />
            <circle cx="13.4" cy="3" r="1.7" />
            <circle cx="15.4" cy="4.6" r="1.6" />
            <circle cx="12" cy="2.6" r="1.6" />
          </g>
        )}
        {hair === 'rolled' && (
          <g fill={hairColor} stroke={INK} strokeWidth="0.25">
            <path d="M7.9 5.8 C7.9 2.2, 16.1 2.2, 16.1 5.8 C15 4.3, 9 4.3, 7.9 5.8 Z" strokeWidth="0" />
            <ellipse cx="7.7" cy="5.9" rx="1.15" ry="0.65" />
            <ellipse cx="7.7" cy="7.2" rx="1.15" ry="0.65" />
            <ellipse cx="16.3" cy="5.9" rx="1.15" ry="0.65" />
            <ellipse cx="16.3" cy="7.2" rx="1.15" ry="0.65" />
          </g>
        )}
        {hair === 'braid' && (
          <g fill={hairColor} stroke={INK} strokeWidth="0.25">
            {[8.4, 9.9, 11.4, 12.9, 14.4].map((y, i) => (
              <ellipse key={y} cx={8.2 - i * 0.15} cy={y} rx="0.95" ry="0.85" />
            ))}
            <path d="M7.5 15.3 L8.2 16.4 L8.9 15.3 Z" fill="#a8322a" />
          </g>
        )}

        <Face expression={face} browColor={brow} />

        {accessory === 'spectacles' && (
          <g fill="none" stroke="#7a6232" strokeWidth="0.32">
            <circle cx="10.5" cy="6.5" r="1.05" />
            <circle cx="13.5" cy="6.5" r="1.05" />
            <path d="M11.55 6.4 Q12 6.1 12.45 6.4 M9.45 6.3 L7.9 6" />
            <path d="M14.55 6.3 L16.1 6" />
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
        {hat === 'mobcap' && (
          <g>
            <path d="M6.9 5.6 C5.8 0.6, 18.2 0.6, 17.1 5.6 Z" fill="#fbf6ea" stroke={INK} strokeWidth="0.4" />
            {/* ruffled frill */}
            <path
              d="M6.6 5.5 q0.65 1.1 1.3 0 q0.65 1.1 1.3 0 q0.65 1.1 1.3 0 q0.65 1.1 1.3 0 q0.65 1.1 1.3 0 q0.65 1.1 1.3 0 q0.65 1.1 1.3 0 q0.65 1.1 1.3 0 L17.2 5 L6.8 5 Z"
              fill="#fbf6ea"
              stroke={INK}
              strokeWidth="0.3"
              strokeLinejoin="round"
            />
            <path d="M7.4 4.4 C10 3.7, 14 3.7, 16.6 4.4" fill="none" stroke={coat} strokeWidth="0.6" />
          </g>
        )}
        {hat === 'straw' && (
          <g>
            <ellipse cx="12" cy="4.4" rx="7.2" ry="1.5" fill="#d9c27a" stroke={INK} strokeWidth="0.4" />
            <path d="M8.2 4.2 C8.2 0.8, 15.8 0.8, 15.8 4.2 Z" fill="#e2cd88" stroke={INK} strokeWidth="0.4" />
            <path d="M8.2 3.6 H15.8" stroke="#6e2410" strokeWidth="0.6" />
          </g>
        )}
        {/* A raised front arm (wave, cheer, think) goes in front of the face. */}
        {pose !== 'stand' && arm('r')}
      </g>
    </svg>
  )
}
