// Generates all character sprite textures procedurally using HTML5 Canvas.
// Called once in PreloadScene before GameScene starts.

import Phaser from 'phaser'
import type { EnemyType } from './Enemy'

const FW = 32  // frame width
const FH = 32  // frame height

type Ctx = CanvasRenderingContext2D

// ─── Canvas helpers ────────────────────────────────────────────────────────────

const fr = (ctx: Ctx, col: string, x: number, y: number, w: number, h: number) => {
  if (w <= 0 || h <= 0) return
  ctx.fillStyle = col
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0)
}

const fc = (ctx: Ctx, col: string, cx: number, cy: number, rad: number) => {
  ctx.fillStyle = col
  ctx.beginPath()
  ctx.arc(cx, cy, rad, 0, Math.PI * 2)
  ctx.fill()
}

const dropShadow = (ctx: Ctx, ox: number, scale = 1.0) => {
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(ox + 16, 30, 10 * scale, 2.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ─── Player palette (Bir Bahadur — olive Gurkha uniform + topi) ───────────────

const P = {
  skin:    '#c07840',
  skinDk:  '#8a5020',
  hat:     '#1c1a10',
  hatBd:   '#2e2516',
  unif:    '#3a5a2a',
  unifL:   '#527a3a',
  unifD:   '#263d1a',
  belt:    '#5a3010',
  buckle:  '#c8960c',
  trous:   '#2e3a20',
  boot:    '#1a1208',
  blade:   '#d4c870',
  bladeHi: '#f0e8c0',
}

// ─── Enemy palettes ────────────────────────────────────────────────────────────

interface EnemyPal {
  body: string; bodyL: string; bodyD: string
  hat: string; skin: string; weapon: string; trous: string; boot: string
}

const EP: Record<EnemyType, EnemyPal> = {
  soldier:   { body:'#cc2222', bodyL:'#e04444', bodyD:'#881414', hat:'#222222', skin:'#c07840', weapon:'#999988', trous:'#333333', boot:'#111111' },
  archer:    { body:'#7a5530', bodyL:'#9a7550', bodyD:'#5a3510', hat:'#3a2010', skin:'#c07840', weapon:'#a0702a', trous:'#3a3020', boot:'#1e1408' },
  heavy:     { body:'#442222', bodyL:'#664444', bodyD:'#221010', hat:'#3a3a3a', skin:'#c07840', weapon:'#7788aa', trous:'#222222', boot:'#181818' },
  rifleman:  { body:'#445577', bodyL:'#6677aa', bodyD:'#223355', hat:'#223344', skin:'#c07840', weapon:'#887766', trous:'#334455', boot:'#112233' },
  commander: { body:'#7a1a2a', bodyL:'#9a3a4a', bodyD:'#4a0a1a', hat:'#1a0010', skin:'#c07840', weapon:'#c8960c', trous:'#4a1020', boot:'#0e0006' },
}

// ─── Walk cycle leg offsets (phase → [lx,ly,lh, rx,ry,rh]) ───────────────────
//   phase 0/2 = neutral, phase 1 = right foot fwd, phase 3 = left foot fwd

const LEG_PHASES = [
  [10, 24, 6,  17, 24, 6],  // 0 neutral-A
  [10, 26, 4,  17, 22, 8],  // 1 right fwd
  [10, 23, 7,  17, 23, 7],  // 2 neutral-B (bob peak)
  [10, 22, 8,  17, 26, 4],  // 3 left fwd
] as const

// arm swing: right arm offset (left arm is opposite)
const ARM_SWING = [0, -1, 0, 1] as const

// ─── Shared drawing primitives ─────────────────────────────────────────────────

function drawLegs(ctx: Ctx, ox: number, phase: number, trous: string, boot: string, bob: number) {
  const [lx, ly, lh, rx, ry, rh] = LEG_PHASES[phase]
  fr(ctx, trous, ox+lx, ly+bob, 5, lh)
  fr(ctx, boot,  ox+lx, ly+lh+bob-2, 5, 2)
  fr(ctx, trous, ox+rx, ry+bob, 5, rh)
  fr(ctx, boot,  ox+rx, ry+rh+bob-2, 5, 2)
}

function drawTorso(ctx: Ctx, ox: number, body: string, bodyL: string, bodyD: string, bob: number) {
  fr(ctx, bodyD, ox+9,  15+bob, 14, 10)
  fr(ctx, body,  ox+9,  14+bob, 12, 10)
  fr(ctx, bodyL, ox+9,  14+bob, 12, 3)
}

function drawHead(ctx: Ctx, ox: number, skin: string, skinDk: string, bob: number, face: boolean) {
  fc(ctx, skinDk, ox+16, 9+bob, 7)
  fc(ctx, skin,   ox+16, 8+bob, 6.5)
  if (face) {
    fr(ctx, '#201000', ox+12, 9+bob, 2, 2)
    fr(ctx, '#201000', ox+18, 9+bob, 2, 2)
    fr(ctx, '#6a3820', ox+13, 12+bob, 6, 1)
  }
}

// ─── Player: DOWN-facing ───────────────────────────────────────────────────────

function drawPlayerDown(ctx: Ctx, ox: number, phase: number, breath = 0) {
  const bob = phase === 2 ? -1 : breath
  dropShadow(ctx, ox)
  drawLegs(ctx, ox, phase, P.trous, P.boot, bob)

  const sw = ARM_SWING[phase]
  // Left arm
  fr(ctx, P.unifD, ox+5,  16-sw+bob, 4, 9)
  fr(ctx, P.skin,  ox+5,  24-sw+bob, 4, 3)
  // Right arm + khukuri
  fr(ctx, P.unifD, ox+23, 16+sw+bob, 4, 9)
  fr(ctx, P.skin,  ox+23, 24+sw+bob, 4, 3)
  fr(ctx, P.blade,   ox+22, 23+sw+bob, 7, 2)
  fr(ctx, P.bladeHi, ox+27, 22+sw+bob, 2, 1)

  drawTorso(ctx, ox, P.unif, P.unifL, P.unifD, bob)
  fr(ctx, P.belt,   ox+9,  21+bob, 12, 2)
  fr(ctx, P.buckle, ox+14, 21+bob, 4, 2)

  drawHead(ctx, ox, P.skin, P.skinDk, bob, true)
  fr(ctx, P.hat,  ox+9,  1+bob, 14, 8)
  fr(ctx, P.hatBd, ox+8, 7+bob, 16, 2)
}

// ─── Player: UP-facing ────────────────────────────────────────────────────────

function drawPlayerUp(ctx: Ctx, ox: number, phase: number, breath = 0) {
  const bob = phase === 2 ? -1 : breath
  dropShadow(ctx, ox)
  drawLegs(ctx, ox, phase, P.trous, P.boot, bob)

  const sw = ARM_SWING[phase]
  fr(ctx, P.unifD, ox+5,  16-sw+bob, 4, 9)
  fr(ctx, P.skin,  ox+5,  24-sw+bob, 4, 3)
  fr(ctx, P.unifD, ox+23, 16+sw+bob, 4, 9)
  fr(ctx, P.skin,  ox+23, 24+sw+bob, 4, 3)

  drawTorso(ctx, ox, P.unif, P.unifL, P.unifD, bob)
  fr(ctx, P.belt, ox+9, 21+bob, 12, 2)

  // Back of head — no face
  fc(ctx, P.skinDk, ox+16, 9+bob, 7)
  fc(ctx, P.skin,   ox+16, 8+bob, 6.5)
  fr(ctx, '#1c1408', ox+11, 14+bob, 10, 2) // neckline hair

  fr(ctx, P.hat,  ox+9,  1+bob, 14, 8)
  fr(ctx, P.hatBd, ox+8, 7+bob, 16, 2)
}

// ─── Player: LEFT-facing (right = flipX of this) ──────────────────────────────

function drawPlayerLeft(ctx: Ctx, ox: number, phase: number, breath = 0) {
  const bob = phase === 2 ? -1 : breath
  dropShadow(ctx, ox)

  // Back leg (darker, partially obscured)
  const bleg = [24, 22, 27, 21] as const  // bob offset per phase for back leg
  fr(ctx, P.unifD, ox+16, bleg[phase]+bob, 5, phase===1||phase===3 ? (phase===1?5:8) : 6)
  fr(ctx, P.boot,  ox+16, bleg[phase]+bob+4, 5, 2)

  // Body (slightly narrower, side view)
  fr(ctx, P.unifD, ox+9,  15+bob, 13, 10)
  fr(ctx, P.unif,  ox+9,  14+bob, 11, 10)
  fr(ctx, P.unifL, ox+9,  14+bob, 11, 3)
  fr(ctx, P.belt,  ox+9,  21+bob, 11, 2)

  // Back arm (trailing, darker)
  fr(ctx, P.unifD, ox+17, 16+bob, 4, 7)

  // Front leg (leading, brighter)
  const fleg = [24, 21, 23, 26] as const
  const flh  = [6,   9,  7,  4] as const
  fr(ctx, P.unif, ox+9, fleg[phase]+bob, 5, flh[phase])
  fr(ctx, P.boot, ox+9, fleg[phase]+flh[phase]+bob-2, 5, 2)

  // Front arm + khukuri
  const asw = [0, 2, 0, -2] as const
  fr(ctx, P.unifD, ox+3, 16+asw[phase]+bob, 5, 9)
  fr(ctx, P.unif,  ox+4, 15+asw[phase]+bob, 4, 9)
  fr(ctx, P.skin,  ox+4, 23+asw[phase]+bob, 4, 3)
  fr(ctx, P.blade,   ox+0, 23+asw[phase]+bob, 6, 2)
  fr(ctx, P.bladeHi, ox+0, 22+asw[phase]+bob, 2, 1)

  // Head (side profile — offset left)
  fc(ctx, P.skinDk, ox+14, 9+bob, 7)
  fc(ctx, P.skin,   ox+13, 8+bob, 6.5)
  fr(ctx, '#201000', ox+8, 9+bob, 2, 2)   // eye
  fr(ctx, '#6a3820', ox+8, 12+bob, 3, 1)  // mouth

  fr(ctx, P.hat,  ox+6,  1+bob, 13, 8)
  fr(ctx, P.hatBd, ox+5, 7+bob, 14, 2)
}

// ─── Player: ATTACK frames ────────────────────────────────────────────────────

// slashArc: draws the curved khukuri trail using a quadratic bezier stroke
function slashArc(ctx: Ctx, ox: number, alpha: number, width: number, color: string,
  x1: number, y1: number, cpx: number, cpy: number, x2: number, y2: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(ox+x1, y1)
  ctx.quadraticCurveTo(ox+cpx, cpy, ox+x2, y2)
  ctx.stroke()
  ctx.restore()
}

// impactBurst: layered radial glow at the blade tip
function impactBurst(ctx: Ctx, ox: number, cx: number, cy: number, alpha: number) {
  ctx.save()
  // Outer soft halo
  ctx.globalAlpha = alpha * 0.22; ctx.fillStyle = '#ff8800'
  ctx.beginPath(); ctx.arc(ox+cx, cy, 14, 0, Math.PI*2); ctx.fill()
  // Mid ring
  ctx.globalAlpha = alpha * 0.45; ctx.fillStyle = '#ffcc44'
  ctx.beginPath(); ctx.arc(ox+cx, cy, 8, 0, Math.PI*2); ctx.fill()
  // Core flash
  ctx.globalAlpha = alpha * 0.85; ctx.fillStyle = '#fffae0'
  ctx.beginPath(); ctx.arc(ox+cx, cy, 4, 0, Math.PI*2); ctx.fill()
  // Bright centre pixel
  ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(ox+cx, cy, 1.5, 0, Math.PI*2); ctx.fill()
  // Radial spark lines
  ctx.strokeStyle = '#ffee88'; ctx.lineWidth = 1; ctx.globalAlpha = alpha * 0.75
  const dirs = [[1,0],[0.7,0.7],[0,1],[-0.7,0.7],[1,-0.7],[0,-1]]
  for (const [dx, dy] of dirs) {
    ctx.beginPath()
    ctx.moveTo(ox+cx + dx*5, cy + dy*5)
    ctx.lineTo(ox+cx + dx*13, cy + dy*13)
    ctx.stroke()
  }
  ctx.restore()
}

// Down-facing attack — arc sweeps upper-right → lower-right, all coords within [0,31]
function drawPlayerAttack(ctx: Ctx, ox: number, frame: number) {
  dropShadow(ctx, ox)
  fr(ctx, P.trous, ox+9,  24, 5, 6); fr(ctx, P.boot, ox+9,  29, 5, 2)
  fr(ctx, P.trous, ox+18, 24, 5, 6); fr(ctx, P.boot, ox+18, 29, 5, 2)

  switch (frame) {
    case 0: // Wind-up — blade raised, no arc yet
      fr(ctx, P.unifD, ox+5,  15, 4, 9); fr(ctx, P.skin, ox+5,  23, 4, 3)
      fr(ctx, P.unifD, ox+22, 8,  5, 11); fr(ctx, P.skin, ox+22, 18, 4, 3)
      fr(ctx, P.blade,   ox+22, 1, 3, 10)
      fr(ctx, P.bladeHi, ox+22, 1, 1, 4)
      ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#ffee88'
      ctx.beginPath(); ctx.arc(ox+24, 3, 5, 0, Math.PI*2); ctx.fill(); ctx.restore()
      break

    case 1: // Arc starts — tip at 1 o'clock, cp clamped to x=31
      fr(ctx, P.unifD, ox+4,  14, 4, 9); fr(ctx, P.skin, ox+4,  22, 4, 3)
      fr(ctx, P.unifD, ox+23, 9,  5, 10); fr(ctx, P.skin, ox+25, 18, 4, 3)
      fr(ctx, P.blade,   ox+21, 4, 9, 2)
      fr(ctx, P.bladeHi, ox+21, 3, 4, 1)
      slashArc(ctx, ox, 0.65, 3, '#ffee88', 20, 4, 31,  8, 29, 15)
      slashArc(ctx, ox, 0.90, 1, '#ffffff', 21, 5, 30,  9, 28, 14)
      ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#ffcc44'
      ctx.beginPath(); ctx.arc(ox+28, 15, 4, 0, Math.PI*2); ctx.fill(); ctx.restore()
      break

    case 2: // Mid-swing — full arc visible, cp at right edge
      fr(ctx, P.unifD, ox+5,  16, 4, 9); fr(ctx, P.skin, ox+5,  24, 4, 3)
      fr(ctx, P.unifD, ox+22, 14, 6, 9); fr(ctx, P.skin, ox+26, 22, 4, 3)
      fr(ctx, P.blade,   ox+24, 21, 7, 2)
      fr(ctx, P.bladeHi, ox+29, 20, 2, 1)
      slashArc(ctx, ox, 0.50, 6, '#ff8800', 19, 3, 31, 12, 27, 26)
      slashArc(ctx, ox, 0.78, 4, '#ffcc44', 20, 4, 31, 13, 26, 25)
      slashArc(ctx, ox, 0.95, 2, '#fffae0', 21, 5, 30, 14, 25, 24)
      ctx.save(); ctx.globalAlpha = 0.50; ctx.fillStyle = '#ffdd88'
      ctx.beginPath(); ctx.arc(ox+26, 25, 5, 0, Math.PI*2); ctx.fill(); ctx.restore()
      break

    case 3: // IMPACT — blade at 5 o'clock, burst at tip
      fr(ctx, P.unifD, ox+5,  16, 4, 9); fr(ctx, P.skin, ox+5,  24, 4, 3)
      fr(ctx, P.unifD, ox+21, 17, 6, 8); fr(ctx, P.skin, ox+25, 24, 4, 3)
      fr(ctx, P.blade,   ox+22, 23, 8, 2)
      fr(ctx, P.bladeHi, ox+28, 22, 3, 1)
      slashArc(ctx, ox, 0.40, 7, '#ff6600', 18, 2, 31, 13, 26, 29)
      slashArc(ctx, ox, 0.68, 5, '#ffaa22', 19, 3, 31, 14, 25, 28)
      slashArc(ctx, ox, 0.90, 2, '#ffee88', 20, 4, 30, 15, 24, 27)
      impactBurst(ctx, ox, 27, 27, 1.0)
      break

    case 4: // Follow-through — arm low, ghost arc fading
      fr(ctx, P.unifD, ox+5,  16, 4, 9); fr(ctx, P.skin, ox+5,  24, 4, 3)
      fr(ctx, P.unifD, ox+21, 20, 5, 8); fr(ctx, P.skin, ox+23, 27, 4, 3)
      fr(ctx, P.blade, ox+20, 28, 9, 2)
      slashArc(ctx, ox, 0.18, 5, '#ffaa22', 19, 3, 30, 13, 25, 28)
      slashArc(ctx, ox, 0.28, 2, '#ffee88', 20, 4, 29, 14, 24, 27)
      impactBurst(ctx, ox, 26, 27, 0.22)
      break
  }

  drawTorso(ctx, ox, P.unif, P.unifL, P.unifD, 0)
  fr(ctx, P.belt, ox+9, 21, 12, 2); fr(ctx, P.buckle, ox+14, 21, 4, 2)
  drawHead(ctx, ox, P.skin, P.skinDk, 0, true)
  fr(ctx, P.hat, ox+9, 1, 14, 8); fr(ctx, P.hatBd, ox+8, 7, 16, 2)
}

// Side-facing attack — arc sweeps LEFT side (flipX handles right-facing)
// All coords within [0,31]. Arc on left so it matches left-facing direction.
function drawPlayerAttackSide(ctx: Ctx, ox: number, frame: number) {
  dropShadow(ctx, ox)
  fr(ctx, P.trous, ox+9,  24, 5, 6); fr(ctx, P.boot, ox+9,  29, 5, 2)
  fr(ctx, P.trous, ox+18, 24, 5, 6); fr(ctx, P.boot, ox+18, 29, 5, 2)

  switch (frame) {
    case 0: // Wind-up — arm pulled to right, blade at 1 o'clock
      fr(ctx, P.unifD, ox+22, 8,  5, 11); fr(ctx, P.skin, ox+22, 18, 4, 3)
      fr(ctx, P.unifD, ox+19, 16, 4, 9);  fr(ctx, P.skin, ox+19, 24, 4, 3)
      fr(ctx, P.blade,   ox+22, 1, 3, 10)
      fr(ctx, P.bladeHi, ox+22, 1, 1, 4)
      ctx.save(); ctx.globalAlpha = 0.30; ctx.fillStyle = '#ffee88'
      ctx.beginPath(); ctx.arc(ox+24, 3, 5, 0, Math.PI*2); ctx.fill(); ctx.restore()
      break

    case 1: // Arc beginning — tip swings to upper-left
      fr(ctx, P.unifD, ox+22, 9,  5, 10); fr(ctx, P.skin, ox+22, 18, 4, 3)
      fr(ctx, P.unifD, ox+19, 15, 4, 9);  fr(ctx, P.skin, ox+19, 23, 4, 3)
      fr(ctx, P.blade,   ox+12, 4, 9, 2)
      fr(ctx, P.bladeHi, ox+12, 3, 4, 1)
      slashArc(ctx, ox, 0.65, 3, '#ffee88', 12, 5, 1, 8, 3, 15)
      slashArc(ctx, ox, 0.90, 1, '#ffffff', 13, 6, 2, 9, 4, 14)
      ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#ffcc44'
      ctx.beginPath(); ctx.arc(ox+3, 15, 4, 0, Math.PI*2); ctx.fill(); ctx.restore()
      break

    case 2: // Mid-swing — arm extended left, full arc visible
      fr(ctx, P.unifD, ox+20, 15, 4, 9); fr(ctx, P.skin, ox+20, 23, 4, 3)
      fr(ctx, P.unifD, ox+4,  15, 5, 9);  fr(ctx, P.skin, ox+3,  23, 4, 3)
      fr(ctx, P.blade,   ox+0, 21, 8, 2)
      fr(ctx, P.bladeHi, ox+0, 20, 3, 1)
      slashArc(ctx, ox, 0.50, 6, '#ff8800', 13, 3, 0, 12, 4, 26)
      slashArc(ctx, ox, 0.78, 4, '#ffcc44', 12, 4, 1, 13, 5, 25)
      slashArc(ctx, ox, 0.95, 2, '#fffae0', 11, 5, 2, 14, 6, 24)
      ctx.save(); ctx.globalAlpha = 0.50; ctx.fillStyle = '#ffdd88'
      ctx.beginPath(); ctx.arc(ox+5, 25, 5, 0, Math.PI*2); ctx.fill(); ctx.restore()
      break

    case 3: // IMPACT — blade at lower-left, burst
      fr(ctx, P.unifD, ox+20, 16, 4, 9); fr(ctx, P.skin, ox+20, 24, 4, 3)
      fr(ctx, P.unifD, ox+3,  16, 6, 8);  fr(ctx, P.skin, ox+2,  23, 4, 3)
      fr(ctx, P.blade,   ox+0, 23, 8, 2)
      fr(ctx, P.bladeHi, ox+0, 22, 3, 1)
      slashArc(ctx, ox, 0.40, 7, '#ff6600', 14, 2, 0, 13, 5, 29)
      slashArc(ctx, ox, 0.68, 5, '#ffaa22', 13, 3, 1, 14, 6, 28)
      slashArc(ctx, ox, 0.90, 2, '#ffee88', 12, 4, 2, 15, 7, 27)
      impactBurst(ctx, ox, 5, 27, 1.0)
      break

    case 4: // Follow-through — ghost arc fading
      fr(ctx, P.unifD, ox+20, 16, 4, 9); fr(ctx, P.skin, ox+20, 24, 4, 3)
      fr(ctx, P.unifD, ox+4,  19, 5, 8);  fr(ctx, P.skin, ox+3,  26, 4, 3)
      fr(ctx, P.blade, ox+0, 28, 9, 2)
      slashArc(ctx, ox, 0.18, 5, '#ffaa22', 13, 3, 1, 13, 5, 28)
      slashArc(ctx, ox, 0.28, 2, '#ffee88', 12, 4, 2, 14, 6, 27)
      impactBurst(ctx, ox, 5, 27, 0.22)
      break
  }

  drawTorso(ctx, ox, P.unif, P.unifL, P.unifD, 0)
  fr(ctx, P.belt, ox+9, 21, 12, 2); fr(ctx, P.buckle, ox+14, 21, 4, 2)
  // Side profile head
  fc(ctx, P.skinDk, ox+14, 9, 7); fc(ctx, P.skin, ox+13, 8, 6.5)
  fr(ctx, '#201000', ox+8, 9, 2, 2)
  fr(ctx, P.hat, ox+6,  1, 13, 8); fr(ctx, P.hatBd, ox+5, 7, 14, 2)
}

// ─── Player: CROUCH ───────────────────────────────────────────────────────────

function drawPlayerCrouch(ctx: Ctx, ox: number) {
  dropShadow(ctx, ox, 0.8)
  // Short bent legs
  fr(ctx, P.trous, ox+9,  24, 6, 4); fr(ctx, P.boot, ox+9,  27, 6, 2)
  fr(ctx, P.trous, ox+17, 24, 6, 4); fr(ctx, P.boot, ox+17, 27, 6, 2)
  // Arms at sides, hands forward
  fr(ctx, P.unifD, ox+5,  18, 4, 6); fr(ctx, P.skin, ox+5,  23, 4, 2)
  fr(ctx, P.unifD, ox+23, 18, 4, 6); fr(ctx, P.skin, ox+23, 23, 4, 2)
  fr(ctx, P.blade, ox+22, 22, 6, 2)
  // Lower body
  fr(ctx, P.unifD, ox+9, 18, 14, 8)
  fr(ctx, P.unif,  ox+9, 17, 12, 8)
  fr(ctx, P.unifL, ox+9, 17, 12, 3)
  fr(ctx, P.belt, ox+9, 22, 12, 2)
  // Head lower
  fc(ctx, P.skinDk, ox+16, 13, 7); fc(ctx, P.skin, ox+16, 12, 6.5)
  fr(ctx, '#201000', ox+12, 13, 2, 2); fr(ctx, '#201000', ox+18, 13, 2, 2)
  fr(ctx, P.hat, ox+9, 5, 14, 8); fr(ctx, P.hatBd, ox+8, 11, 16, 2)
}

// ─── Player: DODGE ────────────────────────────────────────────────────────────

function drawPlayerDodge(ctx: Ctx, ox: number) {
  ctx.save(); ctx.globalAlpha = 0.65
  drawPlayerLeft(ctx, ox, 1, 0)
  ctx.restore()
  // Motion trail lines
  ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = '#88ffff'; ctx.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(ox+20+i*2, 8+i*5); ctx.lineTo(ox+31, 8+i*5); ctx.stroke()
  }
  ctx.restore()
}

// ─── Enemy: DOWN-facing generic ───────────────────────────────────────────────

function drawEnemyDown(ctx: Ctx, ox: number, phase: number, pal: EnemyPal, type: EnemyType, breath = 0) {
  const bob = phase === 2 ? -1 : breath
  dropShadow(ctx, ox)
  drawLegs(ctx, ox, phase, pal.trous, pal.boot, bob)

  const sw = ARM_SWING[phase]
  fr(ctx, pal.bodyD, ox+5,  16-sw+bob, 4, 9)
  fr(ctx, pal.skin,  ox+5,  24-sw+bob, 4, 3)
  fr(ctx, pal.bodyD, ox+23, 16+sw+bob, 4, 9)
  fr(ctx, pal.skin,  ox+23, 24+sw+bob, 4, 3)

  // Type-specific weapon on right arm/hand
  drawEnemyWeapon(ctx, ox, type, pal, sw+bob, 'right')

  drawTorso(ctx, ox, pal.body, pal.bodyL, pal.bodyD, bob)

  // Commander: gold trim on torso
  if (type === 'commander') {
    fr(ctx, '#c8960c', ox+9, 14+bob, 12, 1)
    fr(ctx, '#c8960c', ox+9, 23+bob, 12, 1)
  }
  // Heavy: plate shoulder guards
  if (type === 'heavy') {
    fr(ctx, pal.bodyD, ox+6, 14+bob, 5, 4)
    fr(ctx, pal.bodyD, ox+21, 14+bob, 5, 4)
  }

  fr(ctx, pal.bodyD, ox+9, 21+bob, 12, 2) // belt

  drawHead(ctx, ox, pal.skin, pal.bodyD, bob, true)
  fr(ctx, pal.hat, ox+9, 1+bob, 14, 8)
  fr(ctx, pal.hat, ox+8, 7+bob, 16, 2)

  // Rifleman: shakos hat with white band
  if (type === 'rifleman') fr(ctx, '#cccccc', ox+9, 6+bob, 14, 1)
  // Commander: gold hat band
  if (type === 'commander') fr(ctx, '#c8960c', ox+8, 7+bob, 16, 1)
}

// ─── Enemy weapon indicators ──────────────────────────────────────────────────

function drawEnemyWeapon(ctx: Ctx, ox: number, type: EnemyType, pal: EnemyPal, offset: number, _side: string) {
  switch (type) {
    case 'soldier':
      // Short sword at right hip
      fr(ctx, pal.weapon, ox+24, 20+offset, 2, 9)
      fr(ctx, '#c8960c', ox+23, 19+offset, 4, 2)
      break
    case 'archer':
      // Bow on left arm
      fr(ctx, pal.weapon, ox+5, 15+offset, 2, 12)
      fr(ctx, pal.weapon, ox+3, 16+offset, 4, 1)
      fr(ctx, pal.weapon, ox+3, 25+offset, 4, 1)
      break
    case 'heavy':
      // Shield on left arm
      fr(ctx, '#7788aa', ox+3, 15+offset, 6, 10)
      fr(ctx, '#aabbcc', ox+4, 15+offset, 4, 2)
      fr(ctx, '#556677', ox+5, 19+offset, 2, 2)
      break
    case 'rifleman':
      // Long musket on right arm
      fr(ctx, pal.weapon, ox+23, 14+offset, 2, 14)
      fr(ctx, '#555555', ox+22, 13+offset, 4, 2)
      break
    case 'commander':
      // Raised sword
      fr(ctx, '#c8960c', ox+24, 10+offset, 2, 12)
      fr(ctx, '#e8c060', ox+22, 10+offset, 6, 2)
      break
  }
}

// ─── Enemy: LEFT-facing (right = flipX) ───────────────────────────────────────

function drawEnemyLeft(ctx: Ctx, ox: number, phase: number, pal: EnemyPal, type: EnemyType, breath = 0) {
  const bob = phase === 2 ? -1 : breath
  dropShadow(ctx, ox)

  // Back leg
  const bleg = [24, 22, 23, 26] as const
  fr(ctx, pal.bodyD, ox+16, bleg[phase]+bob, 5, 6)
  fr(ctx, pal.boot,  ox+16, bleg[phase]+bob+4, 5, 2)

  // Body (side)
  fr(ctx, pal.bodyD, ox+9,  15+bob, 13, 10)
  fr(ctx, pal.body,  ox+9,  14+bob, 11, 10)
  fr(ctx, pal.bodyL, ox+9,  14+bob, 11, 3)
  fr(ctx, pal.bodyD, ox+9,  21+bob, 11, 2)

  // Back arm
  fr(ctx, pal.bodyD, ox+17, 16+bob, 4, 7)

  // Front leg
  const fleg = [24, 21, 23, 26] as const
  const flh  = [6,   9,  7,  4] as const
  fr(ctx, pal.trous, ox+9, fleg[phase]+bob, 5, flh[phase])
  fr(ctx, pal.boot,  ox+9, fleg[phase]+flh[phase]+bob-2, 5, 2)

  // Front arm
  const asw = [0, 2, 0, -2] as const
  fr(ctx, pal.bodyD, ox+4, 15+asw[phase]+bob, 4, 9)
  fr(ctx, pal.skin,  ox+4, 23+asw[phase]+bob, 4, 3)

  // Side weapon
  if (type === 'soldier') {
    fr(ctx, pal.weapon, ox+2, 20+asw[phase]+bob, 2, 7)
  } else if (type === 'rifleman') {
    fr(ctx, pal.weapon, ox+0, 17+asw[phase]+bob, 7, 2)
  } else if (type === 'commander') {
    fr(ctx, '#c8960c', ox+2, 13+asw[phase]+bob, 2, 10)
  }

  // Head (side profile)
  fc(ctx, pal.bodyD, ox+14, 9+bob, 7)
  fc(ctx, pal.skin,  ox+13, 8+bob, 6.5)
  fr(ctx, '#201000', ox+8, 9+bob, 2, 2)
  fr(ctx, '#6a3820', ox+8, 12+bob, 3, 1)

  fr(ctx, pal.hat, ox+6,  1+bob, 13, 8)
  fr(ctx, pal.hat, ox+5,  7+bob, 14, 2)
  if (type === 'rifleman') fr(ctx, '#cccccc', ox+6, 6+bob, 13, 1)
  if (type === 'commander') fr(ctx, '#c8960c', ox+5, 7+bob, 14, 1)
}

// ─── Enemy: attack pose ───────────────────────────────────────────────────────

function drawEnemyAttack(ctx: Ctx, ox: number, pal: EnemyPal, type: EnemyType) {
  dropShadow(ctx, ox)
  fr(ctx, pal.trous, ox+10, 24, 5, 6); fr(ctx, pal.boot, ox+10, 29, 5, 2)
  fr(ctx, pal.trous, ox+17, 24, 5, 6); fr(ctx, pal.boot, ox+17, 29, 5, 2)
  fr(ctx, pal.bodyD, ox+5, 16, 4, 9); fr(ctx, pal.skin, ox+5, 24, 4, 3)
  // Attack arm extended
  fr(ctx, pal.bodyD, ox+22, 14, 6, 9); fr(ctx, pal.skin, ox+26, 22, 4, 3)
  drawEnemyWeapon(ctx, ox, type, pal, -2, 'right')
  drawTorso(ctx, ox, pal.body, pal.bodyL, pal.bodyD, 0)
  fr(ctx, pal.bodyD, ox+9, 21, 12, 2)
  drawHead(ctx, ox, pal.skin, pal.bodyD, 0, true)
  fr(ctx, pal.hat, ox+9, 1, 14, 8); fr(ctx, pal.hat, ox+8, 7, 16, 2)
  // Attack flash
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffaa44'
  ctx.beginPath(); ctx.arc(ox+28, 20, 5, 0, Math.PI*2); ctx.fill(); ctx.restore()
}

// ─── Texture builders ──────────────────────────────────────────────────────────

function makeCanvas(frames: number): [HTMLCanvasElement, Ctx] {
  const canvas = document.createElement('canvas')
  canvas.width  = FW * frames
  canvas.height = FH
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  return [canvas, ctx]
}

// Player spritesheet layout:
// 0-1: idle_down  2-5: walk_down  6-7: idle_up  8-11: walk_up
// 12-13: idle_left  14-17: walk_left  18-20: attack  21: crouch  22: dodge
const PLAYER_TOTAL_FRAMES = 32  // down-attack(5) + side-attack(5) + crouch + dodge

function generatePlayerTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('player')) return

  const [canvas, ctx] = makeCanvas(PLAYER_TOTAL_FRAMES)

  // idle_down 0-1
  drawPlayerDown(ctx, 0*FW, 0, 0)
  drawPlayerDown(ctx, 1*FW, 0, -1)
  // walk_down 2-5
  for (let p = 0; p < 4; p++) drawPlayerDown(ctx, (2+p)*FW, p)
  // idle_up 6-7
  drawPlayerUp(ctx, 6*FW, 0, 0)
  drawPlayerUp(ctx, 7*FW, 0, -1)
  // walk_up 8-11
  for (let p = 0; p < 4; p++) drawPlayerUp(ctx, (8+p)*FW, p)
  // idle_left 12-13
  drawPlayerLeft(ctx, 12*FW, 0, 0)
  drawPlayerLeft(ctx, 13*FW, 0, -1)
  // walk_left 14-17
  for (let p = 0; p < 4; p++) drawPlayerLeft(ctx, (14+p)*FW, p)
  // attack_down 18-22  (5 frames — down/up facing)
  for (let f = 0; f < 5; f++) drawPlayerAttack(ctx, (18+f)*FW, f)
  // attack_side 23-27  (5 frames — left/right facing, flipX for right)
  for (let f = 0; f < 5; f++) drawPlayerAttackSide(ctx, (23+f)*FW, f)
  // crouch 28
  drawPlayerCrouch(ctx, 28*FW)
  // dodge 29
  drawPlayerDodge(ctx, 29*FW)

  scene.textures.addSpriteSheet('player', canvas as unknown as HTMLImageElement, { frameWidth: FW, frameHeight: FH })

  const A = scene.anims
  A.create({ key: 'player_idle_down',  frames: A.generateFrameNumbers('player', { start: 0,  end: 1  }), frameRate: 2,  repeat: -1 })
  A.create({ key: 'player_walk_down',  frames: A.generateFrameNumbers('player', { start: 2,  end: 5  }), frameRate: 8,  repeat: -1 })
  A.create({ key: 'player_idle_up',    frames: A.generateFrameNumbers('player', { start: 6,  end: 7  }), frameRate: 2,  repeat: -1 })
  A.create({ key: 'player_walk_up',    frames: A.generateFrameNumbers('player', { start: 8,  end: 11 }), frameRate: 8,  repeat: -1 })
  A.create({ key: 'player_idle_left',  frames: A.generateFrameNumbers('player', { start: 12, end: 13 }), frameRate: 2,  repeat: -1 })
  A.create({ key: 'player_walk_left',  frames: A.generateFrameNumbers('player', { start: 14, end: 17 }), frameRate: 8,  repeat: -1 })
  A.create({ key: 'player_attack_down', frames: A.generateFrameNumbers('player', { start: 18, end: 22 }), frameRate: 14, repeat: 0  })
  A.create({ key: 'player_attack_side', frames: A.generateFrameNumbers('player', { start: 23, end: 27 }), frameRate: 14, repeat: 0  })
  A.create({ key: 'player_crouch',      frames: A.generateFrameNumbers('player', { start: 28, end: 28 }), frameRate: 1,  repeat: -1 })
  A.create({ key: 'player_dodge',       frames: A.generateFrameNumbers('player', { start: 29, end: 29 }), frameRate: 1,  repeat: -1 })
}

