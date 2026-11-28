export const HOME_DESIGN_WIDTH = 1400
export const MAP_HEADER_DESIGN_WIDTH = 1280
export const LOADER_DESIGN_WIDTH = 1180

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
      window.addEventListener('orientationchange', measure, { passive: true })
    }
  })

  const isCompact = computed(() => fitReady.value && viewportW.value < 1280)

  const homeZoom = computed(() =>
    isCompact.value ? clamp(viewportW.value / HOME_DESIGN_WIDTH, 0.22, 1) : 1,
  )

  const isTallCompact = computed(() =>
    isCompact.value && viewportH.value / homeZoom.value > 960,
  )

  const homeStickyHeightPx = computed(() =>
    isCompact.value ? Math.min(Math.ceil(viewportH.value / homeZoom.value), 860) : null,
  )

  const homeStorySectionHeightPx = computed(() => {
    if (!isCompact.value || !homeStickyHeightPx.value) return null
    return isTallCompact.value
      ? Math.round(homeStickyHeightPx.value * 2.2)
      : Math.ceil((viewportH.value * 2.6) / homeZoom.value)
  })

  const homePortalSectionHeightPx = computed(() => {
    if (!isCompact.value || !homeStickyHeightPx.value) return null
    return isTallCompact.value
      ? Math.round(homeStickyHeightPx.value * 1.45)
      : Math.ceil((viewportH.value * 1.65) / homeZoom.value)
  })

  const homeBackgroundOverlapPx = computed(() => (isCompact.value ? 0 : null))

  const homeBackgroundPadTopPx = computed(() => (isCompact.value ? 56 : null))

  const homeSolutionOverlapPx = computed(() => (isCompact.value ? 0 : null))

  const homeSolutionPadTopPx = computed(() => (isCompact.value ? 48 : null))

  const mapHeaderTopPx = computed(() => (isCompact.value ? 8 : 12))

  const mapEdgeInsetPx = computed(() => (isCompact.value ? 10 : 16))

  const mapHeaderZoom = computed(() =>
    isCompact.value ? clamp((viewportW.value - 16) / MAP_HEADER_DESIGN_WIDTH, 0.26, 1) : 1,
  )

  const mapPanelZoom = computed(() =>
    isCompact.value
      ? clamp(Math.min(viewportW.value / 860, viewportH.value / 820), 0.36, 0.92)
      : 1,
  )

  const mapTopOffsetPx = computed(() =>
    isCompact.value ? Math.round(mapHeaderTopPx.value + 60 * mapHeaderZoom.value + 10) : 84,
  )

  const mapBottomOffsetPx = computed(() =>
    isCompact.value ? Math.max(20, Math.round(30 * mapPanelZoom.value)) : 34,
  )

  const mapRightDockWidthPx = computed(() => Math.round(402 * mapPanelZoom.value))

  const mapRightDockInnerHeightPx = computed(() =>
    isCompact.value
      ? Math.ceil(Math.max(220, viewportH.value - mapTopOffsetPx.value - mapBottomOffsetPx.value) / mapPanelZoom.value)
      : null,
  )

  const loaderZoom = computed(() =>
    isCompact.value ? clamp(viewportW.value / LOADER_DESIGN_WIDTH, 0.28, 1) : 1,
  )

  return {
    viewportW,
    viewportH,
    fitReady,
    isCompact,
    isTallCompact,
    homeZoom,
    homeStickyHeightPx,
    homeStorySectionHeightPx,
    homePortalSectionHeightPx,
    homeBackgroundOverlapPx,
    homeBackgroundPadTopPx,
    homeSolutionOverlapPx,
    homeSolutionPadTopPx,
    mapHeaderTopPx,
    mapEdgeInsetPx,
    mapHeaderZoom,
    mapPanelZoom,
    mapTopOffsetPx,
    mapBottomOffsetPx,
    mapRightDockWidthPx,
    mapRightDockInnerHeightPx,
    loaderZoom,
    HOME_DESIGN_WIDTH,
    MAP_HEADER_DESIGN_WIDTH,
    LOADER_DESIGN_WIDTH,
  }
}
