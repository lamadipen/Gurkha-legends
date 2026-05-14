# Game Design Document — Gurkha Legends (गोर्खा लिजेन्ड्स)

**Engine**: Phaser 3 | **Genre**: Top-down action RPG | **Version**: 0.1 pre-production

---

## Overview

| Item | Value |
|---|---|
| Title | Gurkha Legends (गोर्खा लिजेन्ड्स) |
| Genre | Top-down action RPG |
| Core fantasy | "You are Bir Bahadur — a Gurkha warrior across three eras of Nepali history. The khukuri never rests." |
| Target audience | Nepali youth 16–35, global military history fans, action RPG players |
| Session length | 10–20 min per mission |
| Total content | 3 eras × 4 missions = 12 missions + 3 boss fights |
| Languages | English + Nepali (Devanagari) |
| Platforms | Web (Firebase Hosting) + Android + iOS (Capacitor) |

---

## Core loop

```
Mission briefing (bilingual narration)
    ↓
Infiltrate top-down map
    ↓
Eliminate enemies — khukuri combos + ranged weapons
    ↓
Collect lore items (3 hidden per mission)
    ↓
Reach objective (eliminate all / reach extract / destroy target)
    ↓
Mission complete screen — score + leaderboard + lore unlock
    ↓
Firebase save — weapon mastery progress + lore collected
    ↓
Next mission unlocked
```

---

## Player — Bir Bahadur (बीर बहादुर)

| Attribute | Value |
|---|---|
| Max HP | 100 |
| Max stamina | 100 |
| Move speed | 200 px/s |
| Sprint speed | 320 px/s (1.6×) |
| Dodge invincibility | 300ms |
| Dodge cooldown | 800ms |
| Stealth detection radius | 80px (normal 140px) |

### Controls

| Key | Action | Stamina cost |
|---|---|---|
| WASD | Move (8-directional) | 0 |
| Space | Dodge roll (300ms i-frames) | 25 |
| Shift (hold) | Stealth crouch (slower, smaller detection) | 0 |
| Double-tap dir | Sprint | 15/sec |
| Z | Khukuri light combo / heavy sweep (hold) | 0 / 20 |
| X | Throw knife | 0 |
| C | Musket / rifle | 0 |
| V | Shield raise / bash (Era 1 only) | 10/bash |
| B | Grenade throw (Era 3 only) | 0 |

---

## Combat systems

### Khukuri combo system

| Move | Input | Damage | Notes |
|---|---|---|---|
| Light combo | 3× Z within 600ms | 25 / 25 / 37 | 3rd hit +50% damage |
| Heavy sweep | Hold Z 0.6s | 60 | 180° arc, 80px radius, hits all |
| Counter-strike | Z within 200ms of taking damage | 50 | Staggers enemy |
| Stealth kill | Z (crouched) within 60px of unalerted enemy | Instant | No sound |
| Spinning slash | Mastery 3+ combo finish | 45 area | Unlocked upgrade |
| Execute | Mastery 5+ heavy sweep kill | — | Slow-mo trigger |

### Stamina system

- Sprint: 15/sec
- Dodge roll: 25 flat
- Heavy swing: 20 flat
- Shield bash: 10 flat
- Regen: 18/sec when not spending stamina
- At 0 stamina: no dodge, no sprint, no heavy swing

---

## Weapon mastery

Each weapon tracks hit count → mastery level 1–5. Persists in Firebase saves.

| Mastery | Khukuri | Rifle | Knife |
|---|---|---|---|
| 1 | Combo window 600ms | Base | Base |
| 2 | Heavy sweep +20px radius | Reload -15% | +1 knife/mission |
| 3 | Unlock spinning slash | Reload -30% | +2 knives/mission |
| 4 | Counter-strike damage x2.5 | Aimed shot (hold) | Penetrates 1 enemy |
| 5 | Execute slow-mo | Suppressor available | Instant retrieval |

---

## Campaign — three eras

### Era 1: Prithvi Narayan Shah (1743–1775)
- **Theme**: Unification of Nepal. Dense jungle, river crossings, mountain fortresses.
- **Weapons**: Khukuri + shield, musket (2s reload), spear throw
- **Enemies**: Rival kingdom soldiers, East India Company scouts
- **Missions**: 4
  1. Night of Nuwakot — jungle ambush, full stealth encouraged
  2. River crossing — defend crossing against archers
  3. Fort assault — breach Kathmandu valley fortress walls
  4. Final siege — boss fight: EIC Commander
- **Boss**: EIC Commander — 3 phases: guards → dual swords → berserk

