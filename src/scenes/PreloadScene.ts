import Phaser from 'phaser'
import { generateCharacterTextures } from '../entities/CharacterTextureFactory'

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene') }

  preload() {
    const { width, height } = this.scale
    const barW = 400
    const barH = 20
    const x = (width - barW) / 2
    const y = height / 2

    const bg = this.add.graphics()
    bg.fillStyle(0x222222)
    bg.fillRect(x - 2, y - 2, barW + 4, barH + 4)

    const bar = this.add.graphics()

    this.load.on('progress', (v: number) => {
      bar.clear()
      bar.fillStyle(0xc8960c)
      bar.fillRect(x, y, barW * v, barH)
    })

    this.add.text(width / 2, y - 40, 'गोर्खा लिजेन्ड्स', {
      fontSize: '28px', color: '#c8960c', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Placeholder graphics — will be replaced with real assets
    this.load.image('pixel_white', this.createPixel(0xffffff))
  }

  private createPixel(color: number): string {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
    ctx.fillRect(0, 0, 1, 1)
    return canvas.toDataURL()
  }

  create() {
    generateCharacterTextures(this)
    this.scene.start('MainMenuScene')
  }
}
