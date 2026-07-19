import { DinosaurPortrait } from './DinosaurPortrait'
import { FuriganaText } from './FuriganaText'

interface TitleScreenProps {
  canContinue: boolean
  onNewGame: () => void
  onContinue: () => void
  onParent: () => void
  onSettings: () => void
  onEncyclopedia: () => void
  onDrawDinosaur: () => void
  onMyDinosaurs: () => void
}

export function TitleScreen({ canContinue, onNewGame, onContinue, onParent, onSettings, onEncyclopedia, onDrawDinosaur, onMyDinosaurs }: TitleScreenProps) {
  return (
    <main className="title-screen">
      <div className="title-sky" aria-hidden="true"><span /><span /><span /></div>
      <div className="title-landscape" aria-hidden="true">
        <div className="mountain mountain--one" /><div className="mountain mountain--two" />
        <div className="title-tree title-tree--one" /><div className="title-tree title-tree--two" /><div className="title-tree title-tree--three" />
      </div>
      <section className="title-card" aria-labelledby="game-title">
        <div className="title-footprints" aria-hidden="true">● ● ●</div>
        <div className="title-kicker">かんじ × きょうりゅう</div>
        <p className="eyebrow">かんじで ひらく、きょうりゅうの せかい</p>
        <h1 id="game-title">
          <span className="title-logo">かんじ<span>ザウルス</span></span>
          <small>〜 まぼろしの ティラノを さがせ！ 〜</small>
        </h1>
        <div className="title-ribbon"><small>だい1しょう</small> はじまりの森</div>
        <div className="title-hero">
          <span className="title-hero-sun" aria-hidden="true" />
          <DinosaurPortrait dinosaurId="mojira" />
          <div className="speech-cloud">いっしょに<br />さがそう！</div>
        </div>
        <div className="title-actions">
          <button className="button button--primary button--large" onClick={onNewGame}><span aria-hidden="true">▶</span> ぼうけんを はじめる</button>
          <button className="button button--secondary" onClick={onContinue} disabled={!canContinue}>つづきから</button>
        </div>
        <div className="creation-title-actions" aria-label="じぶんの きょうりゅう">
          <button onClick={onDrawDinosaur}><span aria-hidden="true">✎</span><div><small>じぶんの なかまを</small><strong>きょうりゅうを かく</strong></div></button>
          <button onClick={onMyDinosaurs}><span aria-hidden="true">★</span><div><small>ぼうけんへ つれていく</small><strong>じぶんの きょうりゅう</strong></div></button>
        </div>
        <nav className="title-links" aria-label="そのほかのメニュー">
          <button onClick={onEncyclopedia}><span aria-hidden="true">図</span><FuriganaText text="きょうりゅう図鑑" /></button>
          <button onClick={onSettings}><span aria-hidden="true">⚙</span><FuriganaText text="設定" /></button>
          <button onClick={onParent}><span aria-hidden="true">家</span>おうちの ひと</button>
        </nav>
        <p className="title-note">じかんせいげん なし ・ いつでも つづきから</p>
      </section>
    </main>
  )
}
