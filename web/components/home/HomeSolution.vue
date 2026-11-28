<script setup lang="ts">
import { AlertTriangle, ChevronsUp, CircleDot, Equal, RefreshCw } from 'lucide-vue-next'
import type { AreaLabel, Meta } from '~/types/areas'
import { LABEL_META } from '~/utils/uiCopy'

const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

type FilterKey = 'all' | 'opportunity' | 'fair' | 'crowded' | 'not_enough_demand' | 'low_confidence'

interface AutoStep {
  mode: 'seen' | 'counted'
  filter: FilterKey
  focusCell: string
  durationMs: number
}

const props = defineProps<{
  meta: Meta | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()

interface ClusterCell {
  id: string
  q: number
  r: number
  ring: 0 | 1 | 2
  label?: AreaLabel
  lowConfidence?: boolean
  note: string
}

const clusterCells: ClusterCell[] = [
  { id: 'c-0', q: 0, r: 0, ring: 0, label: 'opportunity', note: 'Center area: room for a new coffee shop within about 500 m.' },
  { id: 'n-1', q: 1, r: -1, ring: 1, label: 'opportunity', note: 'Northeast neighbor: strong campus and residential support.' },
  { id: 'n-2', q: 1, r: 0, ring: 1, label: 'fair', note: 'East neighbor: shop count sits close to expected local demand.' },
  { id: 'n-3', q: 0, r: 1, ring: 1, label: 'fair', note: 'Southeast neighbor: balanced neighborhood supply.' },
  { id: 'n-4', q: -1, r: 1, ring: 1, label: 'crowded', note: 'Southwest neighbor: main corridor already packed with shops.' },
  { id: 'n-5', q: -1, r: 0, ring: 1, label: 'opportunity', note: 'West neighbor: high resident density with few rivals.' },
  { id: 'n-6', q: 0, r: -1, ring: 1, label: 'crowded', note: 'Northwest neighbor: heavy clustering of coffee shops.' },
  { id: 'o-1', q: 2, r: -2, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
  { id: 'o-2', q: 2, r: -1, ring: 2, label: 'not_enough_demand', note: 'Not enough demand: resident and daily activity too thin.' },
  { id: 'o-3', q: 2, r: 0, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
  { id: 'o-4', q: 1, r: 1, ring: 2, lowConfidence: true, note: 'Low confidence: open map data may miss informal stalls here.' },
  { id: 'o-5', q: 0, r: 2, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
  { id: 'o-6', q: -1, r: 2, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
  { id: 'o-7', q: -2, r: 2, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
  { id: 'o-8', q: -2, r: 1, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
  { id: 'o-9', q: -2, r: 0, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
  { id: 'o-10', q: -1, r: -1, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
  { id: 'o-11', q: 0, r: -2, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
  { id: 'o-12', q: 1, r: -2, ring: 2, note: 'Outer context cell: beyond the 500 m walking neighborhood.' },
]

const autoSteps: AutoStep[] = [
  { mode: 'seen', filter: 'all', focusCell: 'c-0', durationMs: 4200 },
  { mode: 'counted', filter: 'all', focusCell: 'c-0', durationMs: 5400 },
  { mode: 'counted', filter: 'opportunity', focusCell: 'c-0', durationMs: 4800 },
  { mode: 'counted', filter: 'fair', focusCell: 'n-2', durationMs: 4800 },
  { mode: 'counted', filter: 'crowded', focusCell: 'n-4', durationMs: 4800 },
  { mode: 'counted', filter: 'not_enough_demand', focusCell: 'o-2', durationMs: 4800 },
  { mode: 'counted', filter: 'low_confidence', focusCell: 'o-4', durationMs: 4800 },
]

const sectionRef = ref<HTMLElement | null>(null)
const viewMode = ref<'seen' | 'counted'>('seen')
const activeFilter = ref<FilterKey>('all')
const inspectedCellId = ref<string>('c-0')
const stepIndex = ref<number>(0)
const cycleKey = ref<number>(0)
const isInView = ref<boolean>(false)
const reducedMotion = ref<boolean>(false)

let cycleTimer: ReturnType<typeof setTimeout> | null = null
let viewObserver: IntersectionObserver | null = null

const isAutoRunning = computed(() => !reducedMotion.value && isInView.value)
const currentStepDurationMs = computed(() => autoSteps[stepIndex.value]?.durationMs ?? 4800)

const inspectedCell = computed(() =>
  clusterCells.find(c => c.id === inspectedCellId.value) ?? clusterCells[0]!,
)

const HEX_R = 30
function hexCenter(q: number, r: number): { x: number; y: number } {
  const x = 216 + HEX_R * Math.sqrt(3) * (q + r / 2)
  const y = 175 + HEX_R * 1.5 * r
  return { x, y }
}

function hexPolygon(cx: number, cy: number, radius = HEX_R - 2): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`)
  }
  return pts.join(' ')
}

function cellMatchesFilter(cell: ClusterCell): boolean {
  if (viewMode.value === 'seen') return false
  if (activeFilter.value === 'all') return true
  if (activeFilter.value === 'low_confidence') return Boolean(cell.lowConfidence)
  return cell.label === activeFilter.value
}

function isCellSpotlit(cell: ClusterCell): boolean {
  if (viewMode.value === 'seen') return false
  if (activeFilter.value === 'all') return cell.id === inspectedCellId.value
  return cellMatchesFilter(cell)
}

function cellFill(cell: ClusterCell): string {
  if (viewMode.value === 'seen') return 'rgba(22, 26, 33, 0.28)'
  if (cell.lowConfidence) return 'rgba(148, 163, 184, 0.2)'
  if (!cell.label) return 'rgba(18, 24, 33, 0.5)'
  if (cell.label === 'not_enough_demand') return 'url(#solution-dots-grey)'
  return LABEL_META[cell.label].color
}

function cellFillOpacity(cell: ClusterCell): number {
  if (viewMode.value === 'seen') return 0.3
  if (activeFilter.value !== 'all' && !cellMatchesFilter(cell)) {
    return cell.label ? 0.16 : 0.24
  }
  if (cell.lowConfidence) return activeFilter.value === 'low_confidence' ? 0.78 : 0.5
  if (!cell.label) return 0.48
  return cell.ring === 0 || isCellSpotlit(cell) ? 0.94 : 0.78
}

function cellStroke(cell: ClusterCell): string {
  if (viewMode.value === 'seen') return '#232C3A'
  if (activeFilter.value !== 'all' && !cellMatchesFilter(cell)) {
    return '#222A38'
  }
  if (cell.id === inspectedCellId.value) return '#F8FAFC'
  if (cell.lowConfidence) return activeFilter.value === 'low_confidence' ? '#E2E8F0' : '#94A3B8'
  if (cell.ring === 0) return '#F8FAFC'
  if (cell.ring === 1) return '#94A3B8'
  return '#232836'
}

const activeAccentColor = computed(() => {
  if (viewMode.value === 'seen') return '#94A3B8'
  switch (activeFilter.value) {
    case 'fair':
      return '#F59E0B'
    case 'crowded':
      return '#EF4444'
    case 'not_enough_demand':
    case 'low_confidence':
      return '#94A3B8'
    default:
      return '#10B981'
  }
})

const calloutMeta = computed(() => {
  if (viewMode.value === 'seen') {
    return {
      eyebrow: 'RAW STREET VIEW',
      title: 'Busy curbs without counts',
      body: HOME_COPY.value.solution.seenCaption,
    }
  }
  if (activeFilter.value === 'opportunity') {
    return {
      eyebrow: 'FILTER · OPPORTUNITY',
      title: '3 areas with open room',
      body: inspectedCell.value.note,
    }
  }
  if (activeFilter.value === 'fair') {
    return {
      eyebrow: 'FILTER · FAIR',
      title: '2 balanced neighborhoods',
      body: inspectedCell.value.note,
    }
  }
  if (activeFilter.value === 'crowded') {
    return {
      eyebrow: 'FILTER · CROWDED',
      title: '2 crowded corridors',
      body: inspectedCell.value.note,
    }
  }
  if (activeFilter.value === 'not_enough_demand') {
    return {
      eyebrow: 'FILTER · LOW DEMAND',
      title: 'Thin daily demand',
      body: inspectedCell.value.note,
    }
  }
  if (activeFilter.value === 'low_confidence') {
    return {
      eyebrow: 'FILTER · LOW CONFIDENCE',
      title: 'Sparse open map data',
      body: inspectedCell.value.note,
    }
  }
  return {
    eyebrow: 'COUNTING SCOPE',
    title: HOME_COPY.value.solution.callout,
    body: inspectedCell.value.note,
  }
})

// Dynamic SVG pointer line connecting the spotlighted hexagon directly to the right frosted glass card
const leaderPoints = computed(() => {
  const c = hexCenter(inspectedCell.value.q, inspectedCell.value.r)
  const startX = c.x + 14
  const startY = c.y - 6
  const elbowX = Math.max(startX + 34, 342)
  const elbowY = 128
  return {
    startX,
    startY,
    polyline: `${startX.toFixed(1)},${startY.toFixed(1)} ${elbowX.toFixed(1)},${elbowY} 374,${elbowY}`,
  }
})

function applyAutoStep(idx: number) {
  const step = autoSteps[idx % autoSteps.length]!
  stepIndex.value = idx % autoSteps.length
  viewMode.value = step.mode
  activeFilter.value = step.filter
  inspectedCellId.value = step.focusCell
  cycleKey.value += 1
}

function clearCycleTimer() {
  if (cycleTimer) {
    clearTimeout(cycleTimer)
    cycleTimer = null
  }
}

function scheduleNextStep() {
  clearCycleTimer()
  if (!isAutoRunning.value) return
  const waitMs = autoSteps[stepIndex.value]?.durationMs ?? 4800
  cycleTimer = setTimeout(() => {
    applyAutoStep((stepIndex.value + 1) % autoSteps.length)
    scheduleNextStep()
  }, waitMs)
}

function startCycleTimer() {
  clearCycleTimer()
  if (!isAutoRunning.value) return
  cycleKey.value += 1
  scheduleNextStep()
}

function setModeManual(mode: 'seen' | 'counted') {
  viewMode.value = mode
  if (mode === 'seen') {
    activeFilter.value = 'all'
    inspectedCellId.value = 'c-0'
    stepIndex.value = 0
  } else {
    activeFilter.value = 'all'
    inspectedCellId.value = 'c-0'
    stepIndex.value = 1
  }
  cycleKey.value += 1
  if (isAutoRunning.value) scheduleNextStep()
}

function selectFilterManual(filter: FilterKey) {
  viewMode.value = 'counted'
  activeFilter.value = activeFilter.value === filter && filter !== 'all' ? 'all' : filter
  const matchedIdx = autoSteps.findIndex(s => s.mode === 'counted' && s.filter === activeFilter.value)
  if (matchedIdx >= 0) {
    stepIndex.value = matchedIdx
    inspectedCellId.value = autoSteps[matchedIdx]!.focusCell
  }
  cycleKey.value += 1
  if (isAutoRunning.value) scheduleNextStep()
}

function handleCellInspect(cell: ClusterCell) {
  inspectedCellId.value = cell.id
  if (viewMode.value === 'seen') {
    viewMode.value = 'counted'
    stepIndex.value = 1
  }
  cycleKey.value += 1
  if (isAutoRunning.value) scheduleNextStep()
}

watch(isAutoRunning, (running) => {
  if (running) startCycleTimer()
  else clearCycleTimer()
})

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion.value) {
    applyAutoStep(1)
    return
  }
  applyAutoStep(0)

  if (sectionRef.value && 'IntersectionObserver' in window) {
    viewObserver = new IntersectionObserver(
      (entries) => {
        isInView.value = Boolean(entries[0]?.isIntersecting)
      },
      { threshold: 0.16 },
    )
    viewObserver.observe(sectionRef.value)
  } else {
    isInView.value = true
  }
})

onBeforeUnmount(() => {
  clearCycleTimer()
  viewObserver?.disconnect()
})

const summaryStats = computed(() => {
  if (!props.meta) return null
  const c = props.meta.label_counts
  return [
    { key: 'opportunity' as AreaLabel, count: c.opportunity, label: 'Opportunity', color: '#10B981' },
    { key: 'fair' as AreaLabel, count: c.fair, label: 'Fair', color: '#F59E0B' },
    { key: 'crowded' as AreaLabel, count: c.crowded, label: 'Crowded', color: '#EF4444' },
    { key: 'not_enough_demand' as AreaLabel, count: c.not_enough_demand, label: 'Low demand', color: '#64748B' },
  ]
})
</script>

<template>
  <section
    id="solusi"
    ref="sectionRef"
    class="relative z-20 motion-safe:-mt-[24vh] sm:motion-safe:-mt-[28vh] motion-safe:pt-[22vh] sm:motion-safe:pt-[24vh] motion-reduce:mt-0 motion-reduce:pt-16 pb-20 sm:pb-24"
    style="background: linear-gradient(180deg, rgba(15, 17, 21, 0) 0%, rgba(15, 17, 21, 0) 26%, rgba(15, 17, 21, 0.85) 48%, #0F1115 62%, #0F1115 100%);"
  >
    <div class="mx-auto max-w-frame px-5 sm:px-8">
      <div class="grid grid-cols-12 gap-8 items-start">
        <!-- Left 4 cols -->
        <div v-reveal="{ variant: 'up' }" class="col-span-4 sticky top-28">
          <div class="border-l-2 border-mint pl-5">
            <p class="font-mono text-[11px] uppercase tracking-[0.16em] text-mint mb-3">
              {{ HOME_COPY.solution.eyebrow }}
            </p>
            <h2 class="font-display font-extrabold text-ink-primary text-[54px] leading-[1.03] tracking-[-0.03em]">
              {{ HOME_COPY.solution.headlinePrefix }}
              <span class="editorial-mint block mt-1 text-[1.06em]">
                {{ HOME_COPY.solution.headlineAccent }}
              </span>
            </h2>
            <div class="mt-5 w-16 h-[2px] bg-gradient-to-r from-mint-teal to-mint" />
          </div>

          <p class="mt-6 font-sans text-[15.5px] leading-[1.68] text-ink-secondary">
            {{ HOME_COPY.solution.lead }}
          </p>

          <!-- Live summary from meta.json (Matching subtle smoked-glass surface) -->
          <div class="mt-7 p-4 rounded-2xl bg-[#131922]/75 backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                LIVE OPEN DATASET BREAKDOWN
              </span>
              <span
                v-if="meta?.is_sample"
                class="px-2 py-0.5 rounded bg-signal-amber/15 border border-signal-amber/40 font-mono text-[9px] text-signal-amber uppercase"
              >
                Sample data
              </span>
            </div>

            <div v-if="loading" class="grid grid-cols-2 gap-2.5" aria-busy="true">
              <div v-for="n in 4" :key="n" class="p-2.5 rounded-lg bg-abyss border border-[#232836]">
                <div class="h-2.5 w-14 rounded skeleton-bar mb-2" />
                <div class="h-5 w-10 rounded skeleton-bar" />
              </div>
            </div>

            <div v-else-if="error" class="p-3 rounded-lg bg-abyss border border-signal-coral/40 flex items-center justify-between gap-3">
              <span class="font-sans text-[12px] text-ink-secondary">
                Failed to load dataset counts.
              </span>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-elevated border border-borderStrong font-mono text-[10px] text-ink-primary hover:border-mint transition-colors"
                @click="emit('retry')"
              >
                <RefreshCw class="w-3 h-3" />
                Retry
              </button>
            </div>

            <div v-else-if="summaryStats" class="grid grid-cols-2 gap-2.5">
              <button
                v-for="stat in summaryStats"
                :key="stat.key"
                type="button"
                class="p-2.5 rounded-xl bg-[#0A0E14]/75 border transition-all duration-fast flex items-center justify-between cursor-pointer text-left"
                :class="
                  viewMode === 'counted' && activeFilter === stat.key
                    ? 'border-white/30 bg-[#121C24]'
                    : 'border-white/[0.07] hover:border-white/20'
                "
                @click="selectFilterManual(stat.key)"
              >
                <span class="flex items-center gap-1.5 font-sans text-[12px] text-ink-secondary">
                  <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: stat.color }" />
                  {{ stat.label }}
                </span>
                <span class="font-mono text-[13px] font-bold text-ink-primary tabular-nums">
                  {{ stat.count.toLocaleString('en-US') }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right 8 cols: Frosted Smoked-Glass Interactive Showcase Card -->
        <div
          v-reveal="{ variant: 'scale', delay: 110 }"
          class="col-span-8 relative"
        >
          <!-- Ambient Backlight Orbs Behind the Frosted Glass (gives true optical refraction depth) -->
          <div
            class="pointer-events-none absolute -top-10 -right-8 w-72 h-72 rounded-full blur-3xl sol-orb-breathe transition-colors duration-700"
            :style="{
              background: `radial-gradient(circle, ${activeAccentColor}33 0%, transparent 72%)`,
            }"
            aria-hidden="true"
          />
          <div
            class="pointer-events-none absolute -bottom-10 -left-8 w-64 h-64 rounded-full blur-3xl opacity-55"
            style="background: radial-gradient(circle, rgba(20, 184, 166, 0.22) 0%, transparent 74%);"
            aria-hidden="true"
          />

          <div
            class="solution-glass-card"
            :style="{ '--sol-step-ms': `${currentStepDurationMs}ms` }"
          >
            <!-- Glass diagonal top specular reflection -->
            <div class="solution-glass-reflection" aria-hidden="true" />

            <div class="relative z-10 p-5 sm:p-7">
              <!-- Card Top Header: Title + Auto-Cycling Mode Indicator -->
              <div class="flex flex-row items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div>
                  <h3 class="font-editorial font-semibold text-ink-primary text-[21px] sm:text-[23px] leading-snug">
                    {{ HOME_COPY.solution.cardTitle }}
                  </h3>
                </div>

                <div class="flex items-center self-start sm:self-auto shrink-0">
                  <div
                    class="inline-flex items-center p-1 rounded-full bg-[#090D13]/80 border border-white/10 backdrop-blur-md"
                    role="tablist"
                    aria-label="Map view mode"
                  >
                    <button
                      type="button"
                      role="tab"
                      :aria-selected="viewMode === 'seen'"
                      class="relative overflow-hidden px-3.5 py-1.5 rounded-full font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.08em] transition-all duration-fast ease-signal cursor-pointer"
                      :class="
                        viewMode === 'seen'
                          ? 'bg-white/15 text-ink-primary border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'text-ink-muted hover:text-ink-secondary'
                      "
                      @click="setModeManual('seen')"
                    >
                      <span>{{ HOME_COPY.solution.tabSeen }}</span>
                      <span
                        v-if="viewMode === 'seen' && isAutoRunning"
                        :key="`seen-${cycleKey}`"
                        class="sol-filter-progress absolute inset-x-2 bottom-0.5 h-[2px] rounded-full bg-white/75"
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      role="tab"
                      :aria-selected="viewMode === 'counted'"
                      class="px-3.5 py-1.5 rounded-full font-mono text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.08em] transition-all duration-fast ease-signal cursor-pointer"
                      :class="
                        viewMode === 'counted'
                          ? 'bg-mint text-ink-dark shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                          : 'text-ink-muted hover:text-ink-secondary'
                      "
                      @click="setModeManual('counted')"
                    >
                      {{ HOME_COPY.solution.tabCounted }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 19-Cell Hex Cluster Interactive Frosted-Glass Stage -->
              <div class="mt-5 relative rounded-2xl solution-glass-well overflow-hidden">
                <div class="absolute inset-0 bg-tenun-lattice opacity-85 pointer-events-none" aria-hidden="true" />

                <!-- Subtle live geospatial radar sweep across hex field -->
                <div
                  v-if="viewMode === 'counted' && !reducedMotion"
                  class="pointer-events-none absolute inset-y-0 left-0 w-44 sol-scan-beam"
                  style="background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.09) 50%, transparent 100%);"
                  aria-hidden="true"
                />

                <div class="relative">
                  <svg
                    viewBox="0 0 600 350"
                    class="w-full h-[355px] relative z-10"
                    fill="none"
                    role="img"
                    aria-label="Nineteen-cell animated hexagon cluster cycling through Ascend area filters"
                  >
                    <defs>
                      <pattern id="solution-dots-grey" width="6" height="6" patternUnits="userSpaceOnUse">
                        <rect width="6" height="6" fill="#475569" />
                        <circle cx="2" cy="2" r="1.15" fill="#E2E8F0" fill-opacity="0.72" />
                        <circle cx="5" cy="5" r="1.15" fill="#E2E8F0" fill-opacity="0.72" />
                      </pattern>
                      <filter id="center-mint-glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <!-- Subtle street grid & rotating 500 m scope rings -->
                    <g stroke="#243040" stroke-width="1.15">
                      <path d="M 10 290 L 160 212 L 320 162 L 590 78" />
                      <path d="M 20 82 L 195 154 L 395 220 L 580 278" />
                      <path d="M 132 10 L 200 170 L 266 340" />
                      <path d="M 366 10 L 306 168 L 236 340" />
                      <circle cx="216" cy="175" r="142" stroke="#34404F" stroke-opacity="0.32" stroke-dasharray="3 5" />
                      <circle
                        cx="216"
                        cy="175"
                        r="96"
                        :stroke="activeAccentColor"
                        :stroke-opacity="viewMode === 'counted' ? 0.36 : 0.08"
                        stroke-dasharray="4 5"
                        class="transition-all duration-500 animate-dash-flow-slow"
                      />
                    </g>

                    <!-- Generic street pins shown in "WHAT YOU SEE" mode -->
                    <g v-if="viewMode === 'seen'" class="transition-opacity duration-mid ease-signal">
                      <g v-for="(pt, pi) in [[164, 134], [216, 175], [271, 198], [192, 224], [248, 132]]" :key="pi">
                        <circle :cx="pt[0]" :cy="pt[1]" r="15" stroke="#94A3B8" stroke-opacity="0.24" stroke-width="1" class="sol-hex-halo" />
                        <circle :cx="pt[0]" :cy="pt[1]" r="10" fill="#18212E" stroke="#475569" stroke-width="1.2" />
                        <circle :cx="pt[0]" :cy="pt[1]" r="3" fill="#CBD5E1" />
                      </g>
                    </g>

                    <!-- 19-Cell Interactive & Auto-Animated Hex Cluster -->
                    <g>
                      <g
                        v-for="cell in clusterCells"
                        :key="cell.id"
                        class="cursor-pointer transition-all duration-500 ease-signal"
                        @mouseenter="handleCellInspect(cell)"
                        @click="handleCellInspect(cell)"
                      >
                        <!-- Pulsing outer spotlight halo for matching filtered cells or center cell -->
                        <polygon
                          v-if="viewMode === 'counted' && isCellSpotlit(cell)"
                          :points="hexPolygon(hexCenter(cell.q, cell.r).x, hexCenter(cell.q, cell.r).y, HEX_R + 2.5)"
                          fill="none"
                          :stroke="cell.lowConfidence ? '#E2E8F0' : cell.label ? LABEL_META[cell.label].color : '#10B981'"
                          stroke-width="2.4"
                          filter="url(#center-mint-glow)"
                          class="sol-hex-halo"
                        />

                        <polygon
                          :points="hexPolygon(hexCenter(cell.q, cell.r).x, hexCenter(cell.q, cell.r).y)"
                          :fill="cellFill(cell)"
                          :fill-opacity="cellFillOpacity(cell)"
                          :stroke="cellStroke(cell)"
                          :stroke-width="isCellSpotlit(cell) ? 2.6 : cell.ring === 1 && viewMode === 'counted' ? 1.2 : 1"
                          :stroke-dasharray="cell.lowConfidence && viewMode === 'counted' ? '4 3' : undefined"
                          stroke-linejoin="round"
                          class="transition-all duration-500"
                        />

                        <g
                          v-if="viewMode === 'counted' && cell.label"
                          class="pointer-events-none transition-opacity duration-500"
                          :style="{ opacity: activeFilter === 'all' || cellMatchesFilter(cell) ? 1 : 0.25 }"
                        >
                          <g v-if="cell.label === 'opportunity'" fill="none" stroke="#090D11" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
                            <path :d="`M ${hexCenter(cell.q, cell.r).x - 5} ${hexCenter(cell.q, cell.r).y} L ${hexCenter(cell.q, cell.r).x} ${hexCenter(cell.q, cell.r).y - 4.5} L ${hexCenter(cell.q, cell.r).x + 5} ${hexCenter(cell.q, cell.r).y}`" />
                            <path :d="`M ${hexCenter(cell.q, cell.r).x - 5} ${hexCenter(cell.q, cell.r).y + 4.5} L ${hexCenter(cell.q, cell.r).x} ${hexCenter(cell.q, cell.r).y} L ${hexCenter(cell.q, cell.r).x + 5} ${hexCenter(cell.q, cell.r).y + 4.5}`" />
                          </g>
                          <g v-else-if="cell.label === 'fair'" stroke="#090D11" stroke-width="1.7" stroke-linecap="round">
                            <line :x1="hexCenter(cell.q, cell.r).x - 5.5" :y1="hexCenter(cell.q, cell.r).y - 2.2" :x2="hexCenter(cell.q, cell.r).x + 5.5" :y2="hexCenter(cell.q, cell.r).y - 2.2" />
                            <line :x1="hexCenter(cell.q, cell.r).x - 5.5" :y1="hexCenter(cell.q, cell.r).y + 2.2" :x2="hexCenter(cell.q, cell.r).x + 5.5" :y2="hexCenter(cell.q, cell.r).y + 2.2" />
                          </g>
                          <g v-else-if="cell.label === 'crowded'" fill="none" stroke="#090D11" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <polygon :points="`${hexCenter(cell.q, cell.r).x},${hexCenter(cell.q, cell.r).y - 5.5} ${hexCenter(cell.q, cell.r).x + 6},${hexCenter(cell.q, cell.r).y + 4.5} ${hexCenter(cell.q, cell.r).x - 6},${hexCenter(cell.q, cell.r).y + 4.5}`" />
                            <line :x1="hexCenter(cell.q, cell.r).x" :y1="hexCenter(cell.q, cell.r).y - 2" :x2="hexCenter(cell.q, cell.r).x" :y2="hexCenter(cell.q, cell.r).y + 1.5" />
                          </g>
                        </g>
                      </g>
                    </g>

                    <!-- Dynamic animated leader line pointing from spotlighted hexagon to right frosted glass card -->
                    <g class="inline transition-all duration-500">
                      <polyline
                        :points="leaderPoints.polyline"
                        :stroke="activeAccentColor"
                        stroke-width="1.35"
                        stroke-opacity="0.85"
                        fill="none"
                      />
                      <circle
                        :cx="leaderPoints.startX"
                        :cy="leaderPoints.startY"
                        r="3.5"
                        fill="#F8FAFC"
                        :stroke="activeAccentColor"
                        stroke-width="1.8"
                      />
                    </g>
                  </svg>

                  <!-- Floating Frosted Glass Callout Card (Right side of hex cluster) -->
                  <div
                    class="block absolute top-[21%] right-6 z-20 w-[236px] rounded-xl p-3.5 solution-glass-callout transition-all duration-500"
                    :style="{ borderColor: `${activeAccentColor}55` }"
                  >
                    <div class="flex items-center gap-2 mb-1.5">
                      <span
                        class="w-2 h-2 rounded-full shrink-0 transition-colors duration-500"
                        :style="{ backgroundColor: activeAccentColor, boxShadow: `0 0 10px ${activeAccentColor}` }"
                        aria-hidden="true"
                      />
                      <span
                        class="font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] transition-colors duration-500"
                        :style="{ color: activeAccentColor }"
                      >
                        {{ calloutMeta.eyebrow }}
                      </span>
                    </div>
                    <p class="font-sans text-[12.5px] font-semibold text-ink-primary leading-snug">
                      {{ calloutMeta.title }}
                    </p>
                    <p class="mt-1.5 font-sans text-[11px] text-ink-secondary leading-relaxed">
                      {{ calloutMeta.body }}
                    </p>
                  </div>
                </div>

                <!-- Bottom Frosted Glass Inspection Strip (always crisp on both desktop & mobile) -->
                <div class="px-4 py-2.5 bg-[#0C1219]/80 backdrop-blur-md border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-500"
                      :style="{ backgroundColor: activeAccentColor }"
                      aria-hidden="true"
                    />
                    <span class="font-sans text-[12px] sm:text-[12.5px] text-ink-secondary">
                      {{ viewMode === 'seen' ? HOME_COPY.solution.seenCaption : inspectedCell.note }}
                    </span>
                  </div>
                  <span class="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted shrink-0">
                    Click any filter or cell
                  </span>
                </div>
              </div>

              <!-- Auto-Cycling Interactive Frosted-Glass Filter Pills (All + 5 Official Labels) -->
              <div class="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2" role="group" aria-label="Filter hexagon area labels">
                <!-- "All areas" pill -->
                <button
                  type="button"
                  class="relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-[10.5px] uppercase tracking-[0.08em] transition-all duration-fast cursor-pointer"
                  :class="
                    viewMode === 'counted' && activeFilter === 'all'
                      ? 'bg-mint/15 border-mint/55 text-mint font-bold shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                      : 'bg-white/[0.03] border-white/10 text-ink-secondary hover:bg-white/[0.07] hover:border-white/20'
                  "
                  :aria-pressed="viewMode === 'counted' && activeFilter === 'all'"
                  @click="selectFilterManual('all')"
                >
                  <span>All</span>
                  <span
                    v-if="viewMode === 'counted' && activeFilter === 'all' && isAutoRunning"
                    :key="`all-${cycleKey}`"
                    class="sol-filter-progress absolute inset-x-0 bottom-0 h-[2px] bg-mint"
                    aria-hidden="true"
                  />
                </button>

                <!-- 5 Semantic Filter Pills -->
                <button
                  v-for="entry in HOME_COPY.solution.legend"
                  :key="entry.key"
                  type="button"
                  class="relative overflow-hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-sans transition-all duration-fast cursor-pointer"
                  :class="
                    viewMode === 'counted' && activeFilter === entry.type
                      ? 'bg-white/[0.1] text-ink-primary font-semibold'
                      : 'bg-white/[0.03] border-white/10 text-ink-secondary hover:bg-white/[0.07] hover:border-white/20'
                  "
                  :style="
                    viewMode === 'counted' && activeFilter === entry.type
                      ? {
                          borderColor: `${entry.color}99`,
                          boxShadow: `0 0 18px ${entry.color}30`,
                        }
                      : undefined
                  "
                  :aria-pressed="viewMode === 'counted' && activeFilter === entry.type"
                  @click="selectFilterManual(entry.type)"
                >
                  <span
                    class="w-3 h-3 rounded-[3px] shrink-0 flex items-center justify-center"
                    :class="entry.type === 'low_confidence' ? 'border border-dashed border-[#94A3B8] bg-[#64748B]/20' : ''"
                    :style="
                      entry.type === 'low_confidence'
                        ? {}
                        : entry.type === 'not_enough_demand'
                          ? {
                              backgroundColor: '#525E70',
                              backgroundImage: 'radial-gradient(#E2E8F0 0.8px, transparent 0.8px)',
                              backgroundSize: '4px 4px',
                            }
                          : { backgroundColor: entry.color }
                    "
                  />
                  <ChevronsUp v-if="entry.type === 'opportunity'" class="w-3.5 h-3.5 text-mint" :stroke-width="2.2" />
                  <Equal v-else-if="entry.type === 'fair'" class="w-3.5 h-3.5 text-signal-amber" :stroke-width="2.2" />
                  <AlertTriangle v-else-if="entry.type === 'crowded'" class="w-3 h-3 text-signal-coral" :stroke-width="2.2" />
                  <CircleDot v-else-if="entry.type === 'not_enough_demand'" class="w-3 h-3 text-signal-slate" :stroke-width="2.2" />
                  <span
                    v-else
                    class="w-3 h-3 rounded-full border border-dashed border-[#94A3B8] inline-block"
                    aria-hidden="true"
                  />
                  <span>{{ entry.label }}</span>

                  <!-- Auto-cycle bottom sweep progress bar on active filter pill -->
                  <span
                    v-if="viewMode === 'counted' && activeFilter === entry.type && isAutoRunning"
                    :key="`${entry.type}-${cycleKey}`"
                    class="sol-filter-progress absolute inset-x-0 bottom-0 h-[2px]"
                    :style="{ backgroundColor: entry.color }"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
