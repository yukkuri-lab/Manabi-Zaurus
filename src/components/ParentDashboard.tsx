import { useState } from 'react'
import { dinosaurById } from '../data/dinosaurs'
import { kanjiById } from '../data/kanji'
import type { SaveData } from '../types'

interface ParentDashboardProps {
  save: SaveData
  onClose: () => void
  onSettings: () => void
  onReset: () => void
}

const formatTime = (seconds: number) => seconds < 60 ? `${seconds}秒` : `${Math.floor(seconds / 60)}分`

export function ParentDashboard({ save, onClose, onSettings, onReset }: ParentDashboardProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState(false)

  if (!unlocked) {
    return (
      <main className="gate-page">
        <section className="gate-card">
          <span className="gate-icon" aria-hidden="true">⌂</span>
          <p className="eyebrow">おうちの かたへ</p>
          <h1>大人向けページ</h1>
          <p>子どもが まちがって 開きにくいよう、かんたんな 計算を お願いします。</p>
          <form onSubmit={(event) => { event.preventDefault(); if (answer === '7') { setUnlocked(true); setError(false) } else setError(true) }}>
            <label htmlFor="adult-answer">3 ＋ 4 ＝</label>
            <input id="adult-answer" inputMode="numeric" pattern="[0-9]*" value={answer} onChange={(event) => setAnswer(event.target.value)} autoFocus />
            {error && <p className="form-error" role="alert">答えを もう一度 ご確認ください。</p>}
            <button className="button button--primary" type="submit">保護者画面を 開く</button>
          </form>
          <button className="text-button" onClick={onClose}>タイトルへ もどる</button>
        </section>
      </main>
    )
  }

  const mastered = Object.values(save.progress.kanjiProgress).filter((item) => item.masteryLevel > 0)
  const due = Object.values(save.progress.kanjiProgress)
    .filter((item) => item.nextReviewAt && new Date(item.nextReviewAt).getTime() <= Date.now() + 10 * 60_000)
    .slice(0, 5)

  return (
    <main className="page-shell parent-page">
      <header className="page-header">
        <div><p className="eyebrow">おうちの かたへ</p><h1>今日の冒険レポート</h1><p>点数ではなく、出会いと行動を中心に表示しています。</p></div>
        <button className="button button--secondary" onClick={onClose}>タイトルへ</button>
      </header>
      <section className="parent-summary">
        <div className="summary-stat"><span>今日のプレイ</span><strong>{formatTime(save.profile.todayPlaySeconds)}</strong></div>
        <div className="summary-stat"><span>これまで</span><strong>{formatTime(save.profile.totalPlaySeconds)}</strong></div>
        <div className="summary-stat"><span>出会った漢字</span><strong>{save.progress.todayKanjiIds.length}字</strong></div>
        <div className="summary-stat"><span>恐竜図鑑</span><strong>{save.progress.discoveredDinosaurIds.length}とう</strong></div>
      </section>
      <div className="parent-columns">
        <section className="report-card report-card--warm"><h2>今日の よかった行動</h2>{save.progress.todayGoodActions.length ? <ul className="action-list">{save.progress.todayGoodActions.slice(-6).reverse().map((action, index) => <li key={`${action}-${index}`}>{action}</li>)}</ul> : <p>冒険を始めると、ここに素敵な行動が記録されます。</p>}</section>
        <section className="report-card"><h2>今日 出会った漢字</h2><div className="kanji-chip-list">{save.progress.todayKanjiIds.length ? save.progress.todayKanjiIds.map((id) => <span key={id}><b>{kanjiById[id]?.character}</b>{kanjiById[id]?.hiragana}</span>) : <p>まだ出会っていません。</p>}</div></section>
        <section className="report-card"><h2>育ってきた漢字</h2>{mastered.length ? <ul className="progress-list">{mastered.slice(0, 8).map((item) => <li key={item.kanjiId}><b>{kanjiById[item.kanjiId]?.character}</b><span>なじみ度 {item.masteryLevel} / 3</span><i style={{ width: `${item.masteryLevel / 3 * 100}%` }} /></li>)}</ul> : <p>正解すると、少しずつ「なじみ度」が育ちます。</p>}</section>
        <section className="report-card"><h2>もうすぐ 再登場</h2>{due.length ? <p>{due.map((item) => kanjiById[item.kanjiId]?.character).join('・')} を、ほかの遊びを挟んで復習します。</p> : <p>今すぐ復習が必要な漢字はありません。得意な漢字も時々混ぜます。</p>}<h3>発見した恐竜</h3><p>{save.progress.discoveredDinosaurIds.map((id) => dinosaurById[id]?.name).filter(Boolean).join('、')}</p></section>
      </div>
      <section className="parent-actions"><button className="button button--secondary" onClick={onSettings}>遊びやすさの設定</button><button className="button button--danger" onClick={() => { if (window.confirm('冒険の記録を消して、最初からやり直しますか？ この操作は取り消せません。')) onReset() }}>最初から やり直す</button></section>
    </main>
  )
}
