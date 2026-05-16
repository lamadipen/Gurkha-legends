import type { MapDef } from './MapBuilder'
import type { LoreDef } from '../entities/LoreItem'

// Era 3 palette — Modern Nepali Army outpost defense
// Concrete bunkers, military bases, mountain checkpoints
const CONCRETE = 0x5e5e5e  // grey concrete
const METAL    = 0x3a4a55  // dark metal structures
const SANDBAG  = 0x8b7a4a  // sandbag barriers
const TREE     = 0x2e7a1a
const BUSH     = 0x4e9a14
const DIRT     = 0x6b5a3a  // packed dirt paths

// Hollow building helper
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
        { x, y, w, h: T },
        { x, y, w: T, h },
        { x: x + w - T, y, w: T, h },
        { x, y: y + h - T, w: doorOffset, h: T },
        { x: x + doorOffset + doorSize, y: y + h - T, w: w - doorOffset - doorSize - T, h: T },
      ); break
    case 'right':
      rects.push(
        { x, y, w, h: T },
        { x, y, w: T, h },
        { x, y: y + h - T, w, h: T },
        { x: x + w - T, y, w: T, h: doorOffset },
        { x: x + w - T, y: y + doorOffset + doorSize, w: T, h: h - doorOffset - doorSize },
      ); break
    case 'left':
      rects.push(
        { x, y, w, h: T },
        { x: x + w - T, y, w: T, h },
        { x, y: y + h - T, w, h: T },
        { x, y, w: T, h: doorOffset },
        { x, y: y + doorOffset + doorSize, w: T, h: h - doorOffset - doorSize },
      ); break
    case 'top':
      rects.push(
        { x, y, w: doorOffset, h: T },
        { x: x + doorOffset + doorSize, y, w: w - doorOffset - doorSize, h: T },
        { x, y, w: T, h },
        { x: x + w - T, y, w: T, h },
        { x, y: y + h - T, w, h: T },
      ); break
  }
  return rects
}

