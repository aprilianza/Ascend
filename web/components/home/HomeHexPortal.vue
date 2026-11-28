<script setup lang="ts">
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)
const { fitReady, isCompact, homeStickyHeightPx, homePortalSectionHeightPx } = useDesktopFit()

// 6 airy, luminous concentric hexagons (crisp, serene, 60fps)
const RING_COUNT = 6
const PARTICLE_COUNT = 22

const sectionRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const reducedMotion = ref(false)
const renderedP = ref(0)

let targetP = 0
let smoothP = 0
let rafId = 0
let lastTickTime = 0
let isVisible = true
let intersectionObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let unmounted = false

// Deterministic seeded ambient open-data starlight specks
const particles = Array.from({ length: PARTICLE_COUNT }, (_, idx) => {
  const angle = ((idx * 137.508) % 360) * (Math.PI / 180)
  const depthSeed = (idx * 0.61803398875) % 1
  const radiusBias = 0.28 + ((idx * 19) % 100) / 145
  const size = 1.0 + ((idx * 7) % 8) * 0.13
  const isMint = idx % 3 !== 0
  return { angle, depthSeed, radiusBias, size, isMint }
})

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function drawKawungPetal(
  ctx: CanvasRenderingContext2D,
  vx: number,
  vy: number,
  angle: number,
  petalLen: number,
  alpha: number,
  color: string,
) {
  if (petalLen < 3 || alpha <= 0.01) return
  ctx.save()
  ctx.translate(vx, vy)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(petalLen * 0.52, -petalLen * 0.34, petalLen, 0)
  ctx.quadraticCurveTo(petalLen * 0.52, petalLen * 0.34, 0, 0)
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha * 0.72
  ctx.lineWidth = 1.15
  ctx.stroke()
  ctx.restore()
}

