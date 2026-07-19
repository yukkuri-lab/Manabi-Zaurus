import type { KanjiItem } from '../types'

export const kanjiList: KanjiItem[] = [
  { id: 'g1-kusa', character: '草', grade: 1, readings: ['くさ', 'ソウ'], hiragana: 'くさ', meaning: 'じめんに はえる みどりの しょくぶつ', exampleWords: ['草', '草花'], exampleSentence: 'トリケラトプスは 草を たべます。', difficulty: 1, relatedSceneTags: ['forest', 'food'] },
  { id: 'g2-niku', character: '肉', grade: 2, readings: ['にく'], hiragana: 'にく', meaning: 'どうぶつの からだの たべもの', exampleWords: ['肉', '肉食'], exampleSentence: 'ティラノサウルスは 肉が すきです。', difficulty: 1, relatedSceneTags: ['forest', 'food', 'tyrannosaurus'] },
  { id: 'g1-dai', character: '大', grade: 1, readings: ['おお', 'ダイ'], hiragana: 'おおきい', meaning: 'おおきい こと', exampleWords: ['大きい', '大空'], exampleSentence: '大きな 足あとを 見つけました。', difficulty: 1, relatedSceneTags: ['forest', 'size', 'tracks'] },
  { id: 'g1-sho', character: '小', grade: 1, readings: ['ちい', 'ショウ'], hiragana: 'ちいさい', meaning: 'ちいさい こと', exampleWords: ['小さい', '小石'], exampleSentence: '小さな 足あとも あります。', difficulty: 1, relatedSceneTags: ['forest', 'size', 'tracks'] },
  { id: 'g1-yama', character: '山', grade: 1, readings: ['やま', 'サン'], hiragana: 'やま', meaning: 'たかく もりあがった ところ', exampleWords: ['山', '火山'], exampleSentence: '山の 前に 川が あります。', difficulty: 1, relatedSceneTags: ['mountain', 'cave'] },
  { id: 'g1-kawa', character: '川', grade: 1, readings: ['かわ', 'セン'], hiragana: 'かわ', meaning: '水が ながれる ところ', exampleWords: ['川', '小川'], exampleSentence: '川の 水は きれいです。', difficulty: 1, relatedSceneTags: ['river', 'bridge'] },
  { id: 'g1-hi', character: '火', grade: 1, readings: ['ひ', 'カ'], hiragana: 'ひ', meaning: 'あかるく もえるもの', exampleWords: ['火', '火山'], exampleSentence: '火を あんぜんに 見まもります。', difficulty: 2, relatedSceneTags: ['cave', 'volcano'] },
  { id: 'g1-mizu', character: '水', grade: 1, readings: ['みず', 'スイ'], hiragana: 'みず', meaning: 'のんだり あらったりする もの', exampleWords: ['水', '水田'], exampleSentence: '水を たいせつに します。', difficulty: 1, relatedSceneTags: ['river', 'spring'] },
  { id: 'g1-ki', character: '木', grade: 1, readings: ['き', 'モク'], hiragana: 'き', meaning: 'みきや えだが ある しょくぶつ', exampleWords: ['木', '木よう日'], exampleSentence: '大きな 木を しらべます。', difficulty: 1, relatedSceneTags: ['forest', 'intro'] },
  { id: 'g1-hayashi', character: '林', grade: 1, readings: ['はやし', 'リン'], hiragana: 'はやし', meaning: '木が いくつも あつまった ところ', exampleWords: ['林', '竹林'], exampleSentence: '林の こみちを あるきます。', difficulty: 2, relatedSceneTags: ['forest', 'fork'] },
  { id: 'g1-mori', character: '森', grade: 1, readings: ['もり', 'シン'], hiragana: 'もり', meaning: '木が たくさん しげる ところ', exampleWords: ['森', '森林'], exampleSentence: '森で モジラに あいました。', difficulty: 2, relatedSceneTags: ['forest', 'fork'] },
  { id: 'g1-mae', character: '前', grade: 2, readings: ['まえ', 'ゼン'], hiragana: 'まえ', meaning: 'むいている ほう', exampleWords: ['前', '名前'], exampleSentence: '前に あしあとが あります。', difficulty: 2, relatedSceneTags: ['tracks', 'direction'] },
  { id: 'g1-ushiro', character: '後', grade: 2, readings: ['うしろ', 'ゴ'], hiragana: 'うしろ', meaning: 'せなかの ほう', exampleWords: ['後', '後ろ'], exampleSentence: '後ろも たしかめます。', difficulty: 2, relatedSceneTags: ['tracks', 'direction'] },
  { id: 'g1-hidari', character: '左', grade: 1, readings: ['ひだり', 'サ'], hiragana: 'ひだり', meaning: 'ひだりの ほう', exampleWords: ['左', '左手'], exampleSentence: '左の 道を 見ます。', difficulty: 1, relatedSceneTags: ['forest', 'direction', 'minigame'] },
  { id: 'g1-migi', character: '右', grade: 1, readings: ['みぎ', 'ウ', 'ユウ'], hiragana: 'みぎ', meaning: 'みぎの ほう', exampleWords: ['右', '右手'], exampleSentence: '右の 道へ すすみます。', difficulty: 1, relatedSceneTags: ['forest', 'direction', 'minigame'] },
  { id: 'g2-higashi', character: '東', grade: 2, readings: ['ひがし', 'トウ'], hiragana: 'ひがし', meaning: 'たいようが のぼる ほう', exampleWords: ['東', '東口'], exampleSentence: '東の 森へ いきましょう。', difficulty: 2, relatedSceneTags: ['east', 'direction'] }
]

export const kanjiById = Object.fromEntries(kanjiList.map((item) => [item.id, item])) as Record<string, KanjiItem>
