<script setup lang="ts">
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

type StageId = 'crowded' | 'fair' | 'opportunity'

const CYCLE_MS = 4000

const stages = computed(() => HOME_COPY.value.background.stages)
const ticks = Array.from({ length: 11 }, (_, i) => i * 10)

const activeIndex = ref<number>(0)
const cycleKey = ref<number>(0)
const isHoverPaused = ref<boolean>(false)
const reducedMotion = ref<boolean>(false)
const hoveredTick = ref<number | null>(null)
const isInView = ref<boolean>(false)

const sectionRef = ref<HTMLElement | null>(null)
let cycleTimer: ReturnType<typeof setInterval> | null = null
let viewObserver: IntersectionObserver | null = null

const activeStage = computed(() => stages.value[activeIndex.value] ?? stages.value[2]!)

const isAutoRunning = computed(() =>
  !reducedMotion.value && !isHoverPaused.value && isInView.value,
)

const stageTheme = computed(() => {
  const id: StageId = activeStage.value.id
  if (id === 'crowded') {
    return {
      color: '#EF4444',
      softBg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.42)',
      orbShadow: '0 0 18px rgba(239, 68, 68, 0.85)',
      trackGrad: 'linear-gradient(90deg, rgba(239, 68, 68, 0.35) 0%, #EF4444 100%)',
      textClass: 'text-[#F87171]',
    }
  }
  if (id === 'fair') {
    return {
      color: '#F59E0B',
      softBg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.42)',
      orbShadow: '0 0 18px rgba(245, 158, 11, 0.85)',
      trackGrad: 'linear-gradient(90deg, rgba(239, 68, 68, 0.4) 0%, #F59E0B 100%)',
      textClass: 'text-[#FBBF24]',
    }
  }
  return {
    color: '#10B981',
    softBg: 'rgba(16, 185, 129, 0.13)',
    border: 'rgba(16, 185, 129, 0.45)',
    orbShadow: '0 0 20px rgba(16, 185, 129, 0.9)',
    trackGrad: 'linear-gradient(90deg, rgba(239, 68, 68, 0.32) 0%, rgba(245, 158, 11, 0.5) 48%, #10B981 100%)',
    textClass: 'text-mint',
  }
})

function clearCycleTimer() {
  if (cycleTimer) {
    clearInterval(cycleTimer)
    cycleTimer = null
  }
}

function startCycleTimer() {
  clearCycleTimer()
  if (!isAutoRunning.value) return
  cycleKey.value += 1
  cycleTimer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % stages.value.length
    cycleKey.value += 1
  }, CYCLE_MS)
}

function selectStage(idx: number) {
  activeIndex.value = idx
  cycleKey.value += 1
  if (isAutoRunning.value) {
    startCycleTimer()
  }
}

function handleTickClick(tickValue: number) {
  if (tickValue < 35) selectStage(0)
  else if (tickValue < 68) selectStage(1)
  else selectStage(2)
}

