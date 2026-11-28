<script setup lang="ts">
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bike,
  Bookmark,
  BookmarkCheck,
  Calculator,
  Car,
  ChevronRight,
  Coffee,
  Eye,
  EyeOff,
  Footprints,
  Loader2,
  LocateFixed,
  Navigation,
  Scale,
  Sparkles,
  Store,
  Tag,
  UtensilsCrossed,
} from 'lucide-vue-next'
import type { AreaFeature } from '~/types/areas'
import { factorDirection } from '~/types/areas'
import { MAP_LABEL_COPY, formatDistanceKm, formatExpectedCount } from '~/utils/mapPatterns'
import {
  formatRouteDistance,
  formatRouteDuration,
  type RouteResult,
  type TravelMode,
} from '~/utils/mapRouting'

const props = defineProps<{
  feature: AreaFeature
  saved: boolean
  limitReached: boolean
  storageAvailable: boolean
  distanceKm?: number | null
  hasUserLocation?: boolean
  locatingUser?: boolean
  routeVisible?: boolean
  routeLoading?: boolean
  travelMode?: TravelMode
  routesByMode?: Partial<Record<TravelMode, RouteResult>>
}>()

const emit = defineEmits<{
  back: []
  toggleShortlist: []
  openAsk: []
  requestLocation: []
  toggleRoute: []
  selectTravelMode: [mode: TravelMode]
  openAbout: []
}>()

const settings = useAscendSettings()

const travelModes = computed<Array<{ id: TravelMode; label: string; icon: typeof Footprints }>>(() => [
  { id: 'walking', label: settings.t('Walking', 'Jalan kaki'), icon: Footprints },
  { id: 'driving', label: settings.t('Driving', 'Berkendara'), icon: Car },
  { id: 'cycling', label: settings.t('Cycling', 'Sepeda'), icon: Bike },
])

const currentTravelMode = computed<TravelMode>(() => props.travelMode ?? 'walking')
const activeRoute = computed<RouteResult | null>(
  () => props.routesByMode?.[currentTravelMode.value] ?? null,
)

const p = computed(() => props.feature.properties)
const labelInfo = computed(() => MAP_LABEL_COPY[p.value.label])
const localizedLabelInfo = computed(() => settings.labelText.value[p.value.label])
const expectedFormatted = computed(() => formatExpectedCount(p.value.expected_k1))

const districtTitle = computed(() => p.value.kecamatan || settings.t('Unnamed area', 'Area tanpa nama'))
const areaSubtitle = computed(() => settings.formatAreaName(p.value.area_name))

// Scale NOW vs SUPPORTS bars proportionally on a shared visual axis
const barScaleMax = computed(() => Math.max(p.value.actual_k1, p.value.expected_k1, 1))
const actualBarPct = computed(() => {
  if (p.value.actual_k1 <= 0) return 0
  return Math.max(6, Math.min(100, (p.value.actual_k1 / barScaleMax.value) * 100))
})
const expectedBarPct = computed(() => {
  if (p.value.expected_k1 <= 0) return 0
  return Math.max(6, Math.min(100, (p.value.expected_k1 / barScaleMax.value) * 100))
})

const nowBarPatternStyle = computed(() => {
  const lbl = p.value.label
  if (lbl === 'opportunity') {
    return {
      backgroundColor: '#10B981',
      backgroundImage:
        'repeating-linear-gradient(-45deg, rgba(4, 47, 34, 0.35) 0 3px, transparent 3px 7px)',
    }
  }
  if (lbl === 'fair') {
    return {
      backgroundColor: '#F59E0B',
      backgroundImage:
        'repeating-linear-gradient(-45deg, rgba(69, 26, 3, 0.32) 0 3px, transparent 3px 7px)',
    }
  }
  if (lbl === 'crowded') {
    return {
      backgroundColor: '#EF4444',
      backgroundImage:
        'repeating-linear-gradient(45deg, rgba(69, 10, 10, 0.38) 0 3px, transparent 3px 7px)',
    }
  }
  return {
    backgroundColor: '#64748B',
    backgroundImage: 'radial-gradient(rgba(226, 232, 240, 0.35) 1px, transparent 1px)',
    backgroundSize: '5px 5px',
  }
})

// Data contract §6: only the sign of `effect` is used (direction). Every bar has the same
// width so the card never suggests an amount; factors are already ordered by strength.
const FACTOR_BAR_WIDTH_PCT = 80

