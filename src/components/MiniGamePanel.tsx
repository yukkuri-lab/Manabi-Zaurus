import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { MiniGameItem } from '../types'
import { audioEngine } from '../utils/audio'
import { DinosaurPortrait } from './DinosaurPortrait'
import { FuriganaText } from './FuriganaText'

interface MiniGamePanelProps {
  game: MiniGameItem
  furiganaEnabled: boolean
  onComplete: () => void
  onPauseChange?: (paused: boolean) => void
}

const rockRounds = [
  {
    reading: 'おおきい', answer: '大', scene: 'big-footprint',
    clue: '大きな 足あとに 合う 漢字の石を はこぼう',
    hints: ['人が 手を ひろげたような 形だよ', '小さいの はんたいの いみだよ', '「大」は「おお」と よむよ']
  },
  {
    reading: 'ちいさい', answer: '小', scene: 'small-footprint',
    clue: '小さな 足あとに 合う 漢字の石を はこぼう',
    hints: ['まんなかの線と 小さな点を よく見よう', '大きいの はんたいの いみだよ', '「小」は「ちい」と よむよ']
  },
  {
    reading: 'やま', answer: '山', scene: 'mountain',
    clue: '三つの みねに 合う 漢字の石を はこぼう',
    hints: ['高い みねが 三つ ならんだような 形だよ', '木ではなく、土や岩で できた 高い場所だよ', '「山」は「やま」と よむよ']
  }
]
const rockChoices = ['小', '山', '大']
const rockSmashSequenceMs = 1650
const bridgeRounds = [
  { reading: 'かわ', answer: '川', hint: '水の ながれが 三本' },
  { reading: 'みず', answer: '水', hint: 'まんなかから 水が はねる 形' },
  { reading: 'やま', answer: '山', hint: '高い 山が ならぶ 形' }
]
const bridgeChoices = ['山', '川', '水']
const windRounds: Array<'left' | 'right'> = ['right', 'left', 'right']

