import Phaser from 'phaser'
import type { EnemyType } from '../entities/Enemy'
import type { LoreDef } from '../entities/LoreItem'

export interface WallRect {
  x: number; y: number; w: number; h: number
}

export interface Decor {
  x: number; y: number; r: number; color: number; alpha?: number
  shape?: 'tree' | 'rock' | 'mountain' | 'torch'
}

export interface GroundZone {
  x: number; y: number; w: number; h: number; color: number
}

export interface SpawnDef {
  x: number; y: number; type: EnemyType; patrolEnd?: { x: number; y: number }
}

export interface MapDef {
  width: number
  height: number
  groundColor: number
  wallColor: number
  groundZones?: GroundZone[]
  walls: WallRect[]
  decor: Decor[]
  playerStart: { x: number; y: number }
  objectivePos: { x: number; y: number }
  spawns: SpawnDef[]
  lore: LoreDef[]
  boss?: { x: number; y: number }
}

export interface BuiltMap {
  wallGroup: Phaser.Physics.Arcade.StaticGroup
  playerStart: { x: number; y: number }
  spawns: SpawnDef[]
  lore: LoreDef[]
  boss?: { x: number; y: number }
}

// ── Decor shape helpers ───────────────────────────────────────────────────────

function rockPoints(cx: number, cy: number, r: number) {
  // Deterministic irregular polygon — flattened on Y for top-down perspective
  const offsets: [number, number][] = [
    [0, -1.0], [0.65, -0.75], [1.1, -0.1], [0.85, 0.6],
    [0.1, 0.9], [-0.7, 0.65], [-1.05, 0.1], [-0.7, -0.8],
  ]
  return offsets.map(([dx, dy]) => ({ x: cx + dx * r, y: cy + dy * r * 0.55 }))
}

function mountainPoints(cx: number, cy: number, r: number) {
  return [
    { x: cx - r * 1.8, y: cy + r * 0.3 },
    { x: cx - r * 0.6, y: cy - r * 1.1 },
    { x: cx,           y: cy - r * 1.5 },
    { x: cx + r * 0.6, y: cy - r * 1.1 },
    { x: cx + r * 1.8, y: cy + r * 0.3 },
  ]
}

function snowCapPoints(cx: number, cy: number, r: number) {
  return [
    { x: cx - r * 0.4, y: cy - r * 1.0 },
    { x: cx,           y: cy - r * 1.5 },
    { x: cx + r * 0.4, y: cy - r * 1.0 },
  ]
}

// ── Wall rendering ────────────────────────────────────────────────────────────

function drawWall(g: Phaser.GameObjects.Graphics, w: WallRect, wallColor: number) {
  // Base fill
  g.fillStyle(wallColor)
  g.fillRect(w.x, w.y, w.w, w.h)

  // Stone brick pattern — alternating offset rows
  const bW = 18, bH = 10
  g.fillStyle(0x000000, 0.12)
  for (let row = 0; row * bH < w.h; row++) {
    const offsetX = (row % 2 === 0) ? 0 : bW / 2
    for (let col = -1; col * bW < w.w + bW; col++) {
      const bx = w.x + col * bW + offsetX
      const by = w.y + row * bH
      if (bx > w.x && bx < w.x + w.w - 1) {
        g.fillRect(bx, by, 1, bH)          // vertical mortar
      }
      if (row > 0) {
        g.fillRect(w.x, by, w.w, 1)        // horizontal mortar
      }
    }
  }

  // Top edge highlight (light catching top of wall)
  g.fillStyle(0xffffff, 0.18)
  g.fillRect(w.x, w.y, w.w, 3)

  // Bottom shadow
  g.fillStyle(0x000000, 0.30)
  g.fillRect(w.x, w.y + w.h - 4, w.w, 4)

  // Left edge shadow
  g.fillStyle(0x000000, 0.10)
  g.fillRect(w.x, w.y, 3, w.h)
}

// ── Main builder ──────────────────────────────────────────────────────────────

