import { useState } from 'react'
import { assetUrl } from '../content/assetUrl'
import { isPlaceholder, type ImageRef } from '../content/types'

interface Props {
  image: ImageRef | undefined
  /** What the image is for, shown in the placeholder box. */
  label: string
  className?: string
}

export function ContentImage({ image, label, className }: Props) {
  // If the file fails to load (bad path, outside host down), show the same
  // placeholder box instead of a collapsed broken image.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!image || isPlaceholder(image.src) || failedSrc === image.src) {
    return (
      <div className={`image-placeholder ${className ?? ''}`} role="img" aria-label={`Image coming soon: ${label}`}>
        <span aria-hidden="true">Image coming soon</span>
      </div>
    )
  }
  const alt = isPlaceholder(image.alt) ? `${label} (description coming soon)` : image.alt
  return <img className={className} src={assetUrl(image.src)} alt={alt} loading="lazy" decoding="async" onError={() => setFailedSrc(image.src)} />
}
