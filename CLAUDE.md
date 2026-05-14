# Gurkha Legends — CLAUDE.md

## Project overview

**Gurkha Legends** (गोर्खा लिजेन्ड्स) is a bilingual (English + Nepali) top-down action RPG built with Phaser 3. Players control Bir Bahadur through 12 missions across 3 historical eras of Nepal. Status: **pre-production** — player entity, scene flow, and core systems scaffolded; enemy AI and level maps not yet implemented.

## Tech stack

| Tool | Version |
|------|---------|
| Phaser 3 | 3.87.0 (arcade physics, gravity: 0) |
| TypeScript | 5.7.2 (strict mode) |
| Vite | 6.3.5 (dev server port 3000) |
| Storage | localStorage via `src/storage/api.ts` (Firebase planned later) |
| Target | Web + future iOS/Android via Capacitor |

## Build & dev

```bash
npm run dev      # starts Vite dev server at localhost:3000
npm run build    # outputs to dist/
npx tsc          # type-check only
```

## Folder structure

```
src/
├── main.ts                    # Phaser game config + scene list
├── types/index.ts             # All TypeScript interfaces (save state, etc.)
├── config/
│   ├── balance.ts             # 104 game balance constants — edit here only
│   └── weaponLoadouts.ts      # Era-specific weapon availability
├── engine/
│   ├── InputManager.ts        # WASD/Space/ZXCVB → InputState each frame
│   ├── StaminaSystem.ts       # 0–100 stamina, drain/regen logic
│   └── ScoreSystem.ts         # Kill/stealth/combo/difficulty scoring
├── entities/
│   └── Player.ts              # Bir Bahadur: movement, dodge, combat
├── scenes/                    # 9 Phaser scene classes (see flow below)
└── storage/
    └── api.ts                 # localStorage wrapper (Firebase-ready interface)
```

## Scene flow

```
BootScene → PreloadScene → MainMenuScene
MainMenuScene → EraSelectScene (3 eras)
EraSelectScene → MissionBriefScene
MissionBriefScene → GameScene (top-down map)
GameScene → MissionCompleteScene (objective met)
GameScene → GameOverScene (player death)
MissionCompleteScene → EraSelectScene | LeaderboardScene
```

Era + mission are passed via `scene.start('GameScene', { era, mission, difficulty })`.

## Key systems

| System | File | Notes |
|--------|------|-------|
| Player entity | `src/entities/Player.ts` | Movement, dodge, stamina, khukuri combos |
| Stamina | `src/engine/StaminaSystem.ts` | Drains on sprint (15/s) & dodge (25 flat); regens 18/s after 500ms idle |
| Score | `src/engine/ScoreSystem.ts` | Kill 100pts, stealth kill 300pts, difficulty ×1.0/1.5/2.5 |
| Input | `src/engine/InputManager.ts` | Polled every frame; returns structured `InputState` |
| Storage | `src/storage/api.ts` | `saveGame`, `loadGame`, `submitScore`, `getLeaderboard` |

## Storage rule — localStorage first, Firebase later

**Do not integrate Firebase SDK until gameplay is finalized.** Use `src/storage/api.ts` (localStorage) for all save/load/leaderboard during development. The API is designed to be Firebase-swappable with minimal changes when the time comes.

## Era weapon loadouts

| Era | Weapons |
|-----|---------|
| 1 — Prithvi Narayan Shah (1743–1775) | Khukuri, Shield, Musket (2s reload), Spear throw |
| 2 — Anglo-Gurkha Wars (1814–1816) | Khukuri, Throwing knives, Musket (1.2s reload) |
| 3 — Modern outpost defense | Khukuri, Throwing knives, Rifle (0.5s reload), Grenades |

Loadout is resolved via `WeaponLoadout.getForEra(era)` in `src/config/weaponLoadouts.ts`.

## Combat mechanics (implemented)

- **Khukuri light combo** (Z): 25 / 25 / 37 damage, 600ms combo window
- **Khukuri heavy** (hold Z 600ms): 60 damage, 80px radius, 20 stamina cost, camera flash
- **Counter-strike**: Z within 200ms of taking damage → 50 damage automatic
- **Stealth kill**: Z while crouching within 60px of unalerted enemy → instant kill
- **Dodge**: Space, costs 25 stamina, 300ms i-frames, 800ms cooldown

## Player stats (from `src/config/balance.ts`)

- HP: 100, Stamina: 100, Walk: 200px/s, Sprint: 320px/s
- Detection radius: 140px normal, 80px crouching

## Cultural accuracy rules — mandatory

1. Gurkha warriors shown with dignity: intelligent, strategic, courageous
2. Prithvi Narayan Shah = unifier of Nepal, not a conqueror
3. Anglo-Gurkha war shown from Nepali perspective — British are antagonists
4. All Nepali text must use correct Devanagari — never approximate
5. "Ayo Gorkhali!" (आयो गोर्खाली!) is the battle cry — use correctly and sparingly
6. Lore items must contain verified historical facts — note source in code comments
7. No negative stereotypes of any depicted group

## Balance constants

All numeric game values live in `src/config/balance.ts`. Never hardcode stats in scene or entity files — always reference a constant. Reference `balance-additions.ts` in the root for the full intended value list.

## What is NOT yet implemented

- Enemy AI (3-state patrol/alert/combat, cone vision, sound alerts)
- Actual level maps (placeholder 1920×1080 grid exists in GameScene)
- Enemy spawning and wave logic
- Weapon mastery system (0–5 levels per weapon, hit tracking)
- Lore item pickups (3 per mission)
- Mission objectives (eliminate all / reach extract / destroy target)
- Boss fights (3 phases each: Era 1 Kazi general, Era 2 EIC Commander, Era 3 Helicopter+Commander)
- Firebase cloud saves (storage API skeleton exists using localStorage now)
- Bilingual audio narration