// Enemy spritesheet layout per type:
// 0-1: idle_down  2-5: walk_down  6-7: idle_left  8-11: walk_left  12: attack
const ENEMY_TOTAL_FRAMES = 13

function generateEnemyTexture(scene: Phaser.Scene, type: EnemyType) {
  const key = `enemy_${type}`
  if (scene.textures.exists(key)) return

  const pal = EP[type]
  const [canvas, ctx] = makeCanvas(ENEMY_TOTAL_FRAMES)

  // idle_down 0-1
  drawEnemyDown(ctx, 0*FW, 0, pal, type, 0)
  drawEnemyDown(ctx, 1*FW, 0, pal, type, -1)
  // walk_down 2-5
  for (let p = 0; p < 4; p++) drawEnemyDown(ctx, (2+p)*FW, p, pal, type)
  // idle_left 6-7
  drawEnemyLeft(ctx, 6*FW, 0, pal, type, 0)
  drawEnemyLeft(ctx, 7*FW, 0, pal, type, -1)
  // walk_left 8-11
  for (let p = 0; p < 4; p++) drawEnemyLeft(ctx, (8+p)*FW, p, pal, type)
  // attack 12
  drawEnemyAttack(ctx, 12*FW, pal, type)

  scene.textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, { frameWidth: FW, frameHeight: FH })

  const A = scene.anims
  A.create({ key: `${type}_idle_down`, frames: A.generateFrameNumbers(key, { start: 0, end: 1  }), frameRate: 2, repeat: -1 })
  A.create({ key: `${type}_walk_down`, frames: A.generateFrameNumbers(key, { start: 2, end: 5  }), frameRate: 8, repeat: -1 })
  A.create({ key: `${type}_idle_left`, frames: A.generateFrameNumbers(key, { start: 6, end: 7  }), frameRate: 2, repeat: -1 })
  A.create({ key: `${type}_walk_left`, frames: A.generateFrameNumbers(key, { start: 8, end: 11 }), frameRate: 8, repeat: -1 })
  A.create({ key: `${type}_attack`,    frames: A.generateFrameNumbers(key, { start: 12, end: 12 }), frameRate: 1, repeat: -1 })
}

