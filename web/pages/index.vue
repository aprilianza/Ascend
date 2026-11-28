<script setup lang="ts">
import { BUSINESS_STATIONS, type BusinessStationId } from '~/utils/businessStations'
import type { InfoModalTab } from '~/components/home/HomeInfoModal.vue'

const { meta, loadingMeta, error, dataVersionLabel, getMeta } = useAscendData()
const settings = useAscendSettings()

useHead({
  title: computed(() =>
    settings.t('Ascend · Opportunity Map', 'Ascend · Peta Peluang Usaha'),
  ),
})

const activeSection = ref<string>('')
const modalOpen = ref(false)
const modalTab = ref<InfoModalTab>('labels')
const settingsOpen = ref(false)

// Interactive Hero Wing <-> Bottom 8-Station Click-to-Swap State
const leftStation = ref<BusinessStationId>('gerobak')
const rightStation = ref<BusinessStationId>('ruko')
const swapPulseSide = ref<'left' | 'right' | 'both' | null>(null)
let swapPulseTimer: ReturnType<typeof setTimeout> | null = null

function triggerSwapPulse(side: 'left' | 'right' | 'both') {
  swapPulseSide.value = side
  if (swapPulseTimer) clearTimeout(swapPulseTimer)
  swapPulseTimer = setTimeout(() => {
    swapPulseSide.value = null
  }, 750)
}

function handleSelectStation(id: BusinessStationId) {
  if (id === leftStation.value || id === rightStation.value) {
    // Clicking an already-featured station gracefully swaps Left <-> Right!
    const prevLeft = leftStation.value
    leftStation.value = rightStation.value
    rightStation.value = prevLeft
    triggerSwapPulse('both')
    return
  }

  const metaItem = BUSINESS_STATIONS.find(s => s.id === id)
  if (metaItem?.defaultSide === 'left') {
    leftStation.value = id
    triggerSwapPulse('left')
  } else {
    rightStation.value = id
    triggerSwapPulse('right')
  }
}

function handleSwapWings() {
  const prevLeft = leftStation.value
  leftStation.value = rightStation.value
  rightStation.value = prevLeft
  triggerSwapPulse('both')
}

function openModal(tab: InfoModalTab) {
  modalTab.value = tab
  modalOpen.value = true
}

function retryLoad() {
  getMeta(true).catch(() => {})
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  getMeta().catch(() => {})

  const sectionMapping: Array<{ selector: string; navId: string }> = [
    { selector: '#fitur', navId: 'fitur' },
    { selector: '#cara-kerja', navId: 'cara-kerja' },
    { selector: '#tim', navId: 'tentang' },
    { selector: '#beranda', navId: '' },
  ]

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
      if (visible[0]) {
        const match = sectionMapping.find(m => `#${visible[0]!.target.id}` === m.selector)
        if (match) {
          activeSection.value = match.navId
        }
      }
    },
    { rootMargin: '-25% 0px -55% 0px', threshold: [0.1, 0.35] },
  )

  for (const item of sectionMapping) {
    const el = document.querySelector(item.selector)
    if (el) observer.observe(el)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (swapPulseTimer) clearTimeout(swapPulseTimer)
})
</script>

<template>
  <div class="min-h-screen bg-ground text-ink-primary">
    <!-- 0. Floating Pill Navbar -->
    <HomeNavbar :active-section="activeSection" @open-settings="settingsOpen = true" />

    <main>
      <!-- 1. Centered 2D Hero with 15s Synced ASCEND Trail & Swappable 3D-Hex Side Wings -->
      <HomeHero
        :meta="meta"
        :loading-meta="loadingMeta"
        :left-station="leftStation"
        :right-station="rightStation"
        :swap-pulse-side="swapPulseSide"
        @swap-wings="handleSwapWings"
      />

      <!-- 1b. Interactive 8-Station Enlarged 3D-Hex Business Strip + Scroll Cue -->
      <HomeMarquee
        :left-station="leftStation"
        :right-station="rightStation"
        @select-station="handleSelectStation"
      />

      <!-- 1c. Scroll-Driven GTA VI Style Bandung Valley Video Zoom-Out Showcase -->
      <HomeStoryShowcase />

      <!-- 2. Background: "Busy isn't room." -->
      <HomeBackground />

      <!-- 3. Three Things the Eye Misses -->
      <HomeBlindspots />

      <!-- 3b. Self-Contained Counting Layer Concentric Hexagon Portal -->
      <HomeHexPortal />

      <!-- 4. Solution: Interactive 19-Cell Cluster -->
      <HomeSolution
        :meta="meta"
        :loading="loadingMeta"
        :error="error"
        @retry="retryLoad"
      />

      <!-- 5. Features: 12-Col Bento Grid -->
      <HomeFeatures />

      <!-- 6. How It Works + Honest Non-Goals Band -->
      <HomeHowItWorks />

      <!-- 7. Team Rosun Gank -->
      <HomeTeam />

      <!-- 8. Call to Action: "PAPAN NAMA" -->
      <HomeCtaSignboard />
    </main>

    <!-- 9. Footer: "PETA JALUR NIAGA" -->
    <HomeFooter
      :meta="meta"
      :loading-meta="loadingMeta"
      :data-version-label="dataVersionLabel"
      @open-modal="openModal"
    />

    <!-- Info Modal: About Ascend (6-Tab Redesign) -->
    <HomeInfoModal
      :open="modalOpen"
      :active-tab="modalTab"
      :meta="meta"
      :loading="loadingMeta"
      :error="error"
      :data-version-label="dataVersionLabel"
      :close-label="settings.t('Back to homepage', 'Kembali ke beranda')"
      @close="modalOpen = false"
      @update:active-tab="modalTab = $event"
      @retry="retryLoad"
    />

    <!-- Homepage Settings Modal (Language & Calm Motion; Map Light Mode stays Map-only) -->
    <UiSettingsModal
      :open="settingsOpen"
      context="home"
      @close="settingsOpen = false"
    />
  </div>
</template>
