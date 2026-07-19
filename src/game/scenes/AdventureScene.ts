import Phaser from 'phaser'
import { assetUrl } from '../../utils/assetUrl'
import { gameEvents } from '../events/gameEvents'
import type { SceneChapter, SceneId } from '../../types'
import { customDinosaurScaleXForDirection, T_REX_OUTLINE, type CustomDinosaur } from '../../features/creations/creationModel'

type Theme = SceneChapter['theme']
type PlaySceneId = Exclude<SceneId, 'title'>

const TILE = 32
const WORLD_WIDTH = 1920
const WORLD_HEIGHT = 1080

type FacingDirection = 'down' | 'up' | 'side'

export class AdventureScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container
  private heroSprite!: Phaser.GameObjects.Image
  private companion!: Phaser.GameObjects.Container
  private companionSprite!: Phaser.GameObjects.Image
  private customCompanion: Phaser.GameObjects.Container | null = null
  private customCompanionSprite: Phaser.GameObjects.Image | null = null
  private target!: Phaser.GameObjects.Container
  private targetGlow!: Phaser.GameObjects.Arc
  private targetIcon!: Phaser.GameObjects.Graphics
  private targetText!: Phaser.GameObjects.Text
  private obstacles!: Phaser.Physics.Arcade.StaticGroup
  private touchDirections = new Set<'left' | 'right' | 'up' | 'down'>()
  private objectiveActive = false
  private autoInteractTriggered = false
  private objectiveLabel = 'しらべるもの'
  private lastTargetText = ''
  private facingX = 1
  private facingDirection: FacingDirection = 'down'
  private walkFrame = 0
  private lastWalkFrameAt = 0
  private trailX = 1
  private trailY = 0
  private wasMoving = false
  private lastProximityLevel = ''
  private lastProximityEmitAt = 0
  private encounterCharacters: Array<{ dinosaurId: string; container: Phaser.GameObjects.Container; radius: number }> = []
  private hiddenCharacters: Array<{ container: Phaser.GameObjects.Container; revealRadius: number; revealed: boolean }> = []
  private searchFootprints: Phaser.GameObjects.Container[] = []
  private encounteredDinosaurIds = new Set<string>()
  private sparkleCollectibles: Array<{ id: string; container: Phaser.GameObjects.Container; glow: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text }> = []
  private collectedSparkleCount = 0
  private driftwoodCollectibles: Array<{ id: string; container: Phaser.GameObjects.Container; log: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }> = []
  private collectedDriftwoodCount = 0
  private driftwoodCompleteEmitted = false
  private runeStones: Array<{ id: string; character: string; container: Phaser.GameObjects.Container; glow: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text; found: boolean }> = []
  private collectedRuneCount = 0
  private runeCompleteEmitted = false
  private cleanups: Array<() => void> = []

  constructor(
    private sceneId: PlaySceneId,
    private theme: Theme,
    initialLabel: string,
    private reducedMotion: boolean,
    private initialCollectedSparkleIds: string[],
    private initialCollectedDriftwoodIds: string[],
    private initialCollectedRuneIds: string[],
    private bridgeRepaired: boolean,
    private customDinosaur: CustomDinosaur | null
  ) {
    super('AdventureScene')
    this.objectiveLabel = initialLabel
    this.objectiveActive = Boolean(initialLabel)
    this.collectedSparkleCount = initialCollectedSparkleIds.filter((id) => id.startsWith(`sparkle:${sceneId}:`)).length
    this.collectedDriftwoodCount = initialCollectedDriftwoodIds.length
    this.collectedRuneCount = initialCollectedRuneIds.length
  }

  preload() {
    this.load.image('forest-watercolor', assetUrl('assets/backgrounds/forest-watercolor-v1.webp'))
    this.load.image('forest-fork-watercolor', assetUrl('assets/backgrounds/forest-fork-watercolor-v1.webp'))
    this.load.image('river-watercolor', assetUrl('assets/backgrounds/river-watercolor-v1.webp'))
    this.load.image('tracks-watercolor', assetUrl('assets/backgrounds/tracks-watercolor-v1.webp'))
    this.load.image('cave-watercolor', assetUrl('assets/backgrounds/cave-watercolor-v1.webp'))
    this.load.image('east-forest-watercolor', assetUrl('assets/backgrounds/east-forest-watercolor-v1.webp'))
    this.load.image('ending-watercolor', assetUrl('assets/backgrounds/ending-watercolor-v1.webp'))
    this.load.image('hero-front', assetUrl('assets/hero/hero-front.png'))
    this.load.image('hero-back', assetUrl('assets/hero/hero-back.png'))
    this.load.image('hero-side', assetUrl('assets/hero/hero-side.png'))
    this.load.image('hero-front-walk-a', assetUrl('assets/hero/hero-front-walk-a.png'))
    this.load.image('hero-front-walk-b', assetUrl('assets/hero/hero-front-walk-b.png'))
    this.load.image('hero-back-walk-a', assetUrl('assets/hero/hero-back-walk-a.png'))
    this.load.image('hero-back-walk-b', assetUrl('assets/hero/hero-back-walk-b.png'))
    this.load.image('hero-side-walk-a', assetUrl('assets/hero/hero-side-walk-a.png'))
    this.load.image('hero-side-walk-b', assetUrl('assets/hero/hero-side-walk-b.png'))
    this.load.image('dino-mojira', assetUrl('assets/dinosaurs/mojira.png'))
    this.load.image('dino-brachiosaurus', assetUrl('assets/dinosaurs/brachiosaurus.png'))
    this.load.image('dino-stegosaurus', assetUrl('assets/dinosaurs/stegosaurus.png'))
    this.load.image('dino-triceratops', assetUrl('assets/dinosaurs/triceratops.png'))
    this.load.image('dino-tyrannosaurus', assetUrl('assets/dinosaurs/tyrannosaurus.png'))
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.obstacles = this.physics.add.staticGroup()
    this.drawWorld()
    const spawn = this.getSpawnPoint()
    this.player = this.createHero(spawn.x, spawn.y)
    this.companion = this.createMojira(spawn.x - 105, spawn.y + 12)
    this.customCompanion = this.customDinosaur ? this.createCustomCompanion(spawn.x - 205, spawn.y + 20, this.customDinosaur) : null
    if (this.customDinosaur && this.customCompanion) gameEvents.emit('world:custom-dinosaur-ready', { id: this.customDinosaur.id })
    const targetPosition = this.getTargetPosition()
    this.target = this.createTarget(targetPosition.x, targetPosition.y)
    this.createSceneDinosaurs()
    this.createSearchFootprints()
    this.createRuneStones()
    this.createSparkleCollectibles()
    if (this.sceneId === 'river' && !this.bridgeRepaired) this.createBrokenBridgeBarrier()
    if (this.sceneId === 'river' && this.bridgeRepaired) this.createRepairedBridgeVisual()

    this.physics.add.collider(this.player, this.obstacles)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.startFollow(this.player, true, 0.11, 0.11)
    this.cameras.main.setDeadzone(180, 120)
    this.cameras.main.roundPixels = true

    const fitCameraToViewport = (gameSize: Phaser.Structs.Size) => {
      // Keep the 1920×1080 world covering tall phones and tablets as well as
      // landscape screens. Without this, a portrait viewport can see beyond the
      // world bounds and the empty renderer background appears around the map.
      const coverZoom = Math.max(gameSize.width / WORLD_WIDTH, gameSize.height / WORLD_HEIGHT)
      this.cameras.main.setZoom(Math.max(0.45, coverZoom))
    }
    fitCameraToViewport(this.scale.gameSize)
    this.scale.on(Phaser.Scale.Events.RESIZE, fitCameraToViewport)

    this.cleanups.push(
      () => this.scale.off(Phaser.Scale.Events.RESIZE, fitCameraToViewport),
      gameEvents.on('world:move', ({ direction, active }) => {
        if (active) this.touchDirections.add(direction)
        else this.touchDirections.delete(direction)
      }),
      gameEvents.on('world:action', () => this.tryInteract()),
      gameEvents.on('world:set-objective', ({ label, active }) => this.updateObjective(label, active))
    )
    const cleanupAll = () => this.cleanups.splice(0).forEach((cleanup) => cleanup())
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupAll)
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanupAll)
    if (!this.reducedMotion) this.cameras.main.fadeIn(280, 13, 35, 31)
    gameEvents.emit('world:ready', undefined)
  }

  update() {
    if (!this.player) return
    const left = this.touchDirections.has('left')
    const right = this.touchDirections.has('right')
    const up = this.touchDirections.has('up')
    const down = this.touchDirections.has('down')
    const dx = (right ? 1 : 0) - (left ? 1 : 0)
    const dy = (down ? 1 : 0) - (up ? 1 : 0)
    const moving = dx !== 0 || dy !== 0
    const length = Math.hypot(dx, dy) || 1
    const speed = 178
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocity((dx / length) * speed, (dy / length) * speed)
    if (moving) {
      this.trailX = dx / length
      this.trailY = dy / length
    }

    let nextDirection = this.facingDirection
    if (moving) {
      if (Math.abs(dx) > Math.abs(dy)) {
        nextDirection = 'side'
        this.facingX = dx > 0 ? 1 : -1
      } else {
        nextDirection = dy < 0 ? 'up' : 'down'
        this.facingX = 1
      }
    }
    if (nextDirection !== this.facingDirection) {
      this.facingDirection = nextDirection
      this.walkFrame = 0
      this.drawHeroFrame(this.facingDirection, this.walkFrame, true)
    }
    this.player.scaleX = this.facingDirection === 'side' ? -this.facingX : 1
    this.player.setDepth(500 + this.player.y)

    const companionX = this.player.x - this.trailX * 105
    const companionY = this.player.y - this.trailY * 105 + 12
    this.companion.x = Phaser.Math.Linear(this.companion.x, companionX, 0.09)
    this.companion.y = Phaser.Math.Linear(this.companion.y, companionY, 0.09)
    if (Math.abs(this.trailX) > 0.15) this.companion.scaleX = this.trailX > 0 ? 1 : -1
    this.companion.setDepth(490 + this.companion.y)
    if (this.customCompanion) {
      const customX = this.player.x - this.trailX * 205
      const customY = this.player.y - this.trailY * 205 + 20
      this.customCompanion.x = Phaser.Math.Linear(this.customCompanion.x, customX, 0.075)
      this.customCompanion.y = Phaser.Math.Linear(this.customCompanion.y, customY, 0.075)
      if (Math.abs(this.trailX) > 0.15) this.customCompanion.scaleX = customDinosaurScaleXForDirection(this.trailX)
      this.customCompanion.setDepth(480 + this.customCompanion.y)
    }

    for (const character of this.encounterCharacters) {
      if (this.encounteredDinosaurIds.has(character.dinosaurId)) continue
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, character.container.x, character.container.y)
      if (distance <= character.radius) {
        this.encounteredDinosaurIds.add(character.dinosaurId)
        body.setVelocity(0, 0)
        gameEvents.emit('world:encounter', { dinosaurId: character.dinosaurId })
      }
    }

    for (const hidden of this.hiddenCharacters) {
      if (hidden.revealed) continue
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, hidden.container.x, hidden.container.y)
      if (distance > hidden.revealRadius) continue
      hidden.revealed = true
      if (this.reducedMotion) hidden.container.setAlpha(1)
      else this.tweens.add({ targets: hidden.container, alpha: 1, y: hidden.container.y - 7, duration: 480, ease: 'Back.Out' })
    }

    for (const sparkle of [...this.sparkleCollectibles]) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, sparkle.container.x, sparkle.container.y)
      const nearby = distance < 165
      sparkle.glow.setAlpha(nearby ? 0.82 : 0.07)
      sparkle.label.setAlpha(distance < 120 ? 1 : 0)
      if (distance > 58) continue
      this.sparkleCollectibles = this.sparkleCollectibles.filter((item) => item.id !== sparkle.id)
      this.collectedSparkleCount += 1
      body.setVelocity(0, 0)
      this.tweens.killTweensOf(sparkle.container)
      gameEvents.emit('world:sparkle', { id: sparkle.id, sceneId: this.sceneId, count: this.collectedSparkleCount, total: 3 })
      if (this.reducedMotion) sparkle.container.destroy()
      else this.tweens.add({ targets: sparkle.container, y: sparkle.container.y - 42, scale: 1.7, alpha: 0, duration: 360, ease: 'Back.In', onComplete: () => sparkle.container.destroy() })
    }

    for (const stone of this.runeStones) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, stone.container.x, stone.container.y)
      stone.label.setAlpha(stone.found || distance < 120 ? 1 : 0)
      if (stone.found || distance > 66) continue
      stone.found = true
      this.collectedRuneCount += 1
      body.setVelocity(0, 0)
      stone.glow.setAlpha(0.48).setStrokeStyle(3, 0xffed9b, 0.9)
      stone.label.setText(`石文字「${stone.character}」`).setAlpha(1)
      gameEvents.emit('world:rune', { id: stone.id, character: stone.character, count: this.collectedRuneCount, total: 3 })
      if (!this.reducedMotion) this.tweens.add({ targets: stone.container, scale: 1.13, yoyo: true, duration: 260, ease: 'Back.Out' })
      if (this.collectedRuneCount === 3 && this.isRuneHunt() && !this.runeCompleteEmitted) {
        this.runeCompleteEmitted = true
        this.time.delayedCall(520, () => gameEvents.emit('world:interact', { label: this.objectiveLabel }))
      }
    }

    for (const driftwood of [...this.driftwoodCollectibles]) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, driftwood.container.x, driftwood.container.y)
      driftwood.log.setAlpha(distance < 135 ? 1 : 0.72)
      driftwood.label.setAlpha(distance < 105 ? 1 : 0)
      if (distance > 52) continue
      this.driftwoodCollectibles = this.driftwoodCollectibles.filter((item) => item.id !== driftwood.id)
      this.collectedDriftwoodCount += 1
      body.setVelocity(0, 0)
      this.tweens.killTweensOf(driftwood.container)
      gameEvents.emit('world:driftwood', { id: driftwood.id, count: this.collectedDriftwoodCount, total: 3 })
      if (this.reducedMotion) driftwood.container.destroy()
      else this.tweens.add({ targets: driftwood.container, y: driftwood.container.y - 35, scale: 1.5, alpha: 0, duration: 320, onComplete: () => driftwood.container.destroy() })
      if (this.collectedDriftwoodCount === 3 && !this.driftwoodCompleteEmitted) {
        this.driftwoodCompleteEmitted = true
        this.time.delayedCall(420, () => gameEvents.emit('world:interact', { label: this.objectiveLabel }))
      }
    }

    if (this.objectiveActive && this.time.now - this.lastProximityEmitAt > 180) {
      const distance = this.isDriftwoodHunt() && this.driftwoodCollectibles.length > 0
        ? Math.min(...this.driftwoodCollectibles.map((item) => Phaser.Math.Distance.Between(this.player.x, this.player.y, item.container.x, item.container.y)))
        : this.isRuneHunt() && this.runeStones.some((item) => !item.found)
          ? Math.min(...this.runeStones.filter((item) => !item.found).map((item) => Phaser.Math.Distance.Between(this.player.x, this.player.y, item.container.x, item.container.y)))
          : Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y)
      const level = distance < 185 ? 'very-near' : distance < 360 ? 'near' : distance < 680 ? 'warm' : 'far'
      if (level !== this.lastProximityLevel || this.time.now - this.lastProximityEmitAt > 850) {
        this.lastProximityLevel = level
        this.lastProximityEmitAt = this.time.now
        gameEvents.emit('world:proximity', { label: this.objectiveLabel, level })
      }
    }

    if (!this.reducedMotion && moving) {
      if (this.time.now - this.lastWalkFrameAt > 125) {
        this.walkFrame = this.walkFrame === 0 ? 1 : 0
        this.lastWalkFrameAt = this.time.now
        this.drawHeroFrame(this.facingDirection, this.walkFrame, true)
      }
      this.heroSprite.y = 31 - Math.abs(Math.sin(this.time.now / 105)) * 2
      this.companionSprite.y = -15 + Math.sin(this.time.now / 105 + 1) * 2
      if (this.customCompanionSprite) this.customCompanionSprite.y = -10 + Math.sin(this.time.now / 105 + 2) * 3
    } else {
      if (this.wasMoving || this.walkFrame !== 0) {
        this.walkFrame = 0
        this.drawHeroFrame(this.facingDirection, 0, false)
      }
      this.heroSprite.y = 31
      this.companionSprite.y = this.reducedMotion ? -15 : -15 + Math.sin(this.time.now / 420) * 1.5
      if (this.customCompanionSprite) this.customCompanionSprite.y = this.reducedMotion ? -10 : -10 + Math.sin(this.time.now / 470 + 2) * 1.8
    }
    this.wasMoving = moving

    if (!this.isDriftwoodHunt() && !this.isRuneHunt()) {
      const targetDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y)
      const close = targetDistance < 124
      if (this.isTriceratopsSearch()) this.target.setVisible(this.objectiveActive && targetDistance < 230)
      this.targetGlow.setStrokeStyle(close ? 6 : 3, close ? 0xfff0a0 : 0xd7eb7b, close ? 1 : 0.78)
      if (close && this.objectiveActive && !this.autoInteractTriggered) {
        this.autoInteractTriggered = true
        body.setVelocity(0, 0)
        gameEvents.emit('world:interact', { label: this.objectiveLabel })
      }
      const nextTargetText = close && this.objectiveActive ? `${this.objectiveLabel}\nみつけた！` : this.objectiveLabel
      if (nextTargetText !== this.lastTargetText) {
        this.targetText.setText(nextTargetText)
        this.lastTargetText = nextTargetText
      }
    }
  }

  private updateObjective(label: string, active: boolean) {
    this.objectiveLabel = label || 'しらべるもの'
    this.objectiveActive = active
    this.autoInteractTriggered = false
    this.lastProximityLevel = ''
    if (!this.target) return
    const targetPosition = this.getTargetPositionForLabel(this.objectiveLabel)
    this.target.setPosition(targetPosition.x, targetPosition.y)
    this.target.setVisible(active && !this.isDriftwoodHunt() && !this.isRuneHunt() && !this.isTriceratopsSearch())
    this.searchFootprints.forEach((footprint) => footprint.setVisible(active && this.isTriceratopsSearch()))
    if (active && this.isDriftwoodHunt()) {
      this.createHiddenDriftwood()
      if (this.collectedDriftwoodCount >= 3 && !this.driftwoodCompleteEmitted) {
        this.driftwoodCompleteEmitted = true
        this.time.delayedCall(250, () => gameEvents.emit('world:interact', { label: this.objectiveLabel }))
      }
    }
    if (active && this.isRuneHunt() && this.collectedRuneCount >= 3 && !this.runeCompleteEmitted) {
      this.runeCompleteEmitted = true
      this.time.delayedCall(250, () => gameEvents.emit('world:interact', { label: this.objectiveLabel }))
    }
    this.drawTargetIcon(this.objectiveLabel)
    this.targetText.setText(this.objectiveLabel)
    this.lastTargetText = this.objectiveLabel
  }

  private tryInteract() {
    if (!this.objectiveActive) return
    if (this.isDriftwoodHunt()) return
    if (this.isRuneHunt()) return
    const close = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y) < 135
    if (close) {
      this.autoInteractTriggered = true
      gameEvents.emit('world:interact', { label: this.objectiveLabel })
    } else {
      this.cameras.main.shake(65, 0.001)
      this.targetText.setText(`${this.objectiveLabel}\nもう少し ちかくへ`)
      this.lastTargetText = `${this.objectiveLabel}\nもう少し ちかくへ`
    }
  }

  private drawWorld() {
    const ground = this.add.graphics().setDepth(0)
    if (this.usesWatercolorMap()) {
      const backgroundKey: Record<PlaySceneId, string> = {
        intro: 'forest-watercolor',
        'forest-fork': 'forest-fork-watercolor',
        river: 'river-watercolor',
        'lost-dinosaur': 'tracks-watercolor',
        cave: 'cave-watercolor',
        'east-forest': 'east-forest-watercolor',
        ending: 'ending-watercolor'
      }
      this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, backgroundKey[this.sceneId])
        .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
        .setDepth(-2)
      this.addWatercolorCollisions()
      this.drawWatercolorSceneAccents(ground)
      if (this.sceneId === 'forest-fork') this.drawSceneLandmark(ground)
    } else {
      this.drawGroundTiles(ground)
      this.drawScenePaths(ground)
      this.drawSceneLandmark(ground)
      this.drawScenery(ground)
    }

    const shade = this.add.graphics().setDepth(900)
    shade.fillStyle(0x102c28, 0.08)
    shade.fillRect(0, WORLD_HEIGHT - 40, WORLD_WIDTH, 40)
    shade.lineStyle(4, 0x173f35, 0.6)
    shade.strokeRect(2, 2, WORLD_WIDTH - 4, WORLD_HEIGHT - 4)
  }

  private usesWatercolorMap() {
    return true
  }

  private drawWatercolorSceneAccents(ground: Phaser.GameObjects.Graphics) {
    if (this.sceneId === 'lost-dinosaur') {
      this.drawForwardFootprintTrail(ground)
      return
    }
    if (this.sceneId === 'east-forest') this.drawEastForestDawn(ground)
  }

  private drawForwardFootprintTrail(ground: Phaser.GameObjects.Graphics) {
    const route = this.getRoutePoints()
    ground.lineStyle(82, 0xf3dfae, 0.92)
    ground.beginPath()
    ground.moveTo(route[0][0], route[0][1])
    route.slice(1).forEach(([x, y]) => ground.lineTo(x, y))
    ground.strokePath()
    ground.lineStyle(4, 0xffefc8, 0.34)
    ground.beginPath()
    ground.moveTo(route[0][0], route[0][1] - 8)
    route.slice(1).forEach(([x, y]) => ground.lineTo(x, y - 8))
    ground.strokePath()

    for (let segment = 0; segment < route.length - 1; segment++) {
      const [x1, y1] = route[segment]
      const [x2, y2] = route[segment + 1]
      const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2)
      const steps = Math.max(2, Math.floor(distance / 105))
      const direction = Math.atan2(y2 - y1, x2 - x1)
      for (let step = 0; step < steps; step++) {
        const t = (step + 0.48) / steps
        const x = Phaser.Math.Linear(x1, x2, t)
        const y = Phaser.Math.Linear(y1, y2, t)
        const print = this.add.graphics()
        print.fillStyle(0x9a6b3d, 0.62)
        print.fillEllipse(0, 5, 13, 19)
        print.fillEllipse(-8, -8, 7, 12)
        print.fillEllipse(0, -12, 7, 13)
        print.fillEllipse(8, -8, 7, 12)
        this.add.container(x, y, [print])
          .setAngle(Phaser.Math.RadToDeg(direction) + 90)
          .setDepth(8)
      }
    }
  }

  private drawEastForestDawn(ground: Phaser.GameObjects.Graphics) {
    ground.fillStyle(0xffdf70, 0.13)
    ground.fillCircle(1760, 80, 360)
    ground.fillStyle(0xffec91, 0.16)
    ground.fillCircle(1760, 80, 235)
    ground.fillStyle(0xfff2a8, 0.82)
    ground.fillCircle(1760, 80, 54)

    ground.fillStyle(0xfff8cf, 0.18)
    ground.fillEllipse(1260, 410, 610, 92)
    ground.fillEllipse(1510, 520, 470, 68)
    ground.fillEllipse(1020, 650, 390, 56)

    ground.fillStyle(0x6a746c, 0.96)
    ground.fillRoundedRect(1510, 185, 42, 188, 12)
    ground.fillRoundedRect(1685, 185, 42, 188, 12)
    ground.fillRoundedRect(1490, 166, 257, 48, 14)
    ground.fillStyle(0x929b84, 0.72)
    ground.fillRoundedRect(1518, 194, 16, 158, 7)
    ground.fillRoundedRect(1693, 194, 16, 158, 7)
    ground.fillStyle(0xffdc69, 0.95)
    ground.fillCircle(1618, 192, 39)
    const eastRune = this.add.text(1618, 192, '東', {
      fontFamily: 'serif', fontSize: '42px', fontStyle: 'bold', color: '#173f35',
      stroke: '#fff1a1', strokeThickness: 2
    }).setOrigin(0.5).setDepth(4)
    if (!this.reducedMotion) this.tweens.add({ targets: eastRune, alpha: 0.62, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.InOut' })

    for (let index = 0; index < 14; index++) {
      const x = 1120 + (index * 83) % 650
      const y = 270 + (index * 47) % 430
      ground.fillStyle(index % 2 === 0 ? 0xffe36d : 0xf3a857, 0.55)
      ground.fillCircle(x, y, index % 3 === 0 ? 4 : 3)
    }
  }

  private addWatercolorCollisions() {
    type CollisionZone = { x: number; y: number; width: number; height: number }
    const edgeLeft = { x: 45, y: 540, width: 90, height: 1080 }
    const edgeRight = { x: 1875, y: 540, width: 90, height: 1080 }
    const zones: Record<PlaySceneId, CollisionZone[]> = {
      intro: [
        { x: 72, y: 300, width: 140, height: 500 },
        { x: 330, y: 95, width: 360, height: 150 },
        { x: 850, y: 65, width: 560, height: 120 },
        { x: 1350, y: 75, width: 280, height: 130 },
        { x: 1735, y: 175, width: 300, height: 260 },
        { x: 1870, y: 570, width: 100, height: 630 },
        { x: 1690, y: 985, width: 440, height: 150 },
        { x: 1260, y: 1020, width: 300, height: 105 },
        { x: 880, y: 1030, width: 260, height: 85 }
      ],
      'forest-fork': [
        edgeLeft, edgeRight,
        { x: 280, y: 1025, width: 500, height: 110 },
        { x: 1640, y: 1025, width: 500, height: 110 },
        { x: 960, y: 45, width: 610, height: 90 }
      ],
      river: [
        edgeLeft, edgeRight,
        { x: 960, y: 205, width: 300, height: 410 },
        { x: 960, y: 875, width: 300, height: 410 }
      ],
      'lost-dinosaur': [
        edgeLeft, edgeRight,
        { x: 390, y: 75, width: 700, height: 150 },
        { x: 1530, y: 1030, width: 650, height: 100 }
      ],
      cave: [
        { x: 41, y: 540, width: 82, height: 1080 },
        { x: 1879, y: 540, width: 82, height: 1080 },
        { x: 960, y: 42, width: 1920, height: 84 },
        { x: 960, y: 1040, width: 1920, height: 80 }
      ],
      'east-forest': [
        edgeLeft, edgeRight,
        { x: 390, y: 75, width: 700, height: 150 },
        { x: 1540, y: 1030, width: 650, height: 100 }
      ],
      ending: [
        edgeLeft, edgeRight,
        { x: 960, y: 42, width: 1920, height: 84 },
        { x: 1650, y: 1015, width: 540, height: 130 }
      ]
    }
    const sceneryZones = zones[this.sceneId]
    sceneryZones.forEach(({ x, y, width, height }) => this.addObstacle(x, y, width, height))
  }

  private drawGroundTiles(g: Phaser.GameObjects.Graphics) {
    const palettes: Record<Theme, [number, number, number]> = {
      forest: [0x78a84e, 0x6f9d48, 0x98bd63],
      river: [0x8db35b, 0x83a954, 0xa6c66c],
      tracks: [0x9eac62, 0x92a158, 0xb8ba72],
      cave: [0x3c4742, 0x343f3b, 0x53605a],
      east: [0x9cad5c, 0x8fa153, 0xc3bd68],
      ending: [0x85ad58, 0x79a24f, 0xb1c872]
    }
    const [base, alternate, detail] = palettes[this.theme]
    g.fillStyle(base)
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    for (let row = 0; row < WORLD_HEIGHT / TILE; row++) {
      for (let column = 0; column < WORLD_WIDTH / TILE; column++) {
        const x = column * TILE
        const y = row * TILE
        const noise = (column * 17 + row * 31 + column * row * 3) % 11
        if (noise < 3) {
          g.fillStyle(alternate, 0.45)
          g.fillRect(x, y, TILE, TILE)
        }
        g.fillStyle(detail, 0.38)
        if (noise % 3 === 0) {
          g.fillRect(x + 6, y + 9, 3, 7)
          g.fillRect(x + 11, y + 5, 3, 11)
        } else if (noise % 4 === 0) {
          g.fillRect(x + 23, y + 20, 4, 3)
          g.fillRect(x + 18, y + 25, 3, 3)
        }
      }
    }
  }

  private drawScenePaths(g: Phaser.GameObjects.Graphics) {
    if (this.theme === 'cave') {
      this.drawCaveFloor(g)
      return
    }
    if (this.sceneId === 'river') {
      this.drawRiver(g)
      return
    }

    const edge = this.theme === 'east' ? 0x7d6b3f : 0x796645
    const path = this.theme === 'tracks' ? 0xc4a86a : 0xcbb47a
    const light = this.theme === 'east' ? 0xe4c879 : 0xe0c990

    if (this.sceneId === 'forest-fork') {
      this.drawWidePath(g, [[940, 1040], [940, 760], [910, 620]], edge, path, light)
      this.drawWidePath(g, [[910, 620], [710, 500], [520, 330], [390, 170]], edge, path, light)
      this.drawWidePath(g, [[910, 620], [1120, 500], [1370, 360], [1580, 210]], edge, path, light)
    } else if (this.sceneId === 'lost-dinosaur') {
      this.drawWidePath(g, [[170, 940], [420, 820], [650, 850], [900, 690], [1160, 650], [1370, 450], [1630, 290]], edge, path, light)
    } else if (this.sceneId === 'east-forest') {
      this.drawWidePath(g, [[160, 940], [430, 850], [710, 880], [980, 690], [1240, 620], [1490, 390], [1650, 250]], edge, path, light)
    } else if (this.sceneId === 'ending') {
      this.drawWidePath(g, [[260, 940], [520, 820], [820, 710], [1110, 560], [1390, 380]], edge, path, light)
      g.fillStyle(edge, 0.45); g.fillCircle(1420, 330, 225)
      g.fillStyle(path); g.fillCircle(1420, 330, 207)
      g.fillStyle(light, 0.28); g.fillCircle(1420, 330, 168)
    } else {
      this.drawWidePath(g, [[170, 930], [440, 850], [720, 860], [1010, 720], [1260, 700], [1450, 500], [1630, 340]], edge, path, light)
    }
  }

  private drawWidePath(g: Phaser.GameObjects.Graphics, points: Array<[number, number]>, edge: number, path: number, light: number) {
    g.lineStyle(104, edge, 0.55)
    g.beginPath(); g.moveTo(points[0][0], points[0][1]); points.slice(1).forEach(([x, y]) => g.lineTo(x, y)); g.strokePath()
    g.lineStyle(82, path, 1)
    g.beginPath(); g.moveTo(points[0][0], points[0][1]); points.slice(1).forEach(([x, y]) => g.lineTo(x, y)); g.strokePath()
    g.lineStyle(5, light, 0.4)
    g.beginPath(); g.moveTo(points[0][0], points[0][1] - 9); points.slice(1).forEach(([x, y]) => g.lineTo(x, y - 9)); g.strokePath()
  }

  private drawPixelPathRect(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, edge: number, path: number, light: number) {
    g.fillStyle(edge, 0.55); g.fillRect(x, y - 8, width, height + 16)
    g.fillStyle(path); g.fillRect(x, y, width, height)
    for (let tileX = x + 16; tileX < x + width - 16; tileX += 48) {
      g.fillStyle(light, 0.45); g.fillRect(tileX, y + 18 + (tileX % 3) * 8, 18, 5)
      g.fillStyle(0x8a744e, 0.35); g.fillRect(tileX + 22, y + 66, 9, 4)
    }
  }

  private drawRiver(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(0x416e6d); g.fillRect(840, 0, 300, WORLD_HEIGHT)
    g.fillStyle(0x4b8990); g.fillRect(854, 0, 272, WORLD_HEIGHT)
    for (let y = 18; y < WORLD_HEIGHT; y += 40) {
      g.fillStyle(0x8fc6bd, 0.72)
      g.fillRect(870 + (y % 3) * 24, y, 68, 4)
      g.fillRect(985 + (y % 5) * 10, y + 17, 82, 3)
    }
    g.fillStyle(0x78613f); g.fillRect(0, 530, WORLD_WIDTH, 140)
    g.fillStyle(0xc8ad70); g.fillRect(0, 545, WORLD_WIDTH, 110)
    g.fillStyle(0x3e3024); g.fillRect(810, 515, 360, 170)
    for (let x = 820; x < 1160; x += 34) {
      g.fillStyle(x === 990 ? 0x66513b : 0xa87342)
      g.fillRect(x, 524, 28, 152)
      g.fillStyle(0xd49b5d, 0.5); g.fillRect(x + 4, 531, 4, 136)
    }
    g.fillStyle(0x4e3a27); g.fillRect(800, 540, 380, 9); g.fillRect(800, 652, 380, 9)
    this.addObstacle(990, 250, 286, 500)
    this.addObstacle(990, 890, 286, 360)
  }

  private drawCaveFloor(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(0x1d2826); g.fillRect(0, 0, WORLD_WIDTH, 90); g.fillRect(0, WORLD_HEIGHT - 72, WORLD_WIDTH, 72); g.fillRect(0, 0, 82, WORLD_HEIGHT); g.fillRect(WORLD_WIDTH - 82, 0, 82, WORLD_HEIGHT)
    for (let x = 84; x < WORLD_WIDTH - 84; x += 64) {
      g.fillStyle(x % 128 ? 0x52605a : 0x46534e)
      g.fillRect(x, 90, 58, 26); g.fillRect(x + 12, WORLD_HEIGHT - 98, 50, 26)
    }
    for (let y = 116; y < WORLD_HEIGHT - 100; y += 64) {
      g.fillStyle(y % 128 ? 0x46534e : 0x52605a)
      g.fillRect(50, y, 46, 55); g.fillRect(WORLD_WIDTH - 96, y + 12, 46, 55)
    }
    this.drawWidePath(g, [[210, 920], [480, 820], [760, 850], [1040, 670], [1320, 570], [1550, 330]], 0x504738, 0x75654b, 0x96846a)
    for (let x = 120; x < WORLD_WIDTH - 120; x += 80) {
      g.lineStyle(2, 0x8b7c63, 0.4); g.strokeRect(x, 180 + (x % 5) * 135, 52, 40)
    }
    this.addObstacle(WORLD_WIDTH / 2, 45, WORLD_WIDTH, 90)
    this.addObstacle(WORLD_WIDTH / 2, WORLD_HEIGHT - 36, WORLD_WIDTH, 72)
    this.addObstacle(41, WORLD_HEIGHT / 2, 82, WORLD_HEIGHT)
    this.addObstacle(WORLD_WIDTH - 41, WORLD_HEIGHT / 2, 82, WORLD_HEIGHT)
  }

  private drawSceneLandmark(g: Phaser.GameObjects.Graphics) {
    if (this.sceneId === 'intro') {
      this.drawAncientTree(g, 1600, 215)
    } else if (this.sceneId === 'forest-fork') {
      this.drawSignpost(g, 910, 595)
      this.drawStoneRune(g, 390, 170, '林')
      this.drawStoneRune(g, 1580, 210, '森')
    } else if (this.sceneId === 'lost-dinosaur') {
      this.drawTracks(g)
      this.drawCampCloth(g, 1640, 225)
    } else if (this.sceneId === 'cave') {
      this.drawTorches(g)
      this.drawCrystalCluster(g, 1540, 255)
    } else if (this.sceneId === 'east-forest') {
      this.drawSunAltar(g, 1660, 160)
      this.drawPixelBoulder(g, 1575, 275, 1.3)
    } else if (this.sceneId === 'ending') {
      this.drawStoneCircle(g)
    }
  }

  private drawScenery(g: Phaser.GameObjects.Graphics) {
    if (this.theme !== 'cave') {
      const route = this.getRoutePoints()
      let treeIndex = 0
      for (let row = 0; row < 7; row++) {
        for (let column = 0; column < 11; column++) {
          const x = 80 + column * 174 + (row % 2) * 68
          const y = 115 + row * 148 + ((column * 31 + row * 17) % 45)
          if (x > WORLD_WIDTH - 70 || y > WORLD_HEIGHT - 45) continue
          if (this.distanceToRoute(x, y, route) < (this.sceneId === 'ending' ? 205 : 118)) continue
          if (this.sceneId === 'river' && x > 790 && x < 1190) continue
          const target = this.getTargetPosition()
          if (Phaser.Math.Distance.Between(x, y, target.x, target.y) < 145) continue
          this.drawPixelTree(g, x, y, treeIndex % 3, treeIndex % 4 === 0 ? 1.08 : 0.9)
          treeIndex++
        }
      }
      this.drawForestDetails(g)
    } else {
      this.drawCaveDetails(g)
    }
  }

  private drawPixelTree(g: Phaser.GameObjects.Graphics, x: number, y: number, variant: number, scale: number) {
    const dark = variant === 0 ? 0x1d4b3b : variant === 1 ? 0x285641 : 0x315e43
    const mid = variant === 0 ? 0x326c49 : variant === 1 ? 0x3d754c : 0x477c4f
    const light = variant === 0 ? 0x599353 : variant === 1 ? 0x6a9f58 : 0x73a95b
    const s = scale
    g.fillStyle(0x294437, 0.24); g.fillEllipse(x, y + 32 * s, 92 * s, 28 * s)
    g.fillStyle(0x5b3e29); g.fillRect(x - 11 * s, y - 3 * s, 22 * s, 55 * s)
    g.fillStyle(0x8b5b35); g.fillRect(x - 6 * s, y, 7 * s, 48 * s)
    g.fillStyle(dark)
    g.fillRect(x - 44 * s, y - 55 * s, 88 * s, 45 * s)
    g.fillRect(x - 30 * s, y - 78 * s, 62 * s, 28 * s)
    g.fillRect(x - 58 * s, y - 40 * s, 116 * s, 28 * s)
    g.fillStyle(mid)
    g.fillRect(x - 36 * s, y - 59 * s, 70 * s, 36 * s)
    g.fillRect(x - 48 * s, y - 40 * s, 92 * s, 23 * s)
    g.fillStyle(light)
    g.fillRect(x - 25 * s, y - 66 * s, 29 * s, 13 * s)
    g.fillRect(x + 14 * s, y - 43 * s, 23 * s, 10 * s)
    g.fillStyle(0xa2c56b, 0.8); g.fillRect(x - 20 * s, y - 63 * s, 8 * s, 6 * s)
    this.addObstacle(x, y + 20 * s, 68 * s, 42 * s)
  }

  private drawForestDetails(g: Phaser.GameObjects.Graphics) {
    for (let index = 0; index < 34; index++) {
      const x = 70 + (index * 233) % (WORLD_WIDTH - 140)
      const y = 90 + (index * 137) % (WORLD_HEIGHT - 180)
      if (this.distanceToRoute(x, y, this.getRoutePoints()) < 78) continue
      if (index % 2 === 0) {
        g.fillStyle(0x3f773f); g.fillRect(x, y, 4, 15); g.fillRect(x - 6, y + 6, 6, 4); g.fillRect(x + 4, y + 3, 7, 4)
        g.fillStyle(index % 4 === 0 ? 0xf1c34e : 0xd87a69); g.fillRect(x - 5, y - 2, 6, 6); g.fillRect(x + 4, y + 2, 6, 6)
      } else {
        g.fillStyle(0x53644d); g.fillRect(x, y + 4, 20, 12); g.fillStyle(0x77836a); g.fillRect(x + 4, y, 13, 8)
      }
    }
  }

  private drawAncientTree(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x203f34, 0.24); g.fillEllipse(x, y + 68, 156, 38)
    g.fillStyle(0x4a3225); g.fillRect(x - 25, y - 4, 50, 84)
    g.fillStyle(0x7c5332); g.fillRect(x - 14, y, 16, 74)
    g.fillStyle(0x193f34); g.fillRect(x - 78, y - 72, 156, 54); g.fillRect(x - 53, y - 105, 106, 44); g.fillRect(x - 96, y - 48, 192, 36)
    g.fillStyle(0x2e7049); g.fillRect(x - 67, y - 69, 134, 45); g.fillRect(x - 43, y - 93, 86, 32)
    g.fillStyle(0x69a654); g.fillRect(x - 30, y - 83, 42, 15); g.fillRect(x + 30, y - 50, 35, 13)
    g.fillStyle(0xeedb75, 0.35); g.fillTriangle(x - 45, y - 22, x + 45, y - 22, x + 22, y + 84)
    this.addObstacle(x, y + 44, 82, 66)
  }

  private drawSignpost(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x3c2e21); g.fillRect(x - 7, y - 22, 14, 64)
    g.fillStyle(0xa46e3e); g.fillRect(x - 55, y - 35, 110, 29)
    g.fillStyle(0xd69a58); g.fillRect(x - 50, y - 31, 100, 6)
    g.fillStyle(0x2e3e32); g.fillTriangle(x - 45, y - 16, x - 32, y - 23, x - 32, y - 10); g.fillTriangle(x + 45, y - 16, x + 32, y - 23, x + 32, y - 10)
  }

  private drawStoneRune(g: Phaser.GameObjects.Graphics, x: number, y: number, character: string) {
    g.fillStyle(0x34473f, 0.28); g.fillEllipse(x, y + 28, 68, 18)
    g.fillStyle(0x55655d); g.fillRect(x - 24, y - 25, 48, 54)
    g.fillStyle(0x7d8a79); g.fillRect(x - 18, y - 20, 35, 42)
    this.add.text(x, y, character, { fontFamily: 'serif', fontSize: '23px', color: '#f2db7a', stroke: '#263d36', strokeThickness: 3 }).setOrigin(0.5).setDepth(4)
  }

  private drawTracks(g: Phaser.GameObjects.Graphics) {
    for (let index = 0; index < 18; index++) {
      const progress = index / 17
      const x = 430 + progress * 1120
      const y = 820 - progress * 500 + (index % 2) * 28
      g.fillStyle(0x68513b, 0.7); g.fillRect(x - 7, y - 2, 14, 19); g.fillRect(x - 12, y - 8, 6, 8); g.fillRect(x - 2, y - 12, 6, 8); g.fillRect(x + 8, y - 8, 6, 8)
    }
  }

  private drawCampCloth(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x4b3828); g.fillRect(x - 36, y + 20, 72, 8)
    g.fillStyle(0xe1aa5b); g.fillTriangle(x, y - 35, x - 44, y + 21, x + 44, y + 21)
    g.fillStyle(0xb9674d); g.fillTriangle(x, y - 25, x - 29, y + 15, x + 29, y + 15)
  }

  private drawTorches(g: Phaser.GameObjects.Graphics) {
    ;[[180, 230], [620, 760], [1040, 610], [1460, 410], [1740, 210], [1720, 850]].forEach(([x, y]) => {
      g.fillStyle(0x61422d); g.fillRect(x - 4, y, 8, 32)
      g.fillStyle(0xef8d43, 0.28); g.fillCircle(x, y - 4, 32)
      g.fillStyle(0xf4c34f); g.fillRect(x - 7, y - 15, 14, 20)
      g.fillStyle(0xffe98a); g.fillRect(x - 3, y - 12, 6, 12)
    })
  }

  private drawCrystalCluster(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x231f1d, 0.4); g.fillEllipse(x, y + 32, 86, 20)
    ;[[-24, 8, 0xb95b4b], [0, -10, 0xe7774f], [24, 5, 0xf0a85f]].forEach(([offset, top, color]) => {
      g.fillStyle(color); g.fillTriangle(x + offset - 13, y + 28, x + offset, y + top, x + offset + 13, y + 28)
      g.fillStyle(0xffd48a, 0.65); g.fillTriangle(x + offset - 3, y + 21, x + offset, y + top + 4, x + offset + 4, y + 21)
    })
  }

  private drawSunAltar(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x675f50); g.fillRect(x - 50, y + 25, 100, 18); g.fillRect(x - 36, y + 8, 72, 18)
    g.fillStyle(0xd5b95f); g.fillCircle(x, y - 12, 30)
    g.fillStyle(0xf7de79); g.fillCircle(x, y - 12, 17)
    g.lineStyle(5, 0xd5b95f, 1)
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      g.lineBetween(x + Math.cos(angle) * 37, y - 12 + Math.sin(angle) * 37, x + Math.cos(angle) * 48, y - 12 + Math.sin(angle) * 48)
    }
  }

  private drawPixelBoulder(g: Phaser.GameObjects.Graphics, x: number, y: number, scale = 1) {
    g.fillStyle(0x34483e, 0.25); g.fillEllipse(x, y + 25 * scale, 82 * scale, 20 * scale)
    g.fillStyle(0x4f5e58); g.fillRect(x - 36 * scale, y - 18 * scale, 72 * scale, 40 * scale)
    g.fillRect(x - 24 * scale, y - 29 * scale, 48 * scale, 12 * scale)
    g.fillStyle(0x77847a); g.fillRect(x - 26 * scale, y - 19 * scale, 28 * scale, 10 * scale)
    g.fillStyle(0x394840); g.fillRect(x + 9 * scale, y + 5 * scale, 20 * scale, 11 * scale)
    this.addObstacle(x, y + 12 * scale, 68 * scale, 45 * scale)
  }

  private drawStoneCircle(g: Phaser.GameObjects.Graphics) {
    for (let index = 0; index < 10; index++) {
      const angle = index / 10 * Math.PI * 2
      const x = 1420 + Math.cos(angle) * 184
      const y = 330 + Math.sin(angle) * 148
      g.fillStyle(0x5b665e); g.fillRect(x - 14, y - 9, 28, 18)
      g.fillStyle(0x818a76); g.fillRect(x - 9, y - 6, 13, 5)
    }
  }

  private drawCaveDetails(g: Phaser.GameObjects.Graphics) {
    ;[[220, 165], [470, 245], [680, 430], [930, 225], [1160, 820], [1380, 620], [1680, 760], [330, 745]].forEach(([x, y], index) => {
      g.fillStyle(index % 2 ? 0x59645f : 0x47534e); g.fillRect(x, y, 34, 18); g.fillRect(x + 8, y - 8, 20, 9)
      g.fillStyle(0x283430, 0.5); g.fillRect(x + 23, y + 6, 12, 5)
      this.addObstacle(x + 16, y + 8, 42, 28)
    })
  }

  private createHero(x: number, y: number) {
    const shadow = this.add.graphics()
    shadow.fillStyle(0x17332d, 0.32); shadow.fillEllipse(0, 28, 45, 15)
    this.heroSprite = this.add.image(0, 31, 'hero-front').setDisplaySize(60, 94).setOrigin(0.5, 1)
    this.drawHeroFrame('down', 0)
    const player = this.add.container(x, y, [shadow, this.heroSprite]).setDepth(500 + y).setSize(42, 76)
    this.physics.add.existing(player)
    const body = player.body as Phaser.Physics.Arcade.Body
    body.setSize(30, 24)
    body.setOffset(6, 46)
    body.setCollideWorldBounds(true)
    return player
  }

  private createMojira(x: number, y: number) {
    const shadow = this.add.graphics()
    shadow.fillStyle(0x17332d, 0.28); shadow.fillEllipse(0, 24, 56, 15)
    this.companionSprite = this.add.image(0, -15, 'dino-mojira').setDisplaySize(118, 118).setOrigin(0.5, 0.72)
    const companion = this.add.container(x, y, [shadow, this.companionSprite]).setDepth(490 + y).setSize(82, 64)
    return companion
  }

  private createCustomCompanion(x: number, y: number, creation: CustomDinosaur) {
    const canvas = document.createElement('canvas')
    canvas.width = 280
    canvas.height = 196
    const context = canvas.getContext('2d')
    if (!context) return this.add.container(x, y)
    context.scale(0.25, 0.25)
    context.fillStyle = creation.bodyColor
    context.globalAlpha = 0.94
    context.fill(new Path2D(T_REX_OUTLINE))
    context.globalAlpha = 1
    context.strokeStyle = creation.lineColor
    context.lineWidth = 16
    context.lineCap = 'round'
    context.lineJoin = 'round'
    for (const stroke of creation.strokes) {
      if (stroke.points.length < 2) continue
      context.beginPath()
      context.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y)
      context.stroke()
    }
    const textureKey = `custom-dinosaur-${creation.id}`
    this.textures.addCanvas(textureKey, canvas)
    const shadow = this.add.ellipse(0, 26, 92, 20, 0x17332d, 0.25)
    this.customCompanionSprite = this.add.image(0, -10, textureKey).setDisplaySize(138, 97).setOrigin(0.5, 0.78)
    return this.add.container(x, y, [shadow, this.customCompanionSprite])
      .setDepth(480 + y)
      .setSize(108, 72)
      .setScale(customDinosaurScaleXForDirection(this.trailX), 1)
  }

  private drawHeroFrame(direction: FacingDirection, frame: number, walking = false) {
    if (!this.heroSprite) return
    const h = this.heroSprite
    const base = direction === 'up' ? 'back' : direction === 'side' ? 'side' : 'front'
    h.setTexture(walking ? `hero-${base}-walk-${frame === 0 ? 'a' : 'b'}` : `hero-${base}`)
    h.setDisplaySize(direction === 'side' && walking ? 74 : walking ? 66 : 60, 94)
    h.setAngle(0)
  }

  private createSceneDinosaurs() {
    type Appearance = { id: string; key: string; name: string; x: number; y: number; size: number; flip?: boolean; autoEncounter?: boolean; hiddenUntilNear?: boolean }
    const appearances: Record<PlaySceneId, Appearance[]> = {
      intro: [
        { id: 'baby-triceratops', key: 'dino-triceratops', name: 'トリケラトプス', x: 1400, y: 520, size: 190, flip: true, autoEncounter: false, hiddenUntilNear: true }
      ],
      'forest-fork': [
        { id: 'stegosaurus', key: 'dino-stegosaurus', name: 'ステゴサウルス', x: 1470, y: 345, size: 205, flip: true }
      ],
      river: [],
      'lost-dinosaur': [
        { id: 'baby-triceratops', key: 'dino-triceratops', name: '赤ちゃんトリケラトプス', x: 1510, y: 390, size: 190 }
      ],
      cave: [],
      'east-forest': [],
      ending: [
        { id: 'baby-triceratops', key: 'dino-triceratops', name: 'トリケラトプス', x: 1360, y: 560, size: 180, flip: true, autoEncounter: false }
      ]
    }

    appearances[this.sceneId].forEach((appearance, index) => {
      const shadow = this.add.ellipse(0, -2, appearance.size * 0.55, appearance.size * 0.12, 0x17332d, 0.25)
      const portrait = this.add.image(0, 0, appearance.key)
        .setDisplaySize(appearance.size, appearance.size)
        .setOrigin(0.5, 0.94)
        .setFlipX(Boolean(appearance.flip))
      const label = this.add.text(0, 7, appearance.name, {
        fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#173f35',
        backgroundColor: '#fff8dcee', padding: { x: 8, y: 4 }
      }).setOrigin(0.5, 0)
      const container = this.add.container(appearance.x, appearance.y, [shadow, portrait, label]).setDepth(450 + appearance.y)
      if (appearance.hiddenUntilNear) {
        container.setAlpha(0)
        this.hiddenCharacters.push({ container, revealRadius: 285, revealed: false })
      }
      if (appearance.autoEncounter !== false) {
        this.encounterCharacters.push({ dinosaurId: appearance.id, container, radius: Math.max(120, appearance.size * 0.45) })
      }
      if (!this.reducedMotion) {
        this.tweens.add({ targets: portrait, y: -5, yoyo: true, repeat: -1, duration: 1350 + index * 170, ease: 'Sine.InOut' })
      }
    })
  }

  private createSearchFootprints() {
    if (this.sceneId !== 'intro') return
    const points: Array<[number, number, number]> = [
      [470, 865, -18],
      [790, 770, -12],
      [1090, 650, -20],
      [1260, 575, -14]
    ]
    points.forEach(([x, y, angle], index) => {
      const glow = this.add.circle(0, 0, 27, 0xffeb8a, 0.07)
      const print = this.add.graphics()
      print.fillStyle(0x725739, 0.66)
      print.fillEllipse(0, 5, 17, 24)
      print.fillCircle(-9, -8, 5)
      print.fillCircle(0, -13, 5)
      print.fillCircle(9, -8, 5)
      const container = this.add.container(x, y, [glow, print])
        .setAngle(angle)
        .setDepth(430 + y)
        .setVisible(this.isTriceratopsSearch())
      this.searchFootprints.push(container)
      if (!this.reducedMotion) this.tweens.add({ targets: glow, alpha: 0.28, scale: 1.22, yoyo: true, repeat: -1, duration: 1050 + index * 120, ease: 'Sine.InOut' })
    })
  }

  private createRuneStones() {
    if (this.sceneId !== 'intro') return
    const stones: Array<[string, string, number, number, number]> = [
      ['rune:intro:big', '大', 560, 300, -7],
      ['rune:intro:small', '小', 1080, 930, 5],
      ['rune:intro:river', '川', 1650, 690, -4]
    ]
    stones.forEach(([id, character, x, y, angle], index) => {
      const found = this.initialCollectedRuneIds.includes(id)
      const glow = this.add.circle(0, -8, 44, 0xffdf68, found ? 0.32 : 0.04).setStrokeStyle(found ? 3 : 1, 0xffed9b, found ? 0.8 : 0.18)
      const shadow = this.add.ellipse(0, 18, 76, 18, 0x17332d, 0.2)
      const stone = this.add.graphics()
      stone.fillStyle(found ? 0x8c987d : 0x707b70, 1)
      stone.fillRoundedRect(-34, -42, 68, 68, 15)
      stone.fillStyle(0xaab09a, 0.58)
      stone.fillCircle(-16, -26, 8)
      stone.fillCircle(20, 7, 6)
      const rune = this.add.text(0, -10, character, {
        fontFamily: 'serif', fontSize: '38px', fontStyle: 'bold', color: found ? '#ffe077' : '#243f36',
        stroke: found ? '#5d4328' : '#aeb59e', strokeThickness: 2
      }).setOrigin(0.5)
      const label = this.add.text(0, 43, found ? `石文字「${character}」` : '文字のある石…', {
        fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#173f35',
        backgroundColor: '#fff8dce8', padding: { x: 7, y: 3 }
      }).setOrigin(0.5).setAlpha(found ? 1 : 0)
      const container = this.add.container(x, y, [glow, shadow, stone, rune, label]).setAngle(angle).setDepth(442 + y)
      this.runeStones.push({ id, character, container, glow, label, found })
      if (!this.reducedMotion && !found) this.tweens.add({ targets: glow, alpha: 0.18, scale: 1.14, yoyo: true, repeat: -1, duration: 1250 + index * 150, ease: 'Sine.InOut' })
    })
  }

  private createSparkleCollectibles() {
    const positions: Partial<Record<PlaySceneId, Array<[number, number]>>> = {
      intro: [[410, 850], [1040, 720], [1460, 430]],
      river: [[430, 720], [1120, 740], [1510, 470]],
      'forest-fork': [[690, 780], [1170, 640], [1490, 420]],
      'lost-dinosaur': [[430, 790], [970, 680], [1400, 430]],
      cave: [[430, 790], [970, 700], [1400, 430]],
      'east-forest': [[430, 810], [960, 670], [1410, 440]]
    }
    const scenePositions = positions[this.sceneId] ?? []
    scenePositions.forEach(([x, y], index) => {
      const id = `sparkle:${this.sceneId}:${index + 1}`
      if (this.initialCollectedSparkleIds.includes(id)) return
      const glow = this.add.circle(0, 0, 27, 0xffef83, 0.13).setStrokeStyle(2, 0xfff2a1, 0.55).setAlpha(0.07)
      const egg = this.add.ellipse(0, 0, 25, 34, 0xe9bd49, 0.92).setStrokeStyle(3, 0x29483d, 0.92)
      const shine = this.add.ellipse(-5, -7, 5, 9, 0xffefaf, 0.72)
      const spotOne = this.add.circle(5, 5, 3, 0xe67a4f, 0.72)
      const spotTwo = this.add.circle(4, -7, 2, 0x6e9e5c, 0.72)
      const coverColor = this.theme === 'cave' ? 0x46534d : 0x4f8d4f
      const coverOne = this.add.ellipse(-10, 11, 24, 17, coverColor, 0.96).setAngle(-24)
      const coverTwo = this.add.ellipse(10, 13, 27, 18, coverColor, 0.96).setAngle(23)
      const coverTip = this.add.ellipse(1, 16, 22, 12, this.theme === 'cave' ? 0x59645f : 0x78a958, 0.98)
      const label = this.add.text(0, 31, 'なにか ひかってる…', {
        fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#173f35',
        backgroundColor: '#fff8dce8', padding: { x: 7, y: 3 }
      }).setOrigin(0.5).setAlpha(0)
      const container = this.add.container(x, y, [glow, egg, shine, spotOne, spotTwo, coverOne, coverTwo, coverTip, label]).setDepth(445 + y)
      this.sparkleCollectibles.push({ id, container, glow, label })
      if (!this.reducedMotion) this.tweens.add({ targets: egg, angle: 3, yoyo: true, repeat: -1, duration: 1200 + index * 140, ease: 'Sine.InOut' })
    })
  }

  private createBrokenBridgeBarrier() {
    this.addObstacle(960, 540, 300, 260)
    const warning = this.add.text(960, 690, '⚠ 橋に 大きな あなが あるよ\n左がわで じょうぶな木を 3本 さがそう！', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#173f35',
      backgroundColor: '#fff3b8f2', stroke: '#fff8dc', strokeThickness: 2, padding: { x: 15, y: 9 }, align: 'center'
    }).setOrigin(0.5).setDepth(1200)
    if (!this.reducedMotion) this.tweens.add({ targets: warning, scale: 1.04, yoyo: true, repeat: -1, duration: 850, ease: 'Sine.InOut' })
  }

  private createRepairedBridgeVisual() {
    // The collected items are three sturdy logs, not sawn bridge boards.
    // Stand them in the same direction as the existing bridge boards and lash
    // them together, so the repair blends into the bridge instead of looking
    // like a fence pasted on top of it.
    const shadow = this.add.graphics().setDepth(120)
    shadow.fillStyle(0x17332d, 0.28)
    shadow.fillRoundedRect(915, 476, 90, 136, 20)

    const logX = [934, 960, 986]
    const logAngles = [-1.2, 0.7, -0.8]
    const logColors = [0xb9783f, 0xc68748, 0xad6d38]
    const logs = logX.map((finalX, index) => {
      const log = this.add.graphics()
      log.fillStyle(0x593821, 1)
      log.fillRoundedRect(-13, -65, 26, 130, 12)
      log.fillStyle(logColors[index], 1)
      log.fillRoundedRect(-9, -61, 18, 122, 9)

      // Soft watercolor-like highlight and irregular bark marks.
      log.fillStyle(0xe1aa67, 0.55)
      log.fillRoundedRect(-6, -47, 5, 72, 3)
      log.lineStyle(3, 0x754725, 0.58)
      log.lineBetween(-8, -28, 8, -17)
      log.lineBetween(-8, 15, 7, 26)

      // Visible cut ends make each piece read as a round log.
      log.fillStyle(0xd9a15e, 1)
      log.fillEllipse(0, -60, 18, 9)
      log.fillEllipse(0, 60, 18, 9)
      log.lineStyle(2, 0x89552d, 0.8)
      log.strokeEllipse(0, -60, 10, 5)
      log.strokeEllipse(0, 60, 10, 5)

      const startY = this.reducedMotion ? 542 : 516
      return this.add.container(finalX, startY, [log])
        .setAngle(logAngles[index])
        .setAlpha(this.reducedMotion ? 1 : 0)
        .setDepth(121 + index)
    })

    const ropes = this.add.graphics().setDepth(126)
    ropes.lineStyle(8, 0x6b492a, 0.92)
    ropes.lineBetween(916, 505, 1004, 505)
    ropes.lineBetween(916, 577, 1004, 577)
    ropes.lineStyle(4, 0xd9b267, 1)
    ropes.lineBetween(916, 505, 1004, 505)
    ropes.lineBetween(916, 577, 1004, 577)
    ropes.lineBetween(950, 495, 970, 515)
    ropes.lineBetween(970, 495, 950, 515)
    ropes.lineBetween(950, 567, 970, 587)
    ropes.lineBetween(970, 567, 950, 587)
    ropes.fillStyle(0x684525, 1)
    ropes.fillCircle(960, 505, 6)
    ropes.fillCircle(960, 577, 6)

    const badge = this.add.graphics()
    badge.fillStyle(0x173f35, 0.24)
    badge.fillRoundedRect(-84, -14, 168, 36, 13)
    badge.fillStyle(0xfff3b8, 0.97)
    badge.fillRoundedRect(-84, -19, 168, 36, 13)
    badge.lineStyle(3, 0x496b47, 0.92)
    badge.strokeRoundedRect(-84, -19, 168, 36, 13)
    const badgeText = this.add.text(0, -1, '✓ 橋が なおった！', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#173f35'
    }).setOrigin(0.5)
    const sign = this.add.container(960, 448, [badge, badgeText]).setDepth(127)

    if (!this.reducedMotion) {
      logs.forEach((log, index) => {
        this.tweens.add({
          targets: log,
          y: 542,
          alpha: 1,
          duration: 520,
          delay: index * 130,
          ease: 'Back.Out'
        })
      })
      ropes.setAlpha(0)
      sign.setAlpha(0)
      this.tweens.add({ targets: ropes, alpha: 1, duration: 360, delay: 520, ease: 'Sine.Out' })
      this.tweens.add({ targets: sign, alpha: 1, y: 438, duration: 420, delay: 700, ease: 'Back.Out' })
    }
  }

  private isDriftwoodHunt() {
    return this.sceneId === 'river' && this.objectiveActive && this.objectiveLabel.includes('じょうぶな木')
  }

  private isTriceratopsSearch() {
    return this.sceneId === 'intro' && this.objectiveActive && this.objectiveLabel.includes('トリケラトプス')
  }

  private isRuneHunt() {
    return this.sceneId === 'intro' && this.objectiveActive && this.objectiveLabel.includes('石文字')
  }

  private createHiddenDriftwood() {
    if (this.driftwoodCollectibles.length > 0 || this.collectedDriftwoodCount >= 3) return
    const positions: Array<[number, number, number]> = [
      [245, 285, -18],
      [430, 930, 12],
      [735, 350, -8]
    ]
    positions.forEach(([x, y, angle], index) => {
      const id = `driftwood:river:${index + 1}`
      if (this.initialCollectedDriftwoodIds.includes(id)) return
      const shadow = this.add.ellipse(0, 8, 48, 13, 0x17332d, 0.22)
      const log = this.add.rectangle(0, 0, 46, 15, 0x97613d, 0.72).setStrokeStyle(3, 0x563721, 0.9).setAngle(angle)
      const ringOne = this.add.rectangle(-11, 0, 3, 13, 0xd7a56a, 0.65).setAngle(angle)
      const ringTwo = this.add.rectangle(11, 0, 3, 13, 0xd7a56a, 0.65).setAngle(angle)
      const grassOne = this.add.ellipse(-17, 6, 30, 19, 0x4f8d4f, 0.98).setAngle(-28)
      const grassTwo = this.add.ellipse(15, 7, 34, 20, 0x669d50, 0.98).setAngle(25)
      const grassFront = this.add.ellipse(0, 11, 40, 15, 0x78a958, 1)
      const label = this.add.text(0, 31, 'じょうぶな木…？', {
        fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#173f35',
        backgroundColor: '#fff8dce8', padding: { x: 7, y: 3 }
      }).setOrigin(0.5).setAlpha(0)
      const container = this.add.container(x, y, [shadow, log, ringOne, ringTwo, grassOne, grassTwo, grassFront, label]).setDepth(440 + y)
      this.driftwoodCollectibles.push({ id, container, log, label })
    })
  }

  private createTarget(x: number, y: number) {
    this.targetGlow = this.add.circle(0, 4, 42, 0xf4e785, 0.16).setStrokeStyle(3, 0xd7eb7b, 0.8)
    this.targetIcon = this.add.graphics()
    this.drawTargetIcon(this.objectiveLabel)
    this.targetText = this.add.text(0, 66, this.objectiveLabel, {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#fff4c6',
      backgroundColor: '#173f35ee', stroke: '#0b2923', strokeThickness: 2, padding: { x: 11, y: 7 }, align: 'center'
    }).setOrigin(0.5)
    this.lastTargetText = this.objectiveLabel
    const target = this.add.container(x, y, [this.targetGlow, this.targetIcon, this.targetText]).setDepth(460 + y).setSize(130, 150).setInteractive({ useHandCursor: true })
    target.on('pointerdown', () => this.tryInteract())
    if (!this.reducedMotion) this.tweens.add({ targets: this.targetGlow, scale: 1.17, alpha: 0.42, yoyo: true, repeat: -1, duration: 980, ease: 'Sine.InOut' })
    target.setVisible(this.objectiveActive && !this.isTriceratopsSearch() && !this.isRuneHunt())
    return target
  }

  private drawTargetIcon(label: string) {
    if (!this.targetIcon) return
    const g = this.targetIcon
    g.clear()
    g.fillStyle(0x173f35, 0.3); g.fillEllipse(0, 31, 64, 16)

    if (label.includes('宝箱')) {
      g.fillStyle(0x49301f); g.fillRect(-29, -8, 58, 43)
      g.fillStyle(0xb56e34); g.fillRect(-25, -19, 50, 22); g.fillRect(-25, 4, 50, 26)
      g.fillStyle(0xe0a84b); g.fillRect(-3, -4, 10, 18); g.fillRect(-25, 1, 50, 5)
    } else if (label.includes('じょうぶな木')) {
      g.fillStyle(0x4b3323); g.fillRect(-34, -3, 68, 27); g.fillStyle(0x9b6338); g.fillRect(-29, 2, 58, 15)
      g.fillStyle(0xceb06f); g.fillRect(23, 4, 7, 11); g.fillStyle(0x6b482d); g.fillRect(-17, 4, 5, 12)
    } else if (label.includes('足あと')) {
      g.fillStyle(0x5b4834); g.fillRect(-19, 2, 15, 23); g.fillRect(-25, -6, 7, 9); g.fillRect(-15, -11, 7, 10); g.fillRect(-5, -6, 7, 9)
      g.fillRect(9, -10, 15, 23); g.fillRect(5, -18, 7, 9); g.fillRect(15, -22, 7, 10); g.fillRect(25, -18, 7, 9)
    } else if (label.includes('岩')) {
      g.fillStyle(0x46564f); g.fillRect(-30, -7, 60, 37); g.fillRect(-18, -20, 38, 15)
      g.fillStyle(0x7b877b); g.fillRect(-20, -10, 25, 9); g.fillStyle(0x35463f); g.fillRect(10, 10, 15, 9)
    } else if (label.includes('木もれ日')) {
      g.fillStyle(0xffe982, 0.35); g.fillTriangle(-38, -43, 18, -43, 42, 31); g.fillTriangle(8, -48, 37, -48, 29, 30)
      g.fillStyle(0xfff3a5); g.fillRect(-12, -18, 13, 13); g.fillRect(17, 2, 9, 9); g.fillRect(-25, 15, 7, 7)
      g.lineStyle(3, 0xf2d861, 0.9); g.strokeCircle(0, 3, 25)
    } else if (label.includes('東の石門')) {
      g.fillStyle(0x6a746c); g.fillRect(-31, -29, 12, 61); g.fillRect(19, -29, 12, 61); g.fillRect(-37, -34, 74, 15)
      g.fillStyle(0xffdc69); g.fillCircle(0, -27, 13)
      g.lineStyle(3, 0x173f35, 1); g.lineBetween(-7, -27, 7, -27); g.lineBetween(0, -34, 0, -20)
    } else if (label.includes('大きな木')) {
      g.fillStyle(0x5b3c27); g.fillRect(-8, -6, 16, 39)
      g.fillStyle(0x244e3b); g.fillRect(-29, -31, 58, 28); g.fillRect(-19, -44, 38, 18)
      g.fillStyle(0x4d8a4d); g.fillRect(-20, -28, 36, 17); g.fillStyle(0x90b95d); g.fillRect(-12, -29, 10, 7)
    } else {
      g.fillStyle(this.theme === 'cave' ? 0xd85f4a : 0x63a9a0)
      g.fillTriangle(-22, 10, 0, -36, 22, 10); g.fillTriangle(-22, 10, 0, 34, 22, 10)
      g.fillStyle(0xc6f1d6, 0.8); g.fillTriangle(-7, 4, 0, -27, 7, 4)
      g.lineStyle(3, 0xffed91, 0.9); g.strokeCircle(0, 2, 31)
    }
  }

  private getSpawnPoint() {
    if (this.sceneId === 'river') return { x: 190, y: 605 }
    if (this.sceneId === 'cave') return { x: 210, y: 920 }
    if (this.sceneId === 'forest-fork') return { x: 940, y: 970 }
    if (this.sceneId === 'ending') return { x: 260, y: 930 }
    return { x: 180, y: 920 }
  }

  private getTargetPosition() {
    return this.getTargetPositionForLabel(this.objectiveLabel)
  }

  private getTargetPositionForLabel(label: string) {
    if (this.sceneId === 'intro' && label.includes('トリケラトプス')) return { x: 1400, y: 520 }
    if (this.sceneId === 'intro' && label.includes('足あと')) return { x: 1600, y: 315 }
    if (this.sceneId === 'river' && label.includes('川むこう')) return { x: 1590, y: 600 }
    if (this.sceneId === 'river') return { x: 650, y: 600 }
    if (this.sceneId === 'forest-fork') return { x: 1580, y: 265 }
    if (this.sceneId === 'lost-dinosaur' && label.includes('はじめの')) return { x: 520, y: 820 }
    if (this.sceneId === 'lost-dinosaur') return { x: 1640, y: 280 }
    if (this.sceneId === 'cave') return { x: 1550, y: 310 }
    if (this.sceneId === 'east-forest') return { x: 1580, y: 320 }
    if (this.sceneId === 'ending') return { x: 1420, y: 330 }
    return { x: 1600, y: 315 }
  }

  private getRoutePoints(): Array<[number, number]> {
    if (this.sceneId === 'forest-fork') return [[940, 1040], [940, 760], [910, 620], [1120, 500], [1370, 360], [1580, 210]]
    if (this.sceneId === 'river') return [[160, 600], [780, 600], [1200, 600], [1680, 600]]
    if (this.sceneId === 'lost-dinosaur') return [[170, 940], [420, 820], [650, 850], [900, 690], [1160, 650], [1370, 450], [1630, 290]]
    if (this.sceneId === 'cave') return [[210, 920], [480, 820], [760, 850], [1040, 670], [1320, 570], [1550, 330]]
    if (this.sceneId === 'east-forest') return [[160, 940], [430, 850], [710, 880], [980, 690], [1240, 620], [1490, 390], [1650, 250]]
    if (this.sceneId === 'ending') return [[260, 940], [520, 820], [820, 710], [1110, 560], [1390, 380]]
    return [[170, 930], [440, 850], [720, 860], [1010, 720], [1260, 700], [1450, 500], [1630, 340]]
  }

  private distanceToRoute(x: number, y: number, route: Array<[number, number]>) {
    let closest = Number.POSITIVE_INFINITY
    for (let index = 0; index < route.length - 1; index++) {
      const [x1, y1] = route[index]
      const [x2, y2] = route[index + 1]
      const dx = x2 - x1
      const dy = y2 - y1
      const lengthSquared = dx * dx + dy * dy || 1
      const t = Phaser.Math.Clamp(((x - x1) * dx + (y - y1) * dy) / lengthSquared, 0, 1)
      const projectedX = x1 + t * dx
      const projectedY = y1 + t * dy
      closest = Math.min(closest, Phaser.Math.Distance.Between(x, y, projectedX, projectedY))
    }
    return closest
  }

  private addObstacle(x: number, y: number, width: number, height: number) {
    if (!this.obstacles) return
    const obstacle = this.add.rectangle(x, y, width, height, 0x000000, 0).setVisible(false)
    this.obstacles.add(obstacle)
    const body = obstacle.body as Phaser.Physics.Arcade.StaticBody
    body.setSize(width, height)
    body.updateFromGameObject()
  }
}
