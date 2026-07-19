type EventMap = {
  'world:interact': { label: string }
  'world:ready': undefined
  'world:move': { direction: 'left' | 'right' | 'up' | 'down'; active: boolean }
  'world:action': undefined
  'world:set-objective': { label: string; active: boolean }
  'world:proximity': { label: string; level: 'far' | 'warm' | 'near' | 'very-near' }
  'world:encounter': { dinosaurId: string }
  'world:sparkle': { id: string; sceneId: string; count: number; total: number }
  'world:rune': { id: string; character: string; count: number; total: number }
  'world:driftwood': { id: string; count: number; total: number }
}

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void

class GameEventBus {
  private target = new EventTarget()

  on<K extends keyof EventMap>(name: K, handler: Handler<K>) {
    const listener = (event: Event) => handler((event as CustomEvent<EventMap[K]>).detail)
    this.target.addEventListener(name, listener)
    return () => this.target.removeEventListener(name, listener)
  }

  emit<K extends keyof EventMap>(name: K, payload: EventMap[K]) {
    this.target.dispatchEvent(new CustomEvent(name, { detail: payload }))
  }
}

export const gameEvents = new GameEventBus()
