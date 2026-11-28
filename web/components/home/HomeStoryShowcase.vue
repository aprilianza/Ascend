<script setup lang="ts">
import { ChevronsDown } from 'lucide-vue-next'
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)
const { fitReady, isCompact, isTallCompact, homeStickyHeightPx, homeStorySectionHeightPx } = useDesktopFit()

const TOTAL_FRAMES = 72
const FRAME_ASPECT = 16 / 9
const CLIP_VERSION = '3to8'

const sectionRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const reducedMotion = ref(false)
const renderedProgress = ref(0)
const isReady = ref(false)

let targetProgress = 0
let smoothProgress = 0
let rafId = 0
let lastTickTime = 0
let isVisible = true
let intersectionObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let lastDrawnFrame = -1
let lastDrawnScale = -1
let lastDrawnW = 0
let lastDrawnH = 0
let unmounted = false

const frames: Array<HTMLImageElement | null> = Array.from({ length: TOTAL_FRAMES }, () => null)
const loadedFlags: boolean[] = Array.from({ length: TOTAL_FRAMES }, () => false)

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function frameUrl(index: number): string {
  return `/frames/story/frame_${String(index).padStart(3, '0')}.webp?v=${CLIP_VERSION}`
}

// Progressive priority order: first & last -> every 6th -> every 2nd -> remaining
function buildPreloadOrder(): number[] {
  const seen = new Set<number>()
  const order: number[] = []
  const push = (idx: number) => {
    if (idx >= 0 && idx < TOTAL_FRAMES && !seen.has(idx)) {
      seen.add(idx)
      order.push(idx)
    }
  }
  push(0)
  push(TOTAL_FRAMES - 1)
  for (let i = 0; i < TOTAL_FRAMES; i += 6) push(i)
  for (let i = 0; i < TOTAL_FRAMES; i += 2) push(i)
  for (let i = 0; i < TOTAL_FRAMES; i += 1) push(i)
  return order
}

function preloadFrames() {
  const queue = buildPreloadOrder()
  const CONCURRENCY = 6
  let cursor = 0

  function loadNext() {
    if (unmounted || cursor >= queue.length) return
    const idx = queue[cursor++]!
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (unmounted) return
      frames[idx] = img
      loadedFlags[idx] = true
      if (idx === 0 || idx === TOTAL_FRAMES - 1) {
        isReady.value = true
      }
      // Redraw immediately if this frame is close to the currently displayed index
      drawCanvas(true)
      loadNext()
    }
    img.onerror = () => {
      loadNext()
    }
    img.src = frameUrl(idx)
  }

  for (let c = 0; c < CONCURRENCY; c++) {
    loadNext()
  }
}

function findNearestLoadedFrame(desired: number): HTMLImageElement | null {
  if (loadedFlags[desired] && frames[desired]) return frames[desired]
  for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
    const down = desired - offset
    if (down >= 0 && loadedFlags[down] && frames[down]) return frames[down]
    const up = desired + offset
    if (up < TOTAL_FRAMES && loadedFlags[up] && frames[up]) return frames[up]
  }
  return null
}

// Compute camera zoom scale & video frame index from scroll progress [0..1]
// 0.00 -> 0.12 : Brief pure black fade-in buffer
// 0.12 -> 0.72 : Video (3.0s -> 8.0s) scrubs 0..71 while zooming smoothly OUT from center (2.18x -> 1.00x)
// 0.72 -> 0.78 : Brief panoramic hold showing ASCEND & all 4 illuminated landmarks
// 0.78 -> 0.96 : GTA VI style blackout fade-out + gentle scale recede while "Busy isn't room." glides up over it
function computeVisualState(p: number) {
  const scrubLinear = clamp((p - 0.12) / (0.72 - 0.12), 0, 1)
  const frameIndex = Math.round(scrubLinear * (TOTAL_FRAMES - 1))

  const zoomT = clamp((p - 0.12) / (0.72 - 0.12), 0, 1)
  const zoomEase = 1 - Math.pow(1 - zoomT, 2.3)
  const isPortrait = !(fitReady.value && isCompact.value) && typeof window !== 'undefined' && window.innerWidth < window.innerHeight
  const startZoom = isPortrait ? 2.55 : 2.18
  const baseScale = startZoom - (startZoom - 1.0) * zoomEase

  // Subtle GTA VI recede during the blackout fade-out (0.78 -> 0.98)
  const exitT = smoothstep(0.78, 0.98, p)
  const scale = baseScale - exitT * 0.055

  // Focal shift: centered on Bandung skyline & rising ASCEND monument while zoomed in
  const focalX = 0.505 - 0.005 * zoomEase
  const focalY = 0.485 + 0.015 * zoomEase

  return { frameIndex, scale, focalX, focalY, scrubLinear, exitT }
}

