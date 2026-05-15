import Phaser from 'phaser'
import { InputManager } from '../engine/InputManager'
import type { InputState } from '../engine/InputManager'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { LoreItem } from '../entities/LoreItem'
import { Projectile } from '../entities/Projectile'
import { ScoreSystem } from '../engine/ScoreSystem'
import { WeaponSystem } from '../engine/WeaponSystem'
import { WeaponMasterySystem } from '../engine/WeaponMasterySystem'
import { loadMastery, saveMastery } from '../storage/api'
import { MapBuilder } from '../maps/MapBuilder'
import { ERA1_MAPS } from '../maps/era1Maps'
import type { MapDef } from '../maps/MapBuilder'
import type { LoreDef } from '../entities/LoreItem'
import type { Difficulty, EraNumber, MissionNumber } from '../types'
import {
  PLAYER_MAX_HP, PLAYER_MAX_STAMINA,
  SOUND_MELEE_RADIUS, SOUND_STEALTH_KILL_RADIUS,
  KHUKURI_STEALTH_RANGE, SCORE_BONUS_ALL_LORE, SOUND_GUNSHOT_RADIUS,
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
  private weaponSystem!: WeaponSystem
  private masterySystem!: WeaponMasterySystem
  private enemies: Enemy[] = []
  private loreItems: LoreItem[] = []
  private projectiles: Projectile[] = []
  private loreGroup!: Phaser.Physics.Arcade.Group
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup
  private totalLore = 0

  private era: EraNumber = 1
  private mission: MissionNumber = 1
  private difficulty: Difficulty = 'rifleman'

  private hpBar!: Phaser.GameObjects.Graphics
  private staminaBar!: Phaser.GameObjects.Graphics
  private reloadBar!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private killText!: Phaser.GameObjects.Text
  private enemyCountText!: Phaser.GameObjects.Text
  private loreText!: Phaser.GameObjects.Text
  private weaponText!: Phaser.GameObjects.Text
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
    this.loreItems = []
    this.projectiles = []
  }

  create() {
    // Build map — returns wall physics group, player start, spawn list, and lore defs
    const mapDef = MAP_LIBRARY[this.era]?.[this.mission] ?? ERA1_MAPS[1]
    const { wallGroup, playerStart, spawns, lore } = MapBuilder.build(this, mapDef)
    this.wallGroup = wallGroup

    // Systems
    this.scoreSystem = new ScoreSystem(this.difficulty)
    this.masterySystem = new WeaponMasterySystem(loadMastery() ?? undefined)
    this.weaponSystem = new WeaponSystem(this.era, this.masterySystem)
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

    // Spawn lore items
    this.spawnLore(lore)

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

    // Ranged weapons
    this.weaponSystem.update(delta)
    this.handleRangedFire(input)
    this.updateProjectiles(delta)

    this.updateHUD()

    if (this.player.isDead) {
      this.scene.start('GameOverScene', { era: this.era, mission: this.mission, difficulty: this.difficulty })
      return
    }

    if (!this.missionComplete) this.checkMissionComplete()
  }

  private handleRangedFire(input: InputState) {
    const ptr = this.input.activePointer
    const px = this.player.sprite.x
    const py = this.player.sprite.y
    const dx = ptr.worldX - px
    const dy = ptr.worldY - py
    const len = Math.sqrt(dx * dx + dy * dy)
    const aimX = len > 1 ? dx / len : 0
    const aimY = len > 1 ? dy / len : 1

    const result = this.weaponSystem.tryFire(input, px, py, aimX, aimY)
    if (!result) return

    this.projectiles.push(new Projectile(this, result))

    if (result.isGunshot) {
      this.emitGunshotAlert(px, py, SOUND_GUNSHOT_RADIUS)
    }
  }

  private updateProjectiles(delta: number) {
    for (const proj of this.projectiles) {
      if (!proj.alive) continue
      proj.update(delta)
      if (!proj.alive) continue

      for (const enemy of this.enemies) {
        if (enemy.isDead) continue
        const dist = Math.sqrt((proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2)
        if (dist < 20) {
          const weapon = proj.type === 'knife' ? 'knife'
            : proj.type === 'rifle' ? 'rifle' : 'musket'
          const scaledDmg = Math.round(proj.damage * this.masterySystem.getDamageMultiplier(weapon))
          const died = enemy.takeDamage(scaledDmg)
          if (died) this.scoreSystem.registerKill(false, false)
          const leveledUp = this.masterySystem.registerHit(weapon)
          if (leveledUp) this.showMasteryLevelUp(weapon, this.masterySystem.getLevel(weapon))
          proj.destroy()
          break
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => p.alive)
  }

  private handlePlayerAttack(evt: AttackEvent) {
    const { x, y, damage, range, comboFinish, isStealth } = evt
    const soundRadius = isStealth ? SOUND_STEALTH_KILL_RADIUS : SOUND_MELEE_RADIUS
    const khukuriMult = this.masterySystem.getDamageMultiplier('khukuri')

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue

      const dx = enemy.x - x
      const dy = enemy.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= range) {
        const isStealthKill = isStealth && enemy.state !== 'combat' && dist <= KHUKURI_STEALTH_RANGE
        const scaledDmg = Math.round(damage * khukuriMult)
        const died = enemy.takeDamage(scaledDmg, isStealthKill)
        if (died) this.scoreSystem.registerKill(isStealthKill || isStealth, comboFinish)
        // Register khukuri hit (stealth kills count as 1 hit)
        const leveledUp = this.masterySystem.registerHit('khukuri')
        if (leveledUp) this.showMasteryLevelUp('khukuri', this.masterySystem.getLevel('khukuri'))
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

  private spawnLore(loreDefs: LoreDef[]) {
    this.totalLore = loreDefs.length
    this.loreGroup = this.physics.add.group()

    for (const def of loreDefs) {
      const item = new LoreItem(this, def.x, def.y, def.id, def.title)
      this.loreItems.push(item)
      this.loreGroup.add(item.trigger)
    }

    this.physics.add.overlap(
      this.player.sprite,
      this.loreGroup,
      (_player, trigger) => {
        const item = this.loreItems.find(l => l.trigger === trigger && !l.collected)
        if (!item) return
        item.collect(this)
        this.scoreSystem.registerLore()
        this.showLoreNotification(item.title)
      },
    )
  }

  private showLoreNotification(title: string) {
    const cx = this.scale.width / 2
    const notif = this.add.text(cx, 60, `LORE FOUND\n${title}`, {
      fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
      align: 'center', backgroundColor: '#00000088',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)

    this.tweens.add({
      targets: notif,
      alpha: 1,
      y: 70,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.time.delayedCall(1800, () => {
          this.tweens.add({
            targets: notif,
            alpha: 0,
            y: 50,
            duration: 400,
            onComplete: () => notif.destroy(),
          })
        })
      },
    })
  }

  private showMasteryLevelUp(weapon: string, level: number) {
    const label = weapon.charAt(0).toUpperCase() + weapon.slice(1)
    const cx = this.scale.width / 2
    const notif = this.add.text(cx, this.scale.height - 100,
      `${label} Mastery  Lv.${level}!`, {
        fontSize: '13px', color: '#ffdd00', fontStyle: 'bold',
        backgroundColor: '#00000099', padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)

    this.tweens.add({
      targets: notif,
      alpha: 1, y: this.scale.height - 115,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: notif,
            alpha: 0, y: this.scale.height - 130,
            duration: 350,
            onComplete: () => notif.destroy(),
          })
        })
      },
    })
  }

  private checkMissionComplete() {
    if (this.enemies.length > 0 && this.enemies.every(e => e.isDead)) {
      this.missionComplete = true
      this.time.delayedCall(1200, () => this.completeMission())
    }
  }

  completeMission() {
    // Persist mastery to localStorage before transitioning
    saveMastery(this.masterySystem.serialize())

    const allLore = this.scoreSystem.loreCount >= this.totalLore && this.totalLore > 0
    this.scene.start('MissionCompleteScene', {
      era: this.era, mission: this.mission, difficulty: this.difficulty,
      result: {
        score: this.scoreSystem.score + (allLore ? SCORE_BONUS_ALL_LORE : 0),
        kills: this.scoreSystem.kills,
        stealthKills: this.scoreSystem.stealthKills,
        noHits: this.player.hp === PLAYER_MAX_HP,
        allLore,
        underPar: false, timeTaken: 0,
        masteryGained: this.masterySystem.getMasteryGained(),
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

    this.loreText = this.add.text(this.scale.width - 20, 20, 'LORE: 0/0', {
      fontSize: '12px', color: '#f0c040',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)

    // Weapon HUD — bottom center
    const wx = this.scale.width / 2
    const wY = this.scale.height - 54
    const weapBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    weapBg.fillStyle(0x000000, 0.5)
    weapBg.fillRoundedRect(wx - 90, wY - 4, 180, 46, 6)

    this.weaponText = this.add.text(wx, wY + 2, '', {
      fontSize: '11px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(11)

    // Reload bar background
    const relBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    relBg.fillStyle(0x333300)
    relBg.fillRect(wx - 70, wY + 30, 140, 6)
    this.reloadBar = this.add.graphics().setScrollFactor(0).setDepth(11)

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

    this.loreText.setText(`LORE: ${this.scoreSystem.loreCount}/${this.totalLore}`)

    // Weapon HUD
    const wx = this.scale.width / 2
    const wY = this.scale.height - 54
    const hud = this.weaponSystem.hudInfo
    const dots = (level: number) => '■'.repeat(level) + '□'.repeat(5 - level)

    if (hud.heavyName) {
      this.weaponText.setText(
        `[X] ${hud.quickName} ${hud.quickAmmo} ${dots(hud.quickLevel)}` +
        `   [C] ${hud.heavyName} ${hud.heavyAmmo} ${dots(hud.heavyLevel)}`
      )
    } else {
      this.weaponText.setText(`[X] ${hud.quickName}  ${hud.quickAmmo}  ${dots(hud.quickLevel)}`)
    }

    this.reloadBar.clear()
    this.reloadBar.fillStyle(0xffdd00)
    this.reloadBar.fillRect(wx - 70, wY + 30, 140 * hud.heavyReloadPct, 6)
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
