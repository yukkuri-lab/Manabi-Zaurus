export type SceneId =
  | 'title'
  | 'intro'
  | 'forest-fork'
  | 'river'
  | 'lost-dinosaur'
  | 'cave'
  | 'east-forest'
  | 'ending'

export interface KanjiItem {
  id: string
  character: string
  grade: 1 | 2
  readings: string[]
  hiragana: string
  meaning: string
  exampleWords: string[]
  exampleSentence: string
  difficulty: number
  relatedSceneTags: string[]
}

export interface KanjiProgress {
  kanjiId: string
  timesSeen: number
  correctCount: number
  incorrectCount: number
  masteryLevel: 0 | 1 | 2 | 3
  lastSeenAt: string | null
  nextReviewAt: string | null
  recentMistake: boolean
  streak: number
}

export interface PlayerProfile {
  name: string
  createdAt: string
  totalPlaySeconds: number
  lastPlayedDate: string
  todayPlaySeconds: number
}

export interface InventoryItem {
  id: string
  name: string
  description: string
  quantity: number
}

export interface GameProgress {
  currentScene: SceneId
  sceneStep: number
  completedScenes: SceneId[]
  kanjiProgress: Record<string, KanjiProgress>
  discoveredDinosaurIds: string[]
  inventory: InventoryItem[]
  eggGauge: number
  flags: Record<string, boolean | string | number>
  todayKanjiIds: string[]
  todayGoodActions: string[]
}

export interface Dinosaur {
  id: string
  name: string
  description: string
  ability: string
  favoriteFood: string
  discoveryLocation: string
  isDiscovered?: boolean
  color: string
  imageUrl?: string
}

export interface GameSettings {
  speechEnabled: boolean
  hiraganaAssist: boolean
  musicVolume: number
  soundVolume: number
  reducedMotion: boolean
  answerChoices: 2 | 3
  writingQuestions: boolean
  targetPlayMinutes: number
}

export interface SaveData {
  version: 2
  profile: PlayerProfile
  progress: GameProgress
  settings: GameSettings
  updatedAt: string
}

export interface DialogueEntry {
  speaker: string
  text: string
  speechText?: string
  emotion?: 'happy' | 'thinking' | 'surprised' | 'calm'
  portraitId?: string
}

export interface QuestionItem {
  id: string
  kanjiId: string
  prompt: string
  speechText: string
  correctAnswer: string
  choices: string[]
  hint: string
  explanation: string
}

export interface MiniGameItem {
  id: string
  kind: 'rock-smash' | 'bridge-build' | 'wind-read'
  dinosaurId: string
  skillName: string
  title: string
  instructions: string
  successMessage: string
  goodAction: string
  kanjiIds: string[]
}

export interface DetectiveCaseItem {
  id: string
  title: string
  introduction: string
  candidates: Array<{
    id: string
    dinosaurId: string
    name: string
    sighting: string
    isAnswer?: boolean
  }>
  notes: Array<{ icon: string; title: string; detail: string }>
  skillRounds: Array<{
    dinosaurId: string
    skillName: string
    prompt: string
    answer: string
    choices: string[]
    result: string
  }>
  kanjiIds: string[]
  successMessage: string
  goodAction: string
}

export type StoryBeat =
  | { type: 'dialogue'; entry: DialogueEntry }
  | { type: 'explore'; objective: string; targetLabel: string; hint: string }
  | { type: 'question'; question: QuestionItem }
  | { type: 'minigame'; game: MiniGameItem }
  | { type: 'detective'; case: DetectiveCaseItem }
  | { type: 'choice'; prompt: string; options: StoryChoice[] }
  | { type: 'reward'; message: string; item?: InventoryItem; dinosaurId?: string; eggKanji?: string; eggGauge?: number; actionLabel?: string; goodAction?: string }

export interface StoryChoice {
  id: string
  label: string
  sublabel: string
  flag: string
  goodAction?: string
}

export interface SceneChapter {
  id: Exclude<SceneId, 'title'>
  number: number
  title: string
  subtitle: string
  theme: 'forest' | 'river' | 'tracks' | 'cave' | 'east' | 'ending'
  beats: StoryBeat[]
}
