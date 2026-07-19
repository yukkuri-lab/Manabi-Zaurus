import { describe, expect, it } from 'vitest'
import { chapters } from './story'
import { kanjiList } from './kanji'

describe('story data', () => {
  it('指定された順番で全章がつながる', () => {
    expect(chapters.map((chapter) => chapter.id)).toEqual(['intro', 'river', 'forest-fork', 'lost-dinosaur', 'cave', 'east-forest', 'ending'])
  })

  it('第1章で草・肉・大・小の意味に触れられる', () => {
    const choices = chapters[0].beats
      .filter((beat) => beat.type === 'question')
      .flatMap((beat) => beat.question.choices)
    expect(new Set(choices)).toEqual(new Set(['草', '肉', '大', '小']))
    for (const character of choices) expect(kanjiList.some((kanji) => kanji.character === character)).toBe(true)
  })

  it('探索だけで詰まらないよう全章に会話か問題がある', () => {
    for (const chapter of chapters) expect(chapter.beats.some((beat) => beat.type === 'dialogue' || beat.type === 'question')).toBe(true)
  })

  it('東の森で3頭の候補をノートと仲間の特技で再探索できる', () => {
    const detectiveBeat = chapters.find((chapter) => chapter.id === 'east-forest')?.beats.find((beat) => beat.type === 'detective')
    expect(detectiveBeat?.type).toBe('detective')
    if (detectiveBeat?.type !== 'detective') return
    expect(detectiveBeat.case.candidates).toHaveLength(3)
    expect(detectiveBeat.case.candidates.filter((candidate) => candidate.isAnswer)).toHaveLength(1)
    expect(detectiveBeat.case.notes.length).toBeGreaterThanOrEqual(3)
    expect(detectiveBeat.case.skillRounds.map((round) => round.answer)).toEqual(['大', '東'])
  })

  it('はじまりの森の石文字が足あとと川の謎につながる', () => {
    const intro = chapters.find((chapter) => chapter.id === 'intro')
    const runeHunt = intro?.beats.find((beat) => beat.type === 'explore' && beat.targetLabel === '石文字')
    expect(runeHunt?.type).toBe('explore')
    const dialogueText = intro?.beats.filter((beat) => beat.type === 'dialogue').map((beat) => beat.entry.text).join('') ?? ''
    expect(dialogueText).toContain('大・小・川')
    expect(dialogueText).toContain('石文字「川」')
  })

  it('橋を直したあと実際に向こう岸へ歩いてから章が終わる', () => {
    const river = chapters.find((chapter) => chapter.id === 'river')
    const bridgeGameIndex = river?.beats.findIndex((beat) => beat.type === 'minigame' && beat.game.kind === 'bridge-build') ?? -1
    const crossingIndex = river?.beats.findIndex((beat) => beat.type === 'explore' && beat.targetLabel === '川むこうの 林') ?? -1
    const crossedRewardIndex = river?.beats.findIndex((beat) => beat.type === 'reward' && beat.item?.id === 'river-bridge-map') ?? -1
    expect(bridgeGameIndex).toBeGreaterThanOrEqual(0)
    expect(crossingIndex).toBeGreaterThan(bridgeGameIndex)
    expect(crossedRewardIndex).toBeGreaterThan(crossingIndex)
  })

  it('足あとの向きを学んでから道の最後までたどる', () => {
    const tracks = chapters.find((chapter) => chapter.id === 'lost-dinosaur')
    const firstTrackIndex = tracks?.beats.findIndex((beat) => beat.type === 'explore' && beat.targetLabel === 'はじめの 足あと') ?? -1
    const directionQuestionIndex = tracks?.beats.findIndex((beat) => beat.type === 'question' && beat.question.id === 'tracks-go-forward') ?? -1
    const finalTrackIndex = tracks?.beats.findIndex((beat) => beat.type === 'explore' && beat.targetLabel === 'どうくつ前の 足あと') ?? -1
    expect(firstTrackIndex).toBeGreaterThanOrEqual(0)
    expect(directionQuestionIndex).toBeGreaterThan(firstTrackIndex)
    expect(finalTrackIndex).toBeGreaterThan(directionQuestionIndex)
  })

  it('東の森は朝日と石門を目印にした場所になっている', () => {
    const east = chapters.find((chapter) => chapter.id === 'east-forest')
    const dialogue = east?.beats.find((beat) => beat.type === 'dialogue')
    const gate = east?.beats.find((beat) => beat.type === 'explore' && beat.targetLabel === '東の石門')
    expect(dialogue?.type === 'dialogue' ? dialogue.entry.text : '').toContain('金色')
    expect(gate?.type).toBe('explore')
  })

  it('前と後は2年生の漢字として扱う', () => {
    expect(kanjiList.find((kanji) => kanji.character === '前')?.grade).toBe(2)
    expect(kanjiList.find((kanji) => kanji.character === '後')?.grade).toBe(2)
  })
})
