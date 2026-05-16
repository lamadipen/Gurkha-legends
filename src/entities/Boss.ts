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

const BOSS_NAMES: Record<EraNumber, string> = {
  1: 'Kazi Surendra Thapa',
  2: 'General Ochterlony',
  3: 'Commander Vargas',
}

// Phase tints — applied on top of the sprite
const PHASE_TINTS: Record<BossPhase, number> = {
  1: 0xffffff,   // normal
  2: 0xff9966,   // orange-red rage
  3: 0xff4444,   // berserk red
}

export class Boss {
  readonly sprite: Phaser.GameObjects.Sprite
  private glow: Phaser.GameObjects.Graphics
  private physBody: Phaser.Physics.Arcade.Body
  private scene: Phaser.Scene

  readonly era: EraNumber
  readonly name: string

  private _hp = BOSS_ERA1_HP
  private _phase: BossPhase = 1
  private _dead = false

  private state: 'idle' | 'combat' | 'telegraph' | 'charging' = 'idle'

  private meleeCooldown = 0
  private rangedCooldown = 2500
  private chargeCooldown = 4000
  private telegraphTimer = 0
  private chargeRushTimer = 0
  private chargeDir = { x: 1, y: 0 }
  private minionsSpawned = false

  // Animation state
  private animDir: 'down' | 'left' = 'down'
  private facingRight = false
  private currentAnim = ''
  private attackAnimTimer = 0

  constructor(scene: Phaser.Scene, x: number, y: number, era: EraNumber) {
    this.scene = scene
    this.era = era
    this.name = BOSS_NAMES[era]

    // Glow ring drawn behind sprite
    this.glow = scene.add.graphics().setDepth(3)
    this.drawGlow(x, y, 0x882200, 0.35)

    // Sprite — 40×40 frames, larger than regular enemies
    this.sprite = scene.add.sprite(x, y, 'boss_commander', 0).setDepth(4).setScale(1)
    scene.physics.add.existing(this.sprite)
    this.physBody = this.sprite.body as Phaser.Physics.Arcade.Body
    this.physBody.setCollideWorldBounds(true)
    this.physBody.setSize(34, 34)

    this.sprite.play('boss_idle_down')

    // Pulse glow tween
    scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.2, to: 0.6 },
      scaleX: { from: 0.88, to: 1.12 },
      scaleY: { from: 0.88, to: 1.12 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private drawGlow(x: number, y: number, color: number, alpha: number) {
    this.glow.clear()
    this.glow.fillStyle(color, alpha)
    this.glow.fillCircle(x, y, 30)
  }

  get hp()     { return this._hp }
  get maxHp()  { return BOSS_ERA1_HP }
  get phase()  { return this._phase }
  get isDead() { return this._dead }
  get x()      { return this.sprite.x }
  get y()      { return this.sprite.y }

  update(delta: number, playerX: number, playerY: number) {
    if (this._dead) return

    const dx = playerX - this.sprite.x
    const dy = playerY - this.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    this.glow.setPosition(this.sprite.x - this.sprite.x, this.sprite.y - this.sprite.y)
    this.drawGlow(this.sprite.x, this.sprite.y,
      this._phase === 3 ? 0xff0000 : this._phase === 2 ? 0xff6600 : 0x882200,
      this._phase === 3 ? 0.4 : 0.25)

    this.sprite.setDepth(this.sprite.y)

    this.meleeCooldown  = Math.max(0, this.meleeCooldown - delta)
    this.rangedCooldown = Math.max(0, this.rangedCooldown - delta)
    this.chargeCooldown = Math.max(0, this.chargeCooldown - delta)
    this.attackAnimTimer = Math.max(0, this.attackAnimTimer - delta)

    if (this.state === 'idle') {
      if (dist < 300) this.state = 'combat'
      this.updateAnim(false)
      return
    }

    if (this.state === 'telegraph') {
      this.physBody.setVelocity(0, 0)
      this.telegraphTimer -= delta
      if (this.telegraphTimer <= 0) {
        this.state = 'charging'
        this.chargeRushTimer = 600
        this.physBody.setVelocity(this.chargeDir.x * 550, this.chargeDir.y * 550)
      }
      this.updateAnim(false)
      return
    }

    if (this.state === 'charging') {
      this.chargeRushTimer -= delta
      const cdx = playerX - this.sprite.x
      const cdy = playerY - this.sprite.y
      if (Math.sqrt(cdx * cdx + cdy * cdy) < 45) {
        this.scene.events.emit('boss-melee', {
          damage: BOSS_ERA1_CHARGE_DAMAGE, x: this.sprite.x, y: this.sprite.y,
        })
        this.chargeRushTimer = 0
      }
      if (this.chargeRushTimer <= 0) {
        this.physBody.setVelocity(0, 0)
        this.state = 'combat'
        this.chargeCooldown = 4500
      }
      this.updateAnim(true)
      return
    }

    // ── COMBAT ────────────────────────────────────────────────────────────────

    const speed = this._phase === 3 ? BOSS_ERA1_P3_SPEED
      : this._phase === 2 ? BOSS_ERA1_P2_SPEED : BOSS_ERA1_P1_SPEED
    const meleeDmg = this._phase === 3 ? BOSS_ERA1_P3_DAMAGE
      : this._phase === 2 ? BOSS_ERA1_P2_DAMAGE : BOSS_ERA1_P1_DAMAGE
    const meleeCd = this._phase === 3 ? 650 : this._phase === 2 ? 950 : 1250

    if (this._phase === 3 && this.chargeCooldown <= 0) {
      this.state = 'telegraph'
      this.telegraphTimer = 650
      this.chargeDir = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 }
      this.sprite.setTint(0xffff00)
      this.scene.time.delayedCall(80, () => this.sprite.setTint(PHASE_TINTS[this._phase]))
      this.scene.cameras.main.shake(200, 0.005)
      return
    }

    this.moveTo(playerX, playerY, speed)

    if (dist <= BOSS_ERA1_MELEE_RANGE && this.meleeCooldown <= 0) {
      this.meleeCooldown = meleeCd
      this.scene.events.emit('boss-melee', {
        damage: meleeDmg, x: this.sprite.x, y: this.sprite.y,
      })
      this.scene.cameras.main.shake(120, 0.008)
      this.triggerAttackAnim()
    }

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

    if (this._phase === 3 && !this.minionsSpawned) {
      this.minionsSpawned = true
      this.scene.events.emit('boss-spawn-minions')
    }

    this.updateAnim(this.attackAnimTimer <= 0)
  }

