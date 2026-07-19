import type { KanjiProgress } from '../../types'

export const createKanjiProgress = (kanjiId: string): KanjiProgress => ({
  kanjiId,
  timesSeen: 0,
  correctCount: 0,
  incorrectCount: 0,
  masteryLevel: 0,
  lastSeenAt: null,
  nextReviewAt: null,
  recentMistake: false,
  streak: 0
})

const masteryFrom = (correctCount: number, incorrectCount: number, streak: number): 0 | 1 | 2 | 3 => {
  if (correctCount >= 6 && streak >= 3 && correctCount >= incorrectCount * 2) return 3
  if (correctCount >= 3 && streak >= 2) return 2
  if (correctCount >= 1) return 1
  return 0
}

export const updateKanjiProgress = (
  current: KanjiProgress,
  correct: boolean,
  now = new Date()
): KanjiProgress => {
  const correctCount = current.correctCount + (correct ? 1 : 0)
  const incorrectCount = current.incorrectCount + (correct ? 0 : 1)
  const streak = correct ? current.streak + 1 : 0
  const masteryLevel = masteryFrom(correctCount, incorrectCount, streak)
  const minutes = correct ? [3, 10, 60, 24 * 60][masteryLevel] : 3

  return {
    ...current,
    timesSeen: current.timesSeen + 1,
    correctCount,
    incorrectCount,
    masteryLevel,
    lastSeenAt: now.toISOString(),
    nextReviewAt: new Date(now.getTime() + minutes * 60_000).toISOString(),
    recentMistake: !correct,
    streak
  }
}

export const reviewPriority = (progress: KanjiProgress, now = new Date()): number => {
  if (!progress.lastSeenAt) return 100
  const due = progress.nextReviewAt ? new Date(progress.nextReviewAt).getTime() <= now.getTime() : true
  const mistakeBoost = progress.recentMistake ? 35 : 0
  const dueBoost = due ? 45 : 0
  const masteryBoost = (3 - progress.masteryLevel) * 10
  return mistakeBoost + dueBoost + masteryBoost
}

export const chooseReviewKanji = (
  progressItems: KanjiProgress[],
  recentIds: string[],
  count = 3,
  now = new Date()
): string[] => {
  const withoutImmediateRepeat = progressItems.filter((item) => !recentIds.slice(-2).includes(item.kanjiId))
  const pool = withoutImmediateRepeat.length >= count ? withoutImmediateRepeat : progressItems
  return [...pool]
    .sort((a, b) => reviewPriority(b, now) - reviewPriority(a, now))
    .slice(0, count)
    .map((item) => item.kanjiId)
}
