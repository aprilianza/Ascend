<script setup lang="ts">
import { Ban, Compass, Database, MessageSquareText, Scale } from 'lucide-vue-next'
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

const stepIconMap = {
  database: Database,
  compass: Compass,
  scale: Scale,
  message: MessageSquareText,
} as const

// Mathematically flush pointy-top honeycomb vertices for Step 01 & Step 02 SVG illustrations
function hexPoly(cx: number, cy: number, w: number, r: number): string {
  const hr = r * 0.5
  return `${cx},${cy - r} ${cx + w},${cy - hr} ${cx + w},${cy + hr} ${cx},${cy + r} ${cx - w},${cy + hr} ${cx - w},${cy - hr}`
}

const step1Neighbors = [
  { cx: 21, cy: -36, fill: '#13202B', stroke: '#2E4257', opacity: 1 },
  { cx: 42, cy: 0, fill: '#122726', stroke: '#10B981', opacity: 0.65 },
  { cx: 21, cy: 36, fill: '#13202B', stroke: '#2E4257', opacity: 1 },
  { cx: -21, cy: 36, fill: '#231D14', stroke: '#F59E0B', opacity: 0.55 },
  { cx: -42, cy: 0, fill: '#13202B', stroke: '#2E4257', opacity: 1 },
  { cx: -21, cy: -36, fill: '#13202B', stroke: '#2E4257', opacity: 1 },
] as const

const step2Neighbors = [
  { cx: 18, cy: -31 },
  { cx: 36, cy: 0 },
  { cx: 18, cy: 31 },
  { cx: -18, cy: 31 },
  { cx: -36, cy: 0 },
  { cx: -18, cy: -31 },
] as const

const sectionRef = ref<HTMLElement | null>(null)
const timelineRef = ref<HTMLElement | null>(null)
const rowRefs = ref<Array<HTMLElement | null>>([])

const hoveredStep = ref<string | null>(null)
const reducedMotion = ref(false)
const smoothProgress = ref(0)
const nodeFractions = ref<number[]>([0.11, 0.37, 0.63, 0.89])

let targetProgress = 0
let rafId = 0
let lastTickTime = 0
let isVisible = true
let intersectionObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let unmounted = false

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function setRowRef(el: Element | ComponentPublicInstance | null, idx: number) {
  rowRefs.value[idx] = el instanceof HTMLElement ? el : null
}

function measureNodePositions() {
  if (!timelineRef.value) return
  const tRect = timelineRef.value.getBoundingClientRect()
  const h = Math.max(1, tRect.height)
  const measured = rowRefs.value.map((row, idx) => {
    if (!row) return [0.11, 0.37, 0.63, 0.89][idx] ?? 0.5
    const r = row.getBoundingClientRect()
    const centerRel = (r.top + r.height * 0.5 - tRect.top) / h
    return clamp(centerRel, 0.06, 0.94)
  })
  if (measured.length === HOME_COPY.value.howItWorks.steps.length) {
    nodeFractions.value = measured
  }
}

function measureScrollProgress() {
  if (!timelineRef.value) return
  const rect = timelineRef.value.getBoundingClientRect()
  const vh = window.innerHeight || 900
  // Beam tip sits comfortably around 56% viewport height so each step ignites right as you read it
  const raw = (vh * 0.56 - rect.top) / Math.max(1, rect.height)
  targetProgress = clamp(raw, 0, 1)
}

function tick(now: number) {
  if (unmounted) return
  const dt = lastTickTime > 0 ? Math.min(0.06, Math.max(0.004, (now - lastTickTime) / 1000)) : 1 / 60
  lastTickTime = now
  const diff = targetProgress - smoothProgress.value
  if (Math.abs(diff) > 0.0004) {
    const blend = 1 - Math.exp(-16 * dt)
    smoothProgress.value += diff * blend
    rafId = window.requestAnimationFrame(tick)
  } else {
    smoothProgress.value = targetProgress
    lastTickTime = 0
    rafId = 0
  }
}

function scheduleTick() {
  if (reducedMotion.value || unmounted) return
  if (!rafId && isVisible) {
    lastTickTime = performance.now()
    rafId = window.requestAnimationFrame(tick)
  }
}

function onScroll() {
  measureScrollProgress()
  scheduleTick()
}

// Continuous [0..1] illumination for each step synchronized strictly to the scroll beam reaching its node
function stepGlow(idx: number, stepNum: string): number {
  if (reducedMotion.value) return 1
  const nodeY = nodeFractions.value[idx] ?? (idx + 0.5) / 4
  const scrollLit = smoothstep(nodeY - 0.07, nodeY + 0.025, smoothProgress.value)
  if (hoveredStep.value === stepNum) {
    return Math.max(scrollLit, 0.88)
  }
  return scrollLit
}

const activeTipIndex = computed(() => {
  if (reducedMotion.value) return -1
  let active = -1
  for (let i = 0; i < nodeFractions.value.length; i++) {
    if (smoothProgress.value >= (nodeFractions.value[i]! - 0.04)) {
      active = i
    }
  }
  return active
})

const boundaryGlow = computed(() => {
  if (reducedMotion.value) return 1
  return smoothstep(0.84, 0.99, smoothProgress.value)
})

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  measureNodePositions()
  measureScrollProgress()
  smoothProgress.value = reducedMotion.value ? 1 : targetProgress

  if (!reducedMotion.value) {
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  if (sectionRef.value && 'IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = Boolean(entries[0]?.isIntersecting)
        if (isVisible) {
          measureNodePositions()
          measureScrollProgress()
          scheduleTick()
        }
      },
      { rootMargin: '180px 0px 180px 0px' },
    )
    intersectionObserver.observe(sectionRef.value)
  }

  if (timelineRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      measureNodePositions()
      measureScrollProgress()
      if (!rafId) {
        smoothProgress.value = reducedMotion.value ? 1 : targetProgress
      }
    })
    resizeObserver.observe(timelineRef.value)
  }
})

