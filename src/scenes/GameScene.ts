import Phaser from 'phaser'
import { InputManager } from '../engine/InputManager'
import { Player } from '../entities/Player'
import { ScoreSystem } from '../engine/ScoreSystem'
import type { Difficulty, EraNumber, MissionNumber } from '../types'
import { PLAYER_MAX_HP, PLAYER_MAX_STAMINA } from '../config/balance'

export class GameScene extends Phaser.Scene {
  private inputMgr!: InputManager
  private player!: Player
  private scoreSystem!: ScoreSystem

  private era: EraNumber = 1
  private mission: MissionNumber = 1
  private difficulty: Difficulty = 'rifleman'

  // HUD elements
  private hpBar!: Phaser.GameObjects.Graphics
  private staminaBar!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private killText!: Phaser.GameObjects.Text
  private pauseOverlay!: Phaser.GameObjects.Container
  private paused = false

  constructor() { super('GameScene') }

  init(data: { era: EraNumber; mission: MissionNumber; difficulty: Difficulty }) {
    this.era = data.era
    this.mission = data.mission
    this.difficulty = data.difficulty
    this.paused = false
  }

  create() {
    // Map placeholder — filled tiles
    this.createPlaceholderMap()

    // Systems
    this.scoreSystem = new ScoreSystem(this.difficulty)
    this.inputMgr = new InputManager(this)
    this.player = new Player(this, 480, 270, this.scoreSystem)

    // HUD
    this.createHUD()

    // Pause overlay
    this.createPauseOverlay()

    // Camera follows player
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
    this.cameras.main.setZoom(2)
  }

  update(time: number, delta: number) {
    const input = this.inputMgr.state

    if (input.pause) {
      this.togglePause()
    }

    if (this.paused) return

    this.player.update(time, delta, input)
    this.updateHUD()

    if (this.player.isDead) {
      this.scene.start('GameOverScene', { era: this.era, mission: this.mission, difficulty: this.difficulty })
    }
  }

  private createPlaceholderMap() {
    const mapW = 1920
    const mapH = 1080
    const tileSize = 32

    // Ground
    const ground = this.add.graphics()
    ground.fillStyle(0x2a1f0a)
    ground.fillRect(0, 0, mapW, mapH)

    // Grid texture hint
    ground.lineStyle(1, 0x332211, 0.3)
    for (let x = 0; x <= mapW; x += tileSize) ground.lineBetween(x, 0, x, mapH)
    for (let y = 0; y <= mapH; y += tileSize) ground.lineBetween(0, y, mapW, y)

    // Some wall obstacles (rectangles)
    const wallColor = 0x554433
    const walls: [number, number, number, number][] = [
      [200, 150, 80, 200], [600, 100, 120, 60], [900, 300, 60, 160],
      [300, 500, 200, 40], [700, 450, 80, 120], [1100, 200, 40, 240],
      [1300, 400, 160, 80], [1500, 150, 80, 80], [1600, 500, 120, 60],
    ]
    const wallGraphics = this.add.graphics()
    wallGraphics.fillStyle(wallColor)
    walls.forEach(([x, y, w, h]) => wallGraphics.fillRect(x, y, w, h))

    // Mission label
    this.add.text(mapW / 2, 30, `ERA ${this.era} — MISSION ${this.mission}`, {
      fontSize: '14px', color: '#443322'
    }).setOrigin(0.5)

    // Objective marker (placeholder)
    const objMarker = this.add.graphics()
    objMarker.fillStyle(0xc8960c, 0.6)
    objMarker.fillCircle(1700, 540, 20)
    this.add.text(1700, 500, 'OBJECTIVE', { fontSize: '12px', color: '#c8960c' }).setOrigin(0.5)

    // World bounds
    this.physics.world.setBounds(0, 0, mapW, mapH)
    this.cameras.main.setBounds(0, 0, mapW, mapH)
  }

