import { PLAYER_MAX_STAMINA, PLAYER_STAMINA_REGEN } from '../config/balance'

export class StaminaSystem {
  private _stamina = PLAYER_MAX_STAMINA
  private regenBlocked = false

  get value() { return this._stamina }

  drain(amount: number): boolean {
    if (this._stamina < amount) return false
    this._stamina = Math.max(0, this._stamina - amount)
    this.regenBlocked = true
    return true
  }

  drainPerSec(amount: number, delta: number): boolean {
    const cost = amount * (delta / 1000)
    if (this._stamina < cost) return false
    this._stamina = Math.max(0, this._stamina - cost)
    this.regenBlocked = true
    return true
  }

  update(delta: number, spending: boolean) {
    if (spending) {
      this.regenBlocked = true
      return
    }
    // Allow regen after 500ms of not spending
    if (this.regenBlocked) {
      this.regenBlocked = false
      return
    }
    this._stamina = Math.min(PLAYER_MAX_STAMINA, this._stamina + PLAYER_STAMINA_REGEN * (delta / 1000))
  }

  get isEmpty() { return this._stamina <= 0 }
}