// ─── Boss: British EIC Commander (~1814) ──────────────────────────────────────
// 40×40 px frames — larger than regular 32×32 enemies
// Palette: red coat, gold epaulettes, tall shako hat, white cross-belt, saber

const FBW = 40   // boss frame width
const FBH = 40

const BC = {
  skin:    '#d4a068',   // pale European skin
  skinDk:  '#a07848',
  coat:    '#c82020',   // bright red British coat
  coatL:   '#e83434',
  coatD:   '#8a1010',
  gold:    '#c89010',   // gold trim / epaulettes
  goldL:   '#e8b828',
  belt:    '#e8e8d4',   // white cross-belt
  trous:   '#181838',   // dark navy trousers
  trosDk:  '#0e0e26',
  boot:    '#100808',
  hat:     '#0c0c1c',   // tall black shako hat
  hatRim:  '#18182e',
  plume:   '#e0e0e0',   // white feather plume
  blade:   '#c8c060',   // saber blade
  bladeHi: '#f0e880',
  hilt:    '#c89010',   // gold guard
}

const BOSS_LEG_PHASES = [
  [12, 26, 9,  22, 26, 9],   // 0 neutral-A
  [12, 28, 7,  22, 23, 11],  // 1 right fwd
  [12, 25, 10, 22, 25, 10],  // 2 neutral-B (bob peak)
  [12, 23, 11, 22, 28, 7],   // 3 left fwd
] as const

