import type { SceneChapter, SceneId } from '../types'

export const chapters: SceneChapter[] = [
  {
    id: 'intro', number: 1, title: 'まぼろしの ティラノを さがせ！', subtitle: 'はじまりの森', theme: 'forest',
    beats: [
      { type: 'dialogue', entry: { speaker: 'モジラ', text: 'ここは 本物の きょうりゅうが くらす「きょうりゅうの森」だよ。きみは 図鑑の 光に つつまれて、この世界へ 来たんだ。', emotion: 'surprised' } },
      { type: 'dialogue', entry: { speaker: 'モジラ', text: '森の ずっと おくには、だれも 見たことがない「まぼろしの ティラノサウルス」が いるんだって！ いっしょに 会いにいこう。', emotion: 'happy' } },
      { type: 'dialogue', entry: { speaker: 'モジラ', text: '矢印キーか 画面の ボタンで 歩けるよ。光る しるしの 近くまで 行くと、自動で 見つけられるよ。', emotion: 'calm' } },
      { type: 'explore', objective: '小さな足あとを たどって トリケラトプスを さがそう', targetLabel: 'トリケラトプス', hint: '森に のこった 足あとを たどって、おくまで 行ってみよう。' },
      { type: 'dialogue', entry: { speaker: 'トリケラトプス', portraitId: 'baby-triceratops', text: 'おなかが ぺこぺこなんだ。ぼくが 食べるのは「草」と「肉」、どっちかな？', emotion: 'thinking' } },
      { type: 'question', question: { id: 'forest-help-triceratops', kanjiId: 'g1-kusa', prompt: 'トリケラトプスが 食べるのは？', speechText: 'トリケラトプスが たべるのは、くさと にく、どっちかな？', correctAnswer: '草', choices: ['草', '肉'], hint: 'トリケラトプスは みどりの はっぱが だいすき。', explanation: '「草」を えらんで、元気に できたね！' } },
      { type: 'dialogue', entry: { speaker: 'トリケラトプス', portraitId: 'baby-triceratops', text: 'ありがとう！ おれいに、森の おくまで いっしょに 行くよ。ティラノは「肉」が すきらしいよ。', emotion: 'happy' } },
      { type: 'reward', message: 'トリケラトプスと 友だちになった！', dinosaurId: 'baby-triceratops', actionLabel: 'いっしょに すすむ', goodAction: '漢字の手がかりで、おなかをすかせた恐竜を助けました' },
      { type: 'minigame', game: { id: 'triceratops-rock-smash', kind: 'rock-smash', dinosaurId: 'baby-triceratops', skillName: 'つので 岩を パッカーン！', title: 'ことばに 合う 漢字の岩を くだけ！', instructions: '正しい 岩を えらぶと、トリケラトプスが くだくよ', successMessage: 'すごい！ 漢字の力で 道が ひらいたよ！', goodAction: 'トリケラトプスと漢字を読み、正しい岩を動かしました', kanjiIds: ['g1-dai', 'g1-sho', 'g1-yama'] } },
      { type: 'dialogue', entry: { speaker: 'モジラ', text: 'くだけた岩の おくに、文字が ほられた 古い石が あるみたい！ 森を たんけんして、3つの 石文字を 見つけよう。', emotion: 'surprised' } },
      { type: 'explore', objective: 'ジャングルに かくれた 石文字を 3つ 見つけよう', targetLabel: '石文字', hint: '道から はなれた 木や岩の 近くも さがしてみよう。' },
      { type: 'dialogue', entry: { speaker: 'モジラ', text: '見つけた 石文字は「大・小・川」だ！ たんていノートに うつしたよ。足あとと 見くらべてみよう。', emotion: 'happy' } },
      { type: 'explore', objective: '道の おくにある 大きな足あとを しらべよう', targetLabel: '大きな足あと', hint: 'いつもの 足あとより、ずっと 大きいよ。' },
      { type: 'dialogue', entry: { speaker: 'モジラ', text: '大きな 足あとと、小さな 足あとが あるよ。さっきの 石文字を 使って、まぼろしの ティラノの 足あとを 見つけよう！', emotion: 'surprised' } },
      { type: 'question', question: { id: 'forest-big-footprint', kanjiId: 'g1-dai', prompt: '石文字の中で「おおきな」足あとを あらわすのは？', speechText: 'いしもじの なかで、おおきな あしあとを あらわすのは、どっち？', correctAnswer: '大', choices: ['大', '小'], hint: '石に ほられた、人が 手を ひろげたような 形だよ。', explanation: '石文字の「大」と 足あとが つながったね！' } },
      { type: 'dialogue', entry: { speaker: 'モジラ', text: 'この 大きさは きっと まぼろしの ティラノだ！ もう一つの 石文字「川」が、つぎの 行き先を おしえているよ。', emotion: 'happy' } },
      { type: 'reward', message: 'まぼろしの ティラノの 手がかりを 見つけた！', item: { id: 'tyranno-footprint', name: '大きな足あとのスケッチ', description: 'まぼろしの ティラノが 川へ向かった しるし', quantity: 1 }, actionLabel: '足あとを おう', goodAction: '大きな足あとを見つけ、次の行き先を考えました' }
    ]
  },
  {
    id: 'river', number: 2, title: '大きな川を わたろう！', subtitle: '大きな川', theme: 'river',
    beats: [
      { type: 'dialogue', entry: { speaker: 'モジラ', text: '足あとは 大きな川の むこうへ つづいているよ。でも、橋に 大きな あなが あいている！ 「あなを おおう じょうぶな木」を 3本 さがそう。', emotion: 'surprised' } },
      { type: 'explore', objective: '橋の あなを おおう じょうぶな木を 見つけよう', targetLabel: 'じょうぶな木', hint: '橋を わたらず、左がわの 川ぞいを さがそう。' },
      { type: 'reward', message: 'じょうぶな木を 3本 見つけた！', item: { id: 'bridge-driftwood', name: 'じょうぶな木 3本', description: '橋の あなを おおうための 木', quantity: 3 }, actionLabel: '橋まで はこぶ', goodAction: '川ぞいで橋の穴をおおう丈夫な木を見つけました' },
      { type: 'question', question: { id: 'river-find-river', kanjiId: 'g1-kawa', prompt: '水が ながれる「かわ」は どっち？', speechText: 'みずが ながれる、かわは どっち？', correctAnswer: '川', choices: ['川', '山'], hint: '三本の 水の ながれに 見えるよ。', explanation: '「川」を 見つけたね！ 橋を なおせるよ。' } },
      { type: 'minigame', game: { id: 'pteranodon-bridge-build', kind: 'bridge-build', dinosaurId: 'brachiosaurus', skillName: '長い くびで 木を はこぶ', title: '3本の木で 橋の あなを おおう！', instructions: '木に 合う 漢字を 3つ えらぼう', successMessage: '橋が かんせい！ これで 川を わたれるよ！', goodAction: '見つけた木と漢字の力で橋を直しました', kanjiIds: ['g1-kawa', 'g1-mizu', 'g1-yama'] } },
      { type: 'dialogue', entry: { speaker: 'モジラ', text: 'ブラキオサウルス、ありがとう！ 橋は なおったよ。じぶんの 足で、むこう岸まで わたってみよう！', emotion: 'happy' } },
      { type: 'explore', objective: 'なおした橋を わたって 川の むこうへ 行こう', targetLabel: '川むこうの 林', hint: '橋の 上を まっすぐ すすんで、むこう岸の 目印まで 行こう。' },
      { type: 'reward', message: '大きな川を わたった！', item: { id: 'river-bridge-map', name: '川むこうの地図', description: '林へ つづく 道が かいてある', quantity: 1 }, actionLabel: '林へ すすむ', goodAction: 'じょうぶな木を見つけ、橋を直して川を渡りました' }
    ]
  },
  {
    id: 'forest-fork', number: 3, title: '林の 分かれ道', subtitle: '木もれ日の林', theme: 'forest',
    beats: [
      { type: 'dialogue', entry: { speaker: 'モジラ', text: '道が 二つに 分かれているよ。明るい 木もれ日を さがしてみよう。', emotion: 'thinking' } },
      { type: 'explore', objective: '明るい 木もれ日の 道へ 行こう', targetLabel: '木もれ日', hint: '木の あいだから 光が さしているよ。' },
      { type: 'question', question: { id: 'fork-find-grove', kanjiId: 'g1-hayashi', prompt: '木が ならぶ「はやし」は どっち？', speechText: 'きが ならぶ、はやしは どっち？', correctAnswer: '林', choices: ['林', '森'], hint: '「木」が 二つ ならんでいるよ。', explanation: '「林」を えらべたね！ 明るい 道は こっちだよ。' } },
      { type: 'reward', message: 'ステゴサウルスと 出会った！', dinosaurId: 'stegosaurus', actionLabel: '足あとを たどる', goodAction: '木もれ日を見つけ、林の道を選びました' },
      { type: 'minigame', game: { id: 'stegosaurus-wind-read', kind: 'wind-read', dinosaurId: 'stegosaurus', skillName: 'せなかの 板で 風と 漢字を よむ', title: '葉っぱの むきを 漢字で こたえよう！', instructions: '「左・右」を 見て 3回答えよう', successMessage: '「左・右」で 風の道が わかったよ！', goodAction: 'ステゴサウルスと葉っぱの動きを見て左と右を判断しました', kanjiIds: ['g1-hidari', 'g1-migi'] } }
    ]
  },
  {
    id: 'lost-dinosaur', number: 4, title: '足あとを たどれ！', subtitle: '足あとの道', theme: 'tracks',
    beats: [
      { type: 'dialogue', entry: { speaker: 'モジラ', text: '新しい 足あとだ！ どっちへ すすんだのか、よく 見てみよう。', emotion: 'surprised' } },
      { type: 'explore', objective: '近くにある はじめの足あとを 見つけよう', targetLabel: 'はじめの 足あと', hint: 'いちばん下の 足あとから、むきを よく見よう。' },
      { type: 'question', question: { id: 'tracks-go-forward', kanjiId: 'g1-mae', prompt: 'すすむ ほうの「まえ」は どっち？', speechText: 'すすむ ほうの、まえは どっち？', correctAnswer: '前', choices: ['前', '後'], hint: 'いま むいている ほうが「前」だよ。', explanation: '「前」が わかったね！ 足あとを たどろう。' } },
      { type: 'dialogue', entry: { speaker: 'モジラ', text: '足あとの つま先が、すすむ ほうを おしえているよ。こんどは さいごまで たどってみよう！', emotion: 'happy' } },
      { type: 'explore', objective: '正しいむきの 足あとを さいごまで たどろう', targetLabel: 'どうくつ前の 足あと', hint: '足あとの つま先が むいている ほうへ すすもう。' },
      { type: 'reward', message: 'どうくつへ つづく 足あとを 見つけた！', item: { id: 'cave-footprint', name: 'どうくつの足あと', description: '岩山へ つづく 大きな足あと', quantity: 1 }, actionLabel: 'どうくつへ 行く', goodAction: '足あとの向きを見て、進む道を考えました' }
    ]
  },
  {
    id: 'cave', number: 5, title: 'ひかる どうくつ', subtitle: '岩山のどうくつ', theme: 'cave',
    beats: [
      { type: 'dialogue', entry: { speaker: 'モジラ', text: 'くらい どうくつだね。おくに あたたかい 光が 見えるよ。', emotion: 'thinking' } },
      { type: 'explore', objective: '光っている 岩を 見つけよう', targetLabel: '光る岩', hint: '黄色く ひかる 場所へ 近づこう。' },
      { type: 'question', question: { id: 'cave-find-fire', kanjiId: 'g1-hi', prompt: 'あたたかく 光る「ひ」は どっち？', speechText: 'あたたかく ひかる、ひは どっち？', correctAnswer: '火', choices: ['火', '水'], hint: '上へ もえる ほのおの 形だよ。', explanation: '「火」を 見つけたね！ どうくつが 明るくなったよ。' } },
      { type: 'reward', message: 'どうくつの 道を ぬけた！', eggKanji: '火', eggGauge: 80, actionLabel: '東の森へ', goodAction: '暗い洞くつで光を見つけ、安全な道を選びました' }
    ]
  },
  {
    id: 'east-forest', number: 6, title: '東の森の ひみつ', subtitle: '朝日の森', theme: 'east',
    beats: [
      { type: 'dialogue', entry: { speaker: 'モジラ', text: 'わあ、空も 木も 金色だ！ 朝もやの むこうで、古い石門の「東」が ひかっているよ。今までの森と ちがうね！', emotion: 'happy' } },
      { type: 'explore', objective: '朝日に光る「東」の石門を しらべよう', targetLabel: '東の石門', hint: '金色の 光と、小川の むこうにある 石門を さがそう。' },
      { type: 'question', question: { id: 'east-find-east', kanjiId: 'g2-higashi', prompt: '朝日が のぼる「ひがし」は どっち？', speechText: 'あさひが のぼる、ひがしは どっち？', correctAnswer: '東', choices: ['東', '前'], hint: '木の あいだから 日が 見える 形だよ。', explanation: '「東」を 見つけたね！ もうすぐ 会えるよ。' } },
      { type: 'dialogue', entry: { speaker: 'モジラ', text: 'まって！ 森に 大きな恐竜の影が 3つあるよ。どれも まぼろしのティラノに 見えるけれど、にせものが まざっているみたい。', emotion: 'surprised' } },
      { type: 'detective', case: {
        id: 'three-shadows',
        title: '3つの影から 本物を さがせ！',
        introduction: 'あわてて近づくと にげてしまうよ。まずは 3頭の候補を よく見よう。',
        candidates: [
          { id: 'canopy-shadow', dinosaurId: 'brachiosaurus', name: '高い木の 影', sighting: '首が とても高く、丸い足あと' },
          { id: 'red-tail-shadow', dinosaurId: 'tyrannosaurus', name: '赤いしっぽの 影', sighting: '大きな三本指。東へ すすんだ', isAnswer: true },
          { id: 'spiky-shadow', dinosaurId: 'stegosaurus', name: 'ぎざぎざの 影', sighting: '背中に板があり、足あとが小さい' }
        ],
        notes: [
          { icon: '👣', title: '大きな 三本ゆび', detail: '川から ずっと つづいていた足あと' },
          { icon: '🌅', title: '朝日の ほうへ', detail: '手がかりは「東」の森を さしている' },
          { icon: '🍓', title: '赤い木の実', detail: 'かじったあとが 木のそばにある' }
        ],
        skillRounds: [
          { dinosaurId: 'baby-triceratops', skillName: 'つので 地面を しらべる', prompt: 'いちばん深い「おおきな」足あと。合う漢字は？', answer: '大', choices: ['小', '大'], result: 'トリケラトプスが「大」きな三本指を 見つけた！' },
          { dinosaurId: 'stegosaurus', skillName: 'せなかの板で 風をよむ', prompt: '葉っぱは 朝日の「ひがし」へ。合う漢字は？', answer: '東', choices: ['西', '東'], result: 'ステゴサウルスが「東」へ向かう風を 見つけた！' }
        ],
        kanjiIds: ['g1-dai', 'g2-higashi'],
        successMessage: '赤いしっぽの影が 本物だ！',
        goodAction: 'たんていノートと仲間の特技を使い、3頭の候補から本物を推理しました'
      } },
      { type: 'dialogue', entry: { speaker: 'ティラノサウルス', portraitId: 'tyrannosaurus', text: 'ここまで 来てくれたんだね。ぼくを さがしてくれて ありがとう！', emotion: 'happy' } },
      { type: 'reward', message: 'まぼろしの ティラノと 友だちになった！', dinosaurId: 'tyrannosaurus', eggGauge: 100, actionLabel: 'ぼうけんを ふりかえる', goodAction: '漢字の手がかりを集め、まぼろしのティラノを見つけました' }
    ]
  },
  {
    id: 'ending', number: 7, title: 'ティラノと 出会えた！', subtitle: 'まぼろしの広場', theme: 'ending',
    beats: [
      { type: 'dialogue', entry: { speaker: 'モジラ', text: 'やったね！ たくさんの 漢字を 見つけて、まぼろしの ティラノに 会えたよ！', emotion: 'happy' } },
      { type: 'dialogue', entry: { speaker: 'ティラノサウルス', portraitId: 'tyrannosaurus', text: 'きみの ぼうけんは すごかったよ。また いっしょに 森を たんけんしよう！', emotion: 'happy' } }
    ]
  }
]

export const chapterById = Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter])) as Record<Exclude<SceneId, 'title'>, SceneChapter>

export const sceneOrder = chapters.map((chapter) => chapter.id)

export const nextSceneId = (current: Exclude<SceneId, 'title'>): Exclude<SceneId, 'title'> | null => {
  const index = sceneOrder.indexOf(current)
  return index >= 0 && index < sceneOrder.length - 1 ? sceneOrder[index + 1] : null
}
