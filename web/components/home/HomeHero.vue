<script setup lang="ts">
import {
  ArrowRight,
  Search,
} from 'lucide-vue-next'
import type { Meta } from '~/types/areas'
import type { BusinessStationId } from '~/utils/businessStations'

const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

const props = defineProps<{
  meta: Meta | null
  loadingMeta: boolean
  leftStation: BusinessStationId
  rightStation: BusinessStationId
  swapPulseSide?: 'left' | 'right' | 'both' | null
}>()

const emit = defineEmits<{
  swapWings: []
}>()

// =========================================================================
// 1. SYNCHRONIZED 15-SECOND ASCEND POP-UP + TREASURE-HUNT UNDERLINE LOOP
//    - 0.00s -> 2.35s: Underline draws A -> D -> X while each letter pops up in exact lock-step!
//    - 2.35s -> 13.4s: Crisp readable hold with living subtle trail pulse
//    - 13.4s -> 14.9s: Smooth draw-out retraction + subtle letter settle before repeating at 15.0s!
// =========================================================================
const CYCLE_TOTAL_MS = 15000
const EXIT_START_MS = 13400

const cycleKey = ref(0)
const cyclePhase = ref<'enter' | 'exit'>('enter')
let exitTimeout: ReturnType<typeof setTimeout> | null = null
let repeatTimeout: ReturnType<typeof setTimeout> | null = null
let reducedMotion = false

function clearCycleTimers() {
  if (exitTimeout) clearTimeout(exitTimeout)
  if (repeatTimeout) clearTimeout(repeatTimeout)
  exitTimeout = null
  repeatTimeout = null
}

function scheduleNextCycle() {
  clearCycleTimers()
  if (reducedMotion) return

  exitTimeout = setTimeout(() => {
    cyclePhase.value = 'exit'
  }, EXIT_START_MS)

  repeatTimeout = setTimeout(() => {
    cyclePhase.value = 'enter'
    cycleKey.value++
    scheduleNextCycle()
  }, CYCLE_TOTAL_MS)
}

function replayAscendCycle() {
  cyclePhase.value = 'enter'
  cycleKey.value++
  scheduleNextCycle()
}

// =========================================================================
// 2. CLEAN 2D STEP-RISING ASCEND WORDMARK (Synchronized with underline timing!)
// =========================================================================
const wordmarkHovered = ref(false)
const hoveredLetterIdx = ref<number | null>(null)

// Exact millisecond sync matching when the treasure comet crosses beneath each letter!
const wordmarkLetters = [
  { char: 'A', step: 0, gradPos: '8%', enterDelayMs: 240, exitDelayMs: 60 },
  { char: 'S', step: 1, gradPos: '26%', enterDelayMs: 540, exitDelayMs: 180 },
  { char: 'C', step: 2, gradPos: '44%', enterDelayMs: 850, exitDelayMs: 310 },
  { char: 'E', step: 3, gradPos: '62%', enterDelayMs: 1180, exitDelayMs: 450 },
  { char: 'N', step: 4, gradPos: '80%', enterDelayMs: 1500, exitDelayMs: 600 },
  { char: 'D', step: 5, gradPos: '98%', enterDelayMs: 1810, exitDelayMs: 750 },
]

function letterHoverStyle(idx: number) {
  if (!wordmarkHovered.value) {
    return {}
  }
  if (hoveredLetterIdx.value === null) {
    return {
      transform: `translate3d(0, ${-4 - idx * 1.1}px, 0) scale(1.015)`,
    }
  }
  const dist = Math.abs(idx - hoveredLetterIdx.value)
  const lift = Math.max(0, 14 - dist * 4.5)
  const scale = dist === 0 ? 1.065 : dist === 1 ? 1.028 : 1
  const tilt = dist === 0 ? -1.8 : idx < hoveredLetterIdx.value ? -0.8 : 0.8
  return {
    transform: `translate3d(0, -${lift}px, 0) scale(${scale}) rotate(${tilt}deg)`,
  }
}

// =========================================================================
// 3. INLINE HOVER-TRIGGERED COMING SOON TOOLTIPS (Warm Amber palette, 0px shift!)
// =========================================================================
const eateryTipVisible = ref(false)
let eateryLeaveTimer: ReturnType<typeof setTimeout> | null = null

