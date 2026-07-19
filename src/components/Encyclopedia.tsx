import { dinosaurs } from '../data/dinosaurs'
import type { SaveData } from '../types'
import { DinosaurPortrait } from './DinosaurPortrait'
import { FuriganaText } from './FuriganaText'

export function Encyclopedia({ save, onClose }: { save: SaveData; onClose: () => void }) {
  const discovered = save.progress.discoveredDinosaurIds
  return (
    <main className="page-shell encyclopedia-page">
      <header className="page-header">
        <div><p className="eyebrow"><FuriganaText text="出会った なかまたち" /></p><h1><FuriganaText text="きょうりゅう図鑑" /></h1><p>{discovered.length} / {dinosaurs.length} とう <FuriganaText text="発見" /></p></div>
        <button className="button button--secondary" onClick={onClose}>もどる</button>
      </header>
      <div className="dinosaur-grid">
        {dinosaurs.map((dinosaur) => {
          const isDiscovered = discovered.includes(dinosaur.id)
          return (
            <article className={`dinosaur-card ${isDiscovered ? '' : 'is-undiscovered'}`} key={dinosaur.id}>
              <div className="dinosaur-card-art" style={{ '--dino-color': dinosaur.color } as React.CSSProperties}>
                <DinosaurPortrait dinosaurId={dinosaur.id} hidden={!isDiscovered} />
                {!isDiscovered && <span className="mystery-mark">?</span>}
              </div>
              <div className="dinosaur-card-copy">
                <p className="discovery-label"><FuriganaText text={isDiscovered ? dinosaur.discoveryLocation : 'まだ 会っていません'} enabled={save.settings.hiraganaAssist} /></p>
                <h2>{isDiscovered ? dinosaur.name : '？？？？'}</h2>
                {isDiscovered ? <><p><FuriganaText text={dinosaur.description} enabled={save.settings.hiraganaAssist} /></p><dl><div><dt>とくい</dt><dd><FuriganaText text={dinosaur.ability} enabled={save.settings.hiraganaAssist} /></dd></div><div><dt>すきなもの</dt><dd><FuriganaText text={dinosaur.favoriteFood} enabled={save.settings.hiraganaAssist} /></dd></div></dl></> : <p><FuriganaText text="森を ぼうけんすると 出会えるかも。" enabled={save.settings.hiraganaAssist} /></p>}
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
