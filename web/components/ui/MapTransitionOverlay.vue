<script setup lang="ts">
const { visible, mode, progress, runId } = useMapTransition()
const settings = useAscendSettings()
const { viewportH, fitReady, isCompact, loaderZoom } = useDesktopFit()

const isEnter = computed(() => mode.value === 'enter-map')
const progressPct = computed(() => Math.round(Math.max(0, Math.min(100, progress.value))))

// 4 distinct, smooth data-grounded loading scene variants cycling on every open/exit
type LoaderVariant = 'hex-horizon' | 'signal-radar' | 'street-tracer' | 'demand-waves'
const VARIANT_ORDER: LoaderVariant[] = [
  'hex-horizon',
  'signal-radar',
  'street-tracer',
  'demand-waves',
]

const activeVariant = computed<LoaderVariant>(() => {
  const idx = Math.max(0, (runId.value - 1) % VARIANT_ORDER.length)
  return VARIANT_ORDER[idx] ?? 'hex-horizon'
})

// Exact Homepage Hero stepped 2D pearl-white ASCEND wordmark
const letters = [
  { char: 'A', step: 0, gradPos: '0%', delayMs: 0 },
  { char: 'S', step: 1, gradPos: '20%', delayMs: 45 },
  { char: 'C', step: 2, gradPos: '40%', delayMs: 90 },
  { char: 'E', step: 3, gradPos: '60%', delayMs: 135 },
  { char: 'N', step: 4, gradPos: '80%', delayMs: 180 },
  { char: 'D', step: 5, gradPos: '100%', delayMs: 225 },
] as const

// Exact Homepage HeroTreasureRoute curve synchronized directly with loading progress (Loader #1)
const TRAIL_PATH =
  'M 14 78 C 122 80, 214 75, 318 88 C 402 96, 464 62, 538 59 C 594 56, 628 52, 666 44 L 724 86 L 784 54 Q 842 46, 898 41'

const TRAIL_WAYPOINTS = [
  { id: 'wp-1', x: 318, y: 88, at: 32 },
  { id: 'wp-2', x: 666, y: 44, at: 68 },
  { id: 'wp-3', x: 724, y: 86, at: 78 },
] as const

const trailPathRef = ref<SVGPathElement | null>(null)
const trailLen = ref<number>(1000)

const trailComet = computed(() => {
  const p = Math.max(0, Math.min(1, progress.value / 100))
  const el = trailPathRef.value
  if (el && trailLen.value > 0) {
    try {
      const pt = el.getPointAtLength(p * trailLen.value)
      return { x: pt.x, y: pt.y, visible: p > 0.02 && p < 0.985 }
    } catch {
      return { x: 14, y: 78, visible: false }
    }
  }
  return { x: 14 + p * 884, y: 78 - p * 49, visible: p > 0.02 && p < 0.985 }
})

watch([visible, runId], async ([isVis]) => {
  if (isVis) {
    await nextTick()
    if (trailPathRef.value) {
      trailLen.value = trailPathRef.value.getTotalLength() || 1000
    }
  }
})

const statusMessage = computed(() => {
  const p = progressPct.value
  if (settings.isId.value) {
    if (isEnter.value) {
      if (p < 22) return 'Membaca data peta lingkungan terbuka...'
      if (p < 46) return 'Memetakan 1.976 area lingkungan...'
      if (p < 72) return 'Membandingkan kedai kopi aktif dengan permintaan...'
      if (p < 92) return 'Menggambar jalan dan lapisan heksagon...'
      if (p < 99) return 'Menyiapkan sinyal peluang akhir...'
      return 'Peta peluang siap digunakan.'
    }
    if (p < 38) return 'Menjaga daftar pendek tetap tersimpan di browser...'
    if (p < 76) return 'Menutup sesi peta dengan rapi...'
    return 'Kembali ke beranda...'
  }
  if (isEnter.value) {
    if (p < 22) return 'Reading open neighborhood map records...'
    if (p < 46) return 'Mapping 1,976 neighborhood areas...'
    if (p < 72) return 'Comparing active coffee shops with local demand...'
    if (p < 92) return 'Painting streets & hexagon layers...'
    if (p < 99) return 'Locking final neighborhood signals...'
    return 'Opportunity map ready.'
  }
  if (p < 38) return 'Keeping your shortlist saved in this browser...'
  if (p < 76) return 'Wrapping up your map session...'
  return 'Back to homepage...'
})

const enterTips = computed(() =>
  settings.isId.value
    ? [
        'Setiap area dihitung bersama 6 tetangga terdekatnya (sekitar 500 m).',
        'Label membandingkan kedai kopi aktif dengan kapasitas permintaan setempat.',
        'Dibangun dari OpenStreetMap, Overture Maps, dan WorldPop tanpa listing berbayar.',
        'Tanpa akun. Simpan hingga 10 area pilihan secara lokal di browser ini.',
      ]
    : [
        'Every area counts itself plus its 6 immediate neighbors (about 500 m).',
        'Labels compare open coffee shops against typical nearby neighborhood demand.',
        'Built from OpenStreetMap, Overture Maps, and WorldPop with zero paid listings.',
        'No account needed. Save up to 10 shortlist spots locally in this browser.',
      ],
)

const exitTips = computed(() =>
  settings.isId.value
    ? [
        'Daftar pendek tersimpanmu tetap aman di perangkat ini.',
        'Buka kembali peta peluang kapan saja dengan satu klik dari beranda.',
      ]
    : [
        'Your saved shortlist stays safely stored on this device.',
        'Reopen the opportunity map anytime with one click from the homepage.',
      ],
)

const tipTick = ref(0)
let tipInterval: ReturnType<typeof setInterval> | null = null

const activeTips = computed(() => (isEnter.value ? enterTips.value : exitTips.value))
const activeTipText = computed(() => activeTips.value[tipTick.value % activeTips.value.length]!)

// Cycling Nusantara SME business badges on the Left Flank
const smeBadges = ['KEDAI KOPI', 'WARUNG', 'GEROBAK', 'KIOS', 'RUKO', 'STUDIO'] as const
const activeSmeIndex = computed(() => {
  if (isEnter.value) {
    return Math.min(smeBadges.length - 1, Math.floor((progressPct.value / 100) * smeBadges.length))
  }
  return tipTick.value % smeBadges.length
})

// Right Flank & Variant 2 7-Hex (~500 m) neighbor counting scanner coordinates
const neighborRadarHexes = [
  { cx: 64, cy: 26, fill: '#10B981', stroke: '#6EE7B7', at: 18 },
  { cx: 94, cy: 43, fill: '#D98A0C', stroke: '#FCD34D', at: 32 },
  { cx: 94, cy: 77, fill: '#10B981', stroke: '#6EE7B7', at: 46 },
  { cx: 64, cy: 94, fill: '#CC3B3B', stroke: '#FCA5A5', at: 60 },
  { cx: 34, cy: 77, fill: '#D98A0C', stroke: '#FCD34D', at: 74 },
  { cx: 34, cy: 43, fill: '#5A6B80', stroke: '#CBD5E1', at: 86 },
] as const

function miniHexPoints(cx: number, cy: number, r = 14): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

