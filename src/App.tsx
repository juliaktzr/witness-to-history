import { useEffect, useMemo, useReducer, useState } from 'react'
import { AboutDialog } from './components/AboutDialog'
import { AppHeader, FloatingMenu } from './components/AppHeader'
import { AvatarPicker } from './components/AvatarPicker'
import { ConfirmDialog } from './components/ConfirmDialog'
import type { MenuItem } from './components/GameMenu'
import { GlossaryContext } from './components/GlossaryContext'
import { GlossaryDialog } from './components/GlossaryDialog'
import { JournalDialog } from './components/JournalDialog'
import { JourneyContext } from './components/JourneyContext'
import { SourcePanel } from './components/SourcePanel'
import { SourceViewerContext } from './components/SourceViewerContext'
import { WarningBanner } from './components/WarningBanner'
import { useTheme } from './engine/theme'
import { clearAllNotes, loadNotes, saveNotes, type Notes } from './engine/notes'
import { buildMatcher } from './content/glossary'
import { loadScenarios } from './content/loadScenarios'
import { DEFAULT_PREFS, clearAvatarPrefs, loadAvatarPrefs, saveAvatarPrefs, type AvatarPrefs } from './engine/avatarPrefs'
import {
  clearProfile,
  loadProfile,
  newProfile,
  saveProfile,
  withEraCompleted,
  withFiguresMet,
  type PlayerProfile,
} from './engine/profile'
import { initialState, reducer } from './engine/state'
import { collectScreenText } from './speech/collectScreenText'
import { useReadAloud } from './speech/useReadAloud'
import { Briefing } from './screens/Briefing'
import { CharacterScreen } from './screens/CharacterScreen'
import { Decision } from './screens/Decision'
import { Dialogue } from './screens/Dialogue'
import { EraSelect } from './screens/EraSelect'
import { FigureHub } from './screens/FigureHub'
import { Outcome } from './screens/Outcome'
import { Reflection } from './screens/Reflection'
import { Reveal } from './screens/Reveal'
import { TitleScreen } from './screens/TitleScreen'

/** Before the eras: the title ("login") screen, then the character dashboard. */
type Stage = 'title' | 'character' | 'game'

