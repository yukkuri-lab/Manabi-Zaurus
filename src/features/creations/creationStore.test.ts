import { beforeEach, describe, expect, it } from 'vitest'
import { resetSaveData } from '../save/saveManager'
import type { CreationStroke } from './creationModel'
import { CREATIONS_KEY, clearCreationDraft, loadActiveCreation, loadCreationDraft, loadCreations, saveCreation, saveCreationDraft } from './creationStore'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const strokes: CreationStroke[] = Array.from({ length: 8 }, (_, stepIndex) => ({
  stepIndex,
  points: [{ x: 100 + stepIndex, y: 100 }, { x: 130 + stepIndex, y: 130 }]
}))

describe('creationStore', () => {
  const storage = new MemoryStorage()
  beforeEach(() => storage.clear())

  it('子どもの8本の線を保存し、冒険の仲間として選ぶ', () => {
    const creation = saveCreation({ id: null, speciesId: 't-rex', name: 'じぶんの ティラノ', strokes, lineColor: '#302f2a', bodyColor: '#6fbe5a' }, storage)
    expect(loadCreations(storage)).toHaveLength(1)
    expect(loadCreations(storage)[0].strokes).toEqual(strokes)
    expect(loadActiveCreation(storage)?.id).toBe(creation.id)
  })

  it('冒険を最初からにしても描いた恐竜は消さない', () => {
    saveCreation({ id: null, speciesId: 't-rex', name: 'じぶんの ティラノ', strokes, lineColor: '#302f2a', bodyColor: '#ffd45f' }, storage)
    const before = storage.getItem(CREATIONS_KEY)
    resetSaveData(storage)
    expect(storage.getItem(CREATIONS_KEY)).toBe(before)
    expect(loadCreations(storage)).toHaveLength(1)
  })

  it('途中の工程を保存して続きから戻せる', () => {
    saveCreationDraft({ version: 1, stepIndex: 3, stepProgress: 0.55, stepDone: false, strokes: strokes.slice(0, 3), selectedColor: '#ea6d5a', completed: false, savedCreationId: null, updatedAt: 1 }, storage)
    expect(loadCreationDraft(storage)).toMatchObject({ stepIndex: 3, stepProgress: 0.55, selectedColor: '#ea6d5a' })
    clearCreationDraft(storage)
    expect(loadCreationDraft(storage)).toBeNull()
  })
})