// ─────────────────────────────────────────────────────────────────────────────
// ERA 3 MISSION 1 — Mountain Checkpoint Alpha
// High-altitude Nepali army checkpoint under assault by armed insurgents.
// Linear checkpoint — three fortified lines before the command bunker.
// ─────────────────────────────────────────────────────────────────────────────
export const ERA3_M1: MapDef = {
  width: 1920, height: 1080,
  groundColor: 0x2a2218,
  wallColor: CONCRETE,

  groundZones: [
    { x:    0, y: 0, w:  400, h: 1080, color: 0x1a2810 }, // approach — scrub
    { x:  400, y: 0, w: 1520, h: 1080, color: 0x201a10 }, // checkpoint zone
  ],

  walls: [
    { x: 0,    y: 0,    w: 1920, h: 20 },
    { x: 0,    y: 1060, w: 1920, h: 20 },
    { x: 0,    y: 0,    w: 20,   h: 1080 },
    { x: 1900, y: 0,    w: 20,   h: 1080 },

    // Approach — rocky terrain
    { x: 120, y: 220, w: 56, h: 36 },
    { x: 240, y: 780, w: 52, h: 36 },
    { x: 320, y: 400, w: 44, h: 44 },

    // Checkpoint Line 1 — sandbag wall with gaps
    { x: 440, y:  20, w: 24, h: 340 },
    { x: 440, y: 460, w: 24, h: 180 },
    { x: 440, y: 740, w: 24, h: 320 },
    // Sandbag bunkers flanking line 1
    { x: 460, y: 140, w: 120, h: 28 },
    { x: 460, y: 880, w: 120, h: 28 },

    // Checkpoint Line 2 — concrete barriers
    { x: 800, y:  20, w: 24, h: 420 },
    { x: 800, y: 620, w: 24, h: 440 },
    { x: 820, y: 200, w: 160, h: 20 },
    { x: 820, y: 840, w: 160, h: 20 },
    // Guard post (concrete bunker)
    ...building(900, 430, 120, 120, 'bottom', 40, 44, 16),

    // Checkpoint Line 3 — fortified wall
    { x: 1200, y:  20, w: 24, h: 380 },
    { x: 1200, y: 560, w: 24, h: 500 },
    // Sniper tower
    { x: 1224, y: 180, w: 80, h: 80 },

    // Command bunker (far right)
    ...building(1440, 340, 300, 360, 'left', 120, 56),
    { x: 1640, y: 440, w: 80, h: 160 }, // bunker inner block
    { x: 1800, y: 200, w: 24, h: 680 }, // rear wall
  ],

  decor: [
    // Approach scrub
    { x: 100, y: 160, r: 20, color: BUSH, shape: 'tree' },
    { x: 100, y: 920, r: 18, color: BUSH, shape: 'tree' },
    { x: 280, y: 200, r: 16, color: BUSH, shape: 'tree' },
    { x: 280, y: 860, r: 16, color: BUSH, shape: 'tree' },
    // Rocks
    { x: 144, y: 238, r: 16, color: DIRT, shape: 'rock' },
    { x: 264, y: 798, r: 15, color: DIRT, shape: 'rock' },
    { x: 342, y: 422, r: 14, color: DIRT, shape: 'rock' },
    // Military lights (torches used as floodlight stand-ins)
    { x: 460, y: 154, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 460, y: 896, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 910, y: 445, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1450, y: 355, r: 8, color: 0xffffff, shape: 'torch' },
    { x: 1450, y: 725, r: 8, color: 0xffffff, shape: 'torch' },
  ],

  playerStart: { x: 80, y: 540 },
  objectivePos: { x: 1760, y: 520 },

  spawns: [
    { x: 240,  y: 380, type: 'soldier',  patrolEnd: { x: 400,  y: 380 } },
    { x: 240,  y: 700, type: 'soldier',  patrolEnd: { x: 400,  y: 700 } },
    { x: 600,  y: 300, type: 'rifleman', patrolEnd: { x: 780,  y: 300 } },
    { x: 600,  y: 780, type: 'archer',   patrolEnd: { x: 780,  y: 780 } },
    { x: 960,  y: 480, type: 'heavy',    patrolEnd: { x: 960,  y: 600 } },
    { x: 1300, y: 300, type: 'rifleman', patrolEnd: { x: 1400, y: 300 } },
    { x: 1560, y: 460, type: 'soldier',  patrolEnd: { x: 1560, y: 620 } },
  ],

  lore: [
    { x: 380, y: 440, id: 'e3m1_lore1', title: 'Checkpoint Alpha Standing Orders' },
    { x: 960, y: 490, id: 'e3m1_lore2', title: 'Insurgent Intel Report' },
    { x: 1540, y: 420, id: 'e3m1_lore3', title: 'Modern Gurkha Regiment History' },
  ] satisfies LoreDef[],
}

