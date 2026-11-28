<script setup lang="ts">
interface RippleWave {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
}

interface Firefly {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  phase: number
  speed: number
  tone: 'mint' | 'bright' | 'amber'
}

interface CircuitPulse {
  col: number
  row: number
  dir: number
  progress: number
  speed: number
  alpha: number
}

type CursorHexVariant = 'solid' | 'outline' | 'nested' | 'dots' | 'hatch' | 'vertices'

interface CursorHexCellSpec {
  variant: CursorHexVariant
  tone: 'mint' | 'bright' | 'teal'
  jitter: number
  weight: number
}

const props = withDefaults(
  defineProps<{
    wordmarkHovered?: boolean
  }>(),
  {
    wordmarkHovered: false,
  },
)

const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Scene 0 (Indonesia Outline) smooth opacity driven by exact same 60fps clock as canvas scenes!
const indonesiaOpacity = ref(1)

// Scene timing: 5 distinct scenes cycling seamlessly (8.5s each, 2.2s silky crossfade)
const SCENE_COUNT = 5
const SCENE_DURATION_MS = 8500
const FADE_DURATION_MS = 2200

// Indonesia city beacons mapped 1:1 to indonesia-map-outline.png (1270x510)
const INDONESIA_CITIES = [
  { id: 'medan', x: 128, y: 118, r: 2.8, accent: 'mint' },
  { id: 'padang', x: 164, y: 224, r: 2.3, accent: 'teal' },
  { id: 'palembang', x: 245, y: 268, r: 2.6, accent: 'mint' },
  { id: 'jakarta', x: 334, y: 358, r: 2.9, accent: 'bright' },
  { id: 'bandung', x: 370, y: 376, r: 4.5, accent: 'hero' },
  { id: 'semarang', x: 432, y: 378, r: 2.4, accent: 'mint' },
  { id: 'surabaya', x: 497, y: 390, r: 2.9, accent: 'amber' },
  { id: 'bali', x: 575, y: 418, r: 2.7, accent: 'amber' },
  { id: 'pontianak', x: 426, y: 215, r: 2.5, accent: 'teal' },
  { id: 'balikpapan', x: 598, y: 213, r: 2.8, accent: 'bright' },
  { id: 'makassar', x: 686, y: 314, r: 2.8, accent: 'mint' },
  { id: 'manado', x: 794, y: 147, r: 2.4, accent: 'teal' },
  { id: 'ambon', x: 922, y: 276, r: 2.4, accent: 'mint' },
  { id: 'jayapura', x: 1196, y: 245, r: 2.8, accent: 'bright' },
] as const

// Runtime state (strictly non-reactive for buttery 60fps canvas performance)
let rafId: number | null = null
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
let isVisible = true
let prefersReducedMotion = false
let startTime = 0

let width = 1440
let height = 900
let dpr = 1

// Sticky pointer tracking: NEVER snaps back to bottom-right while user is in Hero!
let hasUserMoved = false
let pointerInside = false
let cursorVisibility = 0.65
let targetX = 0
let targetY = 0
let smoothX = 0
let smoothY = 0

const cellAlphas = new Map<string, number>()
const ripples: RippleWave[] = []
let fireflies: Firefly[] = []
let circuitPulses: CircuitPulse[] = []

const SQRT3 = Math.sqrt(3)

function deterministicHash(q: number, r: number): number {
  let n = Math.imul(q, 374761393) + Math.imul(r, 668265263)
  n = (n ^ (n >>> 13)) * 1274126177
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}

// Compute exact silky crossfade weights (0..1) for all 5 sequential scenes
function getSceneWeights(elapsedMs: number): [number, number, number, number, number] {
  if (prefersReducedMotion) return [1, 0, 0, 0, 0]

  const totalCycle = SCENE_COUNT * SCENE_DURATION_MS
  const cyclePos = ((elapsedMs % totalCycle) + totalCycle) % totalCycle
  const currentIdx = Math.floor(cyclePos / SCENE_DURATION_MS)
  const localMs = cyclePos - currentIdx * SCENE_DURATION_MS
  const nextIdx = (currentIdx + 1) % SCENE_COUNT

  const weights: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  const fadeStart = SCENE_DURATION_MS - FADE_DURATION_MS

  if (localMs >= fadeStart) {
    const t = smoothstep((localMs - fadeStart) / FADE_DURATION_MS)
    weights[currentIdx] = 1 - t
    weights[nextIdx] = t
  } else {
    weights[currentIdx] = 1
  }
  return weights
}

// Single design-system color family (Luhur Signal Mint / Emerald) with 6 rich artistic variations
function getCursorHexSpec(col: number, row: number): CursorHexCellSpec {
  const h = deterministicHash(col + 19, row + 37)
  const h2 = deterministicHash(col * 3 - 7, row * 5 + 13)
  const h3 = deterministicHash(col * 7 + 5, row * 2 - 9)

  const jitter = (h2 - 0.5) * 62
  const tone: CursorHexCellSpec['tone'] = h3 < 0.52 ? 'mint' : h3 < 0.8 ? 'teal' : 'bright'

  if (h < 0.24) return { variant: 'solid', tone, jitter, weight: 1.0 }
  if (h < 0.48) return { variant: 'outline', tone, jitter, weight: 1.04 }
  if (h < 0.66) return { variant: 'nested', tone, jitter, weight: 0.98 }
  if (h < 0.8) return { variant: 'dots', tone, jitter, weight: 0.96 }
  if (h < 0.91) return { variant: 'hatch', tone, jitter, weight: 0.94 }
  return { variant: 'vertices', tone, jitter, weight: 1.0 }
}

function getToneRgb(tone: CursorHexCellSpec['tone']): [number, number, number] {
  if (tone === 'bright') return [0, 229, 168]
  if (tone === 'teal') return [20, 184, 166]
  return [16, 185, 129]
}

function seedParticles() {
  const count = width < 640 ? 24 : 46
  fireflies = Array.from({ length: count }, (_, i) => {
    const r = deterministicHash(i, 89)
    const tone: Firefly['tone'] = r < 0.56 ? 'mint' : r < 0.84 ? 'bright' : 'amber'
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(0.1 + Math.random() * 0.28),
      size: 0.9 + Math.random() * 1.7,
      baseAlpha: 0.14 + Math.random() * 0.34,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0009 + Math.random() * 0.0018,
      tone,
    }
  })

  circuitPulses = Array.from({ length: 12 }, (_, i) => ({
    col: Math.floor(deterministicHash(i + 2, 11) * 18) + 1,
    row: Math.floor(deterministicHash(i + 7, 23) * 11) + 1,
    dir: i % 6,
    progress: deterministicHash(i, 53),
    speed: 0.009 + deterministicHash(i, 67) * 0.011,
    alpha: 0.32 + deterministicHash(i, 79) * 0.36,
  }))
}

function drawHexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    const px = cx + radius * Math.cos(angle)
    const py = cy + radius * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function drawStylizedMintHex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  spec: CursorHexCellSpec,
  alpha: number,
) {
  const [r, g, b] = getToneRgb(spec.tone)
  const innerR = radius - 2.3

  if (spec.variant === 'solid') {
    drawHexPath(ctx, cx, cy, innerR)
    const grad = ctx.createLinearGradient(cx - innerR, cy - innerR, cx + innerR, cy + innerR)
    grad.addColorStop(0, `rgba(52, 211, 153, ${(alpha * 1.05).toFixed(3)})`)
    grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.78).toFixed(3)})`)
    grad.addColorStop(1, `rgba(13, 108, 86, ${(alpha * 0.5).toFixed(3)})`)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = `rgba(52, 211, 153, ${(alpha * 1.25).toFixed(3)})`
    ctx.lineWidth = 0.95
    ctx.stroke()
    return
  }

  if (spec.variant === 'outline') {
    drawHexPath(ctx, cx, cy, innerR)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 0.1).toFixed(3)})`
    ctx.fill()
    ctx.strokeStyle = `rgba(0, 229, 168, ${(alpha * 1.85).toFixed(3)})`
    ctx.lineWidth = 1.2
    ctx.stroke()
    return
  }

  if (spec.variant === 'nested') {
    drawHexPath(ctx, cx, cy, innerR)
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 1.3).toFixed(3)})`
    ctx.lineWidth = 0.95
    ctx.stroke()

    drawHexPath(ctx, cx, cy, innerR * 0.56)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 0.58).toFixed(3)})`
    ctx.fill()
    ctx.strokeStyle = `rgba(52, 211, 153, ${(alpha * 1.45).toFixed(3)})`
    ctx.lineWidth = 0.85
    ctx.stroke()

    ctx.fillStyle = `rgba(204, 251, 241, ${(alpha * 1.9).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(cx, cy, 1.7, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  if (spec.variant === 'dots') {
    drawHexPath(ctx, cx, cy, innerR)
    ctx.fillStyle = `rgba(13, 45, 38, ${(alpha * 0.36).toFixed(3)})`
    ctx.fill()

    ctx.save()
    ctx.clip()
    const step = radius < 34 ? 7.5 : 8.8
    ctx.fillStyle = `rgba(52, 211, 153, ${(alpha * 1.85).toFixed(3)})`
    for (let gx = -innerR; gx <= innerR; gx += step) {
      for (let gy = -innerR; gy <= innerR; gy += step) {
        ctx.fillRect(cx + gx - 0.75, cy + gy - 0.75, 1.5, 1.5)
      }
    }
    ctx.restore()

    drawHexPath(ctx, cx, cy, innerR)
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 1.1).toFixed(3)})`
    ctx.lineWidth = 0.85
    ctx.stroke()
    return
  }

  if (spec.variant === 'hatch') {
    drawHexPath(ctx, cx, cy, innerR)
    ctx.save()
    ctx.clip()
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 1.3).toFixed(3)})`
    ctx.lineWidth = 0.85
    const gap = radius < 34 ? 7.5 : 9
    ctx.beginPath()
    for (let d = -innerR * 2; d <= innerR * 2; d += gap) {
      ctx.moveTo(cx + d - innerR, cy - innerR)
      ctx.lineTo(cx + d + innerR, cy + innerR)
    }
    ctx.stroke()
    ctx.restore()

    drawHexPath(ctx, cx, cy, innerR)
    ctx.strokeStyle = `rgba(52, 211, 153, ${(alpha * 1.4).toFixed(3)})`
    ctx.lineWidth = 1.0
    ctx.stroke()
    return
  }

  drawHexPath(ctx, cx, cy, innerR)
  ctx.save()
  ctx.setLineDash([4, 5])
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 1.3).toFixed(3)})`
  ctx.lineWidth = 0.95
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = `rgba(0, 229, 168, ${(alpha * 2.0).toFixed(3)})`
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    const vx = cx + innerR * Math.cos(angle)
    const vy = cy + innerR * Math.sin(angle)
    ctx.beginPath()
    ctx.arc(vx, vy, 1.8, 0, Math.PI * 2)
    ctx.fill()
  }
}

