import { chapterById, sceneOrder } from '../data/story'
import type { SaveData, SceneId } from '../types'
import { FuriganaText } from './FuriganaText'

interface CaseNotebookProps {
  save: SaveData
  sceneId: Exclude<SceneId, 'title'>
  furiganaEnabled: boolean
  onClose: () => void
}

export function CaseNotebook({ save, sceneId, furiganaEnabled, onClose }: CaseNotebookProps) {
  const inventoryIds = new Set(save.progress.inventory.map((item) => item.id))
  const foundAllRunes = ['rune:intro:big', 'rune:intro:small', 'rune:intro:river'].every((id) => save.progress.flags[id] === true)
  const foundClues = [
    { icon: '🦕', name: 'トリケラトプスの 証言', detail: 'ティラノは「肉」が すき', found: save.progress.discoveredDinosaurIds.includes('baby-triceratops') },
    { icon: '🪨', name: '森の 石文字', detail: '石に「大・小・川」と ほられていた', found: foundAllRunes },
    { icon: '👣', name: '大きな 足あと', detail: '川の ほうへ つづいていた', found: inventoryIds.has('tyranno-footprint') },
    { icon: '🗺️', name: '川むこうの 地図', detail: '林へ つづく道を 発見', found: inventoryIds.has('river-bridge-map') },
    { icon: '🪨', name: 'どうくつの 足あと', detail: '岩山へ つづく 三本ゆび', found: inventoryIds.has('cave-footprint') },
    { icon: '🌅', name: '東の森の 手がかり', detail: '朝日の ほうに 大きな影', found: sceneId === 'east-forest' || sceneId === 'ending' || save.progress.completedScenes.includes('east-forest') }
  ]
  const clueCount = foundClues.filter((clue) => clue.found).length
  const candidatesUnlocked = sceneId === 'east-forest' || sceneId === 'ending' || save.progress.completedScenes.includes('east-forest')
  const solved = save.progress.flags['detective:three-shadows'] === true
  const currentIndex = sceneOrder.indexOf(sceneId)

  return (
    <div className="modal-backdrop case-notebook-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="case-notebook" role="dialog" aria-modal="true" aria-labelledby="case-notebook-title">
        <header className="case-notebook-heading">
          <div><p className="eyebrow">モジラと いっしょに しらべよう</p><h2 id="case-notebook-title">📒 まぼろしのティラノ たんていノート</h2></div>
          <button className="close-button" onClick={onClose} aria-label="たんていノートを閉じる">×</button>
        </header>

        <div className="case-notebook-progress"><div><span>あつめた 手がかり</span><strong>{clueCount} / {foundClues.length}</strong></div><i><b style={{ width: `${clueCount / foundClues.length * 100}%` }} /></i></div>

        <div className="case-notebook-layout">
          <section className="case-clue-sheet">
            <h3>見つけた しょうこ</h3>
            <div className="case-clue-list">{foundClues.map((clue) => <article key={clue.name} className={clue.found ? 'is-found' : 'is-locked'}>
              <span aria-hidden="true">{clue.found ? clue.icon : '？'}</span><div><strong><FuriganaText text={clue.found ? clue.name : 'まだ 見つけていない'} enabled={furiganaEnabled} /></strong><small><FuriganaText text={clue.found ? clue.detail : 'ぼうけんを すすめよう'} enabled={furiganaEnabled} /></small></div><b aria-hidden="true">{clue.found ? '✓' : ''}</b>
            </article>)}</div>
          </section>

          <section className="case-route-sheet">
            <h3>そうさルート</h3>
            <ol>{sceneOrder.filter((id) => id !== 'ending').map((id, index) => {
              const complete = save.progress.completedScenes.includes(id as SceneId) || index < currentIndex
              const current = id === sceneId
              return <li key={id} className={complete ? 'is-complete' : current ? 'is-current' : ''}><span>{complete ? '✓' : current ? '◎' : index + 1}</span><div><small><FuriganaText text={`第${chapterById[id].number}章`} enabled={furiganaEnabled} /></small><strong><FuriganaText text={chapterById[id].subtitle} enabled={furiganaEnabled} /></strong></div></li>
            })}</ol>
          </section>
        </div>

        <section className={`case-candidates ${candidatesUnlocked ? 'is-unlocked' : ''}`}>
          <div><p className="eyebrow">さいごの なぞ</p><h3>3つの 大きな影</h3></div>
          <div className="case-candidate-chips">
            {candidatesUnlocked
              ? <><span>{solved ? '×' : '？'} <FuriganaText text="高い木の影" enabled={furiganaEnabled} /></span><span className={solved ? 'is-answer' : ''}>{solved ? '★' : '？'} <FuriganaText text="赤いしっぽ" enabled={furiganaEnabled} /></span><span>{solved ? '×' : '？'} <FuriganaText text="ぎざぎざの影" enabled={furiganaEnabled} /></span></>
              : <><span>？ ？？？？</span><span>？ ？？？？</span><span>？ ？？？？</span></>}
          </div>
          <p><FuriganaText text={solved ? '漢字の 手がかりで、本物を 見つけた！' : candidatesUnlocked ? '仲間の 特技で もういちど調べよう。' : '手がかりを集めると、候補の影が見えてくるよ。'} enabled={furiganaEnabled} /></p>
        </section>
        <button className="button button--primary case-notebook-close" onClick={onClose}>ノートを とじて そうさへ →</button>
      </section>
    </div>
  )
}
