// ─── Player ───────────────────────────────────────────────────────────────────
export const PLAYER_SPEED              = 200
export const PLAYER_SPRINT_SPEED       = 320
export const PLAYER_MAX_HP             = 100
export const PLAYER_MAX_STAMINA        = 100
export const PLAYER_STAMINA_REGEN      = 18
export const PLAYER_DODGE_DURATION     = 300
export const PLAYER_DODGE_COOLDOWN     = 800
export const PLAYER_DODGE_STAMINA      = 25
export const PLAYER_SPRINT_STAMINA     = 15
export const PLAYER_STEALTH_RADIUS     = 80
export const PLAYER_NORMAL_RADIUS      = 140

// ─── Khukuri combat ───────────────────────────────────────────────────────────
export const KHUKURI_LIGHT_DAMAGE_1    = 25
export const KHUKURI_LIGHT_DAMAGE_2    = 25
export const KHUKURI_LIGHT_DAMAGE_3    = 37
export const KHUKURI_COMBO_WINDOW      = 600
export const KHUKURI_HEAVY_DAMAGE      = 60
export const KHUKURI_HEAVY_CHARGE_TIME = 600
export const KHUKURI_HEAVY_RADIUS      = 80
export const KHUKURI_HEAVY_STAMINA     = 20
export const KHUKURI_COUNTER_WINDOW    = 200
export const KHUKURI_COUNTER_DAMAGE    = 50
export const KHUKURI_STEALTH_RANGE     = 60
export const KHUKURI_SPINNING_DAMAGE   = 45
export const KHUKURI_SPINNING_RADIUS   = 100

// ─── Weapons ──────────────────────────────────────────────────────────────────
export const KNIFE_DAMAGE              = 40
export const KNIFE_SPEED               = 600
export const KNIFE_RANGE               = 400
export const KNIFE_BASE_PER_MISSION    = 5
export const MUSKET_DAMAGE             = 80
export const MUSKET_RELOAD_ERA1        = 2000
export const MUSKET_RELOAD_ERA2        = 1200
export const RIFLE_DAMAGE              = 65
export const RIFLE_RELOAD_ERA3         = 500
export const RIFLE_RANGE               = 600
export const SHIELD_BLOCK_PERCENT      = 80
export const SHIELD_BASH_DAMAGE        = 15
export const SHIELD_BASH_STAGGER       = 800
export const SHIELD_BASH_STAMINA       = 10
export const GRENADE_DAMAGE            = 120
export const GRENADE_RADIUS            = 100
export const GRENADE_FUSE              = 1500
export const GRENADE_PER_MISSION       = 2

// ─── Enemy stats ──────────────────────────────────────────────────────────────
export const ENEMY_SOLDIER_HP          = 40
export const ENEMY_SOLDIER_SPEED       = 140
export const ENEMY_SOLDIER_DAMAGE      = 12
export const ENEMY_SOLDIER_RANGE       = 80

export const ENEMY_ARCHER_HP           = 25
export const ENEMY_ARCHER_SPEED        = 100
export const ENEMY_ARCHER_DAMAGE       = 15
export const ENEMY_ARCHER_KEEP_DIST    = 150

export const ENEMY_HEAVY_HP            = 120
export const ENEMY_HEAVY_SPEED         = 80
export const ENEMY_HEAVY_DAMAGE        = 25

export const ENEMY_RIFLEMAN_HP         = 35
export const ENEMY_RIFLEMAN_SPEED      = 120
export const ENEMY_RIFLEMAN_DAMAGE     = 20
export const ENEMY_RIFLEMAN_RETREAT    = 80

export const ENEMY_COMMANDER_HP        = 80
export const ENEMY_COMMANDER_BUFF      = 0.15

// ─── Enemy AI ─────────────────────────────────────────────────────────────────
export const AI_DETECTION_CONE_ANGLE   = 90
export const AI_DETECTION_RANGE        = 140
export const AI_ALERT_TIMER            = 3000
export const AI_REINFORCE_TIMER        = 5000
export const AI_DEAGGRO_RANGE          = 300
export const AI_DEAGGRO_TIME           = 5000

// ─── Sound alert radii ────────────────────────────────────────────────────────
export const SOUND_GUNSHOT_RADIUS      = 300
export const SOUND_MELEE_RADIUS        = 80
export const SOUND_STEALTH_KILL_RADIUS = 0

// ─── Scoring ──────────────────────────────────────────────────────────────────
export const SCORE_KILL                = 100
export const SCORE_STEALTH_KILL        = 300
export const SCORE_COMBO_MULTIPLIER    = 2.0
export const SCORE_LORE_ITEM           = 500
export const SCORE_BONUS_NO_DAMAGE     = 1.5
export const SCORE_BONUS_ALL_LORE      = 1500
export const SCORE_BONUS_UNDER_PAR     = 1000

export const DIFFICULTY_MULT_RECRUIT   = 1.0
export const DIFFICULTY_MULT_RIFLEMAN  = 1.5
export const DIFFICULTY_MULT_LEGEND    = 2.5

// ─── Boss phases ──────────────────────────────────────────────────────────────
export const BOSS_EIC_PHASE2_HP        = 0.75
export const BOSS_EIC_PHASE3_HP        = 0.25
export const BOSS_EIC_BERSERK_SPEED    = 240
export const BOSS_HELI_STRAFE_INTERVAL = 3000
export const BOSS_HELI_STRAFE_DAMAGE   = 30
