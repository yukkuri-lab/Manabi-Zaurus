import type { GameSettings } from '../types'

type SoundName = 'select' | 'item' | 'correct' | 'discover' | 'egg'

const melodies: Record<SoundName, number[]> = {
  select: [440],
  item: [523, 659],
  correct: [523, 659, 784],
  discover: [392, 523, 659],
  egg: [440, 554, 659, 880]
}

class AudioEngine {
  private context: AudioContext | null = null
  private settings: GameSettings | null = null
  private musicTimer: number | null = null
  private musicIndex = 0

  updateSettings(settings: GameSettings) {
    this.settings = settings
    if (settings.musicVolume <= 0) this.stopMusic()
  }

  private getContext() {
    if (!this.context && typeof AudioContext !== 'undefined') this.context = new AudioContext()
    return this.context
  }

  play(name: SoundName) {
    const context = this.getContext()
    const volume = this.settings?.soundVolume ?? 0.6
    if (!context || volume <= 0) return
    melodies[name].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = context.currentTime + index * 0.11
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.12), start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.2)
    })
  }

  startMusic() {
    if (this.musicTimer || (this.settings?.musicVolume ?? 0) <= 0) return
    const notes = [261.6, 329.6, 392, 329.6]
    const playNote = () => {
      const context = this.getContext()
      const volume = this.settings?.musicVolume ?? 0
      if (!context || volume <= 0) return
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = notes[this.musicIndex++ % notes.length]
      gain.gain.setValueAtTime(0.0001, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.025), context.currentTime + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.2)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 1.25)
    }
    playNote()
    this.musicTimer = window.setInterval(playNote, 1800)
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer)
    this.musicTimer = null
  }
}

export const audioEngine = new AudioEngine()
