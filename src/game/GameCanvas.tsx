import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { AdventureScene } from './scenes/AdventureScene'
import { gameEvents } from './events/gameEvents'
import type { SceneChapter, SceneId } from '../types'
import type { CustomDinosaur } from '../features/creations/creationModel'

interface GameCanvasProps {
  sceneId: Exclude<SceneId, 'title'>
  theme: SceneChapter['theme']
  targetLabel: string
  objectiveActive: boolean
  reducedMotion: boolean
  collectedSparkleIds: string[]
  collectedDriftwoodIds: string[]
  collectedRuneIds: string[]
  bridgeRepaired: boolean
  customDinosaur: CustomDinosaur | null
}

export function GameCanvas({ sceneId, theme, targetLabel, objectiveActive, reducedMotion, collectedSparkleIds, collectedDriftwoodIds, collectedRuneIds, bridgeRepaired, customDinosaur }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [customDinosaurReady, setCustomDinosaurReady] = useState(false)
  const watercolorMap = ['intro', 'forest-fork', 'river', 'lost-dinosaur', 'cave', 'east-forest', 'ending'].includes(sceneId)

  useEffect(() => {
    if (!hostRef.current) return
    gameRef.current = new Phaser.Game({
      // The adventure is entirely 2D. Canvas rendering is more reliable here than
      // WebGL on embedded browsers/iOS, where large watercolor textures can become
      // black or neon-green after a GPU context/texture failure.
      type: Phaser.CANVAS,
      parent: hostRef.current,
      width: hostRef.current.clientWidth || 960,
      height: hostRef.current.clientHeight || 540,
      backgroundColor: '#173f35',
      scene: new AdventureScene(sceneId, theme, targetLabel, reducedMotion, collectedSparkleIds, collectedDriftwoodIds, collectedRuneIds, bridgeRepaired, customDinosaur),
      physics: { default: 'arcade', arcade: { debug: false } },
      render: { antialias: watercolorMap, pixelArt: !watercolorMap, roundPixels: true },
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
    })
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [sceneId, theme, reducedMotion, watercolorMap, customDinosaur?.id, customDinosaur?.updatedAt])

  useEffect(() => {
    gameEvents.emit('world:set-objective', { label: targetLabel, active: objectiveActive })
  }, [targetLabel, objectiveActive])

  useEffect(() => {
    setCustomDinosaurReady(false)
    if (!customDinosaur) return
    return gameEvents.on('world:custom-dinosaur-ready', ({ id }) => {
      if (id === customDinosaur.id) setCustomDinosaurReady(true)
    })
  }, [customDinosaur])

  return <div className={`game-canvas ${watercolorMap ? 'game-canvas--watercolor' : ''}`} ref={hostRef} aria-label={customDinosaur ? `じぶんで描いた ${customDinosaur.name}と森を歩くゲーム画面` : '森を歩くゲーム画面'} data-custom-dinosaur-ready={customDinosaurReady ? 'true' : 'false'} />
}
