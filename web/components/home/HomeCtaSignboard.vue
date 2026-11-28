<script setup lang="ts">
import {
  ArrowRight,
  Building2,
  Bus,
  ChevronsDown,
  ClipboardX,
  Database,
  GraduationCap,
  School,
  Store,
  TrainFront,
} from 'lucide-vue-next'
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

const routeWrapRef = ref<HTMLElement | null>(null)
const gateWrapRef = ref<HTMLElement | null>(null)
const revealWrapRef = ref<HTMLElement | null>(null)
const routePathRef = ref<SVGPathElement | null>(null)
const routePathLength = ref<number>(1850)

const routeProgress = ref<number>(0)
const gateProgress = ref<number>(0)
const revealProgress = ref<number>(0)
const hoveredNode = ref<string | null>(null)
const ctaHovered = ref<boolean>(false)
const summitHovered = ref<boolean>(false)
const beaconHovered = ref<boolean>(false)
const flankHovered = ref<'left' | 'right' | null>(null)
const hoveredTileIdx = ref<number | null>(null)
const pulseBurstKey = ref<number>(0)
const pulseActive = ref<boolean>(false)
let pulseTimer: ReturnType<typeof setTimeout> | null = null

function triggerSummitPulse() {
  pulseBurstKey.value += 1
  pulseActive.value = true
  if (pulseTimer) clearTimeout(pulseTimer)
  pulseTimer = setTimeout(() => {
    pulseActive.value = false
  }, 1350)
}

let targetRoute = 0
let targetGate = 0
let targetReveal = 0
let rafId: number | null = null
let lastTs = 0
let reducedMotion = false

const routeIconMap = {
  campus: GraduationCap,
  school: School,
  office: Building2,
  station: TrainFront,
  terminal: Bus,
  market: Store,
} as const

const plateIconMap = {
  'open-data': Database,
  'no-surveys': ClipboardX,
  'no-listings': Store,
} as const

// Natural top-to-bottom measured flow along the descending emerald route (viewBox 1440 x 880)
const routeStations = [
  {
    id: 'campus' as const,
    label: 'CAMPUS',
    x: 240,
    y: 196,
    threshold: 0.16,
    hint: 'Student coffee demand & study clusters',
  },
  {
    id: 'school' as const,
    label: 'SCHOOL',
    x: 452,
    y: 312,
    threshold: 0.30,
    hint: 'Morning & afternoon neighborhood footfall',
  },
  {
    id: 'office' as const,
    label: 'OFFICE',
    x: 684,
    y: 416,
    threshold: 0.45,
    hint: 'Weekday commuter & lunch break flow',
  },
  {
    id: 'station' as const,
    label: 'STATION',
    x: 942,
    y: 518,
    threshold: 0.60,
    hint: 'Intercity & commuter transit hubs',
  },
  {
    id: 'terminal' as const,
    label: 'TERMINAL',
    x: 1146,
    y: 632,
    threshold: 0.74,
    hint: 'Angkot & bus corridor interchange',
  },
  {
    id: 'market' as const,
    label: 'MARKET',
    x: 866,
    y: 748,
    threshold: 0.86,
    hint: 'Everyday local commerce activity',
  },
]

// 3 chamfered methodology plaques positioned cleanly along the descending flow
const routePlaques = [
  {
    id: 'open-data' as const,
    label: 'OPEN DATA ONLY',
    xPct: 50,
    yPct: 24,
    threshold: 0.24,
  },
  {
    id: 'no-surveys' as const,
    label: 'NO SURVEYS',
    xPct: 33,
    yPct: 55,
    threshold: 0.50,
  },
  {
    id: 'no-listings' as const,
    label: 'NO LISTINGS',
    xPct: 80,
    yPct: 40,
    threshold: 0.68,
  },
]

// Continuous SVG path starting softly from top-center, sweeping through 6 demand hubs, and fading softly out at bottom-center
const mainRoutePathD =
  'M 720 0 L 720 76 C 720 132, 340 120, 240 196 C 175 246, 360 282, 452 312 C 546 342, 594 388, 684 416 C 788 448, 848 486, 942 518 C 1052 556, 1188 584, 1146 632 C 1106 678, 962 710, 866 748 C 776 784, 720 806, 720 880'

// Exact comet-head coordinates riding the tip of the scroll-drawn demand path
const cometPos = computed(() => {
  const pathEl = routePathRef.value
  const len = routePathLength.value
  if (!pathEl || len <= 0) {
    return { x: 720, y: 0, visible: false, opacity: 0 }
  }
  const p = Math.max(0, Math.min(1, routeProgress.value))
  try {
    const pt = pathEl.getPointAtLength(p * len)
    // Softly fade comet head as it enters the dissolving tail near the bottom
    const tailFade = p > 0.9 ? Math.max(0, 1 - (p - 0.9) / 0.095) : 1
    return { x: pt.x, y: pt.y, visible: p > 0.015 && p < 0.995, opacity: tailFade }
  } catch {
    return { x: 720, y: 0, visible: false, opacity: 0 }
  }
})

// 7 sculpted isometric stepped terraces for THE SUMMIT (viewBox 1440 x 600)
interface SummitTier {
  tier: number
  topY: number
  stepH: number
  halfW: number
  frontW: number
  depthY: number
}

const summitTiers: SummitTier[] = [
  { tier: 0, topY: 458, stepH: 46, halfW: 342, frontW: 196, depthY: 36 },
  { tier: 1, topY: 412, stepH: 42, halfW: 292, frontW: 168, depthY: 32 },
  { tier: 2, topY: 370, stepH: 38, halfW: 244, frontW: 140, depthY: 28 },
  { tier: 3, topY: 330, stepH: 36, halfW: 198, frontW: 114, depthY: 24 },
  { tier: 4, topY: 292, stepH: 34, halfW: 154, frontW: 88, depthY: 20 },
  { tier: 5, topY: 256, stepH: 32, halfW: 112, frontW: 64, depthY: 16 },
  { tier: 6, topY: 222, stepH: 30, halfW: 72, frontW: 42, depthY: 13 },
]

function tierTopPoints(t: SummitTier): string {
  const cx = 720
  const hw = t.halfW
  const fw = t.frontW
  const dy = t.depthY
  const y = t.topY
  return `${cx - hw},${y} ${cx - fw},${y - dy} ${cx + fw},${y - dy} ${cx + hw},${y} ${cx + fw},${y + dy} ${cx - fw},${y + dy}`
}

function tierLeftPoints(t: SummitTier): string {
  const cx = 720
  return `${cx - t.halfW},${t.topY} ${cx - t.frontW},${t.topY + t.depthY} ${cx - t.frontW},${t.topY + t.depthY + t.stepH} ${cx - t.halfW},${t.topY + t.stepH}`
}

function tierFrontPoints(t: SummitTier): string {
  const cx = 720
  return `${cx - t.frontW},${t.topY + t.depthY} ${cx + t.frontW},${t.topY + t.depthY} ${cx + t.frontW},${t.topY + t.depthY + t.stepH} ${cx - t.frontW},${t.topY + t.depthY + t.stepH}`
}

function tierRightPoints(t: SummitTier): string {
  const cx = 720
  return `${cx + t.frontW},${t.topY + t.depthY} ${cx + t.halfW},${t.topY} ${cx + t.halfW},${t.topY + t.stepH} ${cx + t.frontW},${t.topY + t.depthY + t.stepH}`
}

type TileKind = 'opportunity' | 'fair' | 'crowded' | 'low' | 'dim'

interface SummitTile {
  cx: number
  cy: number
  kind: TileKind
  delay: number
  dur: number
}

const summitTiles: SummitTile[] = [
  // Lower terraces
  { cx: 486, cy: 464, kind: 'opportunity', delay: 0, dur: 4.4 },
  { cx: 584, cy: 430, kind: 'fair', delay: 320, dur: 5.1 },
  { cx: 716, cy: 450, kind: 'crowded', delay: 640, dur: 4.8 },
  { cx: 904, cy: 442, kind: 'opportunity', delay: 960, dur: 4.2 },
  { cx: 610, cy: 472, kind: 'dim', delay: 120, dur: 5.6 },
  { cx: 816, cy: 474, kind: 'dim', delay: 440, dur: 5.3 },
  // Mid terraces
  { cx: 512, cy: 394, kind: 'crowded', delay: 520, dur: 4.9 },
  { cx: 626, cy: 374, kind: 'low', delay: 840, dur: 5.4 },
  { cx: 718, cy: 384, kind: 'dim', delay: 220, dur: 5.2 },
  { cx: 794, cy: 382, kind: 'dim', delay: 720, dur: 5.5 },
  { cx: 954, cy: 400, kind: 'low', delay: 1080, dur: 4.7 },
  // Upper terraces
  { cx: 562, cy: 344, kind: 'opportunity', delay: 420, dur: 4.1 },
  { cx: 836, cy: 350, kind: 'fair', delay: 780, dur: 4.8 },
  { cx: 882, cy: 338, kind: 'opportunity', delay: 1120, dur: 4.3 },
  { cx: 632, cy: 300, kind: 'fair', delay: 160, dur: 4.9 },
  { cx: 816, cy: 308, kind: 'crowded', delay: 560, dur: 4.6 },
]

function isoHexPoints(cx: number, cy: number, rx = 25, ry = 10.5): string {
  const dx = rx * 0.54
  return `${cx - rx},${cy} ${cx - dx},${cy - ry} ${cx + dx},${cy - ry} ${cx + rx},${cy} ${cx + dx},${cy + ry} ${cx - dx},${cy + ry}`
}

function isoPedestalSideLeft(cx: number, cy: number, rx: number, ry: number, h: number): string {
  const dx = rx * 0.54
  return `${cx - rx},${cy} ${cx - dx},${cy + ry} ${cx - dx},${cy + ry + h} ${cx - rx},${cy + h}`
}

function isoPedestalSideFront(cx: number, cy: number, rx: number, ry: number, h: number): string {
  const dx = rx * 0.54
  return `${cx - dx},${cy + ry} ${cx + dx},${cy + ry} ${cx + dx},${cy + ry + h} ${cx - dx},${cy + ry + h}`
}

function isoPedestalSideRight(cx: number, cy: number, rx: number, ry: number, h: number): string {
  const dx = rx * 0.54
  return `${cx + dx},${cy + ry} ${cx + rx},${cy} ${cx + rx},${cy + h} ${cx + dx},${cy + ry + h}`
}

function tileFill(kind: TileKind): string {
  if (kind === 'opportunity') return '#10B981'
  if (kind === 'fair') return '#D98A0C'
  if (kind === 'crowded') return '#CC3B3B'
  if (kind === 'low') return '#546478'
  return '#222B3A'
}

function tileStroke(kind: TileKind): string {
  if (kind === 'opportunity') return '#34D399'
  if (kind === 'fair') return '#FBBF24'
  if (kind === 'crowded') return '#F87171'
  if (kind === 'low') return '#94A3B8'
  return '#334155'
}

// Rich layered starfield with refreshing mint, pearl, and soft warm-amber starlight
const skyStars = [
  { x: 58, y: 46, r: 1.5, fill: '#E2E8F0', dur: 3.1, delay: 0.2 },
  { x: 112, y: 92, r: 1.1, fill: '#6EE7B7', dur: 4.2, delay: 1.1 },
  { x: 176, y: 34, r: 1.6, fill: '#F8FAFC', dur: 2.8, delay: 0.5 },
  { x: 234, y: 118, r: 1.2, fill: '#FCD34D', dur: 4.8, delay: 2.2 },
  { x: 298, y: 62, r: 1.4, fill: '#A7F3D0', dur: 3.6, delay: 0.9 },
  { x: 356, y: 28, r: 1.5, fill: '#E2E8F0', dur: 3.9, delay: 1.7 },
  { x: 424, y: 96, r: 1.1, fill: '#5EEAD4', dur: 4.4, delay: 0.4 },
  { x: 486, y: 48, r: 1.3, fill: '#F8FAFC', dur: 3.3, delay: 2.6 },
  { x: 548, y: 124, r: 1.0, fill: '#94A3B8', dur: 5.1, delay: 1.4 },
  { x: 604, y: 42, r: 1.2, fill: '#6EE7B7', dur: 3.7, delay: 0.8 },
  { x: 834, y: 38, r: 1.3, fill: '#A7F3D0', dur: 3.5, delay: 1.9 },
  { x: 896, y: 112, r: 1.1, fill: '#F8FAFC', dur: 4.6, delay: 0.3 },
  { x: 962, y: 54, r: 1.5, fill: '#FCD34D', dur: 3.2, delay: 2.1 },
  { x: 1028, y: 94, r: 1.2, fill: '#6EE7B7', dur: 4.1, delay: 0.7 },
  { x: 1094, y: 32, r: 1.6, fill: '#F8FAFC', dur: 2.9, delay: 1.5 },
  { x: 1156, y: 118, r: 1.1, fill: '#5EEAD4', dur: 4.9, delay: 2.8 },
  { x: 1218, y: 64, r: 1.4, fill: '#E2E8F0', dur: 3.4, delay: 0.6 },
  { x: 1284, y: 36, r: 1.3, fill: '#A7F3D0', dur: 4.0, delay: 1.2 },
  { x: 1344, y: 88, r: 1.5, fill: '#F8FAFC', dur: 3.0, delay: 2.3 },
  { x: 1396, y: 48, r: 1.2, fill: '#FCD34D', dur: 4.5, delay: 0.1 },
  { x: 86, y: 168, r: 1.1, fill: '#6EE7B7', dur: 4.3, delay: 1.8 },
  { x: 194, y: 162, r: 1.0, fill: '#CBD5E1', dur: 5.2, delay: 0.9 },
  { x: 312, y: 146, r: 1.2, fill: '#5EEAD4', dur: 3.8, delay: 2.5 },
  { x: 1132, y: 152, r: 1.2, fill: '#6EE7B7', dur: 4.1, delay: 1.3 },
  { x: 1252, y: 144, r: 1.1, fill: '#F8FAFC', dur: 3.6, delay: 2.0 },
  { x: 1368, y: 164, r: 1.2, fill: '#A7F3D0', dur: 4.7, delay: 0.4 },
]

