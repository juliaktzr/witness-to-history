import { isPlaceholder, type Scenario } from '../content/types'
import { useOpenSource } from './SourceViewerContext'

interface Props {
  ids: string[]
  scenario: Scenario
}

/** "Based on" line under a text block. Each name opens the source panel. */
export function SourceList({ ids, scenario }: Props) {
  const openSource = useOpenSource()
  if (ids.length === 0) return null
  return (
    <p className="sources">
      <span className="sources-label">Based on: </span>
      {ids.map((id, i) => {
        const src = scenario.sources[id]
        const title = src && !isPlaceholder(src.title) ? src.title : id
        return (
          <span key={id}>
            {i > 0 && ', '}
            <button type="button" className="link-button" onClick={() => openSource(id)}>
              {title}
            </button>
          </span>
        )
      })}
    </p>
  )
}
