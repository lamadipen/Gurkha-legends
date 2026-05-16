import Phaser from 'phaser'
import { saveGame, saveScore, loadMastery } from '../storage/api'
import { DIFFICULTY_MULT_RECRUIT, DIFFICULTY_MULT_RIFLEMAN, DIFFICULTY_MULT_LEGEND,
  SCORE_BONUS_NO_DAMAGE, SCORE_BONUS_ALL_LORE, SCORE_BONUS_UNDER_PAR } from '../config/balance'
import type { Difficulty, EraNumber, MissionNumber, MissionResult, WeaponMastery } from '../types'

export class MissionCompleteScene extends Phaser.Scene {
  private era: EraNumber = 1
  private mission: MissionNumber = 1
  private difficulty: Difficulty = 'rifleman'
  private result!: MissionResult
  private finalScore = 0
  private stealthRatio = 0

  // Name input state
  private playerName = 'Bir Bahadur'
  private nameDisplay!: Phaser.GameObjects.Text
  private cursorVisible = true
  private nameActive = true

  constructor() { super('MissionCompleteScene') }

  init(data: { era: EraNumber; mission: MissionNumber; difficulty: Difficulty; result: MissionResult }) {
    this.era = data.era
    this.mission = data.mission
    this.difficulty = data.difficulty
    this.result = data.result
    this.nameActive = true
    this.cursorVisible = true
  }

