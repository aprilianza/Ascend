<script setup lang="ts">
import { DIORAMA_BUILDINGS, type LandmarkId } from '~/utils/dioramaBuildings'

const props = withDefaults(
  defineProps<{
    hoveredId?: LandmarkId | null
    activeModalId?: LandmarkId | null
    buildGenerationKey?: number
    backdropSrc?: string
  }>(),
  {
    hoveredId: null,
    activeModalId: null,
    buildGenerationKey: 0,
    backdropSrc: '/images/ascend-hero-3d-bg.jpg',
  },
)

const emit = defineEmits<{
  'update:hoveredId': [id: LandmarkId | null]
  inspect: [id: LandmarkId]
}>()

// =========================================================================
// 1. EXACT ASPECT-LOCKED COVER STAGE MATH (1376x768) + SMOOTH PARALLAX
// =========================================================================
const IMG_RATIO = 1376 / 768
const rootRef = ref<HTMLElement | null>(null)
const particleHostRef = ref<HTMLElement | null>(null)

const stageSize = ref({ w: 1620, h: 904 })
const pointerActive = ref(false)
const pointerPx = ref({ x: 720, y: 310 })
const targetPx = { x: 720, y: 310 }
const parallax = ref({ x: 0, y: 0 })
const reducedMotion = ref(false)

let rafId = 0
let idlePhase = 0
let resizeObserver: ResizeObserver | null = null
let threeCleanup: (() => void) | null = null

const activeHighlightId = computed<LandmarkId | null>(() => props.hoveredId ?? props.activeModalId ?? null)

function updateStageDimensions() {
  const el = rootRef.value
  if (!el) return
  const vw = el.clientWidth || window.innerWidth || 1440
  const vh = el.clientHeight || window.innerHeight || 900
  const viewRatio = vw / Math.max(1, vh)
  const overscan = 1.04
  if (viewRatio > IMG_RATIO) {
    const w = vw * overscan
    stageSize.value = { w, h: w / IMG_RATIO }
  }
  else {
    const h = vh * overscan
    stageSize.value = { w: h * IMG_RATIO, h }
  }
}

function onWindowPointerMove(e: PointerEvent) {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (e.clientY > rect.bottom + 80) {
    pointerActive.value = false
    return
  }
  targetPx.x = e.clientX - rect.left
  targetPx.y = e.clientY - rect.top
  pointerActive.value = true
}

function onDocumentMouseLeave() {
  pointerActive.value = false
}

function tickMotion() {
  idlePhase += 0.012
  const el = rootRef.value
  const vw = el?.clientWidth || 1440
  const vh = el?.clientHeight || 900

  if (!pointerActive.value) {
    targetPx.x = vw * 0.5 + Math.cos(idlePhase) * (vw * 0.14)
    targetPx.y = vh * 0.32 + Math.sin(idlePhase * 1.2) * (vh * 0.09)
  }

  pointerPx.value.x += (targetPx.x - pointerPx.value.x) * 0.11
  pointerPx.value.y += (targetPx.y - pointerPx.value.y) * 0.11

  const nx = (pointerPx.value.x / Math.max(1, vw) - 0.5) * 2
  const ny = (pointerPx.value.y / Math.max(1, vh) - 0.5) * 2
  parallax.value.x = -nx * 14
  parallax.value.y = -ny * 9

  rafId = window.requestAnimationFrame(tickMotion)
}

const hexCursorMaskStyle = computed(() => {
  const x = pointerPx.value.x.toFixed(1)
  const y = pointerPx.value.y.toFixed(1)
  const radius = pointerActive.value ? '255px' : '190px'
  const mask = `radial-gradient(${radius} circle at ${x}px ${y}px, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.40) 45%, rgba(0,0,0,0.06) 72%, transparent 100%)`
  return {
    maskImage: mask,
    WebkitMaskImage: mask,
  }
})

function handleBuildingEnter(id: LandmarkId) {
  emit('update:hoveredId', id)
}

function handleBuildingLeave(id: LandmarkId) {
  if (props.hoveredId === id) {
    emit('update:hoveredId', null)
  }
}

function handleBuildingClick(id: LandmarkId) {
  emit('inspect', id)
}