  private updateAnim(allowWalkAnim: boolean) {
    if (this.attackAnimTimer > 0) return

    const { x: vx, y: vy } = this.physBody.velocity
    const moving = (Math.abs(vx) > 5 || Math.abs(vy) > 5) && allowWalkAnim

    if (Math.abs(vx) > Math.abs(vy)) {
      this.facingRight = vx > 0
      this.animDir = 'left'
    } else if (Math.abs(vy) > 5) {
      this.animDir = 'down'
      this.facingRight = false
    }

    this.sprite.setFlipX(this.facingRight)

    const key = moving
      ? `boss_walk_${this.animDir}`
      : `boss_idle_${this.animDir}`

    if (key !== this.currentAnim) {
      this.currentAnim = key
      this.sprite.play(key, true)
    }
  }

  private triggerAttackAnim() {
    this.attackAnimTimer = 350
    this.currentAnim = 'boss_attack'
    this.sprite.play('boss_attack', true)
    this.scene.time.delayedCall(350, () => {
      if (!this._dead) this.currentAnim = ''
    })
  }

  takeDamage(amount: number): boolean {
    if (this._dead) return false
    this._hp = Math.max(0, this._hp - amount)

    this.sprite.setTint(0xffffff)
    this.scene.time.delayedCall(80, () => {
      if (!this._dead) this.sprite.setTint(PHASE_TINTS[this._phase])
    })

    const hpPct = this._hp / BOSS_ERA1_HP
    if (this._phase === 1 && hpPct <= BOSS_EIC_PHASE2_HP) this.enterPhase(2)
    else if (this._phase === 2 && hpPct <= BOSS_EIC_PHASE3_HP) this.enterPhase(3)

    if (this._hp <= 0) { this.die(); return true }
    return false
  }

  private enterPhase(phase: BossPhase) {
    this._phase = phase
    this.sprite.setTint(PHASE_TINTS[phase])

    const shakeIntensity = phase === 3 ? 0.025 : 0.015
    this.scene.cameras.main.shake(500, shakeIntensity)
    this.scene.cameras.main.flash(300,
      phase === 3 ? 200 : 150,
      phase === 3 ? 0   : 50,
      0, false)

    this.scene.events.emit('boss-phase', { phase })

    if (phase === 3) {
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.15, scaleY: 1.15,
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
      alpha: 0, scaleX: 2.2, scaleY: 2.2,
      duration: 900,
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
