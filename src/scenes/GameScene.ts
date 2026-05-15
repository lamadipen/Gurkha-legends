import Phaser from 'phaser'
import { InputManager } from '../engine/InputManager'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { ScoreSystem } from '../engine/ScoreSystem'
import { MapBuilder } from '../maps/MapBuilder'
import { ERA1_MAPS } from '../maps/era1Maps'
import type { MapDef } from '../maps/MapBuilder'
import type { Difficulty, EraNumber, MissionNumber } from '../types'
import {
  PLAYER_MAX_HP, PLAYER_MAX_STAMINA,
  SOUND_MELEE_RADIUS, SOUND_STEALTH_KILL_RADIUS,
  KHUKURI_STEALTH_RANGE,
} from '../config/balance'

interface AttackEvent {
  x: number; y: number; damage: number; range: number
  comboFinish: boolean; isCounter: boolean; isHeavy: boolean; isStealth: boolean
}

interface EnemyAttackEvent { damage: number; x: number; y: number }

// Map library — expand as Era 2/3 maps are built
const MAP_LIBRARY: Record<number, Record<number, MapDef>> = {
  1: ERA1_MAPS,
  2: ERA1_MAPS, // placeholder until Era 2 maps are built
  3: ERA1_MAPS,
}

export class GameScene extends Phaser.Scene {
  private inputMgr!: InputManager
  private player!: Player
  private scoreSystem!: ScoreSystem
  private enemies: Enemy[] = []
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup

  private era: EraNumber = 1
  private mission: MissionNumber = 1
  private difficulty: Difficulty = 'rifleman'

  private hpBar!: Phaser.GameObjects.Graphics
  private staminaBar!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private killText!: Phaser.GameObjects.Text
  private enemyCountText!: Phaser.GameObjects.Text
  private pauseOverlay!: Phaser.GameObjects.Container
  private paused = false
  private missionComplete = false

  constructor() { super('GameScene') }

  init(data: { era?: EraNumber; mission?: MissionNumber; difficulty?: Difficulty }) {
    this.era = data.era ?? 1
    this.mission = data.mission ?? 1
    this.difficulty = data.difficulty ?? 'rifleman'
    this.paused = false
    this.missionComplete = false
    this.enemies = []
  }

  create() {
    // Build map — returns wall physics group, player start, and spawn list
    const mapDef = MAP_LIBRARY[this.era]?.[this.mission] ?? ERA1_MAPS[1]
    const { wallGroup, playerStart, spawns } = MapBuilder.build(this, mapDef)
    this.wallGroup = wallGroup

    // Systems
    this.scoreSystem = new ScoreSystem(this.difficulty)
    this.inputMgr = new InputManager(this)
    this.player = new Player(this, playerStart.x, playerStart.y, this.scoreSystem)

    // Wall collider for player
    this.physics.add.collider(this.player.sprite, this.wallGroup)

    // Spawn enemies from map definition
    for (const def of spawns) {
      const enemy = new Enemy(this, def.x, def.y, def.type, def.patrolEnd)
      this.physics.add.collider(enemy.sprite, this.wallGroup)
      this.enemies.push(enemy)
    }

    this.createHUD()
    this.createPauseOverlay()

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
    this.cameras.main.setZoom(2)

    this.events.on('player-attack', this.handlePlayerAttack, this)
    this.events.on('enemy-attack', this.handleEnemyAttack, this)
  }

  update(time: number, delta: number) {
    const input = this.inputMgr.state

    if (input.pause) this.togglePause()
    if (this.paused) return

    this.player.update(time, delta, input)

    for (const enemy of this.enemies) {
      enemy.update(delta, this.player.sprite.x, this.player.sprite.y, this.player.detectionRadius)
    }

    this.updateHUD()

    if (this.player.isDead) {
      this.scene.start('GameOverScene', { era: this.era, mission: this.mission, difficulty: this.difficulty })
      return
    }

    if (!this.missionComplete) this.checkMissionComplete()
  }

