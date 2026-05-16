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
import { ERA2_MAPS } from '../maps/era2Maps'
import { ERA3_MAPS } from '../maps/era3Maps'
import type { MapDef } from '../maps/MapBuilder'
import type { LoreDef } from '../entities/LoreItem'
import type { Difficulty, EraNumber, MissionNumber } from '../types'
import {
  PLAYER_MAX_HP, PLAYER_MAX_STAMINA,
  SOUND_MELEE_RADIUS, SOUND_STEALTH_KILL_RADIUS,
  KHUKURI_STEALTH_RANGE, SCORE_BONUS_ALL_LORE, SOUND_GUNSHOT_RADIUS,
  HEALTH_PICKUP_AMOUNT, HEALTH_PICKUP_RADIUS,
  GRENADE_DAMAGE, GRENADE_RADIUS, GRENADE_FUSE, GRENADE_PER_MISSION,
  SHIELD_BASH_DAMAGE, SHIELD_BASH_STAGGER, SHIELD_BASH_STAMINA, SHIELD_BLOCK_PERCENT,
  PAR_TIME_MS,
} from '../config/balance'

interface AttackEvent {
  x: number; y: number; damage: number; range: number
  comboFinish: boolean; isCounter: boolean; isHeavy: boolean; isStealth: boolean
}

interface EnemyAttackEvent { damage: number; x: number; y: number }

const MAP_LIBRARY: Record<number, Record<number, MapDef>> = {
  1: ERA1_MAPS,
  2: ERA2_MAPS,
  3: ERA3_MAPS,
}

export class GameScene extends Phaser.Scene {
  private inputMgr!: InputManager
  private player!: Player
  private scoreSystem!: ScoreSystem
  private weaponSystem!: WeaponSystem
  private masterySystem!: WeaponMasterySystem
  private enemies: Enemy[] = []
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private boss: Boss | null = null
  private loreItems: LoreItem[] = []
  private healthPickups: { gfx: Phaser.GameObjects.Graphics; x: number; y: number }[] = []
  private projectiles: Projectile[] = []
  private projectileGroup!: Phaser.Physics.Arcade.Group
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
  private hpText!: Phaser.GameObjects.Text
  private pauseOverlay!: Phaser.GameObjects.Container
  private rangedWeaponGfx!: Phaser.GameObjects.Graphics
  private rangedWeaponTimer = 0
  private paused = false
  private missionComplete = false

  private grenadeCount = 0
  private grenades: { gfx: Phaser.GameObjects.Graphics; x: number; y: number; vx: number; vy: number; fuse: number }[] = []
  private objectiveText!: Phaser.GameObjects.Text
  private hudComboCount = 0
  private missionStartTime = 0
  private playerShielding = false

  constructor() { super('GameScene') }

  init(data: { era?: EraNumber; mission?: MissionNumber; difficulty?: Difficulty }) {
    this.era = data.era ?? 1
    this.mission = data.mission ?? 1
    this.difficulty = data.difficulty ?? 'rifleman'
    this.paused = false
    this.missionComplete = false
    this.rangedWeaponTimer = 0
    this.playerShielding = false
    this.enemies = []
    this.loreItems = []
    this.healthPickups = []
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
    this.enemyGroup = this.physics.add.group()
    for (const def of spawns) {
      const enemy = new Enemy(this, def.x, def.y, def.type, def.patrolEnd)
      this.physics.add.collider(enemy.sprite, this.wallGroup)
      this.enemyGroup.add(enemy.sprite)
      this.enemies.push(enemy)
    }

    // Player ↔ enemy solid collision — they push each other, can't overlap
    this.physics.add.collider(this.player.sprite, this.enemyGroup)
    // Enemy ↔ enemy — they spread out, don't stack
    this.physics.add.collider(this.enemyGroup, this.enemyGroup)

    // Projectile group — collides with walls to block shots
    this.projectileGroup = this.physics.add.group()
    this.physics.add.collider(this.projectileGroup, this.wallGroup, (_proj) => {
      const rect = _proj as Phaser.GameObjects.Rectangle
      const proj = this.projectiles.find(p => p.sprite === rect)
      if (proj) proj.destroy()
    })

    // Spawn lore items
    this.spawnLore(lore)

    // Spawn health pickups spread across the map
    this.spawnHealthPickups(mapDef.width, mapDef.height)

    // Spawn boss if this map has one
    if (bossDef) {
      this.boss = new Boss(this, bossDef.x, bossDef.y, this.era)
      this.physics.add.collider(this.boss.sprite, this.wallGroup)
      this.registerBossEvents()
    }

    if (this.era === 3) this.grenadeCount = GRENADE_PER_MISSION

    this.rangedWeaponGfx = this.add.graphics().setDepth(6)
    this.createHUD()
    this.createPauseOverlay()
    this.missionStartTime = this.time.now

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
    this.cameras.main.setZoom(2)

    this.events.on('player-attack', this.handlePlayerAttack, this)
    this.events.on('enemy-attack', this.handleEnemyAttack, this)
  }