// ─────────────────────────────────────────────────────────────────────────────
// ERA 3 MISSION 2 — Valley Village Defense
// Protect civilians in a mountain village from an armed assault.
// Mix of civilian buildings and military field positions.
// ─────────────────────────────────────────────────────────────────────────────
export const ERA3_M2: MapDef = {
  width: 1920, height: 1080,
  groundColor: 0x1e1a10,
  wallColor: 0x6a5a40,

  walls: [
    { x: 0,    y: 0,    w: 1920, h: 20 },
    { x: 0,    y: 1060, w: 1920, h: 20 },
    { x: 0,    y: 0,    w: 20,   h: 1080 },
    { x: 1900, y: 0,    w: 20,   h: 1080 },

    // Village perimeter — low stone walls
    { x: 100, y: 180, w: 400, h: 20 },   // north field wall
    { x: 100, y: 880, w: 400, h: 20 },   // south field wall

    // Civilian houses — western village cluster
    ...building(180, 260, 160, 120, 'right', 40, 44, 16),
    ...building(180, 700, 160, 120, 'right', 40, 44, 16),
    ...building(380, 440, 160, 160, 'right', 55, 44, 16),

    // Irrigation channel (stone walls)
    { x: 580, y: 380, w: 20, h: 300 },

    // Central houses — village square
    ...building(680, 200, 180, 130, 'bottom', 60, 44, 16),
    ...building(680, 750, 180, 130, 'top',    60, 44, 16),
    ...building(900, 440, 140, 160, 'right',  50, 44, 16),

    // Market stalls / cover
    { x: 800, y: 320, w: 80, h: 20 },
    { x: 800, y: 740, w: 80, h: 20 },

    // Military field positions (east)
    { x: 1100, y: 180, w: 180, h: 20 },  // sandbag line N
    { x: 1100, y: 880, w: 180, h: 20 },  // sandbag line S
    ...building(1100, 380, 140, 280, 'left', 100, 44, 16), // aid post

    // Eastern edge — enemy staging
    { x: 1400, y:  20, w: 20, h: 380 },
    { x: 1400, y: 680, w: 20, h: 380 },
    ...building(1480, 200, 220, 160, 'left', 60, 52),
    ...building(1480, 720, 220, 160, 'left', 60, 52),
    { x: 1740, y: 380, w: 20, h: 320 },
    { x: 1760, y: 440, w: 100, h: 200 },  // enemy command post
  ],

  decor: [
    // Village trees and gardens
    { x: 120, y: 540, r: 22, color: TREE, shape: 'tree' },
    { x: 520, y: 160, r: 20, color: TREE, shape: 'tree' },
    { x: 520, y: 920, r: 20, color: TREE, shape: 'tree' },
    { x: 820, y: 540, r: 18, color: BUSH, shape: 'tree' },
    { x: 1060, y: 540, r: 16, color: BUSH, shape: 'tree' },
    { x: 1680, y: 540, r: 14, color: BUSH, shape: 'tree' },
    // Torches — village lights
    { x: 190, y: 275, r: 6, color: 0xff9922, shape: 'torch' },
    { x: 190, y: 715, r: 6, color: 0xff9922, shape: 'torch' },
    { x: 690, y: 215, r: 6, color: 0xff9922, shape: 'torch' },
    { x: 690, y: 765, r: 6, color: 0xff9922, shape: 'torch' },
    // Military lights
    { x: 1110, y: 195, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1110, y: 895, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1490, y: 215, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1490, y: 735, r: 7, color: 0xffffff, shape: 'torch' },
  ],

  playerStart: { x: 80, y: 540 },
  objectivePos: { x: 1800, y: 540 },

  spawns: [
    { x: 600,  y: 340, type: 'soldier',  patrolEnd: { x: 680,  y: 540 } },
    { x: 600,  y: 740, type: 'soldier',  patrolEnd: { x: 680,  y: 540 } },
    { x: 960,  y: 300, type: 'archer',   patrolEnd: { x: 1080, y: 300 } },
    { x: 960,  y: 780, type: 'archer',   patrolEnd: { x: 1080, y: 780 } },
    { x: 1200, y: 540, type: 'heavy',    patrolEnd: { x: 1360, y: 540 } },
    { x: 1560, y: 300, type: 'rifleman', patrolEnd: { x: 1680, y: 300 } },
    { x: 1560, y: 780, type: 'rifleman', patrolEnd: { x: 1680, y: 780 } },
    { x: 1790, y: 490, type: 'soldier',  patrolEnd: { x: 1790, y: 590 } },
  ],

  lore: [
    { x: 400, y: 540, id: 'e3m2_lore1', title: 'Village Elder\'s Testimony' },
    { x: 1000, y: 490, id: 'e3m2_lore2', title: 'Rules of Engagement' },
    { x: 1620, y: 440, id: 'e3m2_lore3', title: 'Gurkha Courage Under Fire' },
  ] satisfies LoreDef[],
}

