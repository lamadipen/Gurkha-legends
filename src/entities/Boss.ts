import Phaser from 'phaser'
import {
  BOSS_EIC_PHASE2_HP, BOSS_EIC_PHASE3_HP,
  BOSS_ERA1_HP,
  BOSS_ERA1_P1_SPEED, BOSS_ERA1_P2_SPEED, BOSS_ERA1_P3_SPEED,
  BOSS_ERA1_P1_DAMAGE, BOSS_ERA1_P2_DAMAGE, BOSS_ERA1_P3_DAMAGE,
  BOSS_ERA1_SPEAR_DAMAGE, BOSS_ERA1_CHARGE_DAMAGE, BOSS_ERA1_MELEE_RANGE,
} from '../config/balance'
import type { EraNumber } from '../types'

export type BossPhase = 1 | 2 | 3

const PHASE_COLORS: Record<BossPhase, number> = {
  1: 0x8b1a1a,
  2: 0xcc2200,
  3: 0xff2200,
}

const BOSS_NAMES: Record<EraNumber, string> = {
  1: 'Kazi Surendra Thapa',
  2: 'General Ochterlony',
  3: 'Commander Vargas',
}

export class Boss {
  readonly sprite: Phaser.GameObjects.Rectangle
  private glow: Phaser.GameObjects.Rectangle
  private physBody: Phaser.Physics.Arcade.Body
  private scene: Phaser.Scene

  readonly era: EraNumber
  readonly name: string

  private _hp = BOSS_ERA1_HP
  private _phase: BossPhase = 1
  private _dead = false

  private state: 'idle' | 'combat' | 'telegraph' | 'charging' = 'idle'

  // Timers (ms)
  private meleeCooldown = 0
  private rangedCooldown = 2500  // slight delay before first spear
  private chargeCooldown = 4000
  private telegraphTimer = 0
  private chargeRushTimer = 0
  private chargeDir = { x: 1, y: 0 }

  private minionsSpawned = false

  constructor(scene: Phaser.Scene, x: number, y: number, era: EraNumber) {
    this.scene = scene
    this.era = era
    this.name = BOSS_NAMES[era]

    // Glow ring (behind sprite)
    this.glow = scene.add.rectangle(x, y, 52, 52, 0xff4400, 0.3).setDepth(3)

    // Main body — larger than regular enemies
    this.sprite = scene.add.rectangle(x, y, 40, 40, PHASE_COLORS[1]).setDepth(4)

    scene.physics.add.existing(this.sprite)
    this.physBody = this.sprite.body as Phaser.Physics.Arcade.Body
    this.physBody.setCollideWorldBounds(true)

    // Idle glow pulse
    scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.15, to: 0.45 },
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 0.9, to: 1.1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  get hp() { return this._hp }
  get maxHp() { return BOSS_ERA1_HP }
  get phase() { return this._phase }
  get isDead() { return this._dead }
  get x() { return this.sprite.x }
  get y() { return this.sprite.y }

  update(delta: number, playerX: number, playerY: number) {
    if (this._dead) return

    const dx = playerX - this.sprite.x
    const dy = playerY - this.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Update glow position
    this.glow.setPosition(this.sprite.x, this.sprite.y)

    // Tick cooldowns
    this.meleeCooldown   = Math.max(0, this.meleeCooldown - delta)
    this.rangedCooldown  = Math.max(0, this.rangedCooldown - delta)
    this.chargeCooldown  = Math.max(0, this.chargeCooldown - delta)

    if (this.state === 'idle') {
      if (dist < 300) this.state = 'combat'
      return
    }

    if (this.state === 'telegraph') {
      this.physBody.setVelocity(0, 0)
      this.telegraphTimer -= delta
      if (this.telegraphTimer <= 0) {
        // Begin actual rush
        this.state = 'charging'
        this.chargeRushTimer = 600
        this.physBody.setVelocity(this.chargeDir.x * 550, this.chargeDir.y * 550)
        this.sprite.setFillStyle(PHASE_COLORS[this._phase])
      }
      return
    }

    if (this.state === 'charging') {
      this.chargeRushTimer -= delta
      // Check player hit during rush
      const cdx = playerX - this.sprite.x
      const cdy = playerY - this.sprite.y
      if (Math.sqrt(cdx * cdx + cdy * cdy) < 45) {
        this.scene.events.emit('boss-melee', {
          damage: BOSS_ERA1_CHARGE_DAMAGE, x: this.sprite.x, y: this.sprite.y,
        })
        this.chargeRushTimer = 0 // end charge early on hit
      }
      if (this.chargeRushTimer <= 0) {
        this.physBody.setVelocity(0, 0)
        this.state = 'combat'
        this.chargeCooldown = 4500
      }
      return
    }

    // ── COMBAT ──────────────────────────────────────────────────────────────────

    const speed = this._phase === 3 ? BOSS_ERA1_P3_SPEED
      : this._phase === 2 ? BOSS_ERA1_P2_SPEED : BOSS_ERA1_P1_SPEED

    const meleeDmg = this._phase === 3 ? BOSS_ERA1_P3_DAMAGE
      : this._phase === 2 ? BOSS_ERA1_P2_DAMAGE : BOSS_ERA1_P1_DAMAGE

    const meleeCd = this._phase === 3 ? 650 : this._phase === 2 ? 950 : 1250

    // Phase 3: charge attack
    if (this._phase === 3 && this.chargeCooldown <= 0) {
      this.state = 'telegraph'
      this.telegraphTimer = 650
      this.chargeDir = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 }
      this.sprite.setFillStyle(0xffff00)
      this.scene.cameras.main.shake(200, 0.005)
      return
    }

