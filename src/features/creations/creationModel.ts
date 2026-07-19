export type CreationPoint = { x: number; y: number }
export type CreationStroke = { stepIndex: number; points: CreationPoint[] }

export interface CustomDinosaur {
  version: 1
  id: string
  speciesId: 't-rex'
  name: string
  strokes: CreationStroke[]
  lineColor: string
  bodyColor: string
  createdAt: number
  updatedAt: number
}

export interface CreationDraft {
  version: 1
  stepIndex: number
  stepProgress: number
  stepDone: boolean
  strokes: CreationStroke[]
  selectedColor: string
  completed: boolean
  savedCreationId: string | null
  updatedAt: number
}

export const CREATION_VIEWBOX_WIDTH = 1118
export const CREATION_VIEWBOX_HEIGHT = 782

// This is the unchanged, source-derived T-Rex silhouette used by the approved drawing app.
export const T_REX_OUTLINE = 'M 499.2 62.0 L 457.6 64.6 L 423.8 75.0 L 376.9 103.6 L 314.5 108.8 L 270.3 129.6 L 239.1 166.0 L 223.5 220.6 L 226.1 249.3 L 241.7 264.9 L 252.1 298.7 L 265.1 303.9 L 280.7 288.3 L 293.7 288.3 L 309.3 306.5 L 317.1 306.5 L 337.9 280.5 L 389.9 285.7 L 389.9 296.1 L 366.5 316.9 L 343.1 314.3 L 327.5 342.9 L 298.9 340.3 L 285.9 387.1 L 324.9 413.1 L 429.0 407.9 L 429.0 420.9 L 403.0 433.9 L 387.3 449.5 L 379.5 470.3 L 382.1 485.9 L 400.4 485.9 L 408.2 496.3 L 416.0 496.3 L 423.8 483.3 L 434.2 483.3 L 447.2 522.3 L 434.2 574.4 L 436.8 626.4 L 408.2 652.4 L 400.4 688.8 L 431.6 701.8 L 455.0 699.2 L 460.2 704.4 L 512.2 694.0 L 525.2 686.2 L 548.6 626.4 L 566.8 623.8 L 587.6 626.4 L 592.8 647.2 L 564.2 673.2 L 559.0 688.8 L 564.2 709.6 L 631.8 720.0 L 691.6 701.8 L 704.6 675.8 L 715.0 613.4 L 787.9 584.8 L 858.1 519.7 L 891.9 454.7 L 894.5 410.5 L 878.9 407.9 L 824.3 431.3 L 782.7 433.9 L 730.7 420.9 L 668.2 379.3 L 637.0 345.5 L 613.6 298.7 L 611.0 205.0 L 587.6 127.0 L 569.4 98.4 L 530.4 69.8 Z'

export const CREATION_COLORS = [
  { name: 'みどり', value: '#6fbe5a' },
  { name: 'きいろ', value: '#ffd45f' },
  { name: 'オレンジ', value: '#f8a927' },
  { name: 'あか', value: '#ea6d5a' },
  { name: 'ピンク', value: '#ed9ab6' },
  { name: 'むらさき', value: '#a184c9' },
  { name: 'あお', value: '#5da1d6' },
  { name: 'ちゃいろ', value: '#b17f52' }
] as const

export const creationStrokePath = (points: CreationPoint[]) => {
  if (points.length === 0) return ''
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

// The approved drawing silhouette has its head on the left. The game world
// uses positive X for walking right, so only the runtime companion needs the
// opposite horizontal scale. The stored child-drawn points stay unchanged.
export const customDinosaurScaleXForDirection = (directionX: number) => directionX > 0 ? -1 : 1

export const creationPartClass = (stepIndex: number) => {
  if (stepIndex === 1 || stepIndex === 2) return 'creation-part-tail'
  if (stepIndex === 3) return 'creation-part-leg-back'
  if (stepIndex === 4) return 'creation-part-leg-front'
  if (stepIndex === 6) return 'creation-part-eye'
  return 'creation-part-body'
}
