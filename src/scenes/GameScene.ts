import Phaser from 'phaser'
import { InputManager } from '../engine/InputManager'
import type { InputState } from '../engine/InputManager'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { LoreItem } from '../entities/LoreItem'
import { Projectile } from '../entities/Projectile'
import { Boss } from '../entities/Boss'
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
  private boss: Boss | null = null
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
  private bossHpBar: Phaser.GameObjects.Graphics | null = null
  private bossNameText: Phaser.GameObjects.Text | null = null
  private bossPhaseText: Phaser.GameObjects.Text | null = null
  private scoreText!: Phaser.GameObjects.Text
  private killText!: Phaser.GameObjects.Text
  private enemyCountText!: Phaser.GameObjects.Text
  private loreText!: Phaser.GameObjects.Text
  private weaponText!: Phaser.GameObjects.Text
  private pauseOverlay!: Phaser.GameObjects.Container
  private rangedWeaponGfx!: Phaser.GameObjects.Graphics
  private rangedWeaponTimer = 0
  private paused = false
  private missionComplete = false

  constructor() { super('GameScene') }

  init(data: { era?: EraNumber; mission?: MissionNumber; difficulty?: Difficulty }) {
    this.era = data.era ?? 1
    this.mission = data.mission ?? 1
    this.difficulty = data.difficulty ?? 'rifleman'
    this.paused = false
    this.missionComplete = false
    this.rangedWeaponTimer = 0
    this.enemies = []
    this.loreItems = []
    this.projectiles = []
    this.boss = null
    this.bossHpBar = null
    this.bossNameText = null
    this.bossPhaseText = null
  }

  create() {
    // Build map — returns wall physics group, player start, spawn list, and lore defs
    const mapDef = MAP_LIBRARY[this.era]?.[this.mission] ?? ERA1_MAPS[1]
    const { wallGroup, playerStart, spawns, lore, boss: bossDef } = MapBuilder.build(this, mapDef)
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

    // Spawn boss if this map has one
    if (bossDef) {
      this.boss = new Boss(this, bossDef.x, bossDef.y, this.era)
      this.physics.add.collider(this.boss.sprite, this.wallGroup)
      this.registerBossEvents()
    }

    this.rangedWeaponGfx = this.add.graphics().setDepth(6)
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

    // Boss
    if (this.boss && !this.boss.isDead) {
      this.boss.update(delta, this.player.sprite.x, this.player.sprite.y)
      this.handleBossProjectileHits(delta)
    }

    // Ranged weapons
    this.weaponSystem.update(delta)
    this.handleRangedFire(input)
    this.updateProjectiles(delta)
    this.rangedWeaponTimer = Math.max(0, this.rangedWeaponTimer - delta)
    this.updateRangedWeaponVisual()

    this.updateHUD()

    if (this.player.isDead) {
      this.scene.start('GameOverScene', { era: this.era, mission: this.mission, difficulty: this.difficulty })
      return
    }

    if (!this.missionComplete) this.checkMissionComplete()
  }

  private handleRangedFire(input: InputState) {
    const px    = this.player.sprite.x
    const py    = this.player.sprite.y
    const angle = this.player.facingAngle
    const aimX  = Math.cos(angle)
    const aimY  = Math.sin(angle)

    const result = this.weaponSystem.tryFire(input, px, py, aimX, aimY)
    if (!result) return

    this.projectiles.push(new Projectile(this, result))
    this.rangedWeaponTimer = 900
    this.showMuzzleFlash(px, py, angle, result.type)

    if (result.isGunshot) {
      this.emitGunshotAlert(px, py, SOUND_GUNSHOT_RADIUS)
    }
  }

  private updateRangedWeaponVisual() {
    this.rangedWeaponGfx.clear()
    if (this.player.isDead) return

    const px    = this.player.sprite.x
    const py    = this.player.sprite.y
    const angle = this.player.facingAngle

    const isRifle  = this.era === 3
    const stockLen = 10
    const barrelLen = isRifle ? 20 : 28  // musket longer, rifle shorter

    const handDist = 6
    const sx = px + Math.cos(angle) * handDist
    const sy = py + Math.sin(angle) * handDist
    const mx = sx + Math.cos(angle) * stockLen
    const my = sy + Math.sin(angle) * stockLen
    const bx = mx + Math.cos(angle) * barrelLen
    const by = my + Math.sin(angle) * barrelLen

    if (this.rangedWeaponTimer <= 0) return
    this.rangedWeaponGfx.setAlpha(Math.min(1, this.rangedWeaponTimer / 150))

    // Stock — dark wood
    this.rangedWeaponGfx.lineStyle(4, 0x5a3010, 1)
    this.rangedWeaponGfx.beginPath()
    this.rangedWeaponGfx.moveTo(sx, sy)
    this.rangedWeaponGfx.lineTo(mx, my)
    this.rangedWeaponGfx.strokePath()

    // Lock / action block
    this.rangedWeaponGfx.fillStyle(0x3a2008, 1)
    this.rangedWeaponGfx.fillCircle(mx, my, 2.5)

    // Barrel — grey metal, thin
    this.rangedWeaponGfx.lineStyle(isRifle ? 2 : 2, 0x556066, 1)
    this.rangedWeaponGfx.beginPath()
    this.rangedWeaponGfx.moveTo(mx, my)
    this.rangedWeaponGfx.lineTo(bx, by)
    this.rangedWeaponGfx.strokePath()

    // Muzzle cap
    this.rangedWeaponGfx.fillStyle(0x444455, 1)
    this.rangedWeaponGfx.fillCircle(bx, by, 1.5)
  }

  private showMuzzleFlash(px: number, py: number, angle: number, type: string) {
    const isRifle  = this.era === 3
    const totalLen = 6 + 10 + (isRifle ? 20 : 28)
    const bx = px + Math.cos(angle) * totalLen
    const by = py + Math.sin(angle) * totalLen

    const flash = this.add.graphics().setDepth(9)
    if (type === 'knife') {
      // No muzzle flash for knife throw
      flash.destroy(); return
    }
    // Outer glow
    flash.fillStyle(0xff8800, 0.55); flash.fillCircle(bx, by, 8)
    // Mid
    flash.fillStyle(0xffffcc, 0.85); flash.fillCircle(bx, by, 5)
    // Core
    flash.fillStyle(0xffffff, 1.0);  flash.fillCircle(bx, by, 2)
    // Elongated burst in fire direction
    flash.lineStyle(3, 0xffdd88, 0.70)
    flash.beginPath()
    flash.moveTo(bx, by)
    flash.lineTo(bx + Math.cos(angle) * 10, by + Math.sin(angle) * 10)
    flash.strokePath()

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.6, scaleY: 1.6,
      duration: 130,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    })
  }

  private updateProjectiles(delta: number) {
    for (const proj of this.projectiles) {
      if (!proj.alive) continue
      proj.update(delta)
      if (!proj.alive) continue

      const weapon = proj.type === 'knife' ? 'knife'
        : proj.type === 'rifle' ? 'rifle' : 'musket'
      const scaledDmg = Math.round(proj.damage * this.masterySystem.getDamageMultiplier(weapon))
      let hit = false

      for (const enemy of this.enemies) {
        if (enemy.isDead) continue
        const dist = Math.sqrt((proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2)
        if (dist < 20) {
          const died = enemy.takeDamage(scaledDmg)
          if (died) this.scoreSystem.registerKill(false, false)
          const leveledUp = this.masterySystem.registerHit(weapon)
          if (leveledUp) this.showMasteryLevelUp(weapon, this.masterySystem.getLevel(weapon))
          hit = true; break
        }
      }

      // Projectile can also hit boss
      if (!hit && this.boss && !this.boss.isDead) {
        const dist = Math.sqrt((proj.x - this.boss.x) ** 2 + (proj.y - this.boss.y) ** 2)
        if (dist < 24) {
          const died = this.boss.takeDamage(scaledDmg)
          if (died) this.scoreSystem.registerKill(false, false)
          const leveledUp = this.masterySystem.registerHit(weapon)
          if (leveledUp) this.showMasteryLevelUp(weapon, this.masterySystem.getLevel(weapon))
          this.updateBossHUD()
          hit = true
        }
      }

      if (hit) proj.destroy()
    }
    this.projectiles = this.projectiles.filter(p => p.alive)
  }

  private handlePlayerAttack(evt: AttackEvent) {
    const { x, y, damage, range, comboFinish, isStealth } = evt
    const soundRadius = isStealth ? SOUND_STEALTH_KILL_RADIUS : SOUND_MELEE_RADIUS
    const khukuriMult = this.masterySystem.getDamageMultiplier('khukuri')
    const scaledDmg = Math.round(damage * khukuriMult)

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue
      const dx = enemy.x - x
      const dy = enemy.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= range) {
        const isStealthKill = isStealth && enemy.state !== 'combat' && dist <= KHUKURI_STEALTH_RANGE
        const died = enemy.takeDamage(scaledDmg, isStealthKill)
        if (died) this.scoreSystem.registerKill(isStealthKill || isStealth, comboFinish)
        const leveledUp = this.masterySystem.registerHit('khukuri')
        if (leveledUp) this.showMasteryLevelUp('khukuri', this.masterySystem.getLevel('khukuri'))
      }
      if (soundRadius > 0) {
        const sdist = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2)
        if (sdist <= soundRadius) enemy.alertToSound(x, y)
      }
    }

    // Khukuri can also hit boss
    if (this.boss && !this.boss.isDead) {
      const bdx = this.boss.x - x
      const bdy = this.boss.y - y
      if (Math.sqrt(bdx * bdx + bdy * bdy) <= range) {
        const died = this.boss.takeDamage(scaledDmg)
        if (died) this.scoreSystem.registerKill(false, comboFinish)
        const leveledUp = this.masterySystem.registerHit('khukuri')
        if (leveledUp) this.showMasteryLevelUp('khukuri', this.masterySystem.getLevel('khukuri'))
        this.updateBossHUD()
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

  // ── Boss methods ─────────────────────────────────────────────────────────────

  private registerBossEvents() {
    // Boss melee attack lands on player if close enough
    this.events.on('boss-melee', (evt: { damage: number; x: number; y: number }) => {
      const dist = Math.sqrt(
        (evt.x - this.player.sprite.x) ** 2 + (evt.y - this.player.sprite.y) ** 2
      )
      if (dist <= 80) this.player.takeDamage(evt.damage)
    })

    // Boss fires a spear projectile — spawn it as a Projectile
    this.events.on('boss-fire', (evt: { x: number; y: number; dirX: number; dirY: number; damage: number }) => {
      this.projectiles.push(new Projectile(this, {
        type: 'musket',       // reuse musket visual for spear-ish look
        x: evt.x, y: evt.y,
        dirX: evt.dirX, dirY: evt.dirY,
        damage: evt.damage,
        speed: 500, maxRange: 400,
        isGunshot: false,
      }))
    })

    // Phase 3: boss spawns 2 soldier reinforcements near its current position
    this.events.on('boss-spawn-minions', () => {
      if (!this.boss) return
      const offsets = [{ x: -80, y: -60 }, { x: 80, y: 60 }]
      for (const off of offsets) {
        const e = new Enemy(this, this.boss.x + off.x, this.boss.y + off.y, 'soldier')
        this.physics.add.collider(e.sprite, this.wallGroup)
        this.enemies.push(e)
      }
      this.showPhaseNotification('REINFORCEMENTS!', '#ff6622')
    })

    // Boss defeated
    this.events.on('boss-defeated', () => {
      this.scoreSystem.registerKill(false, false)
      this.updateBossHUD()
      this.showPhaseNotification('BOSS DEFEATED!', '#f0c040')
      this.time.delayedCall(2000, () => {
        if (!this.missionComplete) {
          this.missionComplete = true
          this.completeMission()
        }
      })
    })

    // Phase transition
    this.events.on('boss-phase', (evt: { phase: number }) => {
      const labels: Record<number, string> = { 2: 'PHASE 2 — ENRAGED!', 3: 'PHASE 3 — BERSERK!' }
      const colors: Record<number, string> = { 2: '#ff8822', 3: '#ff2222' }
      this.showPhaseNotification(labels[evt.phase] ?? '', colors[evt.phase] ?? '#ff4444')
      this.updateBossHUD()
    })
  }

  private handleBossProjectileHits(_delta: number) {
    // Boss projectiles are already in this.projectiles — they hit the player in updateProjectiles
    // (boss-fire projectiles are added to same pool; overlap with player handled here)
    for (const proj of this.projectiles) {
      if (!proj.alive) continue
      const dist = Math.sqrt(
        (proj.x - this.player.sprite.x) ** 2 + (proj.y - this.player.sprite.y) ** 2
      )
      if (dist < 16) {
        this.player.takeDamage(proj.damage)
        proj.destroy()
      }
    }
  }

  private updateBossHUD() {
    if (!this.boss || !this.bossHpBar) return
    const pct = Math.max(0, this.boss.hp / this.boss.maxHp)
    const barW = 400
    const barX = this.scale.width / 2 - barW / 2
    const barY = 14

    this.bossHpBar.clear()

    // HP fill — color by phase
    const phaseColors: Record<number, number> = { 1: 0x44bb44, 2: 0xdd8822, 3: 0xdd2222 }
    this.bossHpBar.fillStyle(phaseColors[this.boss.phase] ?? 0xdd2222)
    this.bossHpBar.fillRect(barX, barY, barW * pct, 16)

    // Phase divider lines
    this.bossHpBar.fillStyle(0x000000, 0.6)
    this.bossHpBar.fillRect(barX + barW * 0.75 - 1, barY, 2, 16)  // 75% = phase 2 threshold
    this.bossHpBar.fillRect(barX + barW * 0.25 - 1, barY, 2, 16)  // 25% = phase 3 threshold

    if (this.bossPhaseText) {
      this.bossPhaseText.setText(`Phase ${this.boss.phase}`)
    }
  }

  private showPhaseNotification(text: string, color: string) {
    const cx = this.scale.width / 2
    const notif = this.add.text(cx, this.scale.height / 2 - 40, text, {
      fontSize: '22px', color, fontStyle: 'bold',
      backgroundColor: '#000000aa', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(25).setAlpha(0)

    this.tweens.add({
      targets: notif,
      alpha: 1, y: this.scale.height / 2 - 55,
      duration: 300, ease: 'Quad.easeOut',
      onComplete: () => {
        this.time.delayedCall(1800, () => {
          this.tweens.add({
            targets: notif,
            alpha: 0, y: this.scale.height / 2 - 70,
            duration: 400,
            onComplete: () => notif.destroy(),
          })
        })
      },
    })
  }

  // ── Mastery & lore notifications ─────────────────────────────────────────────

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
    const enemiesDone = this.enemies.length === 0 || this.enemies.every(e => e.isDead)
    const bossDone = !this.boss || this.boss.isDead
    if (enemiesDone && bossDone) {
      this.missionComplete = true
      this.time.delayedCall(1400, () => this.completeMission())
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

    // Boss HP bar — only when this map has a boss
    if (this.boss) {
      const barW = 400
      const barX = this.scale.width / 2 - barW / 2

      // Background track
      const bossBg = this.add.graphics().setScrollFactor(0).setDepth(10)
      bossBg.fillStyle(0x111111)
      bossBg.fillRect(barX, 14, barW, 16)
      bossBg.lineStyle(1, 0x666666, 0.6)
      bossBg.strokeRect(barX, 14, barW, 16)

      this.bossHpBar = this.add.graphics().setScrollFactor(0).setDepth(11)

      this.bossNameText = this.add.text(this.scale.width / 2, 34, this.boss.name, {
        fontSize: '11px', color: '#ffccaa', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(11)

      this.bossPhaseText = this.add.text(barX + barW + 8, 16, 'Phase 1', {
        fontSize: '10px', color: '#ff8844',
      }).setScrollFactor(0).setDepth(11)

      this.updateBossHUD()
    }
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

    if (this.boss) this.updateBossHUD()
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
