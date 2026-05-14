// balance-additions.ts — Gurkha Legends additions to src/config/balance.ts
// [Game Designer owns this file]
// Paste these exports into your existing balance.ts

// ─── Player ───────────────────────────────────────────────────────────────────
export const PLAYER_SPEED              = 200    // px/s top-down
export const PLAYER_SPRINT_SPEED       = 320    // px/s (1.6×)
export const PLAYER_MAX_HP             = 100
export const PLAYER_MAX_STAMINA        = 100
export const PLAYER_STAMINA_REGEN      = 18     // per second when idle
export const PLAYER_DODGE_DURATION     = 300    // ms invincibility
export const PLAYER_DODGE_COOLDOWN     = 800    // ms
export const PLAYER_DODGE_STAMINA      = 25
export const PLAYER_SPRINT_STAMINA     = 15     // per second
export const PLAYER_STEALTH_RADIUS     = 80     // px — detection while crouching
export const PLAYER_NORMAL_RADIUS      = 140    // px — detection while standing

// ─── Khukuri combat ───────────────────────────────────────────────────────────
export const KHUKURI_LIGHT_DAMAGE_1    = 25
export const KHUKURI_LIGHT_DAMAGE_2    = 25
export const KHUKURI_LIGHT_DAMAGE_3    = 37     // 3rd hit +50%
export const KHUKURI_COMBO_WINDOW      = 600    // ms between hits
export const KHUKURI_HEAVY_DAMAGE      = 60
export const KHUKURI_HEAVY_CHARGE_TIME = 600    // ms hold to trigger
export const KHUKURI_HEAVY_RADIUS      = 80     // px arc hitbox
export const KHUKURI_HEAVY_STAMINA     = 20
export const KHUKURI_COUNTER_WINDOW    = 200    // ms after taking damage
export const KHUKURI_COUNTER_DAMAGE    = 50
export const KHUKURI_STEALTH_RANGE     = 60     // px max for instant kill
export const KHUKURI_SPINNING_DAMAGE   = 45     // mastery 3 unlock
export const KHUKURI_SPINNING_RADIUS   = 100    // px

// ─── Weapons ──────────────────────────────────────────────────────────────────
export const KNIFE_DAMAGE              = 40
export const KNIFE_SPEED               = 600    // px/s
export const KNIFE_RANGE               = 400    // px before despawn
export const KNIFE_BASE_PER_MISSION    = 5
export const MUSKET_DAMAGE             = 80
export const MUSKET_RELOAD_ERA1        = 2000   // ms
export const MUSKET_RELOAD_ERA2        = 1200   // ms
export const RIFLE_DAMAGE              = 65
export const RIFLE_RELOAD_ERA3         = 500    // ms
export const RIFLE_RANGE               = 600    // px
export const SHIELD_BLOCK_PERCENT      = 80     // % frontal damage blocked
export const SHIELD_BASH_DAMAGE        = 15
export const SHIELD_BASH_STAGGER       = 800    // ms stagger duration
export const SHIELD_BASH_STAMINA       = 10
export const GRENADE_DAMAGE            = 120
export const GRENADE_RADIUS            = 100    // px blast radius
export const GRENADE_FUSE              = 1500   // ms
export const GRENADE_PER_MISSION       = 2

// ─── Enemy stats ──────────────────────────────────────────────────────────────
export const ENEMY_SOLDIER_HP          = 40
export const ENEMY_SOLDIER_SPEED       = 140
export const ENEMY_SOLDIER_DAMAGE      = 12
export const ENEMY_SOLDIER_RANGE       = 80     // px melee range

export const ENEMY_ARCHER_HP           = 25
export const ENEMY_ARCHER_SPEED        = 100
export const ENEMY_ARCHER_DAMAGE       = 15
export const ENEMY_ARCHER_KEEP_DIST    = 150    // px preferred distance

export const ENEMY_HEAVY_HP            = 120
export const ENEMY_HEAVY_SPEED         = 80
export const ENEMY_HEAVY_DAMAGE        = 25

export const ENEMY_RIFLEMAN_HP         = 35
export const ENEMY_RIFLEMAN_SPEED      = 120
export const ENEMY_RIFLEMAN_DAMAGE     = 20
export const ENEMY_RIFLEMAN_RETREAT    = 80     // px — retreats if closer

export const ENEMY_COMMANDER_HP        = 80
export const ENEMY_COMMANDER_BUFF      = 0.15   // +15% speed/damage to allies

// ─── Enemy AI ─────────────────────────────────────────────────────────────────
export const AI_DETECTION_CONE_ANGLE   = 90     // degrees
export const AI_DETECTION_RANGE        = 140    // px
export const AI_ALERT_TIMER            = 3000   // ms before full combat
export const AI_REINFORCE_TIMER        = 5000   // ms in combat before calling
export const AI_DEAGGRO_RANGE          = 300    // px
export const AI_DEAGGRO_TIME           = 5000   // ms outside range to deaggro

// ─── Sound alert radii ────────────────────────────────────────────────────────
export const SOUND_GUNSHOT_RADIUS      = 300    // px
export const SOUND_MELEE_RADIUS        = 80     // px
export const SOUND_STEALTH_KILL_RADIUS = 0      // no alert

// ─── Scoring ──────────────────────────────────────────────────────────────────
export const SCORE_KILL                = 100
export const SCORE_STEALTH_KILL        = 300    // 3× bonus
export const SCORE_COMBO_MULTIPLIER    = 2.0    // per combo finish
export const SCORE_LORE_ITEM           = 500
export const SCORE_BONUS_NO_DAMAGE     = 1.5    // multiplier
export const SCORE_BONUS_ALL_LORE      = 1500
export const SCORE_BONUS_UNDER_PAR     = 1000

export const DIFFICULTY_MULT_RECRUIT   = 1.0
export const DIFFICULTY_MULT_RIFLEMAN  = 1.5
export const DIFFICULTY_MULT_LEGEND    = 2.5

// ─── Boss phases ──────────────────────────────────────────────────────────────
export const BOSS_EIC_PHASE2_HP        = 0.75  // triggers at 75% HP
export const BOSS_EIC_PHASE3_HP        = 0.25  // berserk below 25%
export const BOSS_EIC_BERSERK_SPEED    = 240   // px/s
export const BOSS_HELI_STRAFE_INTERVAL = 3000  // ms between strafing runs
export const BOSS_HELI_STRAFE_DAMAGE   = 30
