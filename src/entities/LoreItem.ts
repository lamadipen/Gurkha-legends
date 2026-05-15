import Phaser from 'phaser'

export interface LoreDef {
  x: number; y: number; id: string; title: string
}

export class LoreItem {
  // Invisible rectangle used as the physics overlap trigger
  readonly trigger: Phaser.GameObjects.Rectangle

  private visual: Phaser.GameObjects.Rectangle
  private glow: Phaser.GameObjects.Rectangle
  private label: Phaser.GameObjects.Text

  private _collected = false
  readonly id: string
  readonly title: string

  constructor(scene: Phaser.Scene, x: number, y: number, id: string, title: string) {
    this.id = id
    this.title = title

    // Outer glow ring
    this.glow = scene.add.rectangle(x, y, 28, 28, 0xf0c040, 0.25)
      .setRotation(Math.PI / 4).setDepth(2)

    // Diamond visual (rotated square)
    this.visual = scene.add.rectangle(x, y, 14, 14, 0xf0c040)
      .setRotation(Math.PI / 4).setDepth(3)

    // Label above
    this.label = scene.add.text(x, y - 18, 'LORE', {
      fontSize: '8px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3)

    // Invisible physics trigger (slightly larger than visual for easy pickup)
    this.trigger = scene.add.rectangle(x, y, 24, 24, 0x000000, 0).setDepth(3)
    scene.physics.add.existing(this.trigger)

    // Pulse animation on visual + glow
    scene.tweens.add({
      targets: [this.visual, this.glow],
      scaleX: 1.4, scaleY: 1.4,
      alpha: { from: 1, to: 0.55 },
      duration: 900,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Slow spin on glow ring
    scene.tweens.add({
      targets: this.glow,
      rotation: this.glow.rotation + Math.PI * 2,
      duration: 4000,
      repeat: -1,
      ease: 'Linear',
    })
  }

  get collected() { return this._collected }

  collect(scene: Phaser.Scene) {
    if (this._collected) return
    this._collected = true

    scene.tweens.killTweensOf(this.visual)
    scene.tweens.killTweensOf(this.glow)

    scene.cameras.main.flash(250, 255, 215, 0, false)

    scene.tweens.add({
      targets: [this.visual, this.glow, this.label, this.trigger],
      alpha: 0,
      scaleX: 2.5, scaleY: 2.5,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.visual.destroy()
        this.glow.destroy()
        this.label.destroy()
        this.trigger.destroy()
      },
    })
  }
}