function drawCanvas(force = false) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const cssW = Math.max(1, Math.round(rect.width))
  const cssH = Math.max(1, Math.round(rect.height))
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
  const pixelW = Math.round(cssW * dpr)
  const pixelH = Math.round(cssH * dpr)

  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW
    canvas.height = pixelH
    force = true
  }

  const p = reducedMotion.value ? 0.78 : smoothProgress
  const { frameIndex, scale, focalX, focalY } = computeVisualState(p)

  if (
    !force
    && frameIndex === lastDrawnFrame
    && Math.abs(scale - lastDrawnScale) < 0.0004
    && pixelW === lastDrawnW
    && pixelH === lastDrawnH
  ) {
    return
  }

  const img = findNearestLoadedFrame(frameIndex)
  ctx.fillStyle = '#020406'
  ctx.fillRect(0, 0, pixelW, pixelH)

  if (!img) return

  // Fit base 16:9 frame so at scale = 1.00 ALL 4 buildings (A-SHOP, Kiosk, Gedung Sate, Ruko)
  // are 100% visible with zero horizontal edge clipping across desktop & mobile!
  // On wide displays (>= 16:9), fill width and cover cleanly; on 16:10 or portrait, fit width
  // so the zoomed-in start is full-bleed and zoom-out reveals the full cinema panorama.
  const viewAspect = pixelW / pixelH
  let baseW: number
  let baseH: number
  if (viewAspect >= FRAME_ASPECT) {
    baseW = pixelW
    baseH = pixelW / FRAME_ASPECT
  } else {
    baseW = pixelW
    baseH = pixelW / FRAME_ASPECT
    // On moderately taller desktop viewports (like 1440x900 = 1.60), give a tiny 3% bleed
    // while keeping all 4 landmarks comfortably inside the viewport.
    if (viewAspect >= 1.45) {
      baseW = pixelW * 1.03
      baseH = baseW / FRAME_ASPECT
    }
  }

  const drawW = baseW * scale
  const drawH = baseH * scale
  const dx = pixelW * 0.5 - drawW * focalX
  const dy = pixelH * 0.5 - drawH * focalY

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, dx, dy, drawW, drawH)

  // Feather top & bottom edges of the drawn panorama directly into #020406
  // so mobile portrait and 16:10 viewports melt seamlessly with zero hard rectangle seams
  const topEdge = Math.max(0, dy)
  const topFadeH = Math.max(24 * dpr, drawH * 0.12)
  const topGrad = ctx.createLinearGradient(0, topEdge, 0, topEdge + topFadeH)
  topGrad.addColorStop(0, 'rgba(2, 4, 6, 0.96)')
  topGrad.addColorStop(0.55, 'rgba(2, 4, 6, 0.34)')
  topGrad.addColorStop(1, 'rgba(2, 4, 6, 0)')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, topEdge - 2, pixelW, topFadeH + 4)

  const bottomEdge = Math.min(pixelH, dy + drawH)
  const bottomFadeH = Math.max(28 * dpr, drawH * 0.15)
  const botGrad = ctx.createLinearGradient(0, bottomEdge - bottomFadeH, 0, bottomEdge)
  botGrad.addColorStop(0, 'rgba(2, 4, 6, 0)')
  botGrad.addColorStop(0.5, 'rgba(2, 4, 6, 0.38)')
  botGrad.addColorStop(1, 'rgba(2, 4, 6, 0.98)')
  ctx.fillStyle = botGrad
  ctx.fillRect(0, bottomEdge - bottomFadeH - 2, pixelW, bottomFadeH + 4)

  lastDrawnFrame = frameIndex
  lastDrawnScale = scale
  lastDrawnW = pixelW
  lastDrawnH = pixelH
}

function measureScrollProgress() {
  if (!sectionRef.value) return
  const rect = sectionRef.value.getBoundingClientRect()
  const vh = window.innerHeight || 900
  if (fitReady.value && isTallCompact.value) {
    const stageH = stageRef.value?.getBoundingClientRect().height || Math.min(vh, 260)
    const startY = Math.min(vh * 0.42, 340)
    const endY = -(rect.height - stageH)
    targetProgress = clamp((startY - rect.top) / Math.max(1, startY - endY), 0, 1)
    return
  }
  const scrollable = Math.max(1, rect.height - vh)
  targetProgress = clamp(-rect.top / scrollable, 0, 1)
}