// =========================================================================
// 2. LIGHTWEIGHT THREE.JS AMBIENT FIREFLIES & DATA NODES OVER THE VALLEY
// =========================================================================
onMounted(async () => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  updateStageDimensions()

  if (rootRef.value) {
    resizeObserver = new ResizeObserver(updateStageDimensions)
    resizeObserver.observe(rootRef.value)
  }

  window.addEventListener('pointermove', onWindowPointerMove, { passive: true })
  document.addEventListener('mouseleave', onDocumentMouseLeave)

  if (!reducedMotion.value) {
    rafId = window.requestAnimationFrame(tickMotion)
  }

  const host = particleHostRef.value
  if (!host || reducedMotion.value) return

  try {
    const THREE = await import('three')
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    })

    const w = host.clientWidth || window.innerWidth || 1440
    const h = host.clientHeight || window.innerHeight || 900
    const pr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(pr)
    renderer.setSize(w, h)
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className = 'w-full h-full block'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / Math.max(1, h), 0.1, 50)
    camera.position.set(0, 0, 12)

    const count = 90
    const pos = new Float32Array(count * 3)
    const scale = new Float32Array(count)
    const kind = new Float32Array(count)
    const phase = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = -2 + Math.random() * 5
      scale[i] = 0.55 + Math.random() * 1.2
      kind[i] = Math.random()
      phase[i] = Math.random() * Math.PI * 2
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))

    const uniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: pr },
    }

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms,
      vertexShader: /* glsl */ `
        attribute float aScale;
        attribute float aKind;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vKind;
        varying float vAlpha;

        void main() {
          vKind = aKind;
          vec3 p = position;
          float cycle = mod(uTime * (0.20 + aKind * 0.14) + aPhase, 6.0);
          p.y += cycle * 0.35 - 0.9;
          p.x += sin(uTime * 0.55 + aPhase * 2.0) * 0.25;
          vAlpha = smoothstep(0.0, 1.2, cycle) * (1.0 - smoothstep(4.2, 6.0, cycle));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (19.0 * aScale * uPixelRatio) / max(-mv.z, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vKind;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = pow(1.0 - d * 2.0, 2.3);
          vec3 teal = vec3(0.0, 0.90, 0.66);
          vec3 gold = vec3(0.98, 0.72, 0.18);
          vec3 col = mix(teal, gold, step(0.7, vKind));
          gl_FragColor = vec4(col, glow * vAlpha * 0.78);
        }
      `,
    })

    const pts = new THREE.Points(geo, mat)
    scene.add(pts)

    let pRaf = 0
    let pElapsed = 0
    let pLast = performance.now()
    let visible = true

    const visObs = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
      },
      { threshold: 0.01 },
    )
    visObs.observe(host)

    const onParticleResize = () => {
      const nw = host.clientWidth || window.innerWidth
      const nh = host.clientHeight || window.innerHeight
      const npr = Math.min(window.devicePixelRatio || 1, 2)
      camera.aspect = nw / Math.max(1, nh)
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(npr)
      renderer.setSize(nw, nh)
      uniforms.uPixelRatio.value = npr
    }
    window.addEventListener('resize', onParticleResize, { passive: true })

    const renderParticles = (now: number) => {
      pRaf = window.requestAnimationFrame(renderParticles)
      if (!visible || document.hidden) {
        pLast = now
        return
      }
      const dt = Math.max(0, Math.min(0.05, (now - pLast) / 1000))
      pLast = now
      pElapsed += dt
      uniforms.uTime.value = pElapsed
      camera.position.x = -parallax.value.x * 0.028
      camera.position.y = parallax.value.y * 0.022
      renderer.render(scene, camera)
    }

    pRaf = window.requestAnimationFrame(renderParticles)

    threeCleanup = () => {
      if (pRaf) window.cancelAnimationFrame(pRaf)
      visObs.disconnect()
      window.removeEventListener('resize', onParticleResize)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement)
      }
    }
  }
  catch {
    // Graceful no-op if WebGL is unavailable
  }
})

onBeforeUnmount(() => {
  if (rafId) window.cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  window.removeEventListener('pointermove', onWindowPointerMove)
  document.removeEventListener('mouseleave', onDocumentMouseLeave)
  threeCleanup?.()
  threeCleanup = null
})
</script>