const biggestPushText = computed(() => {
  const first = p.value.factors[0]
  if (!first) return settings.t('local neighborhood activity', 'aktivitas lingkungan sekitar')
  const txt = settings.translateFactor(first.text).trim()
  return txt.charAt(0).toLowerCase() + txt.slice(1)
})
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Scrollable Body (Compact Scale on < lg Bottom Sheet, Spacious on Desktop Dock) -->
    <div class="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-3.5 lg:px-5 lg:py-4 lg:space-y-5">
      <!-- Top Back Row + ESC Keycap -->
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-[11.5px] lg:text-[12px] font-sans text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
          @click="emit('back')"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>{{ settings.t('Back to map', 'Kembali ke peta') }}</span>
        </button>

        <span class="hidden lg:inline-flex px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 font-mono text-[9.5px] tracking-[0.1em] text-ink-muted uppercase">
          ESC
        </span>
      </div>

      <!-- Area Identity Header -->
      <div class="flex items-start gap-2.5 lg:gap-3.5">
        <div class="scale-90 lg:scale-100 origin-top-left shrink-0">
          <MapHexBadge :label="p.label" size="lg" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 class="font-editorial font-semibold text-[18px] lg:text-[22px] text-ink-primary leading-tight break-words">
              {{ districtTitle }}
            </h2>
            <span class="font-sans text-[11px] lg:text-[12px] text-ink-muted">
              {{ areaSubtitle }}
            </span>
          </div>

          <div class="mt-1.5 lg:mt-2 flex flex-wrap items-center gap-1.5">
            <UiLabelBadge :label="p.label" size="sm" uppercase />
            <span
              v-if="p.confidence === 'low'"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-[#94A3B8]/65 bg-white/[0.04] font-mono text-[9px] lg:text-[9.5px] font-bold uppercase tracking-[0.06em] text-[#CBD5E1]"
            >
              {{ settings.confidenceText.value.low.title }}
            </span>
            <span
              v-if="distanceKm !== null && distanceKm !== undefined"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint/15 border border-mint/40 font-mono text-[9px] lg:text-[9.5px] font-semibold tracking-[0.04em] text-mint"
            >
              <Navigation class="w-2.5 h-2.5" />
              <span>{{ formatDistanceKm(distanceKm) }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Label Meaning Summary (4 state-matched copies with bold emphasis & color-matched icon) -->
      <div class="space-y-1.5 lg:space-y-2">
        <p class="inline-flex items-center gap-1.5 font-mono text-[9px] lg:text-[9.5px] uppercase tracking-[0.14em] text-ink-muted">
          <Coffee class="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" :style="{ color: labelInfo.color }" />
          <span>{{ settings.t('COFFEE SHOP · LABEL FOR THIS AREA', 'KEDAI KOPI · LABEL AREA INI') }}</span>
        </p>

        <p class="font-sans text-[12.5px] lg:text-[13.5px] leading-[1.52] lg:leading-[1.58] text-ink-secondary">
          <template v-if="settings.isId.value">
            {{ localizedLabelInfo.headlineDescription }}
          </template>
          <template v-else-if="p.label === 'opportunity'">
            <strong class="font-semibold text-ink-primary">Fewer</strong>
            coffee shops than demand here typically supports.
          </template>
          <template v-else-if="p.label === 'fair'">
            Coffee shops here are
            <strong class="font-semibold text-ink-primary">about what</strong>
            demand typically supports.
          </template>
          <template v-else-if="p.label === 'crowded'">
            <strong class="font-semibold text-ink-primary">More</strong>
            coffee shops than demand here typically supports.
          </template>
          <template v-else>
            <strong class="font-semibold text-ink-primary">Too few</strong>
            people nearby for a coffee shop to be sure of steady custom.
          </template>
        </p>

        <p
          v-if="localizedLabelInfo.extraHint"
          class="font-sans text-[12px] leading-[1.55] text-ink-muted"
        >
          {{ localizedLabelInfo.extraHint }}
        </p>

        <!-- Low Confidence Honest Warning -->
        <div
          v-if="p.confidence === 'low'"
          class="mt-2.5 rounded-xl bg-signal-amber/10 border border-signal-amber/45 p-3 flex items-start gap-2.5"
        >
          <AlertTriangle class="w-4 h-4 text-signal-amber shrink-0 mt-0.5" :stroke-width="2" />
          <p class="font-sans text-[12px] leading-[1.55] text-[#FDE68A]">
            {{ settings.confidenceText.value.low.note }}
          </p>
        </div>
      </div>

      <!-- REAL-TIME ROUTE & REACH FROM USER PIN (HOW TO GET HERE) -->
      <div class="pt-4 border-t border-white/10 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <p class="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mint">
            <Navigation class="w-3.5 h-3.5 text-mint" />
            <span>{{ settings.t('HOW TO GET HERE', 'RUTE & JANGKAUAN') }}</span>
          </p>
          <span
            v-if="hasUserLocation && activeRoute"
            class="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted"
          >
            {{ activeRoute.source === 'osrm' ? settings.t('LIVE STREETS', 'JALAN LANGSUNG') : settings.t('ESTIMATED', 'PERKIRAAN') }}
          </span>
        </div>

        <!-- Primary Toggle or Locate Trigger -->
        <button
          v-if="!hasUserLocation"
          type="button"
          class="w-full h-11 px-4 rounded-full bg-[#152028] hover:bg-[#192A2D] border border-mint/45 hover:border-mint text-ink-primary font-sans text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.14)]"
          @click="emit('requestLocation')"
        >
          <Loader2 v-if="locatingUser" class="w-4 h-4 text-mint animate-spin" />
          <LocateFixed v-else class="w-4 h-4 text-mint" />
          <span>{{ locatingUser ? settings.t('Detecting your device location...', 'Mendeteksi lokasi perangkatmu...') : settings.t('Locate me to show route & reach', 'Deteksi lokasiku untuk rute & jangkauan') }}</span>
        </button>

        <button
          v-else
          type="button"
          class="w-full h-11 px-4 rounded-full font-sans text-[12.5px] font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
          :class="
            routeVisible
              ? 'bg-white/[0.06] border border-white/20 hover:border-mint/60 text-ink-primary'
              : 'btn-mint shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          "
          @click="emit('toggleRoute')"
        >
          <Loader2 v-if="routeLoading" class="w-4 h-4 animate-spin" />
          <EyeOff v-else-if="routeVisible" class="w-4 h-4 text-mint" />
          <Eye v-else class="w-4 h-4" />
          <span>{{ routeVisible ? settings.t('Hide route & reach', 'Sembunyikan rute & jangkauan') : settings.t('Show route & reach', 'Tampilkan rute & jangkauan') }}</span>
        </button>

        <!-- 3 Real-Time Travel Mode Cards (Walking | Driving | Cycling) -->
        <div
          v-if="hasUserLocation"
          class="grid grid-cols-3 gap-2"
        >
          <button
            v-for="m in travelModes"
            :key="m.id"
            type="button"
            class="rounded-xl p-2.5 text-center border transition-all cursor-pointer flex flex-col items-center gap-1"
            :class="
              currentTravelMode === m.id
                ? 'bg-mint/15 border-mint/70 text-ink-primary shadow-[0_0_16px_rgba(16,185,129,0.18)]'
                : 'bg-[#0B0F16]/90 border-white/10 hover:border-white/25 text-ink-secondary'
            "
            @click="emit('selectTravelMode', m.id)"
          >
            <component
              :is="m.icon"
              class="w-4 h-4"
              :class="currentTravelMode === m.id ? 'text-mint' : 'text-ink-muted'"
            />
            <span class="font-sans text-[11.5px] font-semibold leading-none">
              {{ m.label }}
            </span>
            <span class="font-mono text-[9.5px] leading-tight text-ink-muted tabular-nums">
              <template v-if="routesByMode?.[m.id]">
                {{ formatRouteDistance(routesByMode[m.id]!.distanceKm) }} · {{ formatRouteDuration(routesByMode[m.id]!.durationMin) }}
              </template>
              <template v-else-if="routeLoading && currentTravelMode === m.id">
                {{ settings.t('Routing...', 'Menghitung...') }}
              </template>
              <template v-else>
                {{ settings.t('Tap to load', 'Ketuk untuk muat') }}
              </template>
            </span>
          </button>
        </div>

        <!-- Live Street Distance Explanation Summary -->
        <p
          v-if="hasUserLocation && activeRoute"
          class="rounded-xl bg-[#0B0F16]/85 border border-white/[0.08] px-3 py-2 font-sans text-[11.5px] leading-snug text-ink-secondary"
        >
          <strong class="font-semibold text-ink-primary">
            {{ formatRouteDuration(activeRoute.durationMin) }}
          </strong>
          {{ travelModes.find(m => m.id === currentTravelMode)?.label.toLowerCase() }} {{ settings.t('to', 'ke') }} {{ districtTitle }} ·
          <strong class="font-semibold text-mint">
            {{ formatRouteDistance(activeRoute.distanceKm) }}
          </strong>
          {{ settings.t('via streets', 'via jalan') }} ({{ activeRoute.ratio }}x {{ settings.t('straight-line distance', 'jarak lurus') }}).
        </p>

        <p
          v-else-if="!hasUserLocation"
          class="font-sans text-[11.5px] leading-snug text-ink-muted"
        >
          {{ settings.t('Calculates real street distance and travel time from your current pin to this area.', 'Menghitung jarak jalan nyata dan waktu tempuh dari pin lokasimu ke area ini.') }}
        </p>

        <p class="font-sans text-[10.5px] leading-snug text-ink-muted/90">
          {{ settings.t(
            'Optional. Uses your device location; if that fails, an approximate location is looked up from your IP address (get.geojs.io, ipapi.co). Routes are calculated by public OSRM routing servers, which receive your location and this area. Ascend does not store it.',
            'Opsional. Memakai lokasi perangkatmu; jika gagal, lokasi perkiraan dicari dari alamat IP-mu (get.geojs.io, ipapi.co). Rute dihitung oleh server routing publik OSRM, yang menerima lokasimu dan area ini. Ascend tidak menyimpannya.',
          ) }}
        </p>
      </div>

      <!-- Ask Ascend About This Area Preview Row (Neutral Grey + Warm Amber COMING SOON) -->
      <button
        type="button"
        class="w-full p-3.5 rounded-xl bg-white/[0.025] border border-dashed border-[#334155]/90 hover:border-[#64748B] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
        @click="emit('openAsk')"
      >
        <div class="flex items-start gap-2.5 min-w-0">
          <Sparkles class="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
          <div class="min-w-0">
            <p class="font-sans text-[12.5px] font-medium text-[#CBD5E1] leading-snug">
              {{ settings.t('Ask Ascend about this area', 'Tanya Ascend tentang area ini') }}
            </p>
            <p class="mt-0.5 font-sans text-[11px] text-[#64748B] leading-snug">
              {{ settings.t('Get an explanation or compare with other areas', 'Dapatkan penjelasan atau bandingkan dengan area lain') }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="px-2 py-0.5 rounded-full bg-signal-amber/10 border border-signal-amber/45 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-signal-amber">
            {{ settings.t('COMING SOON', 'SEGERA HADIR') }}
          </span>
          <ChevronRight class="w-3.5 h-3.5 text-[#64748B]" />
        </div>
      </button>

      <!-- SUPPLY VS DEMAND (Real 500 m neighborhood counts from coffee_shop.geojson) -->
      <div class="pt-4 border-t border-white/10 space-y-3.5">
        <p class="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          <Scale class="w-3.5 h-3.5 text-ink-muted" />
          <span>{{ settings.t('SUPPLY VS DEMAND', 'PASOKAN VS PERMINTAAN') }}</span>
        </p>

        <p class="font-sans text-[13.5px] leading-[1.58] text-ink-secondary">
          <strong class="font-semibold text-ink-primary">{{ p.actual_k1 }}</strong>
          {{ settings.t('coffee shops within about 500 m; demand typically supports about', 'kedai kopi dalam sekitar 500 m; permintaan biasanya menopang sekitar') }}
          <strong class="font-semibold text-ink-primary">{{ expectedFormatted }}</strong>.
        </p>

        <!-- Dual KPI Cards -->
        <div class="grid grid-cols-2 gap-2.5">
          <div class="rounded-xl bg-[#0B0F16]/90 border border-white/[0.08] p-3.5">
            <p class="font-display font-bold text-[28px] text-ink-primary leading-none tabular-nums">
              {{ p.actual_k1 }}
            </p>
            <p class="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-muted leading-snug">
              {{ settings.t('Coffee shops within about 500 m', 'Kedai kopi dalam sekitar 500 m') }}
            </p>
            <p class="mt-1 font-mono text-[9px] text-ink-muted/80">
              {{ p.actual }} {{ settings.t('right in this spot', 'tepat di titik ini') }}
            </p>
          </div>

          <div class="rounded-xl bg-[#0B0F16]/90 border border-white/[0.08] p-3.5">
            <p
              class="font-display font-bold text-[28px] leading-none tabular-nums"
              :style="{ color: p.label === 'not_enough_demand' ? '#CBD5E1' : '#34D399' }"
            >
              ~{{ expectedFormatted }}
            </p>
            <p class="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-muted leading-snug">
              {{ settings.t('Demand typically supports', 'Daya dukung permintaan') }}
            </p>
            <p class="mt-1 font-mono text-[9px] text-ink-muted/80">
              ~{{ formatExpectedCount(p.expected) }} {{ settings.t('in this spot', 'di titik ini') }}
            </p>
          </div>
        </div>

        <!-- Visual Dual Comparison Bar -->
        <div class="space-y-2 pt-0.5">
          <div class="flex items-center gap-2.5">
            <span class="w-16 text-left font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-secondary shrink-0">
              {{ settings.t('NOW', 'SAAT INI') }}
            </span>
            <div class="flex-1 h-2.5 rounded-[4px] bg-white/[0.05] overflow-hidden">
              <div
                v-if="actualBarPct > 0"
                class="h-full rounded-[4px] transition-all duration-500 ease-signal"
                :style="{ width: `${actualBarPct.toFixed(1)}%`, ...nowBarPatternStyle }"
              />
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            <span class="w-16 text-left font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-muted shrink-0">
              {{ settings.t('SUPPORTS', 'KAPASITAS') }}
            </span>
            <div class="flex-1 h-2.5 rounded-[4px] bg-white/[0.03] overflow-hidden">
              <div
                v-if="expectedBarPct > 0"
                class="h-full rounded-[4px] border border-dashed border-[#CBD5E1]/75 bg-white/[0.07] transition-all duration-500 ease-signal"
                :style="{ width: `${expectedBarPct.toFixed(1)}%` }"
              />
            </div>
          </div>
        </div>

        <p class="font-sans text-[11.5px] leading-[1.55] text-ink-muted">
          {{ settings.t('Measured over about 500 m (this area + 6 neighbors). A label is given only when the gap is bigger than chance.', 'Diukur dalam sekitar 500 m (area ini + 6 tetangga). Label hanya diberikan jika selisihnya melampaui variasi acak.') }}
        </p>
      </div>

      <!-- WHY THIS LABEL -->
      <div class="pt-4 border-t border-white/10 space-y-3.5">
        <div class="flex items-center justify-between gap-2">
          <p class="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            <BarChart3 class="w-3.5 h-3.5 text-ink-muted" />
            <span>{{ settings.homeCopy.value.mapPage.drivesTitle }}</span>
          </p>
          <span class="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-muted/80">
            {{ settings.t('TOP 3 FACTORS', '3 FAKTOR UTAMA') }}
          </span>
        </div>

        <p class="font-sans text-[13.5px] leading-[1.55] text-ink-secondary">
          {{ settings.t('Strongest factor:', 'Faktor terkuat:') }}
          <strong class="font-semibold text-ink-primary">{{ biggestPushText }}.</strong>
        </p>

        <!-- 3 Diverging Center-Axis Directional Bars with Bright Unmistakable Midpoint Divider -->
        <div class="relative pt-3 pb-1">
          <!-- Continuous Bright Center Baseline Spanning Across All 3 Bars -->
          <span
            class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-white/55 via-[#E2E8F0]/80 to-white/55 shadow-[0_0_8px_rgba(248,250,252,0.45)] z-10"
            aria-hidden="true"
          />
          <span
            class="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-1.5 px-1.5 py-0.2 rounded bg-[#141C28] border border-white/25 font-mono text-[7.5px] uppercase tracking-[0.1em] text-[#E2E8F0] z-20"
            aria-hidden="true"
          >
            BASE
          </span>

          <ul class="space-y-3.5 relative">
            <li
              v-for="(factor, fi) in p.factors"
              :key="fi"
              class="space-y-1.5"
            >
              <div class="area-factor-pill relative z-20 inline-flex items-center gap-1.5 pr-2 bg-[#10151E]/90 rounded font-sans text-[12.5px] text-ink-primary">
                <ArrowUpRight
                  v-if="factorDirection(factor) === 'up'"
                  class="w-3.5 h-3.5 text-mint shrink-0"
                  :stroke-width="2.4"
                />
                <ArrowDownRight
                  v-else
                  class="w-3.5 h-3.5 shrink-0"
                  :class="p.label === 'not_enough_demand' ? 'text-[#94A3B8]' : 'text-signal-amber'"
                  :stroke-width="2.4"
                />
                <span>{{ settings.translateFactor(factor.text) }}</span>
              </div>

              <!-- Centered-midpoint balance bar with bright glowing center divider -->
              <div class="grid grid-cols-2 items-center h-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] overflow-visible relative">
                <!-- Bright crisp center tick protruding cleanly above & below bar -->
                <span
                  class="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-1 -bottom-1 w-[2.5px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)] z-20"
                  aria-hidden="true"
                />

                <div class="h-full flex justify-end overflow-hidden rounded-l-full">
                  <div
                    v-if="factorDirection(factor) === 'down'"
                    class="h-full rounded-l-full transition-all duration-500"
                    :class="p.label === 'not_enough_demand' ? 'bg-[#94A3B8]' : 'bg-signal-amber'"
                    :style="{ width: `${FACTOR_BAR_WIDTH_PCT}%` }"
                  />
                </div>

                <div class="h-full flex justify-start overflow-hidden rounded-r-full">
                  <div
                    v-if="factorDirection(factor) === 'up'"
                    class="h-full rounded-r-full bg-mint transition-all duration-500"
                    :style="{ width: `${FACTOR_BAR_WIDTH_PCT}%` }"
                  />
                </div>
              </div>
            </li>
          </ul>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div class="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-muted">
            <span class="inline-flex items-center gap-1">
              <span
                class="w-2 h-2 rounded-[2px]"
                :class="p.label === 'not_enough_demand' ? 'bg-[#94A3B8]' : 'bg-signal-amber'"
              />
              {{ settings.t('LOWERS DEMAND', 'MENURUNKAN PERMINTAAN') }}
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2 h-2 rounded-[2px] bg-mint" />
              {{ settings.t('RAISES DEMAND', 'MENAIKKAN PERMINTAAN') }}
            </span>
          </div>
          <span class="font-mono text-[8.5px] uppercase tracking-[0.06em] text-ink-muted/80">
            {{ settings.t('DIRECTION ONLY', 'HANYA ARAH') }}
          </span>
        </div>

        <p class="font-sans text-[11.5px] leading-[1.55] text-ink-muted">
          {{ settings.t('These factors explain the estimated demand at this spot, not the label itself. Arrows show direction only, not amounts. Factors come from open data on residents, shops, hotels, campuses, offices, schools, health facilities and transit.', 'Faktor ini menjelaskan perkiraan permintaan di titik ini, bukan labelnya. Panah hanya menunjukkan arah, bukan besaran. Faktor berasal dari data terbuka penduduk, toko, hotel, kampus, kantor, sekolah, fasilitas kesehatan, dan transit.') }}
        </p>
      </div>

      <!-- PHASE 2 COMING SOON: BEST FIT BY BUSINESS TYPE -->
      <div class="pt-4 border-t border-white/10">
        <div class="rounded-xl bg-white/[0.02] border border-dashed border-[#334155]/90 p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#94A3B8]">
              <Store class="w-3.5 h-3.5 text-[#64748B]" />
              <span>{{ settings.t('BEST FIT BY BUSINESS TYPE', 'KECOCOKAN JENIS USAHA') }}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 font-mono text-[8px] text-[#94A3B8]">
                P2
              </span>
              <span class="px-2 py-0.5 rounded-full bg-signal-amber/10 border border-signal-amber/45 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-signal-amber">
                {{ settings.t('COMING SOON', 'SEGERA HADIR') }}
              </span>
            </div>
          </div>

          <p class="font-sans text-[12.5px] text-[#CBD5E1] leading-snug">
            {{ settings.t('Coffee shop:', 'Kedai kopi:') }} <strong class="font-semibold text-ink-primary">{{ localizedLabelInfo.title.toLowerCase() }}</strong>
            · {{ settings.t('Eatery:', 'Warung makan:') }} <span class="text-[#94A3B8]">{{ settings.t('coming soon.', 'segera hadir.') }}</span>
          </p>

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#0B0F16]/85 border border-white/[0.07]">
              <span class="inline-flex items-center gap-2 font-sans text-[12px] text-ink-primary">
                <Coffee class="w-3.5 h-3.5 text-mint" />
                <span>{{ settings.t('Coffee shop', 'Kedai kopi') }}</span>
              </span>
              <UiLabelBadge :label="p.label" size="sm" uppercase />
            </div>

            <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#0B0F16]/60 border border-dashed border-[#334155]/80">
              <span class="inline-flex items-center gap-2 font-sans text-[12px] text-[#94A3B8]">
                <UtensilsCrossed class="w-3.5 h-3.5 text-[#64748B]" />
                <span>{{ settings.t('Eatery', 'Warung makan') }}</span>
              </span>
              <span class="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 font-mono text-[8.5px] uppercase text-[#94A3B8]">
                {{ settings.t('PENDING MODEL', 'MENUNGGU MODEL') }}
              </span>
            </div>
          </div>

          <p class="font-sans text-[11px] leading-[1.5] text-[#64748B]">
            {{ settings.t('Ranks business types by supply vs demand once Eatery launches, not by predicted profit.', 'Mengurutkan jenis usaha berdasarkan pasokan vs permintaan saat Warung makan rilis, bukan prediksi laba.') }}
          </p>
        </div>
      </div>

      <!-- PHASE 2 COMING SOON: WALKING REACH -->
      <div class="rounded-xl bg-white/[0.02] border border-dashed border-[#334155]/90 p-4 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#94A3B8]">
            <Footprints class="w-3.5 h-3.5 text-[#64748B]" />
            <span>{{ settings.t('WALKING REACH', 'JANGKAUAN JALAN KAKI') }}</span>
          </span>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 font-mono text-[8px] text-[#94A3B8]">
              P2
            </span>
            <span class="px-2 py-0.5 rounded-full bg-signal-amber/10 border border-signal-amber/45 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-signal-amber">
              {{ settings.t('COMING SOON', 'SEGERA HADIR') }}
            </span>
          </div>
        </div>

        <p class="font-sans text-[12.5px] text-[#CBD5E1] leading-snug">
          {{ settings.t('Coffee shops reachable within a 5-minute walk along streets.', 'Kedai kopi yang dapat dijangkau dalam 5 menit berjalan kaki menyusuri jalan.') }}
        </p>

        <!-- Wireframe-inspired Mini Dashed Walking-Reach Hex Diagram -->
        <div class="relative h-[86px] rounded-xl bg-[#0A0E14] border border-white/[0.08] overflow-hidden flex items-center justify-center">
          <svg
            class="w-full h-full"
            viewBox="0 0 320 86"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <!-- Subtle street grid strokes -->
            <g stroke="rgba(148, 163, 184, 0.14)" stroke-width="1">
              <line x1="18" y1="86" x2="128" y2="0" />
              <line x1="65" y1="86" x2="215" y2="0" />
              <line x1="185" y1="86" x2="305" y2="0" />
              <line x1="0" y1="22" x2="320" y2="66" />
              <line x1="0" y1="62" x2="320" y2="26" />
            </g>
            <!-- Outer 5-minute walking reach dashed hexagon -->
            <polygon
              points="160,10 198,27 198,59 160,76 122,59 122,27"
              fill="rgba(100, 116, 139, 0.16)"
              stroke="#94A3B8"
              stroke-width="1.4"
              stroke-dasharray="4 3"
            />
            <!-- Inner selected area hexagon -->
            <polygon
              points="160,29 175,36 175,50 160,57 145,50 145,36"
              fill="#1E293B"
              stroke="#CBD5E1"
              stroke-width="1.5"
            />
          </svg>
          <span class="absolute top-2 left-2.5 px-2 py-0.5 rounded bg-[#111722]/90 border border-white/10 font-mono text-[8px] uppercase tracking-[0.1em] text-[#94A3B8]">
            {{ settings.t('5-MIN WALK · SOON', '5 MENIT JALAN · SEGERA') }}
          </span>
        </div>

        <p class="font-sans text-[11px] leading-[1.5] text-[#64748B]">
          {{ settings.t('Follows walkable streets; falls back to the 500 m count.', 'Mengikuti jalur pejalan kaki; kembali ke hitungan 500 m jika tidak tersedia.') }}
        </p>
      </div>

      <!-- PHASE 2 COMING SOON: BREAK-EVEN -->
      <div class="rounded-xl bg-white/[0.02] border border-dashed border-[#334155]/90 p-4 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#94A3B8]">
            <Calculator class="w-3.5 h-3.5 text-[#64748B]" />
            <span>{{ settings.t('BREAK-EVEN', 'BALIK MODAL') }}</span>
          </span>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 font-mono text-[8px] text-[#94A3B8]">
              P2
            </span>
            <span class="px-2 py-0.5 rounded-full bg-signal-amber/10 border border-signal-amber/45 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-signal-amber">
              {{ settings.t('COMING SOON', 'SEGERA HADIR') }}
            </span>
          </div>
        </div>

        <p class="font-sans text-[12.5px] text-[#CBD5E1] leading-snug">
          {{ settings.t('Enter your own prices and costs to see how many cups a day you need.', 'Masukkan harga dan biaya sendiri untuk melihat target cangkir per hari.') }}
        </p>

        <!-- Real Area Context Box (Matches wireframe context preview) -->
        <div class="rounded-xl bg-[#0B0F16]/85 border border-white/[0.08] p-3 space-y-1.5">
          <UiLabelBadge :label="p.label" size="sm" uppercase />
          <p class="font-sans text-[11.5px] text-ink-secondary">
            {{ p.actual_k1 }} {{ settings.t('coffee shops within about 500 m · about', 'kedai kopi dalam sekitar 500 m · kapasitas sekitar') }} {{ expectedFormatted }} {{ settings.t('supported', '') }}
          </p>
        </div>

        <button
          type="button"
          disabled
          class="w-full h-9 rounded-full bg-white/[0.04] border border-white/10 font-sans text-[12px] font-medium text-[#64748B] inline-flex items-center justify-center gap-1.5 cursor-not-allowed"
        >
          <Calculator class="w-3.5 h-3.5" />
          <span>{{ settings.t('Open break-even calculator', 'Buka kalkulator balik modal') }}</span>
        </button>

        <p class="font-sans text-[11px] text-[#64748B]">
          {{ settings.t('Scenario based on your numbers. Ascend does not predict your sales.', 'Skenario berdasarkan angka darimu. Ascend tidak memprediksi penjualanmu.') }}
        </p>
      </div>

      <!-- PHASE 3 COMING SOON: RENT QUOTE -->
      <div class="rounded-xl bg-white/[0.02] border border-dashed border-[#334155]/90 p-4 space-y-3 pb-4">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#94A3B8]">
            <Tag class="w-3.5 h-3.5 text-[#64748B]" />
            <span>{{ settings.t('RENT', 'SEWA') }}</span>
          </span>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 font-mono text-[8px] text-[#94A3B8]">
              P3
            </span>
            <span class="px-2 py-0.5 rounded-full bg-signal-amber/10 border border-signal-amber/45 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-signal-amber">
              {{ settings.t('COMING SOON', 'SEGERA HADIR') }}
            </span>
          </div>
        </div>

        <p class="font-sans text-[12.5px] text-[#CBD5E1] leading-snug">
          {{ settings.t('Add your own rent quote to weigh it against this area.', 'Tambahkan penawaran sewamu untuk ditimbang terhadap kondisi area ini.') }}
        </p>

        <!-- Disabled Wireframe Input Previews -->
        <div class="space-y-2">
          <div class="h-9 px-3.5 rounded-full bg-[#0A0E14]/90 border border-white/10 flex items-center text-[12px] text-[#64748B] select-none">
            {{ settings.t('Monthly rent (Rp)', 'Sewa bulanan (Rp)') }}
          </div>
          <div class="h-9 px-3.5 rounded-full bg-[#0A0E14]/90 border border-white/10 flex items-center text-[12px] text-[#64748B] select-none">
            {{ settings.t('Space size (m²)', 'Luas ruangan (m²)') }}
          </div>
          <div class="flex items-center gap-2 pt-0.5 text-[11.5px] text-[#64748B] select-none">
            <span class="w-3.5 h-3.5 rounded border border-[#475569] bg-white/[0.02] shrink-0" aria-hidden="true" />
            <span>{{ settings.t('Share this quote anonymously to help other users', 'Bagikan penawaran ini secara anonim untuk membantu pengguna lain') }}</span>
          </div>
        </div>

        <p class="font-sans text-[11px] text-[#64748B]">
          {{ settings.t('Saved only in this browser. Rent comparison launches in Phase 3.', 'Disimpan hanya di browser ini. Perbandingan sewa hadir pada Fase 3.') }}
        </p>
      </div>
    </div>

    <!-- Sticky Bottom Action Bar (Compact on < lg, Spacious on lg+) -->
    <div class="shrink-0 px-3.5 py-2.5 lg:px-5 lg:py-3.5 border-t border-white/10 bg-[#0D121A]/95 backdrop-blur-md space-y-1.5 lg:space-y-2">
      <div class="flex items-center gap-2 lg:gap-2.5">
        <button
          type="button"
          class="flex-1 h-9 lg:h-11 rounded-full font-sans text-[12px] lg:text-[13px] font-bold inline-flex items-center justify-center gap-1.5 lg:gap-2 transition-all duration-fast ease-signal cursor-pointer"
          :class="
            saved
              ? 'bg-mint/15 border border-mint text-mint hover:bg-mint/20'
              : 'btn-mint'
          "
          @click="emit('toggleShortlist')"
        >
          <BookmarkCheck v-if="saved" class="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          <Bookmark v-else class="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          <span>{{ saved ? settings.t('Saved', 'Tersimpan') : settings.t('Save to shortlist', 'Simpan ke daftar') }}</span>
        </button>

        <button
          type="button"
          class="h-9 lg:h-11 px-3 lg:px-3.5 rounded-full bg-white/[0.04] border border-dashed border-[#334155] hover:border-[#64748B] font-sans text-[11.5px] lg:text-[12px] font-medium text-[#94A3B8] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          @click="emit('openAsk')"
        >
          <span>{{ settings.t('Ask Ascend', 'Tanya Ascend') }}</span>
          <span class="px-1.5 py-0.5 rounded bg-signal-amber/15 font-mono text-[8px] font-bold uppercase text-signal-amber">
            {{ settings.t('SOON', 'SEGERA') }}
          </span>
        </button>
      </div>

      <p class="text-center font-sans text-[10.5px] lg:text-[11px] leading-snug text-ink-muted">
        {{ settings.homeCopy.value.mapPage.cardFootnote }}
        <button
          type="button"
          class="underline underline-offset-2 hover:text-ink-primary cursor-pointer"
          @click="emit('openAbout')"
        >
          {{ settings.t('About', 'Tentang') }}
        </button>
      </p>

      <p v-if="limitReached" class="text-center font-sans text-[11.5px] text-signal-amber">
        {{ settings.t('Shortlist is full (max 10 areas). Remove one saved spot first.', 'Daftar pendek penuh (maks 10 area). Hapus satu area terlebih dahulu.') }}
      </p>
      <p v-else-if="!storageAvailable" class="text-center font-sans text-[11px] text-ink-muted">
        {{ settings.t('Browser storage is unavailable; saved picks stay active for this session only.', 'Penyimpanan browser tidak tersedia; pilihan tersimpan hanya aktif selama sesi ini.') }}
      </p>
    </div>
  </div>
</template>