function drawBossLegs(ctx: Ctx, ox: number, phase: number, bob: number) {
  const [lx, ly, lh, rx, ry, rh] = BOSS_LEG_PHASES[phase]
  fr(ctx, BC.trous,  ox+lx,   ly+bob,      6, lh)
  fr(ctx, BC.trosDk, ox+lx,   ly+bob,      2, lh)
  fr(ctx, BC.boot,   ox+lx-1, ly+lh+bob-2, 7, 4)
  fr(ctx, BC.trous,  ox+rx,   ry+bob,      6, rh)
  fr(ctx, BC.trosDk, ox+rx+4, ry+bob,      2, rh)
  fr(ctx, BC.boot,   ox+rx-1, ry+rh+bob-2, 7, 4)
}

function drawBossHat(ctx: Ctx, ox: number, bob: number, hatCx = 20) {
  // Tall shako body
  fr(ctx, BC.hat,    ox+hatCx-8, 1+bob, 16, 11)
  fr(ctx, BC.hatRim, ox+hatCx-9, 1+bob, 18,  2)   // top rim (wider)
  // Gold hat band
  fr(ctx, BC.gold,   ox+hatCx-9, 11+bob, 18, 2)
  // Front badge / plate
  fr(ctx, BC.gold,   ox+hatCx-3, 3+bob, 6, 5)
  fr(ctx, BC.goldL,  ox+hatCx-1, 4+bob, 2, 2)     // badge shine
  // White plume top-centre
  fc(ctx, BC.plume,  ox+hatCx, 1.5+bob, 3)
  fc(ctx, '#f8f8f8', ox+hatCx, 1+bob,   2)
}

