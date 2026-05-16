import type { MapDef } from './MapBuilder'
import type { LoreDef } from '../entities/LoreItem'

// Shared wall color for Era 1 — stone/clay Nepali fort aesthetic
const WALL = 0x8b7043
const TREE = 0x3a8c1a   // brighter green — visible against dark ground
const BUSH = 0x5aaa22   // lighter yellow-green
const WATER = 0x2060c0  // bright blue

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
// MISSION 1 — Assault on Nuwakot Fort
// Linear fort assault: jungle mountain approach → outer stone wall →
// open courtyard → inner wall → commander's keep.
// 4096×760 — player pushes left-to-right through four distinct biomes.
// ─────────────────────────────────────────────────────────────────────────────
const ROCK  = 0x887868
const STONE = 0x9a8a72
const MTN   = 0x706050

export const ERA1_M1: MapDef = {
  width: 4096, height: 760,
  groundColor: 0x1a1208,  // very dark base — zones paint over this
  wallColor: WALL,

  // ── Ground zones — each zone has its own terrain colour ──────────────────
  groundZones: [
    // Zone 1: jungle floor — earthy moss green
    { x:    0, y: 0, w:  700, h: 760, color: 0x1a2e0a },
    // Zone 2: outer courtyard — dry sandy dirt
    { x:  700, y: 0, w: 1000, h: 760, color: 0x3a2a10 },
    // Zone 3: inner courtyard — dark stone flags
    { x: 1700, y: 0, w: 1180, h: 760, color: 0x252018 },
    // Zone 4: commander's keep — cold dark stone
    { x: 2880, y: 0, w: 1216, h: 760, color: 0x181614 },
  ],

  walls: [
    // ── Border ───────────────────────────────────────────────────────────────
    { x: 0,    y: 0,   w: 4096, h: 20 },
    { x: 0,    y: 740, w: 4096, h: 20 },
    { x: 0,    y: 0,   w: 20,   h: 760 },
    { x: 4076, y: 0,   w: 20,   h: 760 },

    // ── ZONE 1: Jungle/Mountain Approach (x: 20–680) ─────────────────────────
    // Rock outcrops that serve as cover
    { x: 170, y: 190, w: 52, h: 30 },
    { x: 350, y: 155, w: 38, h: 38 },
    { x: 420, y: 505, w: 56, h: 26 },
    { x: 540, y: 338, w: 42, h: 42 },
    { x: 620, y: 215, w: 34, h: 34 },
    { x: 598, y: 495, w: 46, h: 30 },

    // ── OUTER FORT WALL (x: 660–740) — gate centred y:310–430 ────────────────
    { x: 640, y:  20, w: 80, h: 120 },  // NW bastion
    { x: 640, y: 620, w: 80, h: 120 },  // SW bastion
    { x: 680, y: 140, w: 40, h: 170 },  // top segment
    { x: 680, y: 430, w: 40, h: 190 },  // bottom segment

    // ── ZONE 2: Outer Courtyard (x: 720–1680) ────────────────────────────────
    ...building(760,  50, 200, 150, 'bottom', 80, 52),  // guard house top
    ...building(760, 540, 200, 150, 'top',    80, 52),  // guard house bottom
    { x: 1020, y: 198, w: 44, h: 32 },   // supply crates top
    { x: 1020, y: 530, w: 44, h: 32 },   // supply crates bottom
    { x: 1280, y: 320, w: 180, h: 24 },  // stone barrier
    { x: 1460, y: 178, w: 42, h: 42 },   // boulder top
    { x: 1460, y: 540, w: 42, h: 42 },   // boulder bottom

    // ── MIDDLE FORT WALL (x: 1680–1720) — offset gate y:260–360 ─────────────
    { x: 1660, y:  20, w: 80, h: 120 },  // NE bastion
    { x: 1660, y: 620, w: 80, h: 120 },  // SE bastion
    { x: 1680, y: 140, w: 40, h: 120 },  // top segment
    { x: 1680, y: 360, w: 40, h: 380 },  // bottom segment (longer — gate is high)

    // ── ZONE 3: Inner Courtyard (x: 1720–2860) ───────────────────────────────
    ...building(1760,  70, 240, 150, 'right', 55, 52),  // barracks top
    ...building(1760, 540, 240, 150, 'top',   55, 52),  // barracks bottom
    { x: 2080, y: 305, w: 200, h: 24 },                // stone divider
    ...building(2220, 160, 180, 130, 'bottom', 55, 44),
    ...building(2220, 470, 180, 130, 'top',    55, 44),
    { x: 2500, y: 160, w: 42, h: 42 },
    { x: 2500, y: 558, w: 42, h: 42 },
    { x: 2680, y: 300, w: 52, h: 28 },
    { x: 2680, y: 432, w: 52, h: 28 },

    // ── KEEP WALL (x: 2860–2940) — narrow gate y:330–430 ────────────────────
    { x: 2820, y:  20, w: 120, h: 100 }, // NW bastion (thick)
    { x: 2820, y: 640, w: 120, h: 100 }, // SW bastion
    { x: 2860, y: 120, w: 60,  h: 210 }, // top
    { x: 2860, y: 430, w: 60,  h: 210 }, // bottom

    // ── ZONE 4: Commander's Keep (x: 2940–4076) ──────────────────────────────
    { x: 3060, y: 185, w: 36, h: 36 },   // stone pillars — pairs
    { x: 3060, y: 539, w: 36, h: 36 },
    { x: 3300, y: 185, w: 36, h: 36 },
    { x: 3300, y: 539, w: 36, h: 36 },
    { x: 3540, y: 185, w: 36, h: 36 },
    { x: 3540, y: 539, w: 36, h: 36 },
    ...building(3680, 255, 310, 250, 'left', 95, 60),  // commander's chamber
    { x: 3880, y: 335, w: 70,  h: 105 }, // throne platform
  ],

  decor: [
    // ── Zone 1: dense jungle with mountain backdrop ───────────────────────────
    // Mountains along top and bottom borders — sense of being in a valley
    { x:  80, y:  20, r: 55, color: MTN,  shape: 'mountain' },
    { x: 240, y:  20, r: 48, color: MTN,  shape: 'mountain' },
    { x: 420, y:  20, r: 42, color: MTN,  shape: 'mountain' },
    { x: 580, y:  20, r: 38, color: MTN,  shape: 'mountain' },
    { x:  80, y: 740, r: 52, color: MTN,  shape: 'mountain' },
    { x: 250, y: 740, r: 46, color: MTN,  shape: 'mountain' },
    { x: 430, y: 740, r: 40, color: MTN,  shape: 'mountain' },
    { x: 600, y: 740, r: 36, color: MTN,  shape: 'mountain' },

    // Dense jungle trees
    { x: 100, y: 140, r: 30, color: TREE, shape: 'tree' },
    { x: 160, y: 630, r: 28, color: TREE, shape: 'tree' },
    { x: 280, y: 120, r: 24, color: TREE, shape: 'tree' },
    { x: 310, y: 640, r: 24, color: TREE, shape: 'tree' },
    { x: 460, y: 130, r: 20, color: BUSH, shape: 'tree' },
    { x: 490, y: 615, r: 18, color: BUSH, shape: 'tree' },
    { x: 600, y: 380, r: 16, color: BUSH, shape: 'tree' },

    // Rock outcrops matching wall rocks (visual on top of physics rectangles)
    { x: 196, y: 205, r: 20, color: ROCK, shape: 'rock' },
    { x: 369, y: 174, r: 16, color: ROCK, shape: 'rock' },
    { x: 448, y: 518, r: 18, color: ROCK, shape: 'rock' },
    { x: 561, y: 359, r: 17, color: ROCK, shape: 'rock' },

    // Jungle stream / pond
    { x: 240, y: 390, r: 38, color: WATER, alpha: 0.85 },

    // ── Zone 2: sparse open courtyard ─────────────────────────────────────────
    { x: 960,  y: 375, r: 14, color: BUSH, shape: 'tree' },
    { x: 1560, y: 375, r: 12, color: BUSH, shape: 'tree' },
    // Courtyard rocks
    { x: 1040, y: 214, r: 14, color: STONE, shape: 'rock' },
    { x: 1040, y: 546, r: 14, color: STONE, shape: 'rock' },
    { x: 1478, y: 199, r: 16, color: STONE, shape: 'rock' },
    { x: 1478, y: 559, r: 16, color: STONE, shape: 'rock' },

    // ── Zone 3: inner yard ────────────────────────────────────────────────────
    { x: 2060, y:  88, r: 12, color: BUSH, shape: 'tree' },
    { x: 2060, y: 660, r: 12, color: BUSH, shape: 'tree' },
    { x: 2740, y: 375, r: 10, color: BUSH, shape: 'tree' },

    // ── Zone 4: torch-lit keep hall ───────────────────────────────────────────
    { x: 2970, y:  60, r: 10, color: 0xff8822, shape: 'torch' },
    { x: 2970, y: 700, r: 10, color: 0xff8822, shape: 'torch' },
    { x: 3180, y:  60, r:  9, color: 0xff9933, shape: 'torch' },
    { x: 3180, y: 700, r:  9, color: 0xff9933, shape: 'torch' },
    { x: 3420, y:  60, r:  9, color: 0xff8822, shape: 'torch' },
    { x: 3420, y: 700, r:  9, color: 0xff8822, shape: 'torch' },
    { x: 3700, y: 278, r:  8, color: 0xff9922, shape: 'torch' },
    { x: 3700, y: 482, r:  8, color: 0xff9922, shape: 'torch' },
  ],

  playerStart: { x: 80, y: 380 },
  objectivePos: { x: 3860, y: 385 },

  spawns: [
    // Zone 1 — jungle sentries
    { x: 310, y: 240, type: 'soldier', patrolEnd: { x: 570, y: 240 } },
    { x: 310, y: 520, type: 'soldier', patrolEnd: { x: 570, y: 520 } },
    // Zone 2 — courtyard defenders
    { x:  940, y: 180, type: 'archer',  patrolEnd: { x: 1120, y: 180 } },
    { x: 1200, y: 380, type: 'soldier', patrolEnd: { x: 1520, y: 380 } },
    { x:  940, y: 580, type: 'soldier', patrolEnd: { x: 1120, y: 580 } },
    // Zone 3 — heavy inner resistance
    { x: 2000, y: 380, type: 'heavy',    patrolEnd: { x: 2200, y: 380 } },
    { x: 2480, y: 200, type: 'rifleman', patrolEnd: { x: 2720, y: 200 } },
    { x: 2480, y: 560, type: 'archer',   patrolEnd: { x: 2720, y: 560 } },
    // Zone 4 — keep elite guards
    { x: 3120, y: 360, type: 'soldier', patrolEnd: { x: 3460, y: 360 } },
    { x: 3520, y: 380, type: 'heavy',   patrolEnd: { x: 3650, y: 380 } },
  ],

  lore: [
    { x: 430,  y: 380, id: 'e1m1_lore1', title: "Prithvi's Battle Orders"  },
    { x: 1580, y: 380, id: 'e1m1_lore2', title: "Fallen Soldier's Letter"  },
    { x: 2820, y: 380, id: 'e1m1_lore3', title: "Commander's War Decree"   },
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
    { x: 280,  y: 300,  type: 'soldier',  patrolEnd: { x: 280,  y: 700 } },
    { x: 680,  y: 160,  type: 'archer',   patrolEnd: { x: 830,  y: 160 } },
    { x: 680,  y: 900,  type: 'soldier',  patrolEnd: { x: 830,  y: 900 } },
    { x: 1140, y: 540,  type: 'heavy',    patrolEnd: { x: 1300, y: 540 } },
    { x: 1440, y: 300,  type: 'rifleman', patrolEnd: { x: 1440, y: 760 } },
  ],

  lore: [
    { x: 240, y: 290, id: 'e1m4_lore1', title: "The Khukuri's Legend" },
    { x: 1060, y: 490, id: 'e1m4_lore2', title: 'Battle Stratagem' },
    { x: 1610, y: 450, id: 'e1m4_lore3', title: "Commander's Codex" },
  ] satisfies LoreDef[],

  boss: { x: 1750, y: 500 },
}

export const ERA1_MAPS: Record<number, MapDef> = {
  1: ERA1_M1,
  2: ERA1_M2,
  3: ERA1_M3,
  4: ERA1_M4,
}
