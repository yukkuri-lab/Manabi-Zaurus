import { useEffect, useMemo, useRef, useState } from 'react'
import { kanjiById } from '../data/kanji'
import type { GameSettings, QuestionItem } from '../types'
import { audioEngine } from '../utils/audio'
import { speak } from '../utils/speech'
import { DinosaurPortrait } from './DinosaurPortrait'
import { FuriganaText } from './FuriganaText'

interface QuestionPanelProps {
  question: QuestionItem
  settings: GameSettings
  onAttempt: (correct: boolean) => void
  onComplete: () => void
}

const arrangeChoices = (question: QuestionItem, count: 2 | 3) => {
  const selected = [question.correctAnswer, ...question.choices.filter((choice) => choice !== question.correctAnswer)].slice(0, count)
  const shift = [...question.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % selected.length
  return [...selected.slice(shift), ...selected.slice(0, shift)]
}

export function QuestionPanel({ question, settings, onAttempt, onComplete }: QuestionPanelProps) {
  const [attempts, setAttempts] = useState(0)
  const [correct, setCorrect] = useState(false)
  const answerLock = useRef(false)
  const unlockTimer = useRef<number | null>(null)
  const choices = useMemo(() => arrangeChoices(question, settings.answerChoices), [question, settings.answerChoices])
  const kanji = kanjiById[question.kanjiId]
  const reveal = attempts >= 3

  useEffect(() => {
    if (!correct) return
    const timer = window.setTimeout(onComplete, 650)
    return () => window.clearTimeout(timer)
  }, [correct, onComplete])

  useEffect(() => () => {
    if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current)
  }, [])

  const answer = (choice: string) => {
    if (correct || answerLock.current) return
    answerLock.current = true
    const isCorrect = choice === question.correctAnswer
    onAttempt(isCorrect)
    if (isCorrect) {
      setCorrect(true)
      audioEngine.play('correct')
    } else {
      setAttempts((value) => value + 1)
      unlockTimer.current = window.setTimeout(() => { answerLock.current = false }, 280)
    }
  }

  const feedback = correct
    ? `ぴったり！ ${question.explanation}`
    : attempts === 0
      ? 'ゆっくり 見て えらぼう。'
      : attempts === 1
        ? `おしい！ モジラが ヒントを 見つけたよ。${question.hint}`
        : attempts === 2
          ? `よみかたは「${kanji.hiragana}」。音でも きいてみよう。`
          : `だいじょうぶ。答えの「${question.correctAnswer}」が 光っているよ。`

  return (
    <section className={`question-panel ${correct ? 'is-correct' : ''}`} aria-labelledby="question-title">
      <div className="question-topline">
        <span className="question-label">きょうりゅう おたすけ</span>
        <button className="icon-button icon-button--light" onClick={() => speak(question.speechText, settings.speechEnabled)} aria-label="問題を読み上げる">♪ よむ</button>
      </div>
      <h2 id="question-title"><FuriganaText text={question.prompt} enabled={settings.hiraganaAssist} /></h2>
      <div className="answer-grid">
        {choices.map((choice) => (
          <button
            key={choice}
            className={`answer-button ${reveal && choice === question.correctAnswer ? 'is-revealed' : ''}`}
            onClick={() => answer(choice)}
            disabled={correct}
            aria-label={`${choice}をえらぶ`}
          >
            <span>{choice}</span>
            {reveal && choice === question.correctAnswer && <small>これだよ</small>}
          </button>
        ))}
      </div>
      <div className="question-feedback" role="status">
        <div className="feedback-speaker" aria-hidden="true">
          <DinosaurPortrait dinosaurId="mojira" alt="" />
          <span>モジラ</span>
        </div>
        <div className="feedback-bubble"><p><FuriganaText text={feedback} enabled={settings.hiraganaAssist} /></p></div>
      </div>
    </section>
  )
}
