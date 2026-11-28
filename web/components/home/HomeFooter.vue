<script setup lang="ts">
import type { Meta } from '~/types/areas'
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

defineProps<{
  meta: Meta | null
  loadingMeta: boolean
  dataVersionLabel: string
}>()

const emit = defineEmits<{
  openModal: [tab: 'about' | 'licenses' | 'privacy']
}>()

const hoveredPrismKey = ref<string | null>(null)

type WaveClass = 'footer-wave-a' | 'footer-wave-b' | 'footer-wave-c' | 'footer-wave-d'

interface SkylinePrism {
  key: string
  cx: number
  height: number
  capFill: string
  capStroke: string
  capGlow?: boolean
  waveClass: WaveClass
  dur: number
  delay: number
  row: 'back' | 'front'
}

// 26 sculpted 3D isometric hexagonal columns spanning the ENTIRE 1440px width
// Concrete GPU-composited wave classes with staggered negative delays for live harmonic rise & fall!
const skylinePrisms: SkylinePrism[] = (() => {
  const list: SkylinePrism[] = []
  const waves: WaveClass[] = ['footer-wave-a', 'footer-wave-b', 'footer-wave-c', 'footer-wave-d']

  // Back Row (13 pillars across x = 30 .. 1410)
  for (let i = 0; i < 13; i++) {
    const cx = 30 + i * 115
    const edgeFactor = Math.abs(cx - 720) / 720
    const baseH = Math.round(138 + edgeFactor * 46 + ((i * 19) % 18))
    const isMint = i === 1 || i === 11
    const isAmber = i === 4 || i === 8
    list.push({
      key: `b-${i}`,
      cx,
      height: baseH,
      capFill: isMint ? '#0F2E26' : isAmber ? '#291E0D' : '#1A2434',
      capStroke: isMint ? '#34D399' : isAmber ? '#F59E0B' : '#314158',
      capGlow: isMint || isAmber,
      waveClass: waves[i % 4]!,
      dur: Number((3.8 + (i % 5) * 0.42).toFixed(2)),
      delay: Number((-(i * 0.44)).toFixed(2)),
      row: 'back',
    })
  }

  // Front Row (13 pillars across x = 86 .. 1354, flowing unbroken directly underneath the footer box!)
  for (let i = 0; i < 13; i++) {
    const cx = 86 + i * 105.6
    const edgeFactor = Math.abs(cx - 720) / 720
    const baseH = Math.round(92 + edgeFactor * 38 + ((i * 13) % 14))

    let capFill = '#172130'
    let capStroke = '#2F3F57'
    let capGlow = false

    if (i === 0 || i === 11) {
      capFill = '#10B981'
      capStroke = '#6EE7B7'
      capGlow = true
    } else if (i === 1 || i === 6) {
      capFill = '#D98A0C'
      capStroke = '#FCD34D'
      capGlow = true
    } else if (i === 4 || i === 9) {
      capFill = '#113029'
      capStroke = '#34D399'
      capGlow = true
    } else if (i === 12) {
      capFill = '#5E6E82'
      capStroke = '#CBD5E1'
      capGlow = true
    }

    list.push({
      key: `f-${i}`,
      cx: Math.round(cx),
      height: baseH,
      capFill,
      capStroke,
      capGlow,
      waveClass: waves[(i + 2) % 4]!,
      dur: Number((3.4 + ((i + 2) % 5) * 0.38).toFixed(2)),
      delay: Number((-(i * 0.48 + 0.35)).toFixed(2)),
      row: 'front',
    })
  }

  return list
})()