// 6 crisp 4-point cross star flares twinkling gently across the upper sky
const starFlares = [
  { x: 146, y: 66, scale: 1.0, fill: '#A7F3D0', dur: 4.4, delay: 0.4 },
  { x: 392, y: 58, scale: 0.85, fill: '#FDE68A', dur: 5.2, delay: 1.8 },
  { x: 564, y: 78, scale: 0.72, fill: '#6EE7B7', dur: 3.9, delay: 0.9 },
  { x: 878, y: 72, scale: 0.78, fill: '#6EE7B7', dur: 4.6, delay: 2.1 },
  { x: 1054, y: 56, scale: 0.95, fill: '#A7F3D0', dur: 3.8, delay: 1.1 },
  { x: 1308, y: 68, scale: 1.05, fill: '#FDE68A', dur: 4.9, delay: 2.7 },
]

// Floating Bandung night fireflies ("kunang-kunang") rising smoothly from valley & flanks
const valleyFireflies = [
  { x: 128, y: 492, r: 2.2, fill: '#00E5A8', dur: 6.4, delay: 0 },
  { x: 224, y: 518, r: 1.8, fill: '#FBBF24', dur: 7.2, delay: 1.4 },
  { x: 318, y: 478, r: 2.0, fill: '#34D399', dur: 5.8, delay: 2.6 },
  { x: 404, y: 534, r: 1.7, fill: '#5EEAD4', dur: 6.9, delay: 0.8 },
  { x: 544, y: 512, r: 1.9, fill: '#00E5A8', dur: 6.2, delay: 3.1 },
  { x: 646, y: 542, r: 1.6, fill: '#FDE68A', dur: 7.5, delay: 1.9 },
  { x: 804, y: 536, r: 1.8, fill: '#34D399', dur: 6.1, delay: 0.5 },
  { x: 912, y: 510, r: 2.1, fill: '#00E5A8', dur: 6.8, delay: 2.3 },
  { x: 1042, y: 528, r: 1.7, fill: '#FBBF24', dur: 7.0, delay: 1.1 },
  { x: 1138, y: 486, r: 2.0, fill: '#5EEAD4', dur: 5.9, delay: 3.4 },
  { x: 1236, y: 522, r: 2.2, fill: '#00E5A8', dur: 6.6, delay: 0.7 },
  { x: 1336, y: 496, r: 1.8, fill: '#FDE68A', dur: 7.3, delay: 2.0 },
]

// Sculpted 4-layer alpine-volcanic mountain panorama with sunlit & shadow facets (zero flat cardboard zigzags!)
const farAlpineRangeD =
  'M 0 218 Q 76 168, 166 184 Q 252 132, 336 122 Q 416 154, 496 144 Q 584 184, 658 178 Q 720 198, 782 178 Q 856 184, 944 144 Q 1024 154, 1104 122 Q 1188 132, 1274 184 Q 1364 168, 1440 218'

const backRidgeCrestD =
  'M 0 248 L 92 176 L 166 204 L 254 146 L 348 192 L 434 158 L 538 206 L 626 178 L 720 216 L 814 178 L 902 206 L 1006 158 L 1092 192 L 1186 146 L 1274 204 L 1348 176 L 1440 248'

// Moonlit aurora-kissed left slope facets giving sculptural 3D relief to the back volcanic peaks
const backMountainLitFacets = [
  'M 92 176 L 0 248 L 62 292 L 112 246 Z',
  'M 254 146 L 166 204 L 228 296 L 274 242 Z',
  'M 434 158 L 348 192 L 408 298 L 456 244 Z',
  'M 626 178 L 538 206 L 598 300 L 642 252 Z',
  'M 814 178 L 720 216 L 786 300 L 834 252 Z',
  'M 1006 158 L 902 206 L 972 298 L 1026 244 Z',
  'M 1186 146 L 1092 192 L 1152 296 L 1206 240 Z',
  'M 1348 176 L 1274 204 L 1318 292 L 1368 244 Z',
] as const

// Delicate glowing ridge spine crease lines descending from major peaks
const backMountainSpines = [
  'M 92 176 L 112 246',
  'M 254 146 L 274 242',
  'M 434 158 L 456 244',
  'M 1006 158 L 1026 244',
  'M 1186 146 L 1206 240',
  'M 1348 176 L 1368 244',
] as const

const midRidgeCrestD =
  'M 0 294 Q 112 230, 214 252 Q 326 204, 444 242 Q 558 214, 650 248 Q 720 228, 790 248 Q 882 214, 996 242 Q 1114 204, 1226 252 Q 1328 230, 1440 294'

const foreRidgeCrestD =
  'M 0 348 Q 160 288, 336 318 Q 512 276, 720 306 Q 928 276, 1104 318 Q 1280 288, 1440 348'

const ridgePeakBeacons = [
  { x: 92, y: 176, r: 2.2, delay: -0.2 },
  { x: 254, y: 146, r: 2.7, delay: -1.0 },
  { x: 434, y: 158, r: 2.3, delay: -1.8 },
  { x: 626, y: 178, r: 2.0, delay: -2.4 },
  { x: 814, y: 178, r: 2.0, delay: -0.6 },
  { x: 1006, y: 158, r: 2.3, delay: -1.4 },
  { x: 1186, y: 146, r: 2.7, delay: -2.1 },
  { x: 1348, y: 176, r: 2.2, delay: -0.9 },
]

// Winding luminous spirit trail ascending the 7-tier stepped pyramid straight into the Summit Beacon (720, 126)
const summitClimbPathD =
  'M 342 554 C 430 512, 560 504, 706 492 C 858 480, 964 442, 950 400 C 934 354, 818 352, 712 342 C 600 332, 540 312, 578 288 C 622 260, 782 260, 796 228 C 804 208, 742 178, 720 126'

const summitPathNodes = [
  { x: 462, y: 512, delay: 0 },
  { x: 742, y: 488, delay: 0.5 },
  { x: 948, y: 408, delay: 1.0 },
  { x: 822, y: 352, delay: 1.5 },
  { x: 572, y: 300, delay: 2.0 },
  { x: 786, y: 240, delay: 2.5 },
]

// Graceful curved telemetry conduits linking Left & Right Nusantara Pavilions into the main stepped pyramid
const leftFlankLinkD = 'M 288 456 C 328 456, 354 468, 392 474'
const rightFlankLinkD = 'M 1152 456 C 1112 456, 1086 468, 1048 474'

// 7-Hex (~500 m) honeycomb coordinates for the Right Nusantara Spatial Astrolabe Pavilion
const rightAstrolabeHexes = [
  { cx: 0, cy: -16, fill: '#10B981', stroke: '#6EE7B7' },
  { cx: 14, cy: -8, fill: '#D98A0C', stroke: '#FCD34D' },
  { cx: 14, cy: 8, fill: '#10B981', stroke: '#6EE7B7' },
  { cx: 0, cy: 16, fill: '#CC3B3B', stroke: '#FCA5A5' },
  { cx: -14, cy: 8, fill: '#D98A0C', stroke: '#FCD34D' },
  { cx: -14, cy: -8, fill: '#5A6B80', stroke: '#CBD5E1' },
] as const

function miniHexPts(cx: number, cy: number, r = 7.4): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

const tileHintMap: Record<Exclude<TileKind, 'dim'>, { badge: string; desc: string; color: string }> = {
  opportunity: { badge: 'OPPORTUNITY', desc: 'Fewer coffee shops than local demand typically supports', color: '#34D399' },
  fair: { badge: 'FAIR', desc: 'Coffee shops match what local demand typically supports', color: '#FBBF24' },
  crowded: { badge: 'CROWDED', desc: 'More coffee shops than nearby demand typically supports', color: '#F87171' },
  low: { badge: 'NOT ENOUGH DEMAND', desc: 'Too few people nearby for steady daily custom', color: '#CBD5E1' },
}

const activeHoverHud = computed(() => {
  if (hoveredTileIdx.value !== null) {
    const t = summitTiles[hoveredTileIdx.value]
    if (t && t.kind !== 'dim') return tileHintMap[t.kind]
  }
  if (flankHovered.value === 'left') {
    return {
      badge: 'KEDAI KOPI · NUSANTARA',
      desc: 'Live open-data coverage across 1,976 mapped neighborhood areas',
      color: '#34D399',
    }
  }
  if (flankHovered.value === 'right') {
    return {
      badge: 'AREA + 6 NEIGHBORS · ~500 M',
      desc: 'Every label counts the area plus its 6 immediate neighbors',
      color: '#FBBF24',
    }
  }
  if (beaconHovered.value) {
    return {
      badge: 'ASCEND SUMMIT BEACON',
      desc: 'Click to send an emerald signal pulse across the night skyline',
      color: '#00E5A8',
    }
  }
  if (summitHovered.value) {
    return {
      badge: 'ASCEND SIGNAL SUMMIT',
      desc: 'Hover any colored tile to inspect labels, or click to pulse the aurora',
      color: '#6EE7B7',
    }
  }
  return null
})

const auroraIntensity = computed(() => {
  if (pulseActive.value) return 1
  if (summitHovered.value || beaconHovered.value || ctaHovered.value) return 0.96
  if (flankHovered.value || hoveredTileIdx.value !== null) return 0.86
  return 0.72
})

function measureScrollTargets() {
  if (reducedMotion) {
    targetRoute = 1
    targetGate = 1
    targetReveal = 1
    return
  }
  const vh = window.innerHeight || 900

  if (routeWrapRef.value) {
    const rect = routeWrapRef.value.getBoundingClientRect()
    // Start drawing slightly deeper into the viewport so Team finishes fading out first
    const focalY = vh * 0.58
    const raw = (focalY - rect.top) / Math.max(1, rect.height * 0.92)
    targetRoute = Math.max(0, Math.min(1, raw))
  }

  if (gateWrapRef.value) {
    const rect = gateWrapRef.value.getBoundingClientRect()
    // 0 while the Scroll-Down cue sits near bottom; ramps to 1 as the user scrolls past it
    const raw = (vh * 0.78 - rect.top) / Math.max(1, vh * 0.56)
    targetGate = Math.max(0, Math.min(1, raw))
  }

  if (revealWrapRef.value) {
    const rect = revealWrapRef.value.getBoundingClientRect()
    // Signboard reveals smoothly right AFTER crossing the Scroll-Down cue
    const raw = (vh * 0.80 - rect.top) / Math.max(1, vh * 0.74)
    targetReveal = Math.max(0, Math.min(1, raw))
  }
}

function tick(ts: number) {
  const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016
  lastTs = ts
  const blend = reducedMotion ? 1 : 1 - Math.exp(-9.2 * dt)

  routeProgress.value += (targetRoute - routeProgress.value) * blend
  gateProgress.value += (targetGate - gateProgress.value) * blend
  revealProgress.value += (targetReveal - revealProgress.value) * blend

  if (Math.abs(targetRoute - routeProgress.value) < 0.0005) {
    routeProgress.value = targetRoute
  }
  if (Math.abs(targetGate - gateProgress.value) < 0.0005) {
    gateProgress.value = targetGate
  }
  if (Math.abs(targetReveal - revealProgress.value) < 0.0005) {
    revealProgress.value = targetReveal
  }

  if (
    routeProgress.value !== targetRoute
    || gateProgress.value !== targetGate
    || revealProgress.value !== targetReveal
  ) {
    rafId = window.requestAnimationFrame(tick)
  } else {
    rafId = null
  }
}

