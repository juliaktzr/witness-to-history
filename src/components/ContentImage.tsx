import { assetUrl } from '../content/assetUrl'
import { isPlaceholder, type ImageRef } from '../content/types'

interface Props {
  image: ImageRef | undefined
  /** What the image is for, shown in the placeholder box. */
  label: string
  className?: string
}

export function ContentImage({ image, label, className }: Props) {
  if (!image || isPlaceholder(image.src)) {
    return (
      <div className={`image-placeholder ${className ?? ''}`} role="img" aria-label={`Image coming soon: ${label}`}>
        <span aria-hidden="true">Image coming soon</span>
      </div>
    )
  }
  const alt = isPlaceholder(image.alt) ? `${label} (description coming soon)` : image.alt
  return <img className={className} src={assetUrl(image.src)} alt={alt} loading="lazy" decoding="async" />
}