    // Move toward player
    this.moveTo(playerX, playerY, speed)

    // Melee attack
    if (dist <= BOSS_ERA1_MELEE_RANGE && this.meleeCooldown <= 0) {
      this.meleeCooldown = meleeCd
      this.scene.events.emit('boss-melee', {
        damage: meleeDmg, x: this.sprite.x, y: this.sprite.y,
      })
      this.scene.cameras.main.shake(120, 0.008)
    }

    // Phase 2+: ranged spear throw
    if (this._phase >= 2 && dist > 100 && this.rangedCooldown <= 0) {
      this.rangedCooldown = 2800
      const rdx = dist > 0 ? dx / dist : 1
      const rdy = dist > 0 ? dy / dist : 0
      this.scene.events.emit('boss-fire', {
        x: this.sprite.x, y: this.sprite.y,
        dirX: rdx, dirY: rdy,
        damage: BOSS_ERA1_SPEAR_DAMAGE,
      })
    }

    // Phase 3: one-time minion wave
    if (this._phase === 3 && !this.minionsSpawned) {
      this.minionsSpawned = true
      this.scene.events.emit('boss-spawn-minions')
    }
  }

  takeDamage(amount: number): boolean {
    if (this._dead) return false
    this._hp = Math.max(0, this._hp - amount)

    // Flash white on hit
    this.sprite.setFillStyle(0xffffff)
    this.scene.time.delayedCall(80, () => {
      if (!this._dead) this.sprite.setFillStyle(PHASE_COLORS[this._phase])
    })

    // Check phase transitions
    const hpPct = this._hp / BOSS_ERA1_HP
    if (this._phase === 1 && hpPct <= BOSS_EIC_PHASE2_HP) this.enterPhase(2)
    else if (this._phase === 2 && hpPct <= BOSS_EIC_PHASE3_HP) this.enterPhase(3)

    if (this._hp <= 0) {
      this.die()
      return true
    }
    return false
  }

  private enterPhase(phase: BossPhase) {
    this._phase = phase
    this.sprite.setFillStyle(PHASE_COLORS[phase])
    this.glow.setFillStyle(phase === 3 ? 0xff0000 : 0xff6600)

    const shakeIntensity = phase === 3 ? 0.025 : 0.015
    this.scene.cameras.main.shake(500, shakeIntensity)
    this.scene.cameras.main.flash(300,
      phase === 3 ? 200 : 150,
      phase === 3 ? 0   : 50,
      0, false
    )

    this.scene.events.emit('boss-phase', { phase })

    // Phase 3: scale up slightly to signal berserk
    if (phase === 3) {
      this.scene.tweens.add({
        targets: [this.sprite, this.glow],
        scaleX: 1.2, scaleY: 1.2,
        duration: 400,
        ease: 'Back.easeOut',
      })
    }
  }

  private moveTo(tx: number, ty: number, speed: number) {
    const dx = tx - this.sprite.x
    const dy = ty - this.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) { this.physBody.setVelocity(0, 0); return }
    this.physBody.setVelocity((dx / dist) * speed, (dy / dist) * speed)
  }

  private die() {
    this._dead = true
    this.physBody.setVelocity(0, 0)
    this.physBody.setEnable(false)

    this.scene.cameras.main.shake(800, 0.03)
    this.scene.cameras.main.flash(500, 255, 200, 0, false)

    this.scene.tweens.killTweensOf(this.glow)
    this.scene.tweens.add({
      targets: [this.sprite, this.glow],
      alpha: 0, scaleX: 2, scaleY: 2,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.sprite.destroy()
        this.glow.destroy()
        this.scene.events.emit('boss-defeated')
      },
    })
  }

  destroy() {
    this.sprite.destroy()
    this.glow.destroy()
  }
}