  private handlePlayerAttack(evt: AttackEvent) {
    const { x, y, damage, range, comboFinish, isStealth } = evt
    const soundRadius = isStealth ? SOUND_STEALTH_KILL_RADIUS : SOUND_MELEE_RADIUS

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue

      const dx = enemy.x - x
      const dy = enemy.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= range) {
        const isStealthKill = isStealth && enemy.state !== 'combat' && dist <= KHUKURI_STEALTH_RANGE
        const died = enemy.takeDamage(damage, isStealthKill)
        if (died) this.scoreSystem.registerKill(isStealthKill || isStealth, comboFinish)
      }

      if (soundRadius > 0) {
        const sdist = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2)
        if (sdist <= soundRadius) enemy.alertToSound(x, y)
      }
    }
  }

  private handleEnemyAttack(evt: EnemyAttackEvent) {
    const dist = Math.sqrt((evt.x - this.player.sprite.x) ** 2 + (evt.y - this.player.sprite.y) ** 2)
    if (dist <= 80) this.player.takeDamage(evt.damage)
  }

  // Called externally when a ranged weapon fires (gunshot alert radius)
  emitGunshotAlert(x: number, y: number, radius: number) {
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue
      const dist = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2)
      if (dist <= radius) enemy.alertToSound(x, y)
    }
  }

  private checkMissionComplete() {
    if (this.enemies.length > 0 && this.enemies.every(e => e.isDead)) {
      this.missionComplete = true
      this.time.delayedCall(1200, () => this.completeMission())
    }
  }

  completeMission() {
    this.scene.start('MissionCompleteScene', {
      era: this.era, mission: this.mission, difficulty: this.difficulty,
      result: {
        score: this.scoreSystem.score,
        kills: this.scoreSystem.kills,
        stealthKills: this.scoreSystem.stealthKills,
        noHits: this.player.hp === PLAYER_MAX_HP,
        allLore: false, underPar: false, timeTaken: 0, masteryGained: {},
      },
    })
  }

  private createHUD() {
    const hudY = this.scale.height - 60

    const hpBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    hpBg.fillStyle(0x220000)
    hpBg.fillRect(20, hudY, 160, 14)
    this.add.text(20, hudY - 18, 'HP', { fontSize: '12px', color: '#cc3333' }).setScrollFactor(0).setDepth(10)
    this.hpBar = this.add.graphics().setScrollFactor(0).setDepth(11)

    const staBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    staBg.fillStyle(0x002200)
    staBg.fillRect(20, hudY + 20, 160, 10)
    this.add.text(20, hudY + 2, 'STA', { fontSize: '10px', color: '#33cc33' }).setScrollFactor(0).setDepth(10)
    this.staminaBar = this.add.graphics().setScrollFactor(0).setDepth(11)

    this.scoreText = this.add.text(this.scale.width - 20, hudY - 5, 'SCORE: 0', {
      fontSize: '16px', color: '#c8960c', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)

    this.killText = this.add.text(this.scale.width - 20, hudY + 18, 'KILLS: 0', {
      fontSize: '13px', color: '#888866',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)

    this.enemyCountText = this.add.text(this.scale.width / 2, 20, '', {
      fontSize: '13px', color: '#cc4444',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10)

    this.add.text(20, 20, `Era ${this.era} · Mission ${this.mission}`, {
      fontSize: '13px', color: '#887755',
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

    const alive = this.enemies.filter(e => !e.isDead).length
    this.enemyCountText.setText(alive > 0 ? `ENEMIES: ${alive}` : '— ALL CLEAR —')
  }

  private createPauseOverlay() {
    const { width, height } = this.scale
    const cx = width / 2

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(50)
    overlay.fillStyle(0x000000, 0.7)
    overlay.fillRect(0, 0, width, height)

    const title = this.add.text(cx, height / 2 - 80, 'PAUSED', {
      fontSize: '48px', color: '#c8960c', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51)

    const resume = this.add.text(cx, height / 2, 'RESUME', {
      fontSize: '24px', color: '#ffffff', backgroundColor: '#333300', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })
    resume.on('pointerup', () => this.togglePause())

    const quit = this.add.text(cx, height / 2 + 70, 'QUIT TO MENU', {
      fontSize: '20px', color: '#888866',
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
}
