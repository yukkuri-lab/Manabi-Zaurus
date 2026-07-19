import type { DialogueEntry, GameSettings } from '../types'
import { speak } from '../utils/speech'
import { DinosaurPortrait } from './DinosaurPortrait'
import { FuriganaText } from './FuriganaText'

interface DialoguePanelProps {
  entry: DialogueEntry
  settings: GameSettings
  onNext: () => void
  disabled?: boolean
}

export function DialoguePanel({ entry, settings, onNext, disabled = false }: DialoguePanelProps) {
  return (
    <section className="story-panel dialogue-panel" aria-live="polite">
      <div className="speaker-avatar"><DinosaurPortrait dinosaurId={entry.portraitId ?? (entry.speaker === 'モジラ' ? 'mojira' : 'tyrannosaurus')} /></div>
      <div className="dialogue-copy">
        <div className="dialogue-heading">
          <strong>{entry.speaker}</strong>
          <button className="icon-button" onClick={() => speak(entry.speechText ?? entry.text, settings.speechEnabled)} aria-label="この会話を読み上げる">♪ よむ</button>
        </div>
        <p><FuriganaText text={entry.text} enabled={settings.hiraganaAssist} /></p>
        <button className="button button--primary" onClick={onNext} disabled={disabled}>つぎへ <span aria-hidden="true">›</span></button>
      </div>
    </section>
  )
}