function scheduleTick() {
  measureScrollTargets()
  if (rafId === null) {
    lastTs = 0
    rafId = window.requestAnimationFrame(tick)
  }
}

// Act 1 gentle fade-in right after Team fades out
const routeEntryFade = computed(() =>
  reducedMotion ? 1 : Math.max(0.08, Math.min(1, routeProgress.value * 4.2)),
)

// Gate scroll-down prompt: blooms once demand line reaches MARKET, then fades out smoothly as CTA Signboard rises!
const scrollGateOpacity = computed(() => {
  if (reducedMotion) return 0
  const enter = Math.max(0, Math.min(1, (routeProgress.value - 0.62) / 0.25))
  const exit = Math.max(0, 1 - Math.max(0, (revealProgress.value - 0.06) / 0.34))
  return enter * exit
})

const scrollGateTranslateY = computed(() => {
  if (reducedMotion) return 0
  return Math.max(0, (revealProgress.value - 0.06) / 0.34) * -22
})

// Signboard waits behind the Scroll-Down cue, then glides up & blossoms into sharp focus!
const signboardReveal = computed(() =>
  reducedMotion ? 1 : Math.max(0, Math.min(1, (revealProgress.value - 0.14) / 0.42)),
)

const beaconReveal = computed(() =>
  reducedMotion ? 1 : Math.max(0, Math.min(1, (revealProgress.value - 0.22) / 0.46)),
)

const summitRise = computed(() =>
  reducedMotion ? 1 : Math.max(0, Math.min(1, (revealProgress.value - 0.26) / 0.56)),
)

// Rock-steady scroll-only mountain rise (zero distracting horizontal cursor sway!)
const backRidgeTransform = computed(() => {
  if (reducedMotion) return ''
  const y = ((1 - summitRise.value) * 22).toFixed(1)
  return `translate(0, ${y})`
})

const midRidgeTransform = computed(() => {
  if (reducedMotion) return ''
  const y = ((1 - summitRise.value) * 14).toFixed(1)
  return `translate(0, ${y})`
})

const foreRidgeTransform = computed(() => {
  if (reducedMotion) return ''
  const y = ((1 - summitRise.value) * 8).toFixed(1)
  return `translate(0, ${y})`
})

// Staggered kinetic rise for each of the 7 pyramid terraces as user scrolls down
function tierRiseTransform(tier: number): string {
  if (reducedMotion) return ''
  const local = Math.max(0, Math.min(1, (summitRise.value - tier * 0.055) / 0.55))
  const eased = 1 - Math.pow(1 - local, 3)
  const dy = ((1 - eased) * (34 + tier * 5)).toFixed(1)
  return `translate(0, ${dy})`
}

function tierOpacity(tier: number): number {
  if (reducedMotion) return 1
  const local = Math.max(0, Math.min(1, (summitRise.value - tier * 0.05) / 0.45))
  return Number((0.18 + local * 0.82).toFixed(2))
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (routePathRef.value) {
    routePathLength.value = routePathRef.value.getTotalLength() || 1850
  }
  measureScrollTargets()
  routeProgress.value = targetRoute
  gateProgress.value = targetGate
  revealProgress.value = targetReveal
  window.addEventListener('scroll', scheduleTick, { passive: true })
  window.addEventListener('resize', scheduleTick, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleTick)
  window.removeEventListener('resize', scheduleTick)
  if (rafId !== null) window.cancelAnimationFrame(rafId)
  if (pulseTimer) clearTimeout(pulseTimer)
})
</script>

