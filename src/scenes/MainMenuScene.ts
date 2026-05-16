import Phaser from 'phaser'
import { loadGame } from '../storage/api'
import type { Difficulty } from '../types'

export class MainMenuScene extends Phaser.Scene {
  private lang: 'en' | 'ne' = 'en'
  private difficulty: Difficulty = 'rifleman'

  constructor() { super('MainMenuScene') }

  create() {
    const { width, height } = this.scale
    const cx = width / 2

    // Background gradient
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a0a00, 0x1a0a00, 1)
    bg.fillRect(0, 0, width, height)

    // Title
    this.add.text(cx, 100, 'GURKHA LEGENDS', {
      fontSize: '52px', color: '#c8960c', fontStyle: 'bold', fontFamily: 'serif'
    }).setOrigin(0.5)

    this.add.text(cx, 155, 'गोर्खा लिजेन्ड्स', {
      fontSize: '24px', color: '#888866', fontFamily: 'serif'
    }).setOrigin(0.5)

    // Subtitle
    this.add.text(cx, 200, 'आयो गोर्खाली!', {
      fontSize: '16px', color: '#664422', fontStyle: 'italic'
    }).setOrigin(0.5)

    // Difficulty selector
    const diffLabel = this.add.text(cx, 280, this.difficultyText(), {
      fontSize: '18px', color: '#aaaaaa'
    }).setOrigin(0.5)

    const btnStyle = { fontSize: '22px', color: '#ffffff', backgroundColor: '#333300',
      padding: { x: 24, y: 10 } }

    const saved = loadGame(0)
    let nextY = 340

    if (saved) {
      this.addButton(cx, nextY, `CONTINUE  Era ${saved.currentEra}  ·  M${saved.currentMission}`, {
        ...btnStyle, color: '#c8960c', fontSize: '20px',
      }, () => {
        this.scene.start('MissionBriefScene', {
          era: saved.currentEra,
          mission: saved.currentMission,
          difficulty: saved.difficulty,
        })
      })
      nextY += 68
      this.addButton(cx, nextY, 'NEW GAME', {
        ...btnStyle, fontSize: '16px', color: '#888888', backgroundColor: '#1a1a00',
      }, () => {
        this.scene.start('EraSelectScene', { difficulty: this.difficulty })
      })
    } else {
      this.addButton(cx, nextY, 'PLAY', btnStyle, () => {
        this.scene.start('EraSelectScene', { difficulty: this.difficulty })
      })
    }
    nextY += 68

    this.addButton(cx, nextY, 'LEADERBOARD', btnStyle, () => {
      this.scene.start('LeaderboardScene')
    })

    // Language toggle
    const langBtn = this.add.text(width - 80, 30, 'EN | नेपाली', {
      fontSize: '14px', color: '#888888', backgroundColor: '#222200',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    langBtn.on('pointerup', () => {
      this.lang = this.lang === 'en' ? 'ne' : 'en'
      langBtn.setText(this.lang === 'en' ? 'EN | नेपाली' : 'नेपाली | EN')
    })

    // Difficulty cycle
    diffLabel.setInteractive({ useHandCursor: true })
    diffLabel.on('pointerup', () => {
      const cycle: Difficulty[] = ['recruit', 'rifleman', 'legend']
      const idx = cycle.indexOf(this.difficulty)
      this.difficulty = cycle[(idx + 1) % cycle.length]
      diffLabel.setText(this.difficultyText())
    })
  }

  private difficultyText(): string {
    const map: Record<Difficulty, string> = {
      recruit: '< RECRUIT >',
      rifleman: '< RIFLEMAN >',
      legend: '< GURKHA LEGEND >',
    }
    return map[this.difficulty]
  }

  private addButton(x: number, y: number, label: string, style: object,
    onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, label, style).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => btn.setColor('#c8960c'))
    btn.on('pointerout', () => btn.setColor('#ffffff'))
    btn.on('pointerup', onClick)
    return btn
  }
}
