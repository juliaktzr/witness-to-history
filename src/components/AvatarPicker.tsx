import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Avatar } from './Avatar'
import {
  ACCESSORY_OPTIONS,
  COAT_COLORS,
  EXPRESSION_OPTIONS,
  HAIR_COLORS,
  HAIR_OPTIONS,
  HAT_OPTIONS,
  OUTFIT_OPTIONS,
  SKIN_TONES,
  randomPrefs,
  type AvatarPrefs,
} from '../engine/avatarPrefs'

interface Props {
  open: boolean
  prefs: AvatarPrefs
  onChange: (prefs: AvatarPrefs) => void
  onClose: () => void
}

function Swatches({
  legend,
  colors,
  value,
  onPick,
}: {
  legend: string
  colors: string[]
  value: string
  onPick: (c: string) => void
}) {
  return (
    <fieldset className="avatar-swatches">
      <legend>{legend}</legend>
      {colors.map((c, i) => (
        <button
          key={c}
          type="button"
          className={`avatar-swatch ${value === c ? 'avatar-swatch-selected' : ''}`}
          style={{ background: c }}
          aria-pressed={value === c}
          aria-label={`${legend} ${i + 1} of ${colors.length}`}
          onClick={() => onPick(c)}
        />
      ))}
    </fieldset>
  )
}

/**
 * A grid of picture tiles, each showing the student's own character already
 * wearing that option (the Bitmoji builder idea), so they pick by looking.
 */
function Tiles<K extends keyof AvatarPrefs>({
  legend,
  prefs,
  field,
  options,
  crop,
  onChange,
}: {
  legend: string
  prefs: AvatarPrefs
  field: K
  options: { id: AvatarPrefs[K]; label: string }[]
  crop: 'full' | 'bust' | 'head'
  onChange: (prefs: AvatarPrefs) => void
}) {
  return (
    <fieldset className={`avatar-tiles avatar-tiles-${crop}`}>
      <legend>{legend}</legend>
      {options.map((o) => {
        const selected = prefs[field] === o.id
        return (
          <button
            key={String(o.id)}
            type="button"
            className={`avatar-tile ${selected ? 'is-selected' : ''}`}
            aria-pressed={selected}
            onClick={() => onChange({ ...prefs, [field]: o.id })}
          >
            <span className="avatar-tile-art" aria-hidden="true">
              <Avatar prefs={{ ...prefs, [field]: o.id }} crop={crop} />
            </span>
            <span className="avatar-tile-label">{o.label}</span>
          </button>
        )
      })}
    </fieldset>
  )
}

const FRECKLE_OPTIONS: { id: boolean; label: string }[] = [
  { id: false, label: 'No freckles' },
  { id: true, label: 'Freckles' },
]

const TABS = [
  { id: 'face', label: 'Face', glyph: '☺' },
  { id: 'hair', label: 'Hair', glyph: '〰' },
  { id: 'hat', label: 'Hat', glyph: '⛉' },
  { id: 'outfit', label: 'Outfit', glyph: '♦' },
  { id: 'extras', label: 'Extras', glyph: '✧' },
] as const
type TabId = (typeof TABS)[number]['id']

/** The wardrobe: tabbed categories of picture tiles. Used in the picker modal and on the character screen. */
export function AvatarBuilder({ prefs, onChange }: { prefs: AvatarPrefs; onChange: (prefs: AvatarPrefs) => void }) {
  const [tab, setTab] = useState<TabId>('face')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Arrow keys move between tabs (standard tablist behavior).
  function onTabKey(e: KeyboardEvent, i: number) {
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length
    if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = TABS.length - 1
    if (next < 0) return
    e.preventDefault()
    setTab(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="avatar-builder">
      <div className="builder-top">
        <div className="builder-tabs" role="tablist" aria-label="Wardrobe categories">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`builder-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="builder-panel"
              tabIndex={tab === t.id ? 0 : -1}
              className="builder-tab"
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              <span className="builder-tab-glyph" aria-hidden="true">
                {t.glyph}
              </span>
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" className="builder-shuffle" onClick={() => onChange(randomPrefs())}>
          <span aria-hidden="true">🎲</span> Surprise me
        </button>
      </div>

      <div id="builder-panel" role="tabpanel" aria-labelledby={`builder-tab-${tab}`} className="builder-panel">
        {tab === 'face' && (
          <>
            <Swatches legend="Skin" colors={SKIN_TONES} value={prefs.skin} onPick={(skin) => onChange({ ...prefs, skin })} />
            <Tiles legend="Expression" prefs={prefs} field="expression" options={EXPRESSION_OPTIONS} crop="head" onChange={onChange} />
            <Tiles legend="Freckles" prefs={prefs} field="freckles" options={FRECKLE_OPTIONS} crop="head" onChange={onChange} />
          </>
        )}
        {tab === 'hair' && (
          <>
            <Swatches legend="Hair color" colors={HAIR_COLORS} value={prefs.hairColor} onPick={(hairColor) => onChange({ ...prefs, hairColor })} />
            <Tiles legend="Hair style" prefs={{ ...prefs, hat: 'none' }} field="hair" options={HAIR_OPTIONS} crop="head" onChange={(p) => onChange({ ...p, hat: prefs.hat })} />
          </>
        )}
        {tab === 'hat' && <Tiles legend="Hat" prefs={prefs} field="hat" options={HAT_OPTIONS} crop="head" onChange={onChange} />}
        {tab === 'outfit' && (
          <>
            <Swatches legend="Outfit color" colors={COAT_COLORS} value={prefs.coat} onPick={(coat) => onChange({ ...prefs, coat })} />
            <Tiles legend="Outfit" prefs={prefs} field="outfit" options={OUTFIT_OPTIONS} crop="full" onChange={onChange} />
          </>
        )}
        {tab === 'extras' && <Tiles legend="Extras" prefs={prefs} field="accessory" options={ACCESSORY_OPTIONS} crop="bust" onChange={onChange} />}
      </div>
    </div>
  )
}

/** Modal for dressing your character. Cosmetic only; it never changes the story. */
export function AvatarPicker({ open, prefs, onChange, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={ref} className="source-panel avatar-picker" aria-labelledby="avatar-picker-title" onClose={onClose}>
      {open && (
        <div className="source-panel-body">
          <h2 id="avatar-picker-title" className="source-panel-title">
            Dress your character
          </h2>
          <p className="muted">This is you on the town map. It does not change the story.</p>
          <div className="avatar-preview">
            <Avatar prefs={prefs} title="Your character" />
          </div>
          <AvatarBuilder prefs={prefs} onChange={onChange} />
          <div className="frame-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
