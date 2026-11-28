<script setup lang="ts">
import {
  ArrowLeft,
  Calculator,
  ChevronsUp,
  CircleDot,
  Clock,
  Compass,
  Database,
  Equal,
  Footprints,
  GitBranch,
  Layers,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Store,
  Tag,
  UtensilsCrossed,
  X,
} from 'lucide-vue-next'
import type { AreaLabel, Meta } from '~/types/areas'

export type InfoModalTab =
  | 'labels'
  | 'expected'
  | 'data'
  | 'limits'
  | 'versions'
  | 'coming_soon'
  | 'about'
  | 'licenses'
  | 'privacy'

type CanonicalTab = 'labels' | 'expected' | 'data' | 'limits' | 'versions' | 'coming_soon'

const props = withDefaults(
  defineProps<{
    open: boolean
    activeTab: InfoModalTab
    meta: Meta | null
    loading: boolean
    error: string | null
    dataVersionLabel: string
    closeLabel?: string
    lightMode?: boolean
  }>(),
  {
    closeLabel: 'Back to the map',
    lightMode: false,
  },
)

const emit = defineEmits<{
  close: []
  'update:activeTab': [tab: InfoModalTab]
  retry: []
}>()

const settings = useAscendSettings()

const canonicalTab = computed<CanonicalTab>(() => {
  if (props.activeTab === 'about') return 'labels'
  if (props.activeTab === 'licenses') return 'data'
  if (props.activeTab === 'privacy') return 'limits'
  return props.activeTab
})

const tabs = computed<Array<{ id: CanonicalTab; label: string }>>(() =>
  settings.isId.value
    ? [
        { id: 'labels', label: 'LABEL' },
        { id: 'expected', label: 'PERKIRAAN' },
        { id: 'data', label: 'DATA' },
        { id: 'limits', label: 'BATASAN' },
        { id: 'versions', label: 'VERSI' },
        { id: 'coming_soon', label: 'SEGERA' },
      ]
    : [
        { id: 'labels', label: 'LABELS' },
        { id: 'expected', label: 'EXPECTED' },
        { id: 'data', label: 'DATA' },
        { id: 'limits', label: 'LIMITS' },
        { id: 'versions', label: 'VERSIONS' },
        { id: 'coming_soon', label: 'COMING SOON' },
      ],
)

const labelRows = computed<Array<{
  id: AreaLabel
  title: string
  description: string
  swatchStyle: Record<string, string | undefined>
}>>(() => [
  {
    id: 'opportunity',
    title: settings.labelText.value.opportunity.title,
    description: settings.labelText.value.opportunity.description,
    swatchStyle: {
      backgroundColor: '#10B981',
      backgroundImage:
        'repeating-linear-gradient(-45deg, rgba(4, 47, 34, 0.44) 0 2.5px, transparent 2.5px 6px)',
    },
  },
  {
    id: 'fair',
    title: settings.labelText.value.fair.title,
    description: settings.labelText.value.fair.description,
    swatchStyle: {
      backgroundColor: '#E5940A',
      backgroundImage:
        'repeating-linear-gradient(0deg, rgba(69, 26, 3, 0.42) 0 2px, transparent 2px 5px)',
    },
  },
  {
    id: 'crowded',
    title: settings.labelText.value.crowded.title,
    description: settings.labelText.value.crowded.description,
    swatchStyle: {
      backgroundColor: '#D93D3D',
      backgroundImage:
        'repeating-linear-gradient(45deg, rgba(69, 10, 10, 0.46) 0 1.8px, transparent 1.8px 5.5px), repeating-linear-gradient(-45deg, rgba(69, 10, 10, 0.46) 0 1.8px, transparent 1.8px 5.5px)',
    },
  },
  {
    id: 'not_enough_demand',
    title: settings.labelText.value.not_enough_demand.title,
    description: settings.labelText.value.not_enough_demand.description,
    swatchStyle: {
      backgroundColor: '#5B6A7E',
      backgroundImage: 'radial-gradient(rgba(226, 232, 240, 0.55) 1px, transparent 1px)',
      backgroundSize: '5px 5px',
    },
  },
])

