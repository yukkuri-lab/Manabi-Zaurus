import { useCallback, useEffect, useState } from 'react'
import { Encyclopedia } from '../components/Encyclopedia'
import { GameScreen } from '../components/GameScreen'
import { ParentDashboard } from '../components/ParentDashboard'
import { SettingsPanel } from '../components/SettingsPanel'
import { TitleScreen } from '../components/TitleScreen'
import { audioEngine } from '../utils/audio'
import { loadSaveData, resetSaveData, rolloverDailyProgress, writeSaveData } from '../features/save/saveManager'
import type { GameSettings, SaveData } from '../types'
import { stopSpeaking } from '../utils/speech'
import { CreationGallery } from '../features/creations/CreationGallery'
import { CreationStudio } from '../features/creations/CreationStudio'
import type { CustomDinosaur } from '../features/creations/creationModel'
import { loadActiveCreation, setActiveCreationId } from '../features/creations/creationStore'

type Screen = 'title' | 'game' | 'encyclopedia' | 'parent' | 'drawing' | 'creations'

const hasProgress = (save: SaveData) => save.progress.sceneStep > 0 || save.progress.completedScenes.length > 0 || save.progress.currentScene !== 'intro'

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSaveData())
  const [screen, setScreen] = useState<Screen>('title')
  const [returnScreen, setReturnScreen] = useState<Exclude<Screen, 'encyclopedia'>>('title')
  const [showSettings, setShowSettings] = useState(false)
  const [activeCreation, setActiveCreation] = useState<CustomDinosaur | null>(() => loadActiveCreation())

  const updateSave = useCallback((updater: (current: SaveData) => SaveData) => {
    setSave((current) => writeSaveData(updater(current)))
  }, [])

  useEffect(() => {
    audioEngine.updateSettings(save.settings)
    if (screen === 'game' && save.settings.musicVolume > 0) audioEngine.startMusic()
  }, [save.settings, screen])

  useEffect(() => {
    setSave((current) => {
      const normalized = rolloverDailyProgress(current)
      return normalized === current ? current : writeSaveData(normalized)
    })
  }, [screen])

  useEffect(() => {
    if (screen !== 'game') return
    const timer = window.setInterval(() => {
      updateSave((current) => {
        const normalized = rolloverDailyProgress(current)
        return {
          ...normalized,
          profile: {
            ...normalized.profile,
            totalPlaySeconds: normalized.profile.totalPlaySeconds + 10,
            todayPlaySeconds: normalized.profile.todayPlaySeconds + 10
          }
        }
      })
    }, 10_000)
    return () => window.clearInterval(timer)
  }, [screen, updateSave])

  useEffect(() => {
    const saveOnExit = () => setSave((current) => writeSaveData(current))
    window.addEventListener('beforeunload', saveOnExit)
    return () => window.removeEventListener('beforeunload', saveOnExit)
  }, [])

  const enterGame = () => {
    audioEngine.play('select')
    audioEngine.startMusic()
    setActiveCreation(loadActiveCreation())
    setScreen('game')
  }

  const takeCreationToAdventure = (creation: CustomDinosaur) => {
    setActiveCreationId(creation.id)
    setActiveCreation(creation)
    enterGame()
  }

  const startNew = () => {
    if (hasProgress(save) && !window.confirm('いまの冒険を消して、最初から はじめますか？')) return
    const fresh = resetSaveData()
    setSave(fresh)
    enterGame()
  }

  const goTitle = () => {
    stopSpeaking()
    audioEngine.stopMusic()
    setSave((current) => writeSaveData(current))
    setScreen('title')
  }

  const updateSettings = (settings: GameSettings) => updateSave((current) => ({ ...current, settings }))

  const openEncyclopedia = (from: Exclude<Screen, 'encyclopedia'>) => {
    setReturnScreen(from)
    setScreen('encyclopedia')
  }

  const resetFromParent = () => {
    const fresh = resetSaveData()
    setSave(fresh)
    setScreen('title')
  }

  return (
    <>
      <a className="skip-link" href="#main-content">本文へ移動</a>
      <div id="main-content">
        {screen === 'title' && <TitleScreen canContinue={hasProgress(save)} onNewGame={startNew} onContinue={enterGame} onParent={() => setScreen('parent')} onSettings={() => setShowSettings(true)} onEncyclopedia={() => openEncyclopedia('title')} onDrawDinosaur={() => setScreen('drawing')} onMyDinosaurs={() => setScreen('creations')} />}
        {screen === 'game' && <GameScreen save={save} updateSave={updateSave} customDinosaur={activeCreation} onTitle={goTitle} onSettings={() => setShowSettings(true)} onEncyclopedia={() => openEncyclopedia('game')} />}
        {screen === 'encyclopedia' && <Encyclopedia save={save} onClose={() => setScreen(returnScreen)} />}
        {screen === 'parent' && <ParentDashboard save={save} onClose={() => setScreen('title')} onSettings={() => setShowSettings(true)} onReset={resetFromParent} />}
        {screen === 'drawing' && <CreationStudio onBack={() => setScreen('title')} onGallery={() => setScreen('creations')} onAdventure={takeCreationToAdventure} />}
        {screen === 'creations' && <CreationGallery onBack={() => setScreen('title')} onDraw={() => setScreen('drawing')} onAdventure={takeCreationToAdventure} />}
      </div>
      {showSettings && <SettingsPanel settings={save.settings} onChange={updateSettings} onClose={() => setShowSettings(false)} />}
    </>
  )
}
