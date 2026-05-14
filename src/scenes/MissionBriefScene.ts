import Phaser from 'phaser'
import type { Difficulty, EraNumber, MissionNumber } from '../types'

const MISSION_DATA: Record<EraNumber, { title: string; objective: string }[]> = {
  1: [
    { title: 'Night of Nuwakot', objective: 'Infiltrate the fort undetected. Eliminate the commander.' },
    { title: 'River Crossing', objective: 'Cross the Trishuli River and defeat the archer garrison.' },
    { title: 'Fort Assault', objective: 'Storm Nuwakot\'s inner walls. Break the enemy\'s heavy guard.' },
    { title: 'Final Siege', objective: 'Lead the final assault. Defeat the EIC Commander.' },
  ],
  2: [
    { title: 'Terai Border', objective: 'Hold the southern border against British advance.' },
    { title: 'Hill Fort Defence', objective: 'Defend the hilltop position for 5 minutes.' },
    { title: 'Sugauli Ambush', objective: 'Ambush the supply convoy on the Sugauli road.' },
    { title: 'Last Stand', objective: 'Defeat the General and secure the treaty ground.' },
  ],
  3: [
    { title: 'Mountain Pass Infiltration', objective: 'Silently clear the pass of enemy scouts.' },
    { title: 'Outpost Defence', objective: 'Defend the outpost until backup arrives.' },
    { title: 'Radio Tower', objective: 'Reach and destroy the enemy communications array.' },
    { title: 'Extraction', objective: 'Defeat the helicopter commander and extract safely.' },
  ],
}

export class MissionBriefScene extends Phaser.Scene {
  private era: EraNumber = 1
  private mission: MissionNumber = 1
  private difficulty: Difficulty = 'rifleman'

  constructor() { super('MissionBriefScene') }

  init(data: { era: EraNumber; mission: MissionNumber; difficulty: Difficulty }) {
    this.era = data.era
    this.mission = data.mission
    this.difficulty = data.difficulty
  }

  create() {
    const { width, height } = this.scale
    const cx = width / 2
    const mdata = MISSION_DATA[this.era][this.mission - 1]

    const bg = this.add.graphics()
    bg.fillStyle(0x050505)
    bg.fillRect(0, 0, width, height)

    // Era banner
    this.add.text(cx, 60, `ERA ${this.era} — MISSION ${this.mission}`, {
      fontSize: '14px', color: '#666644', letterSpacing: 4
    }).setOrigin(0.5)

    // Mission title
    this.add.text(cx, 120, mdata.title, {
      fontSize: '38px', color: '#c8960c', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Divider
    const div = this.add.graphics()
    div.lineStyle(1, 0x443322)
    div.lineBetween(cx - 200, 160, cx + 200, 160)

    // Objective
    this.add.text(cx, 195, 'OBJECTIVE', {
      fontSize: '12px', color: '#664422', letterSpacing: 3
    }).setOrigin(0.5)

    this.add.text(cx, 240, mdata.objective, {
      fontSize: '18px', color: '#ddddcc', wordWrap: { width: 500 }, align: 'center'
    }).setOrigin(0.5)

    // Difficulty
    const diffColors: Record<Difficulty, string> = {
      recruit: '#44aa44', rifleman: '#c8960c', legend: '#cc2222'
    }
    this.add.text(cx, 340, `Difficulty: ${this.difficulty.toUpperCase()}`, {
      fontSize: '16px', color: diffColors[this.difficulty]
    }).setOrigin(0.5)

    // Start button
    const startBtn = this.add.text(cx, 430, 'BEGIN MISSION', {
      fontSize: '24px', color: '#000000', backgroundColor: '#c8960c',
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    startBtn.on('pointerover', () => startBtn.setBackgroundColor('#ffb30f'))
    startBtn.on('pointerout', () => startBtn.setBackgroundColor('#c8960c'))
    startBtn.on('pointerup', () => {
      this.scene.start('GameScene', { era: this.era, mission: this.mission, difficulty: this.difficulty })
    })

    // Back
    this.add.text(cx, height - 40, '← BACK TO ERA SELECT', {
      fontSize: '14px', color: '#555544'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('EraSelectScene', { difficulty: this.difficulty }))
  }
}