export default function App() {
  const scenarios = useMemo(loadScenarios, [])
  const [state, dispatch] = useReducer(reducer, initialState)
  const { scenario, screen } = state
  const readAloud = useReadAloud()
  const lightMode = useTheme()
  const [openSourceId, setOpenSourceId] = useState<string | null>(null)
  const [confirmHome, setConfirmHome] = useState(false)
  const [confirmStartOver, setConfirmStartOver] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [termId, setTermId] = useState<string | null>(null)
  const [avatarPrefs, setAvatarPrefs] = useState<AvatarPrefs>(loadAvatarPrefs)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [journalFigure, setJournalFigure] = useState<string | null>(null)
  const [notes, setNotes] = useState<Notes>({})
  // The "keep a journal" tip shows at the start of each era until the student opens the journal or taps Got it.
  const [journalTipDone, setJournalTipDone] = useState(false)
  // The "saving to your journal" pop-out shows during the first conversation of each era until dismissed.
  const [savingTipDone, setSavingTipDone] = useState(false)
  const [profile, setProfile] = useState<PlayerProfile | null>(loadProfile)
  const [stage, setStage] = useState<Stage>('title')
  const openSource = openSourceId ? scenario?.sources[openSourceId] : undefined
  const openEntry = termId ? scenario?.glossary?.find((g) => g.id === termId) : undefined
  const glossary = useMemo(() => ({ matcher: buildMatcher(scenario?.glossary), openTerm: setTermId }), [scenario])

  function handleAvatarChange(next: AvatarPrefs) {
    setAvatarPrefs(next)
    saveAvatarPrefs(next)
  }

  function updateProfile(next: PlayerProfile | null) {
    setProfile(next)
    if (next) saveProfile(next)
    else clearProfile()
  }

  /** Wipe everything saved on this device and go back to the title screen. */
  function startOver() {
    updateProfile(null)
    clearAvatarPrefs()
    setAvatarPrefs(DEFAULT_PREFS)
    setOpenSourceId(null)
    setTermId(null)
    setAvatarPickerOpen(false)
    setJournalOpen(false)
    clearAllNotes()
    setNotes({})
    dispatch({ type: 'quit' })
    setStage('title')
  }

  function openJournal(figureId: string | null = null) {
    setJournalTipDone(true)
    setSavingTipDone(true)
    setJournalFigure(figureId)
    setJournalOpen(true)
  }

  function changeNote(figureId: string, text: string) {
    if (!scenario) return
    const next = { ...notes, [figureId]: text }
    setNotes(next)
    saveNotes(scenario.id, next)
  }

  // Record progress on the player card: people talked to, eras finished.
  // Functional updates so these never overwrite each other.
  const scenarioId = scenario?.id
  const reachedReflection = screen.kind === 'reflection'
  useEffect(() => {
    if (!scenarioId) return
    setProfile((p) => {
      if (!p) return p
      let next = withFiguresMet(p, scenarioId, state.visited)
      if (reachedReflection) next = withEraCompleted(next, scenarioId)
      if (next !== p) saveProfile(next)
      return next
    })
  }, [scenarioId, state.visited, reachedReflection])

  // Read the new screen whenever it changes (or when the toggle turns on).
  // Runs after render, so the DOM already shows the new screen.
  const screenKey = `${stage}|${scenario?.id ?? ''}|${JSON.stringify(screen)}`
  const { enabled, speak, stop } = readAloud
  useEffect(() => {
    if (enabled) speak(collectScreenText())
    else stop()
  }, [enabled, screenKey, speak, stop])

  // Read a dialog (source record or question) when it opens; go back to silence when it closes.
  useEffect(() => {
    if (!enabled) return
    if (openSourceId || termId || confirmHome || confirmStartOver || aboutOpen || journalOpen) speak(collectScreenText(document.querySelector('dialog[open]') ?? undefined))
    else stop()
  }, [enabled, openSourceId, termId, confirmHome, confirmStartOver, aboutOpen, journalOpen, speak, stop])

  // Leaving or switching the scenario closes any open panel.
  useEffect(() => {
    setOpenSourceId(null)
    setTermId(null)
    setJournalOpen(false)
    setJournalTipDone(false)
    setSavingTipDone(false)
    setNotes(scenario ? loadNotes(scenario.id) : {})
  }, [scenario])

  const warnings = scenario
    ? scenarios.find((s) => s.scenario?.id === scenario.id)?.validation.warnings ?? []
    : []

  let body
  if (stage === 'title' || !profile) {
    body = (
      <TitleScreen
        profile={profile}
        avatarPrefs={avatarPrefs}
        onCreate={(name) => {
          updateProfile(newProfile(name))
          setStage('character')
        }}
        onContinue={() => setStage(scenario ? 'game' : 'character')}
        onReset={startOver}
      />
    )
  } else if (stage === 'character') {
    body = (
      <CharacterScreen
        profile={profile}
        avatarPrefs={avatarPrefs}
        scenarios={scenarios}
        onChangePrefs={handleAvatarChange}
        onRename={(name) => updateProfile({ ...profile, name })}
        onBegin={() => setStage('game')}
        onTitle={() => setStage('title')}
        onStartOver={() => setConfirmStartOver(true)}
        midEra={!!scenario}
      />
    )
  } else if (!scenario || screen.kind === 'era-select') {
    body = (
      <EraSelect
        scenarios={scenarios}
        completed={profile.erasCompleted}
        onChoose={(s) => dispatch({ type: 'choose-scenario', scenario: s })}
      />
    )
  } else {
    switch (screen.kind) {
      case 'briefing':
        body = (
          <Briefing
            scenario={scenario}
            index={screen.index}
            onNext={() => dispatch({ type: 'briefing-next' })}
            onBack={() => dispatch({ type: 'briefing-back' })}
          />
        )
        break
      case 'hub':
        body = (
          <FigureHub
            scenario={scenario}
            visited={state.visited}
            avatarPlace={state.avatarPlace}
            avatarPrefs={avatarPrefs}
            celebrate={state.justCompletedAll}
            onCelebrationDone={() => dispatch({ type: 'clear-celebration' })}
            onMoveAvatar={(placeId) => dispatch({ type: 'move-avatar', placeId })}
            onOpenFigure={(figureId) => dispatch({ type: 'open-figure', figureId })}
            onDecide={() => dispatch({ type: 'go-to-decision' })}
          />
        )
        break
      case 'dialogue':
        body = (
          <Dialogue
            scenario={scenario}
            figureId={screen.figureId}
            nodeId={screen.nodeId}
            onChoice={(next, text) => dispatch({ type: 'dialogue-choice', next, text })}
            onLeave={() => dispatch({ type: 'leave-dialogue' })}
          />
        )
        break
      case 'decision':
        body = (
          <Decision
            scenario={scenario}
            onDecide={(outcomeId) => dispatch({ type: 'decide', outcomeId })}
            onBack={() => dispatch({ type: 'back-to-hub' })}
            onOpenJournal={() => openJournal()}
          />
        )
        break
      case 'outcome':
        body = <Outcome scenario={scenario} outcomeId={screen.outcomeId} onNext={() => dispatch({ type: 'outcome-next' })} />
        break
      case 'reveal':
        body = <Reveal scenario={scenario} onNext={() => dispatch({ type: 'reveal-next' })} />
        break
      case 'reflection':
        body = (
          <Reflection
            scenario={scenario}
            outcomeId={screen.outcomeId}
            visited={state.visited}
            playerName={profile?.name}
            onRestart={() => dispatch({ type: 'restart' })}
            onQuit={() => dispatch({ type: 'quit' })}
          />
        )
        break
    }
  }

  // The ☰ menu. Each screen shows only what makes sense there.
  const readAloudItems: MenuItem[] = readAloud.supported
    ? [{ id: 'read-aloud', label: 'Read aloud', glyph: '🔊', checked: enabled, onSelect: readAloud.toggle }]
    : []
  const themeItem: MenuItem = { id: 'light-mode', label: 'Light mode', glyph: '☀', checked: lightMode.theme === 'light', onSelect: lightMode.toggle }
  const aboutItem: MenuItem = { id: 'about', label: 'About this game', glyph: 'ⓘ', onSelect: () => setAboutOpen(true) }
  const startOverItem: MenuItem = { id: 'start-over', label: 'Start over', glyph: '↺', danger: true, onSelect: () => setConfirmStartOver(true) }
  let menuItems: MenuItem[]
  if (stage === 'title' || !profile) {
    menuItems = [...readAloudItems, themeItem, aboutItem, ...(profile ? [startOverItem] : [])]
  } else if (stage === 'character') {
    menuItems = [
      { id: 'journey', label: scenario ? 'Back to your journey' : 'Choose an era', glyph: '✦', onSelect: () => setStage('game') },
      ...(scenario ? [{ id: 'journal', label: 'My journal', glyph: '📖', onSelect: () => openJournal() }] : []),
      ...readAloudItems,
      themeItem,
      aboutItem,
      startOverItem,
    ]
  } else {
    menuItems = [
      ...(scenario ? [{ id: 'home', label: 'Home: choose an era', glyph: '⌂', onSelect: () => setConfirmHome(true) }] : []),
      { id: 'character', label: 'My character', glyph: '♜', onSelect: () => setStage('character') },
      ...readAloudItems,
      themeItem,
      aboutItem,
      startOverItem,
    ]
  }
  // During the first conversation of the era, the Journal button pops out a note that the talk is being saved.
  // It replaces the intro tip there; both stop once the student opens the journal or taps Got it.
  const talksStarted = state.talkLog.filter((e) => e.kind === 'start').length
  const firstTalk = screen.kind === 'dialogue' && talksStarted === 1 ? screen.figureId : null
  const firstTalkName = firstTalk ? scenario?.figures.find((f) => f.id === firstTalk)?.name : undefined
  let journalTip: 'intro' | { saving: string } | null = null
  if (scenario && screen.kind !== 'era-select') {
    if (firstTalkName && !savingTipDone) journalTip = { saving: firstTalkName }
    // The intro tip only leads up to the first conversation; after that the saving note has done its job.
    else if (!journalTipDone && talksStarted === 0) journalTip = 'intro'
  }
  const menuIndicator = enabled ? 'Read aloud is on' : undefined

  return (
    <SourceViewerContext.Provider value={setOpenSourceId}>
      <JourneyContext.Provider value={{ furthest: state.furthest, goTo: (step) => dispatch({ type: 'go-to-step', step }) }}>
      <GlossaryContext.Provider value={glossary}>
        {stage === 'game' && profile && (
          <AppHeader
            profile={profile}
            avatarPrefs={avatarPrefs}
            menuItems={menuItems}
            menuIndicator={menuIndicator}
            // Mid-era, just open the wardrobe so the student does not lose their place.
            onOpenProfile={() => (scenario ? setAvatarPickerOpen(true) : setStage('character'))}
            onOpenJournal={scenario && screen.kind !== 'era-select' ? () => openJournal() : undefined}
            journalTip={journalTip}
            onDismissJournalTip={() => (journalTip === 'intro' ? setJournalTipDone(true) : setSavingTipDone(true))}
          />
        )}
        {stage !== 'game' && menuItems.length > 0 && <FloatingMenu items={menuItems} indicator={menuIndicator} />}
        <ConfirmDialog
          open={confirmStartOver}
          title="Start over completely?"
          confirmLabel="Start over"
          cancelLabel="Keep my character"
          onCancel={() => setConfirmStartOver(false)}
          onConfirm={() => {
            setConfirmStartOver(false)
            startOver()
          }}
        >
          <p>This clears your name, level, seals, and outfit on this device. You cannot undo it.</p>
        </ConfirmDialog>
        <ConfirmDialog
          open={confirmHome}
          title="Leave this era?"
          confirmLabel="Go home"
          cancelLabel="Stay"
          onCancel={() => setConfirmHome(false)}
          onConfirm={() => {
            setConfirmHome(false)
            setOpenSourceId(null)
            dispatch({ type: 'quit' })
          }}
        >
          <p>You will go back to the era menu. Your progress in this era is not saved.</p>
        </ConfirmDialog>
        <AvatarPicker open={avatarPickerOpen} prefs={avatarPrefs} onChange={handleAvatarChange} onClose={() => setAvatarPickerOpen(false)} />
        <WarningBanner warnings={warnings} />
        {body}
        {stage === 'game' && (
          <footer className="game-footer">
            <button type="button" className="link-button" onClick={() => setAboutOpen(true)}>
              About this game
            </button>
          </footer>
        )}
        <AboutDialog open={aboutOpen} scenario={scenario ?? null} onClose={() => setAboutOpen(false)} />
        <GlossaryDialog entry={openEntry} scenario={scenario ?? null} onClose={() => setTermId(null)} />
        {scenario && (
          <JournalDialog
            open={journalOpen}
            scenario={scenario}
            figureId={journalFigure}
            talkLog={state.talkLog}
            notes={notes}
            onChangeNote={changeNote}
            onClose={() => setJournalOpen(false)}
          />
        )}
        <SourcePanel sourceId={openSourceId} source={openSource} onClose={() => setOpenSourceId(null)} />
        </GlossaryContext.Provider>
      </JourneyContext.Provider>
    </SourceViewerContext.Provider>
  )
}
