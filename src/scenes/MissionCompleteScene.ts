import Phaser from 'phaser'
import { saveGame, saveScore } from '../storage/api'
import { DIFFICULTY_MULT_RECRUIT, DIFFICULTY_MULT_RIFLEMAN, DIFFICULTY_MULT_LEGEND,
  SCORE_BONUS_NO_DAMAGE, SCORE_BONUS_ALL_LORE, SCORE_BONUS_UNDER_PAR } from '../config/balance'
import type { Difficulty, EraNumber, MissionNumber, MissionResult } from '../types'

export class MissionCompleteScene extends Phaser.Scene {
  private era: EraNumber = 1
  private mission: MissionNumber = 1
  private difficulty: Difficulty = 'rifleman'
  private result!: MissionResult
  private playerName = 'Bir Bahadur'

  constructor() { super('MissionCompleteScene') }

  init(data: { era: EraNumber; mission: MissionNumber; difficulty: Difficulty; result: MissionResult }) {
    this.era = data.era
    this.mission = data.mission
    this.difficulty = data.difficulty
    this.result = data.result
  }

  create() {
    const { width, height } = this.scale
    const cx = width / 2
    const r = this.result

    const diffMult = this.difficulty === 'legend' ? DIFFICULTY_MULT_LEGEND
      : this.difficulty === 'rifleman' ? DIFFICULTY_MULT_RIFLEMAN : DIFFICULTY_MULT_RECRUIT

    let finalScore = r.score * diffMult
    if (r.noHits) finalScore *= SCORE_BONUS_NO_DAMAGE
    if (r.allLore) finalScore += SCORE_BONUS_ALL_LORE
    if (r.underPar) finalScore += SCORE_BONUS_UNDER_PAR
    finalScore = Math.floor(finalScore)

    const stealthRatio = r.kills > 0 ? r.stealthKills / r.kills : 0

    // Auto-save progress
    saveGame(0, {
      currentEra: this.era,
      currentMission: Math.min(this.mission + 1, 4) as MissionNumber,
      weaponMastery: { khukuri: 0, knife: 0, musket: 0, rifle: 0, grenade: 0 },
      loreCollected: [],
      totalKills: r.kills,
      stealthKills: r.stealthKills,
      difficulty: this.difficulty,
      updatedAt: Date.now(),
    })
    saveScore(this.playerName, finalScore, this.era, stealthRatio)

    const bg = this.add.graphics()
    bg.fillStyle(0x001100)
    bg.fillRect(0, 0, width, height)

    this.add.text(cx, 60, 'MISSION COMPLETE', {
      fontSize: '44px', color: '#c8960c', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(cx, 115, 'आयो गोर्खाली!', {
      fontSize: '20px', color: '#446622', fontStyle: 'italic'
    }).setOrigin(0.5)

    const rows: [string, string][] = [
      ['Kills', `${r.kills}`],
      ['Stealth Kills', `${r.stealthKills} (${Math.round(stealthRatio * 100)}%)`],
      ['Base Score', `${r.score.toLocaleString()}`],
      ['Difficulty ×', `${diffMult.toFixed(1)}`],
      r.noHits ? ['No Damage Bonus', `×${SCORE_BONUS_NO_DAMAGE}`] : ['', ''],
      r.allLore ? ['All Lore Found', `+${SCORE_BONUS_ALL_LORE}`] : ['', ''],
      r.underPar ? ['Under Par Time', `+${SCORE_BONUS_UNDER_PAR}`] : ['', ''],
      ['FINAL SCORE', `${finalScore.toLocaleString()}`],
    ].filter(([k]) => k !== '') as [string, string][]

    let rowY = 180
    rows.forEach(([label, value]) => {
      const isFinal = label === 'FINAL SCORE'
      this.add.text(cx - 160, rowY, label, {
        fontSize: isFinal ? '22px' : '17px', color: isFinal ? '#c8960c' : '#ccccaa'
      })
      this.add.text(cx + 160, rowY, value, {
        fontSize: isFinal ? '22px' : '17px', color: isFinal ? '#ffdd00' : '#ffffff'
      }).setOrigin(1, 0)
      rowY += isFinal ? 36 : 28
    })

    const btnStyle = { fontSize: '20px', color: '#000000', backgroundColor: '#c8960c',
      padding: { x: 20, y: 10 } }

    const nextMission = this.mission < 4

    this.addButton(cx, height - 110, nextMission ? 'NEXT MISSION' : 'ERA SELECT', btnStyle, () => {
      if (nextMission) {
        this.scene.start('MissionBriefScene', {
          era: this.era,
          mission: (this.mission + 1) as MissionNumber,
          difficulty: this.difficulty
        })
      } else {
        this.scene.start('EraSelectScene', { difficulty: this.difficulty })
      }
    })

    this.addButton(cx, height - 50, 'LEADERBOARD', {
      ...btnStyle, backgroundColor: '#333300', color: '#c8960c'
    }, () => this.scene.start('LeaderboardScene'))
  }

  private addButton(x: number, y: number, label: string, style: object,
    onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, label, style).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => (btn as Phaser.GameObjects.Text).setAlpha(0.8))
    btn.on('pointerout', () => (btn as Phaser.GameObjects.Text).setAlpha(1))
    btn.on('pointerup', onClick)
    return btn
  }
}