<template>
  <section
    id="mulai"
    class="relative w-full bg-[#090D12] overflow-x-clip"
  >
    <!-- ==================== ACT 1: SCROLL-DRAWN DESCENDING DEMAND ROUTE (FADES IN AFTER TEAM, FADES OUT AT TAIL) ==================== -->
    <div
      ref="routeWrapRef"
      class="relative w-full max-w-[1440px] mx-auto pt-12 sm:pt-16 pb-0 px-5 sm:px-8 transition-opacity duration-300"
      :style="{ opacity: routeEntryFade }"
    >
      <!-- Subtle top-left context pill matching reference artwork -->
      <div class="relative z-20 flex items-center justify-between gap-4 mb-6 md:mb-0">
        <div
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E141D]/90 border border-white/10 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-secondary shadow-lg transition-all duration-500"
          :style="{
            opacity: Math.min(1, 0.25 + routeProgress * 3.2),
            transform: `translate3d(0, ${(1 - Math.min(1, routeProgress * 3)) * 10}px, 0)`,
          }"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-mint open-sign-glow shrink-0" />
          <span>{{ HOME_COPY.footer.captionChip }}</span>
        </div>

        <span class="inline-flex font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted/80">
          SCROLL TO TRACE DEMAND
        </span>
      </div>

      <!-- DESKTOP INTERACTIVE SCROLL-DRAWN ROUTE CANVAS (1440 x 880) -->
      <div class="block relative w-full aspect-[1440/880] max-h-[860px] mx-auto">
        <svg
          viewBox="0 0 1440 880"
          class="w-full h-full overflow-visible select-none"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="ascend-route-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="ascend-comet-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="6" result="blur1" />
              <feGaussianBlur stdDeviation="2.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <!-- Soft fade-in at entry top AND graceful fade-out at end tail before the Scroll-Down cue -->
            <linearGradient
              id="ascend-route-stroke"
              gradientUnits="userSpaceOnUse"
              x1="720"
              y1="0"
              x2="720"
              y2="880"
            >
              <stop offset="0%" stop-color="#00E5A8" stop-opacity="0" />
              <stop offset="6%" stop-color="#00E5A8" stop-opacity="1" />
              <stop offset="52%" stop-color="#10B981" stop-opacity="1" />
              <stop offset="85%" stop-color="#34D399" stop-opacity="1" />
              <stop offset="94%" stop-color="#10B981" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
            </linearGradient>
            <linearGradient
              id="ascend-guide-fade"
              gradientUnits="userSpaceOnUse"
              x1="720"
              y1="0"
              x2="720"
              y2="880"
            >
              <stop offset="0%" stop-color="#243142" stop-opacity="0" />
              <stop offset="7%" stop-color="#243142" stop-opacity="0.9" />
              <stop offset="86%" stop-color="#243142" stop-opacity="0.85" />
              <stop offset="100%" stop-color="#243142" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="ascend-contour-fade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#2B3748" stop-opacity="0" />
              <stop offset="22%" stop-color="#2B3748" stop-opacity="0.45" />
              <stop offset="78%" stop-color="#2B3748" stop-opacity="0.45" />
              <stop offset="100%" stop-color="#2B3748" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- Sweeping dark topographic Bandung valley contour lines -->
          <g stroke="url(#ascend-contour-fade)" stroke-width="1">
            <path d="M 0 190 Q 380 250 760 220 T 1440 310" />
            <path d="M 0 285 Q 410 345 790 318 T 1440 415" />
            <path d="M 0 385 Q 430 442 810 418 T 1440 520" />
            <path d="M 0 490 Q 450 545 830 522 T 1440 628" />
            <path d="M 0 600 Q 460 648 840 626 T 1440 732" />
            <path d="M 0 715 Q 470 756 850 735 T 1440 830" />
          </g>

          <!-- Subtle secondary curved return guideline -->
          <path
            d="M 720 44 Q 940 165, 1146 632"
            stroke="#10B981"
            stroke-opacity="0.14"
            stroke-width="1.2"
            stroke-dasharray="2 7"
          />

          <!-- Top-Center Emergence Ring Anchor -->
          <circle
            cx="720"
            cy="32"
            r="5.5"
            fill="#090D12"
            stroke="#10B981"
            stroke-width="1.6"
            :opacity="Math.min(1, routeProgress * 4.5)"
          />
          <circle
            cx="720"
            cy="32"
            r="2.2"
            fill="#00E5A8"
            :opacity="Math.min(1, routeProgress * 4.5)"
          />

          <!-- Faint Dormant Dashed Guide Track (Fades out cleanly at bottom tail) -->
          <path
            :d="mainRoutePathD"
            stroke="url(#ascend-guide-fade)"
            stroke-width="1.8"
            stroke-dasharray="5 8"
            stroke-linecap="round"
          />

          <!-- Active Scroll-Drawn Luminous Emerald Route (Fades smoothly at tail) -->
          <path
            ref="routePathRef"
            :d="mainRoutePathD"
            stroke="url(#ascend-route-stroke)"
            stroke-width="2.6"
            stroke-linecap="round"
            filter="url(#ascend-route-glow)"
            :stroke-dasharray="routePathLength"
            :stroke-dashoffset="Math.max(0, routePathLength * (1 - routeProgress))"
          />

          <!-- Secondary Flowing Micro-Dashes Overlay Along Lit Section -->
          <path
            :d="mainRoutePathD"
            stroke="url(#ascend-route-stroke)"
            stroke-width="1.2"
            stroke-dasharray="3 18"
            stroke-linecap="round"
            class="animate-dash-flow"
            :opacity="routeProgress > 0.06 ? 0.52 : 0"
          />

          <!-- Leading Luminous Comet Orb Riding the Tip of the Scroll-Drawn Line -->
          <g
            v-if="cometPos.visible"
            filter="url(#ascend-comet-glow)"
            :opacity="cometPos.opacity"
          >
            <circle
              :cx="cometPos.x"
              :cy="cometPos.y"
              r="11"
              fill="#10B981"
              fill-opacity="0.24"
            />
            <circle
              :cx="cometPos.x"
              :cy="cometPos.y"
              r="5"
              fill="#00E5A8"
              stroke="#FFFFFF"
              stroke-width="1.4"
            />
          </g>

          <!-- Ambient Sparkle Pulses Streaming Down the Active Route once lit -->
          <g v-if="routeProgress > 0.35" filter="url(#ascend-route-glow)">
            <circle r="2.6" fill="#34D399" opacity="0.78">
              <animateMotion dur="7.5s" repeatCount="indefinite" :path="mainRoutePathD" />
            </circle>
            <circle r="2.0" fill="#00E5A8" opacity="0.68">
              <animateMotion dur="7.5s" begin="3.75s" repeatCount="indefinite" :path="mainRoutePathD" />
            </circle>
          </g>
        </svg>

        <!-- 6 Interactive Glowing Hexagonal Demand Stations Positioned Along the Descending Curve -->
        <div
          v-for="station in routeStations"
          :key="station.id"
          class="absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center cursor-default z-20"
          :style="{
            left: `${(station.x / 1440) * 100}%`,
            top: `${(station.y / 880) * 100}%`,
          }"
          @mouseenter="hoveredNode = station.id"
          @mouseleave="hoveredNode = null"
        >
          <div
            class="relative w-14 h-14 flex items-center justify-center transition-all duration-500 ease-signal group-hover:-translate-y-1.5 group-hover:scale-110"
            :class="routeProgress >= station.threshold ? 'scale-100 opacity-100' : 'scale-90 opacity-40'"
          >
            <!-- Ignition Emerald Ripple Halo -->
            <span
              class="pointer-events-none absolute -inset-3 rounded-full transition-opacity duration-500"
              :class="routeProgress >= station.threshold ? 'opacity-100' : 'opacity-0'"
              style="background: radial-gradient(circle, rgba(16, 185, 129, 0.34), rgba(20, 184, 166, 0.12) 45%, transparent 72%);"
            />
            <span
              v-if="routeProgress >= station.threshold"
              class="pointer-events-none absolute -inset-1 rounded-full border border-mint/40 animate-ping"
              style="animation-duration: 3.4s;"
            />

            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
              <polygon
                points="28,3 50,15.5 50,40.5 28,53 6,40.5 6,15.5"
                :fill="routeProgress >= station.threshold ? '#0E1C1A' : '#111620'"
                :stroke="
                  hoveredNode === station.id
                    ? '#00E5A8'
                    : routeProgress >= station.threshold
                      ? '#10B981'
                      : '#2D3A4C'
                "
                stroke-width="1.7"
              />
            </svg>

            <component
              :is="routeIconMap[station.id]"
              class="w-[18px] h-[18px] absolute transition-colors duration-300"
              :class="
                hoveredNode === station.id
                  ? 'text-[#00E5A8]'
                  : routeProgress >= station.threshold
                    ? 'text-mint'
                    : 'text-[#64748B]'
              "
              :stroke-width="1.9"
            />
          </div>

          <span
            class="mt-1.5 px-2.5 py-0.5 rounded bg-[#0B1018]/90 border font-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase transition-all duration-300"
            :class="
              routeProgress >= station.threshold
                ? 'border-mint/45 text-ink-primary shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                : 'border-white/10 text-ink-muted'
            "
          >
            {{ station.label }}
          </span>

          <!-- Hover Micro-Hint Card -->
          <span
            class="pointer-events-none mt-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#101722]/95 border border-mint/35 font-sans text-[11px] text-ink-secondary shadow-xl transition-all duration-200"
            :class="hoveredNode === station.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'"
          >
            {{ station.hint }}
          </span>
        </div>

        <!-- 3 Chamfered Signal Plaques Unlocking Along the Route (OPEN DATA ONLY / NO SURVEYS / NO LISTINGS) -->
        <div
          v-for="plaque in routePlaques"
          :key="plaque.id"
          class="absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-500 ease-signal"
          :style="{
            left: `${plaque.xPct}%`,
            top: `${plaque.yPct}%`,
            opacity: routeProgress >= plaque.threshold ? 1 : 0.18,
            transform: `translate(-50%, ${routeProgress >= plaque.threshold ? '-50%' : 'calc(-50% + 14px)'}) scale(${routeProgress >= plaque.threshold ? 1 : 0.94})`,
          }"
        >
          <div class="chamfer-tr shadow-[0_14px_34px_rgba(0,0,0,0.6)]">
            <div
              class="chamfer-tr-inner px-4 py-2.5 flex items-center gap-2.5 transition-colors duration-300"
              :class="routeProgress >= plaque.threshold ? 'border-mint/40 bg-[#121923]/95' : 'bg-[#0F141D]/90'"
            >
              <component
                :is="plateIconMap[plaque.id]"
                class="w-3.5 h-3.5 shrink-0 transition-colors duration-300"
                :class="routeProgress >= plaque.threshold ? 'text-mint' : 'text-ink-muted'"
                :stroke-width="2"
              />
              <span class="font-display font-bold text-[12px] lg:text-[13px] tracking-[0.06em] text-ink-primary whitespace-nowrap">
                {{ plaque.label }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden" aria-hidden="true">
        <div class="absolute left-4 top-0 bottom-0 w-[2px] bg-[#1F2937] rounded-full overflow-hidden" aria-hidden="true">
          <div
            class="w-full bg-gradient-to-b from-[#00E5A8] via-mint to-transparent transition-all duration-200"
            :style="{ height: `${Math.round(routeProgress * 100)}%` }"
          />
        </div>

        <div class="flex flex-wrap gap-2 pb-2">
          <div
            v-for="plaque in routePlaques"
            :key="plaque.id"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121923] border border-mint/30 font-display font-bold text-[10.5px] tracking-[0.05em] text-ink-primary"
          >
            <component :is="plateIconMap[plaque.id]" class="w-3 h-3 text-mint shrink-0" />
            <span>{{ plaque.label }}</span>
          </div>
        </div>

        <div
          v-for="station in routeStations"
          :key="station.id"
          class="relative flex items-center gap-3 rounded-xl bg-[#101620]/90 border px-3.5 py-2.5 transition-all duration-300"
          :class="routeProgress >= station.threshold ? 'border-mint/45' : 'border-white/10 opacity-65'"
        >
          <span
            class="absolute -left-[31px] w-3 h-3 rounded-full border-2 transition-colors"
            :class="routeProgress >= station.threshold ? 'bg-mint border-[#090D12] shadow-[0_0_10px_#10B981]' : 'bg-[#090D12] border-[#334155]'"
            aria-hidden="true"
          />
          <span class="w-8 h-8 rounded-lg bg-[#0E1C1A] border border-mint/45 flex items-center justify-center text-mint shrink-0">
            <component :is="routeIconMap[station.id]" class="w-4 h-4" />
          </span>
          <div class="min-w-0">
            <p class="font-mono text-[10.5px] font-bold tracking-[0.12em] text-ink-primary uppercase">
              {{ station.label }}
            </p>
            <p class="font-sans text-[11.5px] text-ink-secondary leading-snug">
              {{ station.hint }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== TRANSITION GATE: FADING END-OF-LINE + SCROLL-DOWN PROMPT BEFORE SIGNBOARD ==================== -->
    <div
      ref="gateWrapRef"
      class="relative z-20 mx-auto w-full max-w-[760px] px-5 min-h-[200px] sm:min-h-[240px] flex flex-col items-center justify-center select-none"
    >
      <div
        class="flex flex-col items-center text-center gap-3.5 will-change-[opacity,transform]"
        :style="{
          opacity: scrollGateOpacity,
          transform: `translate3d(0, ${scrollGateTranslateY.toFixed(1)}px, 0)`,
        }"
      >
        <!-- Soft Dissolving Vertical Tail Fading Out to Terminal Waypoint -->
        <div class="relative flex flex-col items-center" aria-hidden="true">
          <div class="w-[2px] h-14 bg-gradient-to-b from-[#34D399]/75 via-mint/30 to-transparent" />
          <div class="relative -mt-1 flex items-center justify-center">
            <span class="absolute w-7 h-7 rounded-full border border-mint/45 animate-ping" style="animation-duration: 2.6s;" />
            <span class="w-3 h-3 rounded-full bg-[#00E5A8] border-2 border-[#090D12] shadow-[0_0_18px_rgba(0,229,168,0.95)]" />
          </div>
        </div>

        <!-- Scroll-Down Prompt Pill Telling User to Keep Scrolling to Reveal Signboard -->
        <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0E1621]/95 border border-mint/35 shadow-[0_0_32px_rgba(16,185,129,0.2)]">
          <ChevronsDown class="w-3.5 h-3.5 text-mint summit-scroll-bounce" :stroke-width="2.2" />
          <span class="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-primary">
            SCROLL DOWN TO REVEAL
          </span>
          <ChevronsDown class="w-3.5 h-3.5 text-mint summit-scroll-bounce" :stroke-width="2.2" />
        </div>

        <p class="font-sans text-[12px] text-ink-muted">
          Keep scrolling to unlock the Ascend summit & map entry
        </p>
      </div>
    </div>

    <!-- ==================== ACT 2: THE REVEAL (SIGNBOARD CTA -> VOLUMETRIC BEACON -> AURORA BANDUNG SUMMIT & INTERACTIVE PAVILIONS) ==================== -->
    <div
      ref="revealWrapRef"
      class="relative w-full overflow-hidden pt-4 pb-6"
    >
      <!-- Autonomous Soft Night-Sky Aurora Ambient Wash (Never follows cursor!) -->
      <div
        class="pointer-events-none absolute inset-0 transition-opacity duration-700"
        :style="{
          opacity: (0.35 + beaconReveal * 0.65) * auroraIntensity,
          background: 'radial-gradient(ellipse 68% 42% at 50% 42%, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.08) 48%, transparent 78%)',
        }"
        aria-hidden="true"
      />

      <!-- Brief Luminous Arrival Spark Above Signboard Once User Crosses Scroll Gate -->
      <div
        class="relative z-20 flex flex-col items-center mb-2 transition-all duration-500"
        :style="{
          opacity: signboardReveal,
          transform: `translate3d(0, ${(1 - signboardReveal) * 16}px, 0)`,
        }"
        aria-hidden="true"
      >
        <div class="w-[2px] h-12 sm:h-16 bg-gradient-to-b from-transparent via-mint/70 to-[#00E5A8] shadow-[0_0_16px_#10B981]" />
        <span
          class="w-2.5 h-2.5 -mt-1 rounded-full bg-[#00E5A8] shadow-[0_0_20px_rgba(0,229,168,0.95)]"
          :style="{ transform: `scale(${0.45 + signboardReveal * 0.55})` }"
        />
      </div>

      <!-- FLOATING SIGNBOARD (CTA BOX) - REVEALS SMOOTHLY AFTER SCROLL-DOWN GATE -->
      <div
        class="relative z-20 mx-auto w-full max-w-[760px] px-5 sm:px-8 will-change-[opacity,transform]"
        :style="{
          opacity: signboardReveal,
          transform: `translate3d(0, ${((1 - signboardReveal) * 42).toFixed(1)}px, 0) scale(${(0.93 + signboardReveal * 0.07).toFixed(4)})`,
          filter: signboardReveal < 0.85 ? `blur(${((1 - signboardReveal) * 3.5).toFixed(2)}px)` : 'none',
        }"
      >
        <div
          class="relative rounded-2xl bg-[#101620]/95 backdrop-blur-xl border border-mint/35 px-6 sm:px-10 py-10 sm:py-12 text-center shadow-[0_0_80px_rgba(16,185,129,0.18),0_28px_80px_rgba(0,0,0,0.84)] overflow-hidden"
        >
          <!-- Subtle sweeping emerald shimmer line along top rim -->
          <span
            class="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-mint/90 to-transparent"
            aria-hidden="true"
          />
          <span
            class="pointer-events-none absolute inset-x-14 bottom-0 h-px bg-gradient-to-r from-transparent via-mint/75 to-transparent"
            aria-hidden="true"
          />

          <!-- Four Crisp Emerald Corner Screws -->
          <span class="pointer-events-none absolute top-3.5 left-3.5 w-1.5 h-1.5 bg-mint/85 shadow-[0_0_8px_#10B981]" aria-hidden="true" />
          <span class="pointer-events-none absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-mint/85 shadow-[0_0_8px_#10B981]" aria-hidden="true" />
          <span class="pointer-events-none absolute bottom-3.5 left-3.5 w-1.5 h-1.5 bg-mint/85 shadow-[0_0_8px_#10B981]" aria-hidden="true" />
          <span class="pointer-events-none absolute bottom-3.5 right-3.5 w-1.5 h-1.5 bg-mint/85 shadow-[0_0_8px_#10B981]" aria-hidden="true" />

          <!-- Eyebrow -->
          <p class="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mint">
            {{ HOME_COPY.cta.eyebrow }}
          </p>

          <!-- Balanced 2-Line Headline -->
          <h2 class="mt-3.5 font-display font-extrabold text-ink-primary text-[38px] leading-[1.14] tracking-[-0.025em]">
            <span class="whitespace-nowrap">Ready to find room for</span>
            <br class="block">
            <span> your </span>
            <span class="editorial-mint whitespace-nowrap text-[1.06em]">
              {{ HOME_COPY.cta.headlineAccent }}
            </span>
          </h2>

          <!-- Buttons Row -->
          <div class="mt-7 flex flex-wrap items-center justify-center gap-6">
            <NuxtLink
              to="/map"
              class="btn-mint h-12 px-7 text-[15px] group shadow-[0_0_30px_rgba(16,185,129,0.48)]"
              @mouseenter="ctaHovered = true"
              @mouseleave="ctaHovered = false"
            >
              <span>{{ HOME_COPY.cta.primaryBtn }}</span>
              <ArrowRight
                class="w-4 h-4 transition-transform duration-fast ease-signal group-hover:translate-x-1"
                :stroke-width="2.3"
              />
            </NuxtLink>

            <a
              href="#cara-kerja"
              class="font-sans text-[14px] font-medium text-ink-secondary hover:text-ink-primary underline decoration-[#475569] hover:decoration-mint underline-offset-4 transition-colors duration-fast px-1 py-1.5"
            >
              {{ HOME_COPY.cta.secondaryBtn }}
            </a>
          </div>

          <!-- Footnote -->
          <p class="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            {{ HOME_COPY.cta.footnote }}
          </p>
        </div>
      </div>

      <!-- INTERACTIVE AURORA BANDUNG SUMMIT + SYMMETRIC NUSANTARA PAVILIONS -->
      <div
        class="relative z-10 w-full -mt-4 sm:-mt-8 transition-opacity duration-500"
        :style="{ opacity: Math.max(0.18, summitRise) }"
      >
        <!-- SILKY 60FPS GPU-COMPOSITED AURORA BOREALIS CURTAINS (SEAMLESS TOP FADE, ZERO HARD CUTOFF!) -->
        <div
          class="pointer-events-none absolute inset-x-0 -top-36 h-[78%] transition-opacity duration-700 ease-out"
          :style="{
            opacity: auroraIntensity,
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 26%, black 52%, black 86%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 26%, black 52%, black 86%, transparent 100%)',
          }"
          aria-hidden="true"
        >
          <div
            class="absolute top-16 -left-[8%] w-[64%] h-[250px] rounded-full blur-[76px] summit-gpu-aurora-a"
            style="background: linear-gradient(110deg, rgba(20, 184, 166, 0.05) 0%, rgba(16, 185, 129, 0.44) 38%, rgba(0, 229, 168, 0.56) 66%, rgba(20, 184, 166, 0.14) 100%);"
          />
          <div
            class="absolute top-20 -right-[6%] w-[62%] h-[235px] rounded-full blur-[80px] summit-gpu-aurora-b"
            style="background: linear-gradient(250deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.36) 35%, rgba(20, 184, 166, 0.44) 64%, rgba(245, 158, 11, 0.24) 100%);"
          />
          <div
            class="absolute top-28 left-1/2 -translate-x-1/2 w-[56%] h-[210px] rounded-full blur-[72px] summit-gpu-aurora-c"
            style="background: radial-gradient(ellipse at center, rgba(0, 229, 168, 0.44), rgba(16, 185, 129, 0.18) 54%, transparent 78%);"
          />
        </div>

        <svg
          viewBox="0 0 1440 600"
          preserveAspectRatio="xMidYMid slice"
          class="relative z-10 w-full h-[610px] block select-none"
          fill="none"
          role="img"
          aria-label="Interactive mountain aurora and Ascend stepped summit diorama"
        >
          <defs>
            <!-- Painterly Multi-Stop Mountain Depth Gradients (Far Mist -> Faceted Back -> Rolling Mid -> Valley) -->
            <linearGradient id="mtn-far-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#193440" stop-opacity="0.72" />
              <stop offset="55%" stop-color="#0F1F2B" stop-opacity="0.88" />
              <stop offset="100%" stop-color="#0A121C" stop-opacity="1" />
            </linearGradient>

            <linearGradient id="mtn-back-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#152736" />
              <stop offset="48%" stop-color="#0E1825" />
              <stop offset="100%" stop-color="#0A101A" />
            </linearGradient>

            <linearGradient id="mtn-lit-facet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#22525E" stop-opacity="0.58" />
              <stop offset="52%" stop-color="#163644" stop-opacity="0.28" />
              <stop offset="100%" stop-color="#0E1825" stop-opacity="0" />
            </linearGradient>

            <linearGradient id="mtn-mid-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#152333" />
              <stop offset="45%" stop-color="#101A28" />
              <stop offset="100%" stop-color="#0B111B" />
            </linearGradient>

            <linearGradient id="mtn-mist-veil" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#14B8A6" stop-opacity="0" />
              <stop offset="48%" stop-color="#14B8A6" stop-opacity="0.16" />
              <stop offset="100%" stop-color="#0C141F" stop-opacity="0" />
            </linearGradient>

            <!-- Smooth Seamless Valley Ground Gradient -->
            <linearGradient id="summit-valley-floor" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#132030" />
              <stop offset="32%" stop-color="#0E1623" />
              <stop offset="72%" stop-color="#0A1018" />
              <stop offset="100%" stop-color="#090D12" />
            </linearGradient>

            <!-- Subtle Isometric Valley Lattice Pattern Fading Into Distance -->
            <pattern id="summit-valley-hex" width="52" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M 26 0 L 52 15 L 26 30 L 0 15 Z"
                fill="none"
                stroke="#1F3044"
                stroke-width="0.7"
                stroke-opacity="0.56"
              />
            </pattern>

            <linearGradient id="summit-hex-mask-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="white" stop-opacity="0" />
              <stop offset="34%" stop-color="white" stop-opacity="0.58" />
              <stop offset="78%" stop-color="white" stop-opacity="0.32" />
              <stop offset="100%" stop-color="white" stop-opacity="0" />
            </linearGradient>

            <mask id="summit-valley-hex-mask">
              <rect x="0" y="310" width="1440" height="290" fill="url(#summit-hex-mask-grad)" />
            </mask>

            <!-- Volumetric upward emerald light beam from Summit Beacon into Signboard -->
            <linearGradient id="summit-beam-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#00E5A8" stop-opacity="0.46" />
              <stop offset="48%" stop-color="#10B981" stop-opacity="0.18" />
              <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
            </linearGradient>

            <radialGradient id="summit-beacon-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#00E5A8" stop-opacity="0.58" />
              <stop offset="42%" stop-color="#10B981" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
            </radialGradient>

            <radialGradient id="summit-valley-mist" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#14B8A6" stop-opacity="0.22" />
              <stop offset="55%" stop-color="#10B981" stop-opacity="0.07" />
              <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
            </radialGradient>

            <radialGradient id="summit-amber-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.34" />
              <stop offset="55%" stop-color="#F59E0B" stop-opacity="0.08" />
              <stop offset="100%" stop-color="#F59E0B" stop-opacity="0" />
            </radialGradient>

            <linearGradient id="summit-climb-grad" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stop-color="#14B8A6" stop-opacity="0.28" />
              <stop offset="35%" stop-color="#10B981" stop-opacity="0.92" />
              <stop offset="82%" stop-color="#00E5A8" stop-opacity="1" />
              <stop offset="100%" stop-color="#FBBF24" stop-opacity="1" />
            </linearGradient>

            <linearGradient id="summit-ridge-aurora" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#14B8A6" stop-opacity="0.16" />
              <stop offset="35%" stop-color="#00E5A8" stop-opacity="0.9" />
              <stop offset="65%" stop-color="#34D399" stop-opacity="0.76" />
              <stop offset="100%" stop-color="#FBBF24" stop-opacity="0.4" />
            </linearGradient>

            <linearGradient id="summit-shooting-star" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0" />
              <stop offset="65%" stop-color="#6EE7B7" stop-opacity="0.65" />
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="1" />
            </linearGradient>

            <filter id="summit-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="summit-star-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- 1. REFRESHING STARRY NIGHT SKY (Twinkling Stars + 4-Point Cross Flares + Shooting Comets) -->
          <g class="pointer-events-none">
            <circle
              v-for="(star, si) in skyStars"
              :key="`s-${si}`"
              :cx="star.x"
              :cy="star.y"
              :r="star.r"
              :fill="star.fill"
              class="summit-star-twinkle"
              :style="{
                '--star-dur': `${star.dur}s`,
                '--star-delay': `${star.delay}s`,
              }"
            />

            <g
              v-for="(fl, fi) in starFlares"
              :key="`fl-${fi}`"
              :transform="`translate(${fl.x}, ${fl.y}) scale(${fl.scale})`"
              filter="url(#summit-star-glow)"
            >
              <path
                d="M 0 -9 Q 0 0 9 0 Q 0 0 0 9 Q 0 0 -9 0 Q 0 0 0 -9 Z"
                :fill="fl.fill"
                class="summit-flare-pulse"
                :style="{
                  '--star-dur': `${fl.dur}s`,
                  '--star-delay': `${fl.delay}s`,
                }"
              />
            </g>

            <line
              x1="140"
              y1="26"
              x2="236"
              y2="78"
              stroke="url(#summit-shooting-star)"
              stroke-width="1.6"
              stroke-linecap="round"
              class="summit-shooting-a"
            />
            <line
              x1="1080"
              y1="22"
              x2="1182"
              y2="76"
              stroke="url(#summit-shooting-star)"
              stroke-width="1.5"
              stroke-linecap="round"
              class="summit-shooting-b"
            />
          </g>

          <!-- Subtle Concentric Sky Radar Circles Centered on Summit Beacon -->
          <g stroke="#243041" stroke-width="1" stroke-dasharray="3 9" :opacity="summitHovered || beaconHovered ? 0.65 : 0.42" class="pointer-events-none transition-opacity duration-500">
            <circle cx="720" cy="126" r="196" class="summit-radar-spin-cw" />
            <circle cx="720" cy="126" r="326" class="summit-radar-spin-ccw" />
            <circle cx="720" cy="126" r="472" />
          </g>

          <!-- Volumetric Projector Light Beam Rising From Beacon to Signboard (Intensifies When Hovering Summit or CTA!) -->
          <g class="summit-beam-breathe pointer-events-none transition-opacity duration-500" :opacity="ctaHovered || summitHovered || beaconHovered || pulseActive ? 1 : 0.72">
            <polygon
              :points="summitHovered || beaconHovered || pulseActive ? '684,122 756,122 978,0 462,0' : '688,122 752,122 936,0 504,0'"
              fill="url(#summit-beam-grad)"
            />
            <line x1="704" y1="122" x2="558" y2="0" stroke="#00E5A8" :stroke-opacity="summitHovered || beaconHovered ? 0.44 : 0.24" stroke-width="1" />
            <line x1="736" y1="122" x2="882" y2="0" stroke="#00E5A8" :stroke-opacity="summitHovered || beaconHovered ? 0.44 : 0.24" stroke-width="1" />
          </g>

          <!-- 3. PAINTERLY 4-LAYER ALPINE-VOLCANIC MOUNTAIN PANORAMA (ZERO CURSOR SWAY + SCULPTED FACETS + ATMOSPHERIC MIST!) -->
          <!-- Layer 0 (Distant Misty Twilight Alpine Peaks Melting Into Aurora Sky) -->
          <g class="pointer-events-none">
            <path
              :d="`${farAlpineRangeD} L 1440 360 L 0 360 Z`"
              fill="url(#mtn-far-grad)"
              stroke="#2C5E6B"
              stroke-opacity="0.45"
              stroke-width="1"
            />
            <!-- Soft Hazy Mist Cushion Floating Behind Back Peaks -->
            <rect x="0" y="168" width="1440" height="82" fill="url(#mtn-mist-veil)" class="summit-mist-drift-a" />
          </g>

          <!-- Layer 1 (Sculpted Faceted Back Volcanic Ridge + Illuminated Left Slopes + Traveling Aurora Crest + Peak Beacons) -->
          <g :transform="backRidgeTransform" class="pointer-events-none">
            <path
              :d="`${backRidgeCrestD} L 1440 380 L 0 380 Z`"
              fill="url(#mtn-back-grad)"
              stroke="#2B465E"
              stroke-width="1.2"
            />
            <!-- Sculpted Moonlit Aurora Slopes Giving Authentic 3D Volcanic Mountain Relief -->
            <path
              v-for="(facet, fi) in backMountainLitFacets"
              :key="`bf-${fi}`"
              :d="facet"
              fill="url(#mtn-lit-facet)"
            />
            <!-- Delicate Illuminated Ridge Spine Creases -->
            <path
              v-for="(spine, si) in backMountainSpines"
              :key="`bs-${si}`"
              :d="spine"
              stroke="#34D399"
              stroke-opacity="0.22"
              stroke-width="0.95"
              stroke-linecap="round"
            />
            <!-- Flowing Aurora Rim Light Sweeping Across Volcanic Ridge -->
            <path
              :d="backRidgeCrestD"
              stroke="url(#summit-ridge-aurora)"
              :stroke-width="summitHovered || pulseActive ? 2.4 : 1.75"
              stroke-dasharray="260 1320"
              stroke-linecap="round"
              class="summit-ridge-sweep-a summit-stroke-smooth"
            />
            <g v-for="(pk, pi) in ridgePeakBeacons" :key="`pk-${pi}`">
              <circle
                :cx="pk.x"
                :cy="pk.y"
                :r="pk.r * 2.9"
                fill="#10B981"
                fill-opacity="0.24"
                class="summit-peak-pulse"
                :style="{ animationDelay: `${pk.delay}s` }"
              />
              <circle :cx="pk.x" :cy="pk.y" :r="pk.r" fill="#A7F3D0" />
            </g>
          </g>

          <!-- Atmospheric Valley Mist Veils Drifting Softly Between Mountain Ridges -->
          <g class="pointer-events-none">
            <ellipse cx="380" cy="244" rx="380" ry="52" fill="url(#summit-valley-mist)" class="summit-mist-drift-a" />
            <ellipse cx="1060" cy="250" rx="400" ry="54" fill="url(#summit-valley-mist)" class="summit-mist-drift-b" />
            <ellipse cx="720" cy="236" rx="280" ry="40" fill="url(#summit-amber-halo)" opacity="0.28" class="summit-mist-drift-a" />
          </g>

          <!-- Layer 2 (Rolling Organic Mid-Ridge + Topographic Contour Lines + Counter-Sweeping Emerald Light) -->
          <g :transform="midRidgeTransform" class="pointer-events-none">
            <path
              :d="`${midRidgeCrestD} L 1440 408 L 0 408 Z`"
              fill="url(#mtn-mid-grad)"
              stroke="#2D465E"
              stroke-width="1.2"
            />
            <!-- Delicate Organic Topographic Elevation Contours Across Mid Slopes -->
            <path
              d="M 0 318 Q 160 264, 340 286 T 720 270 T 1100 286 T 1440 318"
              stroke="#244456"
              stroke-opacity="0.52"
              stroke-width="0.95"
              stroke-dasharray="5 9"
            />
            <path
              d="M 0 338 Q 220 296, 460 312 T 980 312 T 1440 338"
              stroke="#1E384A"
              stroke-opacity="0.44"
              stroke-width="0.9"
            />
            <path
              :d="midRidgeCrestD"
              stroke="url(#summit-ridge-aurora)"
              :stroke-width="summitHovered || pulseActive ? 2.1 : 1.5"
              stroke-dasharray="200 1440"
              stroke-linecap="round"
              class="summit-ridge-sweep-b summit-stroke-smooth"
              opacity="0.82"
            />
          </g>

          <!-- Layer 3 (Seamless Foreground Foothills Flowing Directly Into Smooth Gradient Valley Floor) -->
          <g :transform="foreRidgeTransform" class="pointer-events-none">
            <path
              :d="`${foreRidgeCrestD} L 1440 600 L 0 600 Z`"
              fill="url(#summit-valley-floor)"
              stroke="#263D54"
              stroke-width="1.15"
            />
            <!-- Soft Translucent Valley Isometric Lattice Blending Mountains Into Valley Floor -->
            <rect
              x="0"
              y="310"
              width="1440"
              height="290"
              fill="url(#summit-valley-hex)"
              mask="url(#summit-valley-hex-mask)"
              :opacity="summitHovered || flankHovered ? 0.96 : 0.64"
              class="transition-opacity duration-500"
            />
            <!-- Subtle Emerald Valley Cushion Glow Beneath Pyramid & Pavilions -->
            <ellipse cx="720" cy="492" rx="460" ry="68" fill="url(#summit-valley-mist)" :opacity="summitHovered || pulseActive ? 1 : 0.58" class="transition-opacity duration-500" />
          </g>

          <!-- Subtle Perspective Horizon Rays Extending Across Smooth Valley Floor -->
          <g stroke="#1E2B3D" stroke-width="1" opacity="0.52" class="pointer-events-none">
            <line x1="720" y1="462" x2="80" y2="600" />
            <line x1="720" y1="462" x2="340" y2="600" />
            <line x1="720" y1="462" x2="560" y2="600" />
            <line x1="720" y1="462" x2="880" y2="600" />
            <line x1="720" y1="462" x2="1100" y2="600" />
            <line x1="720" y1="462" x2="1360" y2="600" />
          </g>

          <!-- 4. INTERACTIVE LEFT NUSANTARA PAVILION: BANDUNG COFFEE CRAFT SANCTUARY (2-TIER ARCHITECTURAL DAIS) -->
          <g
            class="cursor-pointer outline-none"
            tabindex="0"
            role="button"
            aria-label="Nusantara Coffee Craft Sanctuary"
            :opacity="Math.max(0.25, summitRise)"
            @mouseenter="flankHovered = 'left'"
            @mouseleave="flankHovered = null"
            @focus="flankHovered = 'left'"
            @blur="flankHovered = null"
            @click="triggerSummitPulse"
          >
            <!-- Invisible Generous Hover Hit Target -->
            <rect x="120" y="346" width="194" height="196" fill="transparent" />

            <!-- Graceful Luminous Telemetry Conduit Feeding Left Pavilion -> Main Pyramid -->
            <path
              :d="leftFlankLinkD"
              :stroke="flankHovered === 'left' || pulseActive ? '#00E5A8' : '#10B981'"
              :stroke-opacity="flankHovered === 'left' || pulseActive ? 0.85 : 0.36"
              :stroke-width="flankHovered === 'left' || pulseActive ? 2.1 : 1.35"
              stroke-dasharray="4 6"
              stroke-linecap="round"
              :filter="flankHovered === 'left' ? 'url(#summit-soft-glow)' : undefined"
            />
            <circle :r="flankHovered === 'left' ? 3.6 : 2.6" fill="#00E5A8" filter="url(#summit-soft-glow)">
              <animateMotion :dur="flankHovered === 'left' ? '1.6s' : '4.0s'" repeatCount="indefinite" :path="leftFlankLinkD" />
            </circle>

            <!-- Soft Ground Shadow & Emerald Base Aura -->
            <ellipse
              cx="215"
              cy="486"
              rx="82"
              ry="20"
              fill="#00E5A8"
              :fill-opacity="flankHovered === 'left' || pulseActive ? 0.22 : 0.08"
              class="transition-all duration-300"
            />

            <!-- 2-Tier Sculpted Isometric Stepped Sanctuary Pedestal (Silky Smooth Hover Lift!) -->
            <g class="summit-flank-hover-wrap" :class="{ 'is-hovered': flankHovered === 'left' }">
              <g class="summit-flank-float-a">
              <!-- Tier 1 (Lower Broad Isometric Dais) -->
              <polygon :points="isoPedestalSideLeft(215, 452, 72, 26, 18)" fill="#111825" stroke="#243246" stroke-width="1" />
              <polygon :points="isoPedestalSideFront(215, 452, 72, 26, 18)" fill="#162030" stroke="#293A52" stroke-width="1" />
              <polygon :points="isoPedestalSideRight(215, 452, 72, 26, 18)" fill="#0D141F" stroke="#202D40" stroke-width="1" />
              <polygon
                :points="isoHexPoints(215, 452, 72, 26)"
                fill="#172232"
                :stroke="flankHovered === 'left' || pulseActive ? '#34D399' : '#2D3E56'"
                :stroke-width="flankHovered === 'left' ? 1.5 : 1.05"
              />

              <!-- Tier 2 (Upper Illuminated Emerald Sanctuary Plinth) -->
              <polygon :points="isoPedestalSideLeft(215, 428, 48, 18, 16)" fill="#0F1C23" stroke="#1E3A3A" stroke-width="1" />
              <polygon :points="isoPedestalSideFront(215, 428, 48, 18, 16)" fill="#13242C" stroke="#244745" stroke-width="1" />
              <polygon :points="isoPedestalSideRight(215, 428, 48, 18, 16)" fill="#0B161C" stroke="#193132" stroke-width="1" />
              <polygon
                :points="isoHexPoints(215, 428, 48, 18)"
                fill="#0E2221"
                :stroke="flankHovered === 'left' || pulseActive ? '#00E5A8' : '#10B981'"
                :stroke-width="flankHovered === 'left' ? 1.8 : 1.3"
                :filter="flankHovered === 'left' || pulseActive ? 'url(#summit-soft-glow)' : undefined"
              />

              <!-- Subtle Floating Kawung Aura Ring Behind Specialty Coffee Craft Icon -->
              <circle
                cx="215"
                cy="394"
                r="29"
                fill="url(#summit-beacon-halo)"
                :opacity="flankHovered === 'left' ? 0.92 : 0.45"
                class="transition-opacity duration-300"
              />
              <circle
                cx="215"
                cy="394"
                r="24"
                stroke="#10B981"
                :stroke-opacity="flankHovered === 'left' ? 0.55 : 0.25"
                stroke-width="1"
                stroke-dasharray="3 5"
                class="summit-compass-cw"
              />

              <!-- Fine-Line Specialty Pour-Over Coffee Cup & Golden Saucer -->
              <g filter="url(#summit-soft-glow)">
                <path
                  d="M 199 390 L 227 390 L 224.5 408 C 223.8 412.5 220 415 213 415 C 206 415 202.2 412.5 201.5 408 Z"
                  fill="#0B231E"
                  stroke="#00E5A8"
                  stroke-width="1.75"
                  stroke-linejoin="round"
                />
                <!-- Subtle Liquid Mint Highlight Rim -->
                <line x1="203" y1="395" x2="223" y2="395" stroke="#6EE7B7" stroke-opacity="0.65" stroke-width="1.2" stroke-linecap="round" />
                <path
                  d="M 227 393.5 C 234.5 393.5 234.5 404.5 225.5 405.5"
                  stroke="#00E5A8"
                  stroke-width="1.75"
                  stroke-linecap="round"
                />
                <path
                  d="M 194 418.5 Q 213 422 232 418.5"
                  stroke="#FBBF24"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </g>

              <!-- 3 Silky Animated Rising Coffee Aroma Steam Ribbons -->
              <path d="M 206 385 C 203.5 376, 210.5 370, 207 361" stroke="#6EE7B7" stroke-width="1.5" stroke-linecap="round" class="summit-steam-a" />
              <path d="M 213 383 C 216.5 374, 210 366, 214.5 356" stroke="#FDE68A" stroke-width="1.5" stroke-linecap="round" class="summit-steam-b" />
              <path d="M 220 385 C 218.5 377, 224.5 371, 221 362" stroke="#34D399" stroke-width="1.4" stroke-linecap="round" class="summit-steam-c" />
              </g>
            </g>

            <!-- Crisp, Clean Typography Well Below Pedestal Base (Zero Overlap!) -->
            <text
              x="215"
              y="518"
              text-anchor="middle"
              :fill="flankHovered === 'left' ? '#00E5A8' : '#94A3B8'"
              font-family="JetBrains Mono, monospace"
              font-size="9.5"
              font-weight="700"
              letter-spacing="1.8"
            >
              KEDAI KOPI · NUSANTARA
            </text>
            <path
              d="M 146 534 L 166 526 L 186 534 L 206 526 L 226 534 L 246 526 L 266 534 L 284 526"
              stroke="#10B981"
              :stroke-opacity="flankHovered === 'left' ? 0.65 : 0.25"
              stroke-width="1"
            />
          </g>

          <!-- 5. INTERACTIVE RIGHT NUSANTARA PAVILION: 7-HEX (~500 M) SPATIAL ASTROLABE (2-TIER ARCHITECTURAL DAIS) -->
          <g
            class="cursor-pointer outline-none"
            tabindex="0"
            role="button"
            aria-label="500m Spatial Counting Ring Astrolabe"
            :opacity="Math.max(0.25, summitRise)"
            @mouseenter="flankHovered = 'right'"
            @mouseleave="flankHovered = null"
            @focus="flankHovered = 'right'"
            @blur="flankHovered = null"
            @click="triggerSummitPulse"
          >
            <!-- Invisible Generous Hover Hit Target -->
            <rect x="1126" y="346" width="194" height="196" fill="transparent" />

            <!-- Graceful Luminous Telemetry Conduit Feeding Right Pavilion -> Main Pyramid -->
            <path
              :d="rightFlankLinkD"
              :stroke="flankHovered === 'right' || pulseActive ? '#FBBF24' : '#10B981'"
              :stroke-opacity="flankHovered === 'right' || pulseActive ? 0.85 : 0.36"
              :stroke-width="flankHovered === 'right' || pulseActive ? 2.1 : 1.35"
              stroke-dasharray="4 6"
              stroke-linecap="round"
              :filter="flankHovered === 'right' ? 'url(#summit-soft-glow)' : undefined"
            />
            <circle :r="flankHovered === 'right' ? 3.6 : 2.6" fill="#FBBF24" filter="url(#summit-soft-glow)">
              <animateMotion :dur="flankHovered === 'right' ? '1.6s' : '4.4s'" begin="0.8s" repeatCount="indefinite" :path="rightFlankLinkD" />
            </circle>

            <!-- Soft Ground Shadow & Emerald-Gold Base Aura -->
            <ellipse
              cx="1225"
              cy="486"
              rx="82"
              ry="20"
              :fill="flankHovered === 'right' ? '#F59E0B' : '#00E5A8'"
              :fill-opacity="flankHovered === 'right' || pulseActive ? 0.22 : 0.08"
              class="transition-all duration-300"
            />

            <!-- 2-Tier Sculpted Isometric Stepped Sanctuary Pedestal (Silky Smooth Hover Lift!) -->
            <g class="summit-flank-hover-wrap" :class="{ 'is-hovered': flankHovered === 'right' }">
              <g class="summit-flank-float-b">
              <!-- Tier 1 (Lower Broad Isometric Dais) -->
              <polygon :points="isoPedestalSideLeft(1225, 452, 72, 26, 18)" fill="#111825" stroke="#243246" stroke-width="1" />
              <polygon :points="isoPedestalSideFront(1225, 452, 72, 26, 18)" fill="#162030" stroke="#293A52" stroke-width="1" />
              <polygon :points="isoPedestalSideRight(1225, 452, 72, 26, 18)" fill="#0D141F" stroke="#202D40" stroke-width="1" />
              <polygon
                :points="isoHexPoints(1225, 452, 72, 26)"
                fill="#172232"
                :stroke="flankHovered === 'right' || pulseActive ? '#FBBF24' : '#2D3E56'"
                :stroke-width="flankHovered === 'right' ? 1.5 : 1.05"
              />

              <!-- Tier 2 (Upper Illuminated Plinth) -->
              <polygon :points="isoPedestalSideLeft(1225, 428, 48, 18, 16)" fill="#0F1C23" stroke="#1E3A3A" stroke-width="1" />
              <polygon :points="isoPedestalSideFront(1225, 428, 48, 18, 16)" fill="#13242C" stroke="#244745" stroke-width="1" />
              <polygon :points="isoPedestalSideRight(1225, 428, 48, 18, 16)" fill="#0B161C" stroke="#193132" stroke-width="1" />
              <polygon
                :points="isoHexPoints(1225, 428, 48, 18)"
                fill="#0E2221"
                :stroke="flankHovered === 'right' || pulseActive ? '#FBBF24' : '#10B981'"
                :stroke-width="flankHovered === 'right' ? 1.8 : 1.3"
                :filter="flankHovered === 'right' || pulseActive ? 'url(#summit-soft-glow)' : undefined"
              />

              <!-- Precision 7-Hex (~500 m) Luminous Nusantara Spatial Astrolabe Hovering Cleanly Above Plinth -->
              <g transform="translate(1225, 392)">
                <circle r="34" fill="url(#summit-beacon-halo)" :opacity="flankHovered === 'right' ? 0.95 : 0.48" class="transition-opacity duration-300" />
                <circle r="31" stroke="#10B981" :stroke-opacity="flankHovered === 'right' ? 0.65 : 0.3" stroke-width="1" stroke-dasharray="4 6" class="summit-compass-cw" />
                <circle r="25" stroke="#F59E0B" :stroke-opacity="flankHovered === 'right' ? 0.65 : 0.28" stroke-width="1" stroke-dasharray="2 6" class="summit-compass-ccw" />

                <!-- 6 Surrounding Neighbor Hexagons (~500 m Ring) -->
                <polygon
                  v-for="(ah, ahi) in rightAstrolabeHexes"
                  :key="`ah-${ahi}`"
                  :points="miniHexPts(ah.cx, ah.cy, 7.2)"
                  :fill="ah.fill"
                  :fill-opacity="flankHovered === 'right' || pulseActive ? 0.72 : 0.34"
                  :stroke="ah.stroke"
                  :stroke-width="flankHovered === 'right' ? 1.25 : 0.9"
                />
                <!-- Central Active Area Hexagon -->
                <polygon
                  :points="miniHexPts(0, 0, 8)"
                  fill="#0B1E1B"
                  stroke="#FFFFFF"
                  stroke-width="1.6"
                  filter="url(#summit-soft-glow)"
                />
                <circle r="2.2" fill="#00E5A8" />
              </g>
              </g>
            </g>

            <!-- Crisp, Clean Typography Well Below Pedestal Base (Zero Overlap!) -->
            <text
              x="1225"
              y="518"
              text-anchor="middle"
              :fill="flankHovered === 'right' ? '#FBBF24' : '#94A3B8'"
              font-family="JetBrains Mono, monospace"
              font-size="9.5"
              font-weight="700"
              letter-spacing="1.6"
            >
              AREA + 6 NEIGHBORS
            </text>
            <path
              d="M 1156 534 L 1176 526 L 1196 534 L 1216 526 L 1236 534 L 1256 526 L 1276 534 L 1294 526"
              stroke="#F59E0B"
              :stroke-opacity="flankHovered === 'right' ? 0.65 : 0.25"
              stroke-width="1"
            />
          </g>

          <!-- 6. CLICKABLE & HOVERABLE LIVING SUMMIT BEACON (RADIAL SHOCKWAVE BURST ON CLICK!) -->
          <g
            class="cursor-pointer outline-none"
            tabindex="0"
            role="button"
            aria-label="Ascend Summit Beacon. Click to pulse the aurora."
            :opacity="0.35 + beaconReveal * 0.65"
            @mouseenter="beaconHovered = true"
            @mouseleave="beaconHovered = false"
            @focus="beaconHovered = true"
            @blur="beaconHovered = false"
            @click="triggerSummitPulse"
            @keydown.enter.prevent="triggerSummitPulse"
            @keydown.space.prevent="triggerSummitPulse"
          >
            <!-- Clickable Shockwave Ripple Burst -->
            <g v-if="pulseBurstKey > 0" :key="`burst-${pulseBurstKey}`" class="pointer-events-none">
              <circle cx="720" cy="126" r="42" stroke="#00E5A8" stroke-width="2.4" class="summit-click-burst-a" />
              <circle cx="720" cy="126" r="42" stroke="#FBBF24" stroke-width="1.6" class="summit-click-burst-b" />
            </g>

            <circle
              cx="720"
              cy="126"
              :r="beaconHovered || summitHovered || pulseActive ? 116 : 98"
              fill="url(#summit-beacon-halo)"
              class="summit-beacon-breathe transition-all duration-300"
            />
            <circle cx="720" cy="126" r="46" stroke="#00E5A8" stroke-width="1.3" class="summit-beacon-sonar" />
            <circle
              cx="720"
              cy="126"
              r="70"
              stroke="#10B981"
              :stroke-opacity="beaconHovered || summitHovered ? 0.58 : 0.32"
              stroke-width="1.15"
              stroke-dasharray="6 9"
              class="summit-orbit-cw"
            />
            <circle
              cx="720"
              cy="126"
              r="50"
              :stroke="beaconHovered || pulseActive ? '#FBBF24' : '#34D399'"
              :stroke-opacity="beaconHovered || summitHovered ? 0.72 : 0.46"
              stroke-width="1.3"
              stroke-dasharray="3 6"
              class="summit-orbit-ccw"
            />
            <circle cx="720" cy="126" r="33" fill="#0A1718" :stroke="beaconHovered || pulseActive ? '#00E5A8' : '#10B981'" stroke-opacity="0.85" stroke-width="1.6" />
            <polygon
              points="720,104 739,115 739,137 720,148 701,137 701,115"
              :fill="beaconHovered || pulseActive ? '#122D28' : '#0E1D1B'"
              :stroke="beaconHovered || pulseActive ? '#FDE68A' : '#00E5A8'"
              stroke-width="2.2"
              filter="url(#summit-soft-glow)"
              class="summit-stroke-smooth"
            />
            <circle cx="720" cy="126" r="3.4" fill="#FFFFFF" />
            <circle cx="720" cy="114" r="1.9" fill="#00E5A8" />
            <circle cx="730" cy="120" r="1.9" fill="#10B981" />
            <circle cx="730" cy="132" r="1.9" fill="#10B981" />
            <circle cx="720" cy="138" r="1.9" fill="#00E5A8" />
            <circle cx="710" cy="132" r="1.9" fill="#10B981" />
            <circle cx="710" cy="120" r="1.9" fill="#10B981" />
          </g>

          <!-- 7. INTERACTIVE 7-TIER SCULPTED ISOMETRIC STEPPED NUSANTARA PYRAMID (SILKY SMOOTH HOVER LIFT & BLOOM!) -->
          <g
            class="cursor-pointer summit-pyramid-wrap"
            :class="{ 'is-hovered': summitHovered || pulseActive }"
            @mouseenter="summitHovered = true"
            @mouseleave="summitHovered = false"
            @click="triggerSummitPulse"
          >
            <g
              v-for="t in summitTiers"
              :key="t.tier"
              :transform="tierRiseTransform(t.tier)"
              :opacity="tierOpacity(t.tier)"
            >
              <polygon :points="tierLeftPoints(t)" fill="#131A26" :stroke="summitHovered || pulseActive ? '#2C4959' : '#243043'" stroke-width="1" class="summit-stroke-smooth" />
              <polygon :points="tierFrontPoints(t)" fill="#17202E" :stroke="summitHovered || pulseActive ? '#315263' : '#263347'" stroke-width="1" class="summit-stroke-smooth" />
              <polygon :points="tierRightPoints(t)" fill="#101621" :stroke="summitHovered || pulseActive ? '#263F4D' : '#222E40'" stroke-width="1" class="summit-stroke-smooth" />
              <polygon :points="tierTopPoints(t)" :fill="summitHovered || pulseActive ? '#1C2E3F' : '#1C2535'" :stroke="summitHovered || pulseActive ? '#10B981' : '#2E3D54'" stroke-width="1" class="summit-stroke-smooth" />
              <!-- Illuminated Terrace Edge Rim: Smooth Opacity & Color Transition (Zero Heavy Filter Swapping!) -->
              <polygon
                :points="tierTopPoints(t)"
                fill="none"
                :stroke="pulseActive ? '#FBBF24' : '#00E5A8'"
                :stroke-width="summitHovered || pulseActive ? 2.1 : 1.35"
                :class="summitHovered || pulseActive ? 'opacity-90' : 'summit-tier-wave'"
                class="summit-stroke-smooth"
                :style="{ animationDelay: `${t.tier * 0.34}s` }"
              />
            </g>
            <!-- Apex Crystal Pedestal Leading to Summit Beacon -->
            <g :transform="tierRiseTransform(6)" :opacity="tierOpacity(6)">
              <polygon
                points="688,210 720,190 752,210 720,226"
                :fill="summitHovered || beaconHovered || pulseActive ? '#1A3A3A' : '#1F2D3D'"
                :stroke="pulseActive ? '#FBBF24' : '#00E5A8'"
                :stroke-opacity="summitHovered || beaconHovered || pulseActive ? 1 : 0.72"
                :stroke-width="summitHovered || beaconHovered ? 2 : 1.4"
                filter="url(#summit-soft-glow)"
                class="summit-stroke-smooth"
              />
            </g>
          </g>

          <!-- 8. INTERACTIVE LEVITATING 4-LABEL SIGNAL TILES (SILKY CSS HOVER LIFT, ZERO SNAPPING!) -->
          <g :opacity="Math.max(0.25, summitRise)">
            <g
              v-for="(tile, ti) in summitTiles"
              :key="ti"
              class="summit-tile-hover-wrap"
              :class="[tile.kind !== 'dim' ? 'cursor-pointer' : 'pointer-events-none', { 'is-hovered': hoveredTileIdx === ti }]"
              @mouseenter="tile.kind !== 'dim' && (hoveredTileIdx = ti)"
              @mouseleave="hoveredTileIdx = null"
            >
              <g
                class="summit-tile-float"
                :style="{
                  animationDelay: `${-tile.delay}ms`,
                  animationDuration: `${tile.dur}s`,
                }"
              >
                <polygon
                  :points="isoHexPoints(tile.cx, tile.cy)"
                  :fill="tileFill(tile.kind)"
                  :stroke="hoveredTileIdx === ti ? '#FFFFFF' : tileStroke(tile.kind)"
                  :stroke-width="hoveredTileIdx === ti ? 2.2 : 1.2"
                  class="summit-stroke-smooth"
                />
                <path
                  v-if="tile.kind === 'opportunity'"
                  :d="`M ${tile.cx - 5} ${tile.cy + 1.5} L ${tile.cx} ${tile.cy - 2.5} L ${tile.cx + 5} ${tile.cy + 1.5}`"
                  stroke="#06291D"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <g v-else-if="tile.kind === 'fair'" stroke="#451A03" stroke-width="1.6" stroke-linecap="round">
                  <line :x1="tile.cx - 5" :y1="tile.cy - 1.8" :x2="tile.cx + 5" :y2="tile.cy - 1.8" />
                  <line :x1="tile.cx - 5" :y1="tile.cy + 1.8" :x2="tile.cx + 5" :y2="tile.cy + 1.8" />
                </g>
                <g v-else-if="tile.kind === 'crowded'" stroke="#450A0A" stroke-width="1.5" stroke-linecap="round">
                  <line :x1="tile.cx - 4" :y1="tile.cy - 2.5" :x2="tile.cx + 4" :y2="tile.cy + 2.5" />
                  <line :x1="tile.cx + 4" :y1="tile.cy - 2.5" :x2="tile.cx - 4" :y2="tile.cy + 2.5" />
                </g>
                <circle
                  v-else-if="tile.kind === 'low'"
                  :cx="tile.cx"
                  :cy="tile.cy"
                  r="2"
                  fill="#E2E8F0"
                />
              </g>
            </g>
          </g>

          <!-- 9. WINDING GLOWING TEAL -> MINT -> AMBER SPIRIT PATH (SURGES BRIGHTER ON SUMMIT HOVER!) -->
          <g class="pointer-events-none">
            <path
              :d="summitClimbPathD"
              stroke="url(#summit-climb-grad)"
              :stroke-width="summitHovered || beaconHovered || pulseActive ? 4.0 : 2.8"
              stroke-linecap="round"
              filter="url(#summit-soft-glow)"
              class="summit-stroke-smooth"
            />
            <path
              :d="summitClimbPathD"
              stroke="#A7F3D0"
              stroke-width="1.3"
              stroke-dasharray="3 14"
              stroke-linecap="round"
              class="animate-dash-flow"
              :opacity="summitHovered || pulseActive ? 1 : 0.75"
            />

            <g filter="url(#summit-soft-glow)">
              <g v-for="(nd, ni) in summitPathNodes" :key="ni">
                <circle
                  :cx="nd.x"
                  :cy="nd.y"
                  r="10"
                  fill="#10B981"
                  fill-opacity="0.24"
                  class="summit-peak-pulse"
                  :style="{ '--peak-delay': `${nd.delay}s` }"
                />
                <circle :cx="nd.x" :cy="nd.y" r="4" fill="#0B1917" stroke="#00E5A8" stroke-width="1.5" />
              </g>
            </g>

            <g filter="url(#summit-soft-glow)">
              <circle r="3.8" fill="#00E5A8">
                <animateMotion dur="5.6s" repeatCount="indefinite" :path="summitClimbPathD" />
              </circle>
              <circle r="3.1" fill="#FBBF24">
                <animateMotion dur="5.6s" begin="1.85s" repeatCount="indefinite" :path="summitClimbPathD" />
              </circle>
              <circle r="2.6" fill="#A7F3D0">
                <animateMotion dur="5.6s" begin="3.7s" repeatCount="indefinite" :path="summitClimbPathD" />
              </circle>
            </g>

            <!-- 10. FLOATING LUMINOUS VALLEY FIREFLIES ("KUNANG-KUNANG") -->
            <g filter="url(#summit-star-glow)">
              <circle
                v-for="(ff, ffi) in valleyFireflies"
                :key="`ff-${ffi}`"
                :cx="ff.x"
                :cy="ff.y"
                :r="ff.r"
                :fill="ff.fill"
                class="summit-firefly"
                :style="{
                  '--ff-dur': `${ff.dur}s`,
                  '--ff-delay': `${ff.delay}s`,
                }"
              />
            </g>
          </g>
        </svg>

        <!-- Interactive Hover HUD Pill + Honest Illustrative Caption -->
        <div class="mt-2 min-h-[36px] px-4 flex flex-col items-center justify-center gap-1.5">
          <Transition
            mode="out-in"
            enter-active-class="transition-all duration-200 ease-signal"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-signal"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div
              v-if="activeHoverHud"
              :key="activeHoverHud.badge"
              class="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-[#0E1621]/95 border border-white/15 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
            >
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :style="{ backgroundColor: activeHoverHud.color, boxShadow: `0 0 10px ${activeHoverHud.color}` }"
              />
              <span
                class="font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
                :style="{ color: activeHoverHud.color }"
              >
                {{ activeHoverHud.badge }}
              </span>
              <span class="font-sans text-[12px] text-ink-secondary">
                {{ activeHoverHud.desc }}
              </span>
            </div>
            <p
              v-else
              key="default-caption"
              class="text-center font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-muted/80"
            >
              HOVER OR CLICK THE SUMMIT & TILES TO ILLUMINATE · ILLUSTRATIVE, NOT REAL DATA.
            </p>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.summit-scroll-bounce {
  animation: summit-chev-bob 1.75s ease-in-out infinite;
}

