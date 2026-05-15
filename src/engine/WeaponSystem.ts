import type { InputState } from './InputManager'
import type { EraNumber } from '../types'
import type { ProjectileType } from '../entities/Projectile'
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
  // Quick slot (X key)
  quickName: string; quickAmmo: string
  // Heavy slot (C key) — empty string if not available this era
  heavyName: string; heavyAmmo: string; heavyReloadPct: number
}

export class WeaponSystem {
  private era: EraNumber
  private knifeAmmo: number
  private heavyReloadMs = 0          // ms remaining on heavy weapon reload
  private readonly heavyReloadTotal: number
  private hasHeavy: boolean
  private hasKnife: boolean

  constructor(era: EraNumber) {
    this.era = era
    this.knifeAmmo = KNIFE_BASE_PER_MISSION
    this.hasKnife = era === 2 || era === 3
    this.hasHeavy = true // musket Era 1/2, rifle Era 3

    // Reload time by era
    this.heavyReloadTotal = era === 3 ? RIFLE_RELOAD_ERA3
      : era === 2 ? MUSKET_RELOAD_ERA2 : MUSKET_RELOAD_ERA1

    this.heavyReloadMs = 0 // starts ready
  }

  update(delta: number) {
    if (this.heavyReloadMs > 0) {
      this.heavyReloadMs = Math.max(0, this.heavyReloadMs - delta)
    }
  }

  // Call each frame — returns FireResult if something was fired, null otherwise
  tryFire(
    input: InputState,
    px: number, py: number,
    aimDirX: number, aimDirY: number,
  ): FireResult | null {
    // X = quick ranged: knife (Era 2/3) or musket (Era 1, treated as quick since no knife)
    if (input.knife) {
      if (this.hasKnife && this.knifeAmmo > 0) {
        this.knifeAmmo--
        return {
          type: 'knife', x: px, y: py,
          dirX: aimDirX, dirY: aimDirY,
          damage: KNIFE_DAMAGE, speed: KNIFE_SPEED, maxRange: KNIFE_RANGE,
          isGunshot: false,
        }
      }
      // Era 1 has no knife — X fires musket
      if (!this.hasKnife && this.hasHeavy && this.heavyReloadMs <= 0) {
        return this.fireHeavy(px, py, aimDirX, aimDirY)
      }
    }

    // C = heavy ranged: musket (Era 1/2) or rifle (Era 3)
    if (input.shieldBash && this.hasHeavy && this.heavyReloadMs <= 0) {
      // Era 1 C is shield bash — only fire heavy on C for Era 2+
      if (this.era >= 2) {
        return this.fireHeavy(px, py, aimDirX, aimDirY)
      }
    }

    return null
  }

  private fireHeavy(px: number, py: number, dx: number, dy: number): FireResult {
    this.heavyReloadMs = this.heavyReloadTotal
    const isRifle = this.era === 3
    return {
      type: isRifle ? 'rifle' : 'musket',
      x: px, y: py, dirX: dx, dirY: dy,
      damage: isRifle ? RIFLE_DAMAGE : MUSKET_DAMAGE,
      speed: isRifle ? 900 : 700,
      maxRange: isRifle ? RIFLE_RANGE : 500,
      isGunshot: true,
    }
  }

  get hudInfo(): WeaponHUD {
    const reloadPct = this.heavyReloadMs > 0
      ? 1 - this.heavyReloadMs / this.heavyReloadTotal : 1

    const heavyName = this.era === 3 ? 'Rifle' : 'Musket'
    const heavyAmmo = this.heavyReloadMs > 0
      ? `Reloading ${Math.round(reloadPct * 100)}%` : 'Ready'

    if (!this.hasKnife) {
      // Era 1: X = musket
      return {
        quickName: 'Musket', quickAmmo: heavyAmmo,
        heavyName: '', heavyAmmo: '', heavyReloadPct: reloadPct,
      }
    }

    return {
      quickName: 'Knife', quickAmmo: `${this.knifeAmmo}`,
      heavyName, heavyAmmo, heavyReloadPct: reloadPct,
    }
  }
}
