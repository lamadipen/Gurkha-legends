import Phaser from 'phaser'
import { InputManager } from '../engine/InputManager'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import type { EnemyType } from '../entities/Enemy'
import { ScoreSystem } from '../engine/ScoreSystem'
import type { Difficulty, EraNumber, MissionNumber } from '../types'
import {
  PLAYER_MAX_HP, PLAYER_MAX_STAMINA,
  SOUND_GUNSHOT_RADIUS, SOUND_MELEE_RADIUS, SOUND_STEALTH_KILL_RADIUS,
  KHUKURI_STEALTH_RANGE,
} from '../config/balance'

interface AttackEvent {
  x: number
  y: number
  damage: number
  range: number
  comboFinish: boolean
  isCounter: boolean
  isHeavy: boolean
  isStealth: boolean
}

interface EnemyAttackEvent {
  damage: number
  x: number
  y: number
}

// Spawn definition: position, type, patrol end point
interface SpawnDef {
  x: number
  y: number
  type: EnemyType
  patrolEnd?: { x: number; y: number }
}

// Per-mission enemy layouts (Era 1 missions for now — Era 2/3 can be filled as maps are built)
const MISSION_SPAWNS: Record<number, Record<number, SpawnDef[]>> = {
  1: {
    1: [
      { x: 400,  y: 300, type: 'soldier',  patrolEnd: { x: 550,  y: 300 } },
      { x: 700,  y: 200, type: 'soldier',  patrolEnd: { x: 700,  y: 380 } },
      { x: 1000, y: 400, type: 'archer',   patrolEnd: { x: 1100, y: 400 } },
      { x: 1300, y: 250, type: 'soldier',  patrolEnd: { x: 1450, y: 250 } },
    ],
    2: [
      { x: 350,  y: 200, type: 'soldier',  patrolEnd: { x: 500,  y: 200 } },
      { x: 600,  y: 400, type: 'heavy',    patrolEnd: { x: 750,  y: 400 } },
      { x: 900,  y: 300, type: 'archer',   patrolEnd: { x: 1050, y: 300 } },
      { x: 1200, y: 500, type: 'soldier',  patrolEnd: { x: 1350, y: 500 } },
      { x: 1500, y: 300, type: 'soldier',  patrolEnd: { x: 1600, y: 300 } },
    ],
    3: [
      { x: 300,  y: 250, type: 'archer',   patrolEnd: { x: 450,  y: 250 } },
      { x: 650,  y: 350, type: 'heavy',    patrolEnd: { x: 800,  y: 350 } },
      { x: 950,  y: 200, type: 'soldier',  patrolEnd: { x: 1100, y: 200 } },
      { x: 1150, y: 450, type: 'rifleman', patrolEnd: { x: 1300, y: 450 } },
      { x: 1400, y: 300, type: 'heavy',    patrolEnd: { x: 1550, y: 300 } },
    ],
    4: [
      { x: 400,  y: 300, type: 'soldier',  patrolEnd: { x: 550,  y: 300 } },
      { x: 700,  y: 200, type: 'rifleman', patrolEnd: { x: 850,  y: 200 } },
      { x: 900,  y: 500, type: 'heavy',    patrolEnd: { x: 1050, y: 500 } },
      { x: 1100, y: 300, type: 'archer',   patrolEnd: { x: 1250, y: 300 } },
      { x: 1350, y: 400, type: 'commander',patrolEnd: { x: 1500, y: 400 } },
      { x: 1600, y: 250, type: 'soldier',  patrolEnd: { x: 1750, y: 250 } },
    ],
  },
}

export class GameScene extends Phaser.Scene {
  private inputMgr!: InputManager
  private player!: Player
  private scoreSystem!: ScoreSystem
  private enemies: Enemy[] = []

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

  init(data: { era: EraNumber; mission: MissionNumber; difficulty: Difficulty }) {
    this.era = data.era ?? 1
    this.mission = data.mission ?? 1
    this.difficulty = data.difficulty ?? 'rifleman'
    this.paused = false
    this.missionComplete = false
    this.enemies = []
  }