onBeforeUnmount(() => {
  unmounted = true
  window.removeEventListener('scroll', onScroll)
  if (rafId) window.cancelAnimationFrame(rafId)
  intersectionObserver?.disconnect()
  resizeObserver?.disconnect()
})
</script>

<template>
  <section id="cara-kerja" ref="sectionRef" class="relative py-28 bg-ground overflow-x-clip">
    <div class="mx-auto max-w-frame px-8">
      <!-- Centered Editorial Header Directly Above the Luminous Spine -->
      <div class="mx-auto max-w-3xl text-center mb-20">
        <p
          v-reveal="{ variant: 'up' }"
          class="inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mint mb-3.5"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(16,185,129,0.9)]" aria-hidden="true" />
          <span>{{ HOME_COPY.howItWorks.eyebrow }}</span>
        </p>
        <h2
          v-reveal="{ variant: 'up', delay: 80 }"
          class="font-editorial font-semibold text-ink-primary text-[46px] leading-[1.12] tracking-[-0.015em]"
        >
          {{ HOME_COPY.howItWorks.headlinePrefix }}
          <span class="editorial-mint">{{ HOME_COPY.howItWorks.headlineAccent }}</span>
        </h2>
      </div>

      <!-- Scroll-Illuminated Alternating Timeline with Luminous Spine, Blazing Comet Tip & Sparks -->
      <div ref="timelineRef" class="relative py-4">
        <!-- Base unlit vertical spine track -->
        <div
          class="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-gradient-to-b from-transparent via-[#232B38] to-transparent"
          aria-hidden="true"
        />

        <!-- Dynamic scroll-filled luminous Luhur Mint energy beam -->
        <div
          class="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[2px] rounded-full will-change-[height]"
          :style="{
            height: `${(smoothProgress * 100).toFixed(3)}%`,
            background: 'linear-gradient(180deg, rgba(20, 184, 166, 0.25) 0%, #10B981 48%, #34D399 88%, #ECFDF5 100%)',
            boxShadow: '0 0 14px rgba(16, 185, 129, 0.85), 0 0 28px rgba(0, 229, 168, 0.35)',
          }"
          aria-hidden="true"
        />

        <!-- Blazing Scroll Comet Head + Drifting Emerald Sparks ("percikan") Riding the Beam Tip -->
        <div
          v-if="!reducedMotion && smoothProgress > 0.02 && smoothProgress < 0.995"
          class="pointer-events-none absolute left-1/2 z-20"
          :style="{ top: `${(smoothProgress * 100).toFixed(3)}%` }"
          aria-hidden="true"
        >
          <!-- Core luminous droplet + emerald halo -->
          <span
            class="hiw-comet-head absolute left-0 top-0 w-3 h-3 rounded-full bg-[#ECFDF5]"
            style="box-shadow: 0 0 12px 3px rgba(0, 229, 168, 0.95), 0 0 28px 8px rgba(16, 185, 129, 0.55);"
          />
          <!-- Drifting emerald sparks scattering gently from comet head -->
          <span class="hiw-spark-a absolute -left-0.5 -top-0.5 w-1.5 h-1.5 rounded-full bg-[#6EE7B7] shadow-[0_0_8px_#00E5A8]" />
          <span class="hiw-spark-b absolute -left-0.5 -top-0.5 w-1 h-1 rounded-full bg-[#ECFDF5] shadow-[0_0_8px_#34D399]" />
          <span class="hiw-spark-c absolute -left-0.5 -top-0.5 w-1 h-1 rounded-full bg-[#14B8A6] shadow-[0_0_6px_#14B8A6]" />
        </div>

        <!-- 4 Alternating Illuminated Steps with Opposite-Side Visual Illustrations -->
        <div class="flex flex-col gap-16">
          <div
            v-for="(step, idx) in HOME_COPY.howItWorks.steps"
            :key="step.num"
            :ref="el => setRowRef(el, idx)"
            class="relative grid grid-cols-12 gap-0 items-center"
            @mouseenter="hoveredStep = step.num"
            @mouseleave="hoveredStep = null"
          >
            <!-- Primary Horizontal Connector Arm (Desktop: Center Hexagon -> Explanation Card) -->
            <div
              class="pointer-events-none block absolute top-1/2 -translate-y-1/2 h-[1.5px] z-10 overflow-hidden"
              :style="
                idx % 2 === 0
                  ? { left: '41.6667%', right: 'calc(50% + 21px)' }
                  : { left: 'calc(50% + 21px)', right: '41.6667%' }
              "
              aria-hidden="true"
            >
              <div class="w-full h-full bg-[#232B38]" />
              <div
                class="absolute inset-0 bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#A7F3D0] shadow-[0_0_10px_rgba(0,229,168,0.85)]"
                :style="{
                  transformOrigin: idx % 2 === 0 ? 'right center' : 'left center',
                  transform: `scaleX(${stepGlow(idx, step.num).toFixed(3)})`,
                  opacity: stepGlow(idx, step.num).toFixed(3),
                }"
              />
            </div>

            <!-- Complementary Horizontal Connector Arm (Desktop: Center Hexagon -> Opposite Visual Diagram) -->
            <div
              class="pointer-events-none block absolute top-1/2 -translate-y-1/2 h-[1.5px] z-10 overflow-hidden"
              :style="
                idx % 2 === 0
                  ? { left: 'calc(50% + 21px)', right: '41.6667%' }
                  : { left: '41.6667%', right: 'calc(50% + 21px)' }
              "
              aria-hidden="true"
            >
              <div class="w-full h-full border-t border-dashed border-[#2C3647]" />
              <div
                class="absolute inset-0 border-t border-dashed border-[#34D399]/80"
                :style="{
                  transformOrigin: idx % 2 === 0 ? 'left center' : 'right center',
                  transform: `scaleX(${stepGlow(idx, step.num).toFixed(3)})`,
                  opacity: (stepGlow(idx, step.num) * 0.9).toFixed(3),
                }"
              />
            </div>

            <span class="hidden" aria-hidden="true" />

            <!-- Center Hexagon Ignition Node + Sparks -->
            <div
              class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
              aria-hidden="true"
            >
              <!-- Soft radial ambient emerald glow behind ignited hexagon -->
              <span
                class="pointer-events-none absolute w-16 h-16 rounded-full blur-xl transition-opacity duration-300"
                :style="{
                  opacity: (stepGlow(idx, step.num) * 0.72).toFixed(3),
                  background: 'radial-gradient(circle, rgba(0, 229, 168, 0.7) 0%, transparent 72%)',
                }"
              />

              <!-- Expanding pulse shockwave ring on the currently active ignited node -->
              <span
                v-if="!reducedMotion && activeTipIndex === idx"
                class="hiw-node-ring pointer-events-none absolute w-11 h-11 rounded-full border border-mint/70"
              />

              <!-- Tiny drifting emerald sparks around the active node -->
              <template v-if="!reducedMotion && stepGlow(idx, step.num) > 0.6">
                <span class="hiw-spark-a pointer-events-none absolute w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
                <span class="hiw-spark-b pointer-events-none absolute w-1 h-1 rounded-full bg-[#ECFDF5]" />
              </template>

              <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                fill="none"
                class="relative z-10 transition-transform duration-300"
                :style="{
                  transform: `scale(${(0.94 + stepGlow(idx, step.num) * 0.14).toFixed(3)})`,
                  filter: stepGlow(idx, step.num) > 0.35
                    ? `drop-shadow(0 0 ${(stepGlow(idx, step.num) * 14).toFixed(1)}px rgba(16, 185, 129, 0.85))`
                    : 'none',
                }"
              >
                <polygon
                  points="22,3 39,12.5 39,31.5 22,41 5,31.5 5,12.5"
                  :fill="stepGlow(idx, step.num) > 0.5 ? '#0C211C' : '#12161E'"
                  :stroke="stepGlow(idx, step.num) > 0.35 ? '#34D399' : '#2C3544'"
                  :stroke-width="stepGlow(idx, step.num) > 0.5 ? 2 : 1.35"
                  class="transition-all duration-300"
                />
                <text
                  x="22"
                  y="26.5"
                  text-anchor="middle"
                  :fill="stepGlow(idx, step.num) > 0.5 ? '#ECFDF5' : '#64748B'"
                  font-family="Space Mono, monospace"
                  font-weight="700"
                  font-size="12.5"
                >
                  {{ Number(step.num) }}
                </text>
              </svg>
            </div>

            <!-- 1. EXPLANATION CARD: Calm Warm-Slate Editorial Narrative Panel (Distinct from Visual Blueprint Stage) -->
            <div
              :class="
                idx % 2 === 0
                  ? 'col-span-5 col-start-1 row-start-1'
                  : 'col-span-5 col-start-8 row-start-1'
              "
            >
              <div
                class="relative rounded-2xl overflow-hidden transition-all duration-300 will-change-[opacity,transform]"
                :style="{
                  opacity: (0.48 + stepGlow(idx, step.num) * 0.52).toFixed(3),
                  transform: `translateY(${((1 - stepGlow(idx, step.num)) * 10).toFixed(1)}px)`,
                  background: 'linear-gradient(155deg, #1A2230 0%, #131924 100%)',
                  border: stepGlow(idx, step.num) > 0.45
                    ? '1px solid rgba(148, 163, 184, 0.28)'
                    : '1px solid rgba(71, 85, 105, 0.32)',
                  boxShadow: stepGlow(idx, step.num) > 0.45
                    ? '0 18px 42px rgba(0, 0, 0, 0.44), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                    : '0 10px 24px rgba(0, 0, 0, 0.28)',
                }"
              >
                <!-- Clean Vertical Emerald Accent Spine Facing the Center Timeline (Instant Narrative Cue, Zero Glare) -->
                <div
                  class="pointer-events-none absolute inset-y-4 w-[3px] rounded-full transition-opacity duration-400"
                  :class="idx % 2 === 0 ? 'right-0' : 'left-0'"
                  :style="{
                    opacity: (0.35 + stepGlow(idx, step.num) * 0.65).toFixed(3),
                    background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.25) 0%, #10B981 50%, rgba(20, 184, 166, 0.25) 100%)',
                  }"
                  aria-hidden="true"
                />

                <!-- Whisper-Subtle Editorial Step Watermark Numeral -->
                <span
                  class="pointer-events-none select-none absolute -bottom-3 font-display font-extrabold text-[84px] leading-none tracking-[-0.04em] text-white/[0.032]"
                  :class="idx % 2 === 0 ? 'right-5' : 'right-5'"
                  aria-hidden="true"
                >
                  {{ step.num }}
                </span>

                <div class="relative z-10 p-7">
                  <div class="flex items-center justify-between gap-3">
                    <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 font-mono text-[10px] uppercase tracking-[0.16em] text-[#A7F3D0]">
                      <UiKawungIcon
                        :size="11"
                        class="text-mint transition-opacity duration-300"
                        :style="{ opacity: (0.55 + stepGlow(idx, step.num) * 0.45).toFixed(2) }"
                      />
                      <span>{{ step.eyebrow }}</span>
                    </span>

                    <span
                      class="w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-300"
                      :class="
                        stepGlow(idx, step.num) > 0.55
                          ? 'bg-white/[0.07] border-mint/40 text-mint'
                          : 'bg-[#121821] border-[#263040] text-ink-muted'
                      "
                    >
                      <component :is="stepIconMap[step.icon]" class="w-4 h-4" :stroke-width="1.8" />
                    </span>
                  </div>

                  <h3 class="mt-4 font-editorial font-semibold text-[#F8FAFC] text-[25px] leading-snug tracking-[-0.01em]">
                    {{ step.title }}
                  </h3>
                  <p class="mt-2.5 font-sans text-[14.5px] leading-[1.7] text-[#B8C5D6]">
                    {{ step.description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 2. OPPOSITE-SIDE VISUAL ILLUSTRATION: Recessed Deep-Teal Geospatial Blueprint Viewport -->
            <div
              :class="
                idx % 2 === 0
                  ? 'col-span-5 col-start-8 row-start-1'
                  : 'col-span-5 col-start-1 row-start-1'
              "
            >
              <div
                class="relative rounded-2xl overflow-hidden transition-all duration-300 will-change-[opacity,transform]"
                :style="{
                  opacity: (0.48 + stepGlow(idx, step.num) * 0.52).toFixed(3),
                  transform: `translateY(${((1 - stepGlow(idx, step.num)) * 12).toFixed(1)}px)`,
                  background: 'radial-gradient(ellipse 92% 88% at 50% 42%, #0B1A1D 0%, #071015 68%, #050A0F 100%)',
                  border: stepGlow(idx, step.num) > 0.45
                    ? `1px dashed rgba(20, 184, 166, ${(0.28 + stepGlow(idx, step.num) * 0.28).toFixed(3)})`
                    : '1px dashed rgba(51, 65, 85, 0.65)',
                  boxShadow: 'inset 0 2px 24px rgba(0, 0, 0, 0.65), 0 12px 32px rgba(0, 0, 0, 0.34)',
                }"
              >
                <!-- Blueprint Dot-Matrix Substrate -->
                <div
                  class="pointer-events-none absolute inset-0 opacity-45"
                  style="background-image: radial-gradient(rgba(20, 184, 166, 0.24) 1px, transparent 1px); background-size: 16px 16px;"
                  aria-hidden="true"
                />

                <!-- Four Crisp Viewfinder Corner Brackets (Signals Visual Instrument vs Prose Card!) -->
                <span class="pointer-events-none absolute top-2 left-2 w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-mint/65 rounded-tl-[2px]" aria-hidden="true" />
                <span class="pointer-events-none absolute top-2 right-2 w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-mint/65 rounded-tr-[2px]" aria-hidden="true" />
                <span class="pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-mint/65 rounded-bl-[2px]" aria-hidden="true" />
                <span class="pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-mint/65 rounded-br-[2px]" aria-hidden="true" />

                <!-- Compact Blueprint Instrument Chrome Header Strip -->
                <div class="relative z-10 flex items-center justify-between px-4 py-2 border-b border-teal-500/15 bg-[#050C10]/70">
                  <span class="inline-flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-[#5EEAD4]/90">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" aria-hidden="true" />
                    <span>FIG {{ step.num }} · {{ settings.t('VISUAL PREVIEW', 'ILUSTRASI VISUAL') }}</span>
                  </span>
                  <span class="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-muted/80">
                    {{ settings.t('OPEN DATA MODEL', 'MODEL DATA TERBUKA') }}
                  </span>
                </div>

                <!-- STEP 01 VISUAL: Open Map Sources Streaming Into a Hexagonal Neighborhood Grid -->
                <div v-if="step.icon === 'database'" class="relative z-10 p-5">
                  <div class="flex items-center justify-between gap-2 mb-2.5">
                    <span class="font-mono text-[9px] uppercase tracking-[0.14em] text-mint/90">
                      OPEN SOURCES → MAPPED AREAS
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-mint/10 border border-mint/30 font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#6EE7B7]">
                      100% OPEN DATA
                    </span>
                  </div>

                  <svg
                    viewBox="0 0 420 176"
                    class="w-full h-auto block"
                    role="img"
                    aria-label="Illustration showing OpenStreetMap, Overture Places, and WorldPop flowing into a mapped hexagon grid"
                  >
                    <defs>
                      <linearGradient id="hiw-stream-1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#14B8A6" stop-opacity="0.35" />
                        <stop offset="55%" stop-color="#10B981" stop-opacity="0.95" />
                        <stop offset="100%" stop-color="#6EE7B7" stop-opacity="0.9" />
                      </linearGradient>
                      <linearGradient id="hiw-stream-2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.35" />
                        <stop offset="55%" stop-color="#10B981" stop-opacity="0.95" />
                        <stop offset="100%" stop-color="#00E5A8" stop-opacity="1" />
                      </linearGradient>
                      <radialGradient id="hiw-grid-glow" cx="50%" cy="50%" r="52%">
                        <stop offset="0%" stop-color="#10B981" stop-opacity="0.28" />
                        <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
                      </radialGradient>
                    </defs>

                    <!-- Subtle background dot mesh -->
                    <circle cx="330" cy="88" r="76" fill="url(#hiw-grid-glow)" />

                    <!-- 3 Open Source Cards (Left) -->
                    <g>
                      <!-- Source 1: OpenStreetMap -->
                      <rect x="10" y="14" width="142" height="40" rx="10" fill="#121A24" stroke="#283548" stroke-width="1.1" />
                      <circle cx="29" cy="34" r="9" fill="#0F2A26" stroke="#14B8A6" stroke-width="1.2" />
                      <path d="M25 36 L29 31 L33 36 M29 31 V28" stroke="#5EEAD4" stroke-width="1.3" stroke-linecap="round" fill="none" />
                      <text x="45" y="31" fill="#F1F5F9" font-family="Plus Jakarta Sans, sans-serif" font-size="10.5" font-weight="600">OpenStreetMap</text>
                      <text x="45" y="44" fill="#94A3B8" font-family="Space Mono, monospace" font-size="7.8">ROADS &amp; FACILITIES</text>

                      <!-- Source 2: Overture Places -->
                      <rect x="10" y="68" width="142" height="40" rx="10" fill="#121A24" stroke="#1E4A3E" stroke-width="1.2" />
                      <circle cx="29" cy="88" r="9" fill="#0D2920" stroke="#10B981" stroke-width="1.2" />
                      <rect x="24.5" y="84.5" width="9" height="7" rx="1.2" stroke="#34D399" stroke-width="1.2" fill="none" />
                      <path d="M24 85 L29 82 L34 85" stroke="#34D399" stroke-width="1.2" fill="none" />
                      <text x="45" y="85" fill="#F1F5F9" font-family="Plus Jakarta Sans, sans-serif" font-size="10.5" font-weight="600">Overture Places</text>
                      <text x="45" y="98" fill="#6EE7B7" font-family="Space Mono, monospace" font-size="7.8">ACTIVE COFFEE SHOPS</text>

                      <!-- Source 3: WorldPop -->
                      <rect x="10" y="122" width="142" height="40" rx="10" fill="#121A24" stroke="#3A3122" stroke-width="1.1" />
                      <circle cx="29" cy="142" r="9" fill="#241D11" stroke="#F59E0B" stroke-width="1.2" />
                      <circle cx="29" cy="139" r="2.2" fill="#FBBF24" />
                      <path d="M24.5 146.5 C25.5 143.5 32.5 143.5 33.5 146.5" stroke="#FBBF24" stroke-width="1.3" stroke-linecap="round" fill="none" />
                      <text x="45" y="139" fill="#F1F5F9" font-family="Plus Jakarta Sans, sans-serif" font-size="10.5" font-weight="600">WorldPop</text>
                      <text x="45" y="152" fill="#FCD34D" font-family="Space Mono, monospace" font-size="7.8">RESIDENT DENSITY</text>
                    </g>

                    <!-- Flowing Animated Data Streams into the Grid -->
                    <g fill="none">
                      <path d="M152 34 C196 34, 212 72, 258 82" stroke="url(#hiw-stream-1)" stroke-width="1.6" stroke-dasharray="5 5" class="hiw-flow-dash" />
                      <path d="M152 88 C194 88, 218 88, 258 88" stroke="#00E5A8" stroke-width="2" stroke-dasharray="6 5" class="hiw-flow-dash" />
                      <path d="M152 142 C196 142, 212 104, 258 94" stroke="url(#hiw-stream-2)" stroke-width="1.6" stroke-dasharray="5 5" class="hiw-flow-dash-slow" />
                      <circle cx="152" cy="34" r="3" fill="#5EEAD4" />
                      <circle cx="152" cy="88" r="3.4" fill="#00E5A8" />
                      <circle cx="152" cy="142" r="3" fill="#FBBF24" />
                    </g>

                    <!-- Clean Mathematically Flush Hexagonal Neighborhood Grid (Right) -->
                    <g transform="translate(332, 84)">
                      <polygon
                        v-for="(nb, nIdx) in step1Neighbors"
                        :key="`s1-${nIdx}`"
                        :points="hexPoly(nb.cx, nb.cy, 20.5, 23.6)"
                        :fill="nb.fill"
                        :stroke="nb.stroke"
                        :stroke-opacity="nb.opacity"
                        stroke-width="1.2"
                      />

                      <!-- Center Active Ignited Area Hex -->
                      <polygon :points="hexPoly(0, 0, 20.5, 23.6)" fill="#0C2E25" stroke="#00E5A8" stroke-width="2" />
                      <!-- Tiny place dots inside grid -->
                      <circle cx="-5" cy="-4" r="2.6" fill="#00E5A8" class="hiw-dot-pulse" />
                      <circle cx="7" cy="4" r="2.3" fill="#FBBF24" />
                      <circle cx="41" cy="-2" r="2.3" fill="#34D399" />
                      <circle cx="-41" cy="2" r="2.1" fill="#94A3B8" />
                      <circle cx="20" cy="-35" r="2.2" fill="#5EEAD4" />
                      <circle cx="-20" cy="36" r="2.2" fill="#FBBF24" />
                      <text x="0" y="79" text-anchor="middle" fill="#94A3B8" font-family="Space Mono, monospace" font-size="8" letter-spacing="0.08em">MAPPED HEX AREAS</text>
                    </g>
                  </svg>
                </div>

                <!-- STEP 02 VISUAL: 7-Hexagon ~500m Demand Ring Surrounded by Everyday Activity Drivers -->
                <div v-else-if="step.icon === 'compass'" class="relative z-10 p-5">
                  <div class="flex items-center justify-between gap-2 mb-2.5">
                    <span class="font-mono text-[9px] uppercase tracking-[0.14em] text-mint/90">
                      THIS AREA + 6 NEIGHBORS (~500 M)
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-mint/10 border border-mint/30 font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#6EE7B7]">
                      LOCAL DEMAND
                    </span>
                  </div>

                  <svg
                    viewBox="0 0 420 176"
                    class="w-full h-auto block"
                    role="img"
                    aria-label="Illustration of a 500 meter neighborhood ring counting residents, campuses, schools, offices, retail, and transit"
                  >
                    <defs>
                      <radialGradient id="hiw-ring-aura" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#00E5A8" stop-opacity="0.26" />
                        <stop offset="65%" stop-color="#14B8A6" stop-opacity="0.08" />
                        <stop offset="100%" stop-color="#14B8A6" stop-opacity="0" />
                      </radialGradient>
                    </defs>

                    <!-- Concentric ~500 m Radar Rings -->
                    <g transform="translate(154, 88)">
                      <circle cx="0" cy="0" r="76" fill="url(#hiw-ring-aura)" />
                      <circle cx="0" cy="0" r="68" fill="none" stroke="#14B8A6" stroke-opacity="0.32" stroke-width="1.2" stroke-dasharray="4 4" />
                      <circle cx="0" cy="0" r="48" fill="none" stroke="#10B981" stroke-opacity="0.45" stroke-width="1" class="hiw-radar-pulse" />

                      <!-- 6 Mathematically Flush Surrounding Neighbor Hexes -->
                      <polygon
                        v-for="(nb, nIdx) in step2Neighbors"
                        :key="`s2-${nIdx}`"
                        :points="hexPoly(nb.cx, nb.cy, 17.5, 20.2)"
                        fill="#102126"
                        stroke="#34D399"
                        stroke-opacity="0.46"
                        stroke-width="1.15"
                        stroke-dasharray="3 2"
                      />

                      <!-- Center Evaluated Spot -->
                      <polygon :points="hexPoly(0, 0, 17.5, 20.2)" fill="#0B3328" stroke="#00E5A8" stroke-width="2" />
                      <circle cx="0" cy="0" r="4" fill="#ECFDF5" />

                      <!-- Scope caption inside ring -->
                      <rect x="-34" y="56" width="68" height="16" rx="8" fill="#091318" stroke="#1E4A3E" stroke-width="1" />
                      <text x="0" y="67" text-anchor="middle" fill="#6EE7B7" font-family="Space Mono, monospace" font-size="7.5" font-weight="700">~500 M RING</text>
                    </g>

                    <!-- Left Everyday Demand Cue Pills (3) -->
                    <g>
                      <rect x="6" y="18" width="76" height="22" rx="11" fill="#121A24" stroke="#29384B" stroke-width="1" />
                      <circle cx="17" cy="29" r="3" fill="#10B981" />
                      <text x="25" y="32.5" fill="#E2E8F0" font-family="Space Mono, monospace" font-size="8">RESIDENTS</text>
                      <line x1="82" y1="29" x2="106" y2="54" stroke="#10B981" stroke-opacity="0.45" stroke-width="1" stroke-dasharray="2.5 2.5" />

                      <rect x="6" y="77" width="70" height="22" rx="11" fill="#121A24" stroke="#29384B" stroke-width="1" />
                      <circle cx="17" cy="88" r="3" fill="#14B8A6" />
                      <text x="25" y="91.5" fill="#E2E8F0" font-family="Space Mono, monospace" font-size="8">CAMPUS</text>
                      <line x1="76" y1="88" x2="98" y2="88" stroke="#14B8A6" stroke-opacity="0.45" stroke-width="1" stroke-dasharray="2.5 2.5" />

                      <rect x="6" y="136" width="72" height="22" rx="11" fill="#121A24" stroke="#29384B" stroke-width="1" />
                      <circle cx="17" cy="147" r="3" fill="#F59E0B" />
                      <text x="25" y="150.5" fill="#E2E8F0" font-family="Space Mono, monospace" font-size="8">TRANSIT</text>
                      <line x1="78" y1="147" x2="106" y2="122" stroke="#F59E0B" stroke-opacity="0.45" stroke-width="1" stroke-dasharray="2.5 2.5" />
                    </g>

                    <!-- Right Connector & Expected Demand Output Panel -->
                    <path d="M222 88 H260" stroke="#10B981" stroke-width="1.6" stroke-dasharray="4 4" class="hiw-flow-dash" />
                    <polygon points="258,83 266,88 258,93" fill="#00E5A8" />

                    <g transform="translate(270, 22)">
                      <rect x="0" y="0" width="142" height="132" rx="14" fill="#111A24" stroke="#1D473C" stroke-width="1.2" />
                      <text x="14" y="23" fill="#6EE7B7" font-family="Space Mono, monospace" font-size="7.8" letter-spacing="0.08em">ESTIMATED SUPPORT</text>
                      <text x="14" y="54" fill="#F8FAFC" font-family="Space Grotesk, sans-serif" font-size="26" font-weight="700">~8.9</text>
                      <text x="72" y="54" fill="#94A3B8" font-family="Plus Jakarta Sans, sans-serif" font-size="10.5">shops</text>

                      <!-- Mini driver chips inside output panel -->
                      <rect x="14" y="68" width="54" height="18" rx="6" fill="#0D251F" stroke="#10B981" stroke-opacity="0.4" />
                      <text x="41" y="80" text-anchor="middle" fill="#6EE7B7" font-family="Space Mono, monospace" font-size="7.2">OFFICES</text>

                      <rect x="74" y="68" width="54" height="18" rx="6" fill="#0D251F" stroke="#14B8A6" stroke-opacity="0.4" />
                      <text x="101" y="80" text-anchor="middle" fill="#5EEAD4" font-family="Space Mono, monospace" font-size="7.2">RETAIL</text>

                      <rect x="14" y="92" width="114" height="24" rx="8" fill="#0A1118" stroke="#223042" />
                      <text x="71" y="107" text-anchor="middle" fill="#CBD5E1" font-family="Space Mono, monospace" font-size="7.2">SCHOOLS &amp; DAILY FOOTFALL</text>
                    </g>
                  </svg>
                </div>

                <!-- STEP 03 VISUAL: Actual Supply vs Expected Demand Comparison -> 4 Colorblind-Safe Labels -->
                <div v-else-if="step.icon === 'scale'" class="relative z-10 p-5 space-y-3.5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-mono text-[9px] uppercase tracking-[0.14em] text-mint/90">
                      SUPPLY VS DEMAND CHECK
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-mint/15 border border-mint/45 font-mono text-[8.5px] font-bold uppercase tracking-[0.08em] text-[#00E5A8]">
                      +5.4 ROOM LEFT
                    </span>
                  </div>

                  <!-- Clean Horizontal Supply vs Demand Bar Comparison -->
                  <div class="rounded-xl bg-[#0A1017] border border-white/[0.08] p-3.5 space-y-3">
                    <div>
                      <div class="flex items-center justify-between text-[11px] mb-1.5">
                        <span class="font-sans text-ink-secondary">Active coffee shops (~500 m)</span>
                        <span class="font-mono font-bold text-ink-primary">3 shops</span>
                      </div>
                      <div class="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div class="h-full w-[34%] rounded-full bg-gradient-to-r from-[#475569] to-[#94A3B8]" />
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center justify-between text-[11px] mb-1.5">
                        <span class="font-sans text-ink-secondary">Demand typically supports</span>
                        <span class="font-mono font-bold text-[#34D399]">~8.4 shops</span>
                      </div>
                      <div class="relative h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div class="h-full w-[86%] rounded-full bg-gradient-to-r from-[#14B8A6] via-[#10B981] to-[#00E5A8] shadow-[0_0_12px_rgba(0,229,168,0.6)]" />
                      </div>
                    </div>
                  </div>

                  <!-- 4 Patterned Colorblind-Safe Outcome Labels -->
                  <div class="grid grid-cols-4 gap-2">
                    <div class="rounded-xl px-2.5 py-2 bg-mint/15 border border-mint/60 shadow-[0_0_18px_rgba(16,185,129,0.2)]">
                      <span
                        class="block w-full h-2 rounded-sm mb-1.5"
                        style="background-color: #10B981; background-image: repeating-linear-gradient(-45deg, rgba(4,47,34,0.45) 0 2px, transparent 2px 5px);"
                      />
                      <span class="block font-mono text-[8.5px] font-bold uppercase tracking-[0.06em] text-[#6EE7B7]">
                        Opportunity
                      </span>
                    </div>

                    <div class="rounded-xl px-2.5 py-2 bg-white/[0.02] border border-white/10 opacity-75">
                      <span
                        class="block w-full h-2 rounded-sm mb-1.5"
                        style="background-color: #E5940A; background-image: repeating-linear-gradient(0deg, rgba(69,26,3,0.45) 0 1.5px, transparent 1.5px 4px);"
                      />
                      <span class="block font-mono text-[8.5px] uppercase tracking-[0.06em] text-[#FCD34D]">
                        Fair
                      </span>
                    </div>

                    <div class="rounded-xl px-2.5 py-2 bg-white/[0.02] border border-white/10 opacity-75">
                      <span
                        class="block w-full h-2 rounded-sm mb-1.5"
                        style="background-color: #D93D3D; background-image: repeating-linear-gradient(45deg, rgba(69,10,10,0.45) 0 1.5px, transparent 1.5px 5px), repeating-linear-gradient(-45deg, rgba(69,10,10,0.45) 0 1.5px, transparent 1.5px 5px);"
                      />
                      <span class="block font-mono text-[8.5px] uppercase tracking-[0.06em] text-[#FCA5A5]">
                        Crowded
                      </span>
                    </div>

                    <div class="rounded-xl px-2.5 py-2 bg-white/[0.02] border border-white/10 opacity-70">
                      <span
                        class="block w-full h-2 rounded-sm mb-1.5"
                        style="background-color: #536275; background-image: radial-gradient(rgba(226,232,240,0.5) 0.9px, transparent 0.9px); background-size: 4px 4px;"
                      />
                      <span class="block font-mono text-[8.5px] uppercase tracking-[0.06em] text-[#CBD5E1]">
                        Low demand
                      </span>
                    </div>
                  </div>
                </div>

                <!-- STEP 04 VISUAL: Plain-English Area Card Preview Showing Top 3 Demand Drivers -->
                <div v-else class="relative z-10 p-5 space-y-3">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-mono text-[9px] uppercase tracking-[0.14em] text-mint/90">
                      WHAT DRIVES DEMAND AT THIS SPOT
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-mint/10 border border-mint/30 font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#6EE7B7]">
                      PLAIN WORDS
                    </span>
                  </div>

                  <div class="space-y-2">
                    <!-- Driver 1 (Up) -->
                    <div class="rounded-xl bg-[#0A1118] border border-mint/25 px-3 py-2.5 flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-6 h-6 rounded-lg bg-mint/15 border border-mint/45 text-mint font-mono text-[12px] font-bold flex items-center justify-center shrink-0">
                          ↑
                        </span>
                        <span class="font-sans text-[12.5px] font-medium text-ink-primary truncate">
                          Close to a campus
                        </span>
                      </div>
                      <span class="flex items-center gap-1 shrink-0" aria-hidden="true">
                        <span class="w-10 h-1.5 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#00E5A8]" />
                        <span class="font-mono text-[8.5px] uppercase text-mint">LIFTS</span>
                      </span>
                    </div>

                    <!-- Driver 2 (Up) -->
                    <div class="rounded-xl bg-[#0A1118] border border-mint/20 px-3 py-2.5 flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-6 h-6 rounded-lg bg-mint/15 border border-mint/40 text-mint font-mono text-[12px] font-bold flex items-center justify-center shrink-0">
                          ↑
                        </span>
                        <span class="font-sans text-[12.5px] font-medium text-ink-primary truncate">
                          Good bus and transit access
                        </span>
                      </div>
                      <span class="flex items-center gap-1 shrink-0" aria-hidden="true">
                        <span class="w-7 h-1.5 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#34D399]" />
                        <span class="font-mono text-[8.5px] uppercase text-[#5EEAD4]">LIFTS</span>
                      </span>
                    </div>

                    <!-- Driver 3 (Down) -->
                    <div class="rounded-xl bg-[#0A1118] border border-signal-amber/25 px-3 py-2.5 flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-6 h-6 rounded-lg bg-signal-amber/15 border border-signal-amber/40 text-signal-amber font-mono text-[12px] font-bold flex items-center justify-center shrink-0">
                          ↓
                        </span>
                        <span class="font-sans text-[12.5px] font-medium text-ink-secondary truncate">
                          Few offices nearby
                        </span>
                      </div>
                      <span class="flex items-center gap-1 shrink-0" aria-hidden="true">
                        <span class="w-5 h-1.5 rounded-full bg-signal-amber/80" />
                        <span class="font-mono text-[8.5px] uppercase text-signal-amber">LOWERS</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Band: "What Ascend does not do" (Single-Row Smoked Frosted-Glass Surface) -->
      <div class="mt-20 relative">
        <!-- Ambient Backlight Orbs Behind the Frosted Glass (gives genuine optical refraction depth) -->
        <div
          class="pointer-events-none absolute -top-10 -left-8 w-64 h-64 rounded-full blur-3xl opacity-45"
          style="background: radial-gradient(circle, rgba(239, 68, 68, 0.24) 0%, transparent 72%);"
          aria-hidden="true"
        />
        <div
          class="pointer-events-none absolute -bottom-10 -right-8 w-72 h-72 rounded-full blur-3xl opacity-40"
          style="background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 72%);"
          aria-hidden="true"
        />

        <div
          class="boundary-glass-card transition-all duration-500"
          :style="{
            opacity: (0.72 + boundaryGlow * 0.28).toFixed(3),
            borderColor: boundaryGlow > 0.4
              ? 'rgba(239, 68, 68, 0.34)'
              : 'rgba(255, 255, 255, 0.12)',
          }"
        >
          <!-- Diagonal Glass Specular Reflection -->
          <div class="solution-glass-reflection" aria-hidden="true" />

          <!-- Subtle top coral glow rim -->
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] z-10 transition-opacity duration-500"
            :style="{
              opacity: boundaryGlow.toFixed(3),
              background: 'linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.72) 50%, transparent 100%)',
            }"
            aria-hidden="true"
          />

          <div class="relative z-10 p-8">
            <div class="flex flex-row items-center justify-between gap-2 pb-5 border-b border-white/10">
              <div>
                <p class="font-mono text-[10.5px] uppercase tracking-[0.16em] text-signal-coral mb-1.5">
                  {{ HOME_COPY.howItWorks.doesNotEyebrow }}
                </p>
                <h3 class="font-editorial font-semibold text-ink-primary text-[26px] leading-snug">
                  {{ HOME_COPY.howItWorks.doesNotTitle }}
                </h3>
              </div>
              <span class="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                OPEN DATA TRANSPARENCY
              </span>
            </div>

            <!-- Single-Row 4-Column Frosted Glass Tiles -->
            <div class="mt-6 grid grid-cols-4 gap-3.5">
              <div
                v-for="(item, idx) in HOME_COPY.howItWorks.doesNotItems"
                :key="idx"
                class="boundary-glass-tile rounded-xl p-4 h-full flex items-start gap-3 transition-all duration-fast ease-signal hover:border-signal-coral/50 hover:bg-white/[0.06]"
              >
                <span class="w-7 h-7 rounded-lg bg-signal-coral/15 border border-signal-coral/40 flex items-center justify-center text-signal-coral shrink-0 mt-0.5">
                  <Ban class="w-3.5 h-3.5" :stroke-width="2" />
                </span>
                <p class="font-sans text-[13px] leading-[1.58] text-ink-secondary">
                  {{ item }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes hiwDashFlow {
  from {
    stroke-dashoffset: 32;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes hiwRadarPulse {
  0% {
    transform: scale(0.76);
    opacity: 0.72;
  }
  70% {
    transform: scale(1.24);
    opacity: 0.1;
  }
  100% {
    transform: scale(1.28);
    opacity: 0;
  }
}

@keyframes hiwDotPulse {
  0%, 100% {
    opacity: 0.55;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.25);
  }
}

.hiw-flow-dash {
  animation: hiwDashFlow 2.1s linear infinite;
}

.hiw-flow-dash-slow {
  animation: hiwDashFlow 2.8s linear infinite;
}

.hiw-radar-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: hiwRadarPulse 3.2s ease-out infinite;
}

.hiw-dot-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: hiwDotPulse 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hiw-flow-dash,
  .hiw-flow-dash-slow,
  .hiw-radar-pulse,
  .hiw-dot-pulse {
    animation: none;
  }
}
</style>
