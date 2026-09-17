import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'wth.readAloud'

function readStoredPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

function storePreference(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* private mode or blocked storage: the toggle still works for this page load */
  }
}

/** True when this browser can speak. Checked once; the header hides the toggle otherwise. */
export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

/** Words that end with a period but do not end a sentence. */
const ABBREVIATION = /\b(Mr|Mrs|Ms|Dr|Prof|Gen|Col|Capt|Lt|Sgt|Maj|Rev|Hon|Jr|Sr|St|Mt|vs|etc|No|U\.S|a\.m|p\.m)\.$/i

/**
 * Split into sentence-sized chunks. Chrome silently stops long utterances,
 * and sentence pauses sound more natural. Keeps "Mr. Hale" together.
 */
function chunk(parts: string[]): string[] {
  const out: string[] = []
  for (const part of parts) {
    let current = ''
    for (const piece of part.split(/(?<=[.!?]["')\]]*)\s+(?=[A-Z0-9"'(])/)) {
      current = current ? `${current} ${piece}` : piece
      if (!ABBREVIATION.test(current)) {
        out.push(current)
        current = ''
      }
    }
    if (current) out.push(current)
  }
  return out
}

export interface ReadAloud {
  supported: boolean
  enabled: boolean
  speaking: boolean
  toggle: () => void
  /** Speak these parts now, replacing anything already queued. */
  speak: (parts: string[]) => void
  stop: () => void
}

export function useReadAloud(): ReadAloud {
  const [enabled, setEnabled] = useState(() => speechSupported && readStoredPreference())
  const [speaking, setSpeaking] = useState(false)
  const pending = useRef(0)

  const stop = useCallback(() => {
    if (!speechSupported) return
    pending.current = 0
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback((parts: string[]) => {
    if (!speechSupported) return
    stop()
    const sentences = chunk(parts)
    if (sentences.length === 0) return
    pending.current = sentences.length
    setSpeaking(true)
    const done = () => {
      pending.current -= 1
      if (pending.current <= 0) setSpeaking(false)
    }
    // A short delay after cancel() avoids a Chrome bug where the next
    // utterance is dropped.
    window.setTimeout(() => {
      for (const s of sentences) {
        const u = new SpeechSynthesisUtterance(s)
        u.lang = document.documentElement.lang || 'en-US'
        u.rate = 0.95 // a touch slower for younger readers
        u.onend = done
        u.onerror = done
        window.speechSynthesis.speak(u)
      }
    }, 60)
  }, [stop])

  const toggle = useCallback(() => {
    setEnabled((on) => {
      const next = !on
      storePreference(next)
      if (!next) stop()
      return next
    })
  }, [stop])

  // Stop talking if the student closes or leaves the tab.
  useEffect(() => {
    if (!speechSupported) return
    const onHide = () => window.speechSynthesis.cancel()
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [])

  return { supported: speechSupported, enabled, speaking, toggle, speak, stop }
}