.summit-star-twinkle {
  animation: summit-twinkle var(--star-dur, 3.6s) ease-in-out infinite;
  animation-delay: var(--star-delay, 0s);
}

.summit-flare-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-flare var(--star-dur, 4.4s) ease-in-out infinite;
  animation-delay: var(--star-delay, 0s);
}

.summit-shooting-a {
  opacity: 0;
  animation: summit-shoot-a 9.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
}

.summit-shooting-b {
  opacity: 0;
  animation: summit-shoot-b 13.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
  animation-delay: 4.8s;
}

.summit-radar-spin-cw {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-spin 92s linear infinite;
}

.summit-radar-spin-ccw {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-spin-rev 120s linear infinite;
}

.summit-orbit-cw {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-spin 28s linear infinite;
}

.summit-orbit-ccw {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-spin-rev 20s linear infinite;
}

.summit-compass-cw {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-spin 34s linear infinite;
}

.summit-compass-ccw {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-spin-rev 46s linear infinite;
}

.summit-needle-seek {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-needle-sway 5.4s ease-in-out infinite;
}

.summit-beacon-breathe {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-halo-pulse 4.2s ease-in-out infinite;
}

.summit-beacon-sonar {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-sonar-ring 3.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.summit-beam-breathe {
  animation: summit-beam-glow 5.2s ease-in-out infinite;
}

.summit-ridge-sweep-a {
  animation: summit-ridge-flow-a 11s linear infinite;
}

.summit-ridge-sweep-b {
  animation: summit-ridge-flow-b 14s linear infinite;
}

.summit-mist-drift-a {
  animation: summit-mist-a 16s ease-in-out infinite;
}

.summit-mist-drift-b {
  animation: summit-mist-b 19s ease-in-out infinite;
}

.summit-peak-pulse {
  transform-box: fill-box;
  transform-origin: center;
  will-change: transform, opacity;
  animation: summit-peak-glow 3.4s ease-in-out infinite;
}

.summit-tier-wave {
  will-change: opacity;
  animation: summit-tier-sweep 4.8s ease-in-out infinite;
}

.summit-tile-float {
  will-change: transform, opacity;
  animation: summit-tile-bob 4.6s ease-in-out infinite;
}

.summit-flank-float-a {
  animation: summit-flank-bob 5.6s ease-in-out infinite;
}

.summit-flank-float-b {
  animation: summit-flank-bob 6.4s ease-in-out infinite;
  animation-delay: -2.1s;
}

.summit-flank-float-c {
  animation: summit-flank-bob 5.9s ease-in-out infinite;
  animation-delay: -3.7s;
}

.summit-steam-a {
  animation: summit-steam-rise 3.4s ease-in-out infinite;
}

.summit-steam-b {
  animation: summit-steam-rise 3.9s ease-in-out infinite;
  animation-delay: 1.1s;
}

.summit-steam-c {
  animation: summit-steam-rise 3.6s ease-in-out infinite;
  animation-delay: 2.1s;
}

.summit-eq-bar {
  transform-box: fill-box;
  transform-origin: bottom center;
  animation: summit-eq-bounce var(--eq-dur, 2.8s) ease-in-out infinite;
  animation-delay: var(--eq-delay, 0s);
}

.summit-firefly {
  animation: summit-firefly-rise var(--ff-dur, 6.5s) ease-in-out infinite;
  animation-delay: var(--ff-delay, 0s);
}

@keyframes summit-chev-bob {
  0%,
  100% {
    transform: translateY(-1px);
    opacity: 0.65;
  }
  50% {
    transform: translateY(3px);
    opacity: 1;
  }
}

@keyframes summit-twinkle {
  0%,
  100% {
    opacity: 0.22;
  }
  50% {
    opacity: 0.96;
  }
}

@keyframes summit-flare {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.72);
  }
  50% {
    opacity: 1;
    transform: scale(1.18);
  }
}

