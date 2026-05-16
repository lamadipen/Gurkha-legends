import type { MapDef } from './MapBuilder'
import type { LoreDef } from '../entities/LoreItem'

// Era 2 palette — Anglo-Gurkha Wars (1814–1816)
// British imperial brick forts, dusty Terai terrain, mountain passes
const BRICK  = 0x8b5a2b   // British red-brown brick
const STONE  = 0x7a6e5c   // weathered stone
const WOOD   = 0x5a3a18   // timber barricades
const TREE   = 0x2e7a1a
const BUSH   = 0x4e9a14
const RIVER  = 0x1a50aa   // Kali Gandaki blue
const SAND   = 0x9b8860   // Terai dust

// Hollow building helper (same as Era 1)
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
// ERA 2 MISSION 1 — Border Skirmish at Butwal
// The British provoke a border incident at Butwal Pass.
// Mountain approach with ambush positions. Gurkhas must push through.
// ─────────────────────────────────────────────────────────────────────────────
export const ERA2_M1: MapDef = {
  width: 1920, height: 1080,
  groundColor: 0x2a1e0a,
  wallColor: STONE,

  groundZones: [
    { x:    0, y: 0, w:  600, h: 1080, color: 0x1a2e0a },   // jungle entry
    { x:  600, y: 0, w:  660, h: 1080, color: 0x2a1e0a },   // open pass
    { x: 1260, y: 0, w:  660, h: 1080, color: 0x1e1608 },   // British encampment
  ],

  walls: [
    { x: 0,    y: 0,    w: 1920, h: 20 },
    { x: 0,    y: 1060, w: 1920, h: 20 },
    { x: 0,    y: 0,    w: 20,   h: 1080 },
    { x: 1900, y: 0,    w: 20,   h: 1080 },

    // Jungle boulders — natural ambush cover
    { x: 120, y: 220, w: 52, h: 36 },
    { x: 200, y: 760, w: 44, h: 40 },
    { x: 360, y: 340, w: 48, h: 32 },
    { x: 460, y: 680, w: 40, h: 36 },
    { x: 520, y: 180, w: 36, h: 36 },

    // Pass narrows — cliff face outcrops
    { x: 620, y:  20, w: 30, h: 180 },
    { x: 620, y: 880, w: 30, h: 180 },
    { x: 780, y:  20, w: 30, h: 120 },
    { x: 780, y: 940, w: 30, h: 120 },

    // British forward barricades — timber
    { x: 900, y: 200, w: 160, h: 20 },
    { x: 900, y: 860, w: 160, h: 20 },
    { x: 1040, y: 400, w: 20, h: 160 },
    { x: 1040, y: 620, w: 20, h: 120 },

    // British camp structures
    ...building(1300, 160, 200, 140, 'left', 50, 48),   // mess tent (stone)
    ...building(1300, 780, 200, 140, 'left', 50, 48),   // armory
    { x: 1560, y: 360, w: 180, h: 20 },                // stockade wall top
    { x: 1560, y: 700, w: 180, h: 20 },                // stockade wall bottom
    { x: 1740, y: 380, w: 20, h: 320 },                // stockade right
    { x: 1580, y: 460, w: 140, h: 20 },                // inner barrier top
    { x: 1580, y: 600, w: 140, h: 20 },                // inner barrier bottom
  ],

  decor: [
    // Jungle canopy
    { x:  80, y: 120, r: 32, color: TREE, shape: 'tree' },
    { x: 140, y: 900, r: 28, color: TREE, shape: 'tree' },
    { x: 280, y: 200, r: 24, color: TREE, shape: 'tree' },
    { x: 320, y: 840, r: 22, color: TREE, shape: 'tree' },
    { x: 480, y: 120, r: 20, color: BUSH, shape: 'tree' },
    { x: 500, y: 920, r: 18, color: BUSH, shape: 'tree' },
    // Boulders
    { x: 144, y: 238, r: 18, color: STONE, shape: 'rock' },
    { x: 384, y: 356, r: 16, color: STONE, shape: 'rock' },
    { x: 480, y: 698, r: 15, color: STONE, shape: 'rock' },
    // British camp torches
    { x: 1310, y: 175, r: 7, color: 0xff9933, shape: 'torch' },
    { x: 1310, y: 795, r: 7, color: 0xff9933, shape: 'torch' },
    { x: 1760, y: 400, r: 8, color: 0xff9933, shape: 'torch' },
    { x: 1760, y: 680, r: 8, color: 0xff9933, shape: 'torch' },
    // River stream on north edge
    { x: 700, y: 540, r: 30, color: RIVER, alpha: 0.7 },
  ],

  playerStart: { x: 80, y: 540 },
  objectivePos: { x: 1800, y: 540 },

  spawns: [
    { x: 300,  y: 380, type: 'soldier',  patrolEnd: { x: 560,  y: 380 } },
    { x: 300,  y: 700, type: 'soldier',  patrolEnd: { x: 560,  y: 700 } },
    { x: 960,  y: 280, type: 'archer',   patrolEnd: { x: 1040, y: 400 } },
    { x: 960,  y: 800, type: 'soldier',  patrolEnd: { x: 1040, y: 700 } },
    { x: 1440, y: 300, type: 'rifleman', patrolEnd: { x: 1540, y: 300 } },
    { x: 1660, y: 540, type: 'heavy',    patrolEnd: { x: 1800, y: 540 } },
  ],

  lore: [
    { x: 400, y: 540, id: 'e2m1_lore1', title: 'The Butwal Incident' },
    { x: 1100, y: 540, id: 'e2m1_lore2', title: 'British Ultimatum Letter' },
    { x: 1580, y: 540, id: 'e2m1_lore3', title: 'Gurkha Battle Formation' },
  ] satisfies LoreDef[],
}

