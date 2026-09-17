import type { Scenario } from './types'
import { validateScenario, type ValidationResult } from './validate'

export interface LoadedScenario {
  /** File name without extension, used as a stable key even if the JSON is broken. */
  file: string
  scenario: Scenario | null
  validation: ValidationResult
}

// Vite bundles every JSON file in content/scenarios at build time.
// Adding a new era = adding a new file. No code changes needed.
const modules = import.meta.glob('../../content/scenarios/*.json', {
  eager: true,
  import: 'default',
})

export function loadScenarios(): LoadedScenario[] {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const file = path.split('/').pop()!.replace(/\.json$/, '')
      const validation = validateScenario(raw)
      const scenario = validation.errors.length === 0 ? (raw as Scenario) : null
      return { file, scenario, validation }
    })
    .sort((a, b) => a.file.localeCompare(b.file))
}
