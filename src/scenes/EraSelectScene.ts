import Phaser from 'phaser'
import { loadGame } from '../storage/api'
import type { Difficulty, EraNumber } from '../types'

const ERA_DATA = [
  {
    era: 1 as EraNumber,
    title: 'Era I',
    subtitle: 'Unification of Nepal',
    years: '1743–1775',
    desc: 'Serve under Prithvi Narayan Shah.\nKhukuri, Shield & Musket.',
    color: 0x8b4513,
  },
  {
    era: 2 as EraNumber,
    title: 'Era II',
    subtitle: 'Anglo-Gurkha Wars',
    years: '1814–1816',
    desc: 'Defend Nepal\'s borders.\nKhukuri & Throwing Knives.',
    color: 0x2f4f2f,
  },
  {
    era: 3 as EraNumber,
    title: 'Era III',
    subtitle: 'Modern Outpost',
    years: 'Contemporary',
    desc: 'Himalayan outpost defence.\nAssault Rifle & Grenades.',
    color: 0x1a1a3a,
  },
]

export class EraSelectScene extends Phaser.Scene {
  private difficulty: Difficulty = 'rifleman'

  constructor() { super('EraSelectScene') }

  init(data: { difficulty?: Difficulty }) {
    this.difficulty = data.difficulty ?? 'rifleman'
  }

  create() {
    const { width, height } = this.scale
    const save = loadGame(0)
    const unlockedEra = save ? save.currentEra : 1

    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a0a)
    bg.fillRect(0, 0, width, height)

    this.add.text(width / 2, 50, 'SELECT ERA', {
      fontSize: '36px', color: '#c8960c', fontStyle: 'bold'
    }).setOrigin(0.5)

    const cardW = 240
    const cardH = 280
    const gap = 40
    const totalW = cardW * 3 + gap * 2
    const startX = (width - totalW) / 2

    ERA_DATA.forEach(({ era, title, subtitle, years, desc, color }, i) => {
      const x = startX + i * (cardW + gap)
      const y = (height - cardH) / 2

      const locked = era > unlockedEra
      const card = this.add.graphics()
      card.fillStyle(locked ? 0x111111 : color, locked ? 0.4 : 0.9)
      card.fillRoundedRect(x, y, cardW, cardH, 8)
      card.lineStyle(2, locked ? 0x333333 : 0xc8960c, 1)
      card.strokeRoundedRect(x, y, cardW, cardH, 8)

      const cx = x + cardW / 2

      this.add.text(cx, y + 30, title, {
        fontSize: '22px', color: locked ? '#444444' : '#c8960c', fontStyle: 'bold'
      }).setOrigin(0.5)

      this.add.text(cx, y + 60, subtitle, {
        fontSize: '14px', color: locked ? '#333333' : '#ffffff', wordWrap: { width: cardW - 20 }
      }).setOrigin(0.5)

      this.add.text(cx, y + 90, years, {
        fontSize: '12px', color: locked ? '#333333' : '#888866'
      }).setOrigin(0.5)

      this.add.text(cx, y + 160, desc, {
        fontSize: '13px', color: locked ? '#333333' : '#cccccc',
        wordWrap: { width: cardW - 20 }, align: 'center'
      }).setOrigin(0.5)

      if (locked) {
        this.add.text(cx, y + 230, '🔒 LOCKED', {
          fontSize: '14px', color: '#444444'
        }).setOrigin(0.5)
      } else {
        const playBtn = this.add.text(cx, y + 230, 'ENTER ERA', {
          fontSize: '15px', color: '#000000', backgroundColor: '#c8960c',
          padding: { x: 14, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })

        playBtn.on('pointerover', () => playBtn.setBackgroundColor('#ffb30f'))
        playBtn.on('pointerout', () => playBtn.setBackgroundColor('#c8960c'))
        playBtn.on('pointerup', () => {
          this.scene.start('MissionBriefScene', {
            era, mission: save?.currentEra === era ? save.currentMission : 1,
            difficulty: this.difficulty
          })
        })
      }
    })

    this.add.text(width / 2, height - 40, '← BACK', {
      fontSize: '16px', color: '#666666'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('MainMenuScene'))
  }
}
