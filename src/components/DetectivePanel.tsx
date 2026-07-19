import { useEffect, useRef, useState } from 'react'
import type { DetectiveCaseItem } from '../types'
import { audioEngine } from '../utils/audio'
import { DinosaurPortrait } from './DinosaurPortrait'
import { FuriganaText } from './FuriganaText'

interface DetectivePanelProps {
  detectiveCase: DetectiveCaseItem
  furiganaEnabled: boolean
  onComplete: () => void
}

type Phase = 'candidates' | 'notebook' | 'skills' | 'deduction' | 'complete'

export function DetectivePanel({ detectiveCase, furiganaEnabled, onComplete }: DetectivePanelProps) {
  const [phase, setPhase] = useState<Phase>('candidates')
  const [round, setRound] = useState(0)
  const [message, setMessage] = useState('')
  const [foundClues, setFoundClues] = useState<string[]>([])
  const inputLock = useRef(false)
  const phaseTimer = useRef<number | null>(null)

  useEffect(() => {
    setPhase('candidates')
    setRound(0)
    setMessage('')
    setFoundClues([])
    inputLock.current = false
    return () => {
      if (phaseTimer.current !== null) window.clearTimeout(phaseTimer.current)
    }
  }, [detectiveCase.id])

  const moveTo = (next: Phase) => {
    if (inputLock.current) return
    inputLock.current = true
    audioEngine.play('select')
    setMessage('')
    setPhase(next)
    window.setTimeout(() => { inputLock.current = false }, 180)
  }

  const chooseKanji = (choice: string) => {
    if (inputLock.current) return
    inputLock.current = true
    const current = detectiveCase.skillRounds[round]
    if (choice !== current.answer) {
      audioEngine.play('select')
      setMessage('ちがうみたい。たんていノートの ことばを よく見よう！')
      phaseTimer.current = window.setTimeout(() => { inputLock.current = false }, 280)
      return
    }
    audioEngine.play('item')
    const nextClues = [...foundClues, current.answer]
    setFoundClues(nextClues)
    setMessage(current.result)
    if (round + 1 >= detectiveCase.skillRounds.length) {
      phaseTimer.current = window.setTimeout(() => {
        setMessage('')
        setPhase('deduction')
        inputLock.current = false
      }, 850)
    } else {
      setRound((value) => value + 1)
      phaseTimer.current = window.setTimeout(() => { inputLock.current = false }, 180)
    }
  }

  const chooseCandidate = (id: string) => {
    if (inputLock.current) return
    inputLock.current = true
    const candidate = detectiveCase.candidates.find((item) => item.id === id)
    if (!candidate?.isAnswer) {
      audioEngine.play('select')
      setMessage('おしい！ 「大」と「東」の 手がかりに 合う影を もういちど見よう。')
      phaseTimer.current = window.setTimeout(() => { inputLock.current = false }, 280)
      return
    }
    audioEngine.play('correct')
    setMessage(detectiveCase.successMessage)
    setPhase('complete')
  }

  return (
    <section className={`detective-panel detective-panel--${phase}`} aria-live="polite">
      <header className="detective-heading">
        <span aria-hidden="true">🔎</span>
        <div><p className="eyebrow">モジラの たんていじけん</p><h2><FuriganaText text={detectiveCase.title} enabled={furiganaEnabled} /></h2></div>
        <b>{phase === 'candidates' ? '1' : phase === 'notebook' ? '2' : phase === 'skills' ? '3' : '4'} / 4</b>
      </header>

      {phase === 'candidates' && <>
        <p><FuriganaText text={detectiveCase.introduction} enabled={furiganaEnabled} /></p>
        <div className="suspect-grid" aria-label="候補の恐竜3頭">
          {detectiveCase.candidates.map((candidate) => <article key={candidate.id}>
            <div className="suspect-shadow"><DinosaurPortrait dinosaurId={candidate.dinosaurId} hidden /></div>
            <strong><FuriganaText text={candidate.name} enabled={furiganaEnabled} /></strong><small><FuriganaText text={candidate.sighting} enabled={furiganaEnabled} /></small>
          </article>)}
        </div>
        <button className="button button--sun button--large" onClick={() => moveTo('notebook')}>たんていノートを ひらく →</button>
      </>}

      {phase === 'notebook' && <>
        <div className="notebook-page">
          <div className="notebook-title"><span>📒</span><strong>まぼろしの ティラノ たんていノート</strong></div>
          <div className="notebook-clues">{detectiveCase.notes.map((note) => <article key={note.title}><span>{note.icon}</span><div><strong><FuriganaText text={note.title} enabled={furiganaEnabled} /></strong><small><FuriganaText text={note.detail} enabled={furiganaEnabled} /></small></div></article>)}</div>
          <p><FuriganaText text="まだ きめられない！ 仲間の とくぎで もういちど しらべよう。" enabled={furiganaEnabled} /></p>
        </div>
        <button className="button button--primary button--large" onClick={() => moveTo('skills')}>仲間と さいそうさする →</button>
      </>}

      {phase === 'skills' && (() => {
        const current = detectiveCase.skillRounds[round]
        return <>
          <div className="detective-skill">
            <DinosaurPortrait dinosaurId={current.dinosaurId} />
            <div><p className="eyebrow"><FuriganaText text="仲間の とくぎ！" enabled={furiganaEnabled} /></p><strong><FuriganaText text={current.skillName} enabled={furiganaEnabled} /></strong><p><FuriganaText text={current.prompt} enabled={furiganaEnabled} /></p></div>
          </div>
          <div className="detective-kanji-choices">{current.choices.map((choice) => <button key={choice} onClick={() => chooseKanji(choice)} aria-label={`${choice}をえらぶ`}><b>{choice}</b></button>)}</div>
          <div className="clue-slots" aria-label={`見つけた手がかり ${foundClues.length}/${detectiveCase.skillRounds.length}`}>{detectiveCase.skillRounds.map((_, index) => <span key={index} className={index < foundClues.length ? 'is-found' : ''}>{foundClues[index] ?? '？'}</span>)}</div>
        </>
      })()}

      {phase === 'deduction' && <>
        <div className="deduction-banner"><span>📒</span><div><small>そろった 手がかり</small><strong>「大」きな足あと ＋ 「東」の森</strong></div></div>
        <h3><FuriganaText text="本物の まぼろしの ティラノは どの影？" enabled={furiganaEnabled} /></h3>
        <div className="suspect-grid suspect-grid--buttons">{detectiveCase.candidates.map((candidate) => <button key={candidate.id} onClick={() => chooseCandidate(candidate.id)}><div className="suspect-shadow"><DinosaurPortrait dinosaurId={candidate.dinosaurId} hidden /></div><strong><FuriganaText text={candidate.name} enabled={furiganaEnabled} /></strong><small><FuriganaText text={candidate.sighting} enabled={furiganaEnabled} /></small></button>)}</div>
      </>}

      {phase === 'complete' && <div className="detective-complete">
        <div aria-hidden="true">★　🔎　★</div>
        <DinosaurPortrait dinosaurId="tyrannosaurus" />
        <h3><FuriganaText text={detectiveCase.successMessage} enabled={furiganaEnabled} /></h3>
        <p><FuriganaText text="にせものに まどわされず、漢字の 手がかりで 見つけたね！" enabled={furiganaEnabled} /></p>
        <button className="button button--sun button--large" onClick={onComplete}>本物の ところへ 行く →</button>
      </div>}

      {message && phase !== 'complete' && <p className="detective-message"><FuriganaText text={message} enabled={furiganaEnabled} /></p>}
    </section>
  )
}
