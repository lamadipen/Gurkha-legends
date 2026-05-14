import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  preload() {
    // Minimal assets needed before PreloadScene
  }

  create() {
    this.scene.start('PreloadScene')
  }
}