@keyframes summit-shoot-a {
  0%,
  72% {
    opacity: 0;
    transform: translate(-110px, -60px);
  }
  77% {
    opacity: 0.95;
  }
  87% {
    opacity: 0;
    transform: translate(190px, 102px);
  }
  100% {
    opacity: 0;
    transform: translate(190px, 102px);
  }
}

@keyframes summit-shoot-b {
  0%,
  76% {
    opacity: 0;
    transform: translate(-120px, -64px);
  }
  81% {
    opacity: 0.88;
  }
  91% {
    opacity: 0;
    transform: translate(180px, 96px);
  }
  100% {
    opacity: 0;
    transform: translate(180px, 96px);
  }
}

@keyframes summit-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes summit-spin-rev {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@keyframes summit-needle-sway {
  0%,
  100% {
    transform: rotate(-28deg);
  }
  45% {
    transform: rotate(-42deg);
  }
  75% {
    transform: rotate(-18deg);
  }
}

@keyframes summit-halo-pulse {
  0%,
  100% {
    opacity: 0.78;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}

@keyframes summit-sonar-ring {
  0% {
    opacity: 0.65;
    transform: scale(0.75);
  }
  100% {
    opacity: 0;
    transform: scale(2.15);
  }
}

@keyframes summit-beam-glow {
  0%,
  100% {
    opacity: 0.82;
  }
  50% {
    opacity: 1;
  }
}

@keyframes summit-ridge-flow-a {
  0% {
    stroke-dashoffset: 1580;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes summit-ridge-flow-b {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 1640;
  }
}

@keyframes summit-mist-a {
  0%,
  100% {
    transform: translateX(-28px);
    opacity: 0.6;
  }
  50% {
    transform: translateX(46px);
    opacity: 0.95;
  }
}

@keyframes summit-mist-b {
  0%,
  100% {
    transform: translateX(32px);
    opacity: 0.55;
  }
  50% {
    transform: translateX(-44px);
    opacity: 0.92;
  }
}

@keyframes summit-peak-glow {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.85);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.35);
  }
}

