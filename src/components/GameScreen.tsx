import { useCallback, useEffect, useRef, useState } from 'react'
import { chapterById, nextSceneId } from '../data/story'
import { dinosaurById } from '../data/dinosaurs'
import { kanjiById } from '../data/kanji'
import { updateKanjiProgress } from '../features/learning/learningEngine'
import { GameCanvas } from '../game/GameCanvas'
import { gameEvents } from '../game/events/gameEvents'
import type { DialogueEntry, SaveData, StoryBeat, StoryChoice } from '../types'
import { audioEngine } from '../utils/audio'
import { DinosaurPortrait } from './DinosaurPortrait'
import { CaseNotebook } from './CaseNotebook'
import { DialoguePanel } from './DialoguePanel'
import { DetectivePanel } from './DetectivePanel'
import { FuriganaText } from './FuriganaText'
import { MiniGamePanel } from './MiniGamePanel'
import { QuestionPanel } from './QuestionPanel'
import { TouchControls } from './TouchControls'
import type { CustomDinosaur } from '../features/creations/creationModel'

interface GameScreenProps {
  save: SaveData
  updateSave: (updater: (current: SaveData) => SaveData) => void
  onTitle: () => void
  onSettings: () => void
  onEncyclopedia: () => void
  customDinosaur: CustomDinosaur | null
}

const addOnce = <T,>(items: T[], item: T) => items.includes(item) ? items : [...items, item]

const encounterDialogues: Record<string, DialogueEntry> = {
  brachiosaurus: { speaker: 'ブラキオサウルス', portraitId: 'brachiosaurus', text: 'こんにちは！ 高い木の上から、きみたちの ぼうけんを 見ていたよ。会えて うれしいな！', emotion: 'happy' },
  stegosaurus: { speaker: 'ステゴサウルス', portraitId: 'stegosaurus', text: 'やあ！ 林の道は 木もれ日が きれいだよ。いっしょに ゆっくり 進もう。', emotion: 'happy' },
  'baby-triceratops': { speaker: '赤ちゃんトリケラトプス', portraitId: 'baby-triceratops', text: '見つけてくれて ありがとう！ もう まいごじゃないよ。', emotion: 'happy' },
  tyrannosaurus: { speaker: 'ティラノサウルス', portraitId: 'tyrannosaurus', text: 'びっくりさせたかな？ ぼくは 花を たいせつにしているんだ。', emotion: 'calm' }
}

type ProximityLevel = 'far' | 'warm' | 'near' | 'very-near'

const proximityCopy: Record<ProximityLevel, { icon: string; title: string; detail: string }> = {
  far: { icon: '○', title: 'まだ とおいよ', detail: '足あとや 道を よく見よう' },
  warm: { icon: '◔', title: '手がかりの 気配！', detail: 'そのまま さがしてみよう' },
  near: { icon: '◕', title: 'かなり ちかい！', detail: 'モジラが そわそわしているよ' },
  'very-near': { icon: '●', title: 'すぐ そこ！', detail: 'あと すこしで はっけん' }
}

function ExplorePanel({ beat, proximity, furiganaEnabled }: { beat: Extract<StoryBeat, { type: 'explore' }>; proximity: ProximityLevel; furiganaEnabled: boolean }) {
  const signal = proximityCopy[proximity]
  return (
    <section className="story-panel explore-panel" aria-live="polite">
      <div className="objective-icon" aria-hidden="true">◎</div>
      <div className="objective-copy"><p className="eyebrow">いま やること</p><h2><FuriganaText text={beat.objective} enabled={furiganaEnabled} /></h2><p><FuriganaText text={beat.hint} enabled={furiganaEnabled} /></p><div className={`search-signal search-signal--${proximity}`}><span aria-hidden="true">{signal.icon}</span><div><strong><FuriganaText text={signal.title} enabled={furiganaEnabled} /></strong><small><FuriganaText text={signal.detail} enabled={furiganaEnabled} /></small></div><i aria-hidden="true"><b /><b /><b /><b /></i></div></div>
    </section>
  )
}

