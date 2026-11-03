import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export interface MenuItem {
  id: string
  label: string
  /** Decorative symbol shown before the label. */
  glyph: string
  onSelect: () => void
  /** Set for on/off items (read aloud); shown as a switch and announced as checked. */
  checked?: boolean
  /** Destructive items (start over) are set apart and tinted red. */
  danger?: boolean
}

interface Props {
  items: MenuItem[]
  /** Small dot on the menu button, e.g. while read aloud is on, so the state is visible with the menu closed. */
  indicator?: string
  className?: string
}

/**
 * The ☰ menu: one place for Home, character, read aloud, and start over.
 * Keyboard: Enter/Space/ArrowDown opens and focuses the first item, arrows
 * move, Home/End jump, Escape or Tab closes and returns focus to the button.
 */
export function GameMenu({ items, indicator, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const menuId = useId()

  // Close on a click or tap anywhere outside the menu.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus()
  }, [open])

  function close(returnFocus = true) {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    const list = itemRefs.current.filter((el): el is HTMLButtonElement => !!el)
    const i = list.indexOf(document.activeElement as HTMLButtonElement)
    const go = (n: number) => list[(n + list.length) % list.length]?.focus()
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(list.length - 1)
    else if (e.key === 'Escape') close()
    else if (e.key === 'Tab') close(false)
    else return
    if (e.key !== 'Tab') e.preventDefault()
  }

  return (
    <div className={`game-menu ${className}`} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="game-menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        <span className="game-menu-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="game-menu-text">Menu</span>
        {indicator && <span className="game-menu-indicator" title={indicator} aria-label={indicator} />}
      </button>

      {open && (
        <div id={menuId} className="game-menu-list" role="menu" aria-label="Menu" onKeyDown={onMenuKey}>
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role={item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
              aria-checked={item.checked}
              tabIndex={-1}
              className={`game-menu-item ${item.danger ? 'is-danger' : ''}`}
              onClick={() => {
                close()
                item.onSelect()
              }}
            >
              <span className="game-menu-glyph" aria-hidden="true">
                {item.glyph}
              </span>
              <span className="game-menu-label">{item.label}</span>
              {item.checked !== undefined && (
                <span className={`game-menu-switch ${item.checked ? 'is-on' : ''}`} aria-hidden="true">
                  {item.checked ? 'On' : 'Off'}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