// ─────────────────────────────────────────────────────────────────────────────
// ERA 3 MISSION 3 — Communications Tower Sabotage
// Destroy the enemy comms tower deep in a fortified complex.
// Wider map — three zones of increasing fortification.
// ─────────────────────────────────────────────────────────────────────────────
export const ERA3_M3: MapDef = {
  width: 2560, height: 1080,
  groundColor: 0x1c1810,
  wallColor: CONCRETE,

  groundZones: [
    { x:    0, y: 0, w:  600, h: 1080, color: 0x1a2810 }, // jungle
    { x:  600, y: 0, w:  800, h: 1080, color: 0x201c10 }, // cleared zone
    { x: 1400, y: 0, w: 1160, h: 1080, color: 0x1c1c1c }, // fortified base
  ],

  walls: [
    { x: 0,    y: 0,    w: 2560, h: 20 },
    { x: 0,    y: 1060, w: 2560, h: 20 },
    { x: 0,    y: 0,    w: 20,   h: 1080 },
    { x: 2540, y: 0,    w: 20,   h: 1080 },

    // Jungle cover
    { x: 120, y: 240, w: 56, h: 36 },
    { x: 280, y: 760, w: 48, h: 36 },
    { x: 440, y: 360, w: 44, h: 44 },
    { x: 440, y: 660, w: 44, h: 44 },

    // Cleared zone — patrol road, sandbag positions
    { x: 620, y: 200, w: 20, h: 240 },
    { x: 620, y: 640, w: 20, h: 240 },
    { x: 700, y: 380, w: 200, h: 20 },
    { x: 700, y: 680, w: 200, h: 20 },
    // Guard hut
    ...building(800, 460, 100, 120, 'right', 35, 40, 14),
    // Watchtower platforms
    { x: 980, y: 180, w: 80, h: 80 },
    { x: 980, y: 820, w: 80, h: 80 },
    { x: 1100, y: 380, w: 160, h: 20 },
    { x: 1100, y: 680, w: 160, h: 20 },

    // Base outer perimeter
    { x: 1400, y:  20, w: 24, h: 420 },
    { x: 1400, y: 640, w: 24, h: 420 },
    { x: 1424, y:  20, w: 1096, h: 24 },
    { x: 1424, y: 1036, w: 1096, h: 24 },
    { x: 2496, y:  20, w: 24,  h: 1040 },

    // Barracks block (inner left)
    ...building(1460, 180, 220, 140, 'bottom', 80, 52),
    ...building(1460, 760, 220, 140, 'top',    80, 52),

    // Inner perimeter wall
    { x: 1760, y: 44, w: 24, h: 380 },
    { x: 1760, y: 656, w: 24, h: 404 },

    // Comms infrastructure — antenna arrays and equipment
    { x: 1840, y: 280, w: 60, h: 60 },  // dish base N
    { x: 1840, y: 740, w: 60, h: 60 },  // dish base S
    { x: 1960, y: 380, w: 20, h: 320 }, // tower spine
    { x: 1900, y: 380, w: 80, h: 20 },  // cross-beam N
    { x: 1900, y: 680, w: 80, h: 20 },  // cross-beam S

    // Control room
    ...building(2100, 360, 240, 320, 'left', 110, 56),
    { x: 2280, y: 440, w: 60, h: 160 }, // server racks
    { x: 2380, y: 300, w: 20, h: 480 }, // rear wall

    // Generator room
    ...building(2160, 80, 160, 100, 'bottom', 55, 44, 14),
    ...building(2160, 900, 160, 100, 'top',   55, 44, 14),
  ],

  decor: [
    // Jungle
    { x: 100, y: 180, r: 26, color: TREE, shape: 'tree' },
    { x: 100, y: 900, r: 26, color: TREE, shape: 'tree' },
    { x: 280, y: 180, r: 20, color: TREE, shape: 'tree' },
    { x: 280, y: 900, r: 20, color: TREE, shape: 'tree' },
    { x: 460, y: 540, r: 16, color: BUSH, shape: 'tree' },
    // Rocks
    { x: 144, y: 258, r: 16, color: DIRT, shape: 'rock' },
    { x: 304, y: 778, r: 14, color: DIRT, shape: 'rock' },
    // Base lights
    { x: 1410, y:  36, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1410, y: 1044, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1770, y:  58, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1770, y: 1022, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 2110, y: 375, r: 8, color: 0xffffff, shape: 'torch' },
    { x: 2110, y: 705, r: 8, color: 0xffffff, shape: 'torch' },
    // Comms tower antenna glow
    { x: 1970, y: 300, r: 10, color: 0xff2200, alpha: 0.8 },
    { x: 1970, y: 760, r: 10, color: 0xff2200, alpha: 0.8 },
  ],

  playerStart: { x: 80, y: 540 },
  objectivePos: { x: 1970, y: 540 },

  spawns: [
    // Jungle/cleared
    { x: 320,  y: 420, type: 'soldier',  patrolEnd: { x: 580,  y: 420 } },
    { x: 320,  y: 660, type: 'soldier',  patrolEnd: { x: 580,  y: 660 } },
    { x: 860,  y: 300, type: 'rifleman', patrolEnd: { x: 1060, y: 300 } },
    { x: 860,  y: 780, type: 'archer',   patrolEnd: { x: 1060, y: 780 } },
    // Base outer
    { x: 1180, y: 540, type: 'heavy',    patrolEnd: { x: 1360, y: 540 } },
    { x: 1540, y: 300, type: 'soldier',  patrolEnd: { x: 1700, y: 300 } },
    { x: 1540, y: 780, type: 'soldier',  patrolEnd: { x: 1700, y: 780 } },
    // Comms zone
    { x: 1900, y: 440, type: 'rifleman', patrolEnd: { x: 1900, y: 640 } },
    { x: 2200, y: 480, type: 'heavy',    patrolEnd: { x: 2380, y: 480 } },
    { x: 2380, y: 540, type: 'rifleman', patrolEnd: { x: 2380, y: 600 } },
  ],

  lore: [
    { x: 560, y: 540, id: 'e3m3_lore1', title: 'Enemy Communication Intercept' },
    { x: 1560, y: 440, id: 'e3m3_lore2', title: 'Sabotage Briefing Document' },
    { x: 2240, y: 480, id: 'e3m3_lore3', title: 'Signal Corps Field Manual' },
  ] satisfies LoreDef[],
}