function ChoicePanel({ beat, onChoose, disabled, furiganaEnabled }: { beat: Extract<StoryBeat, { type: 'choice' }>; onChoose: (choice: StoryChoice) => void; disabled: boolean; furiganaEnabled: boolean }) {
  return (
    <section className="choice-panel"><p className="eyebrow">きみが きめていいよ</p><h2><FuriganaText text={beat.prompt} enabled={furiganaEnabled} /></h2><div className="choice-grid">{beat.options.map((option) => <button key={option.id} onClick={() => onChoose(option)} disabled={disabled}><strong><FuriganaText text={option.label} enabled={furiganaEnabled} /></strong><span><FuriganaText text={option.sublabel} enabled={furiganaEnabled} /></span></button>)}</div><p className="choice-note">どちらを えらんでも、ぼうけんは つづきます。</p></section>
  )
}

function RewardPanel({ beat, onCollect, disabled, furiganaEnabled }: { beat: Extract<StoryBeat, { type: 'reward' }>; onCollect: () => void; disabled: boolean; furiganaEnabled: boolean }) {
  const isEggReward = Boolean(beat.eggKanji)
  const isFootprintClue = beat.item?.id.includes('footprint')

  return (
    <section className="reward-panel" role="status">
      <div className="reward-rays" aria-hidden="true" />
      <div className="reward-icon" aria-hidden="true">
        {beat.dinosaurId
          ? <DinosaurPortrait dinosaurId={beat.dinosaurId} />
          : isEggReward
            ? <span className="kanji-egg"><b>{beat.eggKanji}</b></span>
            : beat.item
              ? <span className="clue-icon">{isFootprintClue ? '👣' : '🔎'}</span>
              : '◆'}
      </div>
      <p className="eyebrow">{isEggReward ? 'まいごの たまご はっけん！' : 'はっけん！'}</p>
      <h2><FuriganaText text={beat.message} enabled={furiganaEnabled} /></h2>
      {beat.item && (
        <div className="item-found">
          <span>みつけた てがかり</span>
          <strong><FuriganaText text={beat.item.name} enabled={furiganaEnabled} /></strong>
          <small><FuriganaText text={beat.item.description} enabled={furiganaEnabled} /></small>
        </div>
      )}
      <button className="button button--sun button--large reward-action" onClick={onCollect} disabled={disabled}>
        <small>つぎに すること</small>
        <strong><FuriganaText text={beat.actionLabel ?? (isEggReward ? 'たまごを ひろう' : 'つぎへ')} enabled={furiganaEnabled} /> →</strong>
      </button>
    </section>
  )
}