function showEateryTip() {
  if (eateryLeaveTimer) clearTimeout(eateryLeaveTimer)
  eateryTipVisible.value = true
}

function scheduleHideEateryTip() {
  if (eateryLeaveTimer) clearTimeout(eateryLeaveTimer)
  eateryLeaveTimer = setTimeout(() => {
    eateryTipVisible.value = false
  }, 160)
}

function toggleEateryTip() {
  eateryTipVisible.value = !eateryTipVisible.value
}

const chatQuery = ref('')
const chatTipVisible = ref(false)
const hoveredChipHint = ref<string | null>(null)
let chatLeaveTimer: ReturnType<typeof setTimeout> | null = null

function showChatTip(hint?: string) {
  if (chatLeaveTimer) clearTimeout(chatLeaveTimer)
  if (hint !== undefined) hoveredChipHint.value = hint
  chatTipVisible.value = true
}

function scheduleHideChatTip() {
  if (chatLeaveTimer) clearTimeout(chatLeaveTimer)
  chatLeaveTimer = setTimeout(() => {
    chatTipVisible.value = false
    hoveredChipHint.value = null
  }, 180)
}

function selectChipPreview(chip: { prompt: string; hint: string }) {
  chatQuery.value = chip.prompt
  showChatTip(chip.hint)
}

function submitChatPreview() {
  const trimmed = chatQuery.value.trim()
  const matchedChip = HOME_COPY.value.hero.chatChips.find(c => c.prompt.toLowerCase() === trimmed.toLowerCase())
  showChatTip(
    matchedChip?.hint
    ?? settings.t(
      'Conversational map filtering launches in Phase 2. Open the live map now to inspect all 1,976 labeled areas.',
      'Pencarian peta berbasis percakapan hadir di Fase 2. Buka peta aktif sekarang untuk melihat seluruh 1.976 area berlabel.',
    ),
  )
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reducedMotion) {
    scheduleNextCycle()
  }
})

onBeforeUnmount(() => {
  clearCycleTimers()
  if (eateryLeaveTimer) clearTimeout(eateryLeaveTimer)
  if (chatLeaveTimer) clearTimeout(chatLeaveTimer)
})

const totalAreasFormatted = computed(() => {
  if (!props.meta) return '1,976'
  const c = props.meta.label_counts
  return (c.opportunity + c.fair + c.crowded + c.not_enough_demand).toLocaleString('en-US')
})
</script>

