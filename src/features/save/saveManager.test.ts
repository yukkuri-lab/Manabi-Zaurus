import { beforeEach, describe, expect, it } from 'vitest'
import { kanjiList } from '../../data/kanji'
import { BROKEN_SAVE_KEY, SAVE_KEY, createInitialSaveData, loadSaveData, localDateKey, resetSaveData, rolloverDailyProgress, writeSaveData } from './saveManager'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

describe('saveManager', () => {
  const storage = new MemoryStorage()

  beforeEach(() => storage.clear())

  it('全漢字分の進捗とversionを含む初期データを作る', () => {
    const now = new Date(2026, 6, 10, 8, 30)
    const save = createInitialSaveData(now)
    expect(save.version).toBe(2)
    expect(Object.keys(save.progress.kanjiProgress)).toHaveLength(kanjiList.length)
    expect(save.progress.discoveredDinosaurIds).toEqual(['mojira'])
    expect(save.progress.currentScene).toBe('intro')
    expect(save.profile.lastPlayedDate).toBe(localDateKey(now))
  })

  it('日付が変わると今日の時間・漢字・行動だけをリセットする', () => {
    const firstDay = new Date(2026, 6, 10, 23, 50)
    const nextDay = new Date(2026, 6, 11, 0, 5)
    const save = createInitialSaveData(firstDay)
    save.profile.totalPlaySeconds = 300
    save.profile.todayPlaySeconds = 120
    save.progress.todayKanjiIds = ['g1-ki']
    save.progress.todayGoodActions = ['木を見つけた']

    const rolled = rolloverDailyProgress(save, nextDay)
    expect(rolled.profile.lastPlayedDate).toBe(localDateKey(nextDay))
    expect(rolled.profile.totalPlaySeconds).toBe(300)
    expect(rolled.profile.todayPlaySeconds).toBe(0)
    expect(rolled.progress.todayKanjiIds).toEqual([])
    expect(rolled.progress.todayGoodActions).toEqual([])
  })

  it('localStorageへ書き込み、読み戻せる', () => {
    const save = createInitialSaveData()
    save.progress.currentScene = 'river'
    save.progress.sceneStep = 3
    writeSaveData(save, storage)
    expect(loadSaveData(storage).progress).toMatchObject({ currentScene: 'river', sceneStep: 3 })
  })

  it('壊れたデータを退避して初期データへ戻す', () => {
    storage.setItem(SAVE_KEY, '{broken json')
    const loaded = loadSaveData(storage)
    expect(loaded.progress.currentScene).toBe('intro')
    expect(storage.getItem(BROKEN_SAVE_KEY)).toBe('{broken json')
  })

  it('最初からやり直すと進捗を消す', () => {
    const save = createInitialSaveData()
    save.progress.sceneStep = 5
    writeSaveData(save, storage)
    expect(resetSaveData(storage).progress.sceneStep).toBe(0)
    expect(loadSaveData(storage).progress.sceneStep).toBe(0)
  })

  it('橋を渡らず次章へ進んだ古い保存は橋の手前へ戻す', () => {
    const save = createInitialSaveData()
    save.progress.currentScene = 'forest-fork'
    save.progress.sceneStep = 1
    save.progress.completedScenes = ['intro', 'river']
    save.progress.flags['minigame:pteranodon-bridge-build'] = true
    writeSaveData(save, storage)

    const loaded = loadSaveData(storage)
    expect(loaded.progress.currentScene).toBe('river')
    expect(loaded.progress.sceneStep).toBe(6)
    expect(loaded.progress.completedScenes).not.toContain('river')
  })
})