// ─────────────────────────────────────────────────────────────────────────────
// ERA 2 MISSION 2 — The River Crossing
// Gurkha forces must cross the Kali River under British fire.
// Wide map with a river zone in the centre. Two bridge choke points.
// ─────────────────────────────────────────────────────────────────────────────
export const ERA2_M2: MapDef = {
  width: 2560, height: 1080,
  groundColor: 0x1e1608,
  wallColor: BRICK,

  groundZones: [
    { x:    0, y: 0, w:  840, h: 1080, color: 0x1a2e0a },   // Gurkha bank — jungle
    { x:  840, y: 0, w:  220, h: 1080, color: 0x122255 },   // river
    { x: 1060, y: 0, w:  200, h: 1080, color: 0x122255 },   // river mid
    { x: 1260, y: 0, w:  220, h: 1080, color: 0x122255 },   // river east
    { x: 1480, y: 0, w: 1080, h: 1080, color: 0x2a1a08 },  // British bank — dry
  ],

  walls: [
    { x: 0,    y: 0,    w: 2560, h: 20 },
    { x: 0,    y: 1060, w: 2560, h: 20 },
    { x: 0,    y: 0,    w: 20,   h: 1080 },
    { x: 2540, y: 0,    w: 20,   h: 1080 },

    // Gurkha side — cover positions and rally point
    { x: 200, y: 160, w: 56, h: 40 },   // boulder N
    { x: 200, y: 880, w: 56, h: 40 },   // boulder S
    { x: 460, y: 280, w: 180, h: 20 },  // earthwork N
    { x: 460, y: 780, w: 180, h: 20 },  // earthwork S
    { x: 680, y: 380, w: 20, h: 120 },  // bank wall N
    { x: 680, y: 580, w: 20, h: 120 },  // bank wall S

    // North bridge structure
    { x: 840,  y:  20, w: 440, h: 120 },  // cliff face N
    { x: 840,  y: 200, w: 120, h: 20 },   // bridge wall N inner
    { x: 1260, y: 200, w: 140, h: 20 },
    // South bridge
    { x: 840,  y: 860, w: 440, h: 120 },  // cliff face S
    { x: 840,  y: 840, w: 120, h: 20 },
    { x: 1260, y: 840, w: 140, h: 20 },
    // Bridge sides (open passages in the middle for crossing)
    // North bridge = y:200–340 passable, south bridge = y:740–880 passable

    // British bank fortifications
    { x: 1500, y: 200, w: 20, h: 240 },  // palisade top
    { x: 1500, y: 640, w: 20, h: 240 },  // palisade bottom
    { x: 1540, y: 420, w: 180, h: 20 },  // firing platform top
    { x: 1540, y: 660, w: 180, h: 20 },  // firing platform bot
    ...building(1700, 180, 220, 160, 'bottom', 80, 50),  // garrison N
    ...building(1700, 740, 220, 160, 'top',    80, 50),  // garrison S
    { x: 2000, y: 380, w: 20, h: 320 },  // inner wall
    ...building(2100, 380, 280, 260, 'left', 90, 56),    // command post
    { x: 2340, y: 440, w: 80, h: 160 },  // command blockhouse
  ],

  decor: [
    // Gurkha bank trees
    { x: 100, y: 200, r: 30, color: TREE, shape: 'tree' },
    { x: 100, y: 880, r: 28, color: TREE, shape: 'tree' },
    { x: 340, y: 160, r: 22, color: TREE, shape: 'tree' },
    { x: 340, y: 900, r: 22, color: TREE, shape: 'tree' },
    { x: 600, y: 160, r: 18, color: BUSH, shape: 'tree' },
    { x: 600, y: 900, r: 18, color: BUSH, shape: 'tree' },
    // River features
    { x: 960, y: 540, r: 60, color: RIVER, alpha: 0.85 },
    { x: 1160, y: 540, r: 55, color: RIVER, alpha: 0.85 },
    // British side sparse trees
    { x: 1900, y: 100, r: 16, color: BUSH, shape: 'tree' },
    { x: 1900, y: 980, r: 16, color: BUSH, shape: 'tree' },
    // Torches
    { x: 1510, y: 210, r: 7, color: 0xff9933, shape: 'torch' },
    { x: 1510, y: 870, r: 7, color: 0xff9933, shape: 'torch' },
    { x: 2110, y: 395, r: 8, color: 0xff9933, shape: 'torch' },
    { x: 2340, y: 455, r: 8, color: 0xff9933, shape: 'torch' },
  ],

  playerStart: { x: 80, y: 540 },
  objectivePos: { x: 2440, y: 540 },

  spawns: [
    // Gurkha bank ambush
    { x: 340,  y: 380, type: 'soldier',  patrolEnd: { x: 660,  y: 380 } },
    { x: 340,  y: 700, type: 'soldier',  patrolEnd: { x: 660,  y: 700 } },
    // Bridge guards
    { x: 1100, y: 280, type: 'rifleman', patrolEnd: { x: 1340, y: 280 } },
    { x: 1100, y: 800, type: 'archer',   patrolEnd: { x: 1340, y: 800 } },
    // British bank defense
    { x: 1600, y: 440, type: 'soldier',  patrolEnd: { x: 1780, y: 440 } },
    { x: 1600, y: 640, type: 'soldier',  patrolEnd: { x: 1780, y: 640 } },
    { x: 2020, y: 540, type: 'heavy',    patrolEnd: { x: 2080, y: 540 } },
    { x: 2380, y: 480, type: 'rifleman', patrolEnd: { x: 2380, y: 600 } },
  ],

  lore: [
    { x: 600, y: 380, id: 'e2m2_lore1', title: "The River Kali — Sacred Boundary" },
    { x: 1180, y: 540, id: 'e2m2_lore2', title: 'Bridge Defenders\' Last Stand' },
    { x: 2160, y: 540, id: 'e2m2_lore3', title: 'General\'s Crossing Orders' },
  ] satisfies LoreDef[],
}

