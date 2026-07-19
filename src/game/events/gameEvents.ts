type Direction = 'left' | 'right' | 'up' | 'down'
type ProximityLevel = 'far' | 'warm' | 'near' | 'very-near'

interface GameEventMap {
  'world:move': { direction: Direction; active: boolean }
  'world:action': undefined
  'world:set-objective': { label: string; active: boolean }
  'world:ready': undefined
  'world:custom-dinosaur-ready': { id: string }
  'world:encounter': { dinosaurId: string }
  'world:sparkle': { id: string; sceneId: string; count: number; total: number }
  'world:driftwood': { id: string; count: number; total: number }
  'world:rune': { id: string; character: string; count: number; total: number }
  'world:proximity': { label: string; level: ProximityLevel }
  'world:interact': { label: string }
}

type Listener<T> = (payload: T) => void

class GameEventBus {
  private listeners = new Map<keyof GameEventMap, Set<Listener<never>>>()

  on<K extends keyof GameEventMap>(eventName: K, listener: Listener<GameEventMap[K]>) {
    const eventListeners = this.listeners.get(eventName) ?? new Set<Listener<never>>()
    eventListeners.add(listener as Listener<never>)
    this.listeners.set(eventName, eventListeners)

    return () => {
      eventListeners.delete(listener as Listener<never>)
      if (eventListeners.size === 0) this.listeners.delete(eventName)
    }
  }

  emit<K extends keyof GameEventMap>(eventName: K, payload: GameEventMap[K]) {
    const eventListeners = this.listeners.get(eventName)
    if (!eventListeners) return
    for (const listener of [...eventListeners]) {
      ;(listener as Listener<GameEventMap[K]>)(payload)
    }
  }
}

export const gameEvents = new GameEventBus()