### Era 2: Anglo-Gurkha Wars (1814–1816)
- **Theme**: Nepal defending its borders against British India.
- **Weapons**: Khukuri, throwing knives, improved musket (1.2s reload)
- **Enemies**: British regulars, cavalry, cannon emplacements
- **Missions**: 4
  1. Terai border — night infiltration of British camp
  2. Hill fort defence — hold position, wave-based
  3. Sugauli ambush — destroy cannon battery
  4. Last stand — boss fight: General's elite regiment + cannon
- **Boss**: Cannon emplacement + General — destroy cannon weak point, then duel

### Era 3: Modern outpost (Contemporary)
- **Theme**: Gurkha regiment defends a remote Himalayan outpost.
- **Weapons**: Khukuri, assault rifle (0.5s reload), grenades, throwing knives
- **Enemies**: Insurgents, snipers, armoured units, helicopter
- **Missions**: 4
  1. Mountain pass infiltration — sniper elimination, stealth
  2. Outpost defence — survive 5 waves with fortification
  3. Radio tower — destroy comms, timed mission
  4. Extraction — boss fight: helicopter + commander rappel
- **Boss**: Helicopter strafing → commander rappels → RPG crate spawns

---

## Enemy design

| Type | HP | Speed | Detection | Behaviour |
|---|---|---|---|---|
| Soldier | 40 | 140 px/s | 140px cone | Rush melee when in range 80px |
| Archer | 25 | 100 px/s | 160px cone | Keep distance 150px, use cover |
| Heavy | 120 | 80 px/s | 120px cone | Blocks frontal khukuri, charges slowly |
| Rifleman | 35 | 120 px/s | 200px cone | Retreat if player within 80px |
| Commander | 80 | 120 px/s | 180px cone | Buffs nearby allies, priority target |

### AI state machine

```
PATROL → (detection cone hit) → ALERT → (3s timer / confirmed) → COMBAT
COMBAT → (player leaves range 300px for 5s) → PATROL
COMBAT → (5s elapsed) → REINFORCEMENT CALL (spawns 2 soldiers)
```

Sound system:
- Gunshot: 300px alert radius
- Melee: 80px alert radius
- Stealth kill: 0px

---

## Scoring system

```
Base score per mission:
  Kill     = 100 pts
  Stealth kill = 300 pts (3× bonus)
  Combo finish = ×2 multiplier for that kill
  Lore found = +500 pts per item

Mission completion bonuses:
  No damage taken = ×1.5 total score
  All lore found  = +1,500 pts
  Under par time  = +1,000 pts

Difficulty multipliers:
  Recruit     = ×1.0
  Rifleman    = ×1.5
  Gurkha Legend = ×2.5
```

---

## Firebase schema

### Firestore saves

```
saves/{uid}_slot0
  currentEra: number           // 1–3
  currentMission: number       // 1–4
  weaponMastery: {
    khukuri: number            // 0–5
    knife: number
    musket: number
    rifle: number
    grenade: number
  }
  loreCollected: string[]      // ['era1-m1-lore1', ...]
  totalKills: number
  stealthKills: number
  difficulty: 'recruit' | 'rifleman' | 'legend'
  updatedAt: Timestamp
```

### Realtime DB leaderboard

```
scores/{uid}
  score: number
  displayName: string
  era: number
  missionsComplete: number
  stealthKillRatio: number
  ts: number

weeklyScores/{uid}
  score: number
  weekOf: string              // 'YYYY-WW'
```

---

## Cultural accuracy rules

1. Gurkha warriors are portrayed with dignity and historical respect
2. Prithvi Narayan Shah depicted as a unifier, not a conqueror
3. Anglo-Gurkha war shown from Nepali perspective — British as antagonists
4. All Nepali dialogue reviewed for accurate Devanagari script
5. The "Ayo Gorkhali!" war cry used correctly — not as background noise
6. No negative stereotypes — Gurkhas are intelligent, strategic, courageous
7. Lore items contain real historical facts, cited sources in GDD

---

## Milestones

| Week | Deliverable |
|---|---|
| 1 | Scaffold, Firebase api.ts, scene list, InputManager |
| 2 | Player entity — movement, stamina, dodge, stealth |
| 3 | CombatSystem — combos, counter, stealth kill, mastery |
| 4 | Enemy AI — 3-state machine, cone vision, sound alerts |
| 5 | Era 1 levels (4 missions + boss), GameHUD |
| 6 | Era 2 + Era 3 levels, all bosses |
| 7 | Mission complete screen, leaderboard, save/load polish |
| 8 | QA pass, player feedback, Firebase deploy, itch.io publish |
