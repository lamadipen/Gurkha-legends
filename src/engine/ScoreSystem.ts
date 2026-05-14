import { SCORE_KILL, SCORE_STEALTH_KILL, SCORE_COMBO_MULTIPLIER, SCORE_LORE_ITEM,
  DIFFICULTY_MULT_RECRUIT, DIFFICULTY_MULT_RIFLEMAN, DIFFICULTY_MULT_LEGEND } from '../config/balance'
import type { Difficulty } from '../types'

export class ScoreSystem {
  private _score = 0
  private _kills = 0
  private _stealthKills = 0
  private readonly diffMult: number

  constructor(difficulty: Difficulty) {
    this.diffMult = difficulty === 'legend' ? DIFFICULTY_MULT_LEGEND
      : difficulty === 'rifleman' ? DIFFICULTY_MULT_RIFLEMAN : DIFFICULTY_MULT_RECRUIT
  }

  get score() { return this._score }
  get kills() { return this._kills }
  get stealthKills() { return this._stealthKills }

  registerKill(stealth: boolean, comboFinish: boolean) {
    this._kills++
    let pts = stealth ? SCORE_STEALTH_KILL : SCORE_KILL
    if (comboFinish) pts *= SCORE_COMBO_MULTIPLIER
    this._score += Math.floor(pts * this.diffMult)
    if (stealth) this._stealthKills++
  }

  registerLore() {
    this._score += SCORE_LORE_ITEM
  }
}
