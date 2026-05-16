import Phaser from 'phaser'
import { StaminaSystem } from '../engine/StaminaSystem'
import type { InputState } from '../engine/InputManager'
import type { ScoreSystem } from '../engine/ScoreSystem'
import {
  PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_MAX_HP,
  PLAYER_DODGE_DURATION, PLAYER_DODGE_COOLDOWN, PLAYER_DODGE_STAMINA,
  PLAYER_SPRINT_STAMINA, PLAYER_STEALTH_RADIUS, PLAYER_NORMAL_RADIUS,
  KHUKURI_LIGHT_DAMAGE_1, KHUKURI_LIGHT_DAMAGE_2, KHUKURI_LIGHT_DAMAGE_3,
  KHUKURI_COMBO_WINDOW, KHUKURI_HEAVY_DAMAGE, KHUKURI_HEAVY_CHARGE_TIME,
  KHUKURI_HEAVY_STAMINA, KHUKURI_COUNTER_WINDOW, KHUKURI_COUNTER_DAMAGE,
  KHUKURI_STEALTH_RANGE, KHUKURI_HEAVY_RADIUS,
} from '../config/balance'

type AnimDir = 'down' | 'up' | 'left'  // right = flipX of left

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite
  private physBody: Phaser.Physics.Arcade.Body
  private sta: StaminaSystem
  private scene: Phaser.Scene

  private _hp = PLAYER_MAX_HP
  private _dead = false
  private crouching = false

  // Dodge state
  private dodgeCooldown = 0
  private dodging = false
  private dodgeTimer = 0

  // Combat
  private comboCount = 0
  private comboTimer = 0
  private heavyHeldMs = 0
  private counterTimer = 0

  // Animation
  private animDir: AnimDir = 'down'
  private facingRight = false
  private attacking = false
  private khukuriGfx: Phaser.GameObjects.Graphics

  private facing = { x: 0, y: 1 }

  constructor(scene: Phaser.Scene, x: number, y: number, scoreSystem: ScoreSystem) {
    void scoreSystem
    this.scene = scene
    this.sta = new StaminaSystem()

    this.sprite = scene.add.sprite(x, y, 'player', 0).setDepth(5)
    scene.physics.add.existing(this.sprite)
    this.physBody = this.sprite.body as Phaser.Physics.Arcade.Body
    this.physBody.setCollideWorldBounds(true)
    this.physBody.setMaxVelocity(PLAYER_SPRINT_SPEED, PLAYER_SPRINT_SPEED)
    this.physBody.setSize(18, 18)

    this.khukuriGfx = scene.add.graphics()

    this.sprite.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
      if (anim.key === 'player_attack_down' || anim.key === 'player_attack_side') this.attacking = false
    })

    this.sprite.play('player_idle_down')
  }

  get hp() { return this._hp }
  get stamina() { return this.sta.value }
  get isDead() { return this._dead }
  drainStamina(amount: number): boolean { return this.sta.drain(amount) }
  get detectionRadius() { return this.crouching ? PLAYER_STEALTH_RADIUS : PLAYER_NORMAL_RADIUS }
  get facingAngle(): number { return Math.atan2(this.facing.y, this.facing.x) }

  update(_time: number, delta: number, input: InputState) {
    if (this._dead) return

    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - delta)
    this.comboTimer = Math.max(0, this.comboTimer - delta)
    this.counterTimer = Math.max(0, this.counterTimer - delta)
    if (this.comboTimer <= 0) this.comboCount = 0

    const moving = input.up || input.down || input.left || input.right
    this.crouching = input.sprint && !moving
    const sprinting = input.sprint && moving && !this.sta.isEmpty

    // Dodge
    if (this.dodging) {
      this.dodgeTimer -= delta
      if (this.dodgeTimer <= 0) {
        this.dodging = false
        this.sprite.setAlpha(1)
      }
    } else {
      let vx = 0, vy = 0
      if (input.left)  vx -= 1
      if (input.right) vx += 1
      if (input.up)    vy -= 1
      if (input.down)  vy += 1

      if (vx !== 0 || vy !== 0) {
        const len = Math.sqrt(vx * vx + vy * vy)
        vx /= len; vy /= len
        this.facing = { x: vx, y: vy }
        this.updateFacingDir(vx, vy)
      }

      const speed = sprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED
      this.physBody.setVelocity(vx * speed, vy * speed)

      if (sprinting) this.sta.drainPerSec(PLAYER_SPRINT_STAMINA, delta)

      if (input.dodge && this.dodgeCooldown <= 0 && !this.sta.isEmpty) {
        if (this.sta.drain(PLAYER_DODGE_STAMINA)) {
          this.dodging = true
          this.dodgeTimer = PLAYER_DODGE_DURATION
          this.dodgeCooldown = PLAYER_DODGE_COOLDOWN
          this.physBody.setVelocity(this.facing.x * 500, this.facing.y * 500)
          this.sprite.setAlpha(0.45)
        }
      }
    }

    // Heavy hold tracking
    if (input.heavyAttackHeld && !input.lightAttack) {
      this.heavyHeldMs += delta
    } else if (!input.heavyAttackHeld && this.heavyHeldMs >= KHUKURI_HEAVY_CHARGE_TIME) {
      this.doHeavyAttack()
      this.heavyHeldMs = 0
    } else if (!input.heavyAttackHeld) {
      this.heavyHeldMs = 0
    }

    if (input.lightAttack) this.doLightAttack()

    this.sta.update(delta, sprinting || this.dodging)
    this.sprite.setDepth(this.sprite.y)
    this.khukuriGfx.setDepth(this.sprite.y + 1)
    this.updateAnimation(moving)
    this.drawKhukuri()

    if (this._hp <= 0) this._dead = true
  }

  private updateFacingDir(vx: number, vy: number) {
    if (Math.abs(vx) > Math.abs(vy)) {
      this.facingRight = vx > 0
      this.animDir = 'left'
    } else {
      this.animDir = vy > 0 ? 'down' : 'up'
      this.facingRight = false
    }
  }

  private updateAnimation(moving: boolean) {
    if (this.attacking) return

    this.sprite.setFlipX(this.facingRight)

    if (this.dodging) {
      this.sprite.play('player_dodge', true)
    } else if (this.crouching) {
      this.sprite.play('player_crouch', true)
    } else if (moving) {
      this.sprite.play(`player_walk_${this.animDir}`, true)
    } else {
      this.sprite.play(`player_idle_${this.animDir}`, true)
    }
  }

  heal(amount: number) {
    this._hp = Math.min(PLAYER_MAX_HP, this._hp + amount)
    this.sprite.setTint(0x44ff88)
    this.scene.time.delayedCall(120, () => this.sprite.clearTint())
  }

  takeDamage(amount: number) {
    if (this.dodging) return
    this._hp = Math.max(0, this._hp - amount)
    this.counterTimer = KHUKURI_COUNTER_WINDOW
    this.scene.cameras.main.shake(150, 0.01)
    // Red tint flash on hit
    this.sprite.setTint(0xff4444)
    this.scene.time.delayedCall(120, () => this.sprite.clearTint())
  }

  private doLightAttack() {
    if (this.counterTimer > 0) {
      this.emitAttack(KHUKURI_COUNTER_DAMAGE, 60, false, true)
      this.counterTimer = 0
      return
    }
    this.comboCount++
    this.comboTimer = KHUKURI_COMBO_WINDOW
    const dmg = this.comboCount === 1 ? KHUKURI_LIGHT_DAMAGE_1
      : this.comboCount === 2 ? KHUKURI_LIGHT_DAMAGE_2 : KHUKURI_LIGHT_DAMAGE_3
    const isFinish = this.comboCount >= 3
    this.emitAttack(dmg, 50, isFinish, false)
    if (isFinish) this.comboCount = 0
    this.scene.cameras.main.flash(80, 200, 150, 0, false)
    this.triggerAttackAnim()
  }

  private doHeavyAttack() {
    if (!this.sta.drain(KHUKURI_HEAVY_STAMINA)) return
    this.emitAttack(KHUKURI_HEAVY_DAMAGE, KHUKURI_HEAVY_RADIUS, false, false, true)
    this.scene.cameras.main.flash(120, 255, 100, 0, false)
    this.triggerAttackAnim()
  }

  private triggerAttackAnim() {
    this.attacking = true
    this.sprite.setFlipX(this.facingRight)
    // Side attack: arc drawn on LEFT side of frame; flipX mirrors it for right-facing
    const key = this.animDir === 'left' ? 'player_attack_side' : 'player_attack_down'
    this.sprite.play(key)
  }

  private emitAttack(damage: number, range: number, comboFinish: boolean,
    isCounter: boolean, isHeavy = false) {
    this.scene.events.emit('player-attack', {
      x: this.sprite.x + this.facing.x * 20,
      y: this.sprite.y + this.facing.y * 20,
      damage, range, comboFinish, isCounter, isHeavy,
      isStealth: this.crouching,
    })
  }

  private drawKhukuri() {
    this.khukuriGfx.clear()
    if (!this.attacking) return

    const angle = Math.atan2(this.facing.y, this.facing.x)
    const ox = this.sprite.x + this.facing.x * 12
    const oy = this.sprite.y + this.facing.y * 12
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    // Rotate a local point (lx, ly) into world space around (ox, oy)
    const r = (lx: number, ly: number) => ({
      x: ox + lx * c - ly * s,
      y: oy + lx * s + ly * c,
    })

    // ── Blade ─────────────────────────────────────────────────────────────────
    // Spine runs along top, belly swells down then curves up to the tip.
    // Tip is at (16, 0) in local space; widest belly ~(9, 6).
    const bladePoints = [
      r(0, -1),    // spine base
      r(5, -2),    // spine rise
      r(10, -2.5), // spine peak
      r(14, -1),   // spine curves toward tip
      r(16, 1),    // tip
      r(13, 4),    // tip belly side
      r(9, 6),     // widest belly
      r(4, 5),     // belly base
      r(0, 2),     // blade base belly
    ]
    this.khukuriGfx.fillStyle(0xb8bcc8, 1)
    this.khukuriGfx.fillPoints(bladePoints, true)

    // Edge highlight — bright line along spine
    this.khukuriGfx.lineStyle(0.8, 0xe0e4f0, 0.9)
    this.khukuriGfx.beginPath()
    this.khukuriGfx.moveTo(r(0, -1).x, r(0, -1).y)
    this.khukuriGfx.lineTo(r(5, -2).x, r(5, -2).y)
    this.khukuriGfx.lineTo(r(10, -2.5).x, r(10, -2.5).y)
    this.khukuriGfx.lineTo(r(14, -1).x, r(14, -1).y)
    this.khukuriGfx.lineTo(r(16, 1).x, r(16, 1).y)
    this.khukuriGfx.strokePath()

    // Fuller (groove) — subtle darker line down the blade centre
    this.khukuriGfx.lineStyle(0.6, 0x8890a0, 0.7)
    this.khukuriGfx.beginPath()
    this.khukuriGfx.moveTo(r(1, 1).x, r(1, 1).y)
    this.khukuriGfx.lineTo(r(7, 1).x, r(7, 1).y)
    this.khukuriGfx.lineTo(r(12, 0.5).x, r(12, 0.5).y)
    this.khukuriGfx.strokePath()

    // ── Guard (kauda notch area) ──────────────────────────────────────────────
    this.khukuriGfx.fillStyle(0x5a4a3a, 1)
    this.khukuriGfx.fillPoints([r(-1, -2), r(1, -2), r(1, 3.5), r(-1, 3.5)], true)

    // ── Handle ────────────────────────────────────────────────────────────────
    // Dark buffalo horn, slightly tapered toward the butt
    const handlePoints = [
      r(-1.5, -1.5), r(-8, -1),
      r(-8.5, 2), r(-1.5, 2.5),
    ]
    this.khukuriGfx.fillStyle(0x1a0f08, 1)
    this.khukuriGfx.fillPoints(handlePoints, true)

    // Handle rivets / decoration — small bright dots
    this.khukuriGfx.fillStyle(0x888070, 1)
    this.khukuriGfx.fillCircle(r(-3.5, 0.5).x, r(-3.5, 0.5).y, 0.8)
    this.khukuriGfx.fillCircle(r(-5.5, 0.5).x, r(-5.5, 0.5).y, 0.8)

    // Butt cap — metal pommel
    this.khukuriGfx.fillStyle(0x6a6060, 1)
    this.khukuriGfx.fillPoints([r(-8, -1), r(-9.5, -0.5), r(-9.5, 2), r(-8, 2.5)], true)
  }

  isInStealthRange(ex: number, ey: number): boolean {
    const dx = ex - this.sprite.x
    const dy = ey - this.sprite.y
    return Math.sqrt(dx * dx + dy * dy) <= KHUKURI_STEALTH_RANGE
  }
}
