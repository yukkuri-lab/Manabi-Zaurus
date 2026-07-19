import { useEffect, useState } from 'react'
import { CreatedDinosaurSvg } from './CreatedDinosaurSvg'
import type { CustomDinosaur } from './creationModel'
import { loadActiveCreationId, loadCreations, setActiveCreationId } from './creationStore'

export function CreationGallery({ onBack, onDraw, onAdventure }: { onBack: () => void; onDraw: () => void; onAdventure: (creation: CustomDinosaur) => void }) {
  const [items, setItems] = useState<CustomDinosaur[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setItems(loadCreations())
    setActiveId(loadActiveCreationId())
  }, [])

  const choose = (creation: CustomDinosaur) => {
    setActiveCreationId(creation.id)
    setActiveId(creation.id)
  }

  return (
    <main className="page-shell creation-gallery-page">
      <header className="page-header creation-page-header">
        <div><p className="eyebrow">ずっと きえないよ</p><h1>じぶんの きょうりゅう</h1><p>{items.length}たい うまれたよ</p></div>
        <button className="button button--secondary" onClick={onBack}>もどる</button>
      </header>
      {items.length === 0 ? <section className="creation-empty"><span aria-hidden="true">🥚</span><h2>まだ たまごの なかだよ</h2><p>きょうりゅうを かくと、ぼうけんの なかまになるよ。</p><button className="button button--primary button--large" onClick={onDraw}>きょうりゅうを かく</button></section> : <>
        <div className="creation-card-grid">
          {items.map((creation) => {
            const active = creation.id === activeId || (!activeId && creation === items[0])
            return <article className={`creation-card${active ? ' is-active' : ''}`} key={creation.id}>
              <CreatedDinosaurSvg creation={creation} animated={active} />
              <div><p>{active ? '★ ぼうけんの なかま' : 'じぶんで かいたよ'}</p><h2>{creation.name}</h2></div>
              <button className="button button--secondary" onClick={() => choose(creation)} disabled={active}>{active ? 'えらんでいるよ' : 'このこを えらぶ'}</button>
              {active && <button className="button button--primary" onClick={() => onAdventure(creation)}>いっしょに ぼうけん！ →</button>}
            </article>
          })}
        </div>
        <button className="button button--sun button--large creation-new-button" onClick={onDraw}>あたらしく かく</button>
      </>}
    </main>
  )
}
