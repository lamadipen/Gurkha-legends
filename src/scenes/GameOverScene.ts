import Phaser from 'phaser'
import type { Difficulty, EraNumber, MissionNumber } from '../types'

export class GameOverScene extends Phaser.Scene {
  private era: EraNumber = 1
  private mission: MissionNumber = 1
  private difficulty: Difficulty = 'rifleman'

  constructor() { super('GameOverScene') }

  init(data: { era: EraNumber; mission: MissionNumber; difficulty: Difficulty }) {
    this.era = data.era
    this.mission = data.mission
    this.difficulty = data.difficulty
  }

  create() {
    const { width, height } = this.scale
    const cx = width / 2

    const bg = this.add.graphics()
    bg.fillStyle(0x110000)
    bg.fillRect(0, 0, width, height)

    this.add.text(cx, 150, 'MISSION FAILED', {
      fontSize: '48px', color: '#cc2222', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(cx, 220, 'The warrior falls, but the spirit endures.', {
      fontSize: '18px', color: '#886644', fontStyle: 'italic'
    }).setOrigin(0.5)

    const btnStyle = { fontSize: '22px', color: '#ffffff', backgroundColor: '#333300',
      padding: { x: 24, y: 10 } }

    this.addButton(cx, 340, 'RETRY MISSION', btnStyle, () => {
      this.scene.start('MissionBriefScene', { era: this.era, mission: this.mission, difficulty: this.difficulty })
    })

    this.addButton(cx, 410, 'ERA SELECT', btnStyle, () => {
      this.scene.start('EraSelectScene', { difficulty: this.difficulty })
    })

    this.addButton(cx, 480, 'MAIN MENU', btnStyle, () => {
      this.scene.start('MainMenuScene')
    })
  }

  private addButton(x: number, y: number, label: string, style: object,
    onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, label, style).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => (btn as Phaser.GameObjects.Text).setColor('#c8960c'))
    btn.on('pointerout', () => (btn as Phaser.GameObjects.Text).setColor('#ffffff'))
    btn.on('pointerup', onClick)
    return btn
  }
}