// Refreshing Starry Sky & Rising Valley Fireflies (lightweight, zero heavy blur)
const loaderStars = [
  { x: 64, y: 52, r: 1.5, fill: '#E2E8F0', dur: 3.2, delay: -0.4 },
  { x: 148, y: 112, r: 1.2, fill: '#6EE7B7', dur: 4.1, delay: -1.6 },
  { x: 236, y: 46, r: 1.4, fill: '#FCD34D', dur: 3.6, delay: -0.9 },
  { x: 342, y: 94, r: 1.1, fill: '#A7F3D0', dur: 4.5, delay: -2.1 },
  { x: 468, y: 38, r: 1.3, fill: '#F8FAFC', dur: 3.4, delay: -0.5 },
  { x: 974, y: 42, r: 1.4, fill: '#6EE7B7', dur: 3.8, delay: -1.4 },
  { x: 1098, y: 88, r: 1.2, fill: '#FCD34D', dur: 4.3, delay: -0.8 },
  { x: 1206, y: 46, r: 1.5, fill: '#F8FAFC', dur: 3.0, delay: -1.9 },
  { x: 1296, y: 114, r: 1.2, fill: '#A7F3D0', dur: 4.0, delay: -0.3 },
  { x: 1384, y: 58, r: 1.4, fill: '#E2E8F0', dur: 3.5, delay: -2.4 },
  { x: 96, y: 214, r: 1.2, fill: '#5EEAD4', dur: 4.2, delay: -1.1 },
  { x: 1348, y: 206, r: 1.2, fill: '#6EE7B7', dur: 3.9, delay: -1.7 },
] as const

const loaderFlares = [
  { x: 186, y: 70, s: 0.92, fill: '#A7F3D0', dur: 4.0, delay: -0.6 },
  { x: 392, y: 56, s: 0.72, fill: '#FDE68A', dur: 4.6, delay: -1.8 },
  { x: 1042, y: 60, s: 0.78, fill: '#6EE7B7', dur: 4.2, delay: -1.1 },
  { x: 1248, y: 74, s: 0.96, fill: '#FDE68A', dur: 3.9, delay: -2.2 },
] as const

const loaderFireflies = [
  { x: 146, y: 238, r: 2.0, fill: '#00E5A8', dur: 5.4, delay: -0.4 },
  { x: 312, y: 256, r: 1.8, fill: '#FBBF24', dur: 6.1, delay: -1.8 },
  { x: 524, y: 248, r: 1.9, fill: '#34D399', dur: 5.8, delay: -2.9 },
  { x: 742, y: 264, r: 1.7, fill: '#5EEAD4', dur: 6.3, delay: -1.1 },
  { x: 956, y: 252, r: 2.0, fill: '#FDE68A', dur: 5.9, delay: -3.4 },
  { x: 1144, y: 244, r: 1.8, fill: '#00E5A8', dur: 5.6, delay: -0.9 },
  { x: 1304, y: 236, r: 2.1, fill: '#34D399', dur: 6.0, delay: -2.2 },
] as const

// ==================== VARIANT 0: CLEAN, AIRY, LOWER-HORIZON ANIMATED HEX PILLARS (ZERO TITLE COLLISION!) ====================
// Only 18 sculpted pillars across 2 airy rows strictly confined to the lower horizon band (y = 148..214 in 1440x290 viewBox)
type PrismAccent = 'none' | 'opportunity' | 'fair' | 'crowded' | 'low' | 'rim'
type BobClass = 'ldr-bob-a' | 'ldr-bob-b' | 'ldr-bob-c' | 'ldr-bob-d'

interface LoaderPrism {
  cx: number
  baseTopY: number
  accent: PrismAccent
  igniteAt: number
  bobClass: BobClass
  waveDur: number
  waveDelay: number
  badgeText?: string
  row: 'back' | 'front'
}

const loaderPrisms: LoaderPrism[] = (() => {
  const list: LoaderPrism[] = []
  const bobClasses: BobClass[] = ['ldr-bob-a', 'ldr-bob-b', 'ldr-bob-c', 'ldr-bob-d']

  // Back airy row (9 well-spaced pillars framing the edges smoothly, dipping gently in center so progress bar breathes!)
  for (let i = 0; i < 9; i++) {
    const cx = 80 + i * 160
    const edgeLift = Math.abs(cx - 720) / 720 // higher on flanks, lower in center
    const baseTopY = Math.round(172 - edgeLift * 36 + ((i * 11) % 10))
    const accent: PrismAccent = i === 1 || i === 7 ? 'rim' : 'none'
    list.push({
      cx,
      baseTopY,
      accent,
      igniteAt: 12,
      bobClass: bobClasses[i % 4]!,
      waveDur: Number((3.6 + (i % 4) * 0.42).toFixed(2)),
      waveDelay: Number((-(i * 0.52)).toFixed(2)),
      row: 'back',
    })
  }

  // Front focal row (9 spacious pillars featuring the 4 label caps cleanly visible!)
  for (let i = 0; i < 9; i++) {
    const cx = 148 + i * 143
    const edgeLift = Math.abs(cx - 720) / 720
    const baseTopY = Math.round(202 - edgeLift * 24 + ((i * 7) % 10))
    let accent: PrismAccent = 'none'
    let igniteAt = 0
    let badgeText: string | undefined

    if (i === 1) {
      accent = 'opportunity'
      igniteAt = 16
      badgeText = 'OPPORTUNITY'
    } else if (i === 2) {
      accent = 'fair'
      igniteAt = 38
      badgeText = 'FAIR'
    } else if (i === 6) {
      accent = 'crowded'
      igniteAt = 60
      badgeText = 'CROWDED'
    } else if (i === 7) {
      accent = 'low'
      igniteAt = 78
      badgeText = 'LOW DEMAND'
    } else if (i === 0 || i === 8) {
      accent = 'rim'
      igniteAt = 10
    }

    list.push({
      cx,
      baseTopY,
      accent,
      igniteAt,
      bobClass: bobClasses[(i + 2) % 4]!,
      waveDur: Number((3.2 + ((i + 1) % 4) * 0.38).toFixed(2)),
      waveDelay: Number((-(i * 0.46 + 0.3)).toFixed(2)),
      badgeText,
      row: 'front',
    })
  }

  return list
})()

const rx = 40
const ry = 18
const floorY = 330

function hexTop(cx: number, topY: number): string {
  const half = rx * 0.52
  return `${cx - rx},${topY} ${cx - half},${topY - ry} ${cx + half},${topY - ry} ${cx + rx},${topY} ${cx + half},${topY + ry} ${cx - half},${topY + ry}`
}

function hexLeft(cx: number, topY: number): string {
  const half = rx * 0.52
  return `${cx - rx},${topY} ${cx - half},${topY + ry} ${cx - half},${floorY} ${cx - rx},${floorY}`
}

function hexFront(cx: number, topY: number): string {
  const half = rx * 0.52
  return `${cx - half},${topY + ry} ${cx + half},${topY + ry} ${cx + half},${floorY} ${cx - half},${floorY}`
}

function hexRight(cx: number, topY: number): string {
  const half = rx * 0.52
  return `${cx + half},${topY + ry} ${cx + rx},${topY} ${cx + rx},${floorY} ${cx + half},${floorY}`
}

function prismTopFill(p: LoaderPrism): string {
  const active = progressPct.value >= p.igniteAt || !isEnter.value
  if (p.accent === 'opportunity' && active) return 'url(#loader-pat-opp)'
  if (p.accent === 'fair' && active) return 'url(#loader-pat-fair)'
  if (p.accent === 'crowded' && active) return 'url(#loader-pat-crowd)'
  if (p.accent === 'low' && active) return 'url(#loader-pat-low)'
  if (p.accent === 'rim') return '#102424'
  return p.row === 'back' ? '#161F2D' : '#131A26'
}

function prismTopStroke(p: LoaderPrism): string {
  const active = progressPct.value >= p.igniteAt || !isEnter.value
  if (p.accent === 'opportunity' && active) return '#34D399'
  if (p.accent === 'fair' && active) return '#FBBF24'
  if (p.accent === 'crowded' && active) return '#F87171'
  if (p.accent === 'low' && active) return '#CBD5E1'
  if (p.accent === 'rim') return '#10B981'
  return '#2A374C'
}

