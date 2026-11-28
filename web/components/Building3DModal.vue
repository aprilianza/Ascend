<script setup lang="ts">
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Move3d,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-vue-next'
import { DIORAMA_BUILDINGS, type DioramaBuilding, type LandmarkId } from '~/utils/dioramaBuildings'

const props = defineProps<{
  buildingId: LandmarkId | null
}>()

const emit = defineEmits<{
  close: []
  select: [id: LandmarkId]
}>()

const activeIndex = computed(() =>
  props.buildingId ? DIORAMA_BUILDINGS.findIndex(b => b.id === props.buildingId) : -1,
)

const building = computed<DioramaBuilding | null>(() =>
  activeIndex.value >= 0 ? DIORAMA_BUILDINGS[activeIndex.value]! : null,
)

// Interactive 3D perspective tilt, drag-inspect, zoom, and pop-up replay state
const stageRef = ref<HTMLElement | null>(null)
const isZoomed = ref(false)
const isDragging = ref(false)
const autoSway = ref(true)
const popReplayKey = ref(0)

const tiltTarget = { rx: 4, ry: -6 }
const tiltCurrent = ref({ rx: 4, ry: -6 })
const specularPos = ref({ x: 50, y: 38 })

let dragStart = { x: 0, y: 0, rx: 0, ry: 0 }
let rafId = 0
let phase = 0

function stepPrev() {
  if (activeIndex.value < 0) return
  const prevIdx = (activeIndex.value - 1 + DIORAMA_BUILDINGS.length) % DIORAMA_BUILDINGS.length
  emit('select', DIORAMA_BUILDINGS[prevIdx]!.id)
}

function stepNext() {
  if (activeIndex.value < 0) return
  const nextIdx = (activeIndex.value + 1) % DIORAMA_BUILDINGS.length
  emit('select', DIORAMA_BUILDINGS[nextIdx]!.id)
}

function replayPopIn() {
  popReplayKey.value++
}

function onStagePointerMove(e: PointerEvent) {
  const el = stageRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1
  const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1

  specularPos.value = {
    x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100,
    y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100,
  }

  if (isDragging.value) {
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    tiltTarget.ry = Math.max(-28, Math.min(28, dragStart.ry + dx * 0.16))
    tiltTarget.rx = Math.max(-18, Math.min(20, dragStart.rx - dy * 0.12))
  }
  else {
    autoSway.value = false
    tiltTarget.ry = nx * 16
    tiltTarget.rx = -ny * 10
  }
}

function onStagePointerDown(e: PointerEvent) {
  isDragging.value = true
  autoSway.value = false
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    rx: tiltCurrent.value.rx,
    ry: tiltCurrent.value.ry,
  }
}

function onWindowPointerUp() {
  isDragging.value = false
}

function onStagePointerLeave() {
  if (!isDragging.value) {
    autoSway.value = true
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!props.buildingId) return
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft') stepPrev()
  else if (e.key === 'ArrowRight') stepNext()
}

function animateTilt() {
  rafId = window.requestAnimationFrame(animateTilt)
  if (!props.buildingId) return
  phase += 0.018
  if (autoSway.value && !isDragging.value) {
    tiltTarget.ry = Math.sin(phase) * 9.5
    tiltTarget.rx = 3.5 + Math.cos(phase * 0.8) * 3.5
  }
  tiltCurrent.value.rx += (tiltTarget.rx - tiltCurrent.value.rx) * 0.1
  tiltCurrent.value.ry += (tiltTarget.ry - tiltCurrent.value.ry) * 0.1
}

watch(
  () => props.buildingId,
  (id) => {
    if (id) {
      isZoomed.value = false
      autoSway.value = true
      popReplayKey.value++
    }
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointerup', onWindowPointerUp)
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rafId = window.requestAnimationFrame(animateTilt)
  }
})

