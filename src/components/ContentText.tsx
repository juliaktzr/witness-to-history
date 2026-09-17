import { isPlaceholder } from '../content/types'

interface Props {
  value: string | undefined
  /** Short label for what is missing, e.g. "outcome text". */
  label: string
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3'
  className?: string
  id?: string
}

/**
 * Renders authored text. If the cell is empty or TODO, shows an obvious
 * placeholder instead. The engine never fills in content itself.
 */
export function ContentText({ value, label, as: Tag = 'p', className, id }: Props) {
  if (isPlaceholder(value)) {
    return (
      <Tag id={id} className={`placeholder ${className ?? ''}`} role={Tag === 'span' ? undefined : 'note'}>
        Content coming soon: {label}
      </Tag>
    )
  }
  return (
    <Tag id={id} className={className}>
      {value}
    </Tag>
  )
}
