/**
 * Gathers the readable text of the current screen from the DOM, in reading
 * order. Content-agnostic: works for any scenario and any screen because it
 * looks at the rendered Frame, not at scenario data.
 */
export function collectScreenText(root: ParentNode = document): string[] {
  const frame = root.querySelector('main.frame')
  if (!frame) return []

  const parts: string[] = []
  let choiceNumber = 0
  const nodes = frame.querySelectorAll<HTMLElement>('h1, h2, p, label, button')

  for (const el of nodes) {
    if (el.closest('.frame-actions')) continue // Next / Back buttons are navigation, not content
    if (el.closest('.sources')) continue // citations are for the source viewer, not for listening
    if (el.closest('[aria-hidden="true"]')) continue
    if (el.tagName === 'BUTTON' && !el.classList.contains('btn-choice')) continue // card buttons repeat the name

    const text = (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (!text) continue

    if (el.classList.contains('btn-choice')) {
      choiceNumber += 1
      parts.push(`Choice ${choiceNumber}: ${text}`)
    } else {
      parts.push(text)
    }
  }
  return parts
}