  create() {
    const { width, height } = this.scale
    const cx = width / 2
    const r = this.result

    const diffMult = this.difficulty === 'legend' ? DIFFICULTY_MULT_LEGEND
      : this.difficulty === 'rifleman' ? DIFFICULTY_MULT_RIFLEMAN : DIFFICULTY_MULT_RECRUIT

    this.finalScore = Math.floor(
      r.score * diffMult
      * (r.noHits ? SCORE_BONUS_NO_DAMAGE : 1)
      + (r.allLore ? SCORE_BONUS_ALL_LORE : 0)
      + (r.underPar ? SCORE_BONUS_UNDER_PAR : 0)
    )
    this.stealthRatio = r.kills > 0 ? r.stealthKills / r.kills : 0

    // Save game progress immediately; score saved on navigate (after name is set)
    const isLastMission = this.mission >= 4
    const saveEra = (isLastMission ? Math.min(this.era + 1, 3) : this.era) as EraNumber
    const saveMission = (isLastMission ? 1 : this.mission + 1) as MissionNumber
    saveGame(0, {
      currentEra: saveEra,
      currentMission: saveMission,
      weaponMastery: { khukuri: 0, knife: 0, musket: 0, rifle: 0, grenade: 0 },
      loreCollected: [],
      totalKills: r.kills,
      stealthKills: r.stealthKills,
      difficulty: this.difficulty,
      updatedAt: Date.now(),
    })

    // ── Background ────────────────────────────────────────────────────────────
    const bg = this.add.graphics()
    bg.fillStyle(0x001100)
    bg.fillRect(0, 0, width, height)
    // Gold accent bar at top
    bg.fillStyle(0xc8960c, 0.8)
    bg.fillRect(0, 0, width, 6)

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add.text(cx, 52, 'MISSION COMPLETE', {
      fontSize: '40px', color: '#c8960c', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(cx, 102, 'आयो गोर्खाली!', {
      fontSize: '18px', color: '#446622', fontStyle: 'italic',
    }).setOrigin(0.5)

    // ── Stats table ───────────────────────────────────────────────────────────
    const rows: [string, string][] = [
      ['Kills',          `${r.kills}`],
      ['Stealth Kills',  `${r.stealthKills} (${Math.round(this.stealthRatio * 100)}%)`],
      ['Time',           r.underPar ? `Under par ⚡` : this.formatTime(r.timeTaken)],
      ['Base Score',     `${r.score.toLocaleString()}`],
      ['Difficulty ×',   `${diffMult.toFixed(1)}`],
      ...(r.noHits  ? [['No Damage', `×${SCORE_BONUS_NO_DAMAGE}`] as [string,string]] : []),
      ...(r.allLore ? [['All Lore',  `+${SCORE_BONUS_ALL_LORE.toLocaleString()}`] as [string,string]] : []),
      ...(r.underPar? [['Under Par', `+${SCORE_BONUS_UNDER_PAR.toLocaleString()}`] as [string,string]] : []),
      ['FINAL SCORE',    `${this.finalScore.toLocaleString()}`],
    ]

    let rowY = 148
    for (const [label, value] of rows) {
      const isFinal = label === 'FINAL SCORE'
      if (isFinal) {
        // Separator line
        const sep = this.add.graphics()
        sep.lineStyle(1, 0x446622, 0.6)
        sep.lineBetween(cx - 170, rowY - 4, cx + 170, rowY - 4)
        rowY += 4
      }
      this.add.text(cx - 170, rowY, label, {
        fontSize: isFinal ? '20px' : '15px',
        color: isFinal ? '#c8960c' : '#aaaaaa',
        fontStyle: isFinal ? 'bold' : 'normal',
      })
      this.add.text(cx + 170, rowY, value, {
        fontSize: isFinal ? '20px' : '15px',
        color: isFinal ? '#ffdd00' : '#ffffff',
        fontStyle: isFinal ? 'bold' : 'normal',
      }).setOrigin(1, 0)
      rowY += isFinal ? 34 : 24
    }

    // ── Mastery gained ────────────────────────────────────────────────────────
    const masteryEntries = Object.entries(r.masteryGained) as [keyof WeaponMastery, number][]
    if (masteryEntries.length > 0) {
      const savedMastery = loadMastery()
      const sep2 = this.add.graphics()
      sep2.lineStyle(1, 0x446622, 0.4)
      sep2.lineBetween(cx - 170, rowY - 2, cx + 170, rowY - 2)
      this.add.text(cx, rowY + 2, 'WEAPONS LEVELED', {
        fontSize: '10px', color: '#888866',
      }).setOrigin(0.5)
      rowY += 20
      for (const [weapon, delta] of masteryEntries) {
        const label = weapon.charAt(0).toUpperCase() + weapon.slice(1)
        const newLv = savedMastery ? savedMastery[weapon] : delta
        this.add.text(cx - 170, rowY, `${label} Mastery`, {
          fontSize: '13px', color: '#c8a84a',
        })
        this.add.text(cx + 170, rowY, `+${delta} → Lv.${newLv}`, {
          fontSize: '13px', color: '#ffdd44', fontStyle: 'bold',
        }).setOrigin(1, 0)
        rowY += 20
      }
    }

    // ── Name input ────────────────────────────────────────────────────────────
    const nameY = height - 168
    this.add.text(cx, nameY, 'LEADERBOARD NAME', {
      fontSize: '11px', color: '#888866',
    }).setOrigin(0.5)

    // Input field background
    const fieldBg = this.add.graphics()
    fieldBg.fillStyle(0x1a1a00, 1)
    fieldBg.fillRoundedRect(cx - 130, nameY + 16, 260, 32, 4)
    fieldBg.lineStyle(1, 0xc8960c, 0.8)
    fieldBg.strokeRoundedRect(cx - 130, nameY + 16, 260, 32, 4)

    this.nameDisplay = this.add.text(cx, nameY + 32, '', {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.updateNameDisplay()

    // Click to focus (already active by default)
    fieldBg.setInteractive(
      new Phaser.Geom.Rectangle(cx - 130, nameY + 16, 260, 32),
      Phaser.Geom.Rectangle.Contains,
    ).on('pointerup', () => {
      this.nameActive = true
      fieldBg.clear()
      fieldBg.fillStyle(0x222200, 1)
      fieldBg.fillRoundedRect(cx - 130, nameY + 16, 260, 32, 4)
      fieldBg.lineStyle(2, 0xffcc00, 1)
      fieldBg.strokeRoundedRect(cx - 130, nameY + 16, 260, 32, 4)
    })

    // Keyboard capture
    this.input.keyboard!.on('keydown', (evt: KeyboardEvent) => {
      if (!this.nameActive) return
      if (evt.key === 'Backspace') {
        this.playerName = this.playerName.slice(0, -1)
      } else if (evt.key === 'Enter') {
        this.nameActive = false
      } else if (evt.key.length === 1 && this.playerName.length < 20) {
        this.playerName += evt.key
      }
      this.updateNameDisplay()
    })

    // Cursor blink
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.nameActive) {
          this.cursorVisible = !this.cursorVisible
          this.updateNameDisplay()
        }
      },
    })

    // ── Navigation buttons ────────────────────────────────────────────────────
    const btnStyle = { fontSize: '18px', color: '#000000', backgroundColor: '#c8960c',
      padding: { x: 18, y: 9 } }

    const nextMission = this.mission < 4

    this.addButton(cx, height - 96, nextMission ? 'NEXT MISSION' : 'ERA SELECT', btnStyle, () => {
      this.commitScore()
      if (nextMission) {
        this.scene.start('MissionBriefScene', {
          era: this.era,
          mission: (this.mission + 1) as MissionNumber,
          difficulty: this.difficulty,
        })
      } else {
        this.scene.start('EraSelectScene', { difficulty: this.difficulty })
      }
    })

    this.addButton(cx, height - 44, 'LEADERBOARD', {
      ...btnStyle, backgroundColor: '#1a1a00', color: '#c8960c',
    }, () => {
      this.commitScore()
      this.scene.start('LeaderboardScene')
    })
  }

  private updateNameDisplay() {
    const cursor = this.nameActive && this.cursorVisible ? '|' : ' '
    this.nameDisplay.setText(this.playerName + cursor)
  }

  private formatTime(ms: number): string {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}m ${s % 60}s`
  }

  private commitScore() {
    saveScore(this.playerName || 'Bir Bahadur', this.finalScore, this.era, this.stealthRatio)
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