<template>
  <section
    id="beranda"
    class="relative w-full min-h-[calc(100svh-160px)] bg-[#050C0F] overflow-x-clip flex flex-col justify-between pt-20 sm:pt-24"
  >
    <!-- 5 FLUID 60FPS BACKDROP SCENES + SMART TEXT-DIMMING VARIED-STYLE LUHUR MINT HEX CURSOR -->
    <HomeHeroBackdrop2D :wordmark-hovered="wordmarkHovered" />

    <!-- LEFT & RIGHT INTERACTIVE 3D-HEX BUYER-SELLER WINGS (Closer to center controls, clickable to swap!) -->
    <HomeHeroAscendStoryTrial
      :left-station="props.leftStation"
      :right-station="props.rightStation"
      :swap-pulse-side="props.swapPulseSide"
      @swap-wings="emit('swapWings')"
    />

    <!-- ROCK-SOLID CENTERED FOREGROUND HERO STACK (Zero layout shift!) -->
    <div class="relative z-20 mx-auto w-full max-w-frame px-4 sm:px-8 flex-1 flex flex-col items-center justify-between text-center pt-1 sm:pt-2 pb-4 sm:pb-6">
      <!-- TOP CLUSTER: Ornate Nusantara Filigree Eyebrow + Synced 15s ASCEND Wordmark + Treasure-Hunt Underline -->
      <div class="w-full flex flex-col items-center">
        <!-- Eyebrow flanked by glowing Nusantara botanical filigree wings -->
        <div class="inline-flex items-center justify-center gap-2 sm:gap-4 font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.2em] text-[#34D399] whitespace-nowrap">
          <svg
            viewBox="0 0 110 34"
            class="hidden sm:block w-20 md:w-24 lg:w-28 h-7 text-[#10B981] drop-shadow-[0_0_12px_rgba(16,185,129,0.62)] shrink-0"
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
            <span>{{ HOME_COPY.hero.eyebrow }}</span>
          </span>

          <svg
            viewBox="0 0 110 34"
            class="hidden sm:block w-20 md:w-24 lg:w-28 h-7 text-[#10B981] drop-shadow-[0_0_12px_rgba(16,185,129,0.62)] shrink-0 -scale-x-100"
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

        <!-- BOLD 2D STEP-RISING ASCEND WORDMARK + SYNCED 15s TREASURE-HUNT UNDERLINE LOCKED PROPORTIONALLY BELOW -->
        <div class="inline-flex flex-col items-stretch w-fit max-w-full mt-1 sm:mt-2">
          <div
            :key="`wordmark-${cycleKey}`"
            class="relative inline-flex items-baseline justify-center select-none cursor-default pr-6 sm:pr-12"
            :class="{ 'ascend-2d-hovered': wordmarkHovered }"
            aria-label="ASCEND"
            @mouseenter="wordmarkHovered = true"
            @mouseleave="wordmarkHovered = false; hoveredLetterIdx = null"
          >
            <div
              class="pointer-events-none absolute -inset-x-10 -inset-y-4 rounded-full blur-3xl transition-opacity duration-500 ease-signal"
              :class="wordmarkHovered ? 'opacity-90' : 'opacity-25'"
              style="background: radial-gradient(ellipse 68% 54% at 50% 52%, rgba(0, 229, 168, 0.28), rgba(16, 185, 129, 0.12) 55%, transparent 80%);"
              aria-hidden="true"
            />

            <span
              v-for="(item, idx) in wordmarkLetters"
              :key="`${item.char}-${cycleKey}`"
              class="font-display font-extrabold leading-[0.86] tracking-[-0.035em] text-[clamp(46px,11vw,152px)]"
              :class="
                cyclePhase === 'exit'
                  ? 'ascend-letter-sync-exit'
                  : cycleKey === 0
                    ? 'ascend-letter-sync-enter'
                    : 'ascend-letter-sync-reenter'
              "
              :style="{
                '--step-y': `${(5 - item.step) * 0.036}em`,
                '--step-delay': `${item.enterDelayMs}ms`,
                '--exit-delay': `${item.exitDelayMs}ms`,
              }"
              @mouseenter="hoveredLetterIdx = idx"
            >
              <span
                class="ascend-2d-glyph"
                :style="[
                  { '--grad-pos': item.gradPos },
                  letterHoverStyle(idx),
                ]"
              >
                {{ item.char }}
              </span>
            </span>
          </div>

          <!-- Synchronized 15-Second Repeating Treasure-Hunt Underline Locked Strictly Below ASCEND -->
          <HomeHeroTreasureRoute
            :energized="wordmarkHovered"
            :cycle-key="cycleKey"
            :cycle-phase="cyclePhase"
            @replay="replayAscendCycle"
          />
        </div>
      </div>

      <!-- MIDDLE CLUSTER: 2-Line Headline, Subtitle, Segmented Pill (Live Mint vs Coming Soon Warm Amber) -->
      <div class="w-full max-w-[980px] flex flex-col items-center -mt-1 sm:-mt-2">
        <h1 class="font-display font-extrabold text-ink-primary tracking-[-0.03em] leading-[1.08] text-[24px] sm:text-[31px] md:text-[35px] lg:text-[38px] xl:text-[40px] drop-shadow-[0_6px_22px_rgba(0,0,0,0.85)]">
          <span class="block md:whitespace-nowrap">{{ HOME_COPY.hero.headlineLine1 }}</span>
          <span class="block mt-0.5">
            {{ HOME_COPY.hero.headlineLine2Prefix }}
            <span class="editorial-mint font-semibold tracking-[-0.01em] text-[1.1em]">
              {{ HOME_COPY.hero.headlineLine2Accent }}
            </span>
          </span>
        </h1>

        <p class="mt-2.5 sm:mt-3 font-sans text-[13.5px] sm:text-[15.5px] leading-[1.6] text-[#B8C7C4] max-w-[520px]">
          {{ HOME_COPY.hero.subtitle }}
        </p>

        <!-- Segmented Business Type Pill (Coffee shop = Primary Mint LIVE, Eatery = Warm Amber COMING SOON) -->
        <div class="relative mt-4 sm:mt-5 inline-flex flex-col items-center">
          <div
            class="inline-flex items-center p-1 rounded-full bg-[#0A181C]/90 border border-[#1E3B42] backdrop-blur-md shadow-[0_12px_34px_rgba(0,0,0,0.55)] max-w-full"
            role="group"
            aria-label="Choose business type"
          >
            <button
              type="button"
              class="inline-flex items-center px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-sans text-[12.5px] sm:text-[13.5px] whitespace-nowrap transition-all duration-fast ease-signal bg-mint text-ink-dark font-bold shadow-[0_0_24px_rgba(16,185,129,0.5)]"
              aria-pressed="true"
              @mouseenter="eateryTipVisible = false"
            >
              {{ HOME_COPY.hero.businessCoffee }}
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-sans text-[12.5px] sm:text-[13.5px] whitespace-nowrap transition-all duration-fast ease-signal"
              :class="
                eateryTipVisible
                  ? 'bg-[#191F29] text-[#E2E8F0] font-semibold'
                  : 'text-[#8C98A9] hover:text-[#CBD5E1] font-medium'
              "
              aria-describedby="eatery-coming-soon-tip"
              @mouseenter="showEateryTip"
              @mouseleave="scheduleHideEateryTip"
              @focus="showEateryTip"
              @blur="scheduleHideEateryTip"
              @click="toggleEateryTip"
            >
              <span>{{ HOME_COPY.hero.businessEatery }}</span>
              <span class="px-2 py-0.5 rounded-full border border-dashed border-signal-amber/55 bg-signal-amber/15 font-mono text-[8.5px] font-bold tracking-[0.08em] text-signal-amber uppercase whitespace-nowrap">
                {{ HOME_COPY.hero.comingSoon }}
              </span>
            </button>
          </div>

          <!-- Compact Neutral-Grey Hover Info Card Directly Underneath Eatery (0px layout shift!) -->
          <Transition
            enter-active-class="transition duration-200 ease-signal"
            enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-150 ease-signal"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-[0.98]"
          >
            <div
              v-if="eateryTipVisible"
              id="eatery-coming-soon-tip"
              role="tooltip"
              class="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-40 w-[300px] sm:w-[390px] rounded-xl bg-[#11151C]/95 border border-[#334155]/85 backdrop-blur-md px-3.5 py-2.5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.78)]"
              @mouseenter="showEateryTip"
              @mouseleave="scheduleHideEateryTip"
            >
              <span
                class="pointer-events-none absolute -top-1.5 right-14 w-2.5 h-2.5 rotate-45 bg-[#11151C] border-l border-t border-[#334155]/85"
                aria-hidden="true"
              />
              <div class="flex items-center gap-2 mb-1">
                <span class="px-1.5 py-0.5 rounded bg-signal-amber/20 border border-signal-amber/45 font-mono text-[8.5px] font-bold tracking-[0.08em] text-signal-amber uppercase">
                  {{ HOME_COPY.hero.comingSoon }}
                </span>
                <span class="font-sans text-[12px] font-semibold text-[#E2E8F0]">
                  {{ HOME_COPY.hero.eateryComingSoonTitle }}
                </span>
              </div>
              <p class="font-sans text-[11.5px] leading-relaxed text-[#94A3B8]">
                Ascend currently ships live coverage for Coffee shops across
                <span class="font-mono text-[#E2E8F0]">{{ totalAreasFormatted }}</span>
                areas. Eatery & warung mapping launches next.
              </p>
              <NuxtLink
                to="/map"
                class="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mint hover:text-[#34D399]"
              >
                <span>Open live Coffee shop map</span>
                <ArrowRight class="w-3 h-3" />
              </NuxtLink>
            </div>
          </Transition>
        </div>
      </div>

      <!-- BOTTOM CLUSTER: Neutral-Grey Disabled Ask Ascend Bar (only COMING SOON label stays amber) -->
      <div class="w-full max-w-[960px] flex flex-col items-center mt-4 sm:mt-5 pb-3">
        <div
          class="relative w-full max-w-[650px] flex flex-col items-center"
          @mouseleave="scheduleHideChatTip"
        >
          <form
            class="relative z-10 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            @submit.prevent="submitChatPreview"
          >
            <div class="relative flex-1 min-w-0 group">
              <div class="relative h-11 sm:h-12 rounded-full bg-[#10141B]/90 border border-[#2C3544] group-focus-within:border-[#475569] pl-4 pr-3 flex items-center gap-2.5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <Search class="w-4 h-4 text-[#64748B] shrink-0" :stroke-width="2" />
                <input
                  v-model="chatQuery"
                  type="text"
                  :placeholder="HOME_COPY.hero.chatPlaceholder"
                  aria-label="Ask Ascend preview input"
                  class="flex-1 min-w-0 bg-transparent font-sans text-[12.5px] sm:text-[13.5px] text-[#CBD5E1] placeholder:text-[#64748B] focus:outline-none"
                  @focus="showChatTip()"
                >
                <span
                  class="hidden lg:inline-flex shrink-0 px-2 py-0.5 rounded-full bg-signal-amber/15 border border-signal-amber/45 font-mono text-[8px] font-bold tracking-[0.08em] text-signal-amber uppercase cursor-default"
                  @mouseenter="showChatTip()"
                >
                  {{ HOME_COPY.hero.comingSoon }}
                </span>
              </div>
            </div>

            <button
              type="submit"
              class="relative h-11 sm:h-12 px-5 sm:px-6 rounded-full border border-[#334155] bg-[#141922]/90 hover:bg-[#1E2532] hover:border-[#475569] text-[#94A3B8] hover:text-[#E2E8F0] shadow-[0_8px_22px_rgba(0,0,0,0.35)] transition-all duration-200 ease-signal flex flex-col items-center justify-center shrink-0 leading-none group cursor-pointer"
              aria-label="Preview Ask Ascend"
              aria-describedby="ask-ascend-coming-soon-tip"
              @mouseenter="showChatTip()"
              @focus="showChatTip()"
            >
              <span class="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em]">
                Explore
              </span>
              <span class="font-mono text-[8px] uppercase tracking-[0.1em] text-[#64748B] group-hover:text-[#94A3B8] mt-0.5">
                ({{ HOME_COPY.hero.chatSubmitLabel }})
              </span>
            </button>
          </form>

          <div class="relative z-10 mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <button
              v-for="chip in HOME_COPY.hero.chatChips"
              :key="chip.id"
              type="button"
              class="inline-flex items-center px-3.5 py-1.5 rounded-full border border-dashed bg-[#10141B]/80 backdrop-blur-sm font-mono text-[9.5px] tracking-[0.09em] transition-all duration-fast ease-signal cursor-pointer"
              :class="
                hoveredChipHint === chip.hint && chatTipVisible
                  ? 'border-[#64748B] text-[#E2E8F0] bg-[#1C2430]/90'
                  : 'border-[#2D3746] text-[#7D8C9F] hover:border-[#475569] hover:text-[#CBD5E1]'
              "
              @mouseenter="showChatTip(chip.hint)"
              @focus="showChatTip(chip.hint)"
              @click="selectChipPreview(chip)"
            >
              <span>{{ chip.label }}</span>
            </button>
          </div>

          <Transition
            enter-active-class="transition duration-200 ease-signal"
            enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-150 ease-signal"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-[0.98]"
          >
            <div
              v-if="chatTipVisible"
              id="ask-ascend-coming-soon-tip"
              role="tooltip"
              class="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-40 w-full max-w-[540px] rounded-xl bg-[#11151C]/95 border border-[#334155]/85 backdrop-blur-md px-3.5 py-2.5 text-left shadow-[0_14px_36px_rgba(0,0,0,0.82)]"
              @mouseenter="showChatTip()"
              @mouseleave="scheduleHideChatTip"
            >
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="px-1.5 py-0.5 rounded bg-signal-amber/20 border border-signal-amber/45 font-mono text-[8px] font-bold tracking-[0.08em] text-signal-amber uppercase">
                  {{ HOME_COPY.hero.chatComingSoonBadge }}
                </span>
                <NuxtLink
                  to="/map"
                  class="inline-flex items-center gap-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-mint hover:text-[#34D399]"
                >
                  <span>Explore live map</span>
                  <ArrowRight class="w-3 h-3" />
                </NuxtLink>
              </div>
              <p class="font-sans text-[11.5px] leading-snug text-[#94A3B8]">
                {{ hoveredChipHint ?? HOME_COPY.hero.chatComingSoonBody }}
              </p>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>