// ─────────────────────────────────────────────────────────────────────────────
// ERA 3 MISSION 4 — Command Strike
// The final mission: storm Commander Vargas's fortified mountain base.
// Helicopter pad, command bunker, elite guards. Boss fight finale.
// ─────────────────────────────────────────────────────────────────────────────
export const ERA3_M4: MapDef = {
  width: 1920, height: 1080,
  groundColor: 0x181818,
  wallColor: METAL,

  groundZones: [
    { x:    0, y: 0, w:  360, h: 1080, color: 0x1a2810 }, // jungle entry
    { x:  360, y: 0, w: 1560, h: 1080, color: 0x1a1a1a }, // base
  ],

  walls: [
    { x: 0,    y: 0,    w: 1920, h: 20 },
    { x: 0,    y: 1060, w: 1920, h: 20 },
    { x: 0,    y: 0,    w: 20,   h: 1080 },
    { x: 1900, y: 0,    w: 20,   h: 1080 },

    // Jungle boulders
    { x: 120, y: 240, w: 52, h: 36 },
    { x: 220, y: 780, w: 48, h: 36 },
    { x: 300, y: 440, w: 44, h: 44 },

    // Base perimeter — reinforced concrete
    { x: 380, y:  20, w: 1500, h: 28 },    // north wall
    { x: 380, y: 1032, w: 1500, h: 28 },   // south wall
    { x: 380, y: 48,  w: 28, h: 420 },     // west wall N
    { x: 380, y: 612, w: 28, h: 440 },     // west wall S  (gate y:468–612)
    { x: 1852, y: 48, w: 28, h: 984 },     // east wall

    // Corner towers
    { x:  380, y:  20, w: 100, h: 100 },
    { x: 1780, y:  20, w: 100, h: 100 },
    { x:  380, y: 960, w: 100, h: 100 },
    { x: 1780, y: 960, w: 100, h: 100 },

    // Guard barracks (entry zone)
    ...building(480, 180, 240, 140, 'bottom', 90, 52),
    ...building(480, 760, 240, 140, 'top',    90, 52),

    // Vehicle bay / garage
    { x: 780, y: 300, w: 20, h: 180 },
    { x: 800, y: 300, w: 180, h: 20 },
    { x: 800, y: 480, w: 180, h: 20 },
    { x: 960, y: 300, w: 20, h: 180 },

    { x: 780, y: 600, w: 20, h: 180 },
    { x: 800, y: 600, w: 180, h: 20 },
    { x: 800, y: 780, w: 180, h: 20 },
    { x: 960, y: 600, w: 20, h: 180 },

    // Inner compound wall
    { x: 1080, y: 48, w: 28, h: 380 },
    { x: 1080, y: 652, w: 28, h: 380 },   // gate y:428-652

    // Helicopter landing pad frame (open area, marked by walls on sides)
    { x: 1160, y: 160, w: 260, h: 24 },   // pad north edge
    { x: 1160, y: 560, w: 260, h: 24 },   // pad south edge

    // Armory and equipment buildings
    ...building(1160, 680, 200, 120, 'top', 70, 48, 16),
    ...building(1160, 240, 200, 120, 'bottom', 70, 48, 16),

    // Final perimeter — command complex
    { x: 1440, y: 48,  w: 28, h: 360 },
    { x: 1440, y: 672, w: 28, h: 360 },   // command gate y:408–672

    // Command bunker — Vargas's HQ
    ...building(1560, 320, 260, 400, 'left', 140, 60),
    { x: 1720, y: 440, w: 70, h: 160 }, // command centre core

    // Generator room
    { x: 1480, y: 100, w: 120, h: 80 },
    { x: 1480, y: 900, w: 120, h: 80 },

    // Rear exit blocked
    { x: 1820, y: 340, w: 28, h: 400 },
  ],

  decor: [
    // Jungle approach
    { x: 100, y: 180, r: 24, color: TREE, shape: 'tree' },
    { x: 100, y: 900, r: 24, color: TREE, shape: 'tree' },
    { x: 240, y: 160, r: 18, color: BUSH, shape: 'tree' },
    { x: 240, y: 920, r: 18, color: BUSH, shape: 'tree' },
    // Boulders
    { x: 144, y: 258, r: 16, color: DIRT, shape: 'rock' },
    { x: 244, y: 798, r: 15, color: DIRT, shape: 'rock' },
    // Base lights — sterile white military lighting
    { x: 390, y:  34, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 390, y: 1046, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 640, y:  34, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 640, y: 1046, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1090, y:  62, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1090, y: 1018, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1450, y:  62, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1450, y: 1018, r: 7, color: 0xffffff, shape: 'torch' },
    { x: 1570, y: 335, r: 8, color: 0xffffff, shape: 'torch' },
    { x: 1570, y: 745, r: 8, color: 0xffffff, shape: 'torch' },
    // Heli pad light — red circle glow
    { x: 1290, y: 380, r: 28, color: 0xdd1111, alpha: 0.3 },
    { x: 1290, y: 380, r: 8,  color: 0xff3333, alpha: 0.8 },
  ],

  playerStart: { x: 80, y: 540 },
  objectivePos: { x: 1740, y: 520 },

  spawns: [
    // Jungle/gate
    { x: 220,  y: 400, type: 'soldier',  patrolEnd: { x: 360,  y: 400 } },
    { x: 220,  y: 680, type: 'soldier',  patrolEnd: { x: 360,  y: 680 } },
    // Entry barracks
    { x: 600,  y: 260, type: 'rifleman', patrolEnd: { x: 760,  y: 260 } },
    { x: 600,  y: 820, type: 'rifleman', patrolEnd: { x: 760,  y: 820 } },
    { x: 900,  y: 540, type: 'heavy',    patrolEnd: { x: 1040, y: 540 } },
    // Heli pad zone
    { x: 1200, y: 360, type: 'soldier',  patrolEnd: { x: 1400, y: 360 } },
    { x: 1200, y: 720, type: 'soldier',  patrolEnd: { x: 1400, y: 720 } },
    { x: 1340, y: 540, type: 'archer',   patrolEnd: { x: 1420, y: 540 } },
    // Command complex elite
    { x: 1560, y: 380, type: 'rifleman', patrolEnd: { x: 1560, y: 500 } },
    { x: 1560, y: 700, type: 'rifleman', patrolEnd: { x: 1560, y: 580 } },
  ],

  lore: [
    { x: 300, y: 540, id: 'e3m4_lore1', title: 'Mission Briefing — Operation Bijayapur' },
    { x: 1150, y: 380, id: 'e3m4_lore2', title: 'Vargas\' Mercenary Contract' },
    { x: 1640, y: 440, id: 'e3m4_lore3', title: 'Gurkha Regimental Honours' },
  ] satisfies LoreDef[],

  boss: { x: 1800, y: 520 },
}

export const ERA3_MAPS: Record<number, MapDef> = {
  1: ERA3_M1,
  2: ERA3_M2,
  3: ERA3_M3,
  4: ERA3_M4,
}
