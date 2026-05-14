# CLAUDE.md override — Gurkha Legends

> Append this to your root CLAUDE.md when working on Gurkha Legends.
> Overrides generic settings with game-specific context.

---

## Active game

- **Title**: Gurkha Legends (गोर्खा लिजेन्ड्स)
- **Genre**: Top-down action RPG
- **Engine**: Phaser 3 (top-down, arcade physics, gravity: 0)
- **GDD**: `docs/GDD.md`
- **Balance**: `src/config/balance.ts` (see balance-additions.ts for all values)
- **Milestone**: Pre-production

---

## Key systems (all agents read this)

| System | File | Description |
|---|---|---|
| CombatSystem | `src/engine/CombatSystem.ts` | Khukuri combos, counter-strike, stealth kill, mastery tracking |
| StaminaSystem | `src/engine/StaminaSystem.ts` | 0–100 bar, drain on actions, regen when idle |
| EnemyAI | `src/entities/Enemy.ts` | 3-state (patrol/alert/combat), cone vision, sound alerts |
| WeaponMastery | `src/engine/WeaponMasterySystem.ts` | Hit tracking per weapon, 0–5 levels, persists to Firebase |
| ScoreSystem | `src/engine/ScoreSystem.ts` | Kill points, stealth bonus, combo multiplier, difficulty mult |

---

## Scene structure

```
BootScene        → PreloadScene → MainMenuScene
MainMenuScene    → EraSelectScene (3 eras)
EraSelectScene   → MissionBriefScene (mission # + objective)
MissionBriefScene→ GameScene (top-down map)
GameScene        → MissionCompleteScene (on objective met)
GameScene        → GameOverScene (on player death)
MissionCompleteScene → EraSelectScene or LeaderboardScene
```

---

## Era-specific weapon availability

| Era | Available weapons |
|---|---|
| 1 — Prithvi (1743–1775) | Khukuri, Shield, Musket (2s reload), Spear throw |
| 2 — Anglo-Gurkha (1814–1816) | Khukuri, Throwing knives, Musket (1.2s reload) |
| 3 — Modern | Khukuri, Throwing knives, Rifle (0.5s reload), Grenades |

Era is passed to GameScene via `scene.start('GameScene', { era, mission })`.
Weapon availability is determined by `WeaponLoadout.getForEra(era)` in `src/config/weaponLoadouts.ts`.

---

## Cultural accuracy rules (all agents must follow)

1. Gurkha warriors portrayed with dignity — intelligent, strategic, courageous
2. Prithvi Narayan Shah = unifier of Nepal, not a conqueror
3. Anglo-Gurkha war shown from Nepali perspective — British are antagonists
4. All Nepali text must use correct Devanagari — do not approximate
5. "Ayo Gorkhali!" (आयो गोर्खाली!) is the battle cry — use it correctly, sparingly
6. Lore items contain verified historical facts — note source in code comments
7. No negative stereotypes of any group depicted

---

## Firebase API (other agents call these — never call SDK directly)

```typescript
saveGame(uid, slot, state: GurkhaLegendsSaveState)
loadGame(uid, slot): GurkhaLegendsSaveState | null
submitScore(uid, name, score, era, stealthRatio)
watchLeaderboard(limit, cb)
watchWeeklyLeaderboard(limit, cb)
logFeedback(event: FeedbackEvent)
```

All in `src/firebase/api.ts`.
