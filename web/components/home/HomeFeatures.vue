<script setup lang="ts">
import {
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Lock,
  Sparkles,
  X,
} from 'lucide-vue-next'
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

type FeatureItem = (typeof HOME_COPY.value.features.items)[number]

const activeComingSoon = ref<FeatureItem | null>(null)

const upcomingDetails: Record<string, { roadmap: string; whatYouCanDoNow: string }> = {
  breakeven: {
    roadmap: 'Planned for Phase 2: enter your cup price, cost per cup, and monthly rent to see daily cup targets side by side with local competition.',
    whatYouCanDoNow: 'Right now you can already inspect shop counts within 500 m and expected local demand for all 1,976 areas on the live map.',
  },
  'ask-ascend': {
    roadmap: 'Planned for Phase 2: describe your ideal customer profile or budget in plain English to highlight matching neighborhoods on the map.',
    whatYouCanDoNow: 'Right now you can click any green Opportunity area on the live map and read its top three demand drivers in plain language.',
  },
  compare: {
    roadmap: 'Planned for Phase 2: place 2 to 3 shortlisted areas side by side to compare market room, confidence badges, and local drivers in one view.',
    whatYouCanDoNow: 'Right now you can save up to 10 candidate spots in your browser Shortlist on the live map and jump between them in one click.',
  },
  'rent-check': {
    roadmap: 'Planned for Phase 2: store private lease quotes locally in your browser and weigh monthly rent against each area’s supply and demand balance.',
    whatYouCanDoNow: 'Right now you can shortlist target hexagons on the live map before negotiating a lease with landlords.',
  },
}

function openComingSoon(card: FeatureItem) {
  activeComingSoon.value = card
}

