import type { WeaponMastery } from '../types'

export type MasteryWeapon = keyof WeaponMastery

// Cumulative hits required to reach each level (index = target level)
const THRESHOLDS = [0, 15, 40, 80, 150, 280] as const
const MAX_LEVEL = 5

// Per-level bonuses
const DAMAGE_BONUS_PER_LEVEL  = 0.08  // +8% damage per level → +40% at L5
const RELOAD_REDUCE_PER_LEVEL = 0.08  // -8% reload per level  → ×0.60 at L5

export class WeaponMasterySystem {
  private hits: Record<MasteryWeapon, number>
  private readonly startingLevels: WeaponMastery

  constructor(saved?: Partial<WeaponMastery>) {
    // Restore hit count to the floor of the saved level's threshold
    const toHits = (level = 0) => THRESHOLDS[Math.min(level, MAX_LEVEL)]
    this.hits = {
      khukuri: toHits(saved?.khukuri),
      knife:   toHits(saved?.knife),
      musket:  toHits(saved?.musket),
      rifle:   toHits(saved?.rifle),
      grenade: toHits(saved?.grenade),
    }
    this.startingLevels = this.serialize()
  }

  // Returns true if the hit caused a level-up
  registerHit(weapon: MasteryWeapon): boolean {
    const before = this.getLevel(weapon)
    this.hits[weapon]++
    return this.getLevel(weapon) > before
  }

  getLevel(weapon: MasteryWeapon): number {
    const h = this.hits[weapon]
    let level = 0
    for (let i = 1; i <= MAX_LEVEL; i++) {
      if (h >= THRESHOLDS[i]) level = i
      else break
    }
    return level
  }

  // Multiplier applied to outgoing damage (1.0–1.40)
  getDamageMultiplier(weapon: MasteryWeapon): number {
    return 1 + this.getLevel(weapon) * DAMAGE_BONUS_PER_LEVEL
  }

  // Multiplier applied to reload time (1.0–0.60) — lower is faster
  getReloadMultiplier(weapon: MasteryWeapon): number {
    return 1 - this.getLevel(weapon) * RELOAD_REDUCE_PER_LEVEL
  }

  // Extra knife ammo: +1 every 2 mastery levels
  getAmmoBonus(weapon: MasteryWeapon): number {
    return Math.floor(this.getLevel(weapon) / 2)
  }

  // Hit progress toward next level: 0.0–1.0
  getLevelProgress(weapon: MasteryWeapon): number {
    const level = this.getLevel(weapon)
    if (level >= MAX_LEVEL) return 1
    const lo = THRESHOLDS[level]
    const hi = THRESHOLDS[level + 1]
    return (this.hits[weapon] - lo) / (hi - lo)
  }

  // Current levels as a saveable object
  serialize(): WeaponMastery {
    return {
      khukuri: this.getLevel('khukuri'),
      knife:   this.getLevel('knife'),
      musket:  this.getLevel('musket'),
      rifle:   this.getLevel('rifle'),
      grenade: this.getLevel('grenade'),
    }
  }

  // Weapons that leveled up this session and by how much
  getMasteryGained(): Partial<WeaponMastery> {
    const current = this.serialize()
    const gained: Partial<WeaponMastery> = {}
    for (const key of Object.keys(current) as MasteryWeapon[]) {
      const delta = current[key] - this.startingLevels[key]
      if (delta > 0) gained[key] = delta
    }
    return gained
  }
}