@keyframes summit-tier-sweep {
  0%,
  55%,
  100% {
    opacity: 0.08;
  }
  26% {
    opacity: 0.68;
  }
}

@keyframes summit-tile-bob {
  0%,
  100% {
    transform: translateY(0px);
    opacity: 0.86;
  }
  50% {
    transform: translateY(-4.5px);
    opacity: 1;
  }
}

@keyframes summit-flank-bob {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-7.5px);
  }
}

@keyframes summit-steam-rise {
  0% {
    transform: translateY(4px);
    opacity: 0;
  }
  40% {
    opacity: 0.88;
  }
  100% {
    transform: translateY(-10px);
    opacity: 0;
  }
}

@keyframes summit-eq-bounce {
  0%,
  100% {
    transform: scaleY(0.45);
    opacity: 0.58;
  }
  50% {
    transform: scaleY(1.12);
    opacity: 0.98;
  }
}

@keyframes summit-firefly-rise {
  0% {
    transform: translate(0px, 14px);
    opacity: 0;
  }
  25% {
    opacity: 0.9;
  }
  65% {
    transform: translate(8px, -38px);
    opacity: 0.72;
  }
  100% {
    transform: translate(-5px, -84px);
    opacity: 0;
  }
}

/* GPU-composited Aurora sky ribbons (silky 60fps, zero SVG Gaussian blur frame drops!) */
.summit-gpu-aurora-a {
  will-change: transform, opacity;
  animation: summit-aurora-a 16s ease-in-out infinite;
}

