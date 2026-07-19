import type { CreationDraft, CreationPoint, CreationStroke, CustomDinosaur } from './creationModel'

export const CREATIONS_KEY = 'manabi-saurus-creations-v1'
export const ACTIVE_CREATION_KEY = 'manabi-saurus-active-creation-v1'
export const CREATION_DRAFT_KEY = 'manabi-saurus-creation-draft-v1'
const MAX_CREATIONS = 24

const isColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)

const cleanPoints = (value: unknown): CreationPoint[] => {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const point = entry as Partial<CreationPoint>
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return []
    return [{ x: Math.round((point.x as number) * 10) / 10, y: Math.round((point.y as number) * 10) / 10 }]
  })
}

const cleanStrokes = (value: unknown): CreationStroke[] => {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const stroke = entry as Partial<CreationStroke>
    if (!Number.isInteger(stroke.stepIndex)) return []
    const points = cleanPoints(stroke.points)
    return points.length > 1 ? [{ stepIndex: stroke.stepIndex as number, points }] : []
  })
}

const parseJson = (storage: Storage, key: string): unknown => {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeJson = (storage: Storage, key: string, value: unknown) => {
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

const creationId = () => globalThis.crypto?.randomUUID?.() ?? `dino-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const loadCreations = (storage: Storage = localStorage): CustomDinosaur[] => {
  const value = parseJson(storage, CREATIONS_KEY)
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const item = entry as Partial<CustomDinosaur>
    if (item.version !== 1 || typeof item.id !== 'string' || item.speciesId !== 't-rex' || typeof item.name !== 'string' || !isColor(item.lineColor) || !isColor(item.bodyColor)) return []
    const strokes = cleanStrokes(item.strokes)
    if (strokes.length === 0) return []
    return [{
      version: 1 as const,
      id: item.id,
      speciesId: 't-rex' as const,
      name: item.name,
      strokes,
      lineColor: item.lineColor,
      bodyColor: item.bodyColor,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt as number : Date.now(),
      updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt as number : Date.now()
    }]
  }).sort((a, b) => b.updatedAt - a.updatedAt)
}

export const saveCreation = (input: Omit<CustomDinosaur, 'version' | 'id' | 'createdAt' | 'updatedAt'> & { id: string | null }, storage: Storage = localStorage) => {
  const items = loadCreations(storage)
  const existing = input.id ? items.find((item) => item.id === input.id) : undefined
  const now = Date.now()
  const item: CustomDinosaur = {
    version: 1,
    id: existing?.id ?? creationId(),
    speciesId: 't-rex',
    name: input.name,
    strokes: cleanStrokes(input.strokes),
    lineColor: input.lineColor,
    bodyColor: input.bodyColor,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  }
  writeJson(storage, CREATIONS_KEY, [item, ...items.filter((candidate) => candidate.id !== item.id)].slice(0, MAX_CREATIONS))
  setActiveCreationId(item.id, storage)
  return item
}

export const loadActiveCreationId = (storage: Storage = localStorage) => {
  try { return storage.getItem(ACTIVE_CREATION_KEY) } catch { return null }
}

export const setActiveCreationId = (id: string, storage: Storage = localStorage) => {
  try { storage.setItem(ACTIVE_CREATION_KEY, id) } catch { /* Drawing remains usable without persistence. */ }
}

export const loadActiveCreation = (storage: Storage = localStorage) => {
  const items = loadCreations(storage)
  const activeId = loadActiveCreationId(storage)
  return items.find((item) => item.id === activeId) ?? items[0] ?? null
}

export const saveCreationDraft = (draft: CreationDraft, storage: Storage = localStorage) => writeJson(storage, CREATION_DRAFT_KEY, draft)

export const loadCreationDraft = (storage: Storage = localStorage): CreationDraft | null => {
  const value = parseJson(storage, CREATION_DRAFT_KEY)
  if (!value || typeof value !== 'object') return null
  const draft = value as Partial<CreationDraft>
  if (draft.version !== 1 || !Number.isInteger(draft.stepIndex) || !Number.isFinite(draft.stepProgress) || !isColor(draft.selectedColor)) return null
  return {
    version: 1,
    stepIndex: Math.max(0, Math.min(7, draft.stepIndex as number)),
    stepProgress: Math.max(0, Math.min(1, draft.stepProgress as number)),
    stepDone: Boolean(draft.stepDone),
    strokes: cleanStrokes(draft.strokes),
    selectedColor: draft.selectedColor,
    completed: Boolean(draft.completed),
    savedCreationId: typeof draft.savedCreationId === 'string' ? draft.savedCreationId : null,
    updatedAt: Number.isFinite(draft.updatedAt) ? draft.updatedAt as number : Date.now()
  }
}

export const clearCreationDraft = (storage: Storage = localStorage) => {
  try { storage.removeItem(CREATION_DRAFT_KEY) } catch { /* Safe no-op. */ }
}