export class MapBuilder {
  static build(scene: Phaser.Scene, def: MapDef): BuiltMap {
    const { width, height, groundColor, wallColor, walls, decor, objectivePos } = def

    // ── Ground ────────────────────────────────────────────────────────────────
    const ground = scene.add.graphics()
    ground.fillStyle(groundColor)
    ground.fillRect(0, 0, width, height)

    // Zone-tinted terrain areas (jungle / courtyard / stone / keep)
    if (def.groundZones) {
      for (const z of def.groundZones) {
        ground.fillStyle(z.color, 1)
        ground.fillRect(z.x, z.y, z.w, z.h)
      }
    }

    // Subtle tile grid on top of ground
    ground.lineStyle(1, 0x000000, 0.08)
    for (let x = 0; x <= width; x += 32) ground.lineBetween(x, 0, x, height)
    for (let y = 0; y <= height; y += 32) ground.lineBetween(0, y, width, y)

    // ── Decorations ───────────────────────────────────────────────────────────
    const decorGfx = scene.add.graphics()

    for (const d of decor) {
      const alpha = d.alpha ?? 1

      if (d.shape === 'tree') {
        // Trunk
        decorGfx.fillStyle(0x4a2808, 1)
        decorGfx.fillRect(d.x - 3, d.y - 2, 6, Math.round(d.r * 0.55))
        // Drop shadow under canopy
        decorGfx.fillStyle(0x000000, 0.25)
        decorGfx.fillCircle(d.x + 3, d.y - Math.round(d.r * 0.2) + 3, d.r * 0.85)
        // Canopy outer (darker ring)
        decorGfx.fillStyle(darken(d.color, 0.55), alpha)
        decorGfx.fillCircle(d.x, d.y - Math.round(d.r * 0.2), d.r)
        // Canopy main
        decorGfx.fillStyle(d.color, alpha)
        decorGfx.fillCircle(d.x, d.y - Math.round(d.r * 0.2), d.r * 0.82)
        // Highlight spot
        decorGfx.fillStyle(0xffffff, 0.14)
        decorGfx.fillCircle(d.x - d.r * 0.28, d.y - d.r * 0.48, d.r * 0.38)

      } else if (d.shape === 'rock') {
        const pts = rockPoints(d.x, d.y, d.r)
        // Shadow
        const spts = pts.map(p => ({ x: p.x + 2, y: p.y + 3 }))
        decorGfx.fillStyle(0x000000, 0.22)
        decorGfx.fillPoints(spts, true)
        // Rock face
        decorGfx.fillStyle(d.color, alpha)
        decorGfx.fillPoints(pts, true)
        // Top highlight
        decorGfx.fillStyle(0xffffff, 0.18)
        decorGfx.fillPoints(pts.slice(0, 4), true)
        // Crack line
        decorGfx.lineStyle(1, 0x000000, 0.25)
        decorGfx.beginPath()
        decorGfx.moveTo(d.x - d.r * 0.2, d.y - d.r * 0.5)
        decorGfx.lineTo(d.x + d.r * 0.15, d.y + d.r * 0.1)
        decorGfx.strokePath()

      } else if (d.shape === 'mountain') {
        const pts = mountainPoints(d.x, d.y, d.r)
        const snow = snowCapPoints(d.x, d.y, d.r)
        // Shadow side (right face darker)
        const shadowPts = [
          { x: d.x,           y: d.y - d.r * 1.5 },
          { x: d.x + d.r * 0.6, y: d.y - d.r * 1.1 },
          { x: d.x + d.r * 1.8, y: d.y + d.r * 0.3 },
        ]
        decorGfx.fillStyle(darken(d.color, 0.6), alpha)
        decorGfx.fillPoints(pts, true)
        decorGfx.fillStyle(darken(d.color, 0.4), alpha)
        decorGfx.fillPoints(shadowPts, true)
        // Snow cap
        decorGfx.fillStyle(0xe8e8f0, 0.9)
        decorGfx.fillPoints(snow, true)
        // Snow highlight
        decorGfx.fillStyle(0xffffff, 0.6)
        decorGfx.fillPoints([snow[0], snow[1], { x: d.x - d.r * 0.15, y: d.y - d.r * 1.2 }], true)

      } else if (d.shape === 'torch') {
        // Bracket
        decorGfx.fillStyle(0x5a4030, 1)
        decorGfx.fillRect(d.x - 2, d.y, 4, 8)
        // Flame outer glow
        decorGfx.fillStyle(0xff6600, alpha * 0.5)
        decorGfx.fillCircle(d.x, d.y, d.r * 1.6)
        // Flame mid
        decorGfx.fillStyle(0xff9922, alpha * 0.75)
        decorGfx.fillCircle(d.x, d.y, d.r)
        // Flame core
        decorGfx.fillStyle(0xffee88, alpha)
        decorGfx.fillCircle(d.x, d.y, d.r * 0.5)

      } else {
        // Default circle (bush / water / generic)
        decorGfx.fillStyle(d.color, alpha)
        decorGfx.fillCircle(d.x, d.y, d.r)
        decorGfx.fillStyle(0x000000, 0.18)
        decorGfx.fillCircle(d.x + 2, d.y + 2, d.r * 0.55)
        decorGfx.fillStyle(0xffffff, 0.1)
        decorGfx.fillCircle(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35)
      }
    }

    // ── Walls ─────────────────────────────────────────────────────────────────
    const wallGfx = scene.add.graphics()
    for (const w of walls) {
      drawWall(wallGfx, w, wallColor)
    }

    // ── Physics wall bodies ───────────────────────────────────────────────────
    const wallGroup = scene.physics.add.staticGroup()
    for (const w of walls) {
      wallGroup.add(
        scene.add.rectangle(w.x + w.w / 2, w.y + w.h / 2, w.w, w.h, 0x000000, 0)
      )
    }
    // Trees and rocks block movement — add invisible physics bodies
    for (const d of decor) {
      if (d.shape === 'tree') {
        // Trunk footprint — small rect at base of canopy
        wallGroup.add(scene.add.rectangle(d.x, d.y + 2, 8, 10, 0x000000, 0))
      } else if (d.shape === 'rock') {
        // Rock bounding oval approximated as a flattened rect
        wallGroup.add(scene.add.rectangle(d.x, d.y, Math.round(d.r * 1.6), Math.round(d.r * 0.9), 0x000000, 0))
      }
    }
    wallGroup.refresh()

    // ── Objective marker ──────────────────────────────────────────────────────
    const objGfx = scene.add.graphics()
    objGfx.fillStyle(0xc8960c, 0.45)
    objGfx.fillCircle(objectivePos.x, objectivePos.y, 22)
    objGfx.lineStyle(2, 0xc8960c, 0.9)
    objGfx.strokeCircle(objectivePos.x, objectivePos.y, 28)
    scene.add.text(objectivePos.x, objectivePos.y - 38, 'OBJECTIVE', {
      fontSize: '11px', color: '#c8960c',
    }).setOrigin(0.5)

    scene.physics.world.setBounds(0, 0, width, height)
    scene.cameras.main.setBounds(0, 0, width, height)

    return { wallGroup, playerStart: def.playerStart, spawns: def.spawns, lore: def.lore, boss: def.boss }
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function darken(hex: number, factor: number): number {
  const r = Math.round(((hex >> 16) & 0xff) * factor)
  const g = Math.round(((hex >>  8) & 0xff) * factor)
  const b = Math.round(( hex        & 0xff) * factor)
  return (r << 16) | (g << 8) | b
}
