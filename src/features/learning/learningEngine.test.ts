import { describe, expect, it } from 'vitest'
import { chooseReviewKanji, createKanjiProgress, reviewPriority, updateKanjiProgress } from './learningEngine'

describe('learningEngine', () => {
  const now = new Date('2026-07-10T00:00:00.000Z')

  it('初期進捗を安全な値で作る', () => {
    const progress = createKanjiProgress('g1-ki')
    expect(progress).toMatchObject({ kanjiId: 'g1-ki', timesSeen: 0, masteryLevel: 0, recentMistake: false })
    expect(progress.nextReviewAt).toBeNull()
  })

  it('正解で正解数・連続数・次回復習を更新する', () => {
    const progress = updateKanjiProgress(createKanjiProgress('g1-ki'), true, now)
    expect(progress.correctCount).toBe(1)
    expect(progress.incorrectCount).toBe(0)
    expect(progress.masteryLevel).toBe(1)
    expect(progress.streak).toBe(1)
    expect(new Date(progress.nextReviewAt!).getTime()).toBeGreaterThan(now.getTime())
  })

  it('不正解は強い警告にせず、少し後の復習対象にする', () => {
    const progress = updateKanjiProgress(createKanjiProgress('g1-mizu'), false, now)
    expect(progress.recentMistake).toBe(true)
    expect(progress.streak).toBe(0)
    expect(progress.nextReviewAt).toBe('2026-07-10T00:03:00.000Z')
  })

  it('期限が来た苦手漢字を優先し、直前2問は連続させない', () => {
    const mistake = updateKanjiProgress(createKanjiProgress('mistake'), false, now)
    const strong = updateKanjiProgress(updateKanjiProgress(createKanjiProgress('strong'), true, now), true, now)
    const checkAt = new Date('2026-07-10T01:00:00.000Z')
    expect(reviewPriority(mistake, checkAt)).toBeGreaterThan(reviewPriority(strong, checkAt))
    expect(chooseReviewKanji([mistake, strong, createKanjiProgress('fresh')], ['mistake'], 2, checkAt)).not.toContain('mistake')
  })
})
