import type { MapDef } from './MapBuilder'
import type { LoreDef } from '../entities/LoreItem'

// Shared wall color for Era 1 — stone/clay Nepali fort aesthetic
const WALL = 0x8b7043
const GROUND = 0x2a1f0a
const TREE = 0x2d5a1b
const BUSH = 0x3a6b22
const WATER = 0x1a3a5c

// ── Helper: hollow building walls with a single door gap ─────────────────────
function building(
  x: number, y: number, w: number, h: number,
  door: 'top' | 'bottom' | 'left' | 'right',
  doorOffset: number, doorSize: number,
  thick = 20,
): MapDef['walls'] {
  const rects: MapDef['walls'] = []
  const T = thick

  switch (door) {
    case 'bottom':
      rects.push(
        { x, y, w, h: T },                                    // top
        { x, y, w: T, h },                                    // left
        { x: x + w - T, y, w: T, h },                        // right
        { x, y: y + h - T, w: doorOffset, h: T },            // bottom-left
        { x: x + doorOffset + doorSize, y: y + h - T, w: w - doorOffset - doorSize - T, h: T }, // bottom-right
      )
      break
    case 'right':
      rects.push(
        { x, y, w, h: T },                                    // top
        { x, y, w: T, h },                                    // left
        { x, y: y + h - T, w, h: T },                        // bottom
        { x: x + w - T, y, w: T, h: doorOffset },            // right-top
        { x: x + w - T, y: y + doorOffset + doorSize, w: T, h: h - doorOffset - doorSize }, // right-bot
      )
      break
    case 'left':
      rects.push(
        { x, y, w, h: T },
        { x: x + w - T, y, w: T, h },
        { x, y: y + h - T, w, h: T },
        { x, y, w: T, h: doorOffset },
        { x, y: y + doorOffset + doorSize, w: T, h: h - doorOffset - doorSize },
      )
      break
    case 'top':
      rects.push(
        { x, y, w: doorOffset, h: T },
        { x: x + doorOffset + doorSize, y, w: w - doorOffset - doorSize, h: T },
        { x, y, w: T, h },
        { x: x + w - T, y, w: T, h },
        { x, y: y + h - T, w, h: T },
      )
      break
  }
  return rects
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSION 1 — Village Outskirts
// Open farmland, scattered homes, patrols between houses
// ─────────────────────────────────────────────────────────────────────────────
export const ERA1_M1: MapDef = {
  width: 1920, height: 1080,
  groundColor: GROUND, wallColor: WALL,

  walls: [
    // Outer border walls (slim)
    { x: 0,    y: 0,    w: 1920, h: 16 },
    { x: 0,    y: 1064, w: 1920, h: 16 },
    { x: 0,    y: 0,    w: 16,   h: 1080 },
    { x: 1904, y: 0,    w: 16,   h: 1080 },

    // House A — top-left area, door facing south
    ...building(220, 120, 200, 160, 'bottom', 70, 48),

    // House B — mid-map, door facing east
    ...building(680, 340, 180, 140, 'right', 40, 48),

    // House C — upper-right, door facing south
    ...building(1260, 140, 200, 160, 'bottom', 60, 52),

    // Rock boulders — cover spots
    { x: 490, y: 500, w: 48, h: 32 },
    { x: 880, y: 240, w: 36, h: 36 },
    { x: 1060, y: 620, w: 52, h: 28 },
    { x: 1580, y: 380, w: 44, h: 44 },
    { x: 380,  y: 820, w: 56, h: 24 },
    { x: 1450, y: 750, w: 40, h: 40 },
  ],

  decor: [
    { x: 140,  y: 700, r: 26, color: TREE },
    { x: 570,  y: 820, r: 22, color: TREE },
    { x: 1110, y: 160, r: 24, color: TREE },
    { x: 1720, y: 680, r: 20, color: BUSH },
    { x: 330,  y: 960, r: 18, color: BUSH },
    { x: 800,  y: 900, r: 24, color: TREE },
    { x: 1850, y: 180, r: 16, color: BUSH },
    // Small water pool
    { x: 960, y: 820, r: 38, color: WATER, alpha: 0.6 },
  ],

  playerStart: { x: 120, y: 540 },
  objectivePos: { x: 1780, y: 540 },

  spawns: [
    { x: 450, y: 220, type: 'soldier',  patrolEnd: { x: 600, y: 220 } },
    { x: 780, y: 580, type: 'soldier',  patrolEnd: { x: 780, y: 720 } },
    { x: 1080, y: 360, type: 'archer',  patrolEnd: { x: 1220, y: 360 } },
    { x: 1540, y: 260, type: 'soldier', patrolEnd: { x: 1700, y: 260 } },
  ],

  lore: [
    { x: 320, y: 205, id: 'e1m1_lore1', title: "Prithvi's Manifesto" },
    { x: 540, y: 515, id: 'e1m1_lore2', title: 'Village Elder\'s Scroll' },
    { x: 1360, y: 230, id: 'e1m1_lore3', title: "Soldier's Prayer" },
  ] satisfies LoreDef[],
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSION 2 — The Garrison Camp
// Military encampment: barracks rows, supply depot, patrol routes
// ─────────────────────────────────────────────────────────────────────────────
export const ERA1_M2: MapDef = {
  width: 1920, height: 1080,
  groundColor: 0x231a07, wallColor: 0x7a6235,

  walls: [
    { x: 0,    y: 0,    w: 1920, h: 16 },
    { x: 0,    y: 1064, w: 1920, h: 16 },
    { x: 0,    y: 0,    w: 16,   h: 1080 },
    { x: 1904, y: 0,    w: 16,   h: 1080 },

    // Barracks row A (top)
    ...building(280, 140, 240, 120, 'bottom', 90, 48),
    ...building(620, 140, 240, 120, 'bottom', 90, 48),

    // Barracks row B (bottom)
    ...building(280, 780, 240, 120, 'top', 90, 48),
    ...building(620, 780, 240, 120, 'top', 90, 48),

    // Central supply depot — large building, door on right
    ...building(900, 400, 260, 200, 'right', 70, 56),

    // Commander post (right side)
    ...building(1420, 320, 220, 200, 'left', 70, 52),

    // Perimeter fence segments creating corridors
    { x: 200,  y: 340, w: 240, h: 20 },  // fence top-left
    { x: 200,  y: 700, w: 240, h: 20 },  // fence bottom-left
    { x: 1200, y: 200, w: 20,  h: 200 }, // fence right column top
    { x: 1200, y: 600, w: 20,  h: 220 }, // fence right column bot
    { x: 1200, y: 440, w: 180, h: 20 },  // fence horizontal mid

    // Rock/crate cover
    { x: 760, y: 360, w: 40, h: 36 },
    { x: 760, y: 620, w: 40, h: 36 },
    { x: 1320, y: 500, w: 44, h: 44 },
    { x: 1700, y: 450, w: 48, h: 32 },
  ],

  decor: [
    { x: 160,  y: 540, r: 20, color: TREE },
    { x: 500,  y: 920, r: 18, color: BUSH },
    { x: 1100, y: 860, r: 22, color: TREE },
    { x: 1760, y: 200, r: 16, color: BUSH },
    { x: 1760, y: 800, r: 20, color: TREE },
    { x: 530,  y: 520, r: 16, color: BUSH },
  ],

  playerStart: { x: 100, y: 540 },
  objectivePos: { x: 1800, y: 540 },

  spawns: [
    { x: 360,  y: 340, type: 'soldier',  patrolEnd: { x: 560,  y: 340 } },
    { x: 360,  y: 700, type: 'soldier',  patrolEnd: { x: 560,  y: 700 } },
    { x: 860,  y: 300, type: 'archer',   patrolEnd: { x: 860,  y: 720 } },
    { x: 1260, y: 340, type: 'rifleman', patrolEnd: { x: 1380, y: 340 } },
    { x: 1600, y: 540, type: 'heavy',    patrolEnd: { x: 1760, y: 540 } },
  ],

  lore: [
    { x: 400, y: 220, id: 'e1m2_lore1', title: 'Garrison Orders' },
    { x: 1010, y: 490, id: 'e1m2_lore2', title: 'Supply Manifest' },
    { x: 1520, y: 420, id: 'e1m2_lore3', title: 'Field Tactics' },
  ] satisfies LoreDef[],
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSION 3 — Fort Walls
// Inside the fortress perimeter — towers, battlements, tight corridors
// ─────────────────────────────────────────────────────────────────────────────
export const ERA1_M3: MapDef = {
  width: 1920, height: 1080,
  groundColor: 0x1e1608, wallColor: 0x6e5c3a,

  walls: [
    { x: 0,    y: 0,    w: 1920, h: 16 },
    { x: 0,    y: 1064, w: 1920, h: 16 },
    { x: 0,    y: 0,    w: 16,   h: 1080 },
    { x: 1904, y: 0,    w: 16,   h: 1080 },

    // Fort outer wall — north
    { x: 80,  y: 80,  w: 1760, h: 32 },
    // Fort outer wall — south
    { x: 80,  y: 960, w: 1760, h: 32 },

    // West tower
    ...building(80, 80, 160, 160, 'right', 55, 48),
    // East tower
    ...building(1680, 80, 160, 160, 'left', 55, 48),
    // SW tower
    ...building(80, 840, 160, 160, 'right', 55, 48),
    // SE tower
    ...building(1680, 840, 160, 160, 'left', 55, 48),

    // Inner dividing wall with two gates
    { x: 840, y: 80,  w: 20, h: 360 },
    { x: 840, y: 520, w: 20, h: 200 },
    { x: 840, y: 800, w: 20, h: 192 },

    // Barracks block (left side interior)
    ...building(280, 300, 200, 140, 'bottom', 70, 48),

    // Armory (right side interior)
    ...building(1380, 280, 200, 160, 'left', 60, 52),

    // Guard post center
    ...building(860, 440, 120, 120, 'bottom', 35, 48),

    // Crate stacks for cover
    { x: 600,  y: 200, w: 48, h: 36 },
    { x: 600,  y: 780, w: 48, h: 36 },
    { x: 1240, y: 500, w: 44, h: 44 },
    { x: 1500, y: 700, w: 40, h: 40 },
  ],

  decor: [
    { x: 480,  y: 800, r: 18, color: BUSH },
    { x: 1400, y: 800, r: 18, color: BUSH },
    { x: 960,  y: 760, r: 16, color: BUSH },
    { x: 480,  y: 220, r: 14, color: BUSH },
    { x: 1440, y: 160, r: 14, color: BUSH },
  ],

  playerStart: { x: 120, y: 540 },
  objectivePos: { x: 1800, y: 540 },

  spawns: [
    { x: 340,  y: 220, type: 'archer',   patrolEnd: { x: 560,  y: 220 } },
    { x: 340,  y: 800, type: 'soldier',  patrolEnd: { x: 560,  y: 800 } },
    { x: 750,  y: 400, type: 'heavy',    patrolEnd: { x: 750,  y: 700 } },
    { x: 1120, y: 300, type: 'rifleman', patrolEnd: { x: 1340, y: 300 } },
    { x: 1560, y: 540, type: 'soldier',  patrolEnd: { x: 1680, y: 540 } },
  ],

  lore: [
    { x: 160, y: 175, id: 'e1m3_lore1', title: 'Guard Rotation Log' },
    { x: 920, y: 495, id: 'e1m3_lore2', title: 'Fort Regulations' },
    { x: 1500, y: 360, id: 'e1m3_lore3', title: 'Armory Records' },
  ] satisfies LoreDef[],
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSION 4 — Commander's Keep
// Final mission: multi-room stronghold, commander at the end
// ─────────────────────────────────────────────────────────────────────────────
export const ERA1_M4: MapDef = {
  width: 1920, height: 1080,
  groundColor: 0x19120a, wallColor: 0x5c4a2a,

  walls: [
    { x: 0,    y: 0,    w: 1920, h: 16 },
    { x: 0,    y: 1064, w: 1920, h: 16 },
    { x: 0,    y: 0,    w: 16,   h: 1080 },
    { x: 1904, y: 0,    w: 16,   h: 1080 },

    // Keep outer walls
    { x: 60,  y: 60,  w: 1800, h: 28 },
    { x: 60,  y: 992, w: 1800, h: 28 },
    { x: 60,  y: 60,  w: 28,   h: 960 },
    { x: 1832, y: 60,  w: 28,  h: 960 },

    // Room 1 (entry hall) — dividing wall with gate
    { x: 480, y: 88,  w: 28, h: 380 },
    { x: 480, y: 560, w: 28, h: 240 },
    { x: 480, y: 860, w: 28, h: 132 },

    // Room 2 (guard hall) — cross-wall
    { x: 900, y: 88,  w: 28, h: 300 },
    { x: 900, y: 460, w: 28, h: 180 },
    { x: 900, y: 720, w: 28, h: 272 },

    // Room 3 (throne antechamber)
    { x: 1340, y: 88,  w: 28, h: 280 },
    { x: 1340, y: 460, w: 28, h: 280 },
    { x: 1340, y: 820, w: 28, h: 172 },

    // Inner structures per room
    // Room 1: pillar cover
    { x: 240, y: 280, w: 36, h: 36 },
    { x: 240, y: 700, w: 36, h: 36 },

    // Room 2: guard posts
    ...building(560, 200, 140, 110, 'bottom', 50, 44),
    ...building(560, 680, 140, 110, 'top',    50, 44),
    { x: 700, y: 480, w: 160, h: 28 }, // barrier

    // Room 3: armory shelves
    { x: 1000, y: 180, w: 120, h: 24 },
    { x: 1000, y: 820, w: 120, h: 24 },
    { x: 1100, y: 440, w: 200, h: 28 },
    { x: 1100, y: 560, w: 200, h: 28 },

    // Commander's chamber (final room)
    ...building(1500, 360, 280, 280, 'left', 100, 56),
    // Throne dias
    { x: 1680, y: 460, w: 60,  h: 120 },
  ],

  decor: [
    { x: 280,  y: 540, r: 14, color: BUSH },
    { x: 740,  y: 540, r: 14, color: BUSH },
    { x: 1180, y: 300, r: 12, color: BUSH },
    { x: 1180, y: 780, r: 12, color: BUSH },
    // Torches (warm orange glow hint)
    { x: 500,  y: 200, r: 8,  color: 0xff8822, alpha: 0.7 },
    { x: 500,  y: 880, r: 8,  color: 0xff8822, alpha: 0.7 },
    { x: 920,  y: 200, r: 8,  color: 0xff8822, alpha: 0.7 },
    { x: 920,  y: 880, r: 8,  color: 0xff8822, alpha: 0.7 },
    { x: 1360, y: 200, r: 8,  color: 0xff8822, alpha: 0.7 },
    { x: 1360, y: 880, r: 8,  color: 0xff8822, alpha: 0.7 },
  ],

  playerStart: { x: 110, y: 540 },
  objectivePos: { x: 1780, y: 500 },

  spawns: [
    { x: 280,  y: 300,  type: 'soldier',   patrolEnd: { x: 280,  y: 700 } },
    { x: 680,  y: 160,  type: 'archer',    patrolEnd: { x: 830,  y: 160 } },
    { x: 680,  y: 900,  type: 'soldier',   patrolEnd: { x: 830,  y: 900 } },
    { x: 1140, y: 540,  type: 'heavy',     patrolEnd: { x: 1300, y: 540 } },
    { x: 1440, y: 300,  type: 'rifleman',  patrolEnd: { x: 1440, y: 760 } },
    { x: 1620, y: 540,  type: 'commander', patrolEnd: { x: 1620, y: 540 } },
  ],

  lore: [
    { x: 240, y: 290, id: 'e1m4_lore1', title: "The Khukuri's Legend" },
    { x: 1060, y: 490, id: 'e1m4_lore2', title: 'Battle Stratagem' },
    { x: 1610, y: 450, id: 'e1m4_lore3', title: "Commander's Codex" },
  ] satisfies LoreDef[],
}

export const ERA1_MAPS: Record<number, MapDef> = {
  1: ERA1_M1,
  2: ERA1_M2,
  3: ERA1_M3,
  4: ERA1_M4,
}
