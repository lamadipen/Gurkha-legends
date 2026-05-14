import type { EraNumber, WeaponType } from '../types'

export const ERA_WEAPONS: Record<EraNumber, WeaponType[]> = {
  1: ['khukuri', 'shield', 'musket', 'spear'],
  2: ['khukuri', 'knife', 'musket'],
  3: ['khukuri', 'knife', 'rifle', 'grenade'],
}
