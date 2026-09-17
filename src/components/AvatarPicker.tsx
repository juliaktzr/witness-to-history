import { useEffect, useRef } from 'react'
import { Avatar } from './Avatar'
import {
  COAT_COLORS,
  HAIR_COLORS,
  HAIR_OPTIONS,
  HAT_OPTIONS,
  SKIN_TONES,
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

function Choices<T extends string>({
  legend,
  options,
  value,
  onPick,
}: {
  legend: string
  options: { id: T; label: string }[]
  value: T
  onPick: (id: T) => void
}) {
  return (
    <fieldset className="avatar-choices">
      <legend>{legend}</legend>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`btn btn-small ${value === o.id ? 'btn-primary' : ''}`}
          aria-pressed={value === o.id}
          onClick={() => onPick(o.id)}
        >
          {o.label}
        </button>
      ))}
    </fieldset>
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
          <Swatches legend="Skin" colors={SKIN_TONES} value={prefs.skin} onPick={(skin) => onChange({ ...prefs, skin })} />
          <Choices legend="Hair" options={HAIR_OPTIONS} value={prefs.hair} onPick={(hair) => onChange({ ...prefs, hair })} />
          <Swatches legend="Hair color" colors={HAIR_COLORS} value={prefs.hairColor} onPick={(hairColor) => onChange({ ...prefs, hairColor })} />
          <Choices legend="Hat" options={HAT_OPTIONS} value={prefs.hat} onPick={(hat) => onChange({ ...prefs, hat })} />
          <Swatches legend="Coat" colors={COAT_COLORS} value={prefs.coat} onPick={(coat) => onChange({ ...prefs, coat })} />
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