.summit-gpu-aurora-b {
  will-change: transform, opacity;
  animation: summit-aurora-b 20s ease-in-out infinite;
}

.summit-gpu-aurora-c {
  will-change: transform, opacity;
  animation: summit-aurora-c 13s ease-in-out infinite;
}

/* Silky smooth interactive hover transitions across Summit, Tiles & Flank Pavilions */
.summit-tile-hover-wrap,
.summit-flank-hover-wrap,
.summit-pyramid-wrap {
  will-change: transform;
  transition: transform 0.44s cubic-bezier(0.22, 1, 0.36, 1);
}

.summit-tile-hover-wrap.is-hovered {
  transform: translate3d(0, -10px, 0);
}

.summit-flank-hover-wrap.is-hovered {
  transform: translate3d(0, -7px, 0);
}

.summit-pyramid-wrap.is-hovered {
  transform: translate3d(0, -4px, 0);
}

.summit-stroke-smooth {
  transition: stroke 0.36s ease, stroke-width 0.36s ease, stroke-opacity 0.36s ease, fill 0.36s ease, opacity 0.36s ease;
}

.summit-click-burst-a {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-burst-ring 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.summit-click-burst-b {
  transform-box: fill-box;
  transform-origin: center;
  animation: summit-burst-ring 1.25s cubic-bezier(0.16, 1, 0.3, 1) 0.14s forwards;
}

@keyframes summit-aurora-a {
  0%,
  100% {
    transform: translate3d(-24px, 0px, 0) scale(1);
    opacity: 0.72;
  }
  50% {
    transform: translate3d(38px, -12px, 0) scale(1.08);
    opacity: 1;
  }
}

@keyframes summit-aurora-b {
  0%,
  100% {
    transform: translate3d(26px, 4px, 0) scale(1.04);
    opacity: 0.65;
  }
  50% {
    transform: translate3d(-34px, -10px, 0) scale(0.96);
    opacity: 0.96;
  }
}

@keyframes summit-aurora-c {
  0%,
  100% {
    transform: translate3d(-50%, 0px, 0) scale(0.95);
    opacity: 0.62;
  }
  50% {
    transform: translate3d(-50%, -10px, 0) scale(1.1);
    opacity: 0.96;
  }
}

@keyframes summit-burst-ring {
  0% {
    opacity: 0.95;
    transform: scale(0.75);
  }
  100% {
    opacity: 0;
    transform: scale(6.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .summit-gpu-aurora-a,
  .summit-gpu-aurora-b,
  .summit-gpu-aurora-c,
  .summit-click-burst-a,
  .summit-click-burst-b,
  .summit-scroll-bounce,
  .summit-star-twinkle,
  .summit-flare-pulse,
  .summit-shooting-a,
  .summit-shooting-b,
  .summit-radar-spin-cw,
  .summit-radar-spin-ccw,
  .summit-orbit-cw,
  .summit-orbit-ccw,
  .summit-compass-cw,
  .summit-compass-ccw,
  .summit-needle-seek,
  .summit-beacon-breathe,
  .summit-beacon-sonar,
  .summit-beam-breathe,
  .summit-ridge-sweep-a,
  .summit-ridge-sweep-b,
  .summit-mist-drift-a,
  .summit-mist-drift-b,
  .summit-peak-pulse,
  .summit-tier-wave,
  .summit-tile-float,
  .summit-flank-float-a,
  .summit-flank-float-b,
  .summit-flank-float-c,
  .summit-steam-a,
  .summit-steam-b,
  .summit-steam-c,
  .summit-eq-bar,
  .summit-firefly {
    animation: none !important;
  }
}
</style>
