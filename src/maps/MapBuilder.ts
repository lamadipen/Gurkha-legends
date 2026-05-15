import Phaser from 'phaser'
import type { EnemyType } from '../entities/Enemy'
import type { LoreDef } from '../entities/LoreItem'

export interface WallRect {
  x: number; y: number; w: number; h: number
}

export interface Decor {
  x: number; y: number; r: number; color: number; alpha?: number
}

export interface SpawnDef {
  x: number; y: number; type: EnemyType; patrolEnd?: { x: number; y: number }
}

export interface MapDef {
  width: number
  height: number
  groundColor: number
  wallColor: number
  walls: WallRect[]
  decor: Decor[]
  playerStart: { x: number; y: number }
  objectivePos: { x: number; y: number }
  spawns: SpawnDef[]
  lore: LoreDef[]
}

export interface BuiltMap {
  wallGroup: Phaser.Physics.Arcade.StaticGroup
  playerStart: { x: number; y: number }
  spawns: SpawnDef[]
  lore: LoreDef[]
}

export class MapBuilder {
  static build(scene: Phaser.Scene, def: MapDef): BuiltMap {
    const { width, height, groundColor, wallColor, walls, decor, objectivePos } = def

    // Ground
    const ground = scene.add.graphics()
    ground.fillStyle(groundColor)
    ground.fillRect(0, 0, width, height)
    ground.lineStyle(1, 0x332211, 0.18)
    for (let x = 0; x <= width; x += 32) ground.lineBetween(x, 0, x, height)
    for (let y = 0; y <= height; y += 32) ground.lineBetween(0, y, width, y)

    // Decorations (trees, water — visual only, no physics)
    const decorGfx = scene.add.graphics()
    for (const d of decor) {
      decorGfx.fillStyle(d.color, d.alpha ?? 1)
      decorGfx.fillCircle(d.x, d.y, d.r)
      // Darker inner ring for depth
      decorGfx.fillStyle(0x000000, 0.2)
      decorGfx.fillCircle(d.x, d.y, d.r * 0.5)
    }

    // Wall visuals
    const wallGfx = scene.add.graphics()
    for (const w of walls) {
      wallGfx.fillStyle(wallColor)
      wallGfx.fillRect(w.x, w.y, w.w, w.h)
      // Top highlight
      wallGfx.fillStyle(0xffffff, 0.12)
      wallGfx.fillRect(w.x, w.y, w.w, 4)
      // Shadow bottom
      wallGfx.fillStyle(0x000000, 0.25)
      wallGfx.fillRect(w.x, w.y + w.h - 4, w.w, 4)
    }

    // Static physics bodies for walls (invisible rectangles)
    const wallGroup = scene.physics.add.staticGroup()
    for (const w of walls) {
      wallGroup.add(
        scene.add.rectangle(w.x + w.w / 2, w.y + w.h / 2, w.w, w.h, 0x000000, 0)
      )
    }
    wallGroup.refresh()

    // Objective marker
    const objGfx = scene.add.graphics()
    objGfx.fillStyle(0xc8960c, 0.5)
    objGfx.fillCircle(objectivePos.x, objectivePos.y, 22)
    // Pulsing ring (approximated with nested circles)
    objGfx.lineStyle(2, 0xc8960c, 0.8)
    objGfx.strokeCircle(objectivePos.x, objectivePos.y, 28)
    scene.add.text(objectivePos.x, objectivePos.y - 38, 'OBJECTIVE', {
      fontSize: '11px', color: '#c8960c',
    }).setOrigin(0.5)

    scene.physics.world.setBounds(0, 0, width, height)
    scene.cameras.main.setBounds(0, 0, width, height)

    return { wallGroup, playerStart: def.playerStart, spawns: def.spawns, lore: def.lore }
  }
}
