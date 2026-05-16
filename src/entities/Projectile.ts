import Phaser from 'phaser'

export type ProjectileType = 'knife' | 'musket' | 'rifle'

interface ProjectileConfig {
  x: number; y: number
  dirX: number; dirY: number
  speed: number
  damage: number
  maxRange: number
  isGunshot: boolean
  type: ProjectileType
  owner?: 'player' | 'boss'
}

const VISUALS: Record<ProjectileType, { color: number; w: number; h: number }> = {
  knife:  { color: 0xaaaacc, w: 12, h: 3 },
  musket: { color: 0xddddcc, w: 8,  h: 4 },
  rifle:  { color: 0xff8844, w: 10, h: 3 },
}

export class Projectile {
  readonly sprite: Phaser.GameObjects.Rectangle
  private physBody: Phaser.Physics.Arcade.Body

  readonly damage: number
  readonly isGunshot: boolean
  readonly type: ProjectileType
  readonly owner: 'player' | 'boss'

  private traveled = 0
  private readonly maxRange: number
  private _alive = true

  constructor(scene: Phaser.Scene, cfg: ProjectileConfig) {
    this.damage = cfg.damage
    this.isGunshot = cfg.isGunshot
    this.maxRange = cfg.maxRange
    this.type = cfg.type
    this.owner = cfg.owner ?? 'player'

    const v = VISUALS[cfg.type]
    this.sprite = scene.add.rectangle(cfg.x, cfg.y, v.w, v.h, v.color)
      .setRotation(Math.atan2(cfg.dirY, cfg.dirX))
      .setDepth(5)

    scene.physics.add.existing(this.sprite)
    this.physBody = this.sprite.body as Phaser.Physics.Arcade.Body
    this.physBody.setVelocity(cfg.dirX * cfg.speed, cfg.dirY * cfg.speed)
  }

  get alive() { return this._alive }
  get x() { return this.sprite.x }
  get y() { return this.sprite.y }

  update(delta: number) {
    if (!this._alive) return
    const { x: vx, y: vy } = this.physBody.velocity
    this.traveled += Math.sqrt(vx * vx + vy * vy) * delta / 1000
    if (this.traveled >= this.maxRange) this.destroy()
  }

  destroy() {
    if (!this._alive) return
    this._alive = false
    if (this.sprite.active) this.sprite.destroy()
  }
}