function drawPortal(p: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const cssW = Math.max(1, Math.round(rect.width))
  const cssH = Math.max(1, Math.round(rect.height))
  const dpr = Math.min(window.devicePixelRatio || 1, 1.8)
  const w = Math.round(cssW * dpr)
  const h = Math.round(cssH * dpr)

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }

  ctx.save()
  ctx.scale(dpr, dpr)

  // Seamless canvas backdrop: pure #060A0F during dark breath -> warms to #0F1115 (Solution ground)
  const bgBlend = smoothstep(0.18, 0.72, p)
  const rBg = Math.round(lerp(6, 15, bgBlend))
  const gBg = Math.round(lerp(10, 17, bgBlend))
  const bBg = Math.round(lerp(15, 21, bgBlend))
  ctx.fillStyle = `rgb(${rBg}, ${gBg}, ${bBg})`
  ctx.fillRect(0, 0, cssW, cssH)

  // Beat 0 (0.00 -> 0.08): pure serene dark breath right below SCROLL pill
  // Beat 1 (0.08 -> 0.30): concentric hexagons emerge smoothly FIRST with zero text yet
  // Beat 2..End (0.30 -> 1.00): hexagons STAY 100% alive and unstick naturally into Solution
  const hexAlpha = reducedMotion.value ? 1 : smoothstep(0.06, 0.28, p)
  if (hexAlpha <= 0.004) {
    ctx.restore()
    return
  }

  const cx = cssW * 0.5
  const cy = cssH * 0.5
  const minDim = Math.min(cssW, cssH)
  const maxDim = Math.max(cssW, cssH)

  // Soft breathing emerald/teal depth aura
  const auraStrength = (0.16 + 0.07 * smoothstep(0.12, 0.65, p)) * hexAlpha
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDim * 0.52)
  aura.addColorStop(0, `rgba(16, 185, 129, ${(auraStrength * 1.12).toFixed(4)})`)
  aura.addColorStop(0.4, `rgba(20, 184, 166, ${(auraStrength * 0.52).toFixed(4)})`)
  aura.addColorStop(0.75, 'rgba(6, 14, 16, 0.06)')
  aura.addColorStop(1, 'rgba(6, 10, 15, 0)')
  ctx.fillStyle = aura
  ctx.fillRect(0, 0, cssW, cssH)

  // Subtle radial architectural guidelines
  ctx.save()
  ctx.strokeStyle = '#10B981'
  ctx.globalAlpha = 0.045 * hexAlpha
  ctx.lineWidth = 1
  ctx.setLineDash([3, 11])
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k + p * 0.1
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * minDim * 0.06, cy + Math.sin(a) * minDim * 0.06)
    ctx.lineTo(cx + Math.cos(a) * maxDim * 0.8, cy + Math.sin(a) * maxDim * 0.8)
    ctx.stroke()
  }
  ctx.restore()

  // Silky, unhurried perspective glide (graceful expansion without any vertigo)
  const travel = p * 0.54

  // Ambient starlight dust motes drifting softly outward
  for (const pt of particles) {
    const z = (pt.depthSeed + travel * 0.36) % 1
    const radial = minDim * 0.06 * Math.pow(15.2, z) * pt.radiusBias
    const px = cx + Math.cos(pt.angle + p * 0.13) * radial
    const py = cy + Math.sin(pt.angle + p * 0.13) * radial
    if (px < -10 || px > cssW + 10 || py < -10 || py > cssH + 10) continue

    const pAlpha = smoothstep(0.06, 0.28, z) * (1 - smoothstep(0.84, 1.0, z)) * 0.44 * hexAlpha
    if (pAlpha <= 0.01) continue
    ctx.beginPath()
    ctx.arc(px, py, pt.size * (0.65 + z * 0.72), 0, Math.PI * 2)
    ctx.fillStyle = pt.isMint ? '#34D399' : '#94A3B8'
    ctx.globalAlpha = pAlpha
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // 6 Crisp Concentric Rotating Hexagon Rings (always alive through the natural scroll handoff)
  const ringEntries: Array<{ idx: number; t: number }> = []
  for (let i = 0; i < RING_COUNT; i++) {
    const t = ((i / RING_COUNT) + 0.08 + travel) % 1
    ringEntries.push({ idx: i, t })
  }
  ringEntries.sort((a, b) => a.t - b.t)

  const palette = ['#10B981', '#14B8A6', '#34D399', '#00E5A8', '#10B981', '#14B8A6']

  for (const { idx, t } of ringEntries) {
    const radius = minDim * 0.08 * Math.pow(18.2, t)
    if (radius < 12 || radius > maxDim * 1.48) continue

    const depthFadeIn = smoothstep(0.0, 0.22, t)
    const depthFadeOut = 1 - smoothstep(0.88, 1.0, t)
    const ringAlpha = depthFadeIn * depthFadeOut * (0.32 + t * 0.62) * hexAlpha
    if (ringAlpha <= 0.01) continue

    const dir = idx % 2 === 0 ? 1 : -1
    const baseAngle = -Math.PI / 6 + idx * 0.18
    const rot = baseAngle + dir * (p * 0.28 + t * 0.19)
    const color = palette[idx % palette.length]!
    const lineWidth = 0.9 + t * 1.35

    const verts: Array<{ x: number; y: number; a: number }> = []
    for (let v = 0; v < 6; v++) {
      const a = rot + (Math.PI / 3) * v
      verts.push({
        x: cx + Math.cos(a) * radius,
        y: cy + Math.sin(a) * radius,
        a,
      })
    }

    // Soft outer luminous halo on mid and foreground rings
    if (t > 0.34) {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(verts[0]!.x, verts[0]!.y)
      for (let v = 1; v < 6; v++) ctx.lineTo(verts[v]!.x, verts[v]!.y)
      ctx.closePath()
      ctx.strokeStyle = color
      ctx.globalAlpha = ringAlpha * 0.18
      ctx.lineWidth = lineWidth + 4
      ctx.stroke()
      ctx.restore()
    }

    // Primary crisp hexagon stroke
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(verts[0]!.x, verts[0]!.y)
    for (let v = 1; v < 6; v++) ctx.lineTo(verts[v]!.x, verts[v]!.y)
    ctx.closePath()
    ctx.strokeStyle = color
    ctx.globalAlpha = ringAlpha
    ctx.lineWidth = lineWidth
    ctx.stroke()
    ctx.restore()

    // Parallel inner dotted architectural track on alternating rings
    if (idx % 2 === 1 && radius > 46) {
      const innerR = radius * 0.946
      ctx.save()
      ctx.beginPath()
      for (let v = 0; v < 6; v++) {
        const a = verts[v]!.a
        const ix = cx + Math.cos(a) * innerR
        const iy = cy + Math.sin(a) * innerR
        if (v === 0) ctx.moveTo(ix, iy)
        else ctx.lineTo(ix, iy)
      }
      ctx.closePath()
      ctx.strokeStyle = '#34D399'
      ctx.globalAlpha = ringAlpha * 0.42
      ctx.lineWidth = 0.9
      ctx.setLineDash([2.5, 7])
      ctx.stroke()
      ctx.restore()
    }

    // Crisp Wajik diamond vertices and delicate Nusantara Kawung corner petals
    const diamondR = 2.0 + t * 3.4
    const showPetals = idx % 2 === 0 && radius > 62
    const petalLen = 9 + t * 16

    for (const vt of verts) {
      if (showPetals) {
        drawKawungPetal(ctx, vt.x, vt.y, vt.a, petalLen, ringAlpha, color)
      }

      ctx.save()
      ctx.translate(vt.x, vt.y)
      ctx.rotate(vt.a + Math.PI / 4)
      ctx.fillStyle = t > 0.62 ? '#ECFDF5' : color
      ctx.globalAlpha = Math.min(1, ringAlpha * 1.18)
      ctx.fillRect(-diamondR * 0.5, -diamondR * 0.5, diamondR, diamondR)
      ctx.restore()
    }
  }

  // Soft top feather into Blindspots dark fade (#060A0F)
  const topFeatherH = Math.min(115, cssH * 0.14)
  const topFeather = ctx.createLinearGradient(0, 0, 0, topFeatherH)
  topFeather.addColorStop(0, `rgb(${rBg}, ${gBg}, ${bBg})`)
  topFeather.addColorStop(1, `rgba(${rBg}, ${gBg}, ${bBg}, 0)`)
  ctx.fillStyle = topFeather
  ctx.fillRect(0, 0, cssW, topFeatherH)

  // Soft bottom feather melting cleanly into Solution ground (#0F1115) when portal unsticks
  const bottomFeatherH = Math.min(175, cssH * 0.22)
  const bottomFeather = ctx.createLinearGradient(0, cssH - bottomFeatherH, 0, cssH)
  bottomFeather.addColorStop(0, `rgba(${rBg}, ${gBg}, ${bBg}, 0)`)
  bottomFeather.addColorStop(0.62, `rgba(${rBg}, ${gBg}, ${bBg}, 0.58)`)
  bottomFeather.addColorStop(1, `rgb(${rBg}, ${gBg}, ${bBg})`)
  ctx.fillStyle = bottomFeather
  ctx.fillRect(0, cssH - bottomFeatherH, cssW, bottomFeatherH)

  ctx.restore()
}