  private createHUD() {
    const cam = this.cameras.main
    const hudCam = this.cameras.add(0, 0, this.scale.width, this.scale.height)
    hudCam.setScroll(0, 0)

    // Fixed HUD — use setScrollFactor(0) on all HUD elements
    const hudY = this.scale.height - 60

    // HP bar background
    const hpBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    hpBg.fillStyle(0x220000)
    hpBg.fillRect(20, hudY, 160, 14)
    this.add.text(20, hudY - 18, 'HP', { fontSize: '12px', color: '#cc3333' }).setScrollFactor(0).setDepth(10)

    this.hpBar = this.add.graphics().setScrollFactor(0).setDepth(11)

    // Stamina bar background
    const staBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    staBg.fillStyle(0x002200)
    staBg.fillRect(20, hudY + 20, 160, 10)
    this.add.text(20, hudY + 2, 'STA', { fontSize: '10px', color: '#33cc33' }).setScrollFactor(0).setDepth(10)

    this.staminaBar = this.add.graphics().setScrollFactor(0).setDepth(11)

    // Score / kills
    this.scoreText = this.add.text(this.scale.width - 20, hudY - 5, 'SCORE: 0', {
      fontSize: '16px', color: '#c8960c', fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)

    this.killText = this.add.text(this.scale.width - 20, hudY + 18, 'KILLS: 0', {
      fontSize: '13px', color: '#888866'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)

    // Era/mission tag top-left
    this.add.text(20, 20, `Era ${this.era} · Mission ${this.mission}`, {
      fontSize: '13px', color: '#443322'
    }).setScrollFactor(0).setDepth(10)
  }

  private updateHUD() {
    const hudY = this.scale.height - 60

    this.hpBar.clear()
    this.hpBar.fillStyle(0xcc3333)
    this.hpBar.fillRect(20, hudY, 160 * (this.player.hp / PLAYER_MAX_HP), 14)

    this.staminaBar.clear()
    this.staminaBar.fillStyle(0x33cc33)
    this.staminaBar.fillRect(20, hudY + 20, 160 * (this.player.stamina / PLAYER_MAX_STAMINA), 10)

    this.scoreText.setText(`SCORE: ${this.scoreSystem.score.toLocaleString()}`)
    this.killText.setText(`KILLS: ${this.scoreSystem.kills}`)
  }

  private createPauseOverlay() {
    const { width, height } = this.scale
    const cx = width / 2

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(50)
    overlay.fillStyle(0x000000, 0.7)
    overlay.fillRect(0, 0, width, height)

    const title = this.add.text(cx, height / 2 - 80, 'PAUSED', {
      fontSize: '48px', color: '#c8960c', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51)

    const resume = this.add.text(cx, height / 2, 'RESUME', {
      fontSize: '24px', color: '#ffffff', backgroundColor: '#333300', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })
    resume.on('pointerup', () => this.togglePause())

    const quit = this.add.text(cx, height / 2 + 70, 'QUIT TO MENU', {
      fontSize: '20px', color: '#888866'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })
    quit.on('pointerup', () => this.scene.start('MainMenuScene'))

    this.pauseOverlay = this.add.container(0, 0, [overlay, title, resume, quit])
      .setScrollFactor(0).setDepth(50)
    this.pauseOverlay.setVisible(false)
  }

  private togglePause() {
    this.paused = !this.paused
    this.pauseOverlay.setVisible(this.paused)
    this.physics.world.isPaused = this.paused
  }

  completeMission() {
    const result = {
      score: this.scoreSystem.score,
      kills: this.scoreSystem.kills,
      stealthKills: this.scoreSystem.stealthKills,
      noHits: this.player.hp === PLAYER_MAX_HP,
      allLore: false,
      underPar: false,
      timeTaken: 0,
      masteryGained: {},
    }
    this.scene.start('MissionCompleteScene', {
      era: this.era, mission: this.mission, difficulty: this.difficulty, result
    })
  }
}
