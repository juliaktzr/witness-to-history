import { isPlaceholder } from '../content/types'

interface Props {
  /** Authored text. May be empty or TODO. */
  text: string | undefined
  /** What is missing when text is a placeholder, e.g. "choice 2". */
  label: string
  onClick: () => void
}

/**
 * A large, full width answer button for dialogue choices and decision options.
 * The visible text is a direct text node of the <button> so every browser and
 * screen reader computes the same accessible name. Placeholders get an explicit
 * aria-label because their wrapper span has no accessible role.
 */
export function ChoiceButton({ text, label, onClick }: Props) {
  if (isPlaceholder(text)) {
    const message = `Content coming soon: ${label}`
    return (
      <button type="button" className="btn btn-choice" aria-label={message} onClick={onClick}>
        <span className="placeholder" aria-hidden="true">
          {message}
        </span>
      </button>
    )
  }
  return (
    <button type="button" className="btn btn-choice" onClick={onClick}>
      {text}
    </button>
  )
}
