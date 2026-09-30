import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { AvatarBuilder } from '../components/AvatarPicker'
import type { LoadedScenario } from '../content/loadScenarios'
import type { AvatarPrefs, Expression, Pose } from '../engine/avatarPrefs'
import { NAME_MAX, standing, type PlayerProfile } from '../engine/profile'

/** Sticker poses, Bitmoji-style: your own character acting out a short line. Cosmetic only. */
const STICKERS: { id: string; pose: Pose; expression?: Expression; caption: string }[] = [
  { id: 'stand', pose: 'stand', caption: 'Ready' },
  { id: 'wave', pose: 'wave', expression: 'grin', caption: 'Good day!' },
  { id: 'cheer', pose: 'cheer', expression: 'grin', caption: 'Huzzah!' },
  { id: 'think', pose: 'think', expression: 'wonder', caption: 'Hmm…' },
  { id: 'resolve', pose: 'stand', expression: 'determined', caption: 'I shall decide.' },
]

interface Props {
  profile: PlayerProfile
  avatarPrefs: AvatarPrefs
  scenarios: LoadedScenario[]
  onChangePrefs: (prefs: AvatarPrefs) => void
  onRename: (name: string) => void
  onBegin: () => void
  onTitle: () => void
}

/**
 * The "player profile" dashboard: dress your character, see your level and
 * the seals you have earned, then set off. Everything here is cosmetic and
 * local; none of it changes what happens in a scenario.
 */
export function CharacterScreen({ profile, avatarPrefs, scenarios, onChangePrefs, onRename, onBegin, onTitle }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [stickerId, setStickerId] = useState('stand')
  const sticker = STICKERS.find((st) => st.id === stickerId) ?? STICKERS[0]
  const s = standing(profile)
  const playable = scenarios.flatMap((l) => (l.scenario ? [l.scenario] : []))
  const eraCount = playable.filter((sc) => profile.erasCompleted.includes(sc.id)).length

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <main className="dash">
      <nav className="dash-rail" aria-label="Game menu">
        <button type="button" className="rail-btn" onClick={onTitle}>
          <span className="rail-glyph" aria-hidden="true">
            ⌂
          </span>
          <span className="rail-label">Title</span>
        </button>
        <button type="button" className="rail-btn is-current" aria-current="page">
          <span className="rail-glyph" aria-hidden="true">
            ♜
          </span>
          <span className="rail-label">Character</span>
        </button>
        <button type="button" className="rail-btn" onClick={onBegin}>
          <span className="rail-glyph" aria-hidden="true">
            ✦
          </span>
          <span className="rail-label">Eras</span>
        </button>
      </nav>

      <section className="dash-stage" aria-labelledby="dash-title">
        <p className="dash-kicker">Character</p>
        <h1 id="dash-title" ref={headingRef} tabIndex={-1} className="dash-title">
          Make your character
        </h1>
        <p className="dash-sub">This is who walks through history with you. It does not change the story.</p>

        <div className="stage-spot">
          {sticker.id !== 'stand' && (
            <p className="stage-bubble" key={sticker.id} aria-hidden="true">
              {sticker.caption}
            </p>
          )}
          <div className="stage-figure">
            <Avatar prefs={avatarPrefs} pose={sticker.pose} expression={sticker.expression} title={`${profile.name}'s character`} />
          </div>
          <div className="stage-plinth" aria-hidden="true" />
          <p className="stage-nameplate">{profile.name}</p>
        </div>

        <fieldset className="sticker-row">
          <legend className="dash-panel-title">Strike a pose</legend>
          {STICKERS.map((st) => (
            <button
              key={st.id}
              type="button"
              className={`sticker ${stickerId === st.id ? 'is-selected' : ''}`}
              aria-pressed={stickerId === st.id}
              onClick={() => setStickerId(st.id)}
            >
              <span className="sticker-art" aria-hidden="true">
                <Avatar prefs={avatarPrefs} pose={st.pose} expression={st.expression} />
              </span>
              <span className="sticker-caption">{st.caption}</span>
            </button>
          ))}
        </fieldset>

        <div className="dash-panel wardrobe">
          <h2 className="dash-panel-title">Wardrobe</h2>
          <AvatarBuilder prefs={avatarPrefs} onChange={onChangePrefs} />
        </div>
      </section>

      <aside className="dash-profile" aria-label="Player profile">
        <div className="dash-panel player-card">
          <div className="player-head">
            <div className="level-medal" aria-hidden="true">
              <span className="level-medal-num">{s.level}</span>
            </div>
            <div className="player-id">
              <label htmlFor="player-name" className="player-name-label">
                Nickname
              </label>
              <input
                id="player-name"
                className="player-name-input"
                type="text"
                autoComplete="nickname"
                maxLength={NAME_MAX}
                value={profile.name}
                onChange={(e) => onRename(e.target.value)}
                onBlur={(e) => {
                  if (!e.target.value.trim()) onRename('Traveler')
                }}
              />
              <p className="player-rank">
                Level {s.level} · {s.rank}
              </p>
            </div>
          </div>

          <div className="xp">
            <div className="xp-row">
              <span>Experience</span>
              <span>{s.xpToNext} XP to Level {s.level + 1}</span>
            </div>
            <div
              className="xp-bar"
              role="progressbar"
              aria-label="Progress to next level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(s.progress * 100)}
            >
              <span className="xp-fill" style={{ width: `${Math.max(3, s.progress * 100)}%` }} />
            </div>
          </div>

          <dl className="stat-grid">
            <div className="stat">
              <dt>Eras witnessed</dt>
              <dd>
                {eraCount}
                <small> / {playable.length}</small>
              </dd>
            </div>
            <div className="stat">
              <dt>People met</dt>
              <dd>{profile.figuresMet.length}</dd>
            </div>
            <div className="stat">
              <dt>Total XP</dt>
              <dd>{s.xp}</dd>
            </div>
          </dl>
          <p className="xp-how">Talk to someone: +25 XP. Finish an era: +100 XP.</p>
        </div>

        <div className="dash-panel">
          <h2 className="dash-panel-title">Seals earned</h2>
          <p className="dash-panel-sub">Finish an era to press its wax seal.</p>
          <ul className="seal-list">
            {playable.map((sc) => {
              const earned = profile.erasCompleted.includes(sc.id)
              return (
                <li key={sc.id} className={`seal ${earned ? 'is-earned' : ''}`}>
                  <span className="seal-wax" aria-hidden="true">
                    {earned ? sc.year : '?'}
                  </span>
                  <span className="seal-label">
                    {sc.title}
                    <span className="seal-status">{earned ? 'Earned' : 'Not yet'}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <button type="button" className="btn btn-game dash-begin" onClick={onBegin}>
          Begin your journey →
        </button>
      </aside>
    </main>
  )
}