onBeforeUnmount(() => {
  if (rafId) window.cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointerup', onWindowPointerUp)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-mid ease-signal"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-fast ease-signal"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="building"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#030907]/82 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        :aria-label="`${building.name} 3D Diorama Inspector`"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-[780px] chamfer-card shadow-[0_32px_100px_rgba(0,0,0,0.92)]">
          <div class="chamfer-card-inner bg-[#071310] overflow-hidden flex flex-col">
            <!-- Top Minimal Header Bar -->
            <div class="px-5 py-3.5 border-b border-[#163029] flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-mint/15 border border-mint/45 font-mono text-[10px] font-bold tracking-[0.1em] text-[#00E5A8] uppercase shrink-0">
                  <Move3d class="w-3 h-3" />
                  <span>{{ building.slotCode }} · 3D MODEL</span>
                </span>
                <h2 class="font-editorial font-semibold text-[18px] sm:text-[21px] text-ink-primary truncate">
                  {{ building.name }}
                </h2>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg bg-[#0B1C17] border border-[#1B3A31] flex items-center justify-center text-ink-secondary hover:text-[#00E5A8] hover:border-mint/55 transition-colors"
                  :aria-label="isZoomed ? 'Zoom out 3D model' : 'Zoom in 3D model'"
                  :title="isZoomed ? 'Reset zoom' : 'Zoom in'"
                  @click="isZoomed = !isZoomed"
                >
                  <ZoomOut v-if="isZoomed" class="w-4 h-4" />
                  <ZoomIn v-else class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg bg-[#0B1C17] border border-[#1B3A31] flex items-center justify-center text-ink-secondary hover:text-[#00E5A8] hover:border-mint/55 transition-colors"
                  aria-label="Replay 3D pop-up animation"
                  title="Replay 3D pop-up"
                  @click="replayPopIn"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg bg-[#0B1C17] border border-[#1B3A31] flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:border-[#34404F] transition-colors"
                  aria-label="Close 3D inspector"
                  @click="emit('close')"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Interactive 3D Perspective Diorama Showcase Viewport -->
            <div
              ref="stageRef"
              class="relative h-[320px] sm:h-[420px] w-full overflow-hidden flex items-center justify-center select-none"
              :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
              style="perspective: 1150px; background: radial-gradient(ellipse 72% 65% at 50% 56%, rgba(16, 185, 129, 0.16), rgba(7, 19, 16, 0.94) 68%, #040B09 100%);"
              @pointermove="onStagePointerMove"
              @pointerdown="onStagePointerDown"
              @pointerleave="onStagePointerLeave"
            >
              <!-- Subtle Holographic Isometric Floor Grid Plane in 3D -->
              <div
                class="pointer-events-none absolute inset-0 opacity-35"
                :style="{
                  transform: `rotateX(${(62 + tiltCurrent.rx * 0.35).toFixed(1)}deg) rotateZ(${(tiltCurrent.ry * 0.45).toFixed(1)}deg) translateY(90px) scale(1.45)`,
                  backgroundImage: 'linear-gradient(to right, rgba(0,229,168,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,229,168,0.22) 1px, transparent 1px)',
                  backgroundSize: '42px 42px',
                  maskImage: 'radial-gradient(circle at 50% 50%, black 25%, transparent 72%)',
                  WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 25%, transparent 72%)',
                }"
                aria-hidden="true"
              />

              <!-- Pointer-following Emerald Specular Ambient Sheen -->
              <div
                class="pointer-events-none absolute inset-0"
                :style="{
                  background: `radial-gradient(circle 240px at ${specularPos.x.toFixed(1)}% ${specularPos.y.toFixed(1)}%, rgba(0, 229, 168, 0.14), transparent 72%)`,
                }"
                aria-hidden="true"
              />

              <!-- 3D Tilting Environment-Matched Diorama Model -->
              <div
                :key="`${building.id}-${popReplayKey}`"
                class="relative z-10 w-[84%] max-w-[540px] flex items-center justify-center building-generate-pop"
                style="--build-delay: 0ms;"
              >
                <div
                  class="relative w-full flex items-center justify-center transition-transform duration-150 ease-out will-change-transform"
                  :style="{
                    transform: `rotateX(${tiltCurrent.rx.toFixed(2)}deg) rotateY(${tiltCurrent.ry.toFixed(2)}deg) scale(${isZoomed ? 1.28 : 1.0})`,
                    transformStyle: 'preserve-3d',
                  }"
                >
                  <!-- Ground glow pedestal shadow under the 3D diorama block -->
                  <div
                    class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 w-[74%] h-10 rounded-full blur-2xl"
                    style="background: radial-gradient(ellipse, rgba(0, 229, 168, 0.36), rgba(0, 0, 0, 0.85) 75%);"
                    aria-hidden="true"
                  />

                  <img
                    :src="building.dioramaImageSrc"
                    :alt="`${building.name} interactive 3D diorama`"
                    draggable="false"
                    class="relative w-full max-h-[290px] sm:max-h-[370px] object-contain drop-shadow-[0_24px_38px_rgba(0,0,0,0.85)]"
                  >
                </div>
              </div>

              <!-- Left & Right Navigation Arrows inside the 3D Stage -->
              <button
                type="button"
                class="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#071512]/85 border border-[#1E3E35] flex items-center justify-center text-ink-secondary hover:text-[#00E5A8] hover:border-[#00E5A8] transition-all"
                aria-label="Previous 3D building"
                @click.stop="stepPrev"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#071512]/85 border border-[#1E3E35] flex items-center justify-center text-ink-secondary hover:text-[#00E5A8] hover:border-[#00E5A8] transition-all"
                aria-label="Next 3D building"
                @click.stop="stepNext"
              >
                <ChevronRight class="w-4 h-4" />
              </button>

              <!-- Subtle 3D interaction hint badge -->
              <span class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#06110E]/80 border border-[#1A352D] font-mono text-[9.5px] tracking-[0.12em] text-ink-secondary uppercase whitespace-nowrap">
                MOVE OR DRAG TO TILT 3D MODEL
              </span>
            </div>

            <!-- Bottom Compact Switcher & Bandung Map Action -->
            <div class="px-5 py-3.5 border-t border-[#163029] bg-[#06100D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <!-- Quick 4-Diorama Switcher Pills -->
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  v-for="item in DIORAMA_BUILDINGS"
                  :key="item.id"
                  type="button"
                  class="px-2.5 py-1 rounded-full border font-mono text-[10px] tracking-[0.06em] transition-all duration-fast"
                  :class="
                    item.id === building.id
                      ? 'bg-mint/18 border-[#00E5A8] text-[#00E5A8] font-bold'
                      : 'bg-[#091814] border-[#1A342C] text-ink-secondary hover:border-mint/50 hover:text-ink-primary'
                  "
                  @click="emit('select', item.id)"
                >
                  {{ item.shortLabel }}
                </button>
              </div>

              <!-- Compact District Tag + Live Map CTA -->
              <div class="flex items-center justify-between sm:justify-end gap-3">
                <span class="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-secondary">
                  <MapPin class="w-3 h-3 text-mint shrink-0" />
                  <span>{{ building.district }}</span>
                </span>
                <NuxtLink
                  to="/map"
                  class="btn-mint h-9 px-4 text-[12.5px] whitespace-nowrap group"
                  @click="emit('close')"
                >
                  <span>Open map</span>
                  <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