function drawBossHead(ctx: Ctx, ox: number, bob: number, face = true) {
  fc(ctx, BC.skinDk, ox+20, 15+bob, 7.5)
  fc(ctx, BC.skin,   ox+20, 14+bob, 7)
  if (face) {
    fr(ctx, '#201000', ox+15, 14+bob, 3, 2.5)   // left eye
    fr(ctx, '#201000', ox+22, 14+bob, 3, 2.5)   // right eye
    fr(ctx, '#503828', ox+15, 18+bob, 10, 1.5)  // thick mustache
    fr(ctx, BC.skinDk, ox+17, 20+bob, 6, 1.5)   // chin
  }
}

function drawBossDown(ctx: Ctx, ox: number, phase: number, breath = 0) {
  const bob = phase === 2 ? -1 : breath

  // Shadow
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'
  ctx.beginPath(); ctx.ellipse(ox+20, 38, 13, 3, 0, 0, Math.PI*2); ctx.fill()
  ctx.restore()

  drawBossLegs(ctx, ox, phase, bob)

  // Coat tails (below belt)
  fr(ctx, BC.coatD, ox+10, 24+bob, 20, 5)
  fr(ctx, BC.coat,  ox+11, 24+bob, 18, 4)

  // Arm swing
  const sw = ARM_SWING[phase] * 2
  // Left arm
  fr(ctx, BC.coatD, ox+4, 14-sw+bob, 6, 11)
  fr(ctx, BC.coat,  ox+5, 14-sw+bob, 5, 11)
  fr(ctx, BC.belt,  ox+5, 24-sw+bob, 5, 2)        // white cuff
  fc(ctx, BC.skin,  ox+7.5, 28-sw+bob, 3)          // hand

  // Right arm (sword hand)
  fr(ctx, BC.coatD, ox+30, 14+sw+bob, 6, 11)
  fr(ctx, BC.coat,  ox+30, 14+sw+bob, 5, 11)
  fr(ctx, BC.belt,  ox+30, 24+sw+bob, 5, 2)        // white cuff
  fc(ctx, BC.skin,  ox+32.5, 28+sw+bob, 3)          // hand
  // Saber hanging from right hand
  fr(ctx, BC.hilt,  ox+34, 26+sw+bob, 4, 3)
  fr(ctx, BC.blade, ox+35, 29+sw+bob, 2, 9)
  fr(ctx, BC.bladeHi, ox+35, 29+sw+bob, 1, 7)

  // Torso — red coat
  fr(ctx, BC.coatD, ox+10, 13+bob, 20, 13)
  fr(ctx, BC.coat,  ox+11, 12+bob, 18, 12)
  fr(ctx, BC.coatL, ox+12, 12+bob, 16, 5)           // upper highlight

  // Gold epaulettes (shoulder pads — key detail!)
  fr(ctx, BC.gold,  ox+6, 13+bob, 7, 4)             // left epaulette
  fr(ctx, BC.goldL, ox+7, 13+bob, 5, 2)
  for (let i = 0; i < 4; i++) fr(ctx, BC.gold, ox+7+i, 17+bob, 1, 3) // fringe
  fr(ctx, BC.gold,  ox+27, 13+bob, 7, 4)            // right epaulette
  fr(ctx, BC.goldL, ox+28, 13+bob, 5, 2)
  for (let i = 0; i < 4; i++) fr(ctx, BC.gold, ox+28+i, 17+bob, 1, 3) // fringe

  // White cross-belt
  fr(ctx, BC.belt, ox+18, 12+bob, 3, 14)            // vertical
  fr(ctx, BC.belt, ox+11, 12+bob, 12, 2)            // horizontal across chest

  // Gold buttons down centre
  fc(ctx, BC.goldL, ox+19.5, 16+bob, 1.5)
  fc(ctx, BC.goldL, ox+19.5, 20+bob, 1.5)
  fc(ctx, BC.goldL, ox+19.5, 24+bob, 1.5)

  drawBossHead(ctx, ox, bob, true)
  drawBossHat(ctx, ox, bob)
}

