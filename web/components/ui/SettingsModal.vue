<script setup lang="ts">
import {
  Check,
  Eye,
  Focus,
  Globe,
  Hexagon,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-vue-next'
import type { MapThemeMode } from '~/composables/useAscendSettings'
import type { AscendLocale } from '~/utils/i18nCopy'

const props = withDefaults(
  defineProps<{
    open: boolean
    context: 'home' | 'map'
    lightMode?: boolean
    shortlistCount?: number
  }>(),
  {
    lightMode: false,
    shortlistCount: 0,
  },
)

const emit = defineEmits<{
  close: []
  themeChanged: [theme: MapThemeMode]
  clearShortlist: []
}>()

const settings = useAscendSettings()
const copy = computed(() => settings.settingsCopy.value)
const confirmClear = ref(false)
const clearedNotice = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      confirmClear.value = false
      clearedNotice.value = false
    }
  },
)

function chooseLocale(next: AscendLocale) {
  settings.setLocale(next)
}

function chooseTheme(next: MapThemeMode) {
  settings.setMapTheme(next)
  emit('themeChanged', next)
}

function executeClearShortlist() {
  emit('clearShortlist')
  confirmClear.value = false
  clearedNotice.value = true
  setTimeout(() => {
    clearedNotice.value = false
  }, 2600)
}

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
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md"
        :class="lightMode ? 'bg-slate-950/35' : 'bg-[#04070B]/80'"
        role="dialog"
        aria-modal="true"
        :aria-label="`${copy.title} ${copy.titleAccent}`"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-[520px] max-h-[88vh] flex flex-col rounded-2xl overflow-hidden border transition-colors"
          :class="
            lightMode
              ? 'bg-[#FFFFFF] border-slate-900/15 text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.22)]'
              : 'bg-[#0D121A] border-white/15 text-ink-primary shadow-[0_30px_100px_rgba(0,0,0,0.88)]'
          "
        >
          <!-- Architectural Header -->
          <div
            class="relative shrink-0 px-6 pt-5 pb-4 border-b overflow-hidden"
            :class="
              lightMode
                ? 'bg-gradient-to-b from-[#F0FDF7] via-[#F8FAFC] to-white border-slate-900/10'
                : 'bg-gradient-to-b from-[#131C28] via-[#101722] to-[#0D121A] border-white/10'
            "
          >
            <div
              class="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-35"
              style="background: radial-gradient(circle, rgba(16, 185, 129, 0.45), transparent 70%);"
              aria-hidden="true"
            />

            <div class="relative z-10 flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p
                  class="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em]"
                  :class="lightMode ? 'text-emerald-700' : 'text-mint/90'"
                >
                  <SlidersHorizontal class="w-3.5 h-3.5" />
                  <span>{{ copy.eyebrow }}</span>
                </p>

                <h2 class="mt-2 flex items-baseline gap-2 leading-none">
                  <span
                    class="font-editorial font-semibold text-[26px] sm:text-[30px] tracking-[-0.02em]"
                    :class="lightMode ? 'text-slate-900' : 'text-ink-primary'"
                  >
                    {{ copy.title }}
                  </span>
                  <span
                    class="font-editorial italic font-semibold text-[28px] sm:text-[32px] bg-clip-text text-transparent tracking-[-0.01em]"
                    :class="
                      lightMode
                        ? 'bg-gradient-to-r from-[#059669] via-[#10B981] to-[#0D9488]'
                        : 'bg-gradient-to-r from-[#34D399] via-[#10B981] to-[#14B8A6]'
                    "
                  >
                    {{ copy.titleAccent }}
                  </span>
                </h2>

                <p
                  class="mt-1.5 font-sans text-[12.5px] leading-snug"
                  :class="lightMode ? 'text-slate-600' : 'text-ink-secondary'"
                >
                  {{ context === 'map' ? copy.subtitleMap : copy.subtitleHome }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0 pt-0.5">
                <span
                  class="hidden sm:inline-flex px-2 py-0.5 rounded-md border font-mono text-[9px] uppercase tracking-[0.12em]"
                  :class="
                    lightMode
                      ? 'bg-slate-100 border-slate-900/10 text-slate-500'
                      : 'bg-white/[0.04] border-white/10 text-ink-muted'
                  "
                >
                  ESC
                </span>
                <button
                  type="button"
                  aria-label="Close settings"
                  class="w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer"
                  :class="
                    lightMode
                      ? 'bg-white border-slate-900/15 hover:border-emerald-600 text-slate-500 hover:text-slate-900'
                      : 'bg-[#121A26]/95 border-white/15 hover:border-mint text-ink-secondary hover:text-ink-primary'
                  "
                  @click="emit('close')"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Scrollable Preferences Body -->
          <div
            class="flex-1 overflow-y-auto px-6 py-5 space-y-5"
            :class="lightMode ? 'light-mode-scroll' : ''"
          >
            <!-- 1. LANGUAGE SWITCHER (EN / ID: Available on BOTH Homepage & Map) -->
            <section class="space-y-2.5">
              <div class="flex items-center gap-2">
                <Globe class="w-4 h-4 shrink-0" :class="lightMode ? 'text-emerald-600' : 'text-mint'" />
                <div>
                  <h3
                    class="font-sans text-[13.5px] font-semibold leading-tight"
                    :class="lightMode ? 'text-slate-900' : 'text-ink-primary'"
                  >
                    {{ copy.languageTitle }}
                  </h3>
                  <p class="font-sans text-[11.5px]" :class="lightMode ? 'text-slate-500' : 'text-ink-muted'">
                    {{ copy.languageHint }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  class="rounded-xl p-3 border text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                  :class="
                    settings.locale.value === 'en'
                      ? lightMode
                        ? 'bg-emerald-50 border-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.16)]'
                        : 'bg-mint/15 border-mint shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : lightMode
                        ? 'bg-slate-50 border-slate-900/10 hover:border-slate-900/25'
                        : 'bg-[#111824] border-white/10 hover:border-white/25'
                  "
                  @click="chooseLocale('en')"
                >
                  <div class="min-w-0">
                    <span
                      class="inline-block px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
                      :class="
                        settings.locale.value === 'en'
                          ? lightMode
                            ? 'bg-emerald-600 text-white'
                            : 'bg-mint text-[#071510]'
                          : lightMode
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-white/10 text-ink-muted'
                      "
                    >
                      EN
                    </span>
                    <p
                      class="mt-1.5 font-sans text-[13px] font-semibold leading-tight"
                      :class="lightMode ? 'text-slate-900' : 'text-ink-primary'"
                    >
                      English
                    </p>
                    <p class="font-mono text-[9px] uppercase mt-0.5" :class="lightMode ? 'text-slate-500' : 'text-ink-muted'">
                      {{ copy.defaultBadge }}
                    </p>
                  </div>
                  <Check
                    v-if="settings.locale.value === 'en'"
                    class="w-4 h-4 shrink-0"
                    :class="lightMode ? 'text-emerald-600' : 'text-mint'"
                  />
                </button>

                <button
                  type="button"
                  class="rounded-xl p-3 border text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                  :class="
                    settings.locale.value === 'id'
                      ? lightMode
                        ? 'bg-emerald-50 border-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.16)]'
                        : 'bg-mint/15 border-mint shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : lightMode
                        ? 'bg-slate-50 border-slate-900/10 hover:border-slate-900/25'
                        : 'bg-[#111824] border-white/10 hover:border-white/25'
                  "
                  @click="chooseLocale('id')"
                >
                  <div class="min-w-0">
                    <span
                      class="inline-block px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
                      :class="
                        settings.locale.value === 'id'
                          ? lightMode
                            ? 'bg-emerald-600 text-white'
                            : 'bg-mint text-[#071510]'
                          : lightMode
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-white/10 text-ink-muted'
                      "
                    >
                      ID
                    </span>
                    <p
                      class="mt-1.5 font-sans text-[13px] font-semibold leading-tight"
                      :class="lightMode ? 'text-slate-900' : 'text-ink-primary'"
                    >
                      Bahasa Indonesia
                    </p>
                    <p class="font-mono text-[9px] uppercase mt-0.5" :class="lightMode ? 'text-slate-500' : 'text-ink-muted'">
                      NUSANTARA
                    </p>
                  </div>
                  <Check
                    v-if="settings.locale.value === 'id'"
                    class="w-4 h-4 shrink-0"
                    :class="lightMode ? 'text-emerald-600' : 'text-mint'"
                  />
                </button>
              </div>
            </section>

            <!-- 2. MAP APPEARANCE THEME (DARK [DEFAULT] vs LIGHT: STRICTLY ON MAP PAGE ONLY!) -->
            <section
              v-if="context === 'map'"
              class="pt-4 border-t space-y-2.5"
              :class="lightMode ? 'border-slate-900/10' : 'border-white/10'"
            >
              <div class="flex items-center gap-2">
                <Sun v-if="settings.isMapLight.value" class="w-4 h-4 shrink-0 text-amber-600" />
                <Moon v-else class="w-4 h-4 shrink-0 text-mint" />
                <div>
                  <h3
                    class="font-sans text-[13.5px] font-semibold leading-tight"
                    :class="lightMode ? 'text-slate-900' : 'text-ink-primary'"
                  >
                    {{ copy.themeTitle }}
                  </h3>
                  <p class="font-sans text-[11.5px]" :class="lightMode ? 'text-slate-500' : 'text-ink-muted'">
                    {{ copy.themeHint }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <!-- Dark Option (Default) -->
                <button
                  type="button"
                  class="rounded-xl p-3 border text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                  :class="
                    settings.mapTheme.value === 'dark'
                      ? 'bg-mint/15 border-mint shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : lightMode
                        ? 'bg-slate-50 border-slate-900/10 hover:border-slate-900/25'
                        : 'bg-[#111824] border-white/10 hover:border-white/25'
                  "
                  @click="chooseTheme('dark')"
                >
                  <div class="flex items-start gap-2.5 min-w-0">
                    <span class="w-8 h-8 rounded-lg bg-[#0B1018] border border-white/15 flex items-center justify-center text-mint shrink-0 mt-0.5">
                      <Moon class="w-4 h-4" />
                    </span>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span
                          class="font-sans text-[13px] font-semibold leading-tight"
                          :class="lightMode ? 'text-slate-900' : 'text-ink-primary'"
                        >
                          {{ copy.themeDark }}
                        </span>
                        <span
                          class="px-1.5 py-0.5 rounded font-mono text-[7.5px] font-bold uppercase"
                          :class="lightMode ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-ink-muted'"
                        >
                          {{ copy.defaultBadge }}
                        </span>
                      </div>
                      <p class="font-sans text-[11px] mt-0.5 truncate" :class="lightMode ? 'text-slate-500' : 'text-ink-muted'">
                        {{ copy.themeDarkDesc }}
                      </p>
                    </div>
                  </div>
                  <Check v-if="settings.mapTheme.value === 'dark'" class="w-4 h-4 text-mint shrink-0" />
                </button>

                <!-- Light Option -->
                <button
                  type="button"
                  class="rounded-xl p-3 border text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                  :class="
                    settings.mapTheme.value === 'light'
                      ? 'bg-emerald-50 border-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.16)]'
                      : 'bg-[#111824] border-white/10 hover:border-white/25'
                  "
                  @click="chooseTheme('light')"
                >
                  <div class="flex items-start gap-2.5 min-w-0">
                    <span class="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-300 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                      <Sun class="w-4 h-4" />
                    </span>
                    <div class="min-w-0">
                      <span
                        class="block font-sans text-[13px] font-semibold leading-tight"
                        :class="lightMode ? 'text-slate-900' : 'text-ink-primary'"
                      >
                        {{ copy.themeLight }}
                      </span>
                      <p class="font-sans text-[11px] mt-0.5 truncate" :class="lightMode ? 'text-slate-500' : 'text-ink-muted'">
                        {{ copy.themeLightDesc }}
                      </p>
                    </div>
                  </div>
                  <Check
                    v-if="settings.mapTheme.value === 'light'"
                    class="w-4 h-4 text-emerald-600 shrink-0"
                  />
                </button>
              </div>
            </section>

            <!-- 3. MOTION & COMFORT (Available on Both) -->
            <section
              class="pt-4 border-t space-y-2.5"
              :class="lightMode ? 'border-slate-900/10' : 'border-white/10'"
            >
              <p
                class="font-mono text-[9.5px] uppercase tracking-[0.14em]"
                :class="lightMode ? 'text-slate-500' : 'text-ink-muted'"
              >
                {{ copy.experienceTitle }}
              </p>

              <button
                type="button"
                role="switch"
                :aria-checked="settings.calmMotion.value"
                class="w-full rounded-xl p-3 border flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                :class="
                  lightMode
                    ? 'bg-slate-50 border-slate-900/10 hover:border-emerald-600/40'
                    : 'bg-[#111824] border-white/10 hover:border-white/20'
                "
                @click="settings.setCalmMotion(!settings.calmMotion.value)"
              >
                <span class="flex items-start gap-2.5 min-w-0">
                  <Sparkles
                    class="w-4 h-4 shrink-0 mt-0.5"
                    :class="lightMode ? 'text-emerald-600' : 'text-mint'"
                  />
                  <span class="min-w-0">
                    <span
                      class="block font-sans text-[12.5px] font-semibold"
                      :class="lightMode ? 'text-slate-900' : 'text-ink-primary'"
                    >
                      {{ copy.calmMotionLabel }}
                    </span>
                    <span
                      class="block font-sans text-[11px] leading-snug mt-0.5"
                      :class="lightMode ? 'text-slate-500' : 'text-ink-muted'"
                    >
                      {{ copy.calmMotionDesc }}
                    </span>
                  </span>
                </span>
                <span
                  class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                  :class="
                    settings.calmMotion.value
                      ? lightMode ? 'bg-emerald-600' : 'bg-mint'
                      : lightMode ? 'bg-slate-300' : 'bg-white/15'
                  "
                >
                  <span
                    class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                    :class="settings.calmMotion.value ? 'translate-x-[18px]' : 'translate-x-[3px]'"
                  />
                </span>
              </button>
            </section>

            <!-- 4. MAP READING HELPERS (Map Only, Zero Navbar Duplication!) -->
            <section
              v-if="context === 'map'"
              class="pt-4 border-t space-y-2"
              :class="lightMode ? 'border-slate-900/10' : 'border-white/10'"
            >
              <p
                class="font-mono text-[9.5px] uppercase tracking-[0.14em]"
                :class="lightMode ? 'text-slate-500' : 'text-ink-muted'"
              >
                {{ copy.mapPrefsTitle }}
              </p>

              <!-- Hover preview toggle -->
              <button
                type="button"
                role="switch"
                :aria-checked="settings.showHoverPreview.value"
                class="w-full rounded-xl p-3 border flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                :class="
                  lightMode
                    ? 'bg-slate-50 border-slate-900/10 hover:border-emerald-600/40'
                    : 'bg-[#111824] border-white/10 hover:border-white/20'
                "
                @click="settings.setShowHoverPreview(!settings.showHoverPreview.value)"
              >
                <span class="flex items-start gap-2.5 min-w-0">
                  <Eye class="w-4 h-4 shrink-0 mt-0.5" :class="lightMode ? 'text-emerald-600' : 'text-mint'" />
                  <span class="min-w-0">
                    <span class="block font-sans text-[12.5px] font-semibold" :class="lightMode ? 'text-slate-900' : 'text-ink-primary'">
                      {{ copy.hoverPreviewLabel }}
                    </span>
                    <span class="block font-sans text-[11px] leading-snug mt-0.5" :class="lightMode ? 'text-slate-500' : 'text-ink-muted'">
                      {{ copy.hoverPreviewDesc }}
                    </span>
                  </span>
                </span>
                <span
                  class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                  :class="
                    settings.showHoverPreview.value
                      ? lightMode ? 'bg-emerald-600' : 'bg-mint'
                      : lightMode ? 'bg-slate-300' : 'bg-white/15'
                  "
                >
                  <span
                    class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                    :class="settings.showHoverPreview.value ? 'translate-x-[18px]' : 'translate-x-[3px]'"
                  />
                </span>
              </button>

              <!-- Auto-zoom on click toggle -->
              <button
                type="button"
                role="switch"
                :aria-checked="settings.autoZoomOnSelect.value"
                class="w-full rounded-xl p-3 border flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                :class="
                  lightMode
                    ? 'bg-slate-50 border-slate-900/10 hover:border-emerald-600/40'
                    : 'bg-[#111824] border-white/10 hover:border-white/20'
                "
                @click="settings.setAutoZoomOnSelect(!settings.autoZoomOnSelect.value)"
              >
                <span class="flex items-start gap-2.5 min-w-0">
                  <Focus class="w-4 h-4 shrink-0 mt-0.5" :class="lightMode ? 'text-emerald-600' : 'text-mint'" />
                  <span class="min-w-0">
                    <span class="block font-sans text-[12.5px] font-semibold" :class="lightMode ? 'text-slate-900' : 'text-ink-primary'">
                      {{ copy.autoZoomLabel }}
                    </span>
                    <span class="block font-sans text-[11px] leading-snug mt-0.5" :class="lightMode ? 'text-slate-500' : 'text-ink-muted'">
                      {{ copy.autoZoomDesc }}
                    </span>
                  </span>
                </span>
                <span
                  class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                  :class="
                    settings.autoZoomOnSelect.value
                      ? lightMode ? 'bg-emerald-600' : 'bg-mint'
                      : lightMode ? 'bg-slate-300' : 'bg-white/15'
                  "
                >
                  <span
                    class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                    :class="settings.autoZoomOnSelect.value ? 'translate-x-[18px]' : 'translate-x-[3px]'"
                  />
                </span>
              </button>

              <!-- Neighbor ring toggle -->
              <button
                type="button"
                role="switch"
                :aria-checked="settings.showNeighborRing.value"
                class="w-full rounded-xl p-3 border flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                :class="
                  lightMode
                    ? 'bg-slate-50 border-slate-900/10 hover:border-emerald-600/40'
                    : 'bg-[#111824] border-white/10 hover:border-white/20'
                "
                @click="settings.setShowNeighborRing(!settings.showNeighborRing.value)"
              >
                <span class="flex items-start gap-2.5 min-w-0">
                  <Hexagon class="w-4 h-4 shrink-0 mt-0.5" :class="lightMode ? 'text-emerald-600' : 'text-mint'" />
                  <span class="min-w-0">
                    <span class="block font-sans text-[12.5px] font-semibold" :class="lightMode ? 'text-slate-900' : 'text-ink-primary'">
                      {{ copy.neighborRingLabel }}
                    </span>
                    <span class="block font-sans text-[11px] leading-snug mt-0.5" :class="lightMode ? 'text-slate-500' : 'text-ink-muted'">
                      {{ copy.neighborRingDesc }}
                    </span>
                  </span>
                </span>
                <span
                  class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                  :class="
                    settings.showNeighborRing.value
                      ? lightMode ? 'bg-emerald-600' : 'bg-mint'
                      : lightMode ? 'bg-slate-300' : 'bg-white/15'
                  "
                >
                  <span
                    class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                    :class="settings.showNeighborRing.value ? 'translate-x-[18px]' : 'translate-x-[3px]'"
                  />
                </span>
              </button>
            </section>

            <!-- 5. LOCAL PRIVACY & SHORTLIST MANAGEMENT -->
            <section
              class="pt-4 border-t space-y-2.5"
              :class="lightMode ? 'border-slate-900/10' : 'border-white/10'"
            >
              <div
                class="rounded-xl p-3.5 border flex items-start gap-2.5"
                :class="
                  lightMode
                    ? 'bg-emerald-50/70 border-emerald-600/20'
                    : 'bg-[#0A0F16] border-mint/25'
                "
              >
                <ShieldCheck
                  class="w-4 h-4 shrink-0 mt-0.5"
                  :class="lightMode ? 'text-emerald-700' : 'text-mint'"
                />
                <div class="space-y-1 min-w-0 flex-1">
                  <p
                    class="font-sans text-[12.5px] font-semibold"
                    :class="lightMode ? 'text-slate-900' : 'text-ink-primary'"
                  >
                    {{ copy.privacyTitle }}
                  </p>
                  <p
                    class="font-sans text-[11.5px] leading-relaxed"
                    :class="lightMode ? 'text-slate-600' : 'text-ink-secondary'"
                  >
                    {{ copy.privacyNote }}
                  </p>

                  <!-- Clear Shortlist Control on Map -->
                  <div v-if="context === 'map' && shortlistCount > 0" class="pt-2">
                    <div v-if="!confirmClear">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11.5px] font-sans font-medium transition-colors cursor-pointer"
                        :class="
                          lightMode
                            ? 'bg-white border-red-500/35 text-red-600 hover:bg-red-50'
                            : 'bg-signal-coral/10 border-signal-coral/40 text-signal-coral hover:bg-signal-coral/20'
                        "
                        @click="confirmClear = true"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                        <span>{{ copy.clearShortlistBtn }} ({{ shortlistCount }})</span>
                      </button>
                    </div>
                    <div
                      v-else
                      class="rounded-xl p-2.5 border space-y-2"
                      :class="
                        lightMode
                          ? 'bg-red-50 border-red-500/30'
                          : 'bg-signal-coral/10 border-signal-coral/40'
                      "
                    >
                      <p class="font-sans text-[11.5px]" :class="lightMode ? 'text-red-800' : 'text-ink-primary'">
                        {{ copy.clearShortlistConfirm }}
                      </p>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          class="px-3 py-1 rounded-full font-sans text-[11px] font-medium border cursor-pointer"
                          :class="
                            lightMode
                              ? 'bg-white border-slate-300 text-slate-700'
                              : 'bg-white/[0.06] border-white/15 text-ink-secondary'
                          "
                          @click="confirmClear = false"
                        >
                          {{ copy.clearShortlistCancel }}
                        </button>
                        <button
                          type="button"
                          class="px-3 py-1 rounded-full bg-signal-coral text-white font-sans text-[11px] font-semibold cursor-pointer"
                          @click="executeClearShortlist"
                        >
                          {{ copy.clearShortlistYes }}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p v-else-if="clearedNotice" class="pt-1 font-mono text-[10px] text-mint">
                    {{ copy.shortlistCleared }}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <!-- Footer Close Bar -->
          <div
            class="shrink-0 px-6 py-3.5 border-t flex items-center justify-end"
            :class="lightMode ? 'bg-slate-50 border-slate-900/10' : 'bg-[#0A0E14] border-white/10'"
          >
            <button
              type="button"
              class="btn-mint h-9 px-5 text-[12.5px] font-bold cursor-pointer"
              @click="emit('close')"
            >
              {{ copy.closeBtn }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