function closeComingSoon() {
  activeComingSoon.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && activeComingSoon.value) {
    closeComingSoon()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <section id="fitur" class="relative py-20 sm:py-24 bg-ground bg-signal-dots">
    <div class="mx-auto max-w-frame px-5 sm:px-8">
      <!-- Header -->
      <div class="max-w-3xl mb-12 sm:mb-14">
        <p
          v-reveal="{ variant: 'up' }"
          class="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-mint mb-3"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(16,185,129,0.85)]" aria-hidden="true" />
          <span>{{ HOME_COPY.features.eyebrow }}</span>
        </p>
        <h2 v-reveal="{ variant: 'up', delay: 80 }" class="font-editorial font-semibold text-ink-primary text-[32px] sm:text-[42px] leading-[1.15] tracking-[-0.01em]">
          {{ HOME_COPY.features.headlinePrefix }}
          <span class="editorial-mint">{{ HOME_COPY.features.headlineAccent }}</span>{{ HOME_COPY.features.headlineSuffix }}
        </h2>
      </div>

      <!-- Symmetric 2 - 3 - 2 Bento Grid (Hover Lift, Ambient Bubble Backdrop, Shadow-Separated Tinted Visuals) -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div
          v-for="(card, idx) in HOME_COPY.features.items"
          :key="card.id"
          v-reveal="{ variant: 'up', delay: idx * 65 }"
          :class="card.cols"
          class="h-full"
        >
          <!-- ==================== LIVE AVAILABLE CARDS (01, 02, 03) ==================== -->
          <NuxtLink
            v-if="card.status === 'available'"
            :to="card.href ?? '/map'"
            :class="
              card.layout === 'horizontal'
                ? 'grid grid-cols-1 sm:grid-cols-12 min-h-[262px]'
                : 'flex flex-col justify-between min-h-[346px]'
            "
            class="feat-bento-live group block h-full w-full"
          >
            <!-- Primary-Mint Ambient Bubble Backdrop Across Card -->
            <div class="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
              <span
                class="absolute -top-12 -right-10 w-44 h-44 rounded-full blur-2xl opacity-45 group-hover:opacity-75 transition-opacity duration-500"
                style="background: radial-gradient(circle, rgba(16, 185, 129, 0.55) 0%, transparent 72%);"
              />
              <span
                class="ascend-bubble-a absolute -bottom-8 -left-6 w-28 h-28 rounded-full border border-mint/20 opacity-45 group-hover:opacity-70 transition-opacity duration-500"
                style="background: radial-gradient(circle at 35% 30%, rgba(52, 211, 153, 0.24) 0%, rgba(16, 185, 129, 0.06) 62%, transparent 100%);"
              />
              <span
                class="ascend-bubble-b absolute top-6 left-[42%] w-10 h-10 rounded-full border border-[#34D399]/25 opacity-35 group-hover:opacity-65 transition-opacity duration-500"
                style="background: radial-gradient(circle at 30% 30%, rgba(110, 231, 183, 0.3) 0%, transparent 74%);"
              />
            </div>

            <!-- HORIZONTAL LIVE CARDS (01 Labeled Map & 02 Area Card): Dark Copy Left, Primary-Mint Visual Right Separated by Shadow -->
            <template v-if="card.layout === 'horizontal'">
              <div class="relative z-20 sm:col-span-6 p-6 sm:p-7 flex flex-col justify-between bg-[#0E141C]/90">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-mint whitespace-nowrap">
                      <span class="w-1.5 h-1.5 rounded-full bg-mint shrink-0" aria-hidden="true" />
                      {{ card.eyebrow }}
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-mint/[0.12] border border-mint/40 font-mono text-[8.5px] font-bold tracking-[0.08em] text-mint uppercase shrink-0">
                      {{ HOME_COPY.features.availableBadge }}
                    </span>
                  </div>

                  <h3 class="mt-4 font-editorial font-semibold text-ink-primary text-[22px] sm:text-[24px] leading-snug inline-flex items-center gap-2.5">
                    <span>{{ card.title }}</span>
                    <span
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-mint/20 border border-mint/60 text-mint shadow-[0_0_12px_rgba(16,185,129,0.35)] shrink-0"
                      title="Available now"
                    >
                      <Check class="w-3 h-3" :stroke-width="2.75" />
                    </span>
                  </h3>

                  <p class="mt-2.5 font-sans text-[13.5px] sm:text-[14px] leading-[1.64] text-ink-secondary">
                    {{ card.description }}
                  </p>
                </div>
              </div>

              <!-- Primary-Mint Tinted Animation Panel Separated Purely by Soft Cast Shadow -->
              <div class="feat-visual-mint relative sm:col-span-6 min-h-[192px] sm:min-h-full flex items-center justify-center overflow-hidden px-4 py-5 sm:py-4">
                <!-- Glossy Mint Floating Bubbles Inside Animation Zone -->
                <span
                  class="ascend-bubble-a pointer-events-none absolute top-3 right-5 w-14 h-14 rounded-full border border-[#A7F3D0]/30"
                  style="background: radial-gradient(circle at 30% 28%, rgba(236, 253, 245, 0.24) 0%, rgba(16, 185, 129, 0.14) 55%, transparent 100%);"
                  aria-hidden="true"
                />
                <span
                  class="ascend-bubble-b pointer-events-none absolute bottom-3 left-8 w-8 h-8 rounded-full border border-[#6EE7B7]/35"
                  style="background: radial-gradient(circle at 32% 30%, rgba(236, 253, 245, 0.25) 0%, rgba(20, 184, 166, 0.14) 65%, transparent 100%);"
                  aria-hidden="true"
                />

                <!-- 01: Labeled Map: Animated Bandung Hex Cluster -->
                <svg
                  v-if="card.id === 'labeled-map'"
                  viewBox="0 0 260 190"
                  class="relative z-10 w-full max-w-[250px] h-[175px] drop-shadow-[0_10px_22px_rgba(2,14,11,0.45)]"
                  fill="none"
                  aria-hidden="true"
                >
                  <!-- Subtle top scope pill -->
                  <rect x="64" y="6" width="176" height="22" rx="11" fill="#081614" fill-opacity="0.88" stroke="#34D399" stroke-opacity="0.52" />
                  <circle cx="78" cy="17" r="3" fill="#00E5A8" />
                  <text x="159" y="20.5" text-anchor="middle" fill="#D1FAE5" font-family="Space Mono, monospace" font-size="8.2" letter-spacing="0.7">
                    1,976 AREAS · OPEN DATA
                  </text>

                  <!-- Connected hex map cluster (Mint Opportunity, Amber Fair, Coral Crowded, Slate) -->
                  <g transform="translate(132, 110)">
                    <!-- Top row -->
                    <polygon points="-28,-58 -8,-46 -8,-22 -28,-10 -48,-22 -48,-46" fill="#10B981" fill-opacity="0.88" stroke="#061613" stroke-width="2" class="feat-hex-b" />
                    <polygon points="14,-58 34,-46 34,-22 14,-10 -6,-22 -6,-46" fill="#EF4444" fill-opacity="0.86" stroke="#061613" stroke-width="2" />
                    <polygon points="56,-58 76,-46 76,-22 56,-10 36,-22 36,-46" fill="#059669" fill-opacity="0.74" stroke="#061613" stroke-width="2" />
                    <!-- Middle row -->
                    <polygon points="-49,-22 -29,-10 -29,14 -49,26 -69,14 -69,-10" fill="#1E293B" fill-opacity="0.82" stroke="#061613" stroke-width="2" />
                    <polygon points="-7,-22 13,-10 13,14 -7,26 -27,14 -27,-10" fill="#00E5A8" fill-opacity="0.96" stroke="#ECFDF5" stroke-width="2.2" class="feat-hex-a" />
                    <polygon points="35,-22 55,-10 55,14 35,26 15,14 15,-10" fill="#F59E0B" fill-opacity="0.9" stroke="#061613" stroke-width="2" />
                    <polygon points="77,-22 97,-10 97,14 77,26 57,14 57,-10" fill="#10B981" fill-opacity="0.82" stroke="#061613" stroke-width="2" class="feat-hex-c" />
                    <!-- Bottom row -->
                    <polygon points="-28,14 -8,26 -8,50 -28,62 -48,50 -48,26" fill="#F59E0B" fill-opacity="0.78" stroke="#061613" stroke-width="2" />
                    <polygon points="14,14 34,26 34,50 14,62 -6,50 -6,26" fill="#10B981" fill-opacity="0.9" stroke="#061613" stroke-width="2" class="feat-hex-b" />
                    <polygon points="56,14 76,26 76,50 56,62 36,50 36,26" fill="#0F172A" fill-opacity="0.78" stroke="#94A3B8" stroke-width="1.4" stroke-dasharray="4 3" />

                    <!-- Center crisp upward chevron icon -->
                    <path d="M-12 2L-7 -3L-2 2M-12 7L-7 2L-2 7" stroke="#041812" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                </svg>

                <!-- 02: Area Card: Animated Supply vs Demand + Top 3 Drivers over Primary-Mint Backdrop -->
                <div v-else-if="card.id === 'area-card'" class="relative z-10 w-full max-w-[238px] space-y-3.5 py-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-mono text-[11px] font-bold tracking-[0.12em] text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">CAMPUS QUARTER</span>
                    <span class="px-2 py-0.5 rounded-full bg-[#061813]/85 border border-[#6EE7B7]/55 font-mono text-[8.5px] font-bold text-[#A7F3D0] uppercase">
                      OPPORTUNITY
                    </span>
                  </div>

                  <div class="space-y-2.5">
                    <div>
                      <div class="flex items-center justify-between font-mono text-[9.5px] text-[#D1FAE5] mb-1">
                        <span>SHOPS (~500 M)</span>
                        <span class="font-bold text-white">3</span>
                      </div>
                      <div class="h-1.5 rounded-full bg-[#061813]/65 overflow-hidden">
                        <div class="h-full w-[38%] rounded-full bg-signal-amber feat-bar-a" />
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center justify-between font-mono text-[9.5px] text-[#D1FAE5] mb-1">
                        <span>DEMAND SUPPORTS</span>
                        <span class="font-bold text-[#6EE7B7]">~8.2</span>
                      </div>
                      <div class="h-1.5 rounded-full bg-[#061813]/65 overflow-hidden">
                        <div class="h-full w-[86%] rounded-full bg-gradient-to-r from-[#A7F3D0] to-[#00E5A8] feat-bar-b" />
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-1.5 pt-1">
                    <span class="px-2 py-0.5 rounded-full bg-[#061813]/75 border border-[#6EE7B7]/30 text-[#D1FAE5] font-mono text-[8.5px] tracking-[0.06em]">
                      + Residents
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-[#061813]/75 border border-[#6EE7B7]/30 text-[#D1FAE5] font-mono text-[8.5px] tracking-[0.06em]">
                      + Campuses
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-[#061813]/65 border border-white/15 text-[#E2E8F0] font-mono text-[8.5px] tracking-[0.06em]">
                      + Transit
                    </span>
                  </div>
                </div>

                <!-- Shadow-only separation between left text zone and right primary-mint animation zone -->
                <div
                  class="pointer-events-none hidden sm:block absolute inset-y-0 left-0 w-16 z-10"
                  style="background: linear-gradient(90deg, #0E141C 0%, rgba(14, 20, 28, 0.72) 28%, rgba(6, 22, 19, 0.18) 65%, transparent 100%);"
                  aria-hidden="true"
                />
                <div
                  class="pointer-events-none sm:hidden absolute inset-x-0 top-0 h-10 z-10"
                  style="background: linear-gradient(180deg, #0E141C 0%, rgba(14, 20, 28, 0.65) 40%, transparent 100%);"
                  aria-hidden="true"
                />
              </div>
            </template>

            <!-- VERTICAL LIVE CARD (03 Shortlist): Primary-Mint Visual Top, Dark Copy Bottom Separated by Shadow -->
            <template v-else>
              <div class="feat-visual-mint relative h-[174px] overflow-hidden px-6 pt-5 pb-4 flex flex-col justify-center gap-2">
                <!-- Soft floating mint bubble inside top visual panel -->
                <span
                  class="ascend-bubble-a pointer-events-none absolute -top-3 right-6 w-14 h-14 rounded-full border border-[#A7F3D0]/30"
                  style="background: radial-gradient(circle at 30% 28%, rgba(236, 253, 245, 0.24) 0%, rgba(16, 185, 129, 0.16) 58%, transparent 100%);"
                  aria-hidden="true"
                />

                <div class="relative z-10 feat-shortlist-1 flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.12] bg-[#071613]/75 backdrop-blur-sm">
                  <span class="flex items-center gap-2 font-sans text-[12px] font-medium text-white">
                    <Bookmark class="w-3.5 h-3.5 text-[#34D399]" :stroke-width="2" />
                    Campus Quarter
                  </span>
                  <span class="font-mono text-[10.5px] font-bold text-[#6EE7B7]">3 vs ~8.2</span>
                </div>

                <div class="relative z-10 feat-shortlist-2 flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.12] bg-[#071613]/75 backdrop-blur-sm">
                  <span class="flex items-center gap-2 font-sans text-[12px] font-medium text-white">
                    <Bookmark class="w-3.5 h-3.5 text-[#34D399]" :stroke-width="2" />
                    Transit Corridor
                  </span>
                  <span class="font-mono text-[10.5px] font-bold text-[#6EE7B7]">2 vs ~6.4</span>
                </div>

                <div class="relative z-10 feat-shortlist-3 flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.12] bg-[#071613]/72 backdrop-blur-sm">
                  <span class="flex items-center gap-2 font-sans text-[12px] text-[#D1FAE5]">
                    <Bookmark class="w-3.5 h-3.5 text-signal-amber" :stroke-width="2" />
                    Market Square
                  </span>
                  <span class="font-mono text-[10.5px] text-[#A7F3D0]/80">4 vs ~4.5</span>
                </div>

                <!-- Shadow-only bottom fade separating primary-mint visual cleanly from dark obsidian copy -->
                <div
                  class="pointer-events-none absolute inset-x-0 bottom-0 h-14 z-10"
                  style="background: linear-gradient(180deg, transparent 0%, rgba(13, 19, 26, 0.78) 65%, #0D131A 100%);"
                  aria-hidden="true"
                />
              </div>

              <div class="relative z-20 px-6 pb-6 pt-2 bg-[#0D131A]/95">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mint">
                    <span class="w-1.5 h-1.5 rounded-full bg-mint" aria-hidden="true" />
                    {{ card.eyebrow }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full bg-mint/[0.12] border border-mint/40 font-mono text-[8.5px] font-bold tracking-[0.08em] text-mint uppercase">
                    {{ HOME_COPY.features.availableBadge }}
                  </span>
                </div>

                <h3 class="mt-3 font-editorial font-semibold text-ink-primary text-[22px] leading-snug inline-flex items-center gap-2.5">
                  <span>{{ card.title }}</span>
                  <span
                    class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-mint/20 border border-mint/60 text-mint shadow-[0_0_12px_rgba(16,185,129,0.35)] shrink-0"
                    title="Available now"
                  >
                    <Check class="w-3 h-3" :stroke-width="2.75" />
                  </span>
                </h3>

                <p class="mt-2 font-sans text-[13.5px] leading-[1.62] text-ink-secondary">
                  {{ card.description }}
                </p>
              </div>
            </template>
          </NuxtLink>

          <!-- ==================== COMING SOON CARDS (04, 05, 06, 07: GREY BUBBLES + LIFT + CLOCK ICON) ==================== -->
          <button
            v-else
            type="button"
            :class="
              card.layout === 'horizontal'
                ? 'grid grid-cols-1 sm:grid-cols-12 min-h-[244px]'
                : 'flex flex-col justify-between min-h-[346px]'
            "
            class="feat-bento-soon text-left group cursor-pointer h-full w-full"
            @click="openComingSoon(card)"
          >
            <!-- Neutral Grey Ambient Bubble Backdrop Across Coming Soon Card -->
            <div class="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
              <span
                class="absolute -top-12 -right-10 w-40 h-40 rounded-full blur-2xl opacity-35 group-hover:opacity-60 transition-opacity duration-500"
                style="background: radial-gradient(circle, rgba(148, 163, 184, 0.36) 0%, transparent 72%);"
              />
              <span
                class="ascend-bubble-a absolute -bottom-8 -left-6 w-24 h-24 rounded-full border border-[#94A3B8]/20 opacity-40 group-hover:opacity-65 transition-opacity duration-500"
                style="background: radial-gradient(circle at 34% 30%, rgba(148, 163, 184, 0.2) 0%, rgba(71, 85, 105, 0.06) 62%, transparent 100%);"
              />
              <span
                class="ascend-bubble-b absolute top-6 left-[42%] w-9 h-9 rounded-full border border-[#94A3B8]/22 opacity-35 group-hover:opacity-60 transition-opacity duration-500"
                style="background: radial-gradient(circle at 30% 30%, rgba(203, 213, 225, 0.2) 0%, transparent 72%);"
              />
            </div>

            <!-- VERTICAL COMING SOON CARDS (04 Break-even & 05 Ask Ascend): Grey Visual Top, Copy Bottom Separated by Shadow -->
            <template v-if="card.layout === 'vertical'">
              <div class="feat-visual-grey relative h-[174px] w-full overflow-hidden px-6 pt-5 pb-4 flex flex-col justify-center">
                <!-- Subtle grey floating bubble in top visual zone -->
                <span
                  class="ascend-bubble-a pointer-events-none absolute -top-3 right-6 w-12 h-12 rounded-full border border-[#CBD5E1]/20"
                  style="background: radial-gradient(circle at 30% 28%, rgba(226, 232, 240, 0.16) 0%, rgba(100, 116, 139, 0.12) 60%, transparent 100%);"
                  aria-hidden="true"
                />

                <!-- 04: Break-even Calculator (Monochrome Grey Animated Gauge) -->
                <div v-if="card.id === 'breakeven'" class="relative z-10 w-full space-y-3 opacity-90">
                  <div class="flex items-center gap-2">
                    <span class="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0E131B]/75 border border-white/[0.08] font-mono text-[9.5px] text-[#CBD5E1]">
                      Price Rp 18k
                    </span>
                    <span class="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0E131B]/75 border border-white/[0.08] font-mono text-[9.5px] text-[#CBD5E1]">
                      Cost Rp 8k
                    </span>
                  </div>

                  <div>
                    <div class="flex items-baseline justify-between mb-1.5">
                      <span class="font-mono text-[9px] uppercase tracking-[0.12em] text-[#94A3B8]">DAILY TARGET</span>
                      <span class="font-display font-bold text-[19px] text-[#E2E8F0]">20 cups/day</span>
                    </div>
                    <div class="h-1.5 w-full rounded-full bg-[#0C1118]/75 overflow-hidden">
                      <div class="h-full w-[68%] rounded-full bg-gradient-to-r from-[#64748B] to-[#CBD5E1] feat-bar-a" />
                    </div>
                  </div>
                </div>

                <!-- 05: Ask Ascend (Monochrome Grey Chat-to-Hex Flow) -->
                <div v-else class="relative z-10 w-full flex flex-col items-center justify-center gap-2.5 opacity-90">
                  <div class="w-full px-3 py-2 rounded-full bg-[#0E131B]/80 border border-white/10 flex items-center justify-between gap-2">
                    <span class="font-sans text-[11px] text-[#CBD5E1] truncate">
                      "Quiet student areas?"<span class="feat-cursor inline-block w-[1.5px] h-3 bg-[#CBD5E1] align-middle ml-0.5" />
                    </span>
                    <span class="w-5 h-5 rounded-full bg-[#334155]/90 flex items-center justify-center shrink-0">
                      <ArrowRight class="w-3 h-3 text-[#E2E8F0]" />
                    </span>
                  </div>

                  <svg viewBox="0 0 210 56" class="w-full h-[54px]" fill="none" aria-hidden="true">
                    <path d="M 105 2 L 62 24" stroke="#94A3B8" stroke-width="1.2" class="bs-dash-flow" />
                    <path d="M 78 28 L 116 28" stroke="#94A3B8" stroke-width="1.2" class="bs-dash-flow" />
                    <polygon points="56,10 72,19 72,37 56,46 40,37 40,19" fill="#1E293B" fill-opacity="0.85" stroke="#CBD5E1" stroke-width="1.3" class="feat-hex-a" />
                    <text x="56" y="31" text-anchor="middle" fill="#E2E8F0" font-family="Space Mono, monospace" font-size="9.5" font-weight="700">3</text>
                    <rect x="116" y="16" width="84" height="24" rx="12" fill="#0F151E" fill-opacity="0.88" stroke="#64748B" stroke-width="1" />
                    <text x="158" y="31" text-anchor="middle" fill="#CBD5E1" font-family="Space Mono, monospace" font-size="8.5" letter-spacing="0.6">
                      3 AREAS
                    </text>
                  </svg>
                </div>

                <!-- Shadow-only bottom fade melting grey visual smoothly into copy -->
                <div
                  class="pointer-events-none absolute inset-x-0 bottom-0 h-14 z-10"
                  style="background: linear-gradient(180deg, transparent 0%, rgba(16, 20, 27, 0.82) 66%, #10141B 100%);"
                  aria-hidden="true"
                />
              </div>

              <div class="relative z-20 px-6 pb-6 pt-2 w-full bg-[#10141B]/95">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#64748B]">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#64748B]" aria-hidden="true" />
                    {{ card.eyebrow }}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-signal-amber/[0.12] border border-signal-amber/40 font-mono text-[8.5px] font-bold tracking-[0.08em] text-signal-amber uppercase">
                    {{ HOME_COPY.features.comingSoonBadge }}
                  </span>
                </div>

                <h3 class="mt-3 font-editorial font-semibold text-[#94A3B8] group-hover:text-[#CBD5E1] text-[22px] leading-snug inline-flex items-center gap-2.5 transition-colors">
                  <span>{{ card.title }}</span>
                  <span
                    class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#334155]/45 border border-[#64748B]/55 text-[#94A3B8] shrink-0"
                    title="Coming soon"
                  >
                    <Clock class="w-3 h-3" :stroke-width="2.2" />
                  </span>
                </h3>

                <p class="mt-2 font-sans text-[13.5px] leading-[1.62] text-[#7D8A9C]">
                  {{ card.description }}
                </p>
              </div>
            </template>

            <!-- HORIZONTAL COMING SOON CARDS (06 Compare Areas & 07 Rent Check): Copy Left, Grey Visual Right Separated by Shadow -->
            <template v-else>
              <div class="relative z-20 sm:col-span-6 p-6 sm:p-7 flex flex-col justify-between bg-[#10141B]/92">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#64748B] whitespace-nowrap">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#64748B] shrink-0" aria-hidden="true" />
                      {{ card.eyebrow }}
                    </span>
                    <span class="px-2 py-0.5 rounded bg-signal-amber/[0.12] border border-signal-amber/40 font-mono text-[8.5px] font-bold tracking-[0.08em] text-signal-amber uppercase shrink-0">
                      {{ HOME_COPY.features.comingSoonBadge }}
                    </span>
                  </div>

                  <h3 class="mt-4 font-editorial font-semibold text-[#94A3B8] group-hover:text-[#CBD5E1] text-[22px] sm:text-[23px] leading-snug inline-flex items-center gap-2.5 transition-colors">
                    <span>{{ card.title }}</span>
                    <span
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#334155]/45 border border-[#64748B]/55 text-[#94A3B8] shrink-0"
                      title="Coming soon"
                    >
                      <Clock class="w-3 h-3" :stroke-width="2.2" />
                    </span>
                  </h3>

                  <p class="mt-2.5 font-sans text-[13.5px] sm:text-[14px] leading-[1.64] text-[#7D8A9C]">
                    {{ card.description }}
                  </p>
                </div>
              </div>

              <!-- Grey Tinted Animated Visual Separated Purely by Soft Cast Shadow -->
              <div class="feat-visual-grey relative sm:col-span-6 min-h-[172px] sm:min-h-full flex items-center justify-center overflow-hidden px-5 py-5">
                <!-- Subtle grey floating bubbles in animation zone -->
                <span
                  class="ascend-bubble-a pointer-events-none absolute top-3 right-5 w-12 h-12 rounded-full border border-[#CBD5E1]/20"
                  style="background: radial-gradient(circle at 30% 28%, rgba(226, 232, 240, 0.16) 0%, rgba(100, 116, 139, 0.12) 60%, transparent 100%);"
                  aria-hidden="true"
                />
                <span
                  class="ascend-bubble-b pointer-events-none absolute bottom-3 left-8 w-7 h-7 rounded-full border border-[#94A3B8]/25"
                  style="background: radial-gradient(circle at 32% 30%, rgba(203, 213, 225, 0.18) 0%, transparent 70%);"
                  aria-hidden="true"
                />

                <!-- 06: Compare Areas: Monochrome Grey Side-by-Side Bars -->
                <div v-if="card.id === 'compare'" class="relative z-10 w-full max-w-[230px] flex items-end justify-between gap-4 h-[132px] pt-4 opacity-90">
                  <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span class="font-mono text-[10px] text-[#CBD5E1]">8.2</span>
                    <div class="w-full h-[82px] rounded-t-lg bg-gradient-to-t from-[#334155]/85 to-[#CBD5E1]/85 feat-compare-1" />
                    <span class="font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#94A3B8]">Coblong</span>
                  </div>

                  <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span class="font-mono text-[10px] text-[#94A3B8]">6.4</span>
                    <div class="w-full h-[60px] rounded-t-lg bg-gradient-to-t from-[#263140]/85 to-[#94A3B8]/80 feat-compare-2" />
                    <span class="font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#94A3B8]">Lengkong</span>
                  </div>

                  <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span class="font-mono text-[10px] text-[#94A3B8]">4.5</span>
                    <div class="w-full h-[42px] rounded-t-lg bg-gradient-to-t from-[#1E2733]/90 to-[#64748B]/80 feat-compare-1" />
                    <span class="font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#94A3B8]">Sukapura</span>
                  </div>
                </div>

                <!-- 07: Rent Check: Monochrome Grey Rent vs Local Room Balance Bar -->
                <div v-else class="relative z-10 w-full max-w-[236px] space-y-3.5 opacity-90">
                  <div class="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-[#CBD5E1]">
                    <span>MONTHLY RENT</span>
                    <span>LOCAL ROOM</span>
                  </div>

                  <div class="relative h-4 rounded-full bg-[#0C1118]/75 p-1 flex items-center gap-1 overflow-hidden">
                    <div class="h-full w-[42%] rounded-l-full bg-[#64748B]/85" />
                    <div class="h-full flex-1 rounded-r-full bg-[#CBD5E1]/75" />
                    <span class="feat-rent-marker absolute left-[38%] w-2.5 h-2.5 rounded-full bg-[#F8FAFC] shadow-[0_0_10px_rgba(248,250,252,0.7)]" />
                  </div>

                  <div class="flex items-center justify-between gap-2 pt-1">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E131B]/75 border border-white/[0.08] font-mono text-[9px] text-[#CBD5E1]">
                      <Lock class="w-3 h-3 text-[#94A3B8]" />
                      Private quote
                    </span>
                    <span class="px-2.5 py-1 rounded-lg bg-[#0E131B]/75 border border-white/[0.08] font-mono text-[9px] text-[#94A3B8]">
                      Rp/month
                    </span>
                  </div>
                </div>

                <!-- Shadow-only horizontal fade separating text cleanly from grey visual zone -->
                <div
                  class="pointer-events-none hidden sm:block absolute inset-y-0 left-0 w-16 z-10"
                  style="background: linear-gradient(90deg, #10141B 0%, rgba(16, 20, 27, 0.72) 28%, rgba(16, 20, 27, 0.2) 65%, transparent 100%);"
                  aria-hidden="true"
                />
                <div
                  class="pointer-events-none sm:hidden absolute inset-x-0 top-0 h-10 z-10"
                  style="background: linear-gradient(180deg, #10141B 0%, rgba(16, 20, 27, 0.65) 40%, transparent 100%);"
                  aria-hidden="true"
                />
              </div>
            </template>
          </button>
        </div>
      </div>
    </div>

    <!-- Coming Soon Interactive Preview Modal (Neutral Grey + Warm Amber COMING SOON badge) -->
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
          v-if="activeComingSoon"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          :aria-label="`${activeComingSoon.title} coming soon preview`"
          @click.self="closeComingSoon"
        >
          <div class="w-full max-w-md rounded-2xl bg-[#131820] border border-[#334155]/85 p-6 space-y-4 shadow-[0_28px_80px_rgba(0,0,0,0.85)]">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1.5">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-signal-amber/15 border border-signal-amber/45 font-mono text-[9.5px] font-bold tracking-[0.08em] text-signal-amber uppercase">
                  <Sparkles class="w-3 h-3" />
                  <span>COMING SOON · UPCOMING FEATURE</span>
                </span>
                <h3 class="font-editorial font-semibold text-[24px] text-ink-primary leading-snug">
                  {{ activeComingSoon.title }}
                </h3>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-lg bg-abyss border border-[#232836] flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
                aria-label="Close preview"
                @click="closeComingSoon"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <p class="font-sans text-[14px] leading-relaxed text-ink-secondary">
              {{ upcomingDetails[activeComingSoon.id]?.roadmap ?? activeComingSoon.description }}
            </p>

            <div class="rounded-xl bg-abyss border border-[#232836] p-3.5 space-y-1">
              <p class="font-mono text-[10px] uppercase tracking-[0.12em] text-mint">
                AVAILABLE TODAY
              </p>
              <p class="font-sans text-[13px] leading-relaxed text-ink-secondary">
                {{ upcomingDetails[activeComingSoon.id]?.whatYouCanDoNow }}
              </p>
            </div>

            <div class="pt-1 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                class="btn-ghost h-10 px-4 text-[13px]"
                @click="closeComingSoon"
              >
                Close
              </button>
              <NuxtLink
                to="/map"
                class="btn-mint h-10 px-5 text-[13px] group"
                @click="closeComingSoon"
              >
                <span>Open live map</span>
                <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
