import { splitTerms } from '../content/glossary'
import { isPlaceholder } from '../content/types'
import { useGlossary } from './GlossaryContext'

interface Props {
  value: string | undefined
  /** Short label for what is missing, e.g. "outcome text". */
  label: string
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3'
  className?: string
  id?: string
  /** Underline glossary terms so students can tap them for a definition. For story text only. */
  terms?: boolean
}

/**
 * Renders authored text. If the cell is empty or TODO, shows an obvious
 * placeholder instead. The engine never fills in content itself.
 */
export function ContentText({ value, label, as: Tag = 'p', className, id, terms }: Props) {
  const { matcher, openTerm } = useGlossary()
  if (isPlaceholder(value)) {
    return (
      <Tag id={id} className={`placeholder ${className ?? ''}`} role={Tag === 'span' ? undefined : 'note'}>
        Content coming soon: {label}
      </Tag>
    )
  }
  return (
    <Tag id={id} className={`content-text ${className ?? ''}`}>
      {terms && matcher && value
        ? splitTerms(value, matcher).map((part, i) =>
            typeof part === 'string' ? (
              part
            ) : (
              <button
                key={i}
                type="button"
                className="term"
                aria-haspopup="dialog"
                aria-label={`${part.text}, what does it mean?`}
                onClick={() => openTerm(part.id)}
              >
                {part.text}
              </button>
            ),
          )
        : value}
    </Tag>
  )
}