const footerLights = [
  { x: 46, y: 42, r: 1.6, fill: '#A7F3D0', dur: 3.4, delay: -0.2 },
  { x: 132, y: 26, r: 1.3, fill: '#FDE68A', dur: 4.2, delay: -1.1 },
  { x: 224, y: 54, r: 1.7, fill: '#00E5A8', dur: 3.8, delay: -0.6 },
  { x: 334, y: 34, r: 1.4, fill: '#E2E8F0', dur: 4.6, delay: -1.9 },
  { x: 448, y: 66, r: 1.5, fill: '#6EE7B7', dur: 3.5, delay: -2.4 },
  { x: 562, y: 40, r: 1.3, fill: '#FDE68A', dur: 4.1, delay: -0.9 },
  { x: 678, y: 58, r: 1.6, fill: '#00E5A8', dur: 3.7, delay: -1.6 },
  { x: 766, y: 44, r: 1.4, fill: '#6EE7B7', dur: 4.3, delay: -0.4 },
  { x: 882, y: 60, r: 1.5, fill: '#A7F3D0', dur: 3.9, delay: -2.1 },
  { x: 994, y: 36, r: 1.3, fill: '#FDE68A', dur: 4.5, delay: -1.2 },
  { x: 1108, y: 56, r: 1.6, fill: '#00E5A8', dur: 3.6, delay: -0.7 },
  { x: 1216, y: 30, r: 1.4, fill: '#E2E8F0', dur: 4.4, delay: -2.0 },
  { x: 1318, y: 48, r: 1.7, fill: '#6EE7B7', dur: 3.8, delay: -0.3 },
  { x: 1396, y: 38, r: 1.5, fill: '#FDE68A', dur: 4.0, delay: -1.5 },
]

// Columns extend well below the 280px viewBox so vertical rise animations never expose bottom edges
const baseY = 330
const rx = 34
const ry = 15

function hexTop(cx: number, topY: number): string {
  const dx = rx * 0.52
  return `${cx - rx},${topY} ${cx - dx},${topY - ry} ${cx + dx},${topY - ry} ${cx + rx},${topY} ${cx + dx},${topY + ry} ${cx - dx},${topY + ry}`
}

function hexLeft(cx: number, topY: number): string {
  const dx = rx * 0.52
  return `${cx - rx},${topY} ${cx - dx},${topY + ry} ${cx - dx},${baseY + ry} ${cx - rx},${baseY}`
}

function hexFront(cx: number, topY: number): string {
  const dx = rx * 0.52
  return `${cx - dx},${topY + ry} ${cx + dx},${topY + ry} ${cx + dx},${baseY + ry} ${cx - dx},${baseY + ry}`
}

function hexRight(cx: number, topY: number): string {
  const dx = rx * 0.52
  return `${cx + dx},${topY + ry} ${cx + rx},${topY} ${cx + rx},${baseY} ${cx + dx},${baseY + ry}`
}
</script>

