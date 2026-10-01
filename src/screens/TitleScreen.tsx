import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Avatar } from '../components/Avatar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { AvatarPrefs } from '../engine/avatarPrefs'
import { NAME_MAX, standing, type PlayerProfile } from '../engine/profile'

interface Props {
  profile: PlayerProfile | null
  avatarPrefs: AvatarPrefs
  /** New traveler signed the ledger with this nickname. */
  onCreate: (name: string) => void
  /** Returning traveler picks up where they left off. */
  onContinue: () => void
  /** Wipe the saved character and start over. */
  onReset: () => void
}

/** Night sky over a colonial skyline. Decorative only. */
function Skyline() {
  return (
    <svg className="title-skyline" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path
        d="M0 260 V190 h60 v-30 h40 v30 h50 v-55 l30 -25 l30 25 v55 h40 v-20 h70 v20 h30 V120 h8 V60 l6 -20 l6 20 v60 h8 v70 h60 v-40 l45 -30 l45 30 v40 h40 v-25 h80 v25 h35 v-60 h20 v-20 h20 v20 h20 v60 h50 v-30 l40 -28 l40 28 v30 h60 v-45 h55 v45 h40 V100 h6 V70 l6 -16 l6 16 v30 h6 v90 h70 v-35 h60 v35 h60 V260 Z"
        fill="#0d0a07"
      />
      <g fill="#f2c867" opacity="0.85">
        <rect x="170" y="150" width="8" height="10" />
        <rect x="190" y="150" width="8" height="10" />
        <rect x="455" y="170" width="9" height="11" />
        <rect x="725" y="165" width="8" height="10" />
        <rect x="870" y="185" width="8" height="10" />
        <rect x="1010" y="160" width="8" height="10" />
        <rect x="1110" y="175" width="8" height="10" />
      </g>
    </svg>
  )
}

export function TitleScreen({ profile, avatarPrefs, onCreate, onContinue, onReset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const trimmed = name.trim()
  const s = profile ? standing(profile) : null

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (trimmed) onCreate(trimmed)
  }

  return (
    <main className="title-screen">
      <div className="title-stars" aria-hidden="true" />
      <Skyline />
      <div className="title-inner">
        <p className="title-kicker">A journey through American history</p>
        <h1 ref={headingRef} tabIndex={-1} className="title-logo">
          Witness <span className="title-logo-small">to</span> History
        </h1>
        <p className="title-tagline">Walk the streets. Meet the people. Face the choices they faced.</p>

        <section className="ledger" aria-labelledby="ledger-title">
          <span className="ledger-corner ledger-corner-tl" aria-hidden="true" />
          <span className="ledger-corner ledger-corner-tr" aria-hidden="true" />
          <span className="ledger-corner ledger-corner-bl" aria-hidden="true" />
          <span className="ledger-corner ledger-corner-br" aria-hidden="true" />

          {profile && s ? (
            <>
              <h2 id="ledger-title" className="ledger-title">
                Welcome back, traveler
              </h2>
              <div className="ledger-returning">
                <div className="ledger-portrait">
                  <Avatar prefs={avatarPrefs} />
                </div>
                <div>
                  <p className="ledger-name">{profile.name}</p>
                  <p className="ledger-rank">
                    Level {s.level} · {s.rank}
                  </p>
                </div>
              </div>
              <button type="button" className="btn btn-game" onClick={onContinue}>
                Continue your journey
              </button>
              <button type="button" className="link-button ledger-reset" onClick={() => setConfirmReset(true)}>
                Not you? Start a new character
              </button>
            </>
          ) : (
            <form onSubmit={submit} noValidate>
              <h2 id="ledger-title" className="ledger-title">
                Sign the traveler's ledger
              </h2>
              <label htmlFor="traveler-name" className="ledger-label">
                What should we call you?
              </label>
              <input
                id="traveler-name"
                className="ledger-input"
                type="text"
                autoComplete="nickname"
                maxLength={NAME_MAX}
                placeholder="A nickname"
                value={name}
                aria-invalid={touched && !trimmed}
                aria-describedby="traveler-name-hint"
                onChange={(e) => setName(e.target.value)}
              />
              <p id="traveler-name-hint" className="ledger-hint">
                {touched && !trimmed ? 'Write a name to begin.' : "Enter your character's name."}
              </p>
              <button type="submit" className="btn btn-game">
                Create your character
              </button>
            </form>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Start a new character?"
        confirmLabel="Start over"
        cancelLabel="Keep my character"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          onReset()
        }}
      >
        <p>This clears the name, level, and seals saved on this device.</p>
      </ConfirmDialog>
    </main>
  )
}
