import { isPlaceholder } from '../content/types'

interface Props {
  value: string | undefined
  /** Short label for what is missing, e.g. "outcome text". */
  label: string
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3'
  className?: string
}

/**
 * Renders authored text. If the cell is empty or TODO, shows an obvious
 * placeholder instead. The engine never fills in content itself.
 */
export function ContentText({ value, label, as: Tag = 'p', className }: Props) {
  if (isPlaceholder(value)) {
    return (
      <Tag className={`placeholder ${className ?? ''}`} role="note">
        Content coming soon: {label}
      </Tag>
    )
  }
  return <Tag className={className}>{value}</Tag>
}