<template>
  <div
    ref="rootRef"
    class="absolute inset-0 z-0 overflow-hidden select-none bg-[#060D0B]"
  >
    <!-- ASPECT-LOCKED DIORAMA STAGE (City-Skyline Empty-Pad Landscape + 4 Staggered Pop-Up 3D Buildings) -->
    <div
      class="absolute left-1/2 top-1/2 will-change-transform"
      :style="{
        width: `${stageSize.w.toFixed(1)}px`,
        height: `${stageSize.h.toFixed(1)}px`,
        transform: `translate3d(calc(-50% + ${parallax.x.toFixed(1)}px), calc(-50% + ${parallax.y.toFixed(1)}px), 0)`,
      }"
    >
      <!-- 1. Clean Text-Free City-Skyline Landscape with 4 Empty Glowing Pads -->
      <img
        :src="backdropSrc"
        alt=""
        decoding="async"
        fetchpriority="high"
        class="absolute inset-0 w-full h-full object-fill pointer-events-none"
        aria-hidden="true"
      >

      <!-- Subtle animated emerald terrace breath glow in the central valley -->
      <div
        class="absolute inset-0 pointer-events-none mix-blend-screen opacity-24 animate-pulse"
        style="background: radial-gradient(ellipse 35% 28% at 54% 62%, rgba(0, 229, 168, 0.30), transparent 72%); animation-duration: 5.8s;"
        aria-hidden="true"
      />

      <!-- 2. FOUR ENVIRONMENT-MATCHED 3D BUILDINGS GENERATING/POPPING UP ONTO THEIR 4 PADS -->
      <div :key="buildGenerationKey" class="hidden md:block absolute inset-0 pointer-events-none">
        <button
          v-for="b in DIORAMA_BUILDINGS"
          :key="b.id"
          type="button"
          class="group pointer-events-auto absolute focus-visible:outline-none cursor-pointer"
          :style="{
            left: `${b.leftPct}%`,
            top: `${b.topPct}%`,
            width: `${b.widthPct}%`,
            transform: `translate(-50%, ${b.anchorYOffsetPct}%)`,
            zIndex: activeHighlightId === b.id ? 30 : b.topPct > 60 ? 20 : 12,
          }"
          :aria-label="`Open 3D model pop-up for ${b.name}`"
          @mouseenter="handleBuildingEnter(b.id)"
          @mouseleave="handleBuildingLeave(b.id)"
          @focus="handleBuildingEnter(b.id)"
          @blur="handleBuildingLeave(b.id)"
          @click="handleBuildingClick(b.id)"
        >
          <!-- Holographic Emerald Scan Ring bursting upward as each 3D building generates onto its empty pad -->
          <span
            class="pad-scan-ring pointer-events-none absolute left-1/2 bottom-[14%] w-[94%] h-[32%] rounded-full border-2 border-[#00E5A8] shadow-[0_0_24px_rgba(0,229,168,0.85)]"
            :style="{ '--build-delay': `${b.generateDelayMs}ms` }"
            aria-hidden="true"
          />

          <!-- Hover / Active Emerald Beacon Glow on the Pad -->
          <span
            class="pointer-events-none absolute left-1/2 bottom-[10%] -translate-x-1/2 w-[92%] h-[28%] rounded-full transition-all duration-300 ease-signal"
            :class="
              activeHighlightId === b.id
                ? 'opacity-100 scale-105'
                : 'opacity-15 scale-95 group-hover:opacity-90'
            "
            style="background: radial-gradient(ellipse at center, rgba(0, 229, 168, 0.58) 0%, rgba(16, 185, 129, 0.18) 54%, transparent 78%); filter: blur(8px);"
            aria-hidden="true"
          />

          <!-- Staggered 3D Pop-Up Generation Wrapper -->
          <span
            class="block w-full building-generate-pop"
            :style="{ '--build-delay': `${b.generateDelayMs}ms` }"
          >
            <!-- Environment-Matched 3D Model Image with Smooth Hover Pop-Up Elevation -->
            <img
              :src="b.siteImageSrc"
              :alt="b.name"
              draggable="false"
              class="relative w-full h-auto block transition-all duration-300 ease-signal will-change-transform"
              :class="[
                activeHighlightId === b.id
                  ? '-translate-y-3 scale-[1.07] brightness-112 drop-shadow-[0_0_26px_rgba(0,229,168,0.68)]'
                  : activeHighlightId && activeHighlightId !== b.id
                    ? 'opacity-78 brightness-90 drop-shadow-[0_12px_20px_rgba(0,0,0,0.72)]'
                    : 'brightness-100 drop-shadow-[0_12px_22px_rgba(0,0,0,0.72)] hover:-translate-y-2.5 hover:scale-[1.06]',
              ]"
            >
          </span>

          <!-- Subtle Hover-Only Interactive Chip (Zero clutter when idle; invites 3D pop-up click on hover!) -->
          <span
            class="pointer-events-none absolute left-1/2 top-[2%] -translate-x-1/2 -translate-y-full inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md whitespace-nowrap transition-all duration-200 ease-signal shadow-[0_8px_24px_rgba(0,0,0,0.72)]"
            :class="
              activeHighlightId === b.id
                ? 'opacity-100 translate-y-0 bg-[#061612]/95 border-[#00E5A8] text-[#ECFDF5]'
                : 'opacity-0 translate-y-1.5 bg-[#061310]/85 border-mint/40 text-ink-secondary'
            "
          >
            <span class="w-1.5 h-1.5 rounded-full bg-[#00E5A8] open-sign-glow" />
            <span class="font-mono text-[9px] font-bold tracking-[0.1em] uppercase text-[#00E5A8]">3D VIEW</span>
            <span class="font-sans text-[11px] font-semibold">{{ b.shortLabel }}</span>
          </span>
        </button>
      </div>
    </div>

    <!-- 3. SUBTLE CURSOR-REACTIVE LUHUR SIGNAL MINT-TEAL HEXAGON OVERLAY -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        class="absolute inset-0 transition-opacity duration-300"
        :style="hexCursorMaskStyle"
      >
        <svg class="w-full h-full">
          <defs>
            <linearGradient id="diorama-hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00E5A8" />
              <stop offset="55%" stop-color="#10B981" />
              <stop offset="100%" stop-color="#14B8A6" />
            </linearGradient>
            <pattern
              id="diorama-hex-pat"
              width="69.28"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M34.64 0 L69.28 20 L69.28 60 L34.64 80 L0 60 L0 20 Z M34.64 80 L34.64 120 M0 60 L0 120 M69.28 60 L69.28 120 M0 100 L34.64 120 L69.28 100"
                fill="rgba(16, 185, 129, 0.032)"
                stroke="url(#diorama-hex-grad)"
                stroke-width="1.25"
                stroke-opacity="0.7"
              />
              <circle cx="34.64" cy="0" r="1.4" fill="#00E5A8" fill-opacity="0.78" />
              <circle cx="34.64" cy="80" r="1.4" fill="#10B981" fill-opacity="0.78" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diorama-hex-pat)" />
        </svg>
      </div>
    </div>

    <!-- 4. LIGHTWEIGHT THREE.JS AMBIENT FIREFLIES & DATA NODES -->
    <div
      ref="particleHostRef"
      class="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />

    <!-- 5. BALANCED CENTER-ONLY READABILITY VIGNETTE (Keeps city skyline + 4 3D buildings crisp!) -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="background: radial-gradient(ellipse 38% 46% at 50% 50%, rgba(6, 13, 11, 0.62) 0%, rgba(6, 13, 11, 0.28) 58%, transparent 100%);"
      aria-hidden="true"
    />
    <div
      class="absolute inset-x-0 top-0 h-24 pointer-events-none"
      style="background: linear-gradient(to bottom, rgba(6, 13, 11, 0.72) 0%, rgba(6, 13, 11, 0.16) 65%, transparent 100%);"
      aria-hidden="true"
    />
    <div
      class="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
      style="background: linear-gradient(to bottom, transparent 0%, rgba(10, 18, 16, 0.65) 60%, #0F1115 100%);"
      aria-hidden="true"
    />
  </div>
</template>