// ─────────────────────────────────────────────────────────────────────────────
// ERA 2 MISSION 3 — British Garrison Assault
// Storm a fully fortified British colonial garrison.
// Classic fort layout: perimeter wall, barracks, officers' quarters, HQ.
// ─────────────────────────────────────────────────────────────────────────────
export const ERA2_M3: MapDef = {
  width: 1920, height: 1080,
  groundColor: 0x251a08,
  wallColor: BRICK,

  walls: [
    { x: 0,    y: 0,    w: 1920, h: 20 },
    { x: 0,    y: 1060, w: 1920, h: 20 },
    { x: 0,    y: 0,    w: 20,   h: 1080 },
    { x: 1900, y: 0,    w: 20,   h: 1080 },

    // Outer fort perimeter (enter from west gate)
    { x: 80, y: 80,   w: 1760, h: 28 },   // north wall
    { x: 80, y: 972,  w: 1760, h: 28 },   // south wall
    { x: 80, y: 80,   w: 28,   h: 380 },  // west wall north
    { x: 80, y: 620,  w: 28,   h: 380 },  // west wall south  (gate y:460–620)
    { x: 1812, y: 80,  w: 28,  h: 960 },  // east wall

    // Corner bastions
    { x:  80, y:  80, w: 100, h: 100 },
    { x: 1740, y:  80, w: 100, h: 100 },
    { x:  80, y: 900, w: 100, h: 100 },
    { x: 1740, y: 900, w: 100, h: 100 },

    // Barracks — north row
    ...building(200, 180, 280, 140, 'bottom', 100, 52),
    ...building(560, 180, 280, 140, 'bottom', 100, 52),
    // Barracks — south row
    ...building(200, 760, 280, 140, 'top', 100, 52),
    ...building(560, 760, 280, 140, 'top', 100, 52),

    // Supply depot (centre-left)
    ...building(880, 400, 200, 240, 'right', 80, 52),

    // Inner dividing wall with single gate
    { x: 1100, y: 108, w: 28, h: 380 },
    { x: 1100, y: 592, w: 28, h: 380 },

    // Officers' mess (right side of inner wall)
    ...building(1200, 180, 220, 160, 'bottom', 80, 52),
    ...building(1200, 740, 220, 160, 'top',    80, 52),

    // HQ building (far right)
    ...building(1500, 340, 240, 360, 'left', 120, 56),
    { x: 1660, y: 420, w: 60, h: 200 }, // flag platform inside HQ

    // Crate barricades
    { x: 800,  y: 380, w: 44, h: 44 },
    { x: 800,  y: 660, w: 44, h: 44 },
    { x: 1380, y: 480, w: 48, h: 60 },
  ],

  decor: [
    { x: 440, y: 540, r: 14, color: BUSH, shape: 'tree' },
    { x: 740, y: 200, r: 12, color: BUSH, shape: 'tree' },
    { x: 740, y: 880, r: 12, color: BUSH, shape: 'tree' },
    { x: 1120, y: 540, r: 12, color: BUSH, shape: 'tree' },
    // Torches lining main paths
    { x: 110, y: 100, r: 7, color: 0xff9933, shape: 'torch' },
    { x: 110, y: 980, r: 7, color: 0xff9933, shape: 'torch' },
    { x: 560, y: 100, r: 7, color: 0xff9933, shape: 'torch' },
    { x: 1120, y: 120, r: 7, color: 0xff9933, shape: 'torch' },
    { x: 1120, y: 960, r: 7, color: 0xff9933, shape: 'torch' },
    { x: 1510, y: 355, r: 8, color: 0xff9933, shape: 'torch' },
    { x: 1510, y: 725, r: 8, color: 0xff9933, shape: 'torch' },
    // Flagpole stand
    { x: 1690, y: 380, r: 6, color: WOOD },
  ],

  playerStart: { x: 60, y: 540 },
  objectivePos: { x: 1720, y: 520 },

  spawns: [
    { x: 280,  y: 380, type: 'soldier',  patrolEnd: { x: 520,  y: 380 } },
    { x: 280,  y: 700, type: 'soldier',  patrolEnd: { x: 520,  y: 700 } },
    { x: 800,  y: 300, type: 'archer',   patrolEnd: { x: 800,  y: 780 } },
    { x: 1040, y: 540, type: 'heavy',    patrolEnd: { x: 1080, y: 540 } },
    { x: 1280, y: 300, type: 'rifleman', patrolEnd: { x: 1460, y: 300 } },
    { x: 1280, y: 780, type: 'rifleman', patrolEnd: { x: 1460, y: 780 } },
    { x: 1680, y: 480, type: 'soldier',  patrolEnd: { x: 1680, y: 600 } },
  ],

  lore: [
    { x: 400, y: 280, id: 'e2m3_lore1', title: 'Colonial Garrison Orders' },
    { x: 960, y: 490, id: 'e2m3_lore2', title: 'Captured Gurkha Letter' },
    { x: 1580, y: 440, id: 'e2m3_lore3', title: 'Ochterlony\'s Field Report' },
  ] satisfies LoreDef[],
}

