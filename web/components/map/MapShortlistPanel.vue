<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeftRight,
  Compass,
  MapPin,
  MousePointerClick,
  Trash2,
  X,
} from 'lucide-vue-next'
import type { ShortlistItem } from '~/composables/useShortlist'
import type { AreaFeature } from '~/types/areas'
import { formatExpectedCount } from '~/utils/mapPatterns'

const props = withDefaults(
  defineProps<{
    items: ShortlistItem[]
    maxItems: number
    selectedH3: string | null
    quickPicks: AreaFeature[]
    lightMode?: boolean
  }>(),
  {
    lightMode: false,
  },
)

const emit = defineEmits<{
  flyTo: [h3: string, center: [number, number]]
  remove: [h3: string]
  selectFeature: [feature: AreaFeature]
}>()

const settings = useAscendSettings()
const pendingRemove = ref<ShortlistItem | null>(null)

function openRemoveConfirm(item: ShortlistItem) {
  pendingRemove.value = item
}

function cancelRemove() {
  pendingRemove.value = null
}

function confirmRemove() {
  if (!pendingRemove.value) return
  emit('remove', pendingRemove.value.h3)
  pendingRemove.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && pendingRemove.value) {
    cancelRemove()
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
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Top Header ("Your shortlist" + "AREAS SAVED N / 10") -->
    <div class="shrink-0 px-5 pt-5 pb-4 border-b border-white/10 flex items-end justify-between gap-3">
      <div>
        <h2 class="font-editorial font-semibold text-[25px] text-ink-primary leading-none tracking-[-0.01em]">
          <template v-if="settings.isId.value">
            Daftar <span class="editorial-mint">pilihanmu</span>
          </template>
          <template v-else>
            Your <span class="editorial-mint">shortlist</span>
          </template>
        </h2>
      </div>
      <div class="text-right">
        <p class="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
          {{ settings.t('AREAS SAVED', 'AREA TERSIMPAN') }}
        </p>
        <p class="mt-0.5 font-display font-bold text-[19px] text-ink-primary leading-none tabular-nums">
          {{ items.length }} <span class="text-ink-muted font-normal">/ {{ maxItems }}</span>
        </p>
      </div>
    </div>

    <!-- Scrollable Saved List (Entire Card Clickable Except Remove!) or Empty State -->
    <div class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
      <template v-if="items.length > 0">
        <div
          v-for="item in items"
          :key="item.h3"
          role="button"
          tabindex="0"
          :aria-label="settings.t(`Open details for ${item.kecamatan || 'Unnamed area'}`, `Buka detail untuk ${item.kecamatan || 'Area tanpa nama'}`)"
          class="group rounded-2xl border transition-all duration-fast overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/70"
          :class="
            selectedH3 === item.h3
              ? 'bg-[#18212E]/95 border-mint/60 shadow-[0_0_24px_rgba(16,185,129,0.16)]'
              : 'bg-[#121822]/85 border-white/[0.09] hover:border-mint/45 hover:bg-[#18212E]/95'
          "
          @click="emit('flyTo', item.h3, item.center)"
          @keydown.enter.prevent="emit('flyTo', item.h3, item.center)"
          @keydown.space.prevent="emit('flyTo', item.h3, item.center)"
        >
          <div class="p-3.5">
            <div class="w-full text-left flex items-start gap-3">
              <MapHexBadge :label="item.label" size="sm" />
              <div class="min-w-0 flex-1">
                <p class="font-editorial font-semibold text-[16.5px] text-ink-primary group-hover:text-mint transition-colors leading-snug truncate">
                  {{ item.kecamatan || settings.t('Unnamed area', 'Area tanpa nama') }}
                </p>
                <div class="mt-1.5">
                  <UiLabelBadge :label="item.label" size="sm" uppercase />
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2.5 border-t border-white/[0.07] flex items-end justify-between gap-2">
              <div class="text-left min-w-0">
                <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted">
                  {{ settings.t('COFFEE SHOPS', 'KEDAI KOPI') }}
                </p>
                <p class="mt-0.5 font-sans text-[12.5px] text-ink-secondary">
                  <strong class="font-semibold text-ink-primary">{{ item.actual_k1 }}</strong>
                  {{ settings.t('now, about', 'aktif, sekitar') }}
                  <strong class="font-semibold text-ink-primary">{{ formatExpectedCount(item.expected_k1) }}</strong>
                  {{ settings.t('expected', 'kapasitas') }}
                </p>
              </div>

              <button
                type="button"
                class="relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-sans text-[11.5px] text-ink-muted hover:text-signal-coral hover:bg-signal-coral/15 transition-colors cursor-pointer shrink-0"
                @click.stop="openRemoveConfirm(item)"
                @keydown.enter.stop.prevent="openRemoveConfirm(item)"
                @keydown.space.stop.prevent="openRemoveConfirm(item)"
              >
                <Trash2 class="w-3 h-3" />
                <span>{{ settings.t('Remove', 'Hapus') }}</span>
              </button>
            </div>
          </div>
        </div>

        <p class="pt-1 inline-flex items-center gap-1.5 font-sans text-[11.5px] text-ink-muted">
          <MousePointerClick class="w-3.5 h-3.5 text-mint shrink-0" />
          <span>{{ settings.t('Click any card to fly the map and inspect that area.', 'Klik kotak mana saja untuk berpindah dan membuka detail area.') }}</span>
        </p>
      </template>

      <!-- Empty State + Quick-Jump Explorer -->
      <template v-else>
        <div class="rounded-2xl bg-[#111722]/90 border border-dashed border-white/15 p-5 text-center space-y-2.5">
          <div class="w-10 h-10 rounded-full bg-mint/10 border border-mint/35 flex items-center justify-center text-mint mx-auto">
            <MapPin class="w-4 h-4" />
          </div>
          <h3 class="font-editorial font-semibold text-[17px] text-ink-primary">
            {{ settings.t('Start exploring areas', 'Mulai jelajahi area') }}
          </h3>
          <p class="font-sans text-[12.5px] leading-[1.6] text-ink-secondary">
            {{ settings.t(`Click any hexagon on the live map to compare active coffee shops against local demand, then save up to ${maxItems} candidate spots here.`, `Klik heksagon mana saja di peta untuk membandingkan kedai kopi aktif terhadap permintaan setempat, lalu simpan hingga ${maxItems} kandidat di sini.`) }}
          </p>
        </div>

        <!-- Real Data Quick-Jump Hotspots across all 4 labels -->
        <div v-if="quickPicks.length > 0" class="pt-3 space-y-2.5">
          <p class="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-muted">
            <Compass class="w-3.5 h-3.5 text-mint" />
            <span>{{ settings.t('QUICK JUMP · INSPECT ALL 4 LABEL TYPES', 'LOMPAT CEPAT · LIHAT 4 JENIS LABEL') }}</span>
          </p>

          <button
            v-for="feat in quickPicks"
            :key="feat.properties.h3"
            type="button"
            class="w-full rounded-xl bg-[#111722]/80 border border-white/[0.08] hover:border-mint/45 p-3 flex items-center gap-3 text-left transition-all duration-fast cursor-pointer"
            @click="emit('selectFeature', feat)"
          >
            <MapHexBadge :label="feat.properties.label" size="sm" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <span class="font-editorial font-semibold text-[14.5px] text-ink-primary truncate">
                  {{ feat.properties.kecamatan || settings.t('Unnamed area', 'Area tanpa nama') }}
                </span>
                <UiLabelBadge :label="feat.properties.label" size="sm" uppercase />
              </div>
              <p class="mt-1 font-mono text-[10px] text-ink-muted">
                {{ feat.properties.actual_k1 }} {{ settings.t('shops now', 'kedai aktif') }} · {{ settings.t('supports', 'kapasitas') }} ~{{ formatExpectedCount(feat.properties.expected_k1) }}
              </p>
            </div>
          </button>
        </div>
      </template>
    </div>

    <!-- Bottom Elongated Full-Width Compare Button with Dashed COMING SOON Inside (Matches Wireframe!) -->
    <div class="shrink-0 px-5 py-3.5 border-t border-white/10 bg-[#0D121A]/95 backdrop-blur-md space-y-1.5">
      <button
        type="button"
        disabled
        class="w-full h-11 px-4 rounded-full bg-white/[0.03] border border-dashed border-[#475569]/85 font-sans text-[13px] font-medium text-[#94A3B8] inline-flex items-center justify-center gap-2.5 cursor-not-allowed"
      >
        <ArrowLeftRight class="w-4 h-4 opacity-80 shrink-0" />
        <span>{{ settings.t('Compare', 'Bandingkan') }}</span>
        <span class="px-2.5 py-0.5 rounded-full bg-signal-amber/[0.12] border border-dashed border-signal-amber/55 font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-signal-amber">
          {{ settings.t('COMING SOON', 'SEGERA HADIR') }}
        </span>
      </button>
      <p class="text-center font-sans text-[10.5px] text-ink-muted">
        {{ settings.t('Compare 2 to 3 saved areas side by side · Phase 3', 'Bandingkan 2 hingga 3 area tersimpan berdampingan · Fase 3') }}
      </p>
    </div>

    <!-- Confirmation Pop-Up Before Removing a Saved Shortlist Area -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-120 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="pendingRemove"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          :class="props.lightMode ? 'bg-slate-950/35' : 'bg-[#04070B]/75'"
          role="alertdialog"
          aria-modal="true"
          :aria-label="settings.t('Remove area from shortlist', 'Hapus area dari daftar pendek')"
          @click.self="cancelRemove"
        >
          <div
            class="w-full max-w-[380px] rounded-2xl border p-5 space-y-4 transition-colors"
            :class="
              props.lightMode
                ? 'bg-white border-slate-900/15 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.22)]'
                : 'bg-[#101621] border-white/15 text-ink-primary shadow-[0_28px_90px_rgba(0,0,0,0.88)]'
            "
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <span class="w-9 h-9 rounded-xl bg-signal-coral/15 border border-signal-coral/40 flex items-center justify-center text-signal-coral shrink-0">
                  <AlertTriangle class="w-4 h-4" />
                </span>
                <div>
                  <h3
                    class="font-editorial font-semibold text-[18px] leading-tight"
                    :class="props.lightMode ? 'text-slate-900' : 'text-ink-primary'"
                  >
                    {{ settings.t('Remove from shortlist?', 'Hapus dari daftar pendek?') }}
                  </h3>
                  <p
                    class="font-mono text-[9.5px] uppercase tracking-[0.1em] mt-0.5"
                    :class="props.lightMode ? 'text-slate-500' : 'text-ink-muted'"
                  >
                    {{ pendingRemove.kecamatan || settings.t('Unnamed area', 'Area tanpa nama') }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close confirmation"
                class="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                :class="props.lightMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-500' : 'bg-white/[0.06] hover:bg-white/[0.12] text-ink-muted'"
                @click="cancelRemove"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <p
              class="font-sans text-[13px] leading-[1.6]"
              :class="props.lightMode ? 'text-slate-600' : 'text-ink-secondary'"
            >
              {{
                settings.t(
                  `Are you sure you want to remove ${pendingRemove.kecamatan || 'this area'} from your saved shortlist? You can always save it again from the map.`,
                  `Yakin ingin menghapus ${pendingRemove.kecamatan || 'area ini'} dari daftar pendek tersimpan? Kamu dapat menyimpannya kembali kapan saja dari peta.`,
                )
              }}
            </p>

            <div class="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                class="h-9 px-4 rounded-full border font-sans text-[12.5px] font-medium transition-colors cursor-pointer"
                :class="
                  props.lightMode
                    ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-white/[0.05] border-white/15 text-ink-secondary hover:text-ink-primary hover:border-white/30'
                "
                @click="cancelRemove"
              >
                {{ settings.t('Cancel', 'Batal') }}
              </button>
              <button
                type="button"
                class="h-9 px-4 rounded-full bg-signal-coral hover:bg-[#DC2626] text-white font-sans text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-[0_6px_20px_rgba(239,68,68,0.35)] transition-colors cursor-pointer"
                @click="confirmRemove"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>{{ settings.t('Yes, remove', 'Ya, hapus') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