  update(time: number, delta: number) {
    const input = this.inputMgr.state

    if (input.pause) this.togglePause()
    if (this.paused) return

    this.playerShielding = input.shieldHeld && this.era === 1
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
    this.handleShieldBash(input)
    this.handleGrenadeThrow(input)
    this.updateGrenades(delta)
    this.updateProjectiles(delta)
    this.rangedWeaponTimer = Math.max(0, this.rangedWeaponTimer - delta)
    this.updateRangedWeaponVisual()
    this.updateHealthPickups()

    this.updateHUD()

    if (this.player.isDead) {
      this.scene.start('GameOverScene', {
        era: this.era, mission: this.mission, difficulty: this.difficulty,
        score: this.scoreSystem.score, kills: this.scoreSystem.kills,
      })
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

    const proj = new Projectile(this, result)
    this.projectiles.push(proj)
    this.projectileGroup.add(proj.sprite)
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
    const { x, y, damage, range, comboFinish, isStealth, isCounter, isHeavy } = evt
    const soundRadius = isStealth ? SOUND_STEALTH_KILL_RADIUS : SOUND_MELEE_RADIUS
    const khukuriMult = this.masterySystem.getDamageMultiplier('khukuri')
    const scaledDmg = Math.round(damage * khukuriMult)

    // Combo counter display
    if (!isCounter && !isHeavy) {
      if (comboFinish) {
        this.showComboText(x, y, 'FINISH!', '#ff8822')
        this.hudComboCount = 0
      } else {
        this.hudComboCount = Math.min(this.hudComboCount + 1, 2)
        this.showComboText(x, y, `${this.hudComboCount}`, '#ffdd44')
      }
    } else if (isCounter) {
      this.showComboText(x, y, 'COUNTER!', '#44eeff')
      this.hudComboCount = 0
    } else if (isHeavy) {
      this.showComboText(x, y, 'HEAVY!', '#ff4444')
      this.hudComboCount = 0
    }

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue
      const dx = enemy.x - x
      const dy = enemy.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= range) {
        const isStealthKill = isStealth && enemy.state !== 'combat' && dist <= KHUKURI_STEALTH_RANGE
        const died = enemy.takeDamage(scaledDmg, isStealthKill, x, y)
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

  private showComboText(wx: number, wy: number, text: string, color: string) {
    const t = this.add.text(wx, wy - 20, text, {
      fontSize: '9px', color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20)
    this.tweens.add({
      targets: t, alpha: 0, y: wy - 45, duration: 700, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    })
  }

  private handleShieldBash(input: InputState) {
    if (!input.shieldBash || this.era !== 1) return
    if (!this.player.drainStamina(SHIELD_BASH_STAMINA)) return

    const px = this.player.sprite.x
    const py = this.player.sprite.y
    const angle = this.player.facingAngle
    const bx = px + Math.cos(angle) * 28
    const by = py + Math.sin(angle) * 28

    // Shield flash VFX
    const shield = this.add.graphics().setDepth(8)
    shield.fillStyle(0xaaaaff, 0.65)
    shield.fillCircle(bx, by, 22)
    shield.lineStyle(2, 0x8888ff, 0.9)
    shield.strokeCircle(bx, by, 22)
    this.tweens.add({
      targets: shield, alpha: 0, scaleX: 1.6, scaleY: 1.6,
      duration: 220, ease: 'Quad.easeOut',
      onComplete: () => shield.destroy(),
    })

    // Damage + stagger enemies in bash range
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue
      const dx = enemy.x - bx
      const dy = enemy.y - by
      if (Math.sqrt(dx * dx + dy * dy) <= 40) {
        enemy.takeDamage(SHIELD_BASH_DAMAGE, false, px, py)
        enemy.stagger(SHIELD_BASH_STAGGER)
      }
    }
    this.cameras.main.shake(80, 0.005)
  }

  private handleGrenadeThrow(input: InputState) {
    if (!input.grenade || this.era !== 3 || this.grenadeCount <= 0) return
    this.grenadeCount--

    const px = this.player.sprite.x
    const py = this.player.sprite.y
    const angle = this.player.facingAngle
    const speed = 280

    const gfx = this.add.graphics().setDepth(7)
    gfx.fillStyle(0x333333); gfx.fillCircle(0, 0, 5)
    gfx.lineStyle(1, 0x666666); gfx.strokeCircle(0, 0, 5)
    gfx.setPosition(px, py)

    this.grenades.push({
      gfx, x: px, y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      fuse: GRENADE_FUSE,
    })
  }

  private updateGrenades(delta: number) {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i]
      g.fuse -= delta
      const dt = delta / 1000
      g.x += g.vx * dt
      g.y += g.vy * dt
      // Decelerate like a rolling grenade
      g.vx *= Math.pow(0.96, delta / 16)
      g.vy *= Math.pow(0.96, delta / 16)
      g.gfx.setPosition(g.x, g.y)

      // Blink faster as fuse runs low
      if (g.fuse < 500) {
        g.gfx.clear()
        const blink = Math.floor(g.fuse / 80) % 2 === 0
        g.gfx.fillStyle(blink ? 0xff4400 : 0x333333)
        g.gfx.fillCircle(0, 0, 5)
      }

      if (g.fuse <= 0) {
        this.detonateGrenade(g.x, g.y)
        g.gfx.destroy()
        this.grenades.splice(i, 1)
      }
    }
  }