function measureScrollProgress() {
  if (!sectionRef.value) return
  const rect = sectionRef.value.getBoundingClientRect()
  const vh = window.innerHeight || 900
  const scrollable = Math.max(1, rect.height - vh)
  targetP = clamp(-rect.top / scrollable, 0, 1)
}

function tick(now: number) {
  if (unmounted) return
  const dt = lastTickTime > 0 ? Math.min(0.06, Math.max(0.004, (now - lastTickTime) / 1000)) : 1 / 60
  lastTickTime = now
  const diff = targetP - smoothP
  if (Math.abs(diff) > 0.00025) {
    // Silky inertial damping for liquid-smooth scroll feel
    const blend = 1 - Math.exp(-9.5 * dt)
    smoothP += diff * blend
    renderedP.value = smoothP
    drawPortal(smoothP)
    rafId = window.requestAnimationFrame(tick)
  } else {
    if (smoothP !== targetP) {
      smoothP = targetP
      renderedP.value = smoothP
      drawPortal(smoothP)
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

// Choreography:
// 0.00 -> 0.08: pure dark breath
// 0.08 -> 0.30: concentric hexagons emerge FIRST (title still hidden)
// 0.32 -> 0.62: "THE COUNTING LAYER" blooms smoothly out of the hexagon center
// 0.62 -> 1.00: stays solid opacity 1 as the whole sticky scene glides cleanly upward into Solution
const layerTitleStyle = computed(() => {
  if (reducedMotion.value) {
    return { opacity: '1', transform: 'translate3d(0, 0, 0) scale(1)' }
  }
  const p = renderedP.value
  const reveal = smoothstep(0.32, 0.6, p)
  const scale = lerp(0.88, 1.02, smoothstep(0.32, 0.96, p))
  const risePx = lerp(18, 0, reveal)
  return {
    opacity: reveal.toFixed(4),
    transform: `translate3d(0, ${risePx.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`,
  }
})

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion.value) {
    smoothP = 0.68
    renderedP.value = smoothP
    drawPortal(smoothP)
    return
  }

  measureScrollProgress()
  smoothP = targetP
  renderedP.value = smoothP
  drawPortal(smoothP)

  window.addEventListener('scroll', onScroll, { passive: true })

  if (sectionRef.value && 'IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = Boolean(entries[0]?.isIntersecting)
        if (isVisible) {
          measureScrollProgress()
          scheduleTick()
        }
      },
      { rootMargin: '220px 0px 220px 0px' },
    )
    intersectionObserver.observe(sectionRef.value)
  }

  if (canvasRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      measureScrollProgress()
      if (!rafId) {
        smoothP = targetP
        renderedP.value = smoothP
      }
      drawPortal(smoothP)
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
    id="counting-portal"
    ref="sectionRef"
    aria-label="The Counting Layer open data transition"
    class="relative z-10 w-full select-none"
    :style="[
      { background: 'linear-gradient(180deg, #060A0F 0%, #0A0E14 48%, #0F1115 100%)' },
      !reducedMotion && fitReady && isCompact && homePortalSectionHeightPx
        ? { height: `${homePortalSectionHeightPx}px` }
        : undefined,
    ]"
    :class="reducedMotion ? 'h-[480px]' : fitReady && isCompact ? '' : 'h-[205vh]'"
  >
    <!-- Smooth Pinned Concentric Hexagon Stage: dark breath -> hexagons -> title -> natural unstick into Solution -->
    <div
      class="w-full overflow-hidden"
      :class="reducedMotion ? 'relative h-full' : fitReady && isCompact ? 'sticky top-0' : 'sticky top-0 h-[100svh]'"
      :style="
        !reducedMotion && fitReady && isCompact && homeStickyHeightPx
          ? { height: `${homeStickyHeightPx}px` }
          : undefined
      "
    >
      <canvas
        ref="canvasRef"
        class="block w-full h-full"
        aria-hidden="true"
      />

      <!-- The Counting Layer Title Reveal (stays 100% crisp and scrolls smoothly upward with its hexagons) -->
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 will-change-[opacity,transform]"
        :style="layerTitleStyle"
      >
        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#091513]/85 border border-mint/40 font-mono text-[10px] uppercase tracking-[0.2em] text-mint backdrop-blur-sm">
          <UiKawungIcon :size="13" class="text-mint" />
          <span>{{ HOME_COPY.portal.layerTag }}</span>
        </div>

        <h2 class="mt-4 font-display font-extrabold text-[62px] tracking-[0.04em] leading-[1.04] bg-gradient-to-r from-[#14B8A6] via-[#F8FAFC] to-[#10B981] bg-clip-text text-transparent drop-shadow-[0_6px_28px_rgba(16,185,129,0.22)]">
          {{ HOME_COPY.portal.title }}
        </h2>

        <p class="mt-3.5 max-w-lg font-sans text-[16px] leading-relaxed text-[#CBD5E1]/90">
          {{ HOME_COPY.portal.subtitle }}
        </p>
      </div>
    </div>
  </section>
</template>
