import { kanjiList } from '../../data/kanji'
import { createKanjiProgress } from '../learning/learningEngine'
import type { GameSettings, SaveData } from '../../types'

export const SAVE_KEY = 'yukkuri-lab-dino-kanji-save-v2'
export const BROKEN_SAVE_KEY = `${SAVE_KEY}-broken`

export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const defaultSettings: GameSettings = {
  speechEnabled: true,
  hiraganaAssist: true,
  musicVolume: 0.2,
  soundVolume: 0.65,
  reducedMotion: false,
  answerChoices: 3,
  writingQuestions: false,
  targetPlayMinutes: 15
}

export const createInitialSaveData = (now = new Date()): SaveData => ({
  version: 2,
  profile: {
    name: 'ぼうけんか',
    createdAt: now.toISOString(),
    totalPlaySeconds: 0,
    lastPlayedDate: localDateKey(now),
    todayPlaySeconds: 0
  },
  progress: {
    currentScene: 'intro',
    sceneStep: 0,
    completedScenes: [],
    kanjiProgress: Object.fromEntries(kanjiList.map((item) => [item.id, createKanjiProgress(item.id)])),
    discoveredDinosaurIds: ['mojira'],
    inventory: [],
    eggGauge: 0,
    flags: {},
    todayKanjiIds: [],
    todayGoodActions: []
  },
  settings: { ...defaultSettings },
  updatedAt: now.toISOString()
})

const mergeSave = (candidate: Partial<SaveData>): SaveData => {
  const base = createInitialSaveData()
  const progress = candidate.progress
  const merged: SaveData = {
    ...base,
    ...candidate,
    version: 2,
    profile: { ...base.profile, ...candidate.profile },
    settings: { ...base.settings, ...candidate.settings },
    progress: {
      ...base.progress,
      ...progress,
      kanjiProgress: { ...base.progress.kanjiProgress, ...progress?.kanjiProgress },
      flags: { ...base.progress.flags, ...progress?.flags }
    },
    updatedAt: candidate.updatedAt ?? base.updatedAt
  }

  const bridgeWasSkipped = merged.progress.currentScene === 'forest-fork'
    && merged.progress.completedScenes.includes('river')
    && merged.progress.flags['minigame:pteranodon-bridge-build'] === true
    && merged.progress.flags['river:crossed'] !== true

  if (!bridgeWasSkipped) return merged

  return {
    ...merged,
    progress: {
      ...merged.progress,
      currentScene: 'river',
      sceneStep: 6,
      completedScenes: merged.progress.completedScenes.filter((sceneId) => sceneId !== 'river')
    }
  }
}

export const loadSaveData = (storage: Storage = localStorage): SaveData => {
  const raw = storage.getItem(SAVE_KEY)
  if (!raw) return createInitialSaveData()
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>
    if (parsed.version !== 2 || !parsed.progress || !parsed.settings) throw new Error('Unsupported save')
    return rolloverDailyProgress(mergeSave(parsed))
  } catch {
    try { storage.setItem(BROKEN_SAVE_KEY, raw) } catch { /* storage may be full */ }
    return createInitialSaveData()
  }
}

export const rolloverDailyProgress = (data: SaveData, now = new Date()): SaveData => {
  const dateKey = localDateKey(now)
  if (data.profile.lastPlayedDate === dateKey) return data
  return {
    ...data,
    profile: {
      ...data.profile,
      lastPlayedDate: dateKey,
      todayPlaySeconds: 0
    },
    progress: {
      ...data.progress,
      todayKanjiIds: [],
      todayGoodActions: []
    }
  }
}

export const writeSaveData = (data: SaveData, storage: Storage = localStorage): SaveData => {
  const next = { ...data, updatedAt: new Date().toISOString() }
  try { storage.setItem(SAVE_KEY, JSON.stringify(next)) } catch { /* continue without persistent storage */ }
  return next
}

export const hasSavedAdventure = (storage: Storage = localStorage): boolean => {
  try {
    const data = loadSaveData(storage)
    return data.progress.sceneStep > 0 || data.progress.completedScenes.length > 0
  } catch {
    return false
  }
}

export const resetSaveData = (storage: Storage = localStorage): SaveData => {
  const fresh = createInitialSaveData()
  try { storage.setItem(SAVE_KEY, JSON.stringify(fresh)) } catch { /* continue */ }
  return fresh
}
