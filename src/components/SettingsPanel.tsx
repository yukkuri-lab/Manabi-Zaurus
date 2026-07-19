import type { GameSettings } from '../types'
import { FuriganaText } from './FuriganaText'

interface SettingsPanelProps {
  settings: GameSettings
  onChange: (settings: GameSettings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const patch = (next: Partial<GameSettings>) => onChange({ ...settings, ...next })
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-heading"><div><p className="eyebrow">あそびやすく する</p><h2 id="settings-title"><FuriganaText text="設定" /></h2></div><button className="close-button" onClick={onClose} aria-label="設定を閉じる">×</button></div>
        <div className="settings-grid">
          <label className="setting-toggle"><span><strong>よみあげ</strong><small><FuriganaText text="会話や問題を 音で きく" enabled={settings.hiraganaAssist} /></small></span><input type="checkbox" checked={settings.speechEnabled} onChange={(event) => patch({ speechEnabled: event.target.checked })} /></label>
          <label className="setting-toggle"><span><strong>ひらがな おたすけ</strong><small><FuriganaText text="漢字の よみを いつも出す" enabled={settings.hiraganaAssist} /></small></span><input type="checkbox" checked={settings.hiraganaAssist} onChange={(event) => patch({ hiraganaAssist: event.target.checked })} /></label>
          <label className="setting-toggle"><span><strong><FuriganaText text="背景の 動きを へらす" enabled={settings.hiraganaAssist} /></strong><small><FuriganaText text="ゆれる動きを 少なくする" enabled={settings.hiraganaAssist} /></small></span><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => patch({ reducedMotion: event.target.checked })} /></label>
          <label className="setting-toggle"><span><strong><FuriganaText text="書き問題" enabled={settings.hiraganaAssist} /></strong><small><FuriganaText text="体験版では 準備中" enabled={settings.hiraganaAssist} /></small></span><input type="checkbox" checked={settings.writingQuestions} onChange={(event) => patch({ writingQuestions: event.target.checked })} /></label>
          <label className="setting-range"><span><strong><FuriganaText text="音楽" enabled={settings.hiraganaAssist} /></strong><output>{Math.round(settings.musicVolume * 100)}%</output></span><input type="range" min="0" max="1" step="0.1" value={settings.musicVolume} onChange={(event) => patch({ musicVolume: Number(event.target.value) })} /></label>
          <label className="setting-range"><span><strong><FuriganaText text="効果音" enabled={settings.hiraganaAssist} /></strong><output>{Math.round(settings.soundVolume * 100)}%</output></span><input type="range" min="0" max="1" step="0.1" value={settings.soundVolume} onChange={(event) => patch({ soundVolume: Number(event.target.value) })} /></label>
          <label className="setting-select"><span><strong><FuriganaText text="問題の えらぶ数" enabled={settings.hiraganaAssist} /></strong><small><FuriganaText text="大きな ボタンで表示" enabled={settings.hiraganaAssist} /></small></span><select value={settings.answerChoices} onChange={(event) => patch({ answerChoices: Number(event.target.value) as 2 | 3 })}><option value="2">2こ</option><option value="3">3こ</option></select></label>
          <label className="setting-select"><span><strong><FuriganaText text="あそぶ時間の めやす" enabled={settings.hiraganaAssist} /></strong><small><FuriganaText text="時間が来ても 終了しません" enabled={settings.hiraganaAssist} /></small></span><select value={settings.targetPlayMinutes} onChange={(event) => patch({ targetPlayMinutes: Number(event.target.value) })}><option value="10">10分</option><option value="15">15分</option><option value="20">20分</option><option value="30">30分</option></select></label>
        </div>
        <button className="button button--primary button--large" onClick={onClose}>この<FuriganaText text="設定" enabled={settings.hiraganaAssist} />で あそぶ</button>
      </section>
    </div>
  )
}