// ==================== VARIANT 1: HORIZON 7-HEX (~500 M) ORBITAL RADAR CELLS ====================
const horizonRadarCells = [
  { cx: 720, cy: 146, fill: '#10B981', stroke: '#6EE7B7', at: 10, center: true },
  { cx: 720, cy: 84, fill: '#10B981', stroke: '#6EE7B7', at: 20, center: false },
  { cx: 814, cy: 114, fill: '#D98A0C', stroke: '#FCD34D', at: 34, center: false },
  { cx: 814, cy: 178, fill: '#10B981', stroke: '#6EE7B7', at: 48, center: false },
  { cx: 720, cy: 208, fill: '#CC3B3B', stroke: '#FCA5A5', at: 62, center: false },
  { cx: 626, cy: 178, fill: '#D98A0C', stroke: '#FCD34D', at: 74, center: false },
  { cx: 626, cy: 114, fill: '#5A6B80', stroke: '#CBD5E1', at: 86, center: false },
] as const

// ==================== VARIANT 2: ARCHITECTURAL STREET BLUEPRINT ROUTES ====================
const blueprintRoutes = [
  { d: 'M 140 264 L 410 194 L 560 218 L 720 156', color: '#00E5A8', delay: '0s', dur: '3.6s' },
  { d: 'M 1300 264 L 1030 194 L 880 218 L 720 156', color: '#34D399', delay: '-1.2s', dur: '3.8s' },
  { d: 'M 320 278 L 510 170 L 720 156', color: '#FBBF24', delay: '-0.7s', dur: '3.2s' },
  { d: 'M 1120 278 L 930 170 L 720 156', color: '#14B8A6', delay: '-2.0s', dur: '3.4s' },
] as const

// ==================== VARIANT 3: SUPPLY VS DEMAND EQUALIZER SPIRES ====================
const demandSpires = Array.from({ length: 14 }, (_, i) => {
  const x = 152 + i * 87.5
  const isDemand = i % 2 === 0
  const h = 44 + ((i * 23) % 52)
  const bobs: BobClass[] = ['ldr-bob-a', 'ldr-bob-b', 'ldr-bob-c', 'ldr-bob-d']
  return {
    x,
    h,
    color: isDemand ? '#00E5A8' : '#F59E0B',
    bobClass: bobs[i % 4]!,
    dur: Number((2.9 + (i % 4) * 0.45).toFixed(2)),
    delay: Number((-(i * 0.34)).toFixed(2)),
  }
})

watch(visible, (isVis) => {
  if (tipInterval) {
    clearInterval(tipInterval)
    tipInterval = null
  }
  if (isVis) {
    tipTick.value = 0
    tipInterval = setInterval(() => {
      tipTick.value += 1
    }, 1600)
  }
})

