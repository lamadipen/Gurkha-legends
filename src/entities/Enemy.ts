import Phaser from 'phaser'
import {
  ENEMY_SOLDIER_HP, ENEMY_SOLDIER_SPEED, ENEMY_SOLDIER_DAMAGE, ENEMY_SOLDIER_RANGE,
  ENEMY_ARCHER_HP, ENEMY_ARCHER_SPEED, ENEMY_ARCHER_DAMAGE, ENEMY_ARCHER_KEEP_DIST,
  ENEMY_HEAVY_HP, ENEMY_HEAVY_SPEED, ENEMY_HEAVY_DAMAGE,
  ENEMY_RIFLEMAN_HP, ENEMY_RIFLEMAN_SPEED, ENEMY_RIFLEMAN_DAMAGE, ENEMY_RIFLEMAN_RETREAT,
  ENEMY_COMMANDER_HP,
  AI_DETECTION_CONE_ANGLE, AI_DETECTION_RANGE, AI_ALERT_TIMER,
  AI_DEAGGRO_RANGE, AI_DEAGGRO_TIME,
} from '../config/balance'

export type EnemyType = 'soldier' | 'archer' | 'heavy' | 'rifleman' | 'commander'
export type EnemyState = 'patrol' | 'alert' | 'combat' | 'dead'

interface EnemyConfig {
  hp: number
  speed: number
  damage: number
  attackRange: number
  attackCooldown: number
  color: number
  size: [number, number]
}

const CONFIGS: Record<EnemyType, EnemyConfig> = {
  soldier:   { hp: ENEMY_SOLDIER_HP,   speed: ENEMY_SOLDIER_SPEED,   damage: ENEMY_SOLDIER_DAMAGE,   attackRange: ENEMY_SOLDIER_RANGE,     attackCooldown: 1000, color: 0xcc2222, size: [20, 20] },
  archer:    { hp: ENEMY_ARCHER_HP,    speed: ENEMY_ARCHER_SPEED,    damage: ENEMY_ARCHER_DAMAGE,    attackRange: ENEMY_ARCHER_KEEP_DIST,  attackCooldown: 1500, color: 0xcc7722, size: [18, 18] },
  heavy:     { hp: ENEMY_HEAVY_HP,     speed: ENEMY_HEAVY_SPEED,     damage: ENEMY_HEAVY_DAMAGE,     attackRange: 70,                      attackCooldown: 1800, color: 0x881111, size: [28, 28] },
  rifleman:  { hp: ENEMY_RIFLEMAN_HP,  speed: ENEMY_RIFLEMAN_SPEED,  damage: ENEMY_RIFLEMAN_DAMAGE,  attackRange: 200,                     attackCooldown: 1200, color: 0xcc5511, size: [20, 20] },
  commander: { hp: ENEMY_COMMANDER_HP, speed: 120,                   damage: 18,                     attackRange: 100,                     attackCooldown: 1000, color: 0x882244, size: [24, 24] },
}

export class Enemy {
  readonly sprite: Phaser.GameObjects.Sprite
  private physBody: Phaser.Physics.Arcade.Body
  private scene: Phaser.Scene
  private indicator: Phaser.GameObjects.Text

  readonly type: EnemyType
  private cfg: EnemyConfig
  private _hp: number
  private _state: EnemyState = 'patrol'

  private facing = { x: 1, y: 0 }
  private patrolOrigin: { x: number; y: number }
  private patrolTarget: { x: number; y: number }
  private patrolFlip = false

  private alertTimer = 0
  private deaggroTimer = 0
  private attackCooldown = 0
  private investigatePos: { x: number; y: number } | null = null
  private staggerTimer = 0