  private detonateGrenade(x: number, y: number) {
    // Explosion VFX
    const expl = this.add.graphics().setDepth(9)
    expl.fillStyle(0xff8800, 0.75); expl.fillCircle(x, y, GRENADE_RADIUS)
    expl.fillStyle(0xffdd00, 0.6);  expl.fillCircle(x, y, GRENADE_RADIUS * 0.6)
    expl.fillStyle(0xffffff, 0.9);  expl.fillCircle(x, y, GRENADE_RADIUS * 0.25)
    this.tweens.add({
      targets: expl, alpha: 0, scaleX: 1.9, scaleY: 1.9,
      duration: 500, ease: 'Quad.easeOut',
      onComplete: () => expl.destroy(),
    })
    this.cameras.main.shake(300, 0.018)

    // Damage enemies in radius
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue
      const dist = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2)
      if (dist <= GRENADE_RADIUS) {
        const died = enemy.takeDamage(GRENADE_DAMAGE, false, x, y)
        if (died) this.scoreSystem.registerKill(false, false)
        const leveledUp = this.masterySystem.registerHit('rifle')
        if (leveledUp) this.showMasteryLevelUp('rifle', this.masterySystem.getLevel('rifle'))
      }
    }
    if (this.boss && !this.boss.isDead) {
      const dist = Math.sqrt((this.boss.x - x) ** 2 + (this.boss.y - y) ** 2)
      if (dist <= GRENADE_RADIUS) {
        const died = this.boss.takeDamage(GRENADE_DAMAGE)
        if (died) this.scoreSystem.registerKill(false, false)
        this.updateBossHUD()
      }
    }
  }

  private handleEnemyAttack(evt: EnemyAttackEvent) {
    const dist = Math.sqrt((evt.x - this.player.sprite.x) ** 2 + (evt.y - this.player.sprite.y) ** 2)
    if (dist <= 80 && this.hasLineOfSight(evt.x, evt.y, this.player.sprite.x, this.player.sprite.y)) {
      if (this.playerShielding) {
        const absorbed = Math.floor(evt.damage * SHIELD_BLOCK_PERCENT / 100)
        const remaining = evt.damage - absorbed
        if (remaining > 0) this.player.takeDamage(remaining)
        this.showBlockText()
      } else {
        this.player.takeDamage(evt.damage)
      }
    }
  }

  private showBlockText() {
    const px = this.player.sprite.x
    const py = this.player.sprite.y
    const t = this.add.text(px, py - 28, 'BLOCKED!', {
      fontSize: '9px', color: '#88aaff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20)
    this.tweens.add({
      targets: t, alpha: 0, y: py - 50, duration: 600, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    })
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

  private spawnHealthPickups(mapWidth: number, mapHeight: number) {
    // Place 5 health packs evenly across the map length
    const count = 5
    const padding = 120
    const yMid = mapHeight / 2
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1)
      const x = padding + t * (mapWidth - padding * 2)
      const y = yMid + (i % 2 === 0 ? -60 : 60)
      this.createHealthPickup(x, y)
    }
  }

  private createHealthPickup(x: number, y: number) {
    const gfx = this.add.graphics().setDepth(3)
    this.drawHealthCross(gfx, x, y)
    this.healthPickups.push({ gfx, x, y })

    this.tweens.add({
      targets: gfx, alpha: { from: 0.7, to: 1 },
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  private drawHealthCross(gfx: Phaser.GameObjects.Graphics, x: number, y: number) {
    gfx.clear()
    // White backing circle
    gfx.fillStyle(0xffffff, 0.9)
    gfx.fillCircle(x, y, 10)
    // Red cross
    gfx.fillStyle(0xdd1111, 1)
    gfx.fillRect(x - 2, y - 7, 4, 14)
    gfx.fillRect(x - 7, y - 2, 14, 4)
  }

  private updateHealthPickups() {
    for (let i = this.healthPickups.length - 1; i >= 0; i--) {
      const { gfx, x, y } = this.healthPickups[i]
      const dist = Math.sqrt((x - this.player.sprite.x) ** 2 + (y - this.player.sprite.y) ** 2)
      if (dist <= HEALTH_PICKUP_RADIUS && this.player.hp < PLAYER_MAX_HP) {
        this.player.heal(HEALTH_PICKUP_AMOUNT)
        this.tweens.killTweensOf(gfx)
        gfx.destroy()
        this.healthPickups.splice(i, 1)
        this.showHealNotification()
      }
    }
  }

  private showHealNotification() {
    const cx = this.scale.width / 4   // centre of visible width
    const cy = this.scale.height / 4  // centre of visible height
    const notif = this.add.text(cx, cy - 30, `+${HEALTH_PICKUP_AMOUNT} HP`, {
      fontSize: '9px', color: '#44ff88', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20)
    this.tweens.add({
      targets: notif, alpha: 0, y: notif.y - 15,
      duration: 1200, ease: 'Quad.easeOut',
      onComplete: () => notif.destroy(),
    })
  }

  private showLoreNotification(title: string) {
    const cx = this.scale.width / 4
    const notif = this.add.text(cx, 30, `LORE FOUND\n${title}`, {
      fontSize: '7px', color: '#f0c040', fontStyle: 'bold',
      align: 'center', backgroundColor: '#00000088',
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)

    this.tweens.add({
      targets: notif, alpha: 1, y: 36, duration: 300, ease: 'Quad.easeOut',
      onComplete: () => {
        this.time.delayedCall(1800, () => {
          this.tweens.add({
            targets: notif, alpha: 0, y: 24, duration: 400,
            onComplete: () => notif.destroy(),
          })
        })
      },
    })
  }

  // ── Boss methods ─────────────────────────────────────────────────────────────

  private registerBossEvents() {
    // Boss melee attack lands on player if close enough and no wall in between
    this.events.on('boss-melee', (evt: { damage: number; x: number; y: number }) => {
      const dist = Math.sqrt(
        (evt.x - this.player.sprite.x) ** 2 + (evt.y - this.player.sprite.y) ** 2
      )
      if (dist <= 80 && this.hasLineOfSight(evt.x, evt.y, this.player.sprite.x, this.player.sprite.y)) {
        this.player.takeDamage(evt.damage)
      }
    })

    // Boss fires a spear projectile — spawn it as a Projectile
    this.events.on('boss-fire', (evt: { x: number; y: number; dirX: number; dirY: number; damage: number; maxRange?: number }) => {
      const bossProj = new Projectile(this, {
        type: this.era === 3 ? 'rifle' : 'musket',
        x: evt.x, y: evt.y,
        dirX: evt.dirX, dirY: evt.dirY,
        damage: evt.damage,
        speed: this.era === 3 ? 750 : 500,
        maxRange: evt.maxRange ?? 400,
        isGunshot: false,
        owner: 'boss',
      })
      this.projectiles.push(bossProj)
      this.projectileGroup.add(bossProj.sprite)
    })

    // Phase 3: boss spawns 2 soldier reinforcements near its current position
    this.events.on('boss-spawn-minions', () => {
      if (!this.boss) return
      const offsets = [{ x: -80, y: -60 }, { x: 80, y: 60 }]
      for (const off of offsets) {
        const e = new Enemy(this, this.boss.x + off.x, this.boss.y + off.y, 'soldier')
        this.physics.add.collider(e.sprite, this.wallGroup)
        this.enemyGroup.add(e.sprite)
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

  private hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const bodies = this.wallGroup.getChildren() as Phaser.GameObjects.GameObject[]
    for (const child of bodies) {
      const body = (child as Phaser.GameObjects.GameObject & { body: Phaser.Physics.Arcade.StaticBody }).body
      if (!body) continue
      const { left, right, top, bottom } = body
      if (this.segmentIntersectsRect(x1, y1, x2, y2, left, top, right, bottom)) return false
    }
    return true
  }

  private segmentIntersectsRect(
    x1: number, y1: number, x2: number, y2: number,
    rLeft: number, rTop: number, rRight: number, rBottom: number,
  ): boolean {
    const edges: [number, number, number, number][] = [
      [rLeft, rTop, rRight, rTop],
      [rRight, rTop, rRight, rBottom],
      [rRight, rBottom, rLeft, rBottom],
      [rLeft, rBottom, rLeft, rTop],
    ]
    for (const [ex1, ey1, ex2, ey2] of edges) {
      if (this.segmentsIntersect(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) return true
    }
    return false
  }

  private segmentsIntersect(
    ax: number, ay: number, bx: number, by: number,
    cx: number, cy: number, dx: number, dy: number,
  ): boolean {
    const d1x = bx - ax, d1y = by - ay
    const d2x = dx - cx, d2y = dy - cy
    const cross = d1x * d2y - d1y * d2x
    if (Math.abs(cross) < 1e-10) return false
    const t = ((cx - ax) * d2y - (cy - ay) * d2x) / cross
    const u = ((cx - ax) * d1y - (cy - ay) * d1x) / cross
    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }

  private handleBossProjectileHits(_delta: number) {
    for (const proj of this.projectiles) {
      if (!proj.alive || proj.owner !== 'boss') continue
      const dist = Math.sqrt(
        (proj.x - this.player.sprite.x) ** 2 + (proj.y - this.player.sprite.y) ** 2
      )
      if (dist < 16) {
        if (this.playerShielding) {
          const absorbed = Math.floor(proj.damage * SHIELD_BLOCK_PERCENT / 100)
          const remaining = proj.damage - absorbed
          if (remaining > 0) this.player.takeDamage(remaining)
          this.showBlockText()
        } else {
          this.player.takeDamage(proj.damage)
        }
        proj.destroy()
      }
    }
  }

  private updateBossHUD() {
    if (!this.boss || !this.bossHpBar) return
    const pct = Math.max(0, this.boss.hp / this.boss.maxHp)
    const barW = 180
    const barX = this.scale.width / 4 - barW / 2
    const barY = 8

    this.bossHpBar.clear()
    const phaseColors: Record<number, number> = { 1: 0x44bb44, 2: 0xdd8822, 3: 0xdd2222 }
    this.bossHpBar.fillStyle(phaseColors[this.boss.phase] ?? 0xdd2222)
    this.bossHpBar.fillRoundedRect(barX, barY, barW * pct, 12, 2)
    this.bossHpBar.fillStyle(0x000000, 0.5)
    this.bossHpBar.fillRect(barX + barW * 0.75 - 1, barY, 1, 12)
    this.bossHpBar.fillRect(barX + barW * 0.25 - 1, barY, 1, 12)
    if (this.bossPhaseText) this.bossPhaseText.setText(`Phase ${this.boss.phase}`)
  }

  private showPhaseNotification(text: string, color: string) {
    const cx = this.scale.width / 4
    const cy = this.scale.height / 4
    const notif = this.add.text(cx, cy - 20, text, {
      fontSize: '11px', color, fontStyle: 'bold',
      backgroundColor: '#000000aa', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(25).setAlpha(0)

    this.tweens.add({
      targets: notif, alpha: 1, y: cy - 28, duration: 300, ease: 'Quad.easeOut',
      onComplete: () => {
        this.time.delayedCall(1800, () => {
          this.tweens.add({
            targets: notif, alpha: 0, y: cy - 36, duration: 400,
            onComplete: () => notif.destroy(),
          })
        })
      },
    })
  }

  // ── Mastery & lore notifications ─────────────────────────────────────────────

  private showMasteryLevelUp(weapon: string, level: number) {
    const label = weapon.charAt(0).toUpperCase() + weapon.slice(1)
    const cx = this.scale.width / 4
    const cy = this.scale.height / 4
    const notif = this.add.text(cx, cy - 50, `${label} Mastery  Lv.${level}!`, {
      fontSize: '7px', color: '#ffdd00', fontStyle: 'bold',
      backgroundColor: '#00000099', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)

    this.tweens.add({
      targets: notif, alpha: 1, y: cy - 57, duration: 250, ease: 'Quad.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: notif, alpha: 0, y: cy - 65, duration: 350,
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
    saveMastery(this.masterySystem.serialize())

    const allLore = this.scoreSystem.loreCount >= this.totalLore && this.totalLore > 0
    const timeTaken = this.time.now - this.missionStartTime
    this.scene.start('MissionCompleteScene', {
      era: this.era, mission: this.mission, difficulty: this.difficulty,
      result: {
        score: this.scoreSystem.score + (allLore ? SCORE_BONUS_ALL_LORE : 0),
        kills: this.scoreSystem.kills,
        stealthKills: this.scoreSystem.stealthKills,
        noHits: this.player.hp === PLAYER_MAX_HP,
        allLore,
        underPar: timeTaken < PAR_TIME_MS,
        timeTaken,
        masteryGained: this.masterySystem.getMasteryGained(),
      },
    })
  }

  private createHUD() {
    // zoom=2: all setScrollFactor(0) world coords get doubled on screen.
    // Visible area = W×H = 480×270. Think: console/action game HUD.
    const W = this.scale.width / 2   // 480
    const H = this.scale.height / 2  // 270

    // ── PLAYER STATUS — top-left, flush to corner ─────────────────────────────
    // Solid dark panel with red left-border accent
    const panel = this.add.graphics().setScrollFactor(0).setDepth(10)
    panel.fillStyle(0x000000, 0.82)
    panel.fillRect(0, 0, 168, 62)
    panel.fillStyle(0xcc2222)                  // red left accent stripe
    panel.fillRect(0, 0, 4, 62)

    // HP row
    this.add.text(10, 8, '❤', { fontSize: '11px', color: '#ff4444' })
      .setScrollFactor(0).setDepth(11)
    this.add.text(24, 9, 'HP', { fontSize: '9px', color: '#ff7777', fontStyle: 'bold' })
      .setScrollFactor(0).setDepth(11)
    const hpBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    hpBg.fillStyle(0x330000)
    hpBg.fillRoundedRect(44, 8, 118, 16, 2)
    this.hpBar = this.add.graphics().setScrollFactor(0).setDepth(11)
    this.hpText = this.add.text(103, 9, `${PLAYER_MAX_HP} / ${PLAYER_MAX_HP}`, {
      fontSize: '8px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(12)

    // Stamina row
    this.add.text(10, 29, '⚡', { fontSize: '9px', color: '#44eeaa' })
      .setScrollFactor(0).setDepth(11)
    this.add.text(24, 30, 'STA', { fontSize: '8px', color: '#44dd88', fontStyle: 'bold' })
      .setScrollFactor(0).setDepth(11)
    const staBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    staBg.fillStyle(0x003322)
    staBg.fillRoundedRect(44, 30, 118, 10, 2)
    this.staminaBar = this.add.graphics().setScrollFactor(0).setDepth(11)

    // Mission label
    this.add.text(8, 46, `Era ${this.era}  ·  Mission ${this.mission}`, {
      fontSize: '7px', color: '#aa9966',
    }).setScrollFactor(0).setDepth(11)

    // ── SCORE / KILLS — top-right panel ──────────────────────────────────────
    const rPanel = this.add.graphics().setScrollFactor(0).setDepth(10)
    rPanel.fillStyle(0x000000, 0.75)
    rPanel.fillRect(W - 112, 0, 112, 48)
    rPanel.fillStyle(0xc8960c)
    rPanel.fillRect(W - 4, 0, 4, 48)   // gold right accent stripe

    this.scoreText = this.add.text(W - 10, 7, 'SCORE: 0', {
      fontSize: '10px', color: '#f0b830', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(11)

    this.killText = this.add.text(W - 10, 23, 'KILLS: 0', {
      fontSize: '8px', color: '#cccccc',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(11)

    this.loreText = this.add.text(W - 10, 35, 'LORE: 0/0', {
      fontSize: '8px', color: '#f0c040',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(11)

    // ── OBJECTIVE + ENEMY COUNT — top center ─────────────────────────────────
    this.objectiveText = this.add.text(W / 2, 6, '', {
      fontSize: '7px', color: '#ffdd88', fontStyle: 'bold',
      backgroundColor: '#00000066', padding: { x: 6, y: 2 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(11)

    this.enemyCountText = this.add.text(W / 2, 20, '', {
      fontSize: '7px', color: '#ff8866',
      backgroundColor: '#00000055', padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(11)

    // ── WEAPON HUD — bottom center ────────────────────────────────────────────
    const wx = W / 2
    const wY = H - 34
    const weapBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    weapBg.fillStyle(0x000000, 0.78)
    weapBg.fillRoundedRect(wx - 72, wY - 4, 144, 32, 4)
    weapBg.lineStyle(1, 0x555533, 0.8)
    weapBg.strokeRoundedRect(wx - 72, wY - 4, 144, 32, 4)
    this.weaponText = this.add.text(wx, wY, '', {
      fontSize: '7px', color: '#eeeecc', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(11)
    const relBg = this.add.graphics().setScrollFactor(0).setDepth(10)
    relBg.fillStyle(0x222200)
    relBg.fillRoundedRect(wx - 50, wY + 18, 100, 5, 2)
    this.reloadBar = this.add.graphics().setScrollFactor(0).setDepth(11)

    // ── BOSS HP BAR — top center (only when map has a boss) ───────────────────
    if (this.boss) {
      const barW = 180
      const barX = W / 2 - barW / 2
      const bossBg = this.add.graphics().setScrollFactor(0).setDepth(10)
      bossBg.fillStyle(0x000000, 0.8)
      bossBg.fillRoundedRect(barX - 6, 4, barW + 12, 26, 3)
      bossBg.fillStyle(0x220000)
      bossBg.fillRoundedRect(barX, 8, barW, 12, 2)
      this.bossHpBar = this.add.graphics().setScrollFactor(0).setDepth(11)
      this.bossNameText = this.add.text(W / 2, 22, this.boss.name, {
        fontSize: '7px', color: '#ffccaa', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(11)
      this.bossPhaseText = this.add.text(barX + barW + 8, 9, 'Phase 1', {
        fontSize: '6px', color: '#ff9955',
      }).setScrollFactor(0).setDepth(11)
      this.updateBossHUD()
    }
  }

  private updateHUD() {
    const W = this.scale.width / 2
    const H = this.scale.height / 2

    // HP bar — top left
    const hp = Math.round(this.player.hp)
    const hpPct = hp / PLAYER_MAX_HP
    const hpColor = hpPct > 0.6 ? 0x33cc55 : hpPct > 0.3 ? 0xddaa22 : 0xdd2222
    this.hpBar.clear()
    this.hpBar.fillStyle(hpColor)
    this.hpBar.fillRoundedRect(44, 8, 118 * hpPct, 16, 2)
    this.hpText.setText(`${hp} / ${PLAYER_MAX_HP}`)
    this.hpText.setColor(hpPct > 0.3 ? '#ffffff' : '#ffbbbb')

    // Stamina bar
    this.staminaBar.clear()
    this.staminaBar.fillStyle(0x22cc77)
    this.staminaBar.fillRoundedRect(44, 30, 118 * (this.player.stamina / PLAYER_MAX_STAMINA), 10, 2)

    this.scoreText.setText(`SCORE: ${this.scoreSystem.score.toLocaleString()}`)
    this.killText.setText(`KILLS: ${this.scoreSystem.kills}`)
    this.loreText.setText(`LORE: ${this.scoreSystem.loreCount}/${this.totalLore}`)

    const alive = this.enemies.filter(e => !e.isDead).length

    // Objective label
    if (this.missionComplete) {
      this.objectiveText.setText('✓ MISSION COMPLETE!').setColor('#44ff88')
    } else if (this.boss && !this.boss.isDead) {
      this.objectiveText.setText(`⚔ DEFEAT: ${this.boss.name}`)
    } else {
      this.objectiveText.setText('☠ OBJECTIVE: ELIMINATE ALL ENEMIES')
    }

    // Enemy count
    if (alive > 0) {
      this.enemyCountText.setText(`${alive} remaining`).setVisible(true)
    } else {
      this.enemyCountText.setVisible(false)
    }

    // Weapon HUD
    const wx = W / 2
    const wY = H - 34
    const hud = this.weaponSystem.hudInfo
    const dots = (level: number) => '●'.repeat(level) + '○'.repeat(5 - level)
    let weaponLine = ''
    if (hud.heavyName) {
      weaponLine = `[X] ${hud.quickName}  ${hud.quickAmmo}  ${dots(hud.quickLevel)}\n` +
        `[C] ${hud.heavyName}  ${hud.heavyAmmo}  ${dots(hud.heavyLevel)}`
    } else {
      weaponLine = `[X] ${hud.quickName}   ${hud.quickAmmo}   ${dots(hud.quickLevel)}`
    }
    if (this.era === 1) {
      weaponLine += `\n[C] Shield Bash  ${SHIELD_BASH_DAMAGE}dmg`
    } else if (this.era === 3) {
      weaponLine += `\n[V] Grenade  ×${this.grenadeCount}`
    }
    this.weaponText.setText(weaponLine)
    this.reloadBar.clear()
    this.reloadBar.fillStyle(0xffdd00)
    this.reloadBar.fillRoundedRect(wx - 50, wY + 18, 100 * hud.heavyReloadPct, 5, 2)

    if (this.boss) this.updateBossHUD()
  }

  private createPauseOverlay() {
    const W = this.scale.width / 2    // 480
    const H = this.scale.height / 2   // 270
    const cx = W / 2

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(50)
    overlay.fillStyle(0x000000, 0.7)
    overlay.fillRect(0, 0, W, H)

    const title = this.add.text(cx, H / 2 - 40, 'PAUSED', {
      fontSize: '24px', color: '#c8960c', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51)

    const resume = this.add.text(cx, H / 2, 'RESUME', {
      fontSize: '12px', color: '#ffffff', backgroundColor: '#333300', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })
    resume.on('pointerup', () => this.togglePause())

    const quit = this.add.text(cx, H / 2 + 35, 'QUIT TO MENU', {
      fontSize: '10px', color: '#888866',
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
