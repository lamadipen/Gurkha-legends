import type { InputState } from './InputManager'
import type { EraNumber } from '../types'
import type { ProjectileType } from '../entities/Projectile'
import type { WeaponMasterySystem } from './WeaponMasterySystem'
import {
  KNIFE_DAMAGE, KNIFE_SPEED, KNIFE_RANGE, KNIFE_BASE_PER_MISSION,
  MUSKET_DAMAGE, MUSKET_RELOAD_ERA1, MUSKET_RELOAD_ERA2,
  RIFLE_DAMAGE, RIFLE_RELOAD_ERA3, RIFLE_RANGE,
} from '../config/balance'

export interface FireResult {
  type: ProjectileType
  x: number; y: number
  dirX: number; dirY: number
  damage: number; speed: number; maxRange: number
  isGunshot: boolean
}

export interface WeaponHUD {
  quickName: string; quickAmmo: string; quickLevel: number
  heavyName: string; heavyAmmo: string; heavyReloadPct: number; heavyLevel: number
}

export class WeaponSystem {
  private era: EraNumber
  private mastery: WeaponMasterySystem
  private knifeAmmo: number
  private heavyReloadMs = 0
  private readonly heavyReloadBase: number
  private readonly hasHeavy: boolean
  private readonly hasKnife: boolean
  private readonly heavyType: 'musket' | 'rifle'

  constructor(era: EraNumber, mastery: WeaponMasterySystem) {
    this.era = era
    this.mastery = mastery
    this.hasKnife = era === 2 || era === 3
    this.hasHeavy = true
    this.heavyType = era === 3 ? 'rifle' : 'musket'
    this.heavyReloadBase = era === 3 ? RIFLE_RELOAD_ERA3
      : era === 2 ? MUSKET_RELOAD_ERA2 : MUSKET_RELOAD_ERA1

    // Knife ammo scaled by mastery
    this.knifeAmmo = KNIFE_BASE_PER_MISSION + mastery.getAmmoBonus('knife')
    this.heavyReloadMs = 0
  }

  update(delta: number) {
    if (this.heavyReloadMs > 0) {
      this.heavyReloadMs = Math.max(0, this.heavyReloadMs - delta)
    }
  }

  tryFire(
    input: InputState,
    px: number, py: number,
    aimDirX: number, aimDirY: number,
  ): FireResult | null {
    // X always fires the ranged weapon (musket / rifle depending on era)
    if (input.knife && this.hasHeavy && this.heavyReloadMs <= 0) {
      return this.fireHeavy(px, py, aimDirX, aimDirY)
    }

    // C throws knife (Era 2/3)
    if (input.shieldBash && this.hasKnife && this.knifeAmmo > 0) {
      this.knifeAmmo--
      return {
        type: 'knife', x: px, y: py,
        dirX: aimDirX, dirY: aimDirY,
        damage: KNIFE_DAMAGE,
        speed: KNIFE_SPEED, maxRange: KNIFE_RANGE,
        isGunshot: false,
      }
    }

    return null
  }

  private fireHeavy(px: number, py: number, dx: number, dy: number): FireResult {
    // Mastery reduces reload time
    const reloadMult = this.mastery.getReloadMultiplier(this.heavyType)
    this.heavyReloadMs = this.heavyReloadBase * reloadMult

    return {
      type: this.heavyType,
      x: px, y: py, dirX: dx, dirY: dy,
      damage: this.heavyType === 'rifle' ? RIFLE_DAMAGE : MUSKET_DAMAGE,
      speed: this.heavyType === 'rifle' ? 900 : 700,
      maxRange: this.heavyType === 'rifle' ? RIFLE_RANGE : 500,
      isGunshot: true,
    }
  }

  get heavyWeaponType() { return this.heavyType }

  get hudInfo(): WeaponHUD {
    const reloadPct = this.heavyReloadMs > 0
      ? 1 - this.heavyReloadMs / (this.heavyReloadBase * this.mastery.getReloadMultiplier(this.heavyType))
      : 1
    const heavyAmmo = this.heavyReloadMs > 0
      ? `${Math.round(reloadPct * 100)}%` : 'Ready'

    if (!this.hasKnife) {
      return {
        quickName: 'Musket', quickAmmo: heavyAmmo,
        quickLevel: this.mastery.getLevel('musket'),
        heavyName: '', heavyAmmo: '', heavyReloadPct: reloadPct, heavyLevel: 0,
      }
    }
    return {
      quickName: 'Knife', quickAmmo: `${this.knifeAmmo}`,
      quickLevel: this.mastery.getLevel('knife'),
      heavyName: this.heavyType === 'rifle' ? 'Rifle' : 'Musket',
      heavyAmmo,
      heavyReloadPct: reloadPct,
      heavyLevel: this.mastery.getLevel(this.heavyType),
    }
  }
}