  // Animation tracking
  private currentAnimKey = ''

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    type: EnemyType,
    patrolEnd?: { x: number; y: number },
  ) {
    this.scene = scene
    this.type = type
    this.cfg = CONFIGS[type]
    this._hp = this.cfg.hp
    this.patrolOrigin = { x, y }
    this.patrolTarget = patrolEnd ?? { x: x + 100, y }

    const [w, h] = this.cfg.size
    this.sprite = scene.add.sprite(x, y, `enemy_${type}`, 0).setDepth(4)
    scene.physics.add.existing(this.sprite)
    this.physBody = this.sprite.body as Phaser.Physics.Arcade.Body
    this.physBody.setCollideWorldBounds(true)
    this.physBody.setSize(w, h)

    this.sprite.play(`${type}_idle_down`)
    this.currentAnimKey = `${type}_idle_down`

    this.indicator = scene.add.text(x, y - 22, '', {
      fontSize: '10px', color: '#ffffff', backgroundColor: '#000000',
    }).setOrigin(0.5).setDepth(6)
  }

  get hp() { return this._hp }
  get maxHp() { return this.cfg.hp }
  get isDead() { return this._state === 'dead' }
  get state() { return this._state }
  get x() { return this.sprite.x }
  get y() { return this.sprite.y }

  update(delta: number, playerX: number, playerY: number, playerDetectionRadius: number) {
    if (this._state === 'dead') return

    // Stagger — freeze movement briefly after being hit
    if (this.staggerTimer > 0) {
      this.staggerTimer = Math.max(0, this.staggerTimer - delta)
      this.physBody.setVelocity(0, 0)
      this.indicator.setPosition(this.sprite.x, this.sprite.y - 22)
      this.sprite.setDepth(this.sprite.y)
      this.updateAnim()
      return
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - delta)

    const dx = playerX - this.sprite.x
    const dy = playerY - this.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Track facing from velocity
    const { x: vx, y: vy } = this.physBody.velocity
    if (Math.abs(vx) > 5 || Math.abs(vy) > 5) {
      const len = Math.sqrt(vx * vx + vy * vy)
      this.facing = { x: vx / len, y: vy / len }
    }

    switch (this._state) {
      case 'patrol':
        this.tickPatrol()
        if (this.canSeePlayer(dist, dx, dy, playerDetectionRadius)) this.enterCombat()
        break

      case 'alert':
        this.alertTimer = Math.max(0, this.alertTimer - delta)
        if (this.canSeePlayer(dist, dx, dy, playerDetectionRadius)) {
          this.enterCombat()
          break
        }
        if (this.investigatePos) {
          this.moveTo(this.investigatePos.x, this.investigatePos.y, this.cfg.speed * 0.7)
          const ddx = this.investigatePos.x - this.sprite.x
          const ddy = this.investigatePos.y - this.sprite.y
          const arrived = Math.sqrt(ddx * ddx + ddy * ddy) < 10
          if (arrived || this.alertTimer <= 0) {
            this._state = 'patrol'
            this.investigatePos = null
            this.physBody.setVelocity(0, 0)
          }
        }
        break

      case 'combat':
        if (dist > AI_DEAGGRO_RANGE) {
          this.deaggroTimer += delta
          if (this.deaggroTimer >= AI_DEAGGRO_TIME) {
            this._state = 'patrol'
            this.deaggroTimer = 0
            this.physBody.setVelocity(0, 0)
            break
          }
        } else {
          this.deaggroTimer = 0
        }
        this.tickCombat(playerX, playerY, dist)
        if (dist <= this.cfg.attackRange && this.attackCooldown <= 0) this.doAttack()
        break
    }

    this.indicator.setPosition(this.sprite.x, this.sprite.y - 22)
    this.indicator.setText(this._state === 'alert' ? '!' : this._state === 'combat' ? '!!' : '')
    this.sprite.setDepth(this.sprite.y)
    this.updateAnim()
  }

  private updateAnim() {
    if (this._state === 'dead') return

    const { x: vx, y: vy } = this.physBody.velocity
    const moving = Math.abs(vx) > 5 || Math.abs(vy) > 5

    // Determine horizontal facing for flipX
    if (Math.abs(vx) > 5) this.sprite.setFlipX(vx > 0)

    // Pick anim key based on facing direction
    let dir: 'down' | 'left'
    if (Math.abs(vx) > Math.abs(vy)) {
      dir = 'left'   // side-facing (right = flipX)
    } else {
      dir = 'down'   // up/down both use down frames for enemies
    }

    const key = moving ? `${this.type}_walk_${dir}` : `${this.type}_idle_${dir}`
    if (key !== this.currentAnimKey) {
      this.sprite.play(key)
      this.currentAnimKey = key
    }
  }

  // Returns true if the enemy died
  takeDamage(amount: number, instantKill = false, attackX?: number, attackY?: number): boolean {
    if (this._state === 'dead') return false
    this._hp = instantKill ? 0 : Math.max(0, this._hp - amount)
    if (this._hp <= 0) { this.die(); return true }

    this.sprite.setTint(0xffffff)
    this.scene.time.delayedCall(80, () => {
      if (!this.isDead) this.sprite.clearTint()
    })

    // Knockback — push enemy away from attacker
    if (attackX !== undefined && attackY !== undefined) {
      const ddx = this.sprite.x - attackX
      const ddy = this.sprite.y - attackY
      const len = Math.sqrt(ddx * ddx + ddy * ddy)
      if (len > 0) {
        this.physBody.setVelocity((ddx / len) * 220, (ddy / len) * 220)
        this.staggerTimer = 180
      }
    }

    if (this._state !== 'combat') this.enterCombat()
    return false
  }

  // Apply a stagger (externally, e.g. from shield bash)
  stagger(duration: number) {
    this.staggerTimer = duration
    this.physBody.setVelocity(0, 0)
  }

  // Called by GameScene when a nearby sound event occurs
  alertToSound(sx: number, sy: number) {
    if (this._state === 'dead' || this._state === 'combat') return
    this._state = 'alert'
    this.alertTimer = AI_ALERT_TIMER
    this.investigatePos = { x: sx, y: sy }
    this.physBody.setVelocity(0, 0)
  }

  private enterCombat() {
    this._state = 'combat'
    this.alertTimer = 0
    this.investigatePos = null
    this.deaggroTimer = 0
  }

  private canSeePlayer(dist: number, dx: number, dy: number, playerDetectionRadius: number): boolean {
    // Player stealth radius caps how close they can be before enemies notice
    const effectiveRange = Math.min(AI_DETECTION_RANGE, playerDetectionRadius)
    if (dist > effectiveRange) return false
    const dot = this.facing.x * (dx / dist) + this.facing.y * (dy / dist)
    const halfConeRad = (AI_DETECTION_CONE_ANGLE / 2) * (Math.PI / 180)
    return dot >= Math.cos(halfConeRad)
  }

  private tickPatrol() {
    const target = this.patrolFlip ? this.patrolOrigin : this.patrolTarget
    const dx = target.x - this.sprite.x
    const dy = target.y - this.sprite.y
    if (Math.sqrt(dx * dx + dy * dy) < 8) {
      this.patrolFlip = !this.patrolFlip
      this.physBody.setVelocity(0, 0)
    } else {
      this.moveTo(target.x, target.y, this.cfg.speed * 0.5)
    }
  }

  private tickCombat(px: number, py: number, dist: number) {
    if (this.type === 'archer') {
      const sweet = ENEMY_ARCHER_KEEP_DIST
      if (dist < sweet * 0.7) this.moveTo(px, py, -this.cfg.speed)        // back away
      else if (dist > sweet * 1.3) this.moveTo(px, py, this.cfg.speed)    // close in
      else this.physBody.setVelocity(-this.facing.y * this.cfg.speed * 0.4, this.facing.x * this.cfg.speed * 0.4) // strafe
    } else if (this.type === 'rifleman') {
      const retreat = ENEMY_RIFLEMAN_RETREAT
      if (dist < retreat) this.moveTo(px, py, -this.cfg.speed)
      else this.moveTo(px, py, this.cfg.speed)
    } else {
      this.moveTo(px, py, this.cfg.speed)
    }
  }

  private moveTo(tx: number, ty: number, speed: number) {
    const dx = tx - this.sprite.x
    const dy = ty - this.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) { this.physBody.setVelocity(0, 0); return }
    this.physBody.setVelocity((dx / dist) * speed, (dy / dist) * speed)
  }

  private doAttack() {
    this.attackCooldown = this.cfg.attackCooldown
    this.scene.events.emit('enemy-attack', {
      damage: this.cfg.damage,
      x: this.sprite.x,
      y: this.sprite.y,
    })
  }

  private die() {
    this._state = 'dead'
    this.physBody.setVelocity(0, 0)
    this.physBody.setEnable(false)
    this.indicator.destroy()
    this.scene.cameras.main.flash(60, 150, 0, 0, false)
    // Fade to grey corpse over 1.5 seconds, then remove from scene after 4s linger
    this.sprite.setTint(0x555555)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.25,
      duration: 1500,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(4000, () => {
          if (this.sprite.active) this.sprite.destroy()
        })
      },
    })
  }

  destroy() {
    this.sprite.destroy()
    if (this.indicator.active) this.indicator.destroy()
  }
}