<template>
  <footer class="relative w-full bg-[#090D12] overflow-hidden pt-10 sm:pt-14 pb-20 sm:pb-24">
    <!-- Full-Width Refreshing Aurora Horizon Wash Behind & Beneath Metadata Card -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-64"
      style="background: radial-gradient(ellipse 84% 88% at 50% 100%, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.08) 54%, transparent 82%);"
      aria-hidden="true"
    />

    <!-- FULL-WIDTH KINETIC 26-COLUMN 3D HEXAGONAL SKYLINE RISING & FALLING SMOOTHLY -->
    <svg
      viewBox="0 0 1440 280"
      preserveAspectRatio="xMidYMax slice"
      class="select-none absolute inset-x-0 bottom-0 w-full h-[258px] sm:h-[290px]"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="footer-prism-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="footer-shaft-mint" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#00E5A8" stop-opacity="0.22" />
          <stop offset="55%" stop-color="#10B981" stop-opacity="0.06" />
          <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="footer-shaft-amber" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.18" />
          <stop offset="55%" stop-color="#F59E0B" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#F59E0B" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Soft Upward Aurora Shimmer Shafts Distributed Across Full Width -->
      <g class="pointer-events-none">
        <rect x="46" y="20" width="56" height="260" fill="url(#footer-shaft-mint)" class="footer-shaft-breathe" />
        <rect x="240" y="42" width="48" height="238" fill="url(#footer-shaft-amber)" class="footer-shaft-breathe" style="animation-delay: -1.4s;" />
        <rect x="520" y="48" width="54" height="232" fill="url(#footer-shaft-mint)" class="footer-shaft-breathe" style="animation-delay: -0.7s;" />
        <rect x="860" y="48" width="54" height="232" fill="url(#footer-shaft-amber)" class="footer-shaft-breathe" style="animation-delay: -2.0s;" />
        <rect x="1152" y="38" width="48" height="242" fill="url(#footer-shaft-mint)" class="footer-shaft-breathe" style="animation-delay: -1.1s;" />
        <rect x="1340" y="24" width="56" height="256" fill="url(#footer-shaft-mint)" class="footer-shaft-breathe" style="animation-delay: -2.5s;" />
      </g>

      <!-- Full-Width Twinkling Starlight Motes -->
      <g class="pointer-events-none">
        <circle
          v-for="(pt, pi) in footerLights"
          :key="`fl-${pi}`"
          :cx="pt.x"
          :cy="pt.y"
          :r="pt.r"
          :fill="pt.fill"
          class="footer-light-twinkle"
          :style="{
            animationDuration: `${pt.dur}s`,
            animationDelay: `${pt.delay}s`,
          }"
        />
      </g>

      <!-- Subtle Perspective Horizon Lines -->
      <g stroke="#1C2738" stroke-width="1" opacity="0.55" class="pointer-events-none">
        <line x1="720" y1="0" x2="120" y2="280" />
        <line x1="720" y1="0" x2="400" y2="280" />
        <line x1="720" y1="0" x2="620" y2="280" />
        <line x1="720" y1="0" x2="820" y2="280" />
        <line x1="720" y1="0" x2="1040" y2="280" />
        <line x1="720" y1="0" x2="1320" y2="280" />
      </g>

      <!-- 26 Continuous Full-Width Isometric Skyline Pillars Rising & Falling Smoothly (Silky CSS Hover Lift!) -->
      <g
        v-for="prism in skylinePrisms"
        :key="prism.key"
        class="cursor-pointer footer-prism-hover-wrap"
        :class="{ 'is-hovered': hoveredPrismKey === prism.key }"
        @mouseenter="hoveredPrismKey = prism.key"
        @mouseleave="hoveredPrismKey = null"
      >
        <g
          class="footer-prism-wave"
          :class="prism.waveClass"
          :style="{
            animationDuration: `${prism.dur}s`,
            animationDelay: `${prism.delay}s`,
          }"
        >
          <polygon
            :points="hexLeft(prism.cx, baseY - prism.height)"
            :fill="prism.row === 'back' ? '#0D121B' : '#101622'"
            :stroke="hoveredPrismKey === prism.key ? '#10B981' : '#233043'"
            stroke-width="0.95"
            class="footer-poly-smooth"
          />
          <polygon
            :points="hexFront(prism.cx, baseY - prism.height)"
            :fill="prism.row === 'back' ? '#111824' : '#151E2C'"
            :stroke="hoveredPrismKey === prism.key ? '#34D399' : '#27354A'"
            stroke-width="0.95"
            class="footer-poly-smooth"
          />
          <polygon
            :points="hexRight(prism.cx, baseY - prism.height)"
            :fill="prism.row === 'back' ? '#0B0F17' : '#0D131D'"
            :stroke="hoveredPrismKey === prism.key ? '#10B981' : '#1F2A3B'"
            stroke-width="0.95"
            class="footer-poly-smooth"
          />
          <polygon
            :points="hexTop(prism.cx, baseY - prism.height)"
            :fill="hoveredPrismKey === prism.key ? '#10B981' : prism.capFill"
            :stroke="hoveredPrismKey === prism.key ? '#A7F3D0' : prism.capStroke"
            :stroke-width="hoveredPrismKey === prism.key || prism.capGlow ? 1.4 : 1"
            :filter="prism.capGlow ? 'url(#footer-prism-glow)' : undefined"
            class="footer-poly-smooth"
          />
        </g>
      </g>
    </svg>

    <!-- Suspended Translucent Metadata Bar Floating Cleanly Over the Living Hexagonal Sea -->
    <div class="relative z-10 mx-auto w-full max-w-[1060px] px-4 sm:px-6 pointer-events-none">
      <div class="pointer-events-auto rounded-xl bg-[#0B0F16]/90 backdrop-blur-md border border-white/15 px-5 sm:px-7 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.88),0_0_40px_rgba(16,185,129,0.08)] space-y-4">
        <!-- Row 1: ASCEND Mark & Wordmark + Modal Links -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <NuxtLink to="/" class="inline-flex items-center gap-2.5 self-start group">
            <UiAscendMark :size="23" class="transition-all duration-mid ease-signal group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.55)]" />
            <span class="font-display font-bold text-[14px] tracking-[0.07em] text-ink-primary">
              ASCEND
            </span>
          </NuxtLink>

          <div class="flex flex-wrap items-center gap-5">
            <button
              v-for="link in HOME_COPY.footer.links"
              :key="link.id"
              type="button"
              class="font-sans text-[13px] text-ink-secondary hover:text-mint transition-colors duration-fast ease-signal cursor-pointer"
              @click="emit('openModal', link.id)"
            >
              {{ link.label }}
            </button>
          </div>
        </div>

        <!-- Row 2: Open Data Sources Strip -->
        <p class="font-mono text-[9.5px] sm:text-[10px] leading-relaxed tracking-[0.1em] uppercase text-ink-muted">
          {{ HOME_COPY.footer.dataSourcesLine }}
        </p>

        <!-- Row 3: Honest Disclaimer + Real Meta Version & Terima kasih -->
        <div class="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11.5px]">
          <p class="font-sans text-ink-secondary">
            {{ HOME_COPY.footer.disclaimer }}
          </p>
          <p class="font-mono text-[10.5px] text-ink-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5 shrink-0">
            <span class="whitespace-nowrap">Data version:</span>
            <span v-if="loadingMeta" class="inline-block h-3 w-24 rounded skeleton-bar align-middle" />
            <span v-else class="text-ink-secondary whitespace-nowrap">{{ dataVersionLabel }}</span>
            <span>·</span>
            <span class="text-mint whitespace-nowrap">{{ HOME_COPY.footer.thanks }}</span>
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-prism-hover-wrap {
  will-change: transform;
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.footer-prism-hover-wrap.is-hovered {
  transform: translate3d(0, -14px, 0);
}

.footer-poly-smooth {
  transition: fill 0.32s ease, stroke 0.32s ease;
}

.footer-prism-wave {
  will-change: transform;
}

/* Concrete numeric keyframes (zero CSS vars inside transform so Chromium SVG compositor runs at 60fps!) */
.footer-wave-a {
  animation: footer-rise-18 4.2s ease-in-out infinite;
}

.footer-wave-b {
  animation: footer-rise-26 4.6s ease-in-out infinite;
}

.footer-wave-c {
  animation: footer-rise-14 3.9s ease-in-out infinite;
}

.footer-wave-d {
  animation: footer-rise-22 4.4s ease-in-out infinite;
}

.footer-light-twinkle {
  animation: footer-mote-twinkle 3.8s ease-in-out infinite;
}

.footer-shaft-breathe {
  animation: footer-shaft-glow 5.5s ease-in-out infinite;
}

@keyframes footer-rise-18 {
  0%, 100% { transform: translate3d(0, 4px, 0); }
  50% { transform: translate3d(0, -18px, 0); }
}

@keyframes footer-rise-26 {
  0%, 100% { transform: translate3d(0, 4px, 0); }
  50% { transform: translate3d(0, -26px, 0); }
}

@keyframes footer-rise-14 {
  0%, 100% { transform: translate3d(0, 4px, 0); }
  50% { transform: translate3d(0, -14px, 0); }
}

@keyframes footer-rise-22 {
  0%, 100% { transform: translate3d(0, 4px, 0); }
  50% { transform: translate3d(0, -22px, 0); }
}

@keyframes footer-mote-twinkle {
  0%, 100% {
    opacity: 0.22;
    transform: translate3d(0, 4px, 0);
  }
  50% {
    opacity: 0.96;
    transform: translate3d(0, -6px, 0);
  }
}

@keyframes footer-shaft-glow {
  0%, 100% { opacity: 0.42; }
  50% { opacity: 0.95; }
}

@media (prefers-reduced-motion: reduce) {
  .footer-wave-a,
  .footer-wave-b,
  .footer-wave-c,
  .footer-wave-d,
  .footer-light-twinkle,
  .footer-shaft-breathe {
    animation: none !important;
  }
}
</style>