// =========================================================================
// SCENE 2 (Index 1): ADVANCED KINETIC BUSINESS GROWTH BARS & MARKET SKYLINE
// Dynamic rising/falling business pillars + peak-hold caps + live trendline
// =========================================================================
function renderBusinessSkylineScene(ctx: CanvasRenderingContext2D, now: number, alpha: number) {
  if (alpha <= 0.005) return

  const t = now * 0.001
  const baseLine = height * 0.93

  // 8 dynamic stepped business pillars per flank (16 total) with varied harmonic rise/fall cycles
  const leftSpecs = [
    { xPct: 0.012, wPct: 0.032, baseH: 0.42, amp: 0.16, freq: 0.85, phase: 0.0, accent: 'mint' },
    { xPct: 0.048, wPct: 0.038, baseH: 0.56, amp: 0.19, freq: 0.72, phase: 0.9, accent: 'amber' },
    { xPct: 0.09, wPct: 0.034, baseH: 0.48, amp: 0.17, freq: 0.96, phase: 1.7, accent: 'mint' },
    { xPct: 0.128, wPct: 0.032, baseH: 0.37, amp: 0.15, freq: 1.08, phase: 2.5, accent: 'teal' },
    { xPct: 0.164, wPct: 0.03, baseH: 0.31, amp: 0.13, freq: 0.92, phase: 3.3, accent: 'mint' },
    { xPct: 0.198, wPct: 0.028, baseH: 0.24, amp: 0.11, freq: 1.15, phase: 4.1, accent: 'bright' },
    { xPct: 0.23, wPct: 0.026, baseH: 0.19, amp: 0.09, freq: 1.02, phase: 4.9, accent: 'teal' },
    { xPct: 0.26, wPct: 0.024, baseH: 0.14, amp: 0.07, freq: 1.22, phase: 5.6, accent: 'mint' },
  ] as const

  // Soft horizon floor glow
  const baseGrad = ctx.createLinearGradient(0, baseLine - 160, 0, height)
  baseGrad.addColorStop(0, 'rgba(16, 185, 129, 0)')
  baseGrad.addColorStop(1, `rgba(16, 185, 129, ${(0.075 * alpha).toFixed(3)})`)
  ctx.fillStyle = baseGrad
  ctx.fillRect(0, baseLine - 160, width, height - (baseLine - 160))

  // Subtle horizontal analytical baseline & reference tick lines
  for (let g = 0; g < 4; g++) {
    const gy = baseLine - g * (height * 0.18)
    ctx.strokeStyle = `rgba(16, 185, 129, ${((g === 0 ? 0.2 : 0.05) * alpha).toFixed(3)})`
    ctx.lineWidth = g === 0 ? 1 : 0.75
    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(width, gy)
    ctx.stroke()
  }

  const drawFlankBars = (mirrored: boolean) => {
    const capPoints: Array<{ x: number; y: number }> = []

    for (let i = 0; i < leftSpecs.length; i++) {
      const sp = leftSpecs[i]!
      const phaseOffset = mirrored ? sp.phase + 1.35 : sp.phase
      const x = (mirrored ? 1 - sp.xPct - sp.wPct : sp.xPct) * width
      const w = Math.max(16, sp.wPct * width)

      // Smooth compound business growth wave (organic rise & pull-back!)
      const waveA = Math.sin(t * sp.freq + phaseOffset)
      const waveB = Math.sin(t * sp.freq * 0.52 - phaseOffset * 0.6) * 0.45
      const surge = (waveA + waveB) / 1.45 // -1..+1 smooth kinetic swing
      const hFrac = Math.max(0.08, sp.baseH + surge * sp.amp)
      const h = hFrac * height
      const y = baseLine - h

      // Peak-hold floating marker glides gently above the live bar top
      const peakFrac = sp.baseH + Math.max(0, surge * sp.amp) + 0.045 + Math.max(0, Math.cos(t * sp.freq + phaseOffset)) * 0.03
      const peakY = baseLine - peakFrac * height

      capPoints.push({ x: x + w * 0.5, y })

      const isSurging = surge > 0.32
      const strokeRgb = sp.accent === 'amber' || (isSurging && i === 1)
        ? '245, 158, 11'
        : sp.accent === 'bright' || isSurging
          ? '0, 229, 168'
          : sp.accent === 'teal'
            ? '20, 184, 166'
            : '16, 185, 129'

      // Background subtle ghost shadow pillar (creates depth without visual clutter)
      ctx.fillStyle = `rgba(${strokeRgb}, ${(0.03 * alpha).toFixed(3)})`
      ctx.fillRect(x + 3, peakY, w - 6, baseLine - peakY)

      // Active rising/falling business bar fill
      const fillGrad = ctx.createLinearGradient(x, y, x, baseLine)
      fillGrad.addColorStop(0, `rgba(${strokeRgb}, ${((isSurging ? 0.14 : 0.085) * alpha).toFixed(3)})`)
      fillGrad.addColorStop(0.55, `rgba(${strokeRgb}, ${(0.035 * alpha).toFixed(3)})`)
      fillGrad.addColorStop(1, `rgba(${strokeRgb}, ${(0.008 * alpha).toFixed(3)})`)
      ctx.fillStyle = fillGrad
      ctx.fillRect(x, y, w, h)

      // Clean architectural outline
      ctx.strokeStyle = `rgba(${strokeRgb}, ${((isSurging ? 0.34 : 0.22) * alpha).toFixed(3)})`
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, w, h)

      // Bright luminous cap bar at top of each rising/falling pillar
      ctx.fillStyle = `rgba(${strokeRgb}, ${((isSurging ? 0.68 : 0.44) * alpha).toFixed(3)})`
      ctx.fillRect(x, y, w, 2.4)

      // Floating peak-hold hairline & delicate vertical tether
      ctx.strokeStyle = `rgba(${strokeRgb}, ${(0.28 * alpha).toFixed(3)})`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(x + w * 0.15, peakY)
      ctx.lineTo(x + w * 0.85, peakY)
      ctx.stroke()

      // Segmented interior business-level tiers inside the bar
      const segStep = 18
      const segCount = Math.floor(h / segStep)
      for (let s = 1; s < segCount; s++) {
        const sy = baseLine - s * segStep
        const glowWave = 0.5 + 0.5 * Math.sin(t * 2.1 - s * 0.45 + phaseOffset)
        if (glowWave > 0.48) {
          ctx.fillStyle = `rgba(${strokeRgb}, ${((glowWave - 0.48) * 0.26 * alpha).toFixed(3)})`
          ctx.fillRect(x + w * 0.22, sy, w * 0.56, 2)
        }
      }

      // Smooth ascending data spark gliding upward along the surging bar's inner spine
      const sparkFrac = (t * (0.34 + i * 0.03) + phaseOffset * 0.25) % 1
      const sparkY = baseLine - sparkFrac * h
      const beamLen = Math.min(72, h * 0.32)
      const spineX = x + w * 0.5
      const beamGrad = ctx.createLinearGradient(spineX, sparkY + beamLen, spineX, sparkY)
      beamGrad.addColorStop(0, `rgba(${strokeRgb}, 0)`)
      beamGrad.addColorStop(0.75, `rgba(${strokeRgb}, ${(0.32 * alpha).toFixed(3)})`)
      beamGrad.addColorStop(1, `rgba(236, 253, 245, ${(0.52 * alpha).toFixed(3)})`)
      ctx.strokeStyle = beamGrad
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(spineX, Math.min(baseLine, sparkY + beamLen))
      ctx.lineTo(spineX, Math.max(y, sparkY))
      ctx.stroke()
    }

    // Live kinetic growth trendline smoothly threading across the moving pillar caps!
    if (capPoints.length >= 2) {
      ctx.save()
      ctx.strokeStyle = `rgba(0, 229, 168, ${(0.28 * alpha).toFixed(3)})`
      ctx.lineWidth = 1.35
      ctx.beginPath()
      ctx.moveTo(capPoints[0]!.x, capPoints[0]!.y - 8)
      for (let i = 1; i < capPoints.length; i++) {
        const prev = capPoints[i - 1]!
        const curr = capPoints[i]!
        const midX = (prev.x + curr.x) * 0.5
        const midY = ((prev.y + curr.y) * 0.5) - 8
        ctx.quadraticCurveTo(prev.x, prev.y - 8, midX, midY)
      }
      const last = capPoints[capPoints.length - 1]!
      ctx.lineTo(last.x, last.y - 8)
      ctx.stroke()

      for (const pt of capPoints) {
        ctx.fillStyle = `rgba(236, 253, 245, ${(0.45 * alpha).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(pt.x, pt.y - 8, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
  }

  drawFlankBars(false)
  drawFlankBars(true)
}

// =========================================================================
// SCENE 3 (Index 2): SPATIAL HEXAGON CITY RADAR SCANNER (Clear Spatial Map)
// =========================================================================
function renderSpatialHexScannerScene(ctx: CanvasRenderingContext2D, now: number, alpha: number) {
  if (alpha <= 0.005) return

  const hexR = width < 640 ? 34 : 46
  const hexW = SQRT3 * hexR
  const rowStep = 1.5 * hexR
  const cxCenter = width * 0.5
  const cyCenter = height * 0.48
  const maxDist = Math.hypot(cxCenter, cyCenter)

  const rows = Math.ceil(height / rowStep) + 2
  const cols = Math.ceil(width / hexW) + 2

  const radarAngle = (now * 0.00042) % (Math.PI * 2)

  // Soft circular radar sweep cone
  const coneRadius = Math.min(width, height) * 0.56
  ctx.save()
  ctx.translate(cxCenter, cyCenter)
  ctx.rotate(radarAngle)
  const sweepGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, coneRadius)
  sweepGrad.addColorStop(0, `rgba(0, 229, 168, ${(0.06 * alpha).toFixed(3)})`)
  sweepGrad.addColorStop(0.75, `rgba(16, 185, 129, ${(0.03 * alpha).toFixed(3)})`)
  sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0)')
  ctx.fillStyle = sweepGrad
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.arc(0, 0, coneRadius, -0.45, 0)
  ctx.closePath()
  ctx.fill()

  // Crisp radar sweep hairline
  ctx.strokeStyle = `rgba(0, 229, 168, ${(0.24 * alpha).toFixed(3)})`
  ctx.lineWidth = 1.15
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(coneRadius, 0)
  ctx.stroke()
  ctx.restore()

  // Clean concentric geographic distance rings (250m / 500m / 1km)
  const rings = [coneRadius * 0.36, coneRadius * 0.68, coneRadius]
  for (let i = 0; i < rings.length; i++) {
    ctx.save()
    if (i === 1) ctx.setLineDash([5, 9])
    ctx.strokeStyle = `rgba(16, 185, 129, ${((i === 1 ? 0.16 : 0.1) * alpha).toFixed(3)})`
    ctx.lineWidth = 0.9
    ctx.beginPath()
    ctx.arc(cxCenter, cyCenter, rings[i]!, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // Subtle honeycomb illuminated smoothly as the radar beam passes
  for (let row = -1; row <= rows; row++) {
    const rowOffset = (row & 1) ? hexW * 0.5 : 0
    for (let col = -1; col <= cols; col++) {
      const cx = col * hexW + rowOffset
      const cy = row * rowStep
      const dx = cx - cxCenter
      const dy = cy - cyCenter
      const dist = Math.hypot(dx, dy)
      if (dist > maxDist * 0.96) continue

      const ang = Math.atan2(dy, dx)
      // Angular distance trailing behind the rotating radar beam
      let trail = radarAngle - ang
      while (trail < 0) trail += Math.PI * 2
      while (trail >= Math.PI * 2) trail -= Math.PI * 2

      const radarGlow = trail < 1.15 ? Math.pow(1 - trail / 1.15, 2.2) : 0
      const baseGrid = 0.032 + 0.025 * (0.5 + 0.5 * Math.sin(dist * 0.015 - now * 0.0014))
      const cellIntensity = (baseGrid + radarGlow * 0.22) * alpha

      if (cellIntensity < 0.02) continue

      drawHexPath(ctx, cx, cy, hexR - 3)
      const h = deterministicHash(col + 101, row + 211)

      if (radarGlow > 0.32 && h < 0.28) {
        ctx.fillStyle = `rgba(16, 185, 129, ${(cellIntensity * 0.45).toFixed(3)})`
        ctx.fill()
      }
      ctx.strokeStyle = `rgba(16, 185, 129, ${(cellIntensity * 0.95).toFixed(3)})`
      ctx.lineWidth = 0.85
      ctx.stroke()
    }
  }

  // Subtle hex-edge spatial data pulses
  for (const cp of circuitPulses) {
    if (!prefersReducedMotion) {
      cp.progress += cp.speed
      if (cp.progress >= 1) {
        cp.progress = 0
        const stepDirs = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]
        const [dc, dr] = stepDirs[cp.dir % 6]!
        cp.col = (cp.col + dc + cols) % cols
        cp.row = (cp.row + dr + rows) % rows
        cp.dir = (cp.dir + (Math.random() < 0.5 ? 1 : 5)) % 6
      }
    }

    const rowOffset = (cp.row & 1) ? hexW * 0.5 : 0
    const cx = cp.col * hexW + rowOffset
    const cy = cp.row * rowStep
    const a1 = (Math.PI / 180) * (60 * cp.dir - 30)
    const a2 = (Math.PI / 180) * (60 * ((cp.dir + 1) % 6) - 30)
    const x1 = cx + (hexR - 3) * Math.cos(a1)
    const y1 = cy + (hexR - 3) * Math.sin(a1)
    const x2 = cx + (hexR - 3) * Math.cos(a2)
    const y2 = cy + (hexR - 3) * Math.sin(a2)
    const px = x1 + (x2 - x1) * cp.progress
    const py = y1 + (y2 - y1) * cp.progress

    ctx.strokeStyle = `rgba(0, 229, 168, ${(cp.alpha * 0.55 * alpha).toFixed(3)})`
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(px, py)
    ctx.stroke()
  }

  // Ultra-faint spatial telemetry labels (subtle data whispers)
  if (width >= 768) {
    ctx.save()
    ctx.font = '600 10px "JetBrains Mono", monospace'
    ctx.fillStyle = `rgba(52, 211, 153, ${(0.24 * alpha).toFixed(3)})`
    ctx.fillText('SPATIAL GRID · 500M RADIUS', width * 0.08, height * 0.24)
    ctx.fillText('OPEN DATA · 1,976 AREAS', width * 0.76, height * 0.24)
    ctx.restore()
  }
}

// =========================================================================
// SCENE 4 (Index 3): MARKET DEMAND & BUSINESS GROWTH WAVE GRAPH
// Silky flowing harmonic ribbons + rising opportunity curve
// =========================================================================
function renderMarketWavesScene(ctx: CanvasRenderingContext2D, now: number, alpha: number) {
  if (alpha <= 0.005) return

  const t = now * 0.00085
  const midY = height * 0.62

  // Faint horizontal measurement grid lines (clean analytical clarity!)
  for (let i = -2; i <= 2; i++) {
    const gy = midY + i * 74
    ctx.strokeStyle = `rgba(16, 185, 129, ${(0.055 * alpha).toFixed(3)})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(width, gy)
    ctx.stroke()
  }

  // 5 Silky Layered Harmonic Demand Waves gliding smoothly across the viewport
  const waves = [
    { amp: 46, freq: 0.0028, speed: 1.0, offsetY: -36, rgb: '16, 185, 129', lineAlpha: 0.26, fill: true },
    { amp: 34, freq: 0.0036, speed: -0.75, offsetY: 12, rgb: '0, 229, 168', lineAlpha: 0.22, fill: false },
    { amp: 28, freq: 0.0044, speed: 0.6, offsetY: 48, rgb: '20, 184, 166', lineAlpha: 0.18, fill: false },
    { amp: 24, freq: 0.0031, speed: 0.9, offsetY: -68, rgb: '245, 158, 11', lineAlpha: 0.18, fill: false },
  ]

  for (const wv of waves) {
    ctx.beginPath()
    for (let x = 0; x <= width; x += 14) {
      const slope = -((x / width) - 0.5) * 72 // Gently rising left -> right growth trend!
      const y = midY
        + wv.offsetY
        + slope
        + Math.sin(x * wv.freq + t * wv.speed) * wv.amp
        + Math.cos(x * wv.freq * 0.55 - t * wv.speed * 0.6) * (wv.amp * 0.38)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.strokeStyle = `rgba(${wv.rgb}, ${(wv.lineAlpha * alpha).toFixed(3)})`
    ctx.lineWidth = 1.4
    ctx.stroke()

    if (wv.fill) {
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, midY - 90, 0, height)
      grad.addColorStop(0, `rgba(${wv.rgb}, ${(0.07 * alpha).toFixed(3)})`)
      grad.addColorStop(1, `rgba(${wv.rgb}, 0)`)
      ctx.fillStyle = grad
      ctx.fill()
    }
  }

  // Smooth gliding milestone nodes along the primary demand growth wave
  const milestones = [
    { frac: 0.14, label: 'SUPPLY', tone: 'mint' },
    { frac: 0.36, label: 'DEMAND', tone: 'bright' },
    { frac: 0.66, label: 'ROOM', tone: 'bright' },
    { frac: 0.86, label: 'OPPORTUNITY', tone: 'amber' },
  ]

  for (let i = 0; i < milestones.length; i++) {
    const ms = milestones[i]!
    const mx = ms.frac * width
    const slope = -((mx / width) - 0.5) * 72
    const my = midY - 36 + slope + Math.sin(mx * 0.0028 + t) * 46 + Math.cos(mx * 0.00154 - t * 0.6) * 17.5
    const rgb = ms.tone === 'amber' ? '251, 191, 36' : '0, 229, 168'

    // Delicate vertical drop line down to baseline
    ctx.save()
    ctx.setLineDash([3, 6])
    ctx.strokeStyle = `rgba(${rgb}, ${(0.16 * alpha).toFixed(3)})`
    ctx.lineWidth = 0.9
    ctx.beginPath()
    ctx.moveTo(mx, my + 8)
    ctx.lineTo(mx, height * 0.92)
    ctx.stroke()
    ctx.restore()

    // Pulsing halo & core node
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.2 + i * 1.4)
    const glow = ctx.createRadialGradient(mx, my, 1, mx, my, 16 * pulse)
    glow.addColorStop(0, `rgba(${rgb}, ${(0.4 * alpha).toFixed(3)})`)
    glow.addColorStop(1, `rgba(${rgb}, 0)`)
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(mx, my, 16 * pulse, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(248, 250, 252, ${(0.65 * alpha).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(mx, my, 2.8, 0, Math.PI * 2)
    ctx.fill()

    if (width >= 768) {
      ctx.font = '600 9px "JetBrains Mono", monospace'
      ctx.fillStyle = `rgba(${rgb}, ${(0.28 * alpha).toFixed(3)})`
      ctx.fillText(ms.label, mx + 9, my - 7)
    }
  }
}

// =========================================================================
// SCENE 5 (Index 4): NUSANTARA TOPOGRAPHIC CONTOURS & KAWUNG COMPASS ROSE
// Smooth organic elevation contours + slow rotating Nusantara compass
// =========================================================================
function renderTopoCompassScene(ctx: CanvasRenderingContext2D, now: number, alpha: number) {
  if (alpha <= 0.005) return

  const t = now * 0.00055
  const cx = width * 0.5
  const cy = height * 0.49
  const maxR = Math.min(width, height) * 0.52

  // 7 Silky Organic Geographic Elevation Contour Loops (Bandung Basin Topography!)
  for (let ring = 1; ring <= 7; ring++) {
    const baseR = (ring / 7) * maxR * 1.18
    const ringAlpha = (0.065 + (ring % 2 === 0 ? 0.055 : 0.025)) * alpha

    ctx.beginPath()
    const steps = 96
    for (let s = 0; s <= steps; s++) {
      const ang = (s / steps) * Math.PI * 2
      const deform = Math.sin(ang * 3 + t + ring * 0.65) * 18
        + Math.cos(ang * 5 - t * 0.8 + ring) * 10
        + Math.sin(ang * 2 + ring * 1.1) * 24
      const rx = (baseR + deform) * 1.38
      const ry = (baseR + deform) * 0.82
      const px = cx + Math.cos(ang) * rx
      const py = cy + Math.sin(ang) * ry
      if (s === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.strokeStyle = ring === 4
      ? `rgba(245, 158, 11, ${(ringAlpha * 1.1).toFixed(3)})`
      : `rgba(16, 185, 129, ${(ringAlpha * 1.45).toFixed(3)})`
    ctx.lineWidth = ring === 4 ? 1.15 : 0.95
    ctx.stroke()
  }

  // Slow-Rotating Precision Nusantara Kawung Compass Rose in the vault center
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(t * 0.14)

  const compassR = Math.min(width, height) * 0.34
  ctx.strokeStyle = `rgba(0, 229, 168, ${(0.14 * alpha).toFixed(3)})`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(0, 0, compassR, 0, Math.PI * 2)
  ctx.stroke()

  // Fine compass degree ticks around the circle
  for (let deg = 0; deg < 72; deg++) {
    const ang = (deg / 72) * Math.PI * 2
    const major = deg % 9 === 0
    const r0 = compassR - (major ? 10 : 4)
    const r1 = compassR + (major ? 4 : 0)
    ctx.strokeStyle = major
      ? `rgba(245, 158, 11, ${(0.26 * alpha).toFixed(3)})`
      : `rgba(16, 185, 129, ${(0.12 * alpha).toFixed(3)})`
    ctx.lineWidth = major ? 1.2 : 0.8
    ctx.beginPath()
    ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0)
    ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1)
    ctx.stroke()
  }

  // 4-Petal Sacred Nusantara Kawung Geometric Compass Arms
  for (let p = 0; p < 4; p++) {
    ctx.save()
    ctx.rotate((p * Math.PI) / 2)
    ctx.strokeStyle = `rgba(0, 229, 168, ${(0.18 * alpha).toFixed(3)})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, -compassR * 0.15)
    ctx.quadraticCurveTo(compassR * 0.14, -compassR * 0.55, 0, -compassR * 0.92)
    ctx.quadraticCurveTo(-compassR * 0.14, -compassR * 0.55, 0, -compassR * 0.15)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

function renderFrame(now: number) {
  rafId = null
  if (!isVisible) return

  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (startTime === 0) startTime = now
  const elapsed = now - startTime

  ctx.clearRect(0, 0, width, height)

  // Compute synchronized silky crossfade weights for all 5 scenes
  const [wIndo, wSkyline, wRadar, wWaves, wTopo] = getSceneWeights(elapsed)

  // Sync Scene 1 (Indonesia Outline DOM/SVG) smoothly with exact same curve
  if (Math.abs(indonesiaOpacity.value - wIndo) > 0.004) {
    indonesiaOpacity.value = wIndo
  }

  // Render active 60fps Canvas Scenes (Scenes 2, 3, 4, 5)
  if (wSkyline > 0.005) renderBusinessSkylineScene(ctx, now, wSkyline)
  if (wRadar > 0.005) renderSpatialHexScannerScene(ctx, now, wRadar)
  if (wWaves > 0.005) renderMarketWavesScene(ctx, now, wWaves)
  if (wTopo > 0.005) renderTopoCompassScene(ctx, now, wTopo)

  // -------------------------------------------------------------------------
  // STICKY FLEXIBLE CURSOR HEXAGON CLUSTER (NEVER resets when scenes change!)
  // -------------------------------------------------------------------------
  if (!hasUserMoved) {
    // Only before user's very first mouse move: gentle resting anchor in lower-right
    targetX = width * (width < 640 ? 0.8 : 0.85)
    targetY = height * 0.72
    cursorVisibility += (0.55 - cursorVisibility) * 0.06
  } else if (pointerInside) {
    // Locked to user's actual pointer, even when mouse pauses or scenes cycle!
    cursorVisibility += (1 - cursorVisibility) * 0.1
  } else {
    // Smooth fade out when cursor leaves Hero completely (zero teleporting!)
    cursorVisibility += (0 - cursorVisibility) * 0.07
  }

  smoothX += (targetX - smoothX) * (prefersReducedMotion ? 1 : 0.16)
  smoothY += (targetY - smoothY) * (prefersReducedMotion ? 1 : 0.16)

  if (cursorVisibility > 0.01 || cellAlphas.size > 0 || ripples.length > 0) {
    // Smart proximity dimming: attenuate cursor hexes by ~80-85% when approaching central typography & buttons!
    const safeHalfW = Math.min(430, width * 0.34)
    const safeHalfH = Math.min(315, height * 0.37)
    const safeCx = width * 0.5
    const safeCy = height * 0.51
    const qx = Math.max(0, Math.abs(smoothX - safeCx) - safeHalfW)
    const qy = Math.max(0, Math.abs(smoothY - safeCy) - safeHalfH)
    const distFromTextZone = Math.hypot(qx, qy)
    // 0.16 inside text/button zone (~84% opacity reduction!) -> smoothly rises to 1.0 in open wings
    const textClearanceFactor = 0.16 + 0.84 * smoothstep(distFromTextZone / 135)

    // Subtle monochrome emerald cursor halo (also gently dims over typography!)
    if (cursorVisibility > 0.02) {
      const haloRadius = width < 640 ? 150 : 220
      const haloFactor = cursorVisibility * (0.28 + 0.72 * textClearanceFactor)
      const halo = ctx.createRadialGradient(smoothX, smoothY, 8, smoothX, smoothY, haloRadius)
      halo.addColorStop(0, `rgba(16, 185, 129, ${(0.068 * haloFactor).toFixed(3)})`)
      halo.addColorStop(0.55, `rgba(20, 184, 166, ${(0.024 * haloFactor).toFixed(3)})`)
      halo.addColorStop(1, 'rgba(16, 185, 129, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(smoothX, smoothY, haloRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    const hexR = width < 640 ? 29 : 40
    const hexW = SQRT3 * hexR
    const rowStep = 1.5 * hexR
    const clusterRadius = width < 640 ? 136 : 202
    // Lowered baseline opacity + ~84% attenuation right over center fonts & buttons
    const peakOpacity = (props.wordmarkHovered ? 0.18 : 0.165) * cursorVisibility * textClearanceFactor

    const minRow = Math.max(-1, Math.floor((smoothY - clusterRadius - 90) / rowStep) - 1)
    const maxRow = Math.ceil((smoothY + clusterRadius + 90) / rowStep) + 1
    const minCol = Math.max(-1, Math.floor((smoothX - clusterRadius - 90) / hexW) - 1)
    const maxCol = Math.ceil((smoothX + clusterRadius + 90) / hexW) + 1

    const visitedKeys = new Set<string>()
    let closestCell: { cx: number; cy: number; dist: number } | null = null

    for (let row = minRow; row <= maxRow; row++) {
      const rowOffset = (row & 1) ? hexW * 0.5 : 0
      for (let col = minCol; col <= maxCol; col++) {
        const cx = col * hexW + rowOffset
        const cy = row * rowStep
        const dist = Math.hypot(cx - smoothX, cy - smoothY)
        const spec = getCursorHexSpec(col, row)

        // Also gently dim individual cells that overlap the central text/button safe zone
        const cellQx = Math.max(0, Math.abs(cx - safeCx) - (safeHalfW - 18))
        const cellQy = Math.max(0, Math.abs(cy - safeCy) - (safeHalfH - 18))
        const cellTextDim = 0.22 + 0.78 * smoothstep(Math.hypot(cellQx, cellQy) / 115)

        const effectiveRadius = clusterRadius + spec.jitter
        let targetAlpha = 0
        if (dist < effectiveRadius && peakOpacity > 0.004) {
          const tFall = 1 - dist / effectiveRadius
          targetAlpha = tFall * tFall * (3 - 2 * tFall) * peakOpacity * spec.weight * cellTextDim
        }

        for (const rip of ripples) {
          const ringDist = Math.abs(Math.hypot(cx - rip.x, cy - rip.y) - rip.radius)
          if (ringDist < hexR * 1.15) {
            const boost = (1 - ringDist / (hexR * 1.15)) * rip.alpha * 0.16 * cellTextDim
            targetAlpha = Math.min(0.24, targetAlpha + boost)
          }
        }

        const key = `${col},${row}`
        visitedKeys.add(key)
        const prev = cellAlphas.get(key) ?? 0
        const next = prefersReducedMotion
          ? targetAlpha
          : prev + (targetAlpha - prev) * (targetAlpha > prev ? 0.16 : 0.085)

        if (next > 0.004) cellAlphas.set(key, next)
        else cellAlphas.delete(key)

        if (hasUserMoved && pointerInside && dist < hexR * 0.94 && (!closestCell || dist < closestCell.dist)) {
          closestCell = { cx, cy, dist }
        }
      }
    }

    for (const [key, prev] of cellAlphas.entries()) {
      if (!visitedKeys.has(key)) {
        const next = prev * 0.88
        if (next > 0.004) cellAlphas.set(key, next)
        else cellAlphas.delete(key)
      }
    }

    for (const [key, cellA] of cellAlphas.entries()) {
      const parts = key.split(',')
      const col = Number(parts[0])
      const row = Number(parts[1])
      const rowOffset = (row & 1) ? hexW * 0.5 : 0
      const cx = col * hexW + rowOffset
      const cy = row * rowStep
      drawStylizedMintHex(ctx, cx, cy, hexR, getCursorHexSpec(col, row), cellA)
    }

    if (closestCell && cursorVisibility > 0.1) {
      const pulse = prefersReducedMotion ? 1 : 0.86 + 0.14 * Math.sin(now * 0.0055)
      const activeBorderAlpha = 0.42 * pulse * cursorVisibility * (0.24 + 0.76 * textClearanceFactor)
      drawHexPath(ctx, closestCell.cx, closestCell.cy, hexR - 1.6)
      ctx.strokeStyle = `rgba(0, 229, 168, ${activeBorderAlpha.toFixed(3)})`
      ctx.lineWidth = 1.4
      ctx.stroke()

      ctx.fillStyle = `rgba(0, 229, 168, ${(activeBorderAlpha * 1.15).toFixed(3)})`
      ctx.beginPath()
      ctx.arc(closestCell.cx, closestCell.cy - (hexR - 1.6), 1.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(closestCell.cx, closestCell.cy + (hexR - 1.6), 1.8, 0, Math.PI * 2)
      ctx.fill()
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i]!
      rip.radius += 6.2
      rip.alpha *= 0.955
      if (rip.radius > rip.maxRadius || rip.alpha < 0.02) {
        ripples.splice(i, 1)
      } else {
        ctx.strokeStyle = `rgba(0, 229, 168, ${(rip.alpha * 0.22).toFixed(3)})`
        ctx.lineWidth = 1.15
        ctx.beginPath()
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  // Persistent delicate ambient fireflies (low subtle opacity!)
  for (let i = 0; i < fireflies.length; i++) {
    const p = fireflies[i]!
    if (!prefersReducedMotion) {
      p.x += p.vx + Math.sin(now * 0.0006 + p.phase) * 0.12
      p.y += p.vy
      if (p.y < -16) {
        p.y = height + 14
        p.x = Math.random() * width
      }
      if (p.x < -16) p.x = width + 14
      if (p.x > width + 16) p.x = -14
    }

    const flicker = prefersReducedMotion
      ? 0.65
      : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(now * p.speed + p.phase))
    const a = p.baseAlpha * flicker
    const rgb = p.tone === 'amber'
      ? '251, 191, 36'
      : p.tone === 'bright'
        ? '0, 229, 168'
        : '16, 185, 129'

    const glowR = p.size * 3.8
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR)
    g.addColorStop(0, `rgba(${rgb}, ${(a * 0.62).toFixed(3)})`)
    g.addColorStop(0.5, `rgba(${rgb}, ${(a * 0.16).toFixed(3)})`)
    g.addColorStop(1, `rgba(${rgb}, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(248, 250, 252, ${(a * 0.78).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2)
    ctx.fill()
  }

  if (!prefersReducedMotion) {
    rafId = window.requestAnimationFrame(renderFrame)
  }
}

function scheduleRender() {
  if (rafId === null && isVisible) {
    rafId = window.requestAnimationFrame(renderFrame)
  }
}

function updateCanvasSize() {
  const root = rootRef.value
  const canvas = canvasRef.value
  if (!root || !canvas) return

  const rect = root.getBoundingClientRect()
  width = Math.max(320, Math.round(rect.width))
  height = Math.max(540, Math.round(rect.height))
  dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (!hasUserMoved) {
    smoothX = width * 0.85
    smoothY = height * 0.72
    targetX = smoothX
    targetY = smoothY
  }

  seedParticles()
  scheduleRender()
}

function handlePointerMove(e: PointerEvent) {
  const root = rootRef.value
  if (!root) return
  const rect = root.getBoundingClientRect()
  const inside = e.clientX >= rect.left
    && e.clientX <= rect.right
    && e.clientY >= rect.top
    && e.clientY <= rect.bottom

  if (inside) {
    const nx = e.clientX - rect.left
    const ny = e.clientY - rect.top
    if (!hasUserMoved || !pointerInside) {
      // Snap smoothly to entry point when re-entering after leaving
      if (!pointerInside && hasUserMoved) {
        smoothX = nx
        smoothY = ny
      }
      hasUserMoved = true
    }
    pointerInside = true
    targetX = nx
    targetY = ny
    if (prefersReducedMotion) scheduleRender()
  } else {
    pointerInside = false
  }
}

function handlePointerDown(e: PointerEvent) {
  const root = rootRef.value
  if (!root || prefersReducedMotion) return
  const rect = root.getBoundingClientRect()
  if (
    e.clientX >= rect.left
    && e.clientX <= rect.right
    && e.clientY >= rect.top
    && e.clientY <= rect.bottom
  ) {
    ripples.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      radius: 14,
      maxRadius: 230,
      alpha: 0.85,
    })
  }
}

function handlePointerLeave() {
  pointerInside = false
}

onMounted(() => {
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  updateCanvasSize()

  if (rootRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => updateCanvasSize())
    resizeObserver.observe(rootRef.value)
  }

  if (rootRef.value && typeof IntersectionObserver !== 'undefined') {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isVisible = Boolean(entry?.isIntersecting)
        if (isVisible) scheduleRender()
      },
      { threshold: 0.01 },
    )
    intersectionObserver.observe(rootRef.value)
  }

  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  document.addEventListener('mouseleave', handlePointerLeave)

  scheduleRender()
})

