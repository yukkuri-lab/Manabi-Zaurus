import type { Dinosaur } from '../types'

export const dinosaurs: Dinosaur[] = [
  { id: 'mojira', name: 'モジラ', description: '恐竜の森を よく知る、小さな きょうりゅう。主人公と いっしょに まぼろしの ティラノを さがす。', ability: '道にかくれた 漢字の手がかりを 見つける', favoriteFood: '木の実クッキー', discoveryLocation: 'はじまりの森', color: '#e47e4f', imageUrl: '/assets/dinosaurs/mojira.png' },
  { id: 'brachiosaurus', name: 'ブラキオサウルス', description: '高い 木の葉まで 見わたせる、むらさき色の やさしい友だち。', ability: '遠くの道や 足あとを 見つける', favoriteFood: '高い木の わかば', discoveryLocation: '大きな川', color: '#ad83cf', imageUrl: '/assets/dinosaurs/brachiosaurus.png' },
  { id: 'baby-triceratops', name: 'トリケラトプス', description: '草を もらって 元気になった、たのもしい友だち。', ability: 'つのと力で 道をひらく', favoriteFood: 'やわらかい草', discoveryLocation: 'はじまりの森', color: '#79a8d8', imageUrl: '/assets/dinosaurs/triceratops.png' },
  { id: 'stegosaurus', name: 'ステゴサウルス', description: '林の かげから そっと おうえんしてくれる。', ability: 'せなかの板で 風をよむ', favoriteFood: '赤い木の実', discoveryLocation: '林のこみち', color: '#e5b93d', imageUrl: '/assets/dinosaurs/stegosaurus.png' },
  { id: 'pteranodon', name: 'プテラノドン', description: '川の上を とび、橋の 材料を 見つけてくれた。', ability: '空から 道を見つける', favoriteFood: '川の小魚', discoveryLocation: 'きらめき川', color: '#d59a57' },
  { id: 'tyrannosaurus', name: 'ティラノサウルス', description: 'こわそうに 見えるけれど、ほんとうは 花を たいせつにする。', ability: '大きな岩を そっと動かす', favoriteFood: '東の森の赤い実', discoveryLocation: '東の森', color: '#dd6157', imageUrl: '/assets/dinosaurs/tyrannosaurus.png' }
]

export const dinosaurById = Object.fromEntries(dinosaurs.map((item) => [item.id, item])) as Record<string, Dinosaur>