// ─────────────────────────────────────────────────────────────────────────────
// ERA 2 MISSION 4 — Battle of Nalapani
// The legendary siege of Nalapani fort. Balbhadra Kunwar's last stand.
// Hilltop fort layout. Boss: General Ochterlony arrives at phase 2.
// ─────────────────────────────────────────────────────────────────────────────
export const ERA2_M4: MapDef = {
  width: 1920, height: 1080,
  groundColor: 0x1a1208,
  wallColor: 0x6e5a3a,

  groundZones: [
    { x:    0, y: 0, w:  480, h: 1080, color: 0x1a2e0a }, // jungle approach
    { x:  480, y: 0, w: 1440, h: 1080, color: 0x1e1608 }, // hilltop stone
  ],

  walls: [
    { x: 0,    y: 0,    w: 1920, h: 20 },
    { x: 0,    y: 1060, w: 1920, h: 20 },
    { x: 0,    y: 0,    w: 20,   h: 1080 },
    { x: 1900, y: 0,    w: 20,   h: 1080 },

    // Hilltop cliff ledges — natural obstacles
    { x: 480, y:  20, w: 20, h: 380 },
    { x: 480, y: 680, w: 20, h: 380 },   // cliff gap y:400-680 = entry

    // Nalapani outer wall
    { x: 560, y:  80, w: 1200, h: 28 },
    { x: 560, y: 972, w: 1200, h: 28 },
    { x: 560, y: 108, w: 28, h: 380 },
    { x: 560, y: 592, w: 28, h: 380 },   // outer west gate y:488-592

    // Outer corner towers
    { x:  560, y:  80, w: 80, h: 80 },
    { x: 1680, y:  80, w: 80, h: 80 },
    { x:  560, y: 920, w: 80, h: 80 },
    { x: 1680, y: 920, w: 80, h: 80 },

    // Outer courtyard structures
    ...building(680,  160, 200, 130, 'bottom', 70, 48),   // north barracks
    ...building(680,  790, 200, 130, 'top',    70, 48),   // south barracks
    { x: 980, y: 280, w: 180, h: 20 },
    { x: 980, y: 780, w: 180, h: 20 },
    { x: 1200, y: 380, w: 20, h: 140 },
    { x: 1200, y: 560, w: 20, h: 140 },

    // Inner fort wall (second ring)
    { x: 1100, y: 108, w: 24, h: 320 },
    { x: 1100, y: 652, w: 24, h: 320 },  // inner gate y:428-652

    // Inner keeps — Balbhadra's defenders
    ...building(1200, 200, 180, 120, 'right', 40, 44),
    ...building(1200, 760, 180, 120, 'right', 40, 44),
    { x: 1440, y: 320, w: 20, h: 160 },
    { x: 1440, y: 600, w: 20, h: 160 },

    // Commander's citadel
    ...building(1560, 360, 260, 320, 'left', 110, 56),
    { x: 1700, y: 460, w: 80, h: 120 },  // citadel dais
  ],

  decor: [
    // Jungle approach
    { x: 100, y: 200, r: 28, color: TREE, shape: 'tree' },
    { x: 100, y: 880, r: 28, color: TREE, shape: 'tree' },
    { x: 300, y: 160, r: 22, color: TREE, shape: 'tree' },
    { x: 300, y: 920, r: 22, color: TREE, shape: 'tree' },
    // Hilltop rocky terrain
    { x: 500, y: 180, r: 16, color: STONE, shape: 'rock' },
    { x: 500, y: 900, r: 16, color: STONE, shape: 'rock' },
    { x: 760, y: 540, r: 14, color: BUSH, shape: 'tree' },
    // Torches — fort is lit at night
    { x: 575, y:  95, r: 7, color: 0xff8822, shape: 'torch' },
    { x: 575, y: 985, r: 7, color: 0xff8822, shape: 'torch' },
    { x: 840, y:  95, r: 7, color: 0xff8822, shape: 'torch' },
    { x: 840, y: 985, r: 7, color: 0xff8822, shape: 'torch' },
    { x: 1115, y: 120, r: 7, color: 0xff8822, shape: 'torch' },
    { x: 1115, y: 960, r: 7, color: 0xff8822, shape: 'torch' },
    { x: 1570, y: 375, r: 8, color: 0xff8822, shape: 'torch' },
    { x: 1570, y: 705, r: 8, color: 0xff8822, shape: 'torch' },
  ],

  playerStart: { x: 60, y: 540 },
  objectivePos: { x: 1760, y: 520 },

  spawns: [
    { x: 250,  y: 380, type: 'soldier',  patrolEnd: { x: 440,  y: 380 } },
    { x: 250,  y: 700, type: 'soldier',  patrolEnd: { x: 440,  y: 700 } },
    { x: 760,  y: 240, type: 'archer',   patrolEnd: { x: 960,  y: 240 } },
    { x: 760,  y: 840, type: 'soldier',  patrolEnd: { x: 960,  y: 840 } },
    { x: 1040, y: 540, type: 'heavy',    patrolEnd: { x: 1080, y: 540 } },
    { x: 1300, y: 300, type: 'rifleman', patrolEnd: { x: 1420, y: 300 } },
    { x: 1300, y: 780, type: 'rifleman', patrolEnd: { x: 1420, y: 780 } },
    { x: 1620, y: 460, type: 'soldier',  patrolEnd: { x: 1620, y: 620 } },
  ],

  lore: [
    { x: 350, y: 540, id: 'e2m4_lore1', title: 'Balbhadra Kunwar\'s Oath' },
    { x: 1040, y: 300, id: 'e2m4_lore2', title: 'Water Source Destroyed' },
    { x: 1620, y: 420, id: 'e2m4_lore3', title: 'The Honourable Surrender' },
  ] satisfies LoreDef[],

  boss: { x: 1720, y: 520 },
}

export const ERA2_MAPS: Record<number, MapDef> = {
  1: ERA2_M1,
  2: ERA2_M2,
  3: ERA2_M3,
  4: ERA2_M4,
}
