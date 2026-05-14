import Phaser from 'phaser'
import { getLeaderboard } from '../storage/api'

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('LeaderboardScene') }

  create() {
    const { width, height } = this.scale
    const cx = width / 2

    const bg = this.add.graphics()
    bg.fillStyle(0x050505)
    bg.fillRect(0, 0, width, height)

    this.add.text(cx, 50, 'LEADERBOARD', {
      fontSize: '38px', color: '#c8960c', fontStyle: 'bold'
    }).setOrigin(0.5)

    const board = getLeaderboard().slice(0, 10)

    if (board.length === 0) {
      this.add.text(cx, height / 2, 'No scores yet.\nComplete a mission to appear here.', {
        fontSize: '20px', color: '#555544', align: 'center'
      }).setOrigin(0.5)
    } else {
      const headerY = 120
      this.add.text(60, headerY, '#', { fontSize: '14px', color: '#666644' })
      this.add.text(100, headerY, 'NAME', { fontSize: '14px', color: '#666644' })
      this.add.text(cx, headerY, 'SCORE', { fontSize: '14px', color: '#666644' }).setOrigin(0.5)
      this.add.text(cx + 160, headerY, 'ERA', { fontSize: '14px', color: '#666644' })
      this.add.text(width - 80, headerY, 'STEALTH%', { fontSize: '14px', color: '#666644' }).setOrigin(1, 0)

      board.forEach((entry, i) => {
        const y = 155 + i * 32
        const color = i === 0 ? '#ffdd00' : i < 3 ? '#c8960c' : '#aaaaaa'
        this.add.text(60, y, `${i + 1}.`, { fontSize: '16px', color })
        this.add.text(100, y, entry.name, { fontSize: '16px', color })
        this.add.text(cx, y, entry.score.toLocaleString(), { fontSize: '16px', color }).setOrigin(0.5)
        this.add.text(cx + 160, y, `Era ${entry.era}`, { fontSize: '16px', color })
        this.add.text(width - 80, y, `${Math.round(entry.stealthRatio * 100)}%`,
          { fontSize: '16px', color }).setOrigin(1, 0)
      })
    }

    this.add.text(cx, height - 40, '← MAIN MENU', {
      fontSize: '16px', color: '#555544'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('MainMenuScene'))
  }
}