function tick(now: number) {
  if (unmounted) return
  const dt = lastTickTime > 0 ? Math.min(0.06, Math.max(0.004, (now - lastTickTime) / 1000)) : 1 / 60
  lastTickTime = now
  const diff = targetProgress - smoothProgress
  if (Math.abs(diff) > 0.00035) {
    // Frame-rate-independent exponential smoothing: buttery 60fps yet settles cleanly in ~260ms
    const blend = 1 - Math.exp(-15 * dt)
    smoothProgress += diff * blend
    renderedProgress.value = smoothProgress
    drawCanvas(false)
    rafId = window.requestAnimationFrame(tick)
  } else {
    if (smoothProgress !== targetProgress) {
      smoothProgress = targetProgress
      renderedProgress.value = smoothProgress
      drawCanvas(false)
    }
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

// Computed overlay opacities synchronized with smooth scroll progress
const videoOpacity = computed(() => {
  if (reducedMotion.value) return 1
  const p = renderedProgress.value
  if (fitReady.value && isTallCompact.value) {
    return 0.92 + 0.08 * smoothstep(0.05, 0.22, p)
  }
  return smoothstep(0.11, 0.22, p)
})

const introWhisperOpacity = computed(() => {
  if (reducedMotion.value || (fitReady.value && isTallCompact.value)) return 0
  const p = renderedProgress.value
  const fadeIn = 0.25 + 0.75 * smoothstep(0.0, 0.04, p)
  const fadeOut = 1 - smoothstep(0.08, 0.125, p)
  return fadeIn * fadeOut
})

const exitBlackVeilOpacity = computed(() => {
  if (reducedMotion.value) return 0
  const p = renderedProgress.value
  if (fitReady.value && isTallCompact.value) {
    return smoothstep(0.84, 0.99, p) * 0.55
  }
  // GTA VI style blackout darken starting right as "Busy isn't room." glides up (0.74 -> 0.92)
  return smoothstep(0.74, 0.92, p)
})

const hudOpacity = computed(() => {
  if (reducedMotion.value) return 0
  const p = renderedProgress.value
  const fadeIn = smoothstep(0.18, 0.26, p)
  const fadeOut = 1 - smoothstep(0.72, 0.78, p)
  return fadeIn * fadeOut
})

const skipButtonOpacity = computed(() => {
  if (reducedMotion.value) return 0
  const p = renderedProgress.value
  const fadeIn = smoothstep(0.01, 0.07, p)
  const fadeOut = 1 - smoothstep(0.72, 0.78, p)
  return fadeIn * fadeOut
})

const hudFillPct = computed(() => {
  const p = renderedProgress.value
  return clamp((p - 0.12) / (0.72 - 0.12), 0, 1) * 100
})

const hudStatusText = computed(() => {
  return renderedProgress.value >= 0.68
    ? HOME_COPY.value.storyShowcase.completeLabel
    : HOME_COPY.value.storyShowcase.zoomHint
})

function skipToContent() {
  const target = document.getElementById('busy-header') || document.getElementById('latar-belakang')
  if (!target) return
  const y = target.getBoundingClientRect().top + window.scrollY - 104
  window.scrollTo({
    top: Math.max(0, y),
    behavior: reducedMotion.value ? 'auto' : 'smooth',
  })
}

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  preloadFrames()
  measureScrollProgress()
  smoothProgress = targetProgress
  renderedProgress.value = smoothProgress
  drawCanvas(true)

  if (!reducedMotion.value) {
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  if (sectionRef.value && 'IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isVisible = Boolean(entry?.isIntersecting)
        if (isVisible) {
          measureScrollProgress()
          scheduleTick()
        }
      },
      { rootMargin: '200px 0px 200px 0px' },
    )
    intersectionObserver.observe(sectionRef.value)
  }

  if (canvasRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      measureScrollProgress()
      if (!rafId) {
        smoothProgress = targetProgress
        renderedProgress.value = smoothProgress
      }
      drawCanvas(true)
    })
    resizeObserver.observe(canvasRef.value)
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
  <section
    id="story-showcase"
    ref="sectionRef"
    :aria-label="HOME_COPY.storyShowcase.ariaLabel"
    class="relative z-10 w-full bg-[#020406] select-none"
    :class="reducedMotion ? 'h-[78svh] min-h-[460px]' : fitReady && isCompact ? '' : 'h-[470vh]'"
    :style="!reducedMotion && fitReady && isCompact && homeStorySectionHeightPx ? { height: `${homeStorySectionHeightPx}px` } : undefined"
  >
    <!-- Pinned Full-Viewport Cinema Stage -->
    <div
      ref="stageRef"
      class="w-full overflow-hidden bg-[#020406]"
      :class="reducedMotion ? 'relative h-full' : fitReady && isCompact ? 'sticky top-0' : 'sticky top-0 h-[100svh]'"
      :style="!reducedMotion && fitReady && isCompact && homeStickyHeightPx ? { height: `${homeStickyHeightPx}px` } : undefined"
    >
      <!-- Hardware-Accelerated Scroll-Scrubbed Panorama Canvas -->
      <div
        class="absolute inset-0 w-full h-full will-change-[opacity]"
        :style="{ opacity: videoOpacity.toFixed(4) }"
      >
        <canvas
          ref="canvasRef"
          class="block w-full h-full"
          aria-hidden="true"
        />

        <!-- Soft Cinema Letterbox & Radial Edge Feather (blends 16:9 panorama seamlessly into #020406) -->
        <div
          class="pointer-events-none absolute inset-0"
          style="background:
            linear-gradient(180deg, rgba(2, 4, 6, 0.92) 0%, rgba(2, 4, 6, 0.28) 12%, transparent 24%, transparent 76%, rgba(2, 4, 6, 0.34) 88%, rgba(2, 4, 6, 0.96) 100%),
            radial-gradient(ellipse 84% 78% at 50% 50%, transparent 56%, rgba(2, 4, 6, 0.52) 100%);"
          aria-hidden="true"
        />
      </div>

      <!-- Subtle Emerald Atmosphere Glow Behind Intro Black Buffer -->
      <div
        v-if="!reducedMotion"
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-none"
        :style="{ opacity: introWhisperOpacity.toFixed(4) }"
        aria-hidden="true"
      >
        <div
          class="w-40 h-40 rounded-full blur-3xl opacity-35 mb-2"
          style="background: radial-gradient(circle, rgba(16, 185, 129, 0.45), transparent 72%);"
        />
        <div class="inline-flex items-center gap-2.5 -mt-20">
          <span class="w-1.5 h-1.5 rounded-full bg-mint shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
          <span class="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#8FA8AC]">
            {{ HOME_COPY.storyShowcase.introWhisper }}
          </span>
        </div>
      </div>

      <!-- Ultra-Minimal Bottom Scroll Progress Hairline (stacked cleanly above Skip button on mobile) -->
      <div
        v-if="!reducedMotion"
        class="pointer-events-none absolute bottom-9 inset-x-0 z-10 flex flex-col items-center gap-2.5 px-6"
        :style="{ opacity: hudOpacity.toFixed(4) }"
        aria-hidden="true"
      >
        <span class="font-mono text-[9.5px] uppercase tracking-[0.24em] text-[#B7CDD0]/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
          {{ hudStatusText }}
        </span>
        <div class="w-32 sm:w-40 h-[2px] rounded-full bg-white/15 overflow-hidden backdrop-blur-sm">
          <div
            class="h-full rounded-full bg-gradient-to-r from-[#14B8A6] via-[#00E5A8] to-[#F59E0B] shadow-[0_0_10px_rgba(0,229,168,0.85)]"
            :style="{ width: `${hudFillPct.toFixed(2)}%` }"
          />
        </div>
      </div>

      <!-- GTA VI Style Black Curtain Veil Synchronized With "Busy isn't room." Glide-In -->
      <div
        v-if="!reducedMotion"
        class="pointer-events-none absolute inset-0 z-20 will-change-[opacity]"
        :style="{
          opacity: exitBlackVeilOpacity.toFixed(4),
          background: 'linear-gradient(180deg, #020406 0%, #070B10 55%, #0F1115 100%)',
        }"
        aria-hidden="true"
      />

      <!-- Sleek Floating "Skip this clip" Action Button (centered below bar on mobile, bottom-right on desktop) -->
      <div
        v-if="!reducedMotion"
        class="absolute bottom-8 right-8 z-30 transition-none"
        :class="skipButtonOpacity > 0.08 ? 'pointer-events-auto' : 'pointer-events-none'"
        :style="{ opacity: skipButtonOpacity.toFixed(4) }"
      >
        <button
          type="button"
          class="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/15 bg-[#070B10]/80 hover:bg-[#0D1A18]/90 hover:border-[#00E5A8]/65 backdrop-blur-md font-mono text-[10px] uppercase tracking-[0.16em] text-[#CBD5E1] hover:text-[#00E5A8] shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-all duration-fast cursor-pointer"
          @click="skipToContent"
        >
          <span>{{ HOME_COPY.storyShowcase.skipClip }}</span>
          <ChevronsDown class="w-3.5 h-3.5 text-mint transition-transform duration-fast group-hover:translate-y-0.5" :stroke-width="2" />
        </button>
      </div>

      <!-- Subtle loading fallback state (only visible if frame 0 not ready yet) -->
      <span v-if="!isReady" class="sr-only">Loading night city panorama showcase</span>
    </div>
  </section>
</template>