function drawBossLeft(ctx: Ctx, ox: number, phase: number) {
  const bob = phase === 2 ? -1 : 0

  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'
  ctx.beginPath(); ctx.ellipse(ox+18, 38, 11, 2.5, 0, 0, Math.PI*2); ctx.fill()
  ctx.restore()

  // Back leg
  const bly = [26, 28, 25, 23] as const
  fr(ctx, BC.trosDk, ox+19, bly[phase]+bob, 5, 10)
  fr(ctx, BC.boot,   ox+18, bly[phase]+bob+8, 6, 4)

  // Coat tail (side view)
  fr(ctx, BC.coatD, ox+9,  24+bob, 16, 5)
  fr(ctx, BC.coat,  ox+10, 24+bob, 14, 4)

  // Back arm (trailing)
  fr(ctx, BC.coatD, ox+19, 14+bob, 5, 10)

  // Torso (side profile)
  fr(ctx, BC.coatD, ox+9,  13+bob, 17, 13)
  fr(ctx, BC.coat,  ox+10, 12+bob, 15, 12)
  fr(ctx, BC.coatL, ox+10, 12+bob, 15, 5)

  // Epaulette (near shoulder, side view)
  fr(ctx, BC.gold,  ox+10, 13+bob, 5, 3)
  fr(ctx, BC.goldL, ox+11, 13+bob, 4, 2)

  // Cross-belt visible from side
  fr(ctx, BC.belt, ox+14, 12+bob, 3, 13)

  // Front leg
  const fly = [26, 22, 25, 28] as const
  const flh = [10,  13, 11,  8] as const
  fr(ctx, BC.trous, ox+11, fly[phase]+bob, 5, flh[phase])
  fr(ctx, BC.boot,  ox+10, fly[phase]+flh[phase]+bob-2, 7, 4)

  // Front arm (side view)
  const asw = [0, 2, 0, -2] as const
  fr(ctx, BC.coatD, ox+4, 14+asw[phase]+bob, 6, 10)
  fr(ctx, BC.coat,  ox+5, 14+asw[phase]+bob, 5, 10)
  fr(ctx, BC.belt,  ox+5, 23+asw[phase]+bob, 5, 2)
  fc(ctx, BC.skin,  ox+7, 27+asw[phase]+bob, 3)
  // Saber at side
  fr(ctx, BC.hilt,  ox+4, 26+asw[phase]+bob, 3, 3)
  fr(ctx, BC.blade, ox+3, 29+asw[phase]+bob, 2, 8)

  // Head — side profile
  fc(ctx, BC.skinDk, ox+17, 15+bob, 7)
  fc(ctx, BC.skin,   ox+16, 14+bob, 6.5)
  fr(ctx, '#201000', ox+10, 14+bob, 2, 2.5)         // eye
  fr(ctx, '#503828', ox+10, 18+bob, 5, 1.5)         // mustache (side)
  fr(ctx, BC.skinDk, ox+10, 20+bob, 4, 1)           // chin

  // Shako hat (side profile — tall rectangle)
  fr(ctx, BC.hat,    ox+10, 1+bob, 14, 11)
  fr(ctx, BC.hatRim, ox+9,  1+bob, 16, 2)
  fr(ctx, BC.gold,   ox+9,  11+bob, 16, 2)          // gold band
  // Plume visible at front
  fc(ctx, BC.plume,  ox+22, 2+bob, 2.5)
}

