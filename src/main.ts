import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { EraSelectScene } from './scenes/EraSelectScene'
import { MissionBriefScene } from './scenes/MissionBriefScene'
import { GameScene } from './scenes/GameScene'
import { MissionCompleteScene } from './scenes/MissionCompleteScene'
import { GameOverScene } from './scenes/GameOverScene'
import { LeaderboardScene } from './scenes/LeaderboardScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    EraSelectScene,
    MissionBriefScene,
    GameScene,
    MissionCompleteScene,
    GameOverScene,
    LeaderboardScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

new Phaser.Game(config)
