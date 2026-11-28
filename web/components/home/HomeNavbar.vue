<script setup lang="ts">
import { ArrowRight, Compass, LayoutGrid, Map as MapIcon, Settings, Users } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    activeSection?: string
  }>(),
  {
    activeSection: '',
  },
)

const emit = defineEmits<{
  openSettings: []
}>()

const settings = useAscendSettings()
const copy = computed(() => settings.homeCopy.value)
const { fitReady, isCompact, homeZoom, HOME_DESIGN_WIDTH } = useDesktopFit()

const isScrolled = ref(false)
const hoveredNavId = ref<string | null>(null)

const navIconMeta = computed<Record<string, { icon: typeof Compass; hint: string }>>(() => ({
  'cara-kerja': { icon: Compass, hint: settings.t('4 open-data steps', '4 langkah data terbuka') },
  fitur: { icon: LayoutGrid, hint: settings.t('Map & area tools', 'Alat peta & area') },
  tentang: { icon: Users, hint: settings.t('Team Rosun Gank', 'Tim Rosun Gank') },
}))

function handleScroll() {
  isScrolled.value = window.scrollY > 24
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header
    :class="fitReady && isCompact ? 'fixed top-4 left-0 z-50 px-6 pointer-events-none' : 'fixed top-4 inset-x-0 z-50 px-6 pointer-events-none'"
    :style="fitReady && isCompact ? { width: `${HOME_DESIGN_WIDTH}px`, zoom: String(homeZoom) } : undefined"
  >
    <nav
      aria-label="Primary navigation"
      class="pointer-events-auto mx-auto max-w-frame h-[clamp(46px,5.6vw,62px)] px-[clamp(10px,2vw,24px)] rounded-full flex items-center justify-between gap-2 transition-all duration-mid ease-signal backdrop-blur-md"
      :class="
        isScrolled
          ? 'bg-[#161A21]/95 border border-[#34404F] shadow-[0_12px_40px_rgba(0,0,0,0.55)]'
          : 'bg-[#161A21]/85 border border-[#232836]'
      "
    >
      <!-- Left: Brand (Fluid Scale With Safe Floor, City-Agnostic) -->
      <div class="flex items-center gap-2 lg:gap-4 min-w-0 shrink-0">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 sm:gap-2.5 group shrink-0"
          aria-label="Ascend Home"
        >
          <UiAscendMark
            :size="26"
            class="w-[clamp(22px,2.5vw,28px)] h-[clamp(22px,2.5vw,28px)] transition-all duration-mid ease-signal group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.55)]"
          />
          <span class="font-display font-bold text-[clamp(12px,1.5vw,16px)] tracking-[0.06em] text-ink-primary">
            {{ copy.navbar.brand }}
          </span>
        </NuxtLink>
      </div>

      <!-- Right: Always-Inline Icon Navigation + Settings + Fluid Map CTA -->
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <!-- 3 Icon Navigation Links + Settings Gear with Hover Tooltips -->
        <div class="flex items-center gap-1 sm:gap-1.5 mr-0.5 sm:mr-1">
          <div
            v-for="link in copy.navbar.links"
            :key="link.id"
            class="relative"
            @mouseenter="hoveredNavId = link.id"
            @mouseleave="hoveredNavId = null"
          >
            <a
              :href="link.href"
              :aria-label="link.label"
              :title="link.label"
              class="relative inline-flex items-center justify-center w-[clamp(32px,3.6vw,38px)] h-[clamp(32px,3.6vw,38px)] rounded-full border transition-all duration-fast ease-signal"
              :class="
                props.activeSection === link.id
                  ? 'border-mint/70 bg-mint/15 text-[#00E5A8] shadow-[0_0_14px_rgba(16,185,129,0.28)]'
                  : 'border-[#273240] bg-[#0E1319]/80 text-ink-secondary hover:border-[#00E5A8]/65 hover:text-[#00E5A8] hover:bg-[#132224]/90'
              "
              @focus="hoveredNavId = link.id"
              @blur="hoveredNavId = null"
            >
              <component
                :is="navIconMeta[link.id]?.icon ?? Compass"
                class="w-[clamp(14px,1.5vw,16px)] h-[clamp(14px,1.5vw,16px)]"
                :stroke-width="1.9"
              />
              <span
                v-if="props.activeSection === link.id"
                class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00E5A8]"
              />
            </a>

            <!-- Hover Tooltip Revealing Feature Name + Brief Hint -->
            <Transition
              enter-active-class="transition duration-150 ease-signal"
              enter-from-class="opacity-0 -translate-y-1 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-120 ease-signal"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-1 scale-95"
            >
              <div
                v-if="hoveredNavId === link.id"
                role="tooltip"
                class="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-xl bg-[#091518]/95 border border-[#224742] backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.72)] whitespace-nowrap text-center"
              >
                <span
                  class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#091518] border-l border-t border-[#224742]"
                  aria-hidden="true"
                />
                <span class="block font-sans text-[11.5px] font-semibold text-ink-primary leading-tight">
                  {{ link.label }}
                </span>
                <span
                  v-if="navIconMeta[link.id]?.hint"
                  class="block font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#34D399] mt-0.5"
                >
                  {{ navIconMeta[link.id]?.hint }}
                </span>
              </div>
            </Transition>
          </div>

          <!-- Settings Icon Button (Language & Motion Preferences) -->
          <div
            class="relative"
            @mouseenter="hoveredNavId = 'settings'"
            @mouseleave="hoveredNavId = null"
          >
            <button
              type="button"
              :aria-label="settings.settingsCopy.value.navTooltip"
              :title="settings.settingsCopy.value.navTooltip"
              class="relative inline-flex items-center justify-center w-[clamp(32px,3.6vw,38px)] h-[clamp(32px,3.6vw,38px)] rounded-full border border-[#273240] bg-[#0E1319]/80 text-ink-secondary hover:border-[#00E5A8]/65 hover:text-[#00E5A8] hover:bg-[#132224]/90 transition-all duration-fast ease-signal cursor-pointer"
              @focus="hoveredNavId = 'settings'"
              @blur="hoveredNavId = null"
              @click="emit('openSettings')"
            >
              <Settings class="w-[clamp(14px,1.5vw,16px)] h-[clamp(14px,1.5vw,16px)]" :stroke-width="1.9" />
              <span
                class="absolute -bottom-1 -right-0.5 px-1 rounded-full bg-[#102721] border border-mint/50 font-mono text-[7px] font-bold uppercase text-mint leading-[12px]"
              >
                {{ settings.locale.value }}
              </span>
            </button>

            <Transition
              enter-active-class="transition duration-150 ease-signal"
              enter-from-class="opacity-0 -translate-y-1 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-120 ease-signal"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-1 scale-95"
            >
              <div
                v-if="hoveredNavId === 'settings'"
                role="tooltip"
                class="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-xl bg-[#091518]/95 border border-[#224742] backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.72)] whitespace-nowrap text-center"
              >
                <span
                  class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#091518] border-l border-t border-[#224742]"
                  aria-hidden="true"
                />
                <span class="block font-sans text-[11.5px] font-semibold text-ink-primary leading-tight">
                  {{ settings.settingsCopy.value.navTooltip }}
                </span>
                <span class="block font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#34D399] mt-0.5">
                  {{ settings.settingsCopy.value.navTooltipHintHome }}
                </span>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Primary Mint Map CTA: Icon-Only Circle Below lg, Full Pill at lg+ -->
        <div
          class="relative"
          @mouseenter="hoveredNavId = 'open-map'"
          @mouseleave="hoveredNavId = null"
        >
          <NuxtLink
            to="/map"
            :aria-label="copy.navbar.cta"
            :title="copy.navbar.cta"
            class="btn-mint h-10 w-auto px-5 text-[13.5px] whitespace-nowrap group shadow-[0_0_24px_rgba(16,185,129,0.45)]"
            @focus="hoveredNavId = 'open-map'"
            @blur="hoveredNavId = null"
          >
            <MapIcon class="hidden" :stroke-width="2.2" />
            <span class="inline">{{ copy.navbar.cta }}</span>
            <ArrowRight
              class="inline-block w-4 h-4 transition-transform duration-fast ease-signal group-hover:translate-x-0.5"
              :stroke-width="2.2"
            />
          </NuxtLink>

          <Transition
            enter-active-class="transition duration-150 ease-signal"
            enter-from-class="opacity-0 -translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-120 ease-signal"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-95"
          >
            <div
              v-if="hoveredNavId === 'open-map'"
              role="tooltip"
              class="hidden pointer-events-none absolute top-[calc(100%+10px)] right-0 z-50 px-3 py-1.5 rounded-xl bg-[#091518]/95 border border-[#224742] backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.72)] whitespace-nowrap text-center"
            >
              <span class="block font-sans text-[11.5px] font-semibold text-ink-primary leading-tight">
                {{ copy.navbar.cta }}
              </span>
              <span class="block font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#34D399] mt-0.5">
                {{ settings.t('Live opportunity map', 'Peta peluang aktif') }}
              </span>
            </div>
          </Transition>
        </div>
      </div>
    </nav>
  </header>
</template>