function drawBossAttack(ctx: Ctx, ox: number) {
  // Saber raised high — dramatic overhead swing
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'
  ctx.beginPath(); ctx.ellipse(ox+20, 38, 13, 3, 0, 0, Math.PI*2); ctx.fill()
  ctx.restore()

  // Legs (planted)
  fr(ctx, BC.trous,  ox+12, 26, 7, 10); fr(ctx, BC.boot, ox+11, 35, 8, 4)
  fr(ctx, BC.trous,  ox+21, 26, 7, 10); fr(ctx, BC.boot, ox+20, 35, 8, 4)

  // Coat tails
  fr(ctx, BC.coatD, ox+10, 24, 20, 5); fr(ctx, BC.coat, ox+11, 24, 18, 4)

  // Left arm guarding
  fr(ctx, BC.coatD, ox+4, 14, 6, 11); fr(ctx, BC.coat, ox+5, 14, 5, 11)
  fr(ctx, BC.belt,  ox+5, 24, 5, 2)
  fc(ctx, BC.skin,  ox+7.5, 28, 3)

  // Right arm raised (holding saber overhead)
  fr(ctx, BC.coatD, ox+27, 4, 6, 15); fr(ctx, BC.coat, ox+28, 4, 5, 15)
  fr(ctx, BC.belt,  ox+28, 18, 5, 2)
  fc(ctx, BC.skin,  ox+30.5, 6, 3)
  // Saber above head — prominent!
  fr(ctx, BC.hilt,  ox+29, 3, 5, 4)                 // crossguard
  fr(ctx, BC.blade, ox+30, 0, 3, 5)                  // blade tip pointing up
  fr(ctx, BC.bladeHi, ox+30, 0, 1, 4)
  // Saber flash glow
  ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffffcc'
  ctx.beginPath(); ctx.arc(ox+31, 2, 5, 0, Math.PI*2); ctx.fill(); ctx.restore()

  // Torso
  fr(ctx, BC.coatD, ox+10, 13, 20, 13); fr(ctx, BC.coat, ox+11, 12, 18, 12)
  fr(ctx, BC.coatL, ox+12, 12, 16, 5)
  // Epaulettes
  fr(ctx, BC.gold, ox+6, 13, 7, 4); for (let i = 0; i < 4; i++) fr(ctx, BC.gold, ox+7+i, 17, 1, 3)
  fr(ctx, BC.gold, ox+27, 13, 7, 4); for (let i = 0; i < 4; i++) fr(ctx, BC.gold, ox+28+i, 17, 1, 3)
  // Cross-belt
  fr(ctx, BC.belt, ox+18, 12, 3, 14); fr(ctx, BC.belt, ox+11, 12, 12, 2)

  drawBossHead(ctx, ox, 0, true)
  drawBossHat(ctx, ox, 0)

  // Attack arc trail
  ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = '#ffee88'; ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(ox+31, 3); ctx.quadraticCurveTo(ox+38, 15, ox+32, 28); ctx.stroke()
  ctx.globalAlpha = 0.30; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(ox+31, 3); ctx.quadraticCurveTo(ox+37, 15, ox+31, 28); ctx.stroke()
  ctx.restore()
}