onBeforeUnmount(() => {
  if (rafId !== null) window.cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  document.removeEventListener('mouseleave', handlePointerLeave)
})
</script>

<template>
  <div
    ref="rootRef"
    class="pointer-events-none absolute inset-0 overflow-hidden select-none bg-[#050C0F]"
    aria-hidden="true"
  >
    <!-- BASE VAULT: Deep Obsidian-Emerald Night Sky (Rock-solid, zero cursor parallax!) -->
    <div
      class="absolute inset-0"
      style="background:
        radial-gradient(ellipse 68% 52% at 50% 44%, rgba(16, 185, 129, 0.1) 0%, rgba(13, 66, 56, 0.12) 42%, rgba(5, 12, 15, 0) 78%),
        radial-gradient(ellipse 46% 36% at 84% 72%, rgba(16, 185, 129, 0.06) 0%, transparent 72%),
        radial-gradient(ellipse 46% 36% at 16% 62%, rgba(20, 184, 166, 0.06) 0%, transparent 72%),
        linear-gradient(180deg, #040B0D 0%, #071215 48%, #060F12 78%, #070C10 100%);"
    />

    <div
      class="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-3xl opacity-35 hero-aurora-breathe"
      style="background: radial-gradient(ellipse 64% 48% at 50% 35%, rgba(0, 229, 168, 0.16), rgba(20, 184, 166, 0.06) 55%, transparent 80%);"
    />

    <!-- =================================================================== -->
    <!-- SCENE 1 (Index 0): CRISP OUTLINE-ONLY INDONESIA MAP (Low Opacity!)  -->
    <!-- Rock-solid centered, silky 60fps crossfade controlled by canvas!    -->
    <!-- =================================================================== -->
    <div
      class="absolute inset-0 flex items-center justify-center will-change-[opacity]"
      :style="{ opacity: indonesiaOpacity }"
    >
      <div class="relative w-[92%] max-w-[1300px] aspect-[1270/510]">
        <!-- Pure Crisp Coastline Outline Only (No heavy filled blob, reduced opacity!) -->
        <img
          src="/images/indonesia-map-outline.png"
          alt=""
          class="absolute inset-0 w-full h-full object-contain opacity-[0.26] drop-shadow-[0_0_8px_rgba(0,229,168,0.3)]"
          draggable="false"
        >

        <!-- Silky Sabang -> Merauke Luminous Highlight Sweeping Strictly Along the Outline -->
        <div
          class="absolute inset-0 overflow-hidden opacity-65"
          style="-webkit-mask-image: url('/images/indonesia-map-outline.png'); mask-image: url('/images/indonesia-map-outline.png'); -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center;"
        >
          <div class="scene-indo-scan-beam absolute inset-y-0 w-[24%]" />
        </div>

        <!-- Delicate Low-Opacity Archipelago City Signals & Curved Sea Routes -->
        <svg
          viewBox="0 0 1270 510"
          class="absolute inset-0 w-full h-full overflow-visible opacity-75"
          preserveAspectRatio="xMidYMid meet"
          fill="none"
        >
          <defs>
            <filter id="indo-outline-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g stroke-linecap="round">
            <path
              id="indo-route-1"
              d="M 128 118 Q 262 218 370 376"
              stroke="#10B981"
              stroke-opacity="0.22"
              stroke-width="1.05"
              stroke-dasharray="4 8"
              class="animate-dash-flow-slow"
            />
            <path
              id="indo-route-2"
              d="M 370 376 Q 472 264 598 213"
              stroke="#00E5A8"
              stroke-opacity="0.22"
              stroke-width="1.05"
              stroke-dasharray="4 8"
              class="animate-dash-flow"
            />
            <path
              id="indo-route-3"
              d="M 370 376 Q 482 356 575 418 Q 640 376 686 314"
              stroke="#F59E0B"
              stroke-opacity="0.2"
              stroke-width="1"
              stroke-dasharray="4 9"
              class="animate-dash-flow-slow"
            />
            <path
              id="indo-route-4"
              d="M 598 213 Q 704 152 794 147 Q 866 205 922 276 Q 1060 226 1196 245"
              stroke="#14B8A6"
              stroke-opacity="0.18"
              stroke-width="1"
              stroke-dasharray="3 9"
              class="animate-dash-flow-slow"
            />

            <circle r="2.2" fill="#00E5A8" filter="url(#indo-outline-glow)">
              <animateMotion dur="6.2s" repeatCount="indefinite">
                <mpath href="#indo-route-1" />
              </animateMotion>
            </circle>
            <circle r="2.2" fill="#34D399" filter="url(#indo-outline-glow)">
              <animateMotion dur="6.8s" begin="1s" repeatCount="indefinite">
                <mpath href="#indo-route-2" />
              </animateMotion>
            </circle>
            <circle r="2.1" fill="#FBBF24" filter="url(#indo-outline-glow)">
              <animateMotion dur="7.8s" begin="1.5s" repeatCount="indefinite">
                <mpath href="#indo-route-3" />
              </animateMotion>
            </circle>
            <circle r="2" fill="#00E5A8" filter="url(#indo-outline-glow)">
              <animateMotion dur="9.2s" begin="0.5s" repeatCount="indefinite">
                <mpath href="#indo-route-4" />
              </animateMotion>
            </circle>
          </g>

          <g v-for="city in INDONESIA_CITIES" :key="city.id">
            <template v-if="city.accent === 'hero'">
              <circle :cx="city.x" :cy="city.y" r="14" fill="rgba(0, 229, 168, 0.14)" filter="url(#indo-outline-glow)" />
              <circle :cx="city.x" :cy="city.y" r="8" stroke="#00E5A8" stroke-width="1.2" class="hero-beacon-ping" />
              <circle :cx="city.x" :cy="city.y" r="8" stroke="#10B981" stroke-width="0.9" class="hero-beacon-ping-delayed" />
              <circle :cx="city.x" :cy="city.y" r="3.8" fill="#00E5A8" filter="url(#indo-outline-glow)" />
            </template>
            <template v-else>
              <circle
                :cx="city.x"
                :cy="city.y"
                :r="city.r"
                :fill="city.accent === 'amber' ? '#FBBF24' : city.accent === 'bright' ? '#00E5A8' : '#34D399'"
                fill-opacity="0.62"
              />
            </template>
          </g>
        </svg>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- UNIFIED 60FPS CANVAS ENGINE:                                        -->
    <!-- - Scenes 2..5 (Skyline, Hex Radar, Demand Waves, Topo Compass)      -->
    <!-- - Sticky Single-Color Varied-Style Luhur Mint Cursor Hex Mosaic     -->
    <!-- - Delicate Fireflies & Click Ripples                          -->
    <!-- =================================================================== -->
    <canvas
      ref="canvasRef"
      class="absolute inset-0 w-full h-full"
    />

    <!-- Soft Cinematic Vignette & Seamless Bottom Ground Blend -->
    <div
      class="absolute inset-0"
      style="background:
        radial-gradient(ellipse 88% 78% at 50% 48%, transparent 48%, rgba(4, 10, 12, 0.8) 100%),
        linear-gradient(180deg, rgba(4, 10, 12, 0.54) 0%, transparent 18%, transparent 82%, rgba(11, 13, 17, 0.94) 100%);"
    />
  </div>
</template>