watch(isAutoRunning, (running) => {
  if (running) startCycleTimer()
  else clearCycleTimer()
})

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion.value) {
    activeIndex.value = 2
    return
  }

  activeIndex.value = 0

  if (sectionRef.value && 'IntersectionObserver' in window) {
    viewObserver = new IntersectionObserver(
      (entries) => {
        isInView.value = Boolean(entries[0]?.isIntersecting)
      },
      { threshold: 0.15 },
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
</script>

<template>
  <section
    id="latar-belakang"
    ref="sectionRef"
    class="gta-overlap-rise relative z-20 pb-20 sm:pb-24"
    style="background: linear-gradient(180deg, rgba(10, 13, 18, 0) 0%, rgba(11, 14, 19, 0.72) 14%, rgba(15, 17, 21, 0.95) 32%, #0F1115 50%, #0F1115 100%);"
  >
    <div id="busy-header" class="mx-auto max-w-frame px-5 sm:px-8">
      <!-- Row 1: Precision-Aligned Left Headline & Right Editorial Explanation -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        <!-- Left Column: Street Reality + "Busy isn't room." -->
        <div class="lg:col-span-6 flex flex-col justify-between">
          <p
            v-reveal="{ variant: 'up' }"
            class="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-mint mb-4"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(16,185,129,0.85)]" aria-hidden="true" />
            <span>{{ HOME_COPY.background.eyebrow }}</span>
          </p>

          <h2
            v-reveal="{ variant: 'up', delay: 70 }"
            class="font-display font-extrabold text-ink-primary tracking-[-0.03em] leading-[0.94] text-[48px] sm:text-[66px] lg:text-[78px] xl:text-[88px]"
          >
            <span class="block">{{ HOME_COPY.background.headlinePrefix }}</span>
            <span class="editorial-mint block mt-1 text-[1.06em]">
              {{ HOME_COPY.background.headlineAccent }}
            </span>
          </h2>
        </div>

        <!-- Right Column: Matched Eyebrow Rail + Editorial Paragraph -->
        <div
          v-reveal="{ variant: 'up', delay: 130 }"
          class="lg:col-span-6 flex flex-col justify-between border-t border-[#232836]/80 pt-6 lg:border-t-0 lg:pt-0 lg:border-l lg:border-[#232836]/80 lg:pl-10"
        >
          <p class="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted mb-4">
            {{ HOME_COPY.background.rightEyebrow }}
          </p>

          <p class="font-sans text-[16.5px] sm:text-[18px] lg:text-[19.5px] leading-[1.68] text-ink-secondary max-w-[540px]">
            {{ HOME_COPY.background.body }}
          </p>
        </div>
      </div>

      <!-- Row 2: Ultra-Clean Full-Width Animated "BUSY ... ROOM" Spectrum Band Below Both Texts -->
      <div
        v-reveal="{ variant: 'up', delay: 180 }"
        class="mt-12 sm:mt-14 pt-8 border-t border-[#232836]/80"
        @mouseenter="isHoverPaused = true"
        @mouseleave="isHoverPaused = false"
      >
        <!-- Single Clean Context Row: Concise Readout (left) + Minimal Stage Selector (right) -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span
              class="inline-flex items-center gap-2 font-mono text-[11.5px] font-bold uppercase tracking-[0.1em] transition-colors duration-500"
              :class="stageTheme.textClass"
            >
              <span
                class="w-2 h-2 rounded-full transition-all duration-500"
                :style="{ backgroundColor: stageTheme.color, boxShadow: `0 0 10px ${stageTheme.color}` }"
                aria-hidden="true"
              />
              {{ activeStage.ratioText }}
            </span>

            <span class="hidden sm:inline text-[#34404F]" aria-hidden="true">·</span>

            <p class="font-sans text-[14px] sm:text-[15px] text-ink-secondary">
              {{ activeStage.meaning }}
            </p>
          </div>

          <!-- Minimal Inline Stage Pills -->
          <div class="inline-flex items-center gap-1 self-start md:self-auto" role="tablist" aria-label="Area balance states">
            <button
              v-for="(stage, idx) in stages"
              :key="stage.id"
              type="button"
              role="tab"
              :aria-selected="activeIndex === idx"
              class="relative overflow-hidden px-3 py-1.5 rounded-lg font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors duration-fast cursor-pointer"
              :class="
                activeIndex === idx
                  ? 'bg-white/[0.06] text-ink-primary font-semibold'
                  : 'text-ink-muted hover:text-ink-secondary'
              "
              @click="selectStage(idx)"
            >
              <span>{{ stage.label }}</span>
              <span
                v-if="activeIndex === idx && isAutoRunning"
                :key="cycleKey"
                class="stage-progress-bar absolute inset-x-1.5 bottom-0 h-[2px] rounded-full"
                :style="{ backgroundColor: stageTheme.color }"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <!-- Clean 3-Point Scale Labels -->
        <div class="grid grid-cols-3 items-center font-mono text-[10px] tracking-[0.16em] uppercase mb-3">
          <button
            type="button"
            class="text-left transition-colors duration-fast cursor-pointer"
            :class="activeStage.id === 'crowded' ? 'text-[#F87171] font-bold' : 'text-ink-muted hover:text-ink-secondary'"
            @click="selectStage(0)"
          >
            {{ HOME_COPY.background.scaleLeft }}
          </button>

          <button
            type="button"
            class="text-center transition-colors duration-fast cursor-pointer"
            :class="activeStage.id === 'fair' ? 'text-[#FBBF24] font-bold' : 'text-ink-muted hover:text-ink-secondary'"
            @click="selectStage(1)"
          >
            {{ HOME_COPY.background.scaleCenter }}
          </button>

          <button
            type="button"
            class="text-right transition-colors duration-fast cursor-pointer"
            :class="activeStage.id === 'opportunity' ? 'text-mint font-bold' : 'text-ink-muted hover:text-ink-secondary'"
            @click="selectStage(2)"
          >
            {{ HOME_COPY.background.scaleRight }}
          </button>
        </div>

        <!-- Single Sleek Full-Width Animated Scale Bar (11 calm ticks + sliding orb + compact pill) -->
        <div class="relative pt-3 pb-11">
          <div class="h-[2px] w-full rounded-full bg-[#2A3342]" />

          <div
            class="absolute top-3 left-0 h-[2.5px] rounded-full transition-all duration-700"
            style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);"
            :style="{
              width: `${activeStage.position}%`,
              background: stageTheme.trackGrad,
            }"
          />

          <div class="absolute top-[7px] inset-x-0 flex items-center justify-between">
            <button
              v-for="tick in ticks"
              :key="tick"
              type="button"
              class="group relative w-3 h-4 flex items-center justify-center cursor-pointer focus-visible:outline-none"
              :aria-label="`Inspect scale at ${tick} percent`"
              @mouseenter="hoveredTick = tick"
              @mouseleave="hoveredTick = null"
              @click="handleTickClick(tick)"
            >
              <span
                class="block w-px transition-all duration-fast ease-signal"
                :class="
                  Math.abs(tick - activeStage.position) <= 5
                    ? 'h-3.5 bg-ink-primary'
                    : hoveredTick === tick
                      ? 'h-3 bg-ink-primary'
                      : 'h-2 bg-[#34404F]'
                "
              />
            </button>
          </div>

          <!-- Sliding Glowing Marker + Compact Status Pill (edge-safe on narrow mobile screens) -->
          <div
            class="absolute top-[5px] -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-700"
            style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);"
            :style="{ left: `${activeStage.position}%` }"
          >
            <span
              class="w-4 h-4 rounded-full border-2 border-ground transition-all duration-500"
              :style="{
                backgroundColor: stageTheme.color,
                boxShadow: stageTheme.orbShadow,
              }"
            />
          </div>

          <div
            class="absolute top-[30px] pointer-events-none transition-all duration-700"
            style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);"
            :class="
              activeStage.id === 'crowded'
                ? '-translate-x-[18%] sm:-translate-x-1/2'
                : activeStage.id === 'opportunity'
                  ? '-translate-x-[82%] sm:-translate-x-1/2'
                  : '-translate-x-1/2'
            "
            :style="{ left: `${activeStage.position}%` }"
          >
            <span
              class="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-md border font-mono text-[10px] font-semibold tracking-[0.06em] transition-all duration-500"
              :style="{
                backgroundColor: stageTheme.softBg,
                borderColor: stageTheme.border,
                color: stageTheme.color,
              }"
            >
              {{ activeStage.pillText }}
            </span>
          </div>
        </div>

        <p class="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-muted/70">
          {{ HOME_COPY.background.scaleFootnote }}
        </p>
      </div>
    </div>
  </section>
</template>