const comingSoonItems = [
  { id: 'eatery', label: 'Eatery type', icon: UtensilsCrossed },
  { id: 'ask', label: 'Ask Ascend (chat)', icon: MessageSquare },
  { id: 'breakeven', label: 'Break-even calculator', icon: Calculator },
  { id: 'bestfit', label: 'Best fit by business type', icon: Store },
  { id: 'walk', label: 'Walking reach', icon: Footprints },
  { id: 'rent', label: 'Rent quote compare', icon: Tag },
]

const totalAreas = computed(() => {
  const counts = props.meta?.label_counts
  if (!counts) return 1976
  return counts.opportunity + counts.fair + counts.crowded + counts.not_enough_demand
})

const devianceReductionPct = computed(() => {
  const m = props.meta?.model
  if (!m || !m.baseline_metrics.poisson_deviance) return 49
  return Math.round(
    (1 - m.metrics.poisson_deviance / m.baseline_metrics.poisson_deviance) * 100,
  )
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    emit('close')
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
        v-if="open"
        class="fixed inset-0 z-[70] flex items-center justify-center p-3.5 sm:p-6 backdrop-blur-md"
        :class="props.lightMode ? 'bg-slate-950/35' : 'bg-[#070B10]/80'"
        role="dialog"
        aria-modal="true"
        :aria-label="settings.t('About Ascend', 'Tentang Ascend')"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-[590px] max-h-[88vh] flex flex-col rounded-2xl bg-[#0D121A] border border-white/15 shadow-[0_30px_100px_rgba(0,0,0,0.85)] overflow-hidden"
          :class="{ 'map-theme-light': props.lightMode }"
        >
          <!-- Refined Architectural Header with Soft Aura & Harmonious Editorial Headline -->
          <div class="relative shrink-0 px-6 pt-5 pb-5 bg-gradient-to-b from-[#131C28] via-[#101722] to-[#0D121A] border-b border-white/10 overflow-hidden">
            <!-- Delicate Radial Emerald Glow & Ultra-Subtle Curved Topographic Arcs -->
            <div
              class="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-35"
              style="background: radial-gradient(circle, rgba(16, 185, 129, 0.45), transparent 70%);"
              aria-hidden="true"
            />
            <svg
              class="pointer-events-none absolute inset-0 w-full h-full opacity-30"
              viewBox="0 0 600 130"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <circle cx="540" cy="-20" r="115" fill="none" stroke="rgba(16, 185, 129, 0.25)" stroke-width="0.9" stroke-dasharray="3 6" />
              <circle cx="540" cy="-20" r="175" fill="none" stroke="rgba(148, 163, 184, 0.14)" stroke-width="0.8" />
              <circle cx="60" cy="145" r="110" fill="none" stroke="rgba(16, 185, 129, 0.18)" stroke-width="0.8" />
            </svg>

            <div class="relative z-10 flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mint/90">
                  <UiAscendMark :size="15" />
                  <span>WELCOME · METHODOLOGY</span>
                </p>

                <h2 class="mt-2.5 flex items-baseline gap-2 leading-none">
                  <span class="font-editorial font-semibold text-[30px] sm:text-[34px] text-ink-primary tracking-[-0.02em]">
                    {{ settings.t('About', 'Tentang') }}
                  </span>
                  <span class="font-editorial italic font-semibold text-[32px] sm:text-[36px] bg-gradient-to-r from-[#34D399] via-[#10B981] to-[#14B8A6] bg-clip-text text-transparent tracking-[-0.01em]">
                    Ascend
                  </span>
                </h2>

                <p class="mt-2 font-sans text-[12.5px] text-ink-secondary leading-snug">
                  {{ settings.t('Open-data neighborhood context for first-time coffee shop founders.', 'Konteks lingkungan berbasis data terbuka bagi pemilik kedai kopi pemula.') }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0 pt-0.5">
                <span class="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted">
                  ESC
                </span>
                <button
                  type="button"
                  class="w-9 h-9 rounded-full bg-[#121A26]/95 border border-white/15 hover:border-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint text-ink-secondary hover:text-ink-primary flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close modal"
                  @click="emit('close')"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 6 Horizontal Pill Tabs with Clean Spacing -->
          <div class="shrink-0 px-6 py-3.5 bg-[#0C1119] border-b border-white/10">
            <div
              class="flex items-center gap-1.5 overflow-x-auto pb-0.5"
              role="tablist"
              aria-label="About Ascend sections"
            >
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                role="tab"
                :aria-selected="canonicalTab === tab.id"
                class="shrink-0 px-3 py-1.5 rounded-full font-mono text-[10px] tracking-[0.1em] uppercase transition-all duration-fast ease-signal cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/70"
                :class="
                  canonicalTab === tab.id
                    ? 'bg-mint text-[#071510] font-bold shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                    : 'bg-[#121822] border border-white/10 text-ink-secondary hover:text-ink-primary hover:border-white/25'
                "
                @click="emit('update:activeTab', tab.id)"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- Scrollable Tab Body -->
          <div
            class="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-[13.5px] leading-[1.65] text-ink-secondary"
            :class="props.lightMode ? 'light-mode-scroll' : ''"
          >
            <!-- TAB 1: LABELS -->
            <template v-if="canonicalTab === 'labels'">
              <p class="text-[14px] text-[#DCE4EE] leading-[1.68]">
                Ascend shows where a new coffee shop may still have room. It compares the coffee shops already open nearby with the number that local demand typically supports.
              </p>

              <div class="space-y-3 pt-1">
                <div class="flex items-center gap-2">
                  <Tag class="w-4 h-4 text-mint shrink-0" />
                  <h3 class="font-display font-bold text-[17px] text-ink-primary">
                    How <span class="font-editorial italic font-semibold text-mint">labels</span> work
                  </h3>
                </div>

                <p class="text-[12.5px] text-ink-muted">
                  Labels use the area and its 6 neighbors, about 500 m.
                </p>

                <ul class="space-y-3 pt-1">
                  <li
                    v-for="row in labelRows"
                    :key="row.id"
                    class="flex items-center gap-3.5"
                  >
                    <!-- Patterned Swatch -->
                    <span
                      class="w-12 h-7 rounded-[5px] shrink-0 border border-black/40 shadow-inner"
                      :style="row.swatchStyle"
                      aria-hidden="true"
                    />

                    <!-- Label Glyph -->
                    <span class="w-4 flex items-center justify-center shrink-0" aria-hidden="true">
                      <ChevronsUp v-if="row.id === 'opportunity'" class="w-3.5 h-3.5 text-mint" />
                      <Equal v-else-if="row.id === 'fair'" class="w-3.5 h-3.5 text-signal-amber" />
                      <Layers v-else-if="row.id === 'crowded'" class="w-3.5 h-3.5 text-signal-coral" />
                      <CircleDot v-else class="w-3.5 h-3.5 text-[#94A3B8]" />
                    </span>

                    <!-- Title + Description -->
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-sans font-semibold text-[13.5px] text-ink-primary leading-tight">
                          {{ row.title }}
                        </span>
                        <span
                          v-if="meta?.label_counts"
                          class="font-mono text-[10px] text-ink-muted tabular-nums"
                        >
                          {{ meta.label_counts[row.id].toLocaleString('en-US') }} areas
                        </span>
                      </div>
                      <p class="text-[12.5px] text-ink-secondary leading-snug mt-0.5">
                        {{ row.description }}
                      </p>
                    </div>
                  </li>
                </ul>

                <!-- Low confidence dashed note -->
                <div class="mt-2 pt-3 border-t border-white/[0.08] flex items-center gap-3.5">
                  <span
                    class="w-12 h-7 rounded-[5px] shrink-0 border border-dashed border-[#CBD5E1]/80 bg-[#64748B]/20"
                    aria-hidden="true"
                  />
                  <div class="min-w-0 flex-1">
                    <span class="font-sans font-semibold text-[13px] text-ink-primary">
                      Low confidence (dashed border)
                    </span>
                    <p class="text-[12px] text-ink-muted leading-snug">
                      Fewer than 3 mapped places nearby; treat the label with extra care.
                    </p>
                  </div>
                </div>
              </div>
            </template>

            <!-- TAB 2: EXPECTED -->
            <template v-else-if="canonicalTab === 'expected'">
              <div class="flex items-center gap-2">
                <Compass class="w-4 h-4 text-mint shrink-0" />
                <h3 class="font-display font-bold text-[17px] text-ink-primary">
                  What <span class="font-editorial italic font-semibold text-mint">expected</span> means
                </h3>
              </div>

              <p class="text-[13.5px] text-[#DCE4EE]">
                Expected counts estimate how many coffee shops a neighborhood like this one usually has in Bandung, based on residents, shops, hotels, campuses, schools, offices, health facilities and transit stops. The model learns the usual city pattern, not true demand, so a gap means "different from the usual pattern", not a guarantee.
              </p>

              <p class="text-[12.5px] text-ink-secondary">
                An area is labeled Opportunity or Crowded only when the gap between open shops and local demand within about 500 m stands clearly beyond random variation.
              </p>

              <!-- Live Spatial Validation Summary from meta.json -->
              <div class="rounded-xl bg-[#0A0E14] border border-white/10 p-4 space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-primary">
                    Spatial validation check
                  </span>
                  <span class="font-mono text-[9.5px] text-mint">
                    5 held-out district folds
                  </span>
                </div>

                <div v-if="loading" class="space-y-2">
                  <div class="h-4 w-3/4 rounded skeleton-bar" />
                  <div class="h-4 w-1/2 rounded skeleton-bar" />
                </div>

                <div v-else-if="error" class="flex items-center justify-between gap-3">
                  <span class="text-[12.5px] text-signal-coral">Could not load validation summary.</span>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-elevated border border-white/15 font-mono text-[10px] text-ink-primary cursor-pointer"
                    @click="emit('retry')"
                  >
                    <RefreshCw class="w-3 h-3" /> Retry
                  </button>
                </div>

                <div v-else-if="meta?.model" class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div class="p-3 rounded-lg bg-[#111722] border border-white/[0.08]">
                    <div class="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-muted">
                      Rank agreement
                    </div>
                    <div class="mt-1 font-display font-bold text-[20px] text-mint tabular-nums">
                      {{ meta.model.metrics.spearman.toFixed(2) }}
                    </div>
                    <div class="text-[11px] text-ink-muted">
                      Pop. only: {{ meta.model.baseline_metrics.spearman.toFixed(2) }}
                    </div>
                  </div>

                  <div class="p-3 rounded-lg bg-[#111722] border border-white/[0.08]">
                    <div class="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-muted">
                      Avg count error
                    </div>
                    <div class="mt-1 font-display font-bold text-[20px] text-ink-primary tabular-nums">
                      {{ meta.model.metrics.mae.toFixed(2) }}
                    </div>
                    <div class="text-[11px] text-ink-muted">
                      Pop. only: {{ meta.model.baseline_metrics.mae.toFixed(2) }}
                    </div>
                  </div>

                  <div class="p-3 rounded-lg bg-[#111722] border border-white/[0.08]">
                    <div class="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-muted">
                      Error reduction
                    </div>
                    <div class="mt-1 font-display font-bold text-[20px] text-mint tabular-nums">
                      {{ devianceReductionPct }}%
                    </div>
                    <div class="text-[11px] text-ink-muted">
                      Over pop. baseline
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- TAB 3: DATA -->
            <template v-else-if="canonicalTab === 'data'">
              <div class="flex items-center gap-2">
                <Database class="w-4 h-4 text-mint shrink-0" />
                <h3 class="font-display font-bold text-[17px] text-ink-primary">
                  Open <span class="font-editorial italic font-semibold text-mint">data & licenses</span>
                </h3>
              </div>

              <p class="text-[13px] text-[#DCE4EE]">
                Every count and neighborhood signal in Ascend comes strictly from openly licensed map and population datasets, with zero scraped property listings.
              </p>

              <div v-if="loading" class="space-y-2.5">
                <div v-for="n in 3" :key="n" class="h-14 rounded-xl skeleton-bar" />
              </div>

              <div v-else class="space-y-2.5">
                <div
                  v-for="src in meta?.data_sources ?? []"
                  :key="src.name"
                  class="rounded-xl bg-[#0A0E14] border border-white/10 p-3.5"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-sans font-semibold text-[13.5px] text-ink-primary">
                      {{ src.name }}
                    </span>
                    <span class="px-2 py-0.5 rounded bg-mint/10 border border-mint/30 font-mono text-[9.5px] text-mint">
                      {{ src.license }}
                    </span>
                  </div>
                  <p class="mt-1 font-mono text-[10.5px] text-ink-muted">
                    {{ src.version }} · {{ src.attribution }}
                  </p>
                </div>

                <div class="rounded-xl bg-[#0A0E14] border border-white/10 p-3.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-sans font-semibold text-[13.5px] text-ink-primary">
                      OpenFreeMap & OpenMapTiles
                    </span>
                    <span class="px-2 py-0.5 rounded bg-mint/10 border border-mint/30 font-mono text-[9.5px] text-mint">
                      Open attribution
                    </span>
                  </div>
                  <p class="mt-1 font-mono text-[10.5px] text-ink-muted">
                    Vector basemap for MapLibre GL JS · © OpenStreetMap contributors
                  </p>
                </div>
              </div>
            </template>

            <!-- TAB 4: LIMITS -->
            <template v-else-if="canonicalTab === 'limits'">
              <div class="flex items-center gap-2">
                <ShieldAlert class="w-4 h-4 text-signal-amber shrink-0" />
                <h3 class="font-display font-bold text-[17px] text-ink-primary">
                  Honest <span class="font-editorial italic font-semibold text-mint">limits</span> & privacy
                </h3>
              </div>

              <div class="rounded-xl bg-[#0A0E14] border border-white/10 p-4 space-y-2.5">
                <p class="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-amber">
                  What Ascend does not do
                </p>
                <ul class="space-y-2 text-[13px] text-[#DCE4EE]">
                  <li class="flex items-start gap-2">
                    <span class="font-mono text-signal-coral font-bold mt-0.5">x</span>
                    <span>No sales, revenue, profit, or business survival predictions.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="font-mono text-signal-coral font-bold mt-0.5">x</span>
                    <span>Informal street vendors, pushcarts, and unlisted stalls are often absent from open maps.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="font-mono text-signal-coral font-bold mt-0.5">x</span>
                    <span>No lease listings, property scraping, or official zoning / permit clearance.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="font-mono text-signal-coral font-bold mt-0.5">x</span>
                    <span>Data years differ: places and streets are 2026 snapshots; population is a WorldPop 2026 model estimate (alpha release).</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="font-mono text-signal-coral font-bold mt-0.5">x</span>
                    <span>The factors on each card explain estimated demand at that spot; the label compares counts over about 500 m.</span>
                  </li>
                </ul>
              </div>

              <div class="rounded-xl bg-[#0A0E14] border border-mint/30 p-4 flex items-start gap-3">
                <ShieldCheck class="w-4 h-4 text-mint shrink-0 mt-0.5" />
                <div class="space-y-1">
                  <p class="font-sans font-semibold text-[13px] text-ink-primary">
                    No accounts, browser-only storage
                  </p>
                  <p class="text-[12.5px] text-ink-secondary leading-relaxed">
                    Your shortlist stays inside this browser's local storage and is never uploaded. Designed for users 18+; when Ask Ascend launches, avoid entering personal information.
                  </p>
                  <p class="text-[12.5px] text-ink-secondary leading-relaxed">
                    Location is optional and only used when you tap "Locate me". Your device location is used first; if it fails, an approximate location is looked up from your IP address via get.geojs.io or ipapi.co. Routes come from public OSRM routing servers, which receive your location and the selected area. Ascend stores none of this.
                  </p>
                </div>
              </div>
            </template>

            <!-- TAB 5: VERSIONS -->
            <template v-else-if="canonicalTab === 'versions'">
              <div class="flex items-center gap-2">
                <GitBranch class="w-4 h-4 text-mint shrink-0" />
                <h3 class="font-display font-bold text-[17px] text-ink-primary">
                  Dataset <span class="font-editorial italic font-semibold text-mint">versions</span>
                </h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div class="rounded-xl bg-[#0A0E14] border border-white/10 p-3.5">
                  <p class="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted">
                    Active coverage
                  </p>
                  <p class="mt-1 font-sans font-semibold text-[13.5px] text-ink-primary">
                    Active open-data study zones
                  </p>
                  <p class="mt-0.5 font-mono text-[10.5px] text-mint">
                    {{ totalAreas.toLocaleString('en-US') }} mapped neighborhood areas
                  </p>
                </div>

                <div class="rounded-xl bg-[#0A0E14] border border-white/10 p-3.5">
                  <p class="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted">
                    Release & status
                  </p>
                  <p class="mt-1 font-sans font-semibold text-[13.5px] text-ink-primary">
                    {{ dataVersionLabel }}
                  </p>
                  <p class="mt-0.5 font-mono text-[10.5px] text-ink-muted">
                    Schema v{{ meta?.contract_version ?? '1.1.0' }} · {{ meta?.is_sample ? 'Sample preview' : 'Live open dataset' }}
                  </p>
                </div>
              </div>

              <div class="rounded-xl bg-[#0A0E14] border border-white/10 p-3.5 space-y-2">
                <p class="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted">
                  Business types
                </p>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint/15 border border-mint/40 font-mono text-[10px] font-bold text-mint uppercase">
                    <span class="w-1.5 h-1.5 rounded-full bg-mint" />
                    Coffee shop · Live
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-dashed border-[#334155] font-mono text-[10px] text-[#94A3B8] uppercase">
                    Eatery ·
                    <span class="text-signal-amber font-bold">Coming soon</span>
                  </span>
                </div>
              </div>
            </template>

            <!-- TAB 6: COMING SOON -->
            <template v-else>
              <div class="flex items-center gap-2">
                <Clock class="w-4 h-4 text-mint shrink-0" />
                <h3 class="font-display font-bold text-[17px] text-ink-primary">
                  Coming <span class="font-editorial italic font-semibold text-mint">soon</span>
                </h3>
              </div>

              <div class="space-y-2">
                <div
                  v-for="item in comingSoonItems"
                  :key="item.id"
                  class="px-3.5 py-2.5 rounded-xl bg-[#0B1017] border border-dashed border-[#334155]/90 flex items-center justify-between gap-3"
                >
                  <span class="inline-flex items-center gap-2.5 text-[13.5px] text-[#94A3B8]">
                    <component :is="item.icon" class="w-4 h-4 text-[#64748B] shrink-0" />
                    <span>{{ item.label }}</span>
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full bg-signal-amber/10 border border-signal-amber/50 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-signal-amber shrink-0">
                    COMING SOON
                  </span>
                </div>
              </div>

              <p class="pt-1 text-[12.5px] text-ink-secondary flex flex-wrap items-center gap-1.5">
                <span>Upcoming previews elsewhere in Ascend are tagged</span>
                <span class="px-2 py-0.5 rounded-full bg-signal-amber/10 border border-signal-amber/50 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-signal-amber">
                  COMING SOON
                </span>
                <span>and never fabricate numbers.</span>
              </p>
            </template>
          </div>

          <!-- Unified Footer (Disclaimer + Privacy Line + Mint Back CTA + ESC TO CLOSE) -->
          <div class="shrink-0 px-6 py-4 bg-[#0B1017] border-t border-white/10 space-y-3">
            <div class="space-y-1 text-[11.5px] leading-[1.55] text-ink-muted">
              <p>
                Estimate based on open data. Not financial advice. Check zoning and permits with official sources before signing a lease.
              </p>
              <p>
                Your shortlist stays in this browser. Ascend has no accounts.
              </p>
            </div>

            <div class="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                class="btn-mint h-10 px-5 text-[13px] font-bold shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer"
                @click="emit('close')"
              >
                <ArrowLeft class="w-4 h-4" />
                <span>{{ closeLabel }}</span>
              </button>

              <span class="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-muted">
                ESC TO CLOSE
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
