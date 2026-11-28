<script setup lang="ts">
import { ArrowDown } from 'lucide-vue-next'
import { BUSINESS_STATIONS, type BusinessStationId } from '~/utils/businessStations'
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

const props = defineProps<{
  leftStation: BusinessStationId
  rightStation: BusinessStationId
}>()

const emit = defineEmits<{
  selectStation: [id: BusinessStationId]
}>()

const hoveredStation = ref<BusinessStationId | null>(null)
const launchedId = ref<BusinessStationId | null>(null)
let launchTimer: ReturnType<typeof setTimeout> | null = null

function handleClickStation(id: BusinessStationId) {
  launchedId.value = id
  if (launchTimer) clearTimeout(launchTimer)
  launchTimer = setTimeout(() => {
    launchedId.value = null
  }, 480)
  emit('selectStation', id)
}

function activeWingBadge(id: BusinessStationId): 'LEFT' | 'RIGHT' | null {
  if (props.leftStation === id) return 'LEFT'
  if (props.rightStation === id) return 'RIGHT'
  return null
}

onBeforeUnmount(() => {
  if (launchTimer) clearTimeout(launchTimer)
})
</script>

<template>
  <!-- Borderless Seamless 8-Station Enlarged 3D-Hex Interactive Strip + Scroll Cue Underneath -->
  <section
    class="relative w-full overflow-hidden select-none pt-3 pb-7 sm:pb-9"
    style="background: linear-gradient(180deg, #070C10 0%, #060A0E 58%, #020406 100%);"
    aria-label="Interactive Nusantara small business models on hexagonal areas"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-4 h-28 opacity-40"
      style="background: radial-gradient(ellipse 68% 85% at 50% 55%, rgba(16, 185, 129, 0.12), transparent 74%);"
      aria-hidden="true"
    />

    <!-- Enlarged Clickable 8-Station 3D-Hex Business Grid (Click any to swap into Left/Right Hero stage!) -->
    <div class="relative z-10 mx-auto max-w-frame px-3 sm:px-6">
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-2 items-end">
        <button
          v-for="(st, idx) in BUSINESS_STATIONS"
          :key="st.id"
          type="button"
          class="group relative flex flex-col items-center justify-end gap-1 py-2 px-1 rounded-2xl transition-all duration-200 ease-signal cursor-pointer focus:outline-none"
          :class="[
            activeWingBadge(st.id)
              ? 'xl:bg-[#0D1E22]/65 xl:ring-1 xl:ring-[#00E5A8]/35 hover:bg-[#0B171C]/50'
              : 'hover:bg-[#0B171C]/50',
            launchedId === st.id ? 'station-click-launch' : 'hover:-translate-y-1',
          ]"
          :aria-pressed="Boolean(activeWingBadge(st.id))"
          :title="`Click to showcase ${st.label} on the Hero stage`"
          @mouseenter="hoveredStation = st.id"
          @mouseleave="hoveredStation = null"
          @click="handleClickStation(st.id)"
        >
          <!-- Active stage indicator pill ONLY shown at xl+ where Left/Right Hero wings are visible! -->
          <span
            v-if="activeWingBadge(st.id)"
            class="hidden xl:inline-flex absolute top-1.5 right-2 px-1.5 py-0.5 rounded-full bg-mint/15 border border-mint/45 font-mono text-[7.5px] font-bold tracking-[0.1em] text-[#00E5A8] uppercase"
          >
            {{ activeWingBadge(st.id) }}
          </span>

          <!-- Enlarged Polished 3D-Hex Business Diorama -->
          <div class="relative h-[96px] sm:h-[104px] w-full flex items-end justify-center">
            <HomeNusantaraBusinessHexDiorama
              :station-id="st.id"
              :highlighted="Boolean(activeWingBadge(st.id)) || hoveredStation === st.id"
              size="strip"
              :phase-offset="idx"
            />
          </div>

          <!-- Station Label & Hint -->
          <div class="flex flex-col items-center">
            <span
              class="font-mono text-[10.5px] sm:text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors duration-fast"
              :class="
                hoveredStation === st.id
                  ? 'text-[#00E5A8]'
                  : activeWingBadge(st.id)
                    ? 'text-[#A2B6BB] xl:text-[#00E5A8]'
                    : 'text-[#A2B6BB]'
              "
            >
              {{ st.label }}
            </span>
            <span
              class="hidden xl:block font-sans text-[9.5px] transition-opacity duration-fast leading-tight mt-0.5"
              :class="
                activeWingBadge(st.id) || hoveredStation === st.id
                  ? 'text-[#98BCB5] opacity-100'
                  : 'text-[#668087] opacity-70'
              "
            >
              {{ st.hint }}
            </span>
          </div>
        </button>
      </div>

      <!-- SCROLL CUE DIRECTLY BELOW THE 8-STATION STRIP -->
      <div class="mt-6 flex justify-center">
        <a
          href="#story-showcase"
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1B3538]/80 bg-[#081317]/75 hover:border-[#00E5A8]/65 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#8FA8AC] hover:text-[#00E5A8] transition-all duration-fast"
        >
          <span>{{ HOME_COPY.hero.scrollHint }}</span>
          <ArrowDown class="w-3.5 h-3.5 text-[#00E5A8] animate-bounce" :stroke-width="2" />
        </a>
      </div>
    </div>
  </section>
</template>