onBeforeUnmount(() => {
  if (tipInterval) clearInterval(tipInterval)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-250 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-350 ease-signal"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-[1.015]"
    >
      <div
        v-if="visible"
        :key="`loader-${runId}`"
        role="status"
        aria-live="polite"
        :aria-label="isEnter ? 'Opening the opportunity map' : 'Returning to homepage'"
        class="fixed inset-0 z-[90] bg-[#060B11] overflow-hidden select-none"
      >
        <div
          class="relative w-full h-full flex flex-col justify-between"
          :style="
            fitReady && isCompact
              ? {
                  width: '1180px',
                  height: `${Math.ceil(viewportH / loaderZoom)}px`,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  zoom: String(loaderZoom),
                }
              : undefined
          "
        >
        <!-- EYE-CATCHING GPU-COMPOSITED SILKY AURORA SKY CURTAINS (ZERO HEAVY SVG BLUR!) -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            class="absolute -top-24 -left-24 w-[68vw] h-[46vh] rounded-full blur-[90px] opacity-40 ldr-aurora-a"
            style="background: radial-gradient(ellipse at center, rgba(0, 229, 168, 0.34), rgba(16, 185, 129, 0.14) 55%, transparent 78%);"
          />
          <div
            class="absolute -top-16 -right-24 w-[64vw] h-[44vh] rounded-full blur-[95px] opacity-35 ldr-aurora-b"
            style="background: radial-gradient(ellipse at center, rgba(20, 184, 166, 0.32), rgba(245, 158, 11, 0.14) 55%, transparent 78%);"
          />
          <div
            class="absolute top-[22vh] left-1/2 -translate-x-1/2 w-[72vw] h-[36vh] rounded-full blur-[80px] opacity-30 ldr-aurora-c"
            style="background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.24), rgba(20, 184, 166, 0.08) 54%, transparent 76%);"
          />
          <div
            class="absolute inset-x-0 bottom-0 h-[34vh]"
            style="background: radial-gradient(ellipse 74% 86% at 50% 100%, rgba(16, 185, 129, 0.18), rgba(20, 184, 166, 0.06) 54%, transparent 82%);"
          />
        </div>

        <!-- Subtle Full-Viewport Hexagonal Lattice Texture -->
        <svg
          class="pointer-events-none absolute inset-0 w-full h-full opacity-35"
          aria-hidden="true"
        >
          <defs>
            <pattern id="loader-bg-hex" width="44" height="38" patternUnits="userSpaceOnUse">
              <path
                d="M22 1 L42 11 L42 27 L22 37 L2 27 L2 11 Z"
                fill="none"
                stroke="rgba(148, 163, 184, 0.08)"
                stroke-width="0.9"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loader-bg-hex)" />
        </svg>

        <!-- REFRESHING STARFIELD, 4-POINT FLARES & SHOOTING COMETS -->
        <svg
          viewBox="0 0 1440 360"
          preserveAspectRatio="xMidYMin slice"
          class="pointer-events-none absolute inset-x-0 top-0 w-full h-[46vh] z-0"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ldr-shoot-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0" />
              <stop offset="65%" stop-color="#6EE7B7" stop-opacity="0.72" />
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="1" />
            </linearGradient>
          </defs>

          <circle
            v-for="(s, si) in loaderStars"
            :key="`ls-${si}`"
            :cx="s.x"
            :cy="s.y"
            :r="s.r"
            :fill="s.fill"
            class="loader-twinkle"
            :style="{ '--tw-dur': `${s.dur}s`, '--tw-delay': `${s.delay}s` }"
          />

          <g
            v-for="(fl, fi) in loaderFlares"
            :key="`lf-${fi}`"
            :transform="`translate(${fl.x}, ${fl.y}) scale(${fl.s})`"
          >
            <path
              d="M 0 -9 Q 0 0 9 0 Q 0 0 0 9 Q 0 0 -9 0 Q 0 0 0 -9 Z"
              :fill="fl.fill"
              class="loader-flare"
              :style="{ '--tw-dur': `${fl.dur}s`, '--tw-delay': `${fl.delay}s` }"
            />
          </g>

          <line
            x1="120"
            y1="24"
            x2="220"
            y2="74"
            stroke="url(#ldr-shoot-grad)"
            stroke-width="1.5"
            stroke-linecap="round"
            class="loader-shoot-a"
          />
          <line
            x1="1140"
            y1="26"
            x2="1240"
            y2="78"
            stroke="url(#ldr-shoot-grad)"
            stroke-width="1.4"
            stroke-linecap="round"
            class="loader-shoot-b"
          />
        </svg>

        <!-- ==================== LOWER-HORIZON ROTATING SCENE VARIANTS (STRICTLY BELOW TITLE & PROGRESS BAR!) ==================== -->
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 h-[31vh] sm:h-[33vh] z-10 overflow-hidden"
          aria-hidden="true"
        >
          <!-- VARIANT 0: CLEAN AIRY ANIMATED 3D HEX PILLARS (18 SPACED PILLARS, SMOOTH UP-DOWN WAVE, ZERO DIAGONAL SLASH LINE!) -->
          <svg
            v-if="activeVariant === 'hex-horizon'"
            viewBox="0 0 1440 290"
            preserveAspectRatio="xMidYMax slice"
            class="w-full h-full block"
            fill="none"
          >
            <defs>
              <pattern id="loader-pat-opp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="8" height="8" fill="#10B981" />
                <line x1="0" y1="0" x2="0" y2="8" stroke="#064E3B" stroke-width="2.4" />
              </pattern>
              <pattern id="loader-pat-fair" width="8" height="6" patternUnits="userSpaceOnUse">
                <rect width="8" height="6" fill="#D98A0C" />
                <line x1="0" y1="3" x2="8" y2="3" stroke="#78350F" stroke-width="1.6" />
              </pattern>
              <pattern id="loader-pat-crowd" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="#CC3B3B" />
                <path d="M0 8 L8 0 M0 0 L8 8" stroke="#7F1D1D" stroke-width="1.4" />
              </pattern>
              <pattern id="loader-pat-low" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="#5A6B80" />
                <circle cx="3" cy="3" r="1.1" fill="#E2E8F0" fill-opacity="0.7" />
              </pattern>
              <linearGradient id="loader-bottom-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#060B11" stop-opacity="0" />
                <stop offset="72%" stop-color="#060B11" stop-opacity="0.44" />
                <stop offset="100%" stop-color="#060B11" stop-opacity="0.96" />
              </linearGradient>
            </defs>

            <!-- 18 Cleanly Spaced Rising & Falling 3D Isometric Hexagonal Columns (Concrete GPU Keyframes!) -->
            <g
              v-for="(prism, idx) in loaderPrisms"
              :key="`hp-${idx}`"
              :class="prism.bobClass"
              :style="{
                animationDuration: `${prism.waveDur}s`,
                animationDelay: `${prism.waveDelay}s`,
              }"
            >
              <polygon :points="hexLeft(prism.cx, prism.baseTopY)" fill="#0F1520" stroke="#222E40" stroke-width="0.95" />
              <polygon :points="hexFront(prism.cx, prism.baseTopY)" fill="#151D2B" stroke="#263448" stroke-width="0.95" />
              <polygon :points="hexRight(prism.cx, prism.baseTopY)" fill="#0C111A" stroke="#1E293A" stroke-width="0.95" />
              <polygon
                :points="hexTop(prism.cx, prism.baseTopY)"
                :fill="prismTopFill(prism)"
                :stroke="prismTopStroke(prism)"
                :stroke-width="prism.accent !== 'none' ? 1.55 : 1"
              />
              <text
                v-if="prism.badgeText && (progressPct >= prism.igniteAt || !isEnter)"
                :x="prism.cx"
                :y="prism.baseTopY - 25"
                text-anchor="middle"
                :fill="prismTopStroke(prism)"
                font-family="Space Mono, monospace"
                font-size="8.5"
                font-weight="700"
                letter-spacing="1.2"
              >
                {{ prism.badgeText }}
              </text>
            </g>

            <!-- Soft Rising Valley Fireflies -->
            <circle
              v-for="(ff, ffi) in loaderFireflies"
              :key="`lff-${ffi}`"
              :cx="ff.x"
              :cy="ff.y"
              :r="ff.r"
              :fill="ff.fill"
              class="loader-firefly"
              :style="{ animationDuration: `${ff.dur}s`, animationDelay: `${ff.delay}s` }"
            />

            <rect x="0" y="185" width="1440" height="105" fill="url(#loader-bottom-fade)" />
          </svg>

          <!-- VARIANT 1: NUSANTARA ~500 M ORBITAL HEX SIGNAL RADAR -->
          <svg
            v-else-if="activeVariant === 'signal-radar'"
            viewBox="0 0 1440 290"
            preserveAspectRatio="xMidYMax slice"
            class="w-full h-full block"
            fill="none"
          >
            <defs>
              <radialGradient id="ldr-radar-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#00E5A8" stop-opacity="0.28" />
                <stop offset="55%" stop-color="#14B8A6" stop-opacity="0.09" />
                <stop offset="100%" stop-color="#060B11" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="ldr-radar-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#060B11" stop-opacity="0" />
                <stop offset="80%" stop-color="#060B11" stop-opacity="0.55" />
                <stop offset="100%" stop-color="#060B11" stop-opacity="0.98" />
              </linearGradient>
            </defs>

            <!-- Ground Glow & Concentric Perspective Radar Rings -->
            <ellipse cx="720" cy="166" rx="460" ry="118" fill="url(#ldr-radar-glow)" />
            <ellipse cx="720" cy="164" rx="430" ry="102" stroke="#10B981" stroke-opacity="0.18" stroke-width="1.1" stroke-dasharray="6 10" />
            <ellipse cx="720" cy="164" rx="310" ry="74" stroke="#14B8A6" stroke-opacity="0.26" stroke-width="1.2" stroke-dasharray="4 8" />
            <ellipse cx="720" cy="164" rx="190" ry="46" stroke="#34D399" stroke-opacity="0.34" stroke-width="1.2" />

            <!-- Expanding Smooth Sonar Rings -->
            <ellipse cx="720" cy="164" rx="170" ry="42" stroke="#00E5A8" stroke-width="1.5" class="ldr-horizon-sonar" />
            <ellipse cx="720" cy="164" rx="170" ry="42" stroke="#FBBF24" stroke-width="1.1" class="ldr-horizon-sonar" style="animation-delay: -1.4s;" />

            <!-- 7 Floating Neighborhood Hexagons (~500 m Ring) Gently Bobbing & Illuminating -->
            <g
              v-for="(cell, ci) in horizonRadarCells"
              :key="`rc-${ci}`"
              :class="ci % 2 === 0 ? 'ldr-bob-a' : 'ldr-bob-c'"
              :style="{ animationDuration: `${3.4 + (ci % 3) * 0.5}s`, animationDelay: `${-(ci * 0.4)}s` }"
            >
              <polygon
                :points="hexTop(cell.cx, cell.cy)"
                :fill="progressPct >= cell.at || !isEnter ? cell.fill : '#111927'"
                :fill-opacity="cell.center ? 0.34 : progressPct >= cell.at || !isEnter ? 0.44 : 0.72"
                :stroke="cell.center ? '#FFFFFF' : progressPct >= cell.at || !isEnter ? cell.stroke : '#2A384D'"
                :stroke-width="cell.center ? 2 : 1.35"
              />
            </g>

            <!-- Sweeping Horizon Scan Line -->
            <line x1="220" y1="164" x2="1220" y2="164" stroke="#00E5A8" stroke-opacity="0.16" stroke-width="1" />
            <circle cx="720" cy="146" r="5" fill="#00E5A8" />
            <rect x="0" y="210" width="1440" height="80" fill="url(#ldr-radar-fade)" />
          </svg>

          <!-- VARIANT 2: ARCHITECTURAL CITY STREET BLUEPRINT & CONVERGING OPPORTUNITY RIBBONS -->
          <svg
            v-else-if="activeVariant === 'street-tracer'"
            viewBox="0 0 1440 290"
            preserveAspectRatio="xMidYMax slice"
            class="w-full h-full block"
            fill="none"
          >
            <defs>
              <linearGradient id="ldr-grid-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#060B11" stop-opacity="0" />
                <stop offset="78%" stop-color="#060B11" stop-opacity="0.52" />
                <stop offset="100%" stop-color="#060B11" stop-opacity="0.98" />
              </linearGradient>
            </defs>

            <!-- Clean Isometric Architectural City Street Grid -->
            <g stroke="#1E2C3E" stroke-width="1" opacity="0.65">
              <line x1="720" y1="68" x2="80" y2="290" />
              <line x1="720" y1="68" x2="320" y2="290" />
              <line x1="720" y1="68" x2="540" y2="290" />
              <line x1="720" y1="68" x2="900" y2="290" />
              <line x1="720" y1="68" x2="1120" y2="290" />
              <line x1="720" y1="68" x2="1360" y2="290" />
              <line x1="120" y1="156" x2="1320" y2="156" stroke-dasharray="4 8" />
              <line x1="40" y1="204" x2="1400" y2="204" />
              <line x1="0" y1="252" x2="1440" y2="252" />
            </g>

            <!-- Smooth Glowing Commuter Signal Streams Converging Into Opportunity Beacon -->
            <g v-for="(rt, ri) in blueprintRoutes" :key="`br-${ri}`">
              <path :d="rt.d" :stroke="rt.color" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path
                :d="rt.d"
                :stroke="rt.color"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-dasharray="48 260"
                class="ldr-route-stream"
                :style="{ animationDuration: rt.dur, animationDelay: rt.delay }"
              />
            </g>

            <!-- Glowing Target Beacon at Central Intersection -->
            <g class="ldr-bob-c" style="animation-duration: 3.4s;">
              <polygon :points="hexTop(720, 156)" fill="#0D2622" stroke="#00E5A8" stroke-width="2" />
              <circle cx="720" cy="156" r="5" fill="#FBBF24" />
            </g>

            <rect x="0" y="205" width="1440" height="85" fill="url(#ldr-grid-fade)" />
          </svg>

          <!-- VARIANT 3: SUPPLY VS DEMAND SILK HORIZON WAVES + LUMINOUS GLASS SPIRES -->
          <svg
            v-else
            viewBox="0 0 1440 290"
            preserveAspectRatio="xMidYMax slice"
            class="w-full h-full block"
            fill="none"
          >
            <defs>
              <linearGradient id="ldr-wave-mint" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#14B8A6" stop-opacity="0" />
                <stop offset="28%" stop-color="#10B981" stop-opacity="0.45" />
                <stop offset="50%" stop-color="#00E5A8" stop-opacity="0.7" />
                <stop offset="72%" stop-color="#10B981" stop-opacity="0.45" />
                <stop offset="100%" stop-color="#14B8A6" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="ldr-wave-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#F59E0B" stop-opacity="0" />
                <stop offset="32%" stop-color="#F59E0B" stop-opacity="0.38" />
                <stop offset="50%" stop-color="#FBBF24" stop-opacity="0.58" />
                <stop offset="68%" stop-color="#F59E0B" stop-opacity="0.38" />
                <stop offset="100%" stop-color="#F59E0B" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="ldr-wave-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#10B981" stop-opacity="0.16" />
                <stop offset="100%" stop-color="#060B11" stop-opacity="0" />
              </linearGradient>
            </defs>

            <!-- Undulating Demand & Supply Horizon Curves -->
            <g class="ldr-wave-glide-a">
              <path d="M -80 186 Q 220 112, 520 174 T 1120 156 T 1520 182 L 1520 290 L -80 290 Z" fill="url(#ldr-wave-fill)" />
              <path d="M -80 186 Q 220 112, 520 174 T 1120 156 T 1520 182" stroke="url(#ldr-wave-mint)" stroke-width="2.4" />
            </g>
            <g class="ldr-wave-glide-b">
              <path d="M -80 206 Q 260 250, 580 186 T 1180 204 T 1520 176" stroke="url(#ldr-wave-amber)" stroke-width="1.9" stroke-dasharray="6 8" />
            </g>

            <!-- 14 Floating Luminous Supply/Demand Equalizer Spires -->
            <g
              v-for="(sp, si) in demandSpires"
              :key="`sp-${si}`"
              :class="sp.bobClass"
              :style="{ animationDuration: `${sp.dur}s`, animationDelay: `${sp.delay}s` }"
            >
              <rect
                :x="sp.x - 4"
                :y="238 - sp.h"
                width="8"
                :height="sp.h"
                rx="4"
                :fill="sp.color"
                fill-opacity="0.22"
                :stroke="sp.color"
                stroke-opacity="0.72"
                stroke-width="1.1"
              />
              <circle :cx="sp.x" :cy="238 - sp.h - 8" r="2.6" :fill="sp.color" />
            </g>
          </svg>
        </div>

        <!-- LEFT WING: NUSANTARA COFFEE SHOP ("KEDAI KOPI") & CYCLING SME SCALE BADGES (CLEANLY CLEAR OF CENTER) -->
        <div
          class="pointer-events-none flex flex-col items-center gap-2.5 absolute left-8 bottom-[35vh] z-20 w-[184px] loader-wing-float-a"
          aria-hidden="true"
        >
          <div class="relative w-[124px] h-[106px] flex items-center justify-center">
            <div class="absolute inset-2 rounded-full blur-2xl bg-mint/20" />
            <svg viewBox="0 0 132 112" class="w-full h-full overflow-visible" fill="none">
              <polygon points="18,68 42,54 90,54 114,68 90,82 42,82" fill="#0F2020" stroke="#10B981" stroke-width="1.35" />
              <polygon points="18,68 42,82 42,96 18,82" fill="#0D1622" stroke="#243347" stroke-width="1" />
              <polygon points="42,82 90,82 90,96 42,96" fill="#131E2E" stroke="#2B3D54" stroke-width="1" />
              <polygon points="90,82 114,68 114,82 90,96" fill="#0A111B" stroke="#1F2C3D" stroke-width="1" />
              <path
                d="M 50 47 L 78 47 L 76 64 C 75.5 68 72 70.5 64 70.5 C 56 70.5 52.5 68 52 64 Z"
                fill="#0C2620"
                stroke="#00E5A8"
                stroke-width="1.7"
                stroke-linejoin="round"
              />
              <path d="M 78 50 C 85 50 85 61 77 62" stroke="#00E5A8" stroke-width="1.7" stroke-linecap="round" />
              <line x1="46" y1="73" x2="82" y2="73" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round" />
              <path d="M 56 42 C 54 34, 60 28, 57 20" stroke="#6EE7B7" stroke-width="1.5" stroke-linecap="round" class="loader-steam-a" />
              <path d="M 64 40 C 67 31, 61 24, 65 14" stroke="#FDE68A" stroke-width="1.5" stroke-linecap="round" class="loader-steam-b" />
              <path d="M 72 42 C 70 35, 76 29, 73 21" stroke="#34D399" stroke-width="1.4" stroke-linecap="round" class="loader-steam-c" />
            </svg>
          </div>
          <div class="px-3 py-1 rounded-full bg-[#0D1620]/90 border border-mint/35 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-signal-amber open-sign-glow" />
            <span class="font-mono text-[9.5px] font-bold tracking-[0.14em] text-[#E2E8F0] uppercase">
              {{ smeBadges[activeSmeIndex] }} · NUSANTARA
            </span>
          </div>
          <span class="font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink-muted">
            {{ settings.t('LOCAL SHOP CONTEXT', 'KONTEKS USAHA LOKAL') }}
          </span>
        </div>

        <!-- RIGHT WING: NUSANTARA SPATIAL COMPASS & 7-HEX (~500 M) COUNTING RADAR -->
        <div
          class="pointer-events-none flex flex-col items-center gap-2.5 absolute right-8 bottom-[35vh] z-20 w-[184px] loader-wing-float-b"
          aria-hidden="true"
        >
          <div class="relative w-[122px] h-[114px] flex items-center justify-center">
            <div class="absolute inset-2 rounded-full blur-2xl bg-mint/20" />
            <svg viewBox="0 0 128 120" class="w-full h-full overflow-visible" fill="none">
              <circle cx="64" cy="60" r="54" stroke="#10B981" stroke-opacity="0.32" stroke-width="1" stroke-dasharray="3 5" class="loader-spin-cw" />
              <circle cx="64" cy="60" r="46" stroke="#F59E0B" stroke-opacity="0.24" stroke-width="1" stroke-dasharray="2 7" class="loader-spin-ccw" />
              <g transform="translate(64, 60)">
                <g class="loader-radar-sweep">
                  <path d="M 0 0 L 0 -48 A 48 48 0 0 1 41.5 -24 Z" fill="#00E5A8" fill-opacity="0.18" />
                  <line x1="0" y1="0" x2="0" y2="-48" stroke="#00E5A8" stroke-width="1.5" />
                </g>
              </g>
              <polygon
                v-for="(nh, nhi) in neighborRadarHexes"
                :key="`nh-${nhi}`"
                :points="miniHexPoints(nh.cx, nh.cy, 13.5)"
                :fill="progressPct >= nh.at || !isEnter ? nh.fill : '#111824'"
                :fill-opacity="progressPct >= nh.at || !isEnter ? 0.52 : 0.7"
                :stroke="progressPct >= nh.at || !isEnter ? nh.stroke : '#2A3649'"
                stroke-width="1.15"
              />
              <polygon :points="miniHexPoints(64, 60, 14.5)" fill="#0D221D" stroke="#FFFFFF" stroke-width="1.8" />
              <circle cx="64" cy="60" r="3.2" fill="#00E5A8" />
            </svg>
          </div>
          <div class="px-3 py-1 rounded-full bg-[#0D1620]/90 border border-mint/35 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-mint open-sign-glow" />
            <span class="font-mono text-[9.5px] font-bold tracking-[0.14em] text-[#E2E8F0] uppercase">
              {{ settings.t('AREA + 6 NEIGHBORS', 'AREA + 6 TETANGGA') }}
            </span>
          </div>
          <span class="font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink-muted">
            {{ settings.t('~500 M COUNTING RING', 'LINGKARAN HITUNG ~500 M') }}
          </span>
        </div>

        <!-- TOP ORNATE NUSANTARA FILIGREE EYEBROW -->
        <div class="relative z-20 pt-8 px-6 flex justify-center">
          <div class="inline-flex items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[#34D399] whitespace-nowrap">
            <svg
              viewBox="0 0 110 34"
              class="block w-24 h-7 text-[#10B981] drop-shadow-[0_0_12px_rgba(16,185,129,0.62)] shrink-0"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M104 18 C88 18, 78 6, 56 8 C38 9, 26 24, 8 22 C18 28, 36 28, 52 21 C68 14, 84 19, 102 18 Z"
                stroke="currentColor"
                stroke-width="1.25"
                fill="rgba(16, 185, 129, 0.14)"
              />
              <path
                d="M92 17 C76 11, 58 12, 34 20 M70 11 C64 4, 52 4, 42 9 M54 22 C44 29, 30 30, 18 26 M26 19 C22 12, 16 11, 10 15"
                stroke="#00E5A8"
                stroke-width="1.05"
                stroke-linecap="round"
              />
              <circle cx="104" cy="18" r="2" fill="#00E5A8" />
            </svg>

            <span class="inline-flex items-center gap-2">
              <UiKawungIcon :size="14" class="text-[#00E5A8] shrink-0" />
              <span>
                {{
                  isEnter
                    ? settings.t('OPENING THE OPPORTUNITY MAP', 'MEMBUKA PETA PELUANG')
                    : settings.t('RETURNING TO HOMEPAGE', 'KEMBALI KE BERANDA')
                }}
              </span>
            </span>

            <svg
              viewBox="0 0 110 34"
              class="block w-24 h-7 text-[#10B981] drop-shadow-[0_0_12px_rgba(16,185,129,0.62)] shrink-0 -scale-x-100"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M104 18 C88 18, 78 6, 56 8 C38 9, 26 24, 8 22 C18 28, 36 28, 52 21 C68 14, 84 19, 102 18 Z"
                stroke="currentColor"
                stroke-width="1.25"
                fill="rgba(16, 185, 129, 0.14)"
              />
              <path
                d="M92 17 C76 11, 58 12, 34 20 M70 11 C64 4, 52 4, 42 9 M54 22 C44 29, 30 30, 18 26 M26 19 C22 12, 16 11, 10 15"
                stroke="#00E5A8"
                stroke-width="1.05"
                stroke-linecap="round"
              />
              <circle cx="104" cy="18" r="2" fill="#00E5A8" />
            </svg>
          </div>
        </div>

        <!-- CENTER STAGE: CLEAN UPPER-CENTER ZONE WITH ZERO COLLISION AGAINST LOWER ANIMATIONS -->
        <div class="relative z-20 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 pb-[14vh] sm:pb-[17vh]">
          <div class="relative inline-flex flex-col items-stretch w-fit max-w-full">
            <!-- Exact Homepage Pearl-White Sculptural Stepped ASCEND Wordmark -->
            <div class="relative inline-flex items-baseline justify-center pr-6 sm:pr-10">
              <div
                class="pointer-events-none absolute -inset-x-10 -inset-y-4 rounded-full blur-3xl opacity-35"
                style="background: radial-gradient(ellipse 68% 54% at 50% 52%, rgba(0, 229, 168, 0.28), rgba(16, 185, 129, 0.12) 55%, transparent 80%);"
                aria-hidden="true"
              />

              <span
                v-for="item in letters"
                :key="item.char"
                class="font-display font-extrabold leading-[0.86] tracking-[-0.035em] text-[clamp(44px,9.6vw,122px)]"
                :class="isEnter ? 'loader-step-letter' : 'loader-step-letter-fast'"
                :style="{
                  transform: `translateY(${(5 - item.step) * 0.036}em)`,
                  '--letter-delay': `${isEnter ? item.delayMs : 0}ms`,
                }"
              >
                <span class="ascend-2d-glyph" :style="{ '--grad-pos': item.gradPos }">
                  {{ item.char }}
                </span>
              </span>
            </div>

            <!-- LOADING INDICATOR #1: HOMEPAGE TREASURE-HUNT TRAIL LOCKED CLEANLY BELOW ASCEND -> AMBER X -->
            <div class="relative w-full mt-2 sm:mt-3 px-0.5" aria-hidden="true">
              <svg viewBox="0 0 980 116" class="w-full h-auto overflow-visible" fill="none">
                <defs>
                  <linearGradient id="ldr-trail-grad" x1="0%" y1="50%" x2="100%" y2="30%">
                    <stop offset="0%" stop-color="#14B8A6" stop-opacity="0.82" />
                    <stop offset="45%" stop-color="#10B981" />
                    <stop offset="82%" stop-color="#00E5A8" />
                    <stop offset="100%" stop-color="#FBBF24" />
                  </linearGradient>
                  <linearGradient id="ldr-x-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FEF08A" />
                    <stop offset="50%" stop-color="#F59E0B" />
                    <stop offset="100%" stop-color="#D97706" />
                  </linearGradient>
                  <filter id="ldr-mint-glow" x="-40%" y="-80%" width="180%" height="260%">
                    <feGaussianBlur stdDeviation="3.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <mask id="ldr-progress-trail-mask" maskUnits="userSpaceOnUse" x="-10" y="-10" width="1000" height="140">
                    <path
                      :d="TRAIL_PATH"
                      pathLength="1000"
                      stroke="white"
                      stroke-width="26"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-dasharray="1000"
                      :stroke-dashoffset="Math.max(0, 1000 * (1 - progress / 100))"
                    />
                  </mask>
                </defs>

                <path
                  ref="trailPathRef"
                  :d="TRAIL_PATH"
                  stroke="#1E2B3A"
                  stroke-width="2"
                  stroke-dasharray="8 10"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  opacity="0.7"
                />

                <path
                  :d="TRAIL_PATH"
                  stroke="url(#ldr-trail-grad)"
                  stroke-width="5.8"
                  stroke-opacity="0.24"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  mask="url(#ldr-progress-trail-mask)"
                />

                <path
                  :d="TRAIL_PATH"
                  stroke="url(#ldr-trail-grad)"
                  stroke-width="3.2"
                  stroke-dasharray="11 9"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  mask="url(#ldr-progress-trail-mask)"
                  filter="url(#ldr-mint-glow)"
                  class="treasure-dash-march"
                />

                <path
                  d="M 888 34 L 903 40.5 L 890 50"
                  stroke="#00E5A8"
                  stroke-width="2.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :opacity="progressPct >= 92 ? 1 : 0.18"
                />

                <g v-if="trailComet.visible" filter="url(#ldr-mint-glow)">
                  <circle :cx="trailComet.x" :cy="trailComet.y" r="10" fill="rgba(0, 229, 168, 0.34)" />
                  <circle :cx="trailComet.x" :cy="trailComet.y" r="4.2" fill="#FEF08A" stroke="#FFFFFF" stroke-width="1.2" />
                </g>

                <g
                  v-for="wp in TRAIL_WAYPOINTS"
                  :key="wp.id"
                  :transform="`translate(${wp.x}, ${wp.y})`"
                >
                  <circle
                    v-if="progressPct >= wp.at"
                    cx="0"
                    cy="0"
                    r="12"
                    stroke="#00E5A8"
                    stroke-width="1.3"
                    class="loader-wp-sonar"
                  />
                  <polygon
                    points="0,-9.5 8.2,-4.75 8.2,4.75 0,9.5 -8.2,4.75 -8.2,-4.75"
                    :fill="progressPct >= wp.at ? '#071814' : '#0E1520'"
                    :stroke="progressPct >= wp.at ? '#00E5A8' : '#2D3A4C'"
                    stroke-width="1.5"
                  />
                  <circle cx="0" cy="-3.2" r="1.4" :fill="progressPct >= wp.at ? '#34D399' : '#475569'" />
                  <circle cx="0" cy="3.2" r="1.4" :fill="progressPct >= wp.at ? '#34D399' : '#475569'" />
                  <circle cx="-3.2" cy="0" r="1.4" :fill="progressPct >= wp.at ? '#34D399' : '#475569'" />
                  <circle cx="3.2" cy="0" r="1.4" :fill="progressPct >= wp.at ? '#34D399' : '#475569'" />
                </g>

                <g transform="translate(938, 40)">
                  <circle
                    v-if="progressPct >= 95"
                    cx="0"
                    cy="0"
                    r="20"
                    stroke="#FBBF24"
                    stroke-width="1.8"
                    class="loader-x-shockwave"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="24"
                    stroke="#F59E0B"
                    stroke-width="1.1"
                    stroke-dasharray="4 6"
                    :opacity="progressPct >= 92 ? 0.85 : 0.25"
                    class="loader-spin-cw"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="#14110A"
                    :stroke="progressPct >= 94 ? '#FBBF24' : '#78350F'"
                    stroke-width="1.6"
                  />
                  <g :opacity="progressPct >= 92 ? 1 : 0.42">
                    <line x1="-8" y1="-8" x2="8" y2="8" stroke="url(#ldr-x-grad)" stroke-width="3.6" stroke-linecap="round" />
                    <line x1="8" y1="-8" x2="-8" y2="8" stroke="url(#ldr-x-grad)" stroke-width="3.6" stroke-linecap="round" />
                  </g>
                </g>
              </svg>
            </div>
          </div>

          <!-- LOADING INDICATOR #2: TAGLINE + SMOOTH PROGRESS BAR + ROTATING FOUNDER TIP CARD -->
          <div class="relative z-20 mt-2 sm:mt-3 w-full max-w-[468px] text-center">
            <p class="font-sans text-[15px] sm:text-[18px] text-[#E2E8F0] tracking-[-0.01em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              <template v-if="isEnter">
                {{ settings.t('Find where a new shop', 'Temukan tempat usaha baru yang') }}
                <span class="font-editorial italic font-semibold text-mint">
                  {{ settings.t('still has room.', 'masih punya ruang.') }}
                </span>
              </template>
              <template v-else>
                {{ settings.t('Your shortlist stays', 'Daftar pendekmu tetap') }}
                <span class="font-editorial italic font-semibold text-mint">
                  {{ settings.t('safely in this browser.', 'tersimpan aman di browser ini.') }}
                </span>
              </template>
            </p>

            <div class="mt-4 relative w-full h-[6px] rounded-full bg-[#192330] overflow-visible shadow-inner">
              <span class="pointer-events-none absolute top-1/2 -translate-y-1/2 left-1/4 w-1 h-1 rounded-full bg-white/25" aria-hidden="true" />
              <span class="pointer-events-none absolute top-1/2 -translate-y-1/2 left-1/2 w-1 h-1 rounded-full bg-white/25" aria-hidden="true" />
              <span class="pointer-events-none absolute top-1/2 -translate-y-1/2 left-3/4 w-1 h-1 rounded-full bg-white/25" aria-hidden="true" />

              <div
                class="h-full rounded-full bg-gradient-to-r from-[#14B8A6] via-[#10B981] via-75% to-[#FBBF24] shadow-[0_0_18px_rgba(0,229,168,0.75)]"
                :style="{ width: `${progress}%` }"
              />
              <span
                class="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_16px_rgba(0,229,168,0.9)] transition-colors duration-200"
                :class="progressPct >= 92 ? 'bg-[#FBBF24]' : 'bg-[#00E5A8]'"
                :style="{ left: `${progress}%` }"
                aria-hidden="true"
              />
            </div>

            <div class="mt-2.5 flex items-center justify-between gap-3 font-sans text-[12px] sm:text-[13px]">
              <span class="text-[#CBD5E1] truncate">
                {{ statusMessage }}
              </span>
              <span
                class="font-mono font-bold tabular-nums shrink-0 transition-colors duration-200"
                :class="progressPct >= 95 ? 'text-signal-amber' : 'text-mint'"
              >
                {{ progressPct }}%
              </span>
            </div>

            <div class="mt-3.5 min-h-[44px] flex items-center justify-center">
              <Transition
                mode="out-in"
                enter-active-class="transition-all duration-300 ease-signal"
                enter-from-class="opacity-0 translate-y-1.5"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-200 ease-signal"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1.5"
              >
                <div
                  :key="activeTipText"
                  class="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#0D1520]/90 border border-white/10 backdrop-blur-md shadow-lg max-w-full"
                >
                  <UiKawungIcon :size="13" class="text-mint shrink-0" />
                  <span class="font-sans text-[11.5px] sm:text-[12px] leading-snug text-ink-secondary text-left">
                    {{ activeTipText }}
                  </span>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- BOTTOM OPEN DATA ATTRIBUTION STRIP -->
        <div class="relative z-20 pb-4 px-4 text-center">
          <p class="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-muted/75">
            OPENFREEMAP · OPENMAPTILES · © OPENSTREETMAP CONTRIBUTORS · OVERTURE MAPS FOUNDATION · WORLDPOP
          </p>
        </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* GPU-composited Aurora sky drifts */