export function GameScreen({ save, updateSave, onTitle, onSettings, onEncyclopedia, customDinosaur }: GameScreenProps) {
  const [encounter, setEncounter] = useState<DialogueEntry | null>(null)
  const [sparkleToast, setSparkleToast] = useState('')
  const [caseToast, setCaseToast] = useState('')
  const [notebookOpen, setNotebookOpen] = useState(false)
  const [proximity, setProximity] = useState<ProximityLevel>('far')
  const [miniGamePaused, setMiniGamePaused] = useState(false)
  const [transitionLocked, setTransitionLocked] = useState(false)
  const transitionLockRef = useRef(false)
  const sceneId = save.progress.currentScene === 'title' ? 'intro' : save.progress.currentScene
  const chapter = chapterById[sceneId]
  const beat = chapter.beats[save.progress.sceneStep]
  const isExplore = beat?.type === 'explore'
  const systemReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const collectedSparkleIds = Object.entries(save.progress.flags)
    .filter(([id, collected]) => id.startsWith('sparkle:') && collected === true)
    .map(([id]) => id)
  const collectedDriftwoodIds = Object.entries(save.progress.flags)
    .filter(([id, collected]) => id.startsWith('driftwood:river:') && collected === true)
    .map(([id]) => id)
  const collectedRuneIds = Object.entries(save.progress.flags)
    .filter(([id, collected]) => id.startsWith('rune:intro:') && collected === true)
    .map(([id]) => id)
  const sceneSparkleCount = collectedSparkleIds.filter((id) => id.startsWith(`sparkle:${sceneId}:`)).length
  const bridgeRepaired = save.progress.flags['minigame:pteranodon-bridge-build'] === true
  const inventoryIds = new Set(save.progress.inventory.map((item) => item.id))
  const notebookClueCount = [
    save.progress.discoveredDinosaurIds.includes('baby-triceratops'),
    collectedRuneIds.length >= 3,
    inventoryIds.has('tyranno-footprint'),
    inventoryIds.has('river-bridge-map'),
    inventoryIds.has('cave-footprint'),
    sceneId === 'east-forest' || sceneId === 'ending' || save.progress.completedScenes.includes('east-forest')
  ].filter(Boolean).length

  const runTransitionOnce = useCallback((action: () => void) => {
    if (transitionLockRef.current) return
    transitionLockRef.current = true
    setTransitionLocked(true)
    action()
  }, [])

  useEffect(() => {
    transitionLockRef.current = false
    setTransitionLocked(false)
  }, [sceneId, save.progress.sceneStep])

  useEffect(() => setEncounter(null), [sceneId])

  useEffect(() => setMiniGamePaused(false), [sceneId, save.progress.sceneStep])

  useEffect(() => gameEvents.on('world:proximity', ({ level }) => setProximity(level)), [])

  useEffect(() => {
    if (!isExplore) setProximity('far')
  }, [isExplore, save.progress.sceneStep])

  useEffect(() => gameEvents.on('world:encounter', ({ dinosaurId }) => {
    const dialogue = encounterDialogues[dinosaurId]
    if (!dialogue) return
    audioEngine.play('discover')
    setEncounter(dialogue)
    updateSave((current) => ({
      ...current,
      progress: {
        ...current.progress,
        discoveredDinosaurIds: addOnce(current.progress.discoveredDinosaurIds, dinosaurId)
      }
    }))
  }), [updateSave])

  useEffect(() => gameEvents.on('world:sparkle', ({ id, count, total }) => {
    audioEngine.play(count === total ? 'egg' : 'discover')
    setSparkleToast(count === total ? 'やった！ 3こ ぜんぶ 見つけた！' : `キラキラたまご はっけん！ ${count} / ${total}`)
    updateSave((current) => current.progress.flags[id] === true ? current : ({
      ...current,
      progress: { ...current.progress, flags: { ...current.progress.flags, [id]: true } }
    }))
  }), [updateSave])

  useEffect(() => gameEvents.on('world:driftwood', ({ id, count, total }) => {
    audioEngine.play(count === total ? 'correct' : 'item')
    setSparkleToast(count === total ? 'じょうぶな木を 3本 ぜんぶ 見つけた！' : `じょうぶな木 はっけん！ ${count} / ${total}`)
    updateSave((current) => current.progress.flags[id] === true ? current : ({
      ...current,
      progress: { ...current.progress, flags: { ...current.progress.flags, [id]: true } }
    }))
  }), [updateSave])

  useEffect(() => gameEvents.on('world:rune', ({ id, character, count, total }) => {
    audioEngine.play(count === total ? 'correct' : 'item')
    setSparkleToast(count === total ? '石文字が そろった！ 「大・小・川」' : `石文字「${character}」を 見つけた！ ${count} / ${total}`)
    updateSave((current) => current.progress.flags[id] === true ? current : ({
      ...current,
      progress: { ...current.progress, flags: { ...current.progress.flags, [id]: true } }
    }))
  }), [updateSave])

  useEffect(() => {
    if (!sparkleToast) return
    const timer = window.setTimeout(() => setSparkleToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [sparkleToast])

  useEffect(() => {
    if (!caseToast) return
    const timer = window.setTimeout(() => setCaseToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [caseToast])

  useEffect(() => {
    if (!isExplore) return
    return gameEvents.on('world:interact', ({ label }) => {
      runTransitionOnce(() => {
        audioEngine.play('discover')
        updateSave((current) => ({
          ...current,
          progress: {
            ...current.progress,
            sceneStep: current.progress.sceneStep + 1,
            flags: label === '川むこうの 林'
              ? { ...current.progress.flags, 'river:crossed': true }
              : current.progress.flags
          }
        }))
      })
    })
  }, [isExplore, save.progress.sceneStep, runTransitionOnce, updateSave])

  const advance = () => runTransitionOnce(() => updateSave((current) => ({ ...current, progress: { ...current.progress, sceneStep: current.progress.sceneStep + 1 } })))

  const recordAttempt = (correct: boolean, question: Extract<StoryBeat, { type: 'question' }>['question']) => {
    updateSave((current) => {
      const previous = current.progress.kanjiProgress[question.kanjiId]
      const nextProgress = updateKanjiProgress(previous, correct)
      const seenKanjiIds = Object.values(kanjiById)
        .filter((item) => question.choices.includes(item.character))
        .map((item) => item.id)
      const todayKanjiIds = seenKanjiIds.reduce((items, id) => addOnce(items, id), current.progress.todayKanjiIds)
      return {
        ...current,
        progress: {
          ...current.progress,
          kanjiProgress: { ...current.progress.kanjiProgress, [question.kanjiId]: nextProgress },
          todayKanjiIds
        }
      }
    })
  }

  const choose = (choice: StoryChoice) => {
    runTransitionOnce(() => {
      audioEngine.play('select')
      updateSave((current) => ({
        ...current,
        progress: {
          ...current.progress,
          sceneStep: current.progress.sceneStep + 1,
          flags: { ...current.progress.flags, [choice.flag]: true },
          todayGoodActions: choice.goodAction ? addOnce(current.progress.todayGoodActions, choice.goodAction) : current.progress.todayGoodActions
        }
      }))
    })
  }

  const collectReward = (reward: Extract<StoryBeat, { type: 'reward' }>) => {
    runTransitionOnce(() => {
      audioEngine.play(reward.dinosaurId ? 'discover' : reward.eggGauge ? 'egg' : 'item')
      if (reward.item) setCaseToast('📒 たんていノートに 手がかりを 追加！')
      else if (reward.dinosaurId) setCaseToast('★ 新しい 仲間の特技が ふえた！')
      updateSave((current) => {
      const existingItem = reward.item && current.progress.inventory.find((item) => item.id === reward.item?.id)
      const inventory = reward.item
        ? existingItem
          ? current.progress.inventory.map((item) => item.id === reward.item?.id ? { ...item, quantity: item.quantity + reward.item.quantity } : item)
          : [...current.progress.inventory, reward.item]
        : current.progress.inventory
      return {
        ...current,
        progress: {
          ...current.progress,
          sceneStep: current.progress.sceneStep + 1,
          inventory,
          discoveredDinosaurIds: reward.dinosaurId ? addOnce(current.progress.discoveredDinosaurIds, reward.dinosaurId) : current.progress.discoveredDinosaurIds,
          eggGauge: Math.min(100, Math.max(current.progress.eggGauge, reward.eggGauge ?? current.progress.eggGauge)),
          todayGoodActions: reward.goodAction ? addOnce(current.progress.todayGoodActions, reward.goodAction) : current.progress.todayGoodActions
        }
      }
      })
    })
  }

  const completeMiniGame = (game: Extract<StoryBeat, { type: 'minigame' }>['game']) => {
    runTransitionOnce(() => updateSave((current) => ({
      ...current,
      progress: {
        ...current.progress,
        sceneStep: current.progress.sceneStep + 1,
        discoveredDinosaurIds: addOnce(current.progress.discoveredDinosaurIds, game.dinosaurId),
        flags: { ...current.progress.flags, [`minigame:${game.id}`]: true },
        todayKanjiIds: game.kanjiIds.reduce((items, id) => addOnce(items, id), current.progress.todayKanjiIds),
        todayGoodActions: addOnce(current.progress.todayGoodActions, game.goodAction)
      }
    })))
  }

  const completeDetectiveCase = (detectiveCase: Extract<StoryBeat, { type: 'detective' }>['case']) => {
    runTransitionOnce(() => {
      setCaseToast('★ たんていノートの なぞが とけた！')
      updateSave((current) => ({
      ...current,
      progress: {
        ...current.progress,
        sceneStep: current.progress.sceneStep + 1,
        flags: { ...current.progress.flags, [`detective:${detectiveCase.id}`]: true },
        todayKanjiIds: detectiveCase.kanjiIds.reduce((items, id) => addOnce(items, id), current.progress.todayKanjiIds),
        todayGoodActions: addOnce(current.progress.todayGoodActions, detectiveCase.goodAction)
      }
      }))
    })
  }

  const finishChapter = () => {
    const next = nextSceneId(sceneId)
    if (!next) return
    runTransitionOnce(() => {
      audioEngine.play('select')
      updateSave((current) => ({
      ...current,
      progress: {
        ...current.progress,
        completedScenes: addOnce(current.progress.completedScenes, sceneId),
        currentScene: next,
        sceneStep: 0
      }
      }))
    })
  }

  const continueFromForestEnding = () => {
    runTransitionOnce(() => {
      audioEngine.play('select')
      updateSave((current) => ({
      ...current,
      progress: {
        ...current.progress,
        completedScenes: addOnce(current.progress.completedScenes, 'intro'),
        currentScene: 'river',
        sceneStep: 0
      }
      }))
    })
  }

  const targetLabel = isExplore ? beat.targetLabel : ''
  const progressPercent = Math.round(Math.min(save.progress.sceneStep, chapter.beats.length) / chapter.beats.length * 100)
  const canWalkAround = isExplore || (beat?.type === 'minigame' && miniGamePaused)
  const storyLayerMode = encounter
    ? 'story-layer--dialogue'
    : beat?.type === 'explore'
      ? 'story-layer--explore'
      : 'story-layer--modal'
  const handleMiniGamePauseChange = useCallback((paused: boolean) => setMiniGamePaused(paused), [])

  return (
    <main className={`game-screen theme-${chapter.theme}`}>
      <header className="game-header">
        <button className="brand-button" onClick={onTitle} aria-label="タイトルへもどる"><i aria-hidden="true">⌂</i><span>かんじザウルス</span><small>まぼろしの ティラノを さがせ！</small></button>
        <div className="chapter-status"><div className="chapter-title-row"><span><FuriganaText text={`第${chapter.number}章`} enabled={save.settings.hiraganaAssist} /></span><strong><FuriganaText text={chapter.title} enabled={save.settings.hiraganaAssist} /></strong><b>{progressPercent}%</b></div><div className="chapter-progress" aria-label={`この章 ${progressPercent}%`}><i style={{ width: `${progressPercent}%` }} /></div></div>
        <div className="game-header-actions"><button onClick={onEncyclopedia}><span className="header-action-icon" aria-hidden="true">▤</span><span className="header-action-label"><FuriganaText text="図鑑" /></span><b>{save.progress.discoveredDinosaurIds.length}</b></button><button onClick={onSettings} aria-label="設定を開く"><span className="header-action-icon" aria-hidden="true">⚙</span><span className="header-action-label"><FuriganaText text="設定" /></span></button></div>
      </header>
      <section className="game-stage">
        <GameCanvas key={`${sceneId}-${save.settings.reducedMotion}-${systemReducedMotion}-${bridgeRepaired}-${customDinosaur?.id ?? 'no-custom-dino'}-${customDinosaur?.updatedAt ?? 0}`} sceneId={sceneId} theme={chapter.theme} targetLabel={targetLabel} objectiveActive={isExplore} reducedMotion={save.settings.reducedMotion || systemReducedMotion} collectedSparkleIds={collectedSparkleIds} collectedDriftwoodIds={collectedDriftwoodIds} collectedRuneIds={collectedRuneIds} bridgeRepaired={bridgeRepaired} customDinosaur={customDinosaur} />
        {customDinosaur && <div className="custom-companion-chip" role="status"><span aria-hidden="true">★</span><small>ぼうけんの なかま</small><strong>{customDinosaur.name}も いっしょ！</strong></div>}
        <div className="game-hud" aria-label="探検で集めたもの">
          <button className="case-notebook-button" aria-label={`たんていノートを開く 手がかり${notebookClueCount}個`} onClick={() => { audioEngine.play('select'); setNotebookOpen(true) }}><span aria-hidden="true">📒</span><div><small>てがかり</small><strong>たんていノート</strong></div><b>{notebookClueCount}</b></button>
          <div className="hud-collectibles">
            {sceneId !== 'ending' && <div className="sparkle-meter" aria-label={`かくれたキラキラたまご ${sceneSparkleCount}個`}><span aria-hidden="true">◆</span><div><small>かくれた たまご</small><strong>{sceneSparkleCount} / 3</strong></div></div>}
            {sceneId === 'intro' && <div className="rune-meter" aria-label={`見つけた石文字 ${collectedRuneIds.length}個`}><span aria-hidden="true">石</span><div><small>石の もじ</small><strong>{collectedRuneIds.length} / 3</strong></div></div>}
          </div>
        </div>
        {sparkleToast && <div className="sparkle-toast" role="status"><span aria-hidden="true">★</span>{sparkleToast}</div>}
        {caseToast && <div className="case-update-toast" role="status">{caseToast}</div>}
        {canWalkAround && !encounter && <TouchControls />}
      </section>
      <div className={`story-layer ${storyLayerMode}`}>
        {encounter ? <DialoguePanel entry={encounter} settings={save.settings} onNext={() => setEncounter(null)} disabled={transitionLocked} /> : <>
          {beat?.type === 'dialogue' && <DialoguePanel entry={beat.entry} settings={save.settings} onNext={advance} disabled={transitionLocked} />}
          {beat?.type === 'explore' && <ExplorePanel beat={beat} proximity={proximity} furiganaEnabled={save.settings.hiraganaAssist} />}
          {beat?.type === 'question' && <QuestionPanel key={beat.question.id} question={beat.question} settings={save.settings} onAttempt={(correct) => recordAttempt(correct, beat.question)} onComplete={advance} />}
          {beat?.type === 'minigame' && <MiniGamePanel key={beat.game.id} game={beat.game} furiganaEnabled={save.settings.hiraganaAssist} onPauseChange={handleMiniGamePauseChange} onComplete={() => completeMiniGame(beat.game)} />}
          {beat?.type === 'detective' && <DetectivePanel key={beat.case.id} detectiveCase={beat.case} furiganaEnabled={save.settings.hiraganaAssist} onComplete={() => completeDetectiveCase(beat.case)} />}
          {beat?.type === 'choice' && <ChoicePanel beat={beat} onChoose={choose} disabled={transitionLocked} furiganaEnabled={save.settings.hiraganaAssist} />}
          {beat?.type === 'reward' && <RewardPanel beat={beat} onCollect={() => collectReward(beat)} disabled={transitionLocked} furiganaEnabled={save.settings.hiraganaAssist} />}
          {!beat && sceneId !== 'ending' && <section className="chapter-complete"><span className="chapter-stamp">できた！</span><p className="eyebrow">第{chapter.number}章 クリア</p><h2>{chapter.title}</h2><p><FuriganaText text="きみの ぼうけんは ちゃんと 保存されたよ。" enabled={save.settings.hiraganaAssist} /></p><button className="button button--sun button--large" onClick={finishChapter} disabled={transitionLocked}>つぎの <FuriganaText text="場所" enabled={save.settings.hiraganaAssist} />へ</button></section>}
          {!beat && sceneId === 'ending' && <EndingSummary save={save} onTitle={onTitle} onEncyclopedia={onEncyclopedia} onContinue={continueFromForestEnding} />}
        </>}
      </div>
      {notebookOpen && <CaseNotebook save={save} sceneId={sceneId} furiganaEnabled={save.settings.hiraganaAssist} onClose={() => setNotebookOpen(false)} />}
    </main>
  )
}

function EndingSummary({ save, onTitle, onEncyclopedia, onContinue }: { save: SaveData; onTitle: () => void; onEncyclopedia: () => void; onContinue: () => void }) {
  const kanji = save.progress.todayKanjiIds.map((id) => kanjiById[id]).filter(Boolean)
  const hasNextAdventure = !save.progress.completedScenes.includes('river')
  return (
    <section className="ending-summary">
      <div className="ending-clue" aria-hidden="true"><span>大</span><i /><i /><i /></div>
      <p className="eyebrow">{hasNextAdventure ? 'はじまりの森 クリア！' : 'ぼうけん クリア！'}</p><h2><FuriganaText text={hasNextAdventure ? 'まぼろしの ティラノの 足あとを 見つけた！' : 'まぼろしの ティラノに 会えた！'} enabled={save.settings.hiraganaAssist} /></h2>
      <p><FuriganaText text="今日 出会った漢字" enabled={save.settings.hiraganaAssist} /></p><div className="ending-kanji">{kanji.map((item) => <span key={item.id}><b>{item.character}</b><small>{item.hiragana}</small></span>)}</div>
      <p className="ending-friends"><FuriganaText text={`友だち：${save.progress.discoveredDinosaurIds.map((id) => dinosaurById[id]?.name).filter(Boolean).join('・')}`} enabled={save.settings.hiraganaAssist} /></p>
      {hasNextAdventure ? <div className="next-land"><span>つぎの ぼうけん</span><strong><FuriganaText text="大きな川" enabled={save.settings.hiraganaAssist} /></strong><p><FuriganaText text="足あとを追って、まぼろしの ティラノに 近づこう。" enabled={save.settings.hiraganaAssist} /></p></div> : <div className="next-land"><span>ぼうけん かんりょう</span><strong>おめでとう！</strong><p><FuriganaText text="見つけた漢字と 恐竜は、図鑑で いつでも 見られるよ。" enabled={save.settings.hiraganaAssist} /></p></div>}
      <div className="ending-actions">{hasNextAdventure && <button className="button button--sun button--large" onClick={onContinue}>大きな川へ すすむ →</button>}<button className="button button--primary" onClick={onEncyclopedia}><FuriganaText text="図鑑" />を 見る</button><button className="button button--secondary" onClick={onTitle}>タイトルへ</button></div>
    </section>
  )
}
