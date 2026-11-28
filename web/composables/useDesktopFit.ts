export const HOME_DESIGN_WIDTH = 1400
export const MAP_HEADER_DESIGN_WIDTH = 1280

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

let listenerAttached = false

/**
 * Shared viewport scaler so compact/mobile web viewports fit the composed
 * desktop website layout edge to edge without altering >= 1280px desktop.
 */
export function useDesktopFit() {
  const viewportW = useState<number>('ascend-fit-vw', () => 1440)
  const viewportH = useState<number>('ascend-fit-vh', () => 900)
  const fitReady = useState<boolean>('ascend-fit-ready', () => false)

  const measure = () => {
    if (!import.meta.client) return
    const w = document.documentElement.clientWidth || window.innerWidth || 1440
    const h = window.innerHeight || document.documentElement.clientHeight || 900
    viewportW.value = w
    viewportH.value = h
    fitReady.value = true

    const zoom = w < 1280 ? clamp(w / HOME_DESIGN_WIDTH, 0.22, 1) : 1
    document.documentElement.style.setProperty('--ascend-home-zoom', zoom.toFixed(5))
  }

  onMounted(() => {
    measure()
    if (!listenerAttached && import.meta.client) {
      listenerAttached = true
      window.addEventListener('resize', measure, { passive: true })
    }
  })

  const isCompact = computed(() => fitReady.value && viewportW.value < 1280)

  const homeZoom = computed(() =>
    isCompact.value ? clamp(viewportW.value / HOME_DESIGN_WIDTH, 0.22, 1) : 1,
  )

  const homeStickyHeightPx = computed(() =>
    isCompact.value ? Math.ceil(viewportH.value / homeZoom.value) : null,
  )

  const homeStorySectionHeightPx = computed(() =>
    isCompact.value ? Math.ceil((viewportH.value * 3.1) / homeZoom.value) : null,
  )

  const homePortalSectionHeightPx = computed(() =>
    isCompact.value ? Math.ceil((viewportH.value * 1.75) / homeZoom.value) : null,
  )

  const mapHeaderZoom = computed(() =>
    isCompact.value ? clamp((viewportW.value - 16) / MAP_HEADER_DESIGN_WIDTH, 0.26, 1) : 1,
  )

  const mapPanelZoom = computed(() =>
    isCompact.value
      ? clamp(Math.min(viewportW.value / 860, viewportH.value / 760), 0.36, 0.92)
      : 1,
  )

  const mapTopOffsetPx = computed(() =>
    isCompact.value ? Math.round(10 + 58 * mapHeaderZoom.value + 10) : 84,
  )

  const mapBottomOffsetPx = computed(() =>
    isCompact.value ? Math.max(18, Math.round(30 * mapPanelZoom.value)) : 34,
  )

  const loaderZoom = computed(() =>
    isCompact.value ? clamp(viewportW.value / 1180, 0.28, 1) : 1,
  )

  return {
    viewportW,
    viewportH,
    fitReady,
    isCompact,
    homeZoom,
    homeStickyHeightPx,
    homeStorySectionHeightPx,
    homePortalSectionHeightPx,
    mapHeaderZoom,
    mapPanelZoom,
    mapTopOffsetPx,
    mapBottomOffsetPx,
    loaderZoom,
    HOME_DESIGN_WIDTH,
    MAP_HEADER_DESIGN_WIDTH,
  }
}
