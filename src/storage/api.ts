import type { GurkhaLegendsSaveState, LeaderboardEntry, FeedbackEvent, WeaponMastery } from '../types'

const SAVE_KEY = (slot: number) => `gurkha_save_${slot}`
const LEADERBOARD_KEY = 'gurkha_leaderboard'
const MASTERY_KEY = 'gurkha_mastery'

export function saveGame(slot: number, state: GurkhaLegendsSaveState): void {
  state.updatedAt = Date.now()
  localStorage.setItem(SAVE_KEY(slot), JSON.stringify(state))
}

export function loadGame(slot: number): GurkhaLegendsSaveState | null {
  const raw = localStorage.getItem(SAVE_KEY(slot))
  if (!raw) return null
  try { return JSON.parse(raw) as GurkhaLegendsSaveState } catch { return null }
}

export function saveScore(name: string, score: number, era: number, stealthRatio: number): void {
  const board = getLeaderboard()
  board.push({ name, score, era: era as 1 | 2 | 3, stealthRatio, ts: Date.now() })
  board.sort((a, b) => b.score - a.score)
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board.slice(0, 100)))
}

export function getLeaderboard(): LeaderboardEntry[] {
  const raw = localStorage.getItem(LEADERBOARD_KEY)
  if (!raw) return []
  try { return JSON.parse(raw) as LeaderboardEntry[] } catch { return [] }
}

export function saveMastery(mastery: WeaponMastery): void {
  localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery))
}

export function loadMastery(): WeaponMastery | null {
  const raw = localStorage.getItem(MASTERY_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as WeaponMastery } catch { return null }
}

export function logFeedback(event: FeedbackEvent): void {
  const key = 'gurkha_feedback'
  const raw = localStorage.getItem(key)
  const log: FeedbackEvent[] = raw ? JSON.parse(raw) : []
  log.push(event)
  localStorage.setItem(key, JSON.stringify(log.slice(-200)))
}