export function MiniGamePanel({ game, furiganaEnabled, onComplete, onPauseChange }: MiniGamePanelProps) {
  const [rockRound, setRockRound] = useState(0)
  const [bridgeStep, setBridgeStep] = useState(0)
  const [windRound, setWindRound] = useState(0)
  const [message, setMessage] = useState('')
  const [complete, setComplete] = useState(false)
  const [smashingRock, setSmashingRock] = useState<string | null>(null)
  const [wrongRock, setWrongRock] = useState<string | null>(null)
  const [selectedRock, setSelectedRock] = useState<string | null>(null)
  const [rockHintLevel, setRockHintLevel] = useState(0)
  const [paused, setPaused] = useState(false)
  const [dragVisual, setDragVisual] = useState<{ character: string; x: number; y: number } | null>(null)
  const actionTimer = useRef<number | null>(null)
  const inputLock = useRef(false)
  const dropTargetRef = useRef<HTMLButtonElement | null>(null)
  const dragStartRef = useRef<{ character: string; x: number; y: number } | null>(null)
  const suppressRockClick = useRef(false)

  useEffect(() => {
    setRockRound(0)
    setBridgeStep(0)
    setWindRound(0)
    setMessage('')
    setComplete(false)
    setSmashingRock(null)
    setWrongRock(null)
    setSelectedRock(null)
    setRockHintLevel(0)
    setPaused(false)
    setDragVisual(null)
    inputLock.current = false
    return () => {
      if (actionTimer.current !== null) window.clearTimeout(actionTimer.current)
    }
  }, [game.id])

  useEffect(() => {
    onPauseChange?.(paused)
    return () => onPauseChange?.(false)
  }, [paused, onPauseChange])

  const celebrate = () => {
    audioEngine.play('correct')
    setMessage(game.successMessage)
    setComplete(true)
  }

  const showNextRockHint = () => {
    if (complete || smashingRock) return
    const round = rockRounds[rockRound]
    const nextLevel = Math.min(3, rockHintLevel + 1)
    setRockHintLevel(nextLevel)
    setMessage(`ヒント ${nextLevel}/3：${round.hints[nextLevel - 1]}`)
    audioEngine.play('select')
  }

  const chooseRock = (character: string) => {
    if (complete || smashingRock || inputLock.current) return
    inputLock.current = true
    const round = rockRounds[rockRound]
    if (character !== round.answer) {
      audioEngine.play('select')
      setWrongRock(character)
      setSelectedRock(null)
      const nextLevel = Math.min(3, rockHintLevel + 1)
      setRockHintLevel(nextLevel)
      setMessage(`おしい！ ヒント ${nextLevel}/3：${round.hints[nextLevel - 1]}`)
      if (actionTimer.current !== null) window.clearTimeout(actionTimer.current)
      actionTimer.current = window.setTimeout(() => {
        setWrongRock(null)
        inputLock.current = false
      }, 360)
      return
    }
    audioEngine.play('item')
    setWrongRock(null)
    setSelectedRock(null)
    setSmashingRock(character)
    setMessage(`つのアタック！ 「${character}」の岩が パッカーン！`)
    actionTimer.current = window.setTimeout(() => {
      const next = rockRound + 1
      setSmashingRock(null)
      setRockRound(next)
      setRockHintLevel(0)
      setMessage('')
      if (next === 3) celebrate()
      else inputLock.current = false
    }, rockSmashSequenceMs)
  }

  const attackSelectedRock = () => {
    if (!selectedRock) {
      setMessage('漢字の石を えらんで、ひびの岩まで はこぼう！')
      return
    }
    chooseRock(selectedRock)
  }

  const startRockDrag = (event: ReactPointerEvent<HTMLButtonElement>, character: string) => {
    if (complete || smashingRock || inputLock.current) return
    dragStartRef.current = { character, x: event.clientX, y: event.clientY }
    suppressRockClick.current = false
    setDragVisual({ character, x: 0, y: 0 })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveRockDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = dragStartRef.current
    if (!start) return
    const x = event.clientX - start.x
    const y = event.clientY - start.y
    if (Math.abs(x) + Math.abs(y) > 12) suppressRockClick.current = true
    setDragVisual({ character: start.character, x, y })
  }

  const finishRockDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = dragStartRef.current
    if (!start) return
    const wasDragged = suppressRockClick.current
    const target = dropTargetRef.current?.getBoundingClientRect()
    const droppedOnTarget = Boolean(target
      && event.clientX >= target.left && event.clientX <= target.right
      && event.clientY >= target.top && event.clientY <= target.bottom)
    dragStartRef.current = null
    setDragVisual(null)
    if (wasDragged && droppedOnTarget) chooseRock(start.character)
    else if (wasDragged) setMessage('ひびの入った 岩まで はこんでね！')
  }

  const chooseBridgeKanji = (character: string) => {
    if (complete || inputLock.current) return
    inputLock.current = true
    const round = bridgeRounds[bridgeStep]
    if (character !== round.answer) {
      audioEngine.play('select')
      setMessage(`ヒント：${round.hint}`)
      actionTimer.current = window.setTimeout(() => { inputLock.current = false }, 280)
      return
    }
    audioEngine.play('item')
    const next = bridgeStep + 1
    setBridgeStep(next)
    setMessage('')
    if (next === 3) celebrate()
    else actionTimer.current = window.setTimeout(() => { inputLock.current = false }, 180)
  }

  const chooseWind = (direction: 'left' | 'right') => {
    if (complete || inputLock.current) return
    inputLock.current = true
    if (direction !== windRounds[windRound]) {
      audioEngine.play('select')
      setMessage('葉っぱの むきを もういちど 見よう！')
      actionTimer.current = window.setTimeout(() => { inputLock.current = false }, 280)
      return
    }
    audioEngine.play('item')
    const next = windRound + 1
    setWindRound(next)
    setMessage(next === 3 ? '' : `せいかい！ あと ${3 - next}回`)
    if (next === 3) celebrate()
    else actionTimer.current = window.setTimeout(() => { inputLock.current = false }, 180)
  }

  if (paused) {
    return (
      <section className="minigame-pause-card" aria-live="polite">
        <span className="minigame-pause-icon" aria-hidden="true">🌿</span>
        <div>
          <p className="eyebrow">探検に もどったよ</p>
          <strong><FuriganaText text={game.title} enabled={furiganaEnabled} /></strong>
          <small>ゲームの つづきは ここから もどれるよ</small>
        </div>
        <button className="button button--sun" onClick={() => setPaused(false)}>ゲームに もどる →</button>
      </section>
    )
  }

  return (
    <section className={`minigame-panel minigame-panel--${game.kind} ${complete ? 'is-complete' : ''} ${smashingRock ? 'is-smashing' : ''}`} aria-live="polite">
      {!complete && <button className="minigame-exit" onClick={() => setPaused(true)}>← 探検にもどる</button>}
      <header className="minigame-heading">
        <div className="minigame-dinosaur"><DinosaurPortrait dinosaurId={game.dinosaurId} /></div>
        <div><p className="eyebrow">きょうりゅうの とくぎ！</p><strong><FuriganaText text={game.skillName} enabled={furiganaEnabled} /></strong></div>
      </header>
      <h2><FuriganaText text={complete ? game.successMessage : game.title} enabled={furiganaEnabled} /></h2>
      {!complete && <p className="minigame-instruction"><FuriganaText text={game.instructions} enabled={furiganaEnabled} /></p>}

      {!complete && game.kind === 'rock-smash' && (
        <div className="rock-game" aria-label="岩くだきゲーム">
          {smashingRock && <div className="rock-impact-stage" aria-label={`${smashingRock}の岩が割れた`}>
            <div className="rock-impact-dinosaur" aria-hidden="true"><DinosaurPortrait dinosaurId={game.dinosaurId} /></div>
            <div className="rock-impact-burst" aria-hidden="true">✦</div>
            <div className="rock-impact-rock" aria-hidden="true">
              <span className="rock-piece rock-piece--one" />
              <span className="rock-piece rock-piece--two" />
              <span className="rock-piece rock-piece--three" />
              <span className="rock-piece rock-piece--four" />
              <b>{smashingRock}</b><i /><i />
            </div>
            <strong className="rock-impact-word">パッカーン！</strong>
          </div>}
          <div className={smashingRock ? 'rock-puzzle is-hidden' : 'rock-puzzle'}>
            <div className="minigame-kanji-prompt"><small><FuriganaText text="この ことばに あう 漢字は どれ？" enabled={furiganaEnabled} /></small><strong>{rockRounds[rockRound].reading}</strong><span>{rockRound + 1} / 3</span></div>
            <div className={`rock-observation rock-observation--${rockRounds[rockRound].scene}`}>
              <div className="rock-observation-picture" aria-hidden="true"><i /><i /><i /></div>
              <strong><FuriganaText text={rockRounds[rockRound].clue} enabled={furiganaEnabled} /></strong>
            </div>
            <div className="rock-workbench">
              <div className="rock-choices" aria-label="はこぶ漢字の石">
                {rockChoices.map((character) => {
                  const dragging = dragVisual?.character === character
                  return (
                    <button
                      key={character}
                      className={`${wrongRock === character ? 'is-wrong' : ''} ${selectedRock === character ? 'is-selected' : ''} ${dragging ? 'is-dragging' : ''}`.trim()}
                      style={dragging ? { transform: `translate(${dragVisual.x}px, ${dragVisual.y}px) scale(1.08)` } : undefined}
                      onPointerDown={(event) => startRockDrag(event, character)}
                      onPointerMove={moveRockDrag}
                      onPointerUp={finishRockDrag}
                      onPointerCancel={() => { dragStartRef.current = null; setDragVisual(null) }}
                      onClick={() => {
                        if (suppressRockClick.current) { suppressRockClick.current = false; return }
                        setSelectedRock(character)
                        setMessage(`「${character}」の石を もったよ。ひびの岩へ はこぼう！`)
                      }}
                      disabled={Boolean(smashingRock)}
                      aria-label={`${character}の漢字の石をはこぶ`}
                    ><b>{character}</b><small>はこぶ</small></button>
                  )
                })}
              </div>
              <button ref={dropTargetRef} className={`rock-drop-target ${selectedRock ? 'is-ready' : ''}`} onClick={attackSelectedRock} aria-label="漢字の石をひびの岩へ運んでくだく">
                <span aria-hidden="true"><i /><i /></span>
                <strong>{selectedRock ? `「${selectedRock}」で つのアタック！` : 'ここへ はこぶ'}</strong>
              </button>
            </div>
            <button className="rock-hint-button" onClick={showNextRockHint}>💡 {rockHintLevel === 0 ? 'ヒントを みる' : rockHintLevel < 3 ? `つぎの ヒント ${rockHintLevel + 1}/3` : 'ヒントを もういちど'}</button>
          </div>
        </div>
      )}

      {!complete && game.kind === 'bridge-build' && (
        <div className="bridge-game" aria-label="橋づくりゲーム">
          <div className="bridge-water" aria-hidden="true">～～～～～～～～</div>
          <div className="bridge-built" aria-label={`じょうぶな木を 橋に おいた数 ${bridgeStep}/3`}>{[0, 1, 2].map((index) => <i key={index} className={index < bridgeStep ? 'is-placed' : ''} />)}</div>
          <div className="minigame-kanji-prompt"><small><FuriganaText text={`「${bridgeRounds[bridgeStep].reading}」の 漢字を えらぼう`} enabled={furiganaEnabled} /></small><strong>{bridgeRounds[bridgeStep].reading}</strong><span>{bridgeStep + 1} / 3</span></div>
          <div className="bridge-logs">{bridgeChoices.map((character) => <button key={character} onClick={() => chooseBridgeKanji(character)} aria-label={`${character}が かかれた じょうぶな木`}><b>{character}</b><span>じょうぶな木</span></button>)}</div>
        </div>
      )}

      {!complete && game.kind === 'wind-read' && (
        <div className="wind-game" aria-label="風よみゲーム">
          <div className="wind-leaves"><span>🍃</span><b>{windRounds[windRound] === 'right' ? '→ → →' : '← ← ←'}</b></div>
          <p><FuriganaText text="葉っぱが とぶ ほうの 漢字は？" enabled={furiganaEnabled} /></p>
          <div className="wind-buttons"><button onClick={() => chooseWind('left')}><b>左</b><small>ひだり</small></button><button onClick={() => chooseWind('right')}><b>右</b><small>みぎ</small></button></div>
          <small>{windRound + 1} / 3</small>
        </div>
      )}

      {message && <p className="minigame-message"><FuriganaText text={message} enabled={furiganaEnabled} /></p>}
      {complete && (
        <div className="minigame-success">
          <div aria-hidden="true">★　✦　★</div>
          <DinosaurPortrait dinosaurId={game.dinosaurId} />
          <button className="button button--sun button--large" onClick={onComplete}>ぼうけんを つづける →</button>
        </div>
      )}
    </section>
  )
}