  create() {
    this.createPlaceholderMap()

    this.scoreSystem = new ScoreSystem(this.difficulty)
    this.inputMgr = new InputManager(this)
    this.player = new Player(this, 200, 270, this.scoreSystem)

    this.spawnEnemies()
    this.createHUD()
    this.createPauseOverlay()

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
    this.cameras.main.setZoom(2)

    // Attack events
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

  private spawnEnemies() {
    const eraSpawns = MISSION_SPAWNS[this.era]
    const spawns: SpawnDef[] = eraSpawns?.[this.mission] ?? MISSION_SPAWNS[1][1]

    for (const def of spawns) {
      this.enemies.push(new Enemy(this, def.x, def.y, def.type, def.patrolEnd))
    }
  }

  private handlePlayerAttack(evt: AttackEvent) {
    const { x, y, damage, range, comboFinish, isStealth } = evt

    // Determine sound radius for alert propagation
    const soundRadius = isStealth ? SOUND_STEALTH_KILL_RADIUS : SOUND_MELEE_RADIUS

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue

      const dx = enemy.x - x
      const dy = enemy.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Apply damage if within attack range
      if (dist <= range) {
        const isStealthKill = isStealth
          && enemy.state !== 'combat'
          && dist <= KHUKURI_STEALTH_RANGE

        const died = enemy.takeDamage(damage, isStealthKill)
        if (died) {
          this.scoreSystem.registerKill(isStealthKill || isStealth, comboFinish)
        }
      }

      // Sound alert to nearby enemies even if not hit
      if (soundRadius > 0) {
        const sdx = enemy.x - x
        const sdy = enemy.y - y
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy)
        if (sdist <= soundRadius) {
          enemy.alertToSound(x, y)
        }
      }
    }
  }

  private handleEnemyAttack(evt: EnemyAttackEvent) {
    // Only damage player if the attack origin is close enough to the player
    const dx = evt.x - this.player.sprite.x
    const dy = evt.y - this.player.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist <= 80) {
      this.player.takeDamage(evt.damage)
    }
  }

  private propagateSoundAlert(sx: number, sy: number, radius: number) {
    if (radius <= 0) return
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue
      const dx = enemy.x - sx
      const dy = enemy.y - sy
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        enemy.alertToSound(sx, sy)
      }
    }
  }

  // Called externally (e.g. ranged weapon fire)
  emitGunshotAlert(x: number, y: number) {
    this.propagateSoundAlert(x, y, SOUND_GUNSHOT_RADIUS)
  }

  private checkMissionComplete() {
    const allDead = this.enemies.length > 0 && this.enemies.every(e => e.isDead)
    if (allDead) {
      this.missionComplete = true
      this.time.delayedCall(1200, () => this.completeMission())
    }
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
      era: this.era, mission: this.mission, difficulty: this.difficulty, result,
    })
  }

  private createPlaceholderMap() {
    const mapW = 1920
    const mapH = 1080
    const tileSize = 32

    const ground = this.add.graphics()
    ground.fillStyle(0x2a1f0a)
    ground.fillRect(0, 0, mapW, mapH)
    ground.lineStyle(1, 0x332211, 0.3)
    for (let x = 0; x <= mapW; x += tileSize) ground.lineBetween(x, 0, x, mapH)
    for (let y = 0; y <= mapH; y += tileSize) ground.lineBetween(0, y, mapW, y)

    const wallGraphics = this.add.graphics()
    wallGraphics.fillStyle(0x554433)
    const walls: [number, number, number, number][] = [
      [200, 150, 80, 200], [600, 100, 120, 60], [900, 300, 60, 160],
      [300, 500, 200, 40], [700, 450, 80, 120], [1100, 200, 40, 240],
      [1300, 400, 160, 80], [1500, 150, 80, 80], [1600, 500, 120, 60],
    ]
    walls.forEach(([x, y, w, h]) => wallGraphics.fillRect(x, y, w, h))

    this.add.text(mapW / 2, 30, `ERA ${this.era} — MISSION ${this.mission}`, {
      fontSize: '14px', color: '#443322',
    }).setOrigin(0.5)

    const objMarker = this.add.graphics()
    objMarker.fillStyle(0xc8960c, 0.6)
    objMarker.fillCircle(1700, 540, 20)
    this.add.text(1700, 500, 'OBJECTIVE', { fontSize: '12px', color: '#c8960c' }).setOrigin(0.5)

    this.physics.world.setBounds(0, 0, mapW, mapH)
    this.cameras.main.setBounds(0, 0, mapW, mapH)
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
      fontSize: '13px', color: '#443322',
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
    this.enemyCountText.setText(alive > 0 ? `ENEMIES: ${alive}` : 'ALL CLEAR')
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
