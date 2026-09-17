import { isPlaceholder, type Scenario } from '../content/types'

interface Props {
  ids: string[]
  scenario: Scenario
}

/** Small "Based on" line under a text block. Full source viewer is Phase 2. */
export function SourceList({ ids, scenario }: Props) {
  if (ids.length === 0) return null
  return (
    <p className="sources">
      <span className="sources-label">Based on: </span>
      {ids.map((id, i) => {
        const src = scenario.sources[id]
        const title = src && !isPlaceholder(src.title) ? src.title : id
        const link = src && !isPlaceholder(src.url)
        return (
          <span key={id}>
            {i > 0 && ', '}
            {link ? (
              <a href={src.url} target="_blank" rel="noreferrer">
                {title}
              </a>
            ) : (
              title
            )}
          </span>
        )
      })}
    </p>
  )
}