.ldr-aurora-a {
  will-change: transform;
  animation: ldr-drift-a 12s ease-in-out infinite;
}

.ldr-aurora-b {
  will-change: transform;
  animation: ldr-drift-b 14s ease-in-out infinite;
}

.ldr-aurora-c {
  will-change: transform;
  animation: ldr-drift-c 10s ease-in-out infinite;
}

.loader-step-letter {
  animation: loader-letter-rise 0.44s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--letter-delay, 0ms);
}

.loader-step-letter-fast {
  animation: loader-letter-rise 0.22s ease-out both;
}

/* Concrete GPU-accelerated pillar/spire rise-fall keyframes (zero CSS vars inside transform!) */
.ldr-bob-a {
  will-change: transform;
  animation: ldr-up-18 3.6s ease-in-out infinite;
}

.ldr-bob-b {
  will-change: transform;
  animation: ldr-up-26 4.1s ease-in-out infinite;
}

.ldr-bob-c {
  will-change: transform;
  animation: ldr-up-14 3.4s ease-in-out infinite;
}

.ldr-bob-d {
  will-change: transform;
  animation: ldr-up-22 3.9s ease-in-out infinite;
}

.ldr-horizon-sonar {
  transform-box: fill-box;
  transform-origin: center;
  animation: ldr-sonar-expand 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.ldr-route-stream {
  animation: ldr-route-march 3.4s linear infinite;
}

.ldr-wave-glide-a {
  will-change: transform;
  animation: ldr-wave-sway-a 6.4s ease-in-out infinite;
}

.ldr-wave-glide-b {
  will-change: transform;
  animation: ldr-wave-sway-b 7.8s ease-in-out infinite;
}

.loader-wing-float-a {
  will-change: transform;
  animation: loader-wing-bob 4.8s ease-in-out infinite;
}

.loader-wing-float-b {
  will-change: transform;
  animation: loader-wing-bob 5.4s ease-in-out infinite;
  animation-delay: -2.2s;
}

.loader-steam-a {
  animation: loader-steam-curl 2.8s ease-in-out infinite;
}

.loader-steam-b {
  animation: loader-steam-curl 3.3s ease-in-out infinite;
  animation-delay: -1.1s;
}

.loader-steam-c {
  animation: loader-steam-curl 3.0s ease-in-out infinite;
  animation-delay: -2.0s;
}

.loader-spin-cw {
  transform-box: fill-box;
  transform-origin: center;
  animation: loader-rot-cw 22s linear infinite;
}

.loader-spin-ccw {
  transform-box: fill-box;
  transform-origin: center;
  animation: loader-rot-ccw 30s linear infinite;
}

.loader-radar-sweep {
  transform-origin: 0px 0px;
  animation: loader-rot-cw 3.4s linear infinite;
}

.loader-wp-sonar {
  transform-box: fill-box;
  transform-origin: center;
  animation: loader-sonar-pop 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.loader-x-shockwave {
  transform-box: fill-box;
  transform-origin: center;
  animation: loader-sonar-pop 1.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.loader-twinkle {
  animation: loader-star-blink var(--tw-dur, 3.6s) ease-in-out infinite;
  animation-delay: var(--tw-delay, 0s);
}

.loader-flare {
  transform-box: fill-box;
  transform-origin: center;
  animation: loader-flare-pop var(--tw-dur, 4.2s) ease-in-out infinite;
  animation-delay: var(--tw-delay, 0s);
}

.loader-shoot-a {
  opacity: 0;
  animation: loader-shoot 7.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
}

.loader-shoot-b {
  opacity: 0;
  animation: loader-shoot 9.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
  animation-delay: -3.1s;
}

.loader-firefly {
  animation: loader-ff-rise 5.8s ease-in-out infinite;
}

@keyframes ldr-drift-a {
  0%, 100% { transform: translate3d(0px, 0px, 0) scale(1); }
  50% { transform: translate3d(48px, 18px, 0) scale(1.08); }
}

@keyframes ldr-drift-b {
  0%, 100% { transform: translate3d(0px, 0px, 0) scale(1); }
  50% { transform: translate3d(-44px, 22px, 0) scale(1.06); }
}

@keyframes ldr-drift-c {
  0%, 100% { transform: translate3d(-50%, 0px, 0) scale(0.98); }
  50% { transform: translate3d(-50%, -14px, 0) scale(1.08); }
}

@keyframes loader-letter-rise {
  from { opacity: 0; filter: blur(4px); }
  to { opacity: 1; filter: blur(0); }
}

@keyframes ldr-up-18 {
  0%, 100% { transform: translate3d(0, 0px, 0); }
  50% { transform: translate3d(0, -18px, 0); }
}

@keyframes ldr-up-26 {
  0%, 100% { transform: translate3d(0, 0px, 0); }
  50% { transform: translate3d(0, -26px, 0); }
}

@keyframes ldr-up-14 {
  0%, 100% { transform: translate3d(0, 0px, 0); }
  50% { transform: translate3d(0, -14px, 0); }
}

@keyframes ldr-up-22 {
  0%, 100% { transform: translate3d(0, 0px, 0); }
  50% { transform: translate3d(0, -22px, 0); }
}

@keyframes ldr-sonar-expand {
  0% { opacity: 0.72; transform: scale(0.62); }
  100% { opacity: 0; transform: scale(2.45); }
}

@keyframes ldr-route-march {
  0% { stroke-dashoffset: 308; }
  100% { stroke-dashoffset: 0; }
}

@keyframes ldr-wave-sway-a {
  0%, 100% { transform: translate3d(-24px, 0px, 0); }
  50% { transform: translate3d(24px, -10px, 0); }
}

@keyframes ldr-wave-sway-b {
  0%, 100% { transform: translate3d(22px, 4px, 0); }
  50% { transform: translate3d(-22px, -8px, 0); }
}

@keyframes loader-wing-bob {
  0%, 100% { transform: translate3d(0, 0px, 0); }
  50% { transform: translate3d(0, -8px, 0); }
}

@keyframes loader-steam-curl {
  0% { transform: translate3d(0, 4px, 0); opacity: 0; }
  42% { opacity: 0.92; }
  100% { transform: translate3d(0, -10px, 0); opacity: 0; }
}

@keyframes loader-rot-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes loader-rot-ccw {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes loader-sonar-pop {
  0% { opacity: 0.85; transform: scale(0.75); }
  100% { opacity: 0; transform: scale(2.1); }
}

@keyframes loader-star-blink {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.95; }
}

@keyframes loader-flare-pop {
  0%, 100% { opacity: 0.35; transform: scale(0.72); }
  50% { opacity: 1; transform: scale(1.18); }
}

@keyframes loader-shoot {
  0%, 66% { opacity: 0; transform: translate3d(-110px, -55px, 0); }
  72% { opacity: 0.95; }
  84% { opacity: 0; transform: translate3d(190px, 95px, 0); }
  100% { opacity: 0; transform: translate3d(190px, 95px, 0); }
}

@keyframes loader-ff-rise {
  0% { transform: translate3d(0, 12px, 0); opacity: 0; }
  25% { opacity: 0.88; }
  68% { transform: translate3d(7px, -32px, 0); opacity: 0.7; }
  100% { transform: translate3d(-5px, -68px, 0); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ldr-aurora-a,
  .ldr-aurora-b,
  .ldr-aurora-c,
  .loader-step-letter,
  .loader-step-letter-fast,
  .ldr-bob-a,
  .ldr-bob-b,
  .ldr-bob-c,
  .ldr-bob-d,
  .ldr-horizon-sonar,
  .ldr-route-stream,
  .ldr-wave-glide-a,
  .ldr-wave-glide-b,
  .loader-wing-float-a,
  .loader-wing-float-b,
  .loader-steam-a,
  .loader-steam-b,
  .loader-steam-c,
  .loader-spin-cw,
  .loader-spin-ccw,
  .loader-radar-sweep,
  .loader-wp-sonar,
  .loader-x-shockwave,
  .loader-twinkle,
  .loader-flare,
  .loader-shoot-a,
  .loader-shoot-b,
  .loader-firefly {
    animation: none !important;
  }
}
</style>