function generateBossTexture(scene: Phaser.Scene) {
  const key = 'boss_commander'
  if (scene.textures.exists(key)) return

  const canvas = document.createElement('canvas')
  canvas.width  = FBW * 13
  canvas.height = FBH
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  // 0-1: idle_down
  drawBossDown(ctx, 0*FBW, 0, 0)
  drawBossDown(ctx, 1*FBW, 0, -1)
  // 2-5: walk_down
  for (let p = 0; p < 4; p++) drawBossDown(ctx, (2+p)*FBW, p)
  // 6-7: idle_left
  drawBossLeft(ctx, 6*FBW, 0)
  drawBossLeft(ctx, 7*FBW, 2)
  // 8-11: walk_left
  for (let p = 0; p < 4; p++) drawBossLeft(ctx, (8+p)*FBW, p)
  // 12: attack
  drawBossAttack(ctx, 12*FBW)

  scene.textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, { frameWidth: FBW, frameHeight: FBH })

  const A = scene.anims
  A.create({ key: 'boss_idle_down', frames: A.generateFrameNumbers(key, { start: 0,  end: 1  }), frameRate: 2,  repeat: -1 })
  A.create({ key: 'boss_walk_down', frames: A.generateFrameNumbers(key, { start: 2,  end: 5  }), frameRate: 8,  repeat: -1 })
  A.create({ key: 'boss_idle_left', frames: A.generateFrameNumbers(key, { start: 6,  end: 7  }), frameRate: 2,  repeat: -1 })
  A.create({ key: 'boss_walk_left', frames: A.generateFrameNumbers(key, { start: 8,  end: 11 }), frameRate: 8,  repeat: -1 })
  A.create({ key: 'boss_attack',    frames: A.generateFrameNumbers(key, { start: 12, end: 12 }), frameRate: 1,  repeat:  0 })
}

// ─── Public entry point ────────────────────────────────────────────────────────

export function generateCharacterTextures(scene: Phaser.Scene) {
  generatePlayerTexture(scene)
  const types: EnemyType[] = ['soldier', 'archer', 'heavy', 'rifleman', 'commander']
  for (const t of types) generateEnemyTexture(scene, t)
  generateBossTexture(scene)
}
