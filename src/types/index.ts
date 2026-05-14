export type Difficulty = 'recruit' | 'rifleman' | 'legend'
export type WeaponType = 'khukuri' | 'knife' | 'musket' | 'rifle' | 'grenade' | 'shield' | 'spear'
export type EraNumber = 1 | 2 | 3
export type MissionNumber = 1 | 2 | 3 | 4

export interface WeaponMastery {
  khukuri: number
  knife: number
  musket: number
  rifle: number
  grenade: number
}

export interface GurkhaLegendsSaveState {
  currentEra: EraNumber
  currentMission: MissionNumber
  weaponMastery: WeaponMastery
  loreCollected: string[]
  totalKills: number
  stealthKills: number
  difficulty: Difficulty
  updatedAt: number
}

export interface LeaderboardEntry {
  name: string
  score: number
  era: EraNumber
  stealthRatio: number
  ts: number
}

export interface MissionResult {
  score: number
  kills: number
  stealthKills: number
  noHits: boolean
  allLore: boolean
  underPar: boolean
  timeTaken: number
  masteryGained: Partial<WeaponMastery>
}

export interface FeedbackEvent {
  type: string
  payload: Record<string, unknown>
  ts: number
}
