<script setup lang="ts">
import {
  AlertTriangle,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUp,
  CircleDot,
  Coffee,
  Compass,
  Equal,
  Info,
  Layers,
  Loader2,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  UtensilsCrossed,
  X,
} from 'lucide-vue-next'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { InfoModalTab } from '~/components/home/HomeInfoModal.vue'
import type { MapThemeMode } from '~/composables/useAscendSettings'
import type { AreaFeature, AreaLabel, AreaName, Confidence } from '~/types/areas'
import {
  MAP_LABEL_COPY,
  MAP_PATTERN_IDS,
  ROUTE_TARGET_X_ICON_ID,
  computeFeatureCentroid,
  findNeighborH3Ids,
  findUserCoverageFeature,
  haversineKm,
  registerMapFillPatterns,
  registerRouteTargetXIcon,
} from '~/utils/mapPatterns'
import {
  buildReachCirclePolygon,
  fetchApproximateIpLocation,
  fetchRealtimeRoute,
  type RouteResult,
  type TravelMode,
} from '~/utils/mapRouting'
import { HOME_COPY } from '~/utils/uiCopy'

type RightTab = 'area' | 'shortlist' | 'ask'
type MapStyleId = 'dark' | 'bright' | 'bw' | 'satellite'
type MapDataLayerId = 'labels' | 'supply' | 'demand' | 'gap' | 'confidence'
type RegionFilter =
  | { kind: 'all' }
  | { kind: 'zone'; id: AreaName; label: string }
  | { kind: 'district'; name: string }

interface DataLayerOption {
  id: MapDataLayerId
  title: string
  shortTitle: string
  subtitle: string
  legendTitle: string
  accent: string
}

const mapDataLayerOptions: DataLayerOption[] = [
  {
    id: 'labels',
    title: 'Market Room',
    shortTitle: 'Market Room',
    subtitle: 'Opportunity, Fair, Crowded & Low demand labels',
    legendTitle: 'MAP LABELS',
    accent: '#10B981',
  },
  {
    id: 'supply',
    title: 'Active Shops',
    shortTitle: 'Active Shops',
    subtitle: 'Open coffee shops counted within ~500 m',
    legendTitle: 'ACTIVE SHOPS',
    accent: '#EA580C',
  },
  {
    id: 'demand',
    title: 'Local Demand',
    shortTitle: 'Local Demand',
    subtitle: 'Shops typical neighborhood demand supports',
    legendTitle: 'LOCAL DEMAND',
    accent: '#14B8A6',
  },
  {
    id: 'gap',
    title: 'Room Balance',
    shortTitle: 'Room Balance',
    subtitle: 'Expected demand minus active shops nearby',
    legendTitle: 'ROOM BALANCE',
    accent: '#00E5A8',
  },
  {
    id: 'confidence',
    title: 'Data Confidence',
    shortTitle: 'Confidence',
    subtitle: 'Normal vs low open-map data coverage',
    legendTitle: 'CONFIDENCE',
    accent: '#F59E0B',
  },
]

function buildSatelliteStyleSpec(): import('maplibre-gl').StyleSpecification {
  return {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Esri, Maxar, Earthstar Geographics',
      },
      'esri-roads': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
      },
      'esri-labels': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'satellite-imagery',
        type: 'raster',
        source: 'esri-satellite',
        paint: {
          'raster-brightness-max': 0.92,
          'raster-contrast': 0.08,
          'raster-saturation': -0.05,
        },
      },
      {
        id: 'satellite-roads',
        type: 'raster',
        source: 'esri-roads',
        paint: {
          'raster-opacity': 0.85,
        },
      },
      {
        id: 'satellite-labels',
        type: 'raster',
        source: 'esri-labels',
        paint: {
          'raster-opacity': 0.95,
        },
      },
    ],
  }
}

function resolveMapStyle(id: MapStyleId): string | import('maplibre-gl').StyleSpecification {
  if (id === 'bright') return 'https://tiles.openfreemap.org/styles/liberty'
  if (id === 'bw') return 'https://tiles.openfreemap.org/styles/positron'
  if (id === 'satellite') return buildSatelliteStyleSpec()
  return 'https://tiles.openfreemap.org/styles/dark'
}

const mapStyleOptions: Array<{
  id: MapStyleId
  label: string
  hint: string
}> = [
  { id: 'dark', label: 'Dark', hint: 'Calm obsidian night map' },
  { id: 'bright', label: 'Colorful', hint: 'Bright colorful streets' },
  { id: 'bw', label: 'Minimal B&W', hint: 'Monochrome light map' },
  { id: 'satellite', label: 'Satellite', hint: 'Real aerial imagery & roads' },
]

const BANDUNG_CENTER: [number, number] = [107.6191, -6.9175]
const BANDUNG_ZOOM = 11.8

const { meta, areas, loading, error, dataVersionLabel, loadAll } = useAscendData()
const shortlist = useShortlist()
const mapTransition = useMapTransition()
const settings = useAscendSettings()

const localizedLayerOptions = computed<DataLayerOption[]>(() => {
  if (!settings.isId.value) return mapDataLayerOptions
  return [
    {
      id: 'labels',
      title: 'Ruang Pasar',
      shortTitle: 'Ruang Pasar',
      subtitle: 'Label Peluang, Seimbang, Padat & Permintaan rendah',
      legendTitle: 'LABEL PETA',
      accent: '#10B981',
    },
    {
      id: 'supply',
      title: 'Kedai Aktif',
      shortTitle: 'Kedai Aktif',
      subtitle: 'Jumlah kedai kopi aktif dalam radius ~500 m',
      legendTitle: 'KEDAI AKTIF',
      accent: '#EA580C',
    },
    {
      id: 'demand',
      title: 'Permintaan Lokal',
      shortTitle: 'Permintaan',
      subtitle: 'Kapasitas kedai yang ditopang permintaan sekitar',
      legendTitle: 'PERMINTAAN LOKAL',
      accent: '#14B8A6',
    },
    {
      id: 'gap',
      title: 'Selisih Ruang',
      shortTitle: 'Selisih Ruang',
      subtitle: 'Kapasitas permintaan dikurangi kedai aktif sekitar',
      legendTitle: 'SELISIH RUANG',
      accent: '#00E5A8',
    },
    {
      id: 'confidence',
      title: 'Keyakinan Data',
      shortTitle: 'Keyakinan',
      subtitle: 'Cakupan data peta terbuka normal vs rendah',
      legendTitle: 'KEYAKINAN DATA',
      accent: '#F59E0B',
    },
  ]
})

const localizedStyleOptions = computed(() =>
  settings.isId.value
    ? [
        { id: 'dark' as const, label: 'Gelap', hint: 'Peta malam obsidian tenang' },
        { id: 'bright' as const, label: 'Berwarna', hint: 'Jalan terang penuh warna' },
        { id: 'bw' as const, label: 'Monokrom', hint: 'Peta terang hitam putih' },
        { id: 'satellite' as const, label: 'Satelit', hint: 'Citra udara asli & jalan' },
      ]
    : mapStyleOptions,
)

interface UserLocationState {
  lng: number
  lat: number
  accuracy: number
  source: 'gps' | 'ip'
  cityLabel: string | null
  inCoverage: boolean
  kecamatan: string | null
  nearestFeature: AreaFeature | null
  distanceKm: number
}

const mapContainer = ref<HTMLElement | null>(null)
const selectedFeature = ref<AreaFeature | null>(null)

useHead({
  title: computed(() => {
    const area = selectedFeature.value?.properties.kecamatan
    if (area) return `${area} · Ascend`
    return settings.t('Map · Ascend', 'Peta Peluang · Ascend')
  }),
})
const hoveredInfo = ref<{
  kecamatan: string
  label: AreaLabel
  actual: number
  actual_k1: number
  expected_k1: number
  gap: number
  confidence: Confidence
  x: number
  y: number
} | null>(null)

const viewportW = ref<number>(1440)
const viewportH = ref<number>(900)

// Map visual variant + 3D extruded buildings state
const mapStyleId = ref<MapStyleId>('dark')
const is3DMode = ref<boolean>(false)
const stylePickerOpen = ref<boolean>(false)
const stylePickerAnchor = ref<HTMLElement | null>(null)

// Top Navbar Search + PRD Kawasan (Region) Filter + Data Layers Switcher
const activeLayerId = ref<MapDataLayerId>('labels')
const layerPickerOpen = ref<boolean>(false)
const layerPickerAnchor = ref<HTMLElement | null>(null)

const activeRegion = ref<RegionFilter>({ kind: 'all' })
const regionPickerOpen = ref<boolean>(false)
const regionPickerAnchor = ref<HTMLElement | null>(null)
const regionFilterQuery = ref<string>('')

const searchQuery = ref<string>('')
const searchDropdownOpen = ref<boolean>(false)
const compactSearchOpen = ref<boolean>(false)
const searchAnchor = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const compactSearchInputRef = ref<HTMLInputElement | null>(null)

const activeLayerMeta = computed<DataLayerOption>(
  () => localizedLayerOptions.value.find(opt => opt.id === activeLayerId.value) ?? localizedLayerOptions.value[0]!,
)

const settingsOpen = ref<boolean>(false)
const hoveredLegendTip = ref<AreaLabel | 'low_confidence' | null>(null)

const isLightBasemap = computed(() => mapStyleId.value === 'bright' || mapStyleId.value === 'bw')
const isSatelliteBasemap = computed(() => mapStyleId.value === 'satellite')

function handleMapThemeChanged(nextTheme: MapThemeMode) {
  if (nextTheme === 'light' && mapStyleId.value === 'dark') {
    switchMapStyle('bright')
  } else if (nextTheme === 'dark' && (mapStyleId.value === 'bright' || mapStyleId.value === 'bw')) {
    switchMapStyle('dark')
  }
}

watch(settings.showNeighborRing, () => {
  applyMapFiltersAndSelection()
})

watch(settings.showHoverPreview, (allowed) => {
  if (!allowed) hoveredInfo.value = null
})

// Default to AREA tab even before any hexagon is selected (matches wireframe)
const rightTab = ref<RightTab>('area')
const drawerOpen = ref<boolean>(true)
const legendCollapsed = ref<boolean>(false)
const activeLabelFilter = ref<AreaLabel | null>(null)
const infoOpen = ref<boolean>(false)
const infoTab = ref<InfoModalTab>('labels')
const goodToKnowOpen = ref<boolean>(false)
const goodToKnowAnchor = ref<HTMLElement | null>(null)
const limitNotice = ref<boolean>(false)
const rentNotice = ref<boolean>(false)
let rentNoticeTimer: ReturnType<typeof setTimeout> | null = null

// Live user geolocation state (device position only; never hijacks hexagon selection)
const userLocation = ref<UserLocationState | null>(null)
const locating = ref<boolean>(false)
const locationBanner = ref<{
  kind: 'info' | 'outside' | 'error'
  title: string
  body: string
} | null>(null)
let locationBannerTimer: ReturnType<typeof setTimeout> | null = null
let locateGuardTimer: ReturnType<typeof setTimeout> | null = null

// Real-time street routing & walking reach state + animated explorer comet
const routeVisible = ref<boolean>(false)
const routeLoading = ref<boolean>(false)
const travelMode = ref<TravelMode>('walking')
const routesByMode = ref<Partial<Record<TravelMode, RouteResult>>>({})
let routeRequestSeq = 0
let routeAnimRafId: number | null = null
let routeDashTick = 0

let mapInstance: import('maplibre-gl').Map | null = null
let maplibreLib: typeof import('maplibre-gl') | null = null

const legendLabels: AreaLabel[] = ['opportunity', 'fair', 'crowded', 'not_enough_demand']

interface RegionSummaryItem {
  name: string
  zone: AreaName
  count: number
  oppCount: number
  bounds: [[number, number], [number, number]]
}

function computeFeaturesBounds(feats: AreaFeature[]): [[number, number], [number, number]] | null {
  if (feats.length === 0) return null
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  for (const f of feats) {
    const ring = f.geometry.coordinates[0]
    if (!ring) continue
    for (const pt of ring) {
      const lng = pt[0]
      const lat = pt[1]
      if (typeof lng !== 'number' || typeof lat !== 'number') continue
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
  }
  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return null
  return [[minLng, minLat], [maxLng, maxLat]]
}

// PRD US-002 Study Zones derived dynamically from loaded dataset (kota_bandung & telkom_area)
const studyZoneOptions = computed(() => {
  const feats = areas.value?.features ?? []
  const kotaFeats = feats.filter(f => f.properties.area_name === 'kota_bandung')
  const telkomFeats = feats.filter(f => f.properties.area_name === 'telkom_area')

  return [
    {
      id: 'all' as const,
      label: 'All Areas',
      subtitle: 'Full study coverage',
      count: feats.length,
      oppCount: feats.filter(f => f.properties.label === 'opportunity').length,
    },
    {
      id: 'kota_bandung' as const,
      label: 'Kota Bandung',
      subtitle: '30 urban districts',
      count: kotaFeats.length,
      oppCount: kotaFeats.filter(f => f.properties.label === 'opportunity').length,
    },
    {
      id: 'telkom_area' as const,
      label: 'Telkom University Area',
      subtitle: 'Dayeuhkolot & Bojongsoang',
      count: telkomFeats.length,
      oppCount: telkomFeats.filter(f => f.properties.label === 'opportunity').length,
    },
  ]
})

// All official districts (kecamatan) aggregated cleanly with bounding boxes & Opportunity counts
const districtOptions = computed<RegionSummaryItem[]>(() => {
  const feats = areas.value?.features ?? []
  const grouped = new Map<string, AreaFeature[]>()
  for (const f of feats) {
    const kec = f.properties.kecamatan?.trim()
    if (!kec) continue
    const arr = grouped.get(kec)
    if (arr) arr.push(f)
    else grouped.set(kec, [f])
  }
  const items: RegionSummaryItem[] = []
  for (const [name, list] of grouped.entries()) {
    const bounds = computeFeaturesBounds(list)
    if (!bounds) continue
    items.push({
      name,
      zone: list[0]?.properties.area_name ?? 'kota_bandung',
      count: list.length,
      oppCount: list.filter(f => f.properties.label === 'opportunity').length,
      bounds,
    })
  }
  return items.sort((a, b) => a.name.localeCompare(b.name))
})

const filteredDistrictOptions = computed(() => {
  const q = regionFilterQuery.value.trim().toLowerCase()
  if (!q) return districtOptions.value
  return districtOptions.value.filter(d => d.name.toLowerCase().includes(q))
})

const activeRegionLabel = computed(() => {
  const r = activeRegion.value
  if (r.kind === 'all') return settings.t('All Areas', 'Semua Area')
  if (r.kind === 'zone') return r.id === 'telkom_area' ? settings.t('Telkom Area', 'Area Telkom') : 'Kota Bandung'
  return r.name
})

const confidenceCounts = computed(() => {
  const feats = areas.value?.features ?? []
  let low = 0
  for (const f of feats) {
    if (f.properties.confidence === 'low') low++
  }
  return { normal: Math.max(0, feats.length - low), low }
})

// Live Search Results (Matches Study Zones, Districts, Opportunity labels, and plain-English demand drivers; ZERO H3 jargon!)
const topOpportunitySpots = computed<AreaFeature[]>(() => {
  const feats = areas.value?.features ?? []
  return [...feats]
    .filter(f => f.properties.label === 'opportunity' && Boolean(f.properties.kecamatan))
    .sort((a, b) => b.properties.gap - a.properties.gap)
    .slice(0, 4)
})

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    const popularNames = ['Coblong', 'Dayeuhkolot', 'Bojongsoang', 'Bandung Wetan', 'Lengkong', 'Gedebage']
    const popularDistricts = popularNames
      .map(name => districtOptions.value.find(d => d.name === name))
      .filter((d): d is RegionSummaryItem => Boolean(d))
    return {
      isEmptyQuery: true,
      zones: studyZoneOptions.value.slice(1),
      districts: popularDistricts,
      spots: topOpportunitySpots.value,
    }
  }

  const zones = studyZoneOptions.value
    .slice(1)
    .filter(z => z.label.toLowerCase().includes(q) || z.subtitle.toLowerCase().includes(q))

  const districts = districtOptions.value
    .filter(d => d.name.toLowerCase().includes(q))
    .slice(0, 6)

  const feats = areas.value?.features ?? []
  const spots = feats
    .filter((f) => {
      const kec = (f.properties.kecamatan ?? '').toLowerCase()
      const lbl = MAP_LABEL_COPY[f.properties.label].title.toLowerCase()
      const driverHit = f.properties.factors.some(fac => fac.text.toLowerCase().includes(q))
      return kec.includes(q) || lbl.includes(q) || driverHit
    })
    .sort((a, b) => {
      const oppScore = (f: AreaFeature) => (f.properties.label === 'opportunity' ? 2 : f.properties.label === 'fair' ? 1 : 0)
      const diff = oppScore(b) - oppScore(a)
      if (diff !== 0) return diff
      return b.properties.gap - a.properties.gap
    })
    .slice(0, 6)

  return {
    isEmptyQuery: false,
    zones,
    districts,
    spots,
  }
})

const hasAnySearchMatch = computed(() => {
  const r = searchResults.value
  return r.zones.length > 0 || r.districts.length > 0 || r.spots.length > 0
})

function buildRegionMatchExpression(): unknown[] | null {
  const r = activeRegion.value
  if (r.kind === 'zone') return ['==', ['get', 'area_name'], r.id]
  if (r.kind === 'district') return ['==', ['get', 'kecamatan'], r.name]
  return null
}

function buildCombinedHighlightCondition(activeLabel: AreaLabel | null): unknown[] | null {
  const regionCond = buildRegionMatchExpression()
  const labelCond = activeLayerId.value === 'labels' && activeLabel
    ? ['==', ['get', 'label'], activeLabel]
    : null

  if (regionCond && labelCond) return ['all', regionCond, labelCond]
  return regionCond ?? labelCond
}

function buildMetricFillColorExpression(layerId: Exclude<MapDataLayerId, 'labels'>) {
  if (layerId === 'supply') {
    return [
      'interpolate',
      ['linear'],
      ['get', 'actual_k1'],
      0,
      '#1B3B3A',
      3,
      '#CA8A04',
      10,
      '#EA580C',
      24,
      '#EF4444',
      45,
      '#B91C1C',
    ]
  }
  if (layerId === 'demand') {
    return [
      'interpolate',
      ['linear'],
      ['get', 'expected_k1'],
      0,
      '#1E293B',
      2,
      '#0F766E',
      6,
      '#14B8A6',
      16,
      '#10B981',
      34,
      '#00E5A8',
    ]
  }
  if (layerId === 'gap') {
    return [
      'interpolate',
      ['linear'],
      ['get', 'gap'],
      -10,
      '#DC2626',
      -3,
      '#F87171',
      -0.5,
      '#D97706',
      0.5,
      '#64748B',
      2.5,
      '#14B8A6',
      6,
      '#00E5A8',
    ]
  }
  // confidence
  return [
    'match',
    ['get', 'confidence'],
    'low',
    '#F59E0B',
    '#14B8A6',
  ]
}

function buildRimColorExpression(layerId: MapDataLayerId) {
  if (layerId === 'labels') {
    return [
      'match',
      ['get', 'label'],
      'opportunity',
      '#10B981',
      'fair',
      '#B87D1B',
      'crowded',
      '#EF4444',
      '#94A3B8',
    ]
  }
  return buildMetricFillColorExpression(layerId)
}

function buildMetricOpacityExpression() {
  const light = isLightBasemap.value
  const sat = isSatelliteBasemap.value
  const d3 = is3DMode.value
  const cond = buildCombinedHighlightCondition(null)
  const isConf = activeLayerId.value === 'confidence'

  const z11Hi = d3 ? (sat ? 0.46 : 0.48) : (sat ? 0.36 : (light ? 0.42 : 0.44))
  const z14Hi = d3 ? (sat ? 0.36 : 0.38) : (sat ? 0.25 : (light ? 0.3 : 0.32))
  const z16Hi = d3 ? (sat ? 0.28 : 0.3) : (sat ? 0.18 : (light ? 0.22 : 0.24))

  if (isConf) {
    const z11Val = ['case', ['==', ['get', 'confidence'], 'low'], d3 ? 0.7 : (sat ? 0.56 : 0.62), d3 ? 0.28 : (sat ? 0.16 : 0.2)]
    const z14Val = ['case', ['==', ['get', 'confidence'], 'low'], d3 ? 0.58 : (sat ? 0.44 : 0.5), d3 ? 0.22 : (sat ? 0.12 : 0.15)]
    if (cond) {
      return [
        'interpolate',
        ['linear'],
        ['zoom'],
        11.5,
        ['case', cond, z11Val, 0.04],
        14.5,
        ['case', cond, z14Val, 0.03],
      ]
    }
    return ['interpolate', ['linear'], ['zoom'], 11.5, z11Val, 14.5, z14Val]
  }

  if (cond) {
    return [
      'interpolate',
      ['linear'],
      ['zoom'],
      11.5,
      ['case', cond, z11Hi, 0.04],
      13.8,
      ['case', cond, z14Hi, 0.03],
      15.5,
      ['case', cond, z16Hi, 0.02],
    ]
  }

  return ['interpolate', ['linear'], ['zoom'], 11.5, z11Hi, 13.8, z14Hi, 15.5, z16Hi]
}

function selectRegionFilter(next: RegionFilter) {
  activeRegion.value = next
  regionPickerOpen.value = false
  regionFilterQuery.value = ''
  applyMapFiltersAndSelection()

  if (!mapInstance || !areas.value) return
  if (next.kind === 'all') {
    const allBounds = computeFeaturesBounds(areas.value.features)
    if (allBounds) {
      mapInstance.fitBounds(allBounds, {
        padding: getCameraPadding(),
        maxZoom: 12.2,
        duration: 720,
      })
    } else {
      resetMapView()
    }
    return
  }

  const matchedFeats = areas.value.features.filter((f) => {
    if (next.kind === 'zone') return f.properties.area_name === next.id
    return f.properties.kecamatan === next.name
  })
  const bounds = computeFeaturesBounds(matchedFeats)
  if (bounds) {
    mapInstance.fitBounds(bounds, {
      padding: getCameraPadding(),
      maxZoom: next.kind === 'district' ? 14.3 : 12.7,
      duration: 760,
    })
  }
}

function selectDataLayer(nextId: MapDataLayerId) {
  activeLayerId.value = nextId
  layerPickerOpen.value = false
  if (nextId !== 'labels') {
    activeLabelFilter.value = null
  }
  applyMapFiltersAndSelection()
}

function handleSearchPickZone(zoneId: AreaName, label: string) {
  searchDropdownOpen.value = false
  compactSearchOpen.value = false
  searchQuery.value = ''
  selectRegionFilter({ kind: 'zone', id: zoneId, label })
}

function handleSearchPickDistrict(name: string) {
  searchDropdownOpen.value = false
  compactSearchOpen.value = false
  searchQuery.value = ''
  selectRegionFilter({ kind: 'district', name })
}

function handleSearchPickSpot(feat: AreaFeature) {
  searchDropdownOpen.value = false
  compactSearchOpen.value = false
  searchQuery.value = ''
  // Clear region filter if it excludes this spot so the chosen spot shines at full brightness
  const r = activeRegion.value
  if (
    (r.kind === 'zone' && feat.properties.area_name !== r.id)
    || (r.kind === 'district' && feat.properties.kecamatan !== r.name)
  ) {
    activeRegion.value = { kind: 'all' }
  }
  selectArea(feat, true)
}

function handleSearchEnter() {
  const r = searchResults.value
  if (r.zones.length > 0 && !r.isEmptyQuery) {
    const z = r.zones[0]!
    if (z.id !== 'all') {
      handleSearchPickZone(z.id, z.label)
      return
    }
  }
  if (r.districts.length > 0) {
    handleSearchPickDistrict(r.districts[0]!.name)
    return
  }
  if (r.spots.length > 0) {
    handleSearchPickSpot(r.spots[0]!)
  }
}

function toggleCompactSearch() {
  compactSearchOpen.value = !compactSearchOpen.value
  regionPickerOpen.value = false
  layerPickerOpen.value = false
  goodToKnowOpen.value = false
  if (compactSearchOpen.value) {
    nextTick(() => compactSearchInputRef.value?.focus())
  }
}

// Dynamically pick 4 representative real study features across all 4 labels for quick exploration
const quickPicks = computed<AreaFeature[]>(() => {
  const feats = areas.value?.features ?? []
  if (feats.length === 0) return []
  const picks: AreaFeature[] = []

  const opp = [...feats]
    .filter(f => f.properties.label === 'opportunity' && Boolean(f.properties.kecamatan))
    .sort((a, b) => b.properties.gap - a.properties.gap)[0]
    ?? feats.find(f => f.properties.label === 'opportunity')
  if (opp) picks.push(opp)

  const fair = feats.find(
    f => f.properties.label === 'fair' && f.properties.actual_k1 >= 4 && Boolean(f.properties.kecamatan),
  ) ?? feats.find(f => f.properties.label === 'fair')
  if (fair) picks.push(fair)

  const crowded = [...feats]
    .filter(f => f.properties.label === 'crowded' && Boolean(f.properties.kecamatan))
    .sort((a, b) => a.properties.gap - b.properties.gap)[0]
    ?? feats.find(f => f.properties.label === 'crowded')
  if (crowded) picks.push(crowded)

  const lowDemand = feats.find(
    f => f.properties.label === 'not_enough_demand' && f.properties.confidence === 'low' && Boolean(f.properties.kecamatan),
  ) ?? feats.find(f => f.properties.label === 'not_enough_demand')
  if (lowDemand) picks.push(lowDemand)

  return picks
})

const selectedSaved = computed(() =>
  selectedFeature.value ? shortlist.isSaved(selectedFeature.value.properties.h3) : false,
)

const selectedDistanceKm = computed<number | null>(() => {
  if (!userLocation.value || !selectedFeature.value) return null
  if (
    userLocation.value.inCoverage
    && userLocation.value.nearestFeature?.properties.h3 === selectedFeature.value.properties.h3
  ) {
    return 0
  }
  const center = computeFeatureCentroid(selectedFeature.value)
  return haversineKm([userLocation.value.lng, userLocation.value.lat], center)
})

function buildFillOpacityExpression(active: AreaLabel | null) {
  const light = isLightBasemap.value
  const sat = isSatelliteBasemap.value
  const d3 = is3DMode.value
  const highlightCond = buildCombinedHighlightCondition(active)

  if (highlightCond) {
    const z11Norm = d3 ? 0.54 : (sat ? 0.38 : (light ? 0.42 : 0.46))
    const z11Low = d3 ? 0.32 : (sat ? 0.22 : 0.24)
    const z14Norm = d3 ? 0.42 : (sat ? 0.28 : (light ? 0.3 : 0.34))
    const z14Low = d3 ? 0.24 : (sat ? 0.16 : 0.18)
    const z16Norm = d3 ? 0.34 : (sat ? 0.22 : (light ? 0.22 : 0.26))
    const z16Low = d3 ? 0.19 : (sat ? 0.12 : 0.14)
    return [
      'interpolate',
      ['linear'],
      ['zoom'],
      11.5,
      [
        'case',
        highlightCond,
        ['case', ['==', ['get', 'confidence'], 'low'], z11Low, z11Norm],
        0.04,
      ],
      13.8,
      [
        'case',
        highlightCond,
        ['case', ['==', ['get', 'confidence'], 'low'], z14Low, z14Norm],
        0.03,
      ],
      15.5,
      [
        'case',
        highlightCond,
        ['case', ['==', ['get', 'confidence'], 'low'], z16Low, z16Norm],
        0.02,
      ],
    ]
  }

  // Calm in 2D; noticeably bolder and crisper in 3D mode (including 3D + Satellite!) so hexagons stand out over buildings
  const z11Norm = d3 ? (sat ? 0.38 : 0.4) : (sat ? 0.26 : (light ? 0.3 : 0.3))
  const z11Low = d3 ? (sat ? 0.22 : 0.24) : (sat ? 0.14 : 0.16)
  const z14Norm = d3 ? (sat ? 0.3 : 0.32) : (sat ? 0.2 : (light ? 0.22 : 0.22))
  const z14Low = d3 ? (sat ? 0.17 : 0.19) : (sat ? 0.11 : 0.13)
  const z16Norm = d3 ? (sat ? 0.24 : 0.25) : (sat ? 0.15 : (light ? 0.16 : 0.17))
  const z16Low = d3 ? (sat ? 0.14 : 0.15) : (sat ? 0.08 : 0.1)

  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    11.5,
    ['case', ['==', ['get', 'confidence'], 'low'], z11Low, z11Norm],
    13.8,
    ['case', ['==', ['get', 'confidence'], 'low'], z14Low, z14Norm],
    15.5,
    ['case', ['==', ['get', 'confidence'], 'low'], z16Low, z16Norm],
  ]
}

// Fluid bounded scale for left controls rail & bottom-left MAP LABELS filter on resized windows
// (Maintains a comfortable minimum floor so buttons & text never become too small)
const leftRailScale = computed(() => {
  const byHeight = Math.min(1, Math.max(0.76, (viewportH.value - 90) / 680))
  const byWidth = Math.min(1, Math.max(0.82, viewportW.value / 1120))
  return Number(Math.min(byHeight, byWidth).toFixed(3))
})

const legendScale = computed(() => {
  const byHeight = Math.min(1, Math.max(0.76, (viewportH.value - 80) / 700))
  const byWidth = Math.min(1, Math.max(0.78, viewportW.value / 1080))
  return Number(Math.min(byHeight, byWidth).toFixed(3))
})

function getCameraPadding() {
  const compactSheet = drawerOpen.value && viewportW.value < 1024
  return {
    top: viewportW.value < 1024 ? 62 : 84,
    bottom: compactSheet ? Math.min(390, Math.max(255, Math.round(viewportH.value * 0.47))) : 74,
    left: viewportW.value < 1024 ? 54 : 68,
    right: drawerOpen.value && viewportW.value >= 1024 ? 428 : 28,
  }
}

function getRouteBoundsPadding() {
  const compactSheet = drawerOpen.value && viewportW.value < 1024
  const legendPad = !legendCollapsed.value && viewportW.value >= 1024 ? 296 : 74
  return {
    top: viewportW.value < 1024 ? 76 : 108,
    bottom: compactSheet ? Math.min(400, Math.max(265, Math.round(viewportH.value * 0.48))) : 120,
    left: legendPad,
    right: drawerOpen.value && viewportW.value >= 1024 ? 444 : 44,
  }
}

function applyMapFiltersAndSelection() {
  if (!mapInstance) return

  // 1. Toggle between Patterned Market Room layer & Dynamic Metric Choropleth layer
  const active = activeLabelFilter.value
  const layerId = activeLayerId.value
  const isPatternMode = layerId === 'labels'
  const highlightCond = buildCombinedHighlightCondition(active)

  if (mapInstance.getLayer('areas-fill')) {
    mapInstance.setLayoutProperty('areas-fill', 'visibility', isPatternMode ? 'visible' : 'none')
    if (isPatternMode) {
      mapInstance.setPaintProperty(
        'areas-fill',
        'fill-opacity',
        buildFillOpacityExpression(active),
      )
    }
  }

  if (mapInstance.getLayer('areas-metric-fill')) {
    mapInstance.setLayoutProperty('areas-metric-fill', 'visibility', isPatternMode ? 'none' : 'visible')
    if (!isPatternMode) {
      mapInstance.setPaintProperty(
        'areas-metric-fill',
        'fill-color',
        buildMetricFillColorExpression(layerId),
      )
      mapInstance.setPaintProperty(
        'areas-metric-fill',
        'fill-opacity',
        buildMetricOpacityExpression(),
      )
    }
  }

  if (mapInstance.getLayer('areas-color-rim')) {
    mapInstance.setPaintProperty('areas-color-rim', 'line-color', buildRimColorExpression(layerId))
    mapInstance.setPaintProperty(
      'areas-color-rim',
      'line-width',
      is3DMode.value
        ? ['interpolate', ['linear'], ['zoom'], 11, 2.2, 15.5, 3.4]
        : ['interpolate', ['linear'], ['zoom'], 11, 1.15, 15.5, 1.9],
    )
    const baseRimOpacity = is3DMode.value
      ? (isSatelliteBasemap.value ? 0.92 : 0.86)
      : (isSatelliteBasemap.value ? 0.68 : (isLightBasemap.value ? 0.54 : 0.26))
    if (highlightCond) {
      mapInstance.setPaintProperty('areas-color-rim', 'line-opacity', [
        'case',
        highlightCond,
        is3DMode.value ? 0.95 : 0.82,
        0.08,
      ])
    } else {
      mapInstance.setPaintProperty('areas-color-rim', 'line-opacity', baseRimOpacity)
    }
  }

  if (mapInstance.getLayer('areas-outline')) {
    mapInstance.setPaintProperty(
      'areas-outline',
      'line-width',
      is3DMode.value
        ? ['interpolate', ['linear'], ['zoom'], 11, 1.3, 15.5, 2.1]
        : ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15.5, 1.15],
    )
    mapInstance.setPaintProperty(
      'areas-outline',
      'line-opacity',
      is3DMode.value
        ? (isSatelliteBasemap.value ? 0.78 : (isLightBasemap.value ? 0.72 : 0.85))
        : (isSatelliteBasemap.value ? 0.5 : (isLightBasemap.value ? 0.58 : 0.9)),
    )
  }

  // 2. Update selected hexagon & exact 6-neighbor ~500 m ring (respecting Settings toggle!)
  const sel = selectedFeature.value
  if (mapInstance.getLayer('areas-selected')) {
    mapInstance.setFilter('areas-selected', [
      '==',
      ['get', 'h3'],
      sel ? sel.properties.h3 : '',
    ])
  }
  if (mapInstance.getLayer('areas-selected-halo')) {
    mapInstance.setFilter('areas-selected-halo', [
      '==',
      ['get', 'h3'],
      sel ? sel.properties.h3 : '',
    ])
  }

  if (mapInstance.getLayer('areas-neighbors')) {
    if (sel && areas.value && settings.showNeighborRing.value) {
      const neighborIds = findNeighborH3Ids(sel, areas.value.features)
      mapInstance.setFilter('areas-neighbors', [
        'in',
        ['get', 'h3'],
        ['literal', neighborIds],
      ])
    } else {
      mapInstance.setFilter('areas-neighbors', ['in', ['get', 'h3'], ['literal', []]])
    }
  }
}

function stopRouteAnimation() {
  if (routeAnimRafId !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(routeAnimRafId)
    routeAnimRafId = null
  }
}

function interpolateAlongLine(coords: [number, number][], fraction: number): [number, number] {
  if (coords.length === 0) return BANDUNG_CENTER
  if (coords.length === 1 || fraction <= 0) return coords[0]!
  if (fraction >= 1) return coords[coords.length - 1]!

  const segLens: number[] = []
  let total = 0
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i]!
    const b = coords[i + 1]!
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    segLens.push(len)
    total += len
  }
  if (total <= 0) return coords[0]!

  let target = fraction * total
  for (let i = 0; i < segLens.length; i++) {
    const l = segLens[i]!
    if (target <= l || i === segLens.length - 1) {
      const t = l > 0 ? Math.max(0, Math.min(1, target / l)) : 0
      const a = coords[i]!
      const b = coords[i + 1]!
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    }
    target -= l
  }
  return coords[coords.length - 1]!
}

// Smooth forward-flowing marching dash sequence pointing toward the X destination
const DASH_SEQUENCE: number[][] = [
  [0, 1.8, 2.6],
  [0.5, 1.8, 2.1],
  [1.0, 1.8, 1.6],
  [1.5, 1.8, 1.1],
  [2.0, 1.8, 0.6],
  [2.5, 1.8, 0.1],
  [2.6, 1.4, 0, 0.4],
  [2.6, 0.9, 0, 0.9],
  [2.6, 0.4, 0, 1.4],
]

function startRouteAnimation(coords: [number, number][]) {
  stopRouteAnimation()
  if (typeof window === 'undefined' || coords.length < 2) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return

  const startTs = performance.now()
  let lastDashTs = startTs

  const tick = (now: number) => {
    if (!mapInstance || !routeVisible.value) {
      routeAnimRafId = null
      return
    }

    // 1. Animate traveling explorer comet orb flowing from user pin -> destination X (2.6s cycle)
    const cometSrc = mapInstance.getSource('route-comet') as import('maplibre-gl').GeoJSONSource | undefined
    if (cometSrc) {
      const phase = ((now - startTs) % 2600) / 2600
      // Smooth ease-in-out glide along the street route
      const eased = phase < 0.5 ? 2 * phase * phase : 1 - Math.pow(-2 * phase + 2, 2) / 2
      const pt = interpolateAlongLine(coords, eased)
      cometSrc.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: pt },
            properties: { t: eased },
          },
        ],
      })
    }

    // 2. Step directional marching dashes forward toward destination X (~14 fps smooth pulse)
    if (now - lastDashTs >= 72 && mapInstance.getLayer('route-line-dash')) {
      lastDashTs = now
      routeDashTick = (routeDashTick + 1) % DASH_SEQUENCE.length
      try {
        mapInstance.setPaintProperty('route-line-dash', 'line-dasharray', DASH_SEQUENCE[routeDashTick])
      } catch {
        // Ignore transient style swaps
      }
    }

    routeAnimRafId = window.requestAnimationFrame(tick)
  }

  routeAnimRafId = window.requestAnimationFrame(tick)
}

function syncRouteAndReachOnMap() {
  if (!mapInstance) return
  const routeSrc = mapInstance.getSource('route-line') as import('maplibre-gl').GeoJSONSource | undefined
  const cometSrc = mapInstance.getSource('route-comet') as import('maplibre-gl').GeoJSONSource | undefined
  const reachSrc = mapInstance.getSource('reach-rings') as import('maplibre-gl').GeoJSONSource | undefined
  const activeRoute = routesByMode.value[travelMode.value]

  if (routeSrc) {
    if (routeVisible.value && activeRoute && selectedFeature.value) {
      const dest = computeFeatureCentroid(selectedFeature.value)
      routeSrc.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: activeRoute.coordinates,
            },
            properties: { kind: 'path' },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: dest,
            },
            properties: { kind: 'dest' },
          },
        ],
      })
      startRouteAnimation(activeRoute.coordinates)
    } else {
      stopRouteAnimation()
      routeSrc.setData({ type: 'FeatureCollection', features: [] })
      cometSrc?.setData({ type: 'FeatureCollection', features: [] })
    }
  }

  if (reachSrc) {
    if (routeVisible.value && selectedFeature.value) {
      const dest = computeFeatureCentroid(selectedFeature.value)
      reachSrc.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [buildReachCirclePolygon(dest, 800)],
            },
            properties: { ring: '10m' },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [buildReachCirclePolygon(dest, 400)],
            },
            properties: { ring: '5m' },
          },
        ],
      })
    } else {
      reachSrc.setData({ type: 'FeatureCollection', features: [] })
    }
  }
}

async function computeRoutesForSelectedArea(modes: TravelMode[], fitCamera = false) {
  if (!userLocation.value || !selectedFeature.value) return
  const seq = ++routeRequestSeq
  const from: [number, number] = [userLocation.value.lng, userLocation.value.lat]
  const to = computeFeatureCentroid(selectedFeature.value)

  routeLoading.value = true
  try {
    const results = await Promise.all(
      modes.map(async (m) => {
        const existing = routesByMode.value[m]
        if (existing) return existing
        return await fetchRealtimeRoute(from, to, m)
      }),
    )
    if (seq !== routeRequestSeq) return
    const next = { ...routesByMode.value }
    for (const r of results) {
      next[r.mode] = r
    }
    routesByMode.value = next
    syncRouteAndReachOnMap()

    if (fitCamera && routeVisible.value && mapInstance && maplibreLib) {
      const chosen = next[travelMode.value]
      const bounds = new maplibreLib.LngLatBounds()
      bounds.extend(from)
      bounds.extend(to)
      if (chosen) {
        for (const pt of chosen.coordinates) {
          bounds.extend(pt)
        }
      }
      mapInstance.fitBounds(bounds, {
        padding: getRouteBoundsPadding(),
        maxZoom: 15.2,
        duration: 750,
      })
    }
  } finally {
    if (seq === routeRequestSeq) {
      routeLoading.value = false
    }
  }
}

function handleToggleRoute() {
  if (!userLocation.value || !selectedFeature.value) return
  routeVisible.value = !routeVisible.value
  if (routeVisible.value) {
    computeRoutesForSelectedArea([travelMode.value, 'walking', 'driving'], true)
  } else {
    syncRouteAndReachOnMap()
  }
}

function handleSelectTravelMode(mode: TravelMode) {
  travelMode.value = mode
  if (!userLocation.value || !selectedFeature.value) return
  routeVisible.value = true
  computeRoutesForSelectedArea([mode], true)
}

function selectArea(feature: AreaFeature | null, fly = true) {
  selectedFeature.value = feature
  limitNotice.value = false
  hoveredInfo.value = null
  routesByMode.value = {}
  routeRequestSeq += 1

  if (feature) {
    rightTab.value = 'area'
    drawerOpen.value = true
    if (fly && mapInstance) {
      const center = computeFeatureCentroid(feature)
      mapInstance.flyTo({
        center,
        zoom: Math.max(mapInstance.getZoom(), 15.1),
        padding: getCameraPadding(),
        duration: 720,
        essential: true,
      })
    }
    if (userLocation.value) {
      // Preload live walking & driving distance cards immediately
      computeRoutesForSelectedArea(['walking', 'driving'], false)
    }
  } else {
    // Stay on Area tab showing the clean empty selection state and clear active route
    rightTab.value = 'area'
    routeVisible.value = false
  }

  applyMapFiltersAndSelection()
  syncRouteAndReachOnMap()
}

function syncUserLocationOnMap() {
  if (!mapInstance) return
  const src = mapInstance.getSource('user-location') as import('maplibre-gl').GeoJSONSource | undefined
  if (!src) return
  if (userLocation.value) {
    src.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [userLocation.value.lng, userLocation.value.lat],
          },
          properties: {},
        },
      ],
    })
  } else {
    src.setData({ type: 'FeatureCollection', features: [] })
  }
}

function showTransientLocationBanner(
  kind: 'info' | 'outside' | 'error',
  title: string,
  body: string,
  autoDismissMs?: number,
) {
  if (locationBannerTimer) {
    clearTimeout(locationBannerTimer)
    locationBannerTimer = null
  }
  locationBanner.value = { kind, title, body }
  if (autoDismissMs) {
    locationBannerTimer = setTimeout(() => {
      locationBanner.value = null
    }, autoDismissMs)
  }
}

function applyResolvedUserPosition(
  lng: number,
  lat: number,
  accuracy: number,
  source: 'gps' | 'ip',
  cityLabel: string | null,
  autoShowRoute: boolean,
) {
  const feats = areas.value?.features ?? []
  const match = findUserCoverageFeature(lng, lat, feats)

  userLocation.value = {
    lng,
    lat,
    accuracy,
    source,
    cityLabel,
    inCoverage: Boolean(match.containing),
    kecamatan: match.containing?.properties.kecamatan ?? null,
    nearestFeature: match.nearest,
    distanceKm: match.distanceKm,
  }
  syncUserLocationOnMap()

  // Strictly pinpoint & center on the user's own device position (never hijacks hexagon selection!)
  if (autoShowRoute && selectedFeature.value) {
    routeVisible.value = true
    computeRoutesForSelectedArea([travelMode.value, 'walking', 'driving'], true)
    showTransientLocationBanner(
      'info',
      source === 'ip' ? 'Approximate device position' : 'Device position locked',
      'Showing live street route from your position to this area.',
      3800,
    )
    return
  }

  mapInstance?.flyTo({
    center: [lng, lat],
    zoom: source === 'ip' ? 12.6 : 14.6,
    padding: getCameraPadding(),
    duration: 750,
    essential: true,
  })

  if (selectedFeature.value) {
    computeRoutesForSelectedArea(['walking', 'driving'], false)
  }

  if (match.containing) {
    showTransientLocationBanner(
      'info',
      `Your position · ${match.containing.properties.kecamatan || 'Mapped area'}`,
      source === 'ip'
        ? 'Approximate device location shown. Click any hexagon to see live street routes from here.'
        : 'Device GPS pin active. Click any hexagon to check distance & live street routes.',
      4500,
    )
  } else {
    const kmText =
      match.distanceKm < 1
        ? `${Math.round(match.distanceKm * 1000)} m`
        : `${match.distanceKm < 10 ? match.distanceKm.toFixed(1) : Math.round(match.distanceKm)} km`
    const citySuffix = cityLabel ? ` (${cityLabel})` : ''
    showTransientLocationBanner(
      'outside',
      `Your position${citySuffix} · ~${kmText} from coverage`,
      'Showing your device pin. Jump back to the mapped coverage area anytime to inspect coffee shop signals & routes.',
    )
  }
}

async function resolveWithIpFallback(autoShowRoute: boolean, reasonPrefix?: string) {
  const ipLoc = await fetchApproximateIpLocation()
  locating.value = false
  if (locateGuardTimer) {
    clearTimeout(locateGuardTimer)
    locateGuardTimer = null
  }
  if (ipLoc) {
    applyResolvedUserPosition(ipLoc.lng, ipLoc.lat, 1200, 'ip', ipLoc.city, autoShowRoute)
  } else {
    showTransientLocationBanner(
      'error',
      'Location unavailable',
      reasonPrefix ?? 'Could not determine your device position. Please check browser location permissions.',
      5500,
    )
  }
}

function locateUserPosition(autoShowRoute = false) {
  if (locating.value) return
  locating.value = true

  // Hard 5.5s safety guard guarantees the spinner can NEVER get stuck loading forever!
  let settled = false
  if (locateGuardTimer) clearTimeout(locateGuardTimer)
  locateGuardTimer = setTimeout(() => {
    if (!settled) {
      settled = true
      resolveWithIpFallback(autoShowRoute)
    }
  }, 5500)

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    settled = true
    resolveWithIpFallback(autoShowRoute, 'Browser geolocation is not supported on this device.')
    return
  }

  // Stage 1: Fast OS/Wi-Fi device geolocation (responds <500ms on Windows/Mac/Mobile without stalling!)
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (settled) return
      settled = true
      locating.value = false
      if (locateGuardTimer) {
        clearTimeout(locateGuardTimer)
        locateGuardTimer = null
      }
      applyResolvedUserPosition(
        pos.coords.longitude,
        pos.coords.latitude,
        pos.coords.accuracy,
        'gps',
        null,
        autoShowRoute,
      )

      // Stage 2: Silent background high-accuracy GPS refinement if coarse (> 150m)
      if (pos.coords.accuracy > 150) {
        navigator.geolocation.getCurrentPosition(
          (hiPos) => {
            if (hiPos.coords.accuracy < pos.coords.accuracy) {
              const feats = areas.value?.features ?? []
              const match = findUserCoverageFeature(hiPos.coords.longitude, hiPos.coords.latitude, feats)
              userLocation.value = {
                lng: hiPos.coords.longitude,
                lat: hiPos.coords.latitude,
                accuracy: hiPos.coords.accuracy,
                source: 'gps',
                cityLabel: null,
                inCoverage: Boolean(match.containing),
                kecamatan: match.containing?.properties.kecamatan ?? null,
                nearestFeature: match.nearest,
                distanceKm: match.distanceKm,
              }
              syncUserLocationOnMap()
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 },
        )
      }
    },
    (err) => {
      if (settled) return
      settled = true
      if (err.code === err.PERMISSION_DENIED) {
        locating.value = false
        if (locateGuardTimer) {
          clearTimeout(locateGuardTimer)
          locateGuardTimer = null
        }
        showTransientLocationBanner(
          'error',
          'Location permission declined',
          'Allow location access in your browser, or use approximate device IP location below.',
        )
      } else {
        // Automatically fall back to device IP geolocation when desktop OS location services fail/timeout!
        resolveWithIpFallback(autoShowRoute)
      }
    },
    { enableHighAccuracy: false, timeout: 4500, maximumAge: 60000 },
  )
}

function flyToUserPin() {
  if (!userLocation.value || !mapInstance) return
  mapInstance.flyTo({
    center: [userLocation.value.lng, userLocation.value.lat],
    zoom: 14.4,
    padding: getCameraPadding(),
    duration: 700,
  })
}

function flyToNearestCoverageArea() {
  const nearest = userLocation.value?.nearestFeature
  if (!nearest) return
  locationBanner.value = null
  selectArea(nearest, true)
}

function switchMapStyle(nextId: MapStyleId) {
  stylePickerOpen.value = false
  if (!mapInstance) return
  if (mapStyleId.value === nextId) return

  mapStyleId.value = nextId
  stopRouteAnimation()

  mapInstance.once('style.load', () => {
    if (mapInstance) {
      mountAscendLayers(mapInstance)
      apply3DCameraAndBuildings()
    }
  })
  mapInstance.setStyle(resolveMapStyle(nextId))
}

function toggle3DMode() {
  if (!mapInstance) return
  is3DMode.value = !is3DMode.value
  apply3DCameraAndBuildings()
  applyMapFiltersAndSelection()
}

function apply3DCameraAndBuildings() {
  if (!mapInstance) return
  const map = mapInstance

  if (is3DMode.value) {
    // Sleek non-clashing extruded 3D buildings cleanly above translucent glass hexes & below crisp rims
    if (!isSatelliteBasemap.value && !map.getLayer('ascend-3d-buildings')) {
      const styleLayers = map.getStyle()?.layers ?? []
      const bldgLayer = styleLayers.find(
        l => l.id.toLowerCase().includes('building') && 'source' in l && Boolean((l as { source?: string }).source),
      ) as { source?: string; 'source-layer'?: string } | undefined
      const bldgSource = bldgLayer?.source ?? 'openmaptiles'
      const bldgSourceLayer = bldgLayer?.['source-layer'] ?? 'building'

      if (map.getSource(bldgSource)) {
        try {
          map.addLayer(
            {
              id: 'ascend-3d-buildings',
              type: 'fill-extrusion',
              source: bldgSource,
              'source-layer': bldgSourceLayer,
              minzoom: 13.0,
              paint: {
                'fill-extrusion-color': isLightBasemap.value
                  ? ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 10], 0, '#CBD5E1', 35, '#94A3B8']
                  : ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 10], 0, '#1A2332', 35, '#2C3B50'],
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  13.0,
                  0,
                  14.1,
                  ['coalesce', ['get', 'render_height'], 10],
                ],
                'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
                'fill-extrusion-opacity': isLightBasemap.value ? 0.44 : 0.46,
              },
            },
            map.getLayer('areas-color-rim') ? 'areas-color-rim' : undefined,
          )
        } catch {
          // Safely ignore if current style source lacks building extrusion layer
        }
      }
    }

    map.easeTo({
      pitch: isSatelliteBasemap.value ? 52 : 56,
      bearing: map.getBearing() === 0 ? -18 : map.getBearing(),
      zoom: Math.max(map.getZoom(), 14.5),
      duration: 750,
    })
  } else {
    if (map.getLayer('ascend-3d-buildings')) {
      try {
        map.removeLayer('ascend-3d-buildings')
      } catch {
        // Ignore
      }
    }
    map.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 600,
    })
  }
}

function toggleLabelFilter(label: AreaLabel) {
  activeLabelFilter.value = activeLabelFilter.value === label ? null : label
  applyMapFiltersAndSelection()
}

function spotlightOpportunities() {
  activeLayerId.value = 'labels'
  activeLabelFilter.value = 'opportunity'
  applyMapFiltersAndSelection()
  const opp = quickPicks.value.find(f => f.properties.label === 'opportunity')
  if (opp) {
    selectArea(opp, true)
  }
}

function flyToShortlist(h3: string, center: [number, number]) {
  if (areas.value) {
    const matched = areas.value.features.find(f => f.properties.h3 === h3) ?? null
    if (matched) {
      selectArea(matched, true)
      return
    }
  }
  mapInstance?.flyTo({
    center,
    zoom: 15.1,
    padding: getCameraPadding(),
    duration: 720,
  })
}

function handleToggleShortlist() {
  if (!selectedFeature.value) return
  const props = selectedFeature.value.properties
  const res = shortlist.toggle({
    h3: props.h3,
    kecamatan: props.kecamatan,
    label: props.label,
    actual_k1: props.actual_k1,
    expected_k1: props.expected_k1,
    center: computeFeatureCentroid(selectedFeature.value),
  })
  limitNotice.value = res.limitReached
}

function zoomInMap() {
  mapInstance?.zoomIn({ duration: 240 })
}

function zoomOutMap() {
  mapInstance?.zoomOut({ duration: 240 })
}

function resetMapView() {
  activeLabelFilter.value = null
  activeRegion.value = { kind: 'all' }
  applyMapFiltersAndSelection()
  mapInstance?.flyTo({
    center: BANDUNG_CENTER,
    zoom: BANDUNG_ZOOM,
    pitch: is3DMode.value ? 45 : 0,
    bearing: 0,
    padding: getCameraPadding(),
    duration: 650,
  })
}

function triggerRentNotice() {
  rentNotice.value = true
  if (rentNoticeTimer) clearTimeout(rentNoticeTimer)
  rentNoticeTimer = setTimeout(() => {
    rentNotice.value = false
  }, 3200)
}

function openShortlistTab() {
  rightTab.value = 'shortlist'
  drawerOpen.value = true
}

function openAskTab() {
  rightTab.value = 'ask'
  drawerOpen.value = true
}

function mountAscendLayers(map: import('maplibre-gl').Map) {
  if (!areas.value) return
  const light = isLightBasemap.value
  const sat = isSatelliteBasemap.value

  registerMapFillPatterns(map)
  registerRouteTargetXIcon(map)

  // Calm, refined dark obsidian basemap (Loconomics-inspired restraint: zero noisy bright streets!)
  if (!light && !sat) {
    const styleLayers = map.getStyle()?.layers ?? []
    const isRoadLayerId = (id: string) => {
      const lid = id.toLowerCase()
      return (
        lid.includes('motorway')
        || lid.includes('trunk')
        || lid.includes('primary')
        || lid.includes('secondary')
        || lid.includes('tertiary')
        || lid.includes('road')
        || lid.includes('highway')
        || lid.includes('street')
        || lid.includes('bridge')
        || lid.includes('tunnel')
      )
    }

    for (const layer of styleLayers) {
      try {
        const lid = layer.id.toLowerCase()
        if (layer.type === 'background') {
          map.setPaintProperty(layer.id, 'background-color', '#0B0F16')
        } else if (layer.type === 'fill') {
          if (lid.includes('building')) {
            map.setPaintProperty(layer.id, 'fill-color', '#151B26')
            map.setPaintProperty(layer.id, 'fill-outline-color', '#1F2937')
            map.setPaintProperty(layer.id, 'fill-opacity', 0.74)
          } else if (lid.includes('water')) {
            map.setPaintProperty(layer.id, 'fill-color', '#122738')
          } else if (lid.includes('park') || lid.includes('wood') || lid.includes('grass') || lid.includes('green')) {
            map.setPaintProperty(layer.id, 'fill-color', '#111C1B')
          }
        } else if (layer.type === 'line') {
          if (isRoadLayerId(layer.id)) {
            if (lid.includes('casing')) {
              map.setPaintProperty(layer.id, 'line-color', '#090D14')
              map.setPaintProperty(layer.id, 'line-opacity', 0.65)
            } else if (lid.includes('motorway') || lid.includes('trunk') || lid.includes('primary')) {
              map.setPaintProperty(layer.id, 'line-color', '#4C5B6E')
              map.setPaintProperty(layer.id, 'line-opacity', 0.78)
            } else if (lid.includes('secondary') || lid.includes('tertiary')) {
              map.setPaintProperty(layer.id, 'line-color', '#2E3A4A')
              map.setPaintProperty(layer.id, 'line-opacity', 0.68)
            } else {
              map.setPaintProperty(layer.id, 'line-color', '#1F2835')
              map.setPaintProperty(layer.id, 'line-opacity', 0.55)
            }
          } else if (lid.includes('waterway')) {
            map.setPaintProperty(layer.id, 'line-color', '#1B4058')
            map.setPaintProperty(layer.id, 'line-opacity', 0.72)
          }
        } else if (layer.type === 'symbol') {
          if ((layer.layout as Record<string, unknown> | undefined)?.['text-field']) {
            if (lid.includes('poi')) {
              map.setPaintProperty(layer.id, 'text-color', '#B4C6BF')
              map.setPaintProperty(layer.id, 'text-halo-color', 'rgba(8, 12, 18, 0.92)')
              map.setPaintProperty(layer.id, 'text-halo-width', 1.4)
            } else {
              map.setPaintProperty(layer.id, 'text-color', '#CBD5E1')
              map.setPaintProperty(layer.id, 'text-halo-color', 'rgba(8, 12, 18, 0.92)')
              map.setPaintProperty(layer.id, 'text-halo-width', 1.6)
              map.setPaintProperty(layer.id, 'text-halo-blur', 0.3)
            }
          }
        }
      } catch {
        // Safely skip any style layer that uses incompatible paint expressions
      }
    }
  }

  if (!map.getSource('areas')) {
    map.addSource('areas', {
      type: 'geojson',
      data: areas.value as unknown as import('maplibre-gl').GeoJSONSourceSpecification['data'],
      promoteId: 'h3',
    })
  }
  if (!map.getSource('user-location')) {
    map.addSource('user-location', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }
  if (!map.getSource('reach-rings')) {
    map.addSource('reach-rings', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }
  if (!map.getSource('route-line')) {
    map.addSource('route-line', {
      type: 'geojson',
      lineMetrics: true,
      data: { type: 'FeatureCollection', features: [] },
    })
  }
  if (!map.getSource('route-comet')) {
    map.addSource('route-comet', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }

  // 1a. TOP-LAYER translucent colorblind-safe patterned hexagon fill (Market Room default layer)
  map.addLayer({
    id: 'areas-fill',
    type: 'fill',
    source: 'areas',
    layout: {
      visibility: activeLayerId.value === 'labels' ? 'visible' : 'none',
    },
    paint: {
      'fill-pattern': [
        'match',
        ['get', 'label'],
        'opportunity',
        MAP_PATTERN_IDS.opportunity,
        'fair',
        MAP_PATTERN_IDS.fair,
        'crowded',
        MAP_PATTERN_IDS.crowded,
        MAP_PATTERN_IDS.not_enough_demand,
      ],
      'fill-opacity': buildFillOpacityExpression(activeLabelFilter.value) as unknown as number,
    },
  })

  // 1b. Dynamic Metric Choropleth Fill (Active Shops | Local Demand | Room Balance | Data Confidence)
  map.addLayer({
    id: 'areas-metric-fill',
    type: 'fill',
    source: 'areas',
    layout: {
      visibility: activeLayerId.value === 'labels' ? 'none' : 'visible',
    },
    paint: {
      'fill-color': (activeLayerId.value === 'labels'
        ? buildMetricFillColorExpression('demand')
        : buildMetricFillColorExpression(activeLayerId.value)) as unknown as string,
      'fill-opacity': buildMetricOpacityExpression() as unknown as number,
    },
  })

  // 2. Refined label-colored glass rim (harmonizes cleanly in calm Dark, Satellite, Light, & 3D modes)
  map.addLayer({
    id: 'areas-color-rim',
    type: 'line',
    source: 'areas',
    filter: ['!=', ['get', 'confidence'], 'low'],
    paint: {
      'line-color': [
        'match',
        ['get', 'label'],
        'opportunity',
        '#10B981',
        'fair',
        '#B87D1B',
        'crowded',
        '#EF4444',
        '#94A3B8',
      ],
      'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.15, 15.5, 1.9],
      'line-opacity': sat ? 0.62 : (is3DMode.value ? 0.44 : (light ? 0.5 : 0.24)),
    },
  })

  // 3. Normal-confidence crisp subtle hexagon border
  map.addLayer({
    id: 'areas-outline',
    type: 'line',
    source: 'areas',
    filter: ['!=', ['get', 'confidence'], 'low'],
    paint: {
      'line-color': sat ? '#F8FAFC' : (light ? '#334155' : 'rgba(203, 213, 225, 0.25)'),
      'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15.5, 1.15],
      'line-opacity': sat ? 0.46 : (light ? 0.58 : 0.9),
    },
  })

  // 4. Low-confidence crisp dashed outline
  map.addLayer({
    id: 'areas-outline-low',
    type: 'line',
    source: 'areas',
    filter: ['==', ['get', 'confidence'], 'low'],
    paint: {
      'line-color': light ? '#475569' : '#CBD5E1',
      'line-width': 1.15,
      'line-dasharray': [3, 2],
      'line-opacity': 0.72,
    },
  })

  // 5. Exact 6-neighbor ~500 m counting ring outline around selected hexagon
  map.addLayer({
    id: 'areas-neighbors',
    type: 'line',
    source: 'areas',
    filter: ['in', ['get', 'h3'], ['literal', []]],
    paint: {
      'line-color': light ? '#0F172A' : '#F8FAFC',
      'line-width': 1.85,
      'line-dasharray': [3, 2.5],
      'line-opacity': 0.85,
    },
  })

  // 6. Hover outline cue
  map.addLayer({
    id: 'areas-hover',
    type: 'line',
    source: 'areas',
    filter: ['==', ['get', 'h3'], ''],
    paint: {
      'line-color': light ? '#0F172A' : '#F8FAFC',
      'line-width': 2.2,
      'line-opacity': 0.88,
    },
  })

  // 7. Selected hexagon crisp unbroken outline
  map.addLayer({
    id: 'areas-selected-halo',
    type: 'line',
    source: 'areas',
    filter: ['==', ['get', 'h3'], ''],
    paint: {
      'line-color': light ? '#FFFFFF' : '#090D12',
      'line-width': 5.4,
      'line-opacity': 0.82,
    },
  })

  map.addLayer({
    id: 'areas-selected',
    type: 'line',
    source: 'areas',
    filter: ['==', ['get', 'h3'], ''],
    paint: {
      'line-color': light ? '#0F172A' : '#FFFFFF',
      'line-width': 3.2,
    },
  })

  // 8. Real-time Walking Reach Rings (5-min ~400m & 10-min ~800m around selected hexagon)
  map.addLayer({
    id: 'reach-ring-10m',
    type: 'line',
    source: 'reach-rings',
    filter: ['==', ['get', 'ring'], '10m'],
    paint: {
      'line-color': '#14B8A6',
      'line-width': 1.8,
      'line-dasharray': [4, 4],
      'line-opacity': 0.72,
    },
  })

  map.addLayer({
    id: 'reach-ring-5m',
    type: 'line',
    source: 'reach-rings',
    filter: ['==', ['get', 'ring'], '5m'],
    paint: {
      'line-color': '#F59E0B',
      'line-width': 2.1,
      'line-dasharray': [3, 2.5],
      'line-opacity': 0.88,
    },
  })

  // 9. Animated Treasure-Hunt Route Trail (Teal -> Mint -> Neon -> Amber glow + marching dashes + explorer comet + glowing X destination!)
  map.addLayer({
    id: 'route-line-glow',
    type: 'line',
    source: 'route-line',
    filter: ['==', ['get', 'kind'], 'path'],
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-gradient': [
        'interpolate',
        ['linear'],
        ['line-progress'],
        0,
        '#14B8A6',
        0.45,
        '#10B981',
        0.82,
        '#00E5A8',
        1,
        '#FBBF24',
      ],
      'line-width': 12,
      'line-blur': 5.5,
      'line-opacity': 0.5,
    },
  })

  map.addLayer({
    id: 'route-line-casing',
    type: 'line',
    source: 'route-line',
    filter: ['==', ['get', 'kind'], 'path'],
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': light ? '#FFFFFF' : '#071018',
      'line-width': 6.0,
      'line-opacity': light ? 0.88 : 0.74,
    },
  })

  map.addLayer({
    id: 'route-line-gradient-core',
    type: 'line',
    source: 'route-line',
    filter: ['==', ['get', 'kind'], 'path'],
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-gradient': [
        'interpolate',
        ['linear'],
        ['line-progress'],
        0,
        '#14B8A6',
        0.48,
        '#10B981',
        0.84,
        '#00E5A8',
        1,
        '#FBBF24',
      ],
      'line-width': 2.3,
      'line-opacity': 0.58,
    },
  })

  map.addLayer({
    id: 'route-line-dash',
    type: 'line',
    source: 'route-line',
    filter: ['==', ['get', 'kind'], 'path'],
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#00E5A8',
      'line-width': 3.5,
      'line-dasharray': [0, 1.8, 2.6],
    },
  })

  map.addLayer({
    id: 'route-comet-halo',
    type: 'circle',
    source: 'route-comet',
    paint: {
      'circle-radius': 13,
      'circle-color': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 't'], 0],
        0,
        '#00E5A8',
        0.78,
        '#34D399',
        1,
        '#FBBF24',
      ],
      'circle-blur': 0.65,
      'circle-opacity': 0.78,
    },
  })

  map.addLayer({
    id: 'route-comet-dot',
    type: 'circle',
    source: 'route-comet',
    paint: {
      'circle-radius': 4.8,
      'circle-color': '#FFFFFF',
      'circle-stroke-width': 2.4,
      'circle-stroke-color': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 't'], 0],
        0,
        '#00E5A8',
        0.8,
        '#10B981',
        1,
        '#F59E0B',
      ],
    },
  })

  map.addLayer({
    id: 'route-dest-x',
    type: 'symbol',
    source: 'route-line',
    filter: ['==', ['get', 'kind'], 'dest'],
    layout: {
      'icon-image': ROUTE_TARGET_X_ICON_ID,
      'icon-size': 1.08,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  })

  // 10. Live user device GPS marker (halo + crisp mint dot at the very top)
  map.addLayer({
    id: 'user-location-halo',
    type: 'circle',
    source: 'user-location',
    paint: {
      'circle-radius': 18,
      'circle-color': '#10B981',
      'circle-opacity': 0.24,
      'circle-stroke-width': 1.6,
      'circle-stroke-color': '#34D399',
      'circle-stroke-opacity': 0.65,
    },
  })

  map.addLayer({
    id: 'user-location-dot',
    type: 'circle',
    source: 'user-location',
    paint: {
      'circle-radius': 6.5,
      'circle-color': '#00E5A8',
      'circle-stroke-width': 2.5,
      'circle-stroke-color': '#FFFFFF',
    },
  })

  applyMapFiltersAndSelection()
  syncUserLocationOnMap()
  syncRouteAndReachOnMap()
}

async function initMap() {
  if (!mapContainer.value || !areas.value) return
  const maplibregl = await import('maplibre-gl')
  maplibreLib = maplibregl

  if (mapInstance) {
    stopRouteAnimation()
    mapInstance.remove()
    mapInstance = null
  }

  const map = new maplibregl.Map({
    container: mapContainer.value,
    style: resolveMapStyle(mapStyleId.value),
    center: BANDUNG_CENTER,
    zoom: BANDUNG_ZOOM,
    minZoom: 10.2,
    maxZoom: 17.5,
    maxPitch: 62,
    attributionControl: false,
    canvasContextAttributes: { antialias: true },
  })

  let mapReadyNotified = false
  let mapReadyFallbackTimer: ReturnType<typeof setTimeout> | null = null
  const signalMapPainted = () => {
    if (mapReadyNotified) return
    mapReadyNotified = true
    if (mapReadyFallbackTimer) {
      clearTimeout(mapReadyFallbackTimer)
      mapReadyFallbackTimer = null
    }
    mapTransition.notifyMapReady()
  }

  map.on('load', () => {
    mountAscendLayers(map)
    if (is3DMode.value) {
      apply3DCameraAndBuildings()
    }
    // Wait until initial vector tiles + all 1,976 Bandung hexagons have painted onto the canvas
    map.once('idle', () => {
      window.requestAnimationFrame(() => signalMapPainted())
    })
    mapReadyFallbackTimer = setTimeout(() => signalMapPainted(), 3800)
  })

  const onAreaMouseMove = (e: import('maplibre-gl').MapLayerMouseEvent) => {
    map.getCanvas().style.cursor = 'pointer'
    const feat = e.features?.[0]
    if (!feat) return
    const h3 = String(feat.properties?.h3 ?? '')
    if (map.getLayer('areas-hover')) {
      map.setFilter('areas-hover', ['==', ['get', 'h3'], h3])
    }
    if (!settings.showHoverPreview.value) {
      hoveredInfo.value = null
      return
    }
    const lbl = (feat.properties?.label as AreaLabel) ?? 'fair'
    const kec = feat.properties?.kecamatan ? String(feat.properties.kecamatan) : settings.t('Unnamed area', 'Area tanpa nama')
    const conf = (feat.properties?.confidence as Confidence) === 'low' ? 'low' : 'normal'
    hoveredInfo.value = {
      kecamatan: kec,
      label: lbl,
      actual: Number(feat.properties?.actual ?? 0),
      actual_k1: Number(feat.properties?.actual_k1 ?? 0),
      expected_k1: Number(feat.properties?.expected_k1 ?? 0),
      gap: Number(feat.properties?.gap ?? 0),
      confidence: conf,
      x: e.point.x,
      y: e.point.y,
    }
  }

  const onAreaMouseLeave = () => {
    map.getCanvas().style.cursor = ''
    hoveredInfo.value = null
    if (map.getLayer('areas-hover')) {
      map.setFilter('areas-hover', ['==', ['get', 'h3'], ''])
    }
  }

  const onAreaClick = (e: import('maplibre-gl').MapLayerMouseEvent) => {
    const feat = e.features?.[0]
    if (!feat || !areas.value) return
    const h3 = String(feat.properties?.h3 ?? '')
    const matched = areas.value.features.find(f => f.properties.h3 === h3) ?? null
    // Honor Settings toggle for automatic zoom-in on selection
    selectArea(matched, settings.autoZoomOnSelect.value)
  }

  for (const hitLayer of ['areas-fill', 'areas-metric-fill'] as const) {
    map.on('mousemove', hitLayer, onAreaMouseMove)
    map.on('mouseleave', hitLayer, onAreaMouseLeave)
    map.on('click', hitLayer, onAreaClick)
  }

  map.on('click', (e) => {
    const queryLayers = ['areas-fill', 'areas-metric-fill'].filter(id => Boolean(map.getLayer(id)))
    if (queryLayers.length === 0) return
    const hits = map.queryRenderedFeatures(e.point, { layers: queryLayers })
    if (hits.length === 0) {
      selectArea(null, false)
    }
  })

  mapInstance = map
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (searchDropdownOpen.value || compactSearchOpen.value) {
      searchDropdownOpen.value = false
      compactSearchOpen.value = false
      return
    }
    if (regionPickerOpen.value) {
      regionPickerOpen.value = false
      return
    }
    if (layerPickerOpen.value) {
      layerPickerOpen.value = false
      return
    }
    if (stylePickerOpen.value) {
      stylePickerOpen.value = false
      return
    }
    if (goodToKnowOpen.value) {
      goodToKnowOpen.value = false
      return
    }
    if (!infoOpen.value && selectedFeature.value) {
      selectArea(null, false)
    }
  }
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as Node | null
  if (!target) return
  if (goodToKnowOpen.value && goodToKnowAnchor.value && !goodToKnowAnchor.value.contains(target)) {
    goodToKnowOpen.value = false
  }
  if (stylePickerOpen.value && stylePickerAnchor.value && !stylePickerAnchor.value.contains(target)) {
    stylePickerOpen.value = false
  }
  if (regionPickerOpen.value && regionPickerAnchor.value && !regionPickerAnchor.value.contains(target)) {
    regionPickerOpen.value = false
  }
  if (layerPickerOpen.value && layerPickerAnchor.value && !layerPickerAnchor.value.contains(target)) {
    layerPickerOpen.value = false
  }
  if ((searchDropdownOpen.value || compactSearchOpen.value) && searchAnchor.value && !searchAnchor.value.contains(target)) {
    searchDropdownOpen.value = false
    compactSearchOpen.value = false
  }
}

function openAboutModal(tab: InfoModalTab = 'labels') {
  goodToKnowOpen.value = false
  infoTab.value = tab
  infoOpen.value = true
}

async function retryLoad() {
  await loadAll('coffee_shop', true)
  if (areas.value) {
    await nextTick()
    await initMap()
  }
}

function handleResize() {
  viewportW.value = window.innerWidth
  viewportH.value = window.innerHeight
}

onMounted(async () => {
  settings.load()
  shortlist.load()
  if (settings.isMapLight.value && mapStyleId.value === 'dark') {
    mapStyleId.value = 'bright'
  }
  handleResize()
  // On mobile viewports, keep drawer closed initially so the full Bandung map shines first
  if (window.innerWidth < 1024) {
    drawerOpen.value = false
  }
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('click', handleDocumentClick)
  await loadAll('coffee_shop')
  if (areas.value) {
    await nextTick()
    await initMap()
  } else {
    mapTransition.notifyMapReady()
  }
})

onBeforeUnmount(() => {
  stopRouteAnimation()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('click', handleDocumentClick)
  if (rentNoticeTimer) clearTimeout(rentNoticeTimer)
  if (locationBannerTimer) clearTimeout(locationBannerTimer)
  if (locateGuardTimer) clearTimeout(locateGuardTimer)
  mapInstance?.remove()
  mapInstance = null
})

// 4-way collision-aware dynamic hover tooltip placement (flips left/right & up/down cleanly!)
const hoverTooltipStyle = computed(() => {
  if (!hoveredInfo.value) return {}
  const { x, y } = hoveredInfo.value
  const cardW = 272
  const cardH = 114
  const gap = 22

  const safeLeft = 74
  const safeRight = drawerOpen.value && viewportW.value >= 1024
    ? viewportW.value - 452
    : viewportW.value - 24
  const safeTop = 88
  const safeBottom = viewportH.value - 24

  let tx: number
  if (x + gap + cardW <= safeRight) {
    // Enough space on the right side
    tx = x + gap
  } else if (x - gap - cardW >= safeLeft) {
    // Flip cleanly to the LEFT so it never covers the hovered hex or slides behind the side panel
    tx = x - gap - cardW
  } else {
    tx = Math.max(safeLeft, Math.min(safeRight - cardW, x - cardW / 2))
  }

  let ty: number
  const nearBottomLegend = x < 310 && y > viewportH.value - 280
  if (nearBottomLegend || y + cardH / 2 > safeBottom) {
    ty = y - cardH - 18
  } else if (y - cardH / 2 < safeTop) {
    ty = y + 20
  } else {
    ty = y - cardH / 2
  }
  ty = Math.max(safeTop, Math.min(safeBottom - cardH, ty))

  return {
    transform: `translate3d(${Math.round(tx)}px, ${Math.round(ty)}px, 0)`,
  }
})
</script>

<template>
  <div
    class="relative w-full h-[100svh] bg-[#090C11] overflow-hidden select-none transition-colors duration-200"
    :class="{ 'map-theme-light': settings.isMapLight.value }"
  >
    <!-- ==================== 1. UNIFIED FULL-WIDTH FLOATING PILL HEADER BAR (SEARCH + REGION + LAYER + FLUID COMPACT SCALE) ==================== -->
    <header class="absolute top-2.5 lg:top-3 inset-x-2.5 sm:inset-x-4 z-40 pointer-events-none">
      <div
        class="pointer-events-auto mx-auto max-w-[1680px] h-[clamp(44px,5.4vw,60px)] px-[clamp(8px,1.4vw,14px)] rounded-full bg-[#111620]/95 backdrop-blur-xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex items-center justify-between gap-1.5 sm:gap-2"
      >
        <!-- Left: Circular Back Button + Brand (City-Agnostic, Zero Hardcoded City Chip) -->
        <div class="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
          <NuxtLink
            to="/"
            aria-label="Back to homepage"
            title="Back to homepage"
            class="w-[clamp(30px,3.4vw,38px)] h-[clamp(30px,3.4vw,38px)] rounded-full bg-[#1A212D] border border-white/10 hover:border-mint/60 flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors shrink-0"
          >
            <ChevronLeft class="w-4 h-4" />
          </NuxtLink>

          <NuxtLink
            to="/"
            class="inline-flex items-center gap-1.5 sm:gap-2 group shrink-0"
            aria-label="Ascend Home"
          >
            <UiAscendMark
              :size="24"
              class="w-[clamp(21px,2.4vw,26px)] h-[clamp(21px,2.4vw,26px)] transition-all duration-mid ease-signal group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.55)]"
            />
            <span class="font-display font-bold text-[clamp(11.5px,1.4vw,15px)] tracking-[0.07em] text-ink-primary">
              ASCEND
            </span>
          </NuxtLink>

          <span
            v-if="meta?.is_sample"
            class="px-2 py-0.5 rounded-full bg-signal-amber/20 border border-signal-amber/50 font-mono text-[9px] font-bold text-signal-amber uppercase"
          >
            {{ HOME_COPY.mapPage.sampleBadge }}
          </span>
        </div>

        <!-- Center: Location Search Bar + REGION (Kawasan) Dropdown + LAYER Switcher -->
        <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-center">
          <!-- Location Search Anchor (Inline Pill on lg+, Icon Trigger + Floating Bar on < lg) -->
          <div ref="searchAnchor" class="relative shrink-0 lg:shrink lg:w-full lg:max-w-[290px]">
            <!-- Desktop Inline Search Input -->
            <div
              class="hidden lg:flex items-center gap-2 h-[38px] px-3.5 rounded-full bg-[#0A0E14]/90 border transition-all"
              :class="
                searchDropdownOpen
                  ? 'border-mint/70 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'border-white/15 hover:border-white/25'
              "
            >
              <Search class="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                autocomplete="off"
                spellcheck="false"
                :placeholder="settings.t('Search district or area...', 'Cari kecamatan atau area...')"
                :aria-label="settings.t('Search mapped district or neighborhood', 'Cari kecamatan atau area terpetakan')"
                class="w-full min-w-0 bg-transparent text-[12.5px] font-sans text-ink-primary placeholder:text-ink-muted focus:outline-none select-text"
                @focus="searchDropdownOpen = true; regionPickerOpen = false; layerPickerOpen = false"
                @keydown.enter.prevent="handleSearchEnter"
              >
              <button
                v-if="searchQuery"
                type="button"
                aria-label="Clear search"
                class="w-5 h-5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] flex items-center justify-center text-ink-muted hover:text-ink-primary shrink-0 cursor-pointer"
                @click="searchQuery = ''; searchInputRef?.focus()"
              >
                <X class="w-3 h-3" />
              </button>
            </div>

            <!-- Compact (< lg) Search Icon Trigger -->
            <button
              type="button"
              aria-label="Search mapped locations"
              :aria-expanded="compactSearchOpen"
              title="Search district or area"
              class="lg:hidden w-[clamp(30px,3.4vw,38px)] h-[clamp(30px,3.4vw,38px)] rounded-full border flex items-center justify-center transition-all cursor-pointer"
              :class="
                compactSearchOpen
                  ? 'border-mint bg-mint/15 text-mint shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                  : 'border-white/15 bg-[#0D131C] text-ink-secondary hover:border-mint/60 hover:text-mint'
              "
              @click.stop="toggleCompactSearch"
            >
              <Search class="w-3.5 h-3.5" />
            </button>

            <!-- Live Search Autocomplete Dropdown (Desktop anchored under input; Compact centered below header) -->
            <Transition
              enter-active-class="transition duration-150 ease-signal"
              enter-from-class="opacity-0 -translate-y-1.5 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-120 ease-signal"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-1.5 scale-95"
            >
              <div
                v-if="(searchDropdownOpen && viewportW >= 1024) || (compactSearchOpen && viewportW < 1024)"
                class="fixed lg:absolute left-3 right-3 sm:left-4 sm:right-4 lg:left-0 lg:right-auto top-[62px] lg:top-[calc(100%+10px)] z-50 lg:w-[340px] max-h-[65vh] overflow-y-auto rounded-2xl bg-[#0E141D]/95 backdrop-blur-xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.88)] p-2.5 space-y-2.5 select-text"
                @click.stop
              >
                <!-- Compact (< lg) Search Input Inside Floating Popover -->
                <div class="lg:hidden flex items-center gap-2 h-9 px-3 rounded-xl bg-[#090D14] border border-mint/45">
                  <Search class="w-3.5 h-3.5 text-mint shrink-0" />
                  <input
                    ref="compactSearchInputRef"
                    v-model="searchQuery"
                    type="text"
                    autocomplete="off"
                    spellcheck="false"
                    :placeholder="settings.t('Search district or area...', 'Cari kecamatan atau area...')"
                    :aria-label="settings.t('Search mapped district or neighborhood', 'Cari kecamatan atau area terpetakan')"
                    class="w-full min-w-0 bg-transparent text-[12.5px] font-sans text-ink-primary placeholder:text-ink-muted focus:outline-none"
                    @keydown.enter.prevent="handleSearchEnter"
                  >
                  <button
                    v-if="searchQuery"
                    type="button"
                    aria-label="Clear search"
                    class="text-ink-muted hover:text-ink-primary cursor-pointer"
                    @click="searchQuery = ''; compactSearchInputRef?.focus()"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>

                <template v-if="hasAnySearchMatch">
                  <!-- Study Zones Matches -->
                  <div v-if="searchResults.zones.length > 0 && !searchResults.isEmptyQuery" class="space-y-1">
                    <p class="px-2 pt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                      STUDY ZONES
                    </p>
                    <button
                      v-for="z in searchResults.zones"
                      :key="z.id"
                      type="button"
                      class="w-full px-2.5 py-2 rounded-xl hover:bg-white/[0.06] flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                      @click="z.id !== 'all' && handleSearchPickZone(z.id, z.label)"
                    >
                      <span class="flex items-center gap-2 min-w-0">
                        <MapPin class="w-3.5 h-3.5 text-mint shrink-0" />
                        <span class="min-w-0">
                          <span class="block font-sans text-[12.5px] font-semibold text-ink-primary truncate">{{ z.label }}</span>
                          <span class="block font-mono text-[9px] text-ink-muted truncate">{{ z.subtitle }}</span>
                        </span>
                      </span>
                      <span class="font-mono text-[9.5px] text-ink-muted shrink-0">{{ z.count }} areas</span>
                    </button>
                  </div>

                  <!-- Districts Matches -->
                  <div v-if="searchResults.districts.length > 0" class="space-y-1">
                    <p class="px-2 pt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                      {{ searchResults.isEmptyQuery ? 'POPULAR DISTRICTS' : 'DISTRICTS' }}
                    </p>
                    <div class="grid grid-cols-1 gap-0.5">
                      <button
                        v-for="d in searchResults.districts"
                        :key="d.name"
                        type="button"
                        class="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                        @click="handleSearchPickDistrict(d.name)"
                      >
                        <span class="flex items-center gap-2 min-w-0">
                          <MapPin class="w-3.5 h-3.5 text-ink-muted shrink-0" />
                          <span class="font-sans text-[12.5px] text-ink-primary truncate">{{ d.name }}</span>
                        </span>
                        <span class="flex items-center gap-1.5 shrink-0">
                          <span
                            v-if="d.oppCount > 0"
                            class="px-1.5 py-0.5 rounded-full bg-mint/15 border border-mint/40 font-mono text-[8.5px] font-bold text-mint"
                          >
                            {{ d.oppCount }} opp
                          </span>
                          <span class="font-mono text-[9px] text-ink-muted">{{ d.count }}</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  <!-- Matching Area Spots -->
                  <div v-if="searchResults.spots.length > 0" class="space-y-1 pt-1 border-t border-white/[0.08]">
                    <p class="px-2 pt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                      {{ searchResults.isEmptyQuery ? 'TOP OPPORTUNITY SPOTS' : 'MATCHING AREAS' }}
                    </p>
                    <button
                      v-for="spot in searchResults.spots"
                      :key="spot.properties.h3"
                      type="button"
                      class="w-full px-2.5 py-2 rounded-xl hover:bg-white/[0.06] flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                      @click="handleSearchPickSpot(spot)"
                    >
                      <span class="min-w-0">
                        <span class="block font-sans text-[12px] font-semibold text-ink-primary truncate">
                          {{ spot.properties.kecamatan || 'Unnamed area' }}
                        </span>
                        <span class="block font-mono text-[9px] text-ink-muted truncate">
                          {{ spot.properties.actual_k1 }} shops vs ~{{ spot.properties.expected_k1.toFixed(1) }} demand · {{ spot.properties.factors[0]?.text }}
                        </span>
                      </span>
                      <UiLabelBadge :label="spot.properties.label" size="sm" uppercase class="shrink-0" />
                    </button>
                  </div>
                </template>

                <div v-else class="px-3 py-4 text-center space-y-1">
                  <p class="font-sans text-[12.5px] font-medium text-ink-primary">
                    No matching districts or spots
                  </p>
                  <p class="font-sans text-[11px] text-ink-muted">
                    Try a district name (e.g. Coblong, Dayeuhkolot) or demand cue like campus, school, or transit.
                  </p>
                </div>
              </div>
            </Transition>
          </div>

          <!-- REGION (Kawasan) Dropdown Filter: Strictly Aligned With PRD US-002 (Study Zones + Districts, Zero "Current position") -->
          <div ref="regionPickerAnchor" class="relative shrink-0">
            <button
              type="button"
              aria-label="Filter study area or district"
              :aria-expanded="regionPickerOpen"
              :title="`Area filter: ${activeRegionLabel}`"
              class="relative inline-flex items-center justify-center lg:justify-between gap-1.5 h-[clamp(30px,3.4vw,38px)] w-[clamp(30px,3.4vw,38px)] lg:w-auto lg:px-3.5 rounded-full border transition-all cursor-pointer"
              :class="
                regionPickerOpen || activeRegion.kind !== 'all'
                  ? 'border-mint/70 bg-mint/15 text-ink-primary shadow-[0_0_16px_rgba(16,185,129,0.22)]'
                  : 'border-white/15 bg-[#0A0E14]/90 text-ink-secondary hover:border-white/30 hover:text-ink-primary'
              "
              @click.stop="regionPickerOpen = !regionPickerOpen; layerPickerOpen = false; searchDropdownOpen = false; compactSearchOpen = false; goodToKnowOpen = false"
            >
              <MapPin class="w-3.5 h-3.5 shrink-0" :class="activeRegion.kind !== 'all' ? 'text-mint' : 'text-ink-muted'" />
              <span
                v-if="activeRegion.kind !== 'all'"
                class="lg:hidden absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-mint border border-[#0A0E14]"
                aria-hidden="true"
              />
              <span class="hidden lg:inline font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted">
                {{ settings.t('AREA', 'KAWASAN') }}
              </span>
              <span class="hidden lg:inline font-sans text-[12px] font-semibold text-ink-primary max-w-[104px] truncate">
                {{ activeRegionLabel }}
              </span>
              <ChevronDown
                class="hidden lg:inline w-3.5 h-3.5 text-ink-muted transition-transform duration-150 shrink-0"
                :class="regionPickerOpen ? 'rotate-180 text-mint' : ''"
              />
            </button>

            <Transition
              enter-active-class="transition duration-150 ease-signal"
              enter-from-class="opacity-0 -translate-y-1.5 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-120 ease-signal"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-1.5 scale-95"
            >
              <div
                v-if="regionPickerOpen"
                role="menu"
                aria-label="Study zones and districts"
                class="fixed lg:absolute left-3 right-3 sm:left-auto sm:right-4 lg:left-0 lg:right-auto top-[62px] lg:top-[calc(100%+10px)] z-50 sm:w-[300px] rounded-2xl bg-[#0E141D]/95 backdrop-blur-xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.88)] p-2.5 space-y-2.5 select-text"
                @click.stop
              >
                <!-- Study Zones Section (PRD US-002) -->
                <div class="space-y-1">
                  <div class="px-2 pt-0.5 flex items-center justify-between">
                    <span class="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                      {{ settings.t('STUDY ZONES', 'ZONA STUDI') }}
                    </span>
                    <button
                      v-if="activeRegion.kind !== 'all'"
                      type="button"
                      class="font-mono text-[9px] uppercase tracking-[0.08em] text-mint hover:underline cursor-pointer"
                      @click="selectRegionFilter({ kind: 'all' })"
                    >
                      {{ settings.t('Reset', 'Atur ulang') }}
                    </button>
                  </div>

                  <button
                    v-for="z in studyZoneOptions"
                    :key="z.id"
                    type="button"
                    role="menuitemradio"
                    :aria-checked="z.id === 'all' ? activeRegion.kind === 'all' : activeRegion.kind === 'zone' && activeRegion.id === z.id"
                    class="w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                    :class="
                      (z.id === 'all' && activeRegion.kind === 'all')
                      || (activeRegion.kind === 'zone' && activeRegion.id === z.id)
                        ? 'bg-mint/15 border border-mint/45 text-ink-primary'
                        : 'hover:bg-white/[0.06] border border-transparent text-ink-secondary'
                    "
                    @click="z.id === 'all' ? selectRegionFilter({ kind: 'all' }) : selectRegionFilter({ kind: 'zone', id: z.id, label: z.label })"
                  >
                    <span class="min-w-0">
                      <span class="block font-sans text-[12.5px] font-semibold text-ink-primary truncate">{{ z.label }}</span>
                      <span class="block font-mono text-[9px] text-ink-muted truncate">{{ z.subtitle }} · {{ z.count.toLocaleString('en-US') }} areas</span>
                    </span>
                    <Check
                      v-if="(z.id === 'all' && activeRegion.kind === 'all') || (activeRegion.kind === 'zone' && activeRegion.id === z.id)"
                      class="w-3.5 h-3.5 text-mint shrink-0"
                    />
                  </button>
                </div>

                <!-- Districts (Kecamatan) Sub-List -->
                <div class="pt-2 border-t border-white/10 space-y-1.5">
                  <div class="px-2 flex items-center justify-between">
                    <span class="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                      {{ settings.t('DISTRICTS', 'KECAMATAN') }} ({{ districtOptions.length }})
                    </span>
                  </div>

                  <div class="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#090D14] border border-white/10 focus-within:border-mint/50">
                    <Search class="w-3 h-3 text-ink-muted shrink-0" />
                    <input
                      v-model="regionFilterQuery"
                      type="text"
                      :placeholder="settings.t('Filter district...', 'Cari kecamatan...')"
                      class="w-full min-w-0 bg-transparent text-[11.5px] font-sans text-ink-primary placeholder:text-ink-muted focus:outline-none"
                    >
                  </div>

                  <div class="max-h-[190px] overflow-y-auto space-y-0.5 pr-0.5">
                    <button
                      v-for="d in filteredDistrictOptions"
                      :key="d.name"
                      type="button"
                      role="menuitemradio"
                      :aria-checked="activeRegion.kind === 'district' && activeRegion.name === d.name"
                      class="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                      :class="
                        activeRegion.kind === 'district' && activeRegion.name === d.name
                          ? 'bg-mint/15 text-mint font-semibold'
                          : 'hover:bg-white/[0.06] text-ink-secondary hover:text-ink-primary'
                      "
                      @click="selectRegionFilter({ kind: 'district', name: d.name })"
                    >
                      <span class="font-sans text-[12px] truncate">{{ d.name }}</span>
                      <span class="flex items-center gap-1.5 shrink-0">
                        <span
                          v-if="d.oppCount > 0"
                          class="px-1.5 py-0.5 rounded-full bg-mint/15 font-mono text-[8px] font-bold text-mint"
                        >
                          {{ d.oppCount }} opp
                        </span>
                        <span class="font-mono text-[9px] text-ink-muted">{{ d.count }}</span>
                      </span>
                    </button>
                    <p
                      v-if="filteredDistrictOptions.length === 0"
                      class="px-2 py-3 text-center font-sans text-[11.5px] text-ink-muted"
                    >
                      No districts found
                    </p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- LAYER Switcher Dropdown: Real PRD-Grounded Data Lenses (Replaces Hexagon Fill Data) -->
          <div ref="layerPickerAnchor" class="relative shrink-0">
            <button
              type="button"
              aria-label="Switch hexagon data layer"
              :aria-expanded="layerPickerOpen"
              :title="`Map layer: ${activeLayerMeta.title}`"
              class="relative inline-flex items-center justify-center lg:justify-between gap-1.5 h-[clamp(30px,3.4vw,38px)] w-[clamp(30px,3.4vw,38px)] lg:w-auto lg:px-3.5 rounded-full border transition-all cursor-pointer"
              :class="
                layerPickerOpen || activeLayerId !== 'labels'
                  ? 'border-mint/70 bg-mint/15 text-ink-primary shadow-[0_0_16px_rgba(16,185,129,0.22)]'
                  : 'border-white/15 bg-[#0A0E14]/90 text-ink-secondary hover:border-white/30 hover:text-ink-primary'
              "
              @click.stop="layerPickerOpen = !layerPickerOpen; regionPickerOpen = false; searchDropdownOpen = false; compactSearchOpen = false; goodToKnowOpen = false"
            >
              <Layers class="w-3.5 h-3.5 shrink-0" :style="{ color: activeLayerMeta.accent }" />
              <span
                v-if="activeLayerId !== 'labels'"
                class="lg:hidden absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-mint border border-[#0A0E14]"
                aria-hidden="true"
              />
              <span class="hidden lg:inline font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted">
                {{ settings.t('LAYER', 'LAPISAN') }}
              </span>
              <span class="hidden lg:inline font-sans text-[12px] font-semibold text-ink-primary max-w-[100px] truncate">
                {{ activeLayerMeta.shortTitle }}
              </span>
              <ChevronDown
                class="hidden lg:inline w-3.5 h-3.5 text-ink-muted transition-transform duration-150 shrink-0"
                :class="layerPickerOpen ? 'rotate-180 text-mint' : ''"
              />
            </button>

            <Transition
              enter-active-class="transition duration-150 ease-signal"
              enter-from-class="opacity-0 -translate-y-1.5 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-120 ease-signal"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-1.5 scale-95"
            >
              <div
                v-if="layerPickerOpen"
                role="menu"
                aria-label="Hexagon data layers"
                class="fixed lg:absolute left-3 right-3 sm:left-auto sm:right-4 lg:right-0 lg:left-auto top-[62px] lg:top-[calc(100%+10px)] z-50 sm:w-[300px] rounded-2xl bg-[#0E141D]/95 backdrop-blur-xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.88)] p-2.5 space-y-1 select-text"
                @click.stop
              >
                <p class="px-2 pt-0.5 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                  {{ settings.t('HEXAGON DATA LAYERS', 'LAPISAN DATA HEKSAGON') }}
                </p>

                <button
                  v-for="layerOpt in localizedLayerOptions"
                  :key="layerOpt.id"
                  type="button"
                  role="menuitemradio"
                  :aria-checked="activeLayerId === layerOpt.id"
                  class="w-full px-2.5 py-2 rounded-xl flex items-start justify-between gap-2.5 text-left transition-colors cursor-pointer"
                  :class="
                    activeLayerId === layerOpt.id
                      ? 'bg-mint/15 border border-mint/45'
                      : 'hover:bg-white/[0.06] border border-transparent'
                  "
                  @click="selectDataLayer(layerOpt.id)"
                >
                  <span class="flex items-start gap-2.5 min-w-0">
                    <span
                      class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-white/10"
                      :style="{ backgroundColor: `${layerOpt.accent}1F`, color: layerOpt.accent }"
                    >
                      <Layers v-if="layerOpt.id === 'labels'" class="w-3.5 h-3.5" />
                      <Store v-else-if="layerOpt.id === 'supply'" class="w-3.5 h-3.5" />
                      <Compass v-else-if="layerOpt.id === 'demand'" class="w-3.5 h-3.5" />
                      <TrendingUp v-else-if="layerOpt.id === 'gap'" class="w-3.5 h-3.5" />
                      <ShieldCheck v-else class="w-3.5 h-3.5" />
                    </span>
                    <span class="min-w-0">
                      <span class="block font-sans text-[12.5px] font-semibold text-ink-primary leading-tight">
                        {{ layerOpt.title }}
                      </span>
                      <span class="block font-sans text-[11px] text-ink-muted leading-snug mt-0.5">
                        {{ layerOpt.subtitle }}
                      </span>
                    </span>
                  </span>
                  <Check v-if="activeLayerId === layerOpt.id" class="w-3.5 h-3.5 text-mint shrink-0 mt-1" />
                </button>

                <!-- Honest Disabled Phase 3 Preview Layer -->
                <div class="pt-1.5 mt-1 border-t border-white/10">
                  <button
                    type="button"
                    disabled
                    class="w-full px-2.5 py-2 rounded-xl border border-dashed border-[#334155]/90 bg-white/[0.02] flex items-center justify-between gap-2 text-left cursor-not-allowed opacity-75"
                  >
                    <span class="flex items-center gap-2.5 min-w-0">
                      <span class="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#64748B] shrink-0">
                        <Tag class="w-3.5 h-3.5" />
                      </span>
                      <span class="min-w-0">
                        <span class="block font-sans text-[12px] font-semibold text-[#94A3B8] leading-tight">
                          Rent Overlay
                        </span>
                        <span class="block font-sans text-[10.5px] text-[#64748B] leading-snug">
                          User rent quotes &amp; market room check
                        </span>
                      </span>
                    </span>
                    <span class="px-1.5 py-0.5 rounded-full bg-signal-amber/15 border border-signal-amber/40 font-mono text-[7.5px] font-bold text-signal-amber uppercase shrink-0">
                      SOON
                    </span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Right: Business Type Switcher (Compact < 2xl, Full Pills 2xl+) + (i) + Shortlist + About -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <!-- Business Type Selector Capsule -->
          <div class="hidden sm:flex items-center gap-1 p-1 rounded-full bg-[#0A0E14]/90 border border-white/[0.08]">
            <button
              type="button"
              aria-label="Coffee shop (Live)"
              title="Coffee shop · Live open-data coverage"
              class="inline-flex items-center justify-center gap-1.5 h-[clamp(26px,2.9vw,32px)] w-[clamp(26px,2.9vw,32px)] 2xl:w-auto 2xl:px-3.5 rounded-full bg-mint text-[#071510] font-sans text-[12px] font-bold shadow-[0_0_16px_rgba(16,185,129,0.35)]"
            >
              <Coffee class="w-3.5 h-3.5 shrink-0" />
              <span class="hidden 2xl:inline">{{ HOME_COPY.hero.businessCoffee }}</span>
            </button>

            <button
              type="button"
              disabled
              aria-label="Eatery (Coming soon)"
              title="Eatery · Coming soon in Phase 2"
              class="relative inline-flex items-center justify-center gap-1.5 h-[clamp(26px,2.9vw,32px)] w-[clamp(26px,2.9vw,32px)] 2xl:w-auto 2xl:px-3 rounded-full border border-dashed border-[#334155]/90 bg-white/[0.02] text-[#94A3B8] font-sans text-[12px] cursor-not-allowed"
            >
              <UtensilsCrossed class="w-3.5 h-3.5 opacity-65 shrink-0" />
              <span class="2xl:hidden absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-signal-amber border border-[#0A0E14]" aria-hidden="true" />
              <span class="hidden 2xl:inline">{{ HOME_COPY.hero.businessEatery }}</span>
              <span class="hidden 2xl:inline px-1.5 py-0.5 rounded-full bg-signal-amber/15 border border-signal-amber/40 font-mono text-[7.5px] font-bold text-signal-amber uppercase">
                SOON
              </span>
            </button>
          </div>

          <!-- (i) Good to Know Icon + Popover -->
          <div ref="goodToKnowAnchor" class="relative">
            <button
              type="button"
              :aria-label="settings.t('Good to know', 'Perlu diketahui')"
              :aria-expanded="goodToKnowOpen"
              :title="settings.t('Good to know · What Ascend does not do', 'Perlu diketahui · Batasan Ascend')"
              class="w-[clamp(30px,3.4vw,38px)] h-[clamp(30px,3.4vw,38px)] rounded-full border flex items-center justify-center transition-all duration-fast ease-signal cursor-pointer"
              :class="
                goodToKnowOpen
                  ? 'border-mint bg-mint/15 text-mint shadow-[0_0_16px_rgba(16,185,129,0.32)]'
                  : 'border-white/15 bg-[#0D131C] text-ink-secondary hover:border-mint/60 hover:text-mint'
              "
              @click.stop="goodToKnowOpen = !goodToKnowOpen; regionPickerOpen = false; layerPickerOpen = false; searchDropdownOpen = false; compactSearchOpen = false"
            >
              <Info class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <!-- Floating Good to Know Popover -->
            <Transition
              enter-active-class="transition duration-150 ease-signal"
              enter-from-class="opacity-0 -translate-y-1.5 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-120 ease-signal"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-1.5 scale-95"
            >
              <div
                v-if="goodToKnowOpen"
                role="dialog"
                :aria-label="settings.t('Good to know', 'Perlu diketahui')"
                class="absolute -right-12 sm:right-0 top-[calc(100%+12px)] z-50 w-[290px] sm:w-[336px] rounded-2xl bg-[#0E141D]/95 backdrop-blur-xl border border-white/15 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.88)] space-y-3 select-text"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-mint">
                    <Info class="w-3.5 h-3.5" />
                    <span>{{ settings.t('GOOD TO KNOW', 'PERLU DIKETAHUI') }}</span>
                  </span>
                  <button
                    type="button"
                    aria-label="Close good to know"
                    class="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors cursor-pointer"
                    @click="goodToKnowOpen = false"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div class="rounded-xl bg-[#090D14] border border-white/[0.09] p-3.5 space-y-2">
                  <p class="font-sans text-[12.5px] font-semibold text-ink-primary">
                    {{ settings.t('What Ascend does not do', 'Yang tidak dilakukan Ascend') }}
                  </p>
                  <ul class="space-y-1.5 font-sans text-[12px] text-ink-secondary">
                    <li class="flex items-start gap-2">
                      <span class="font-mono text-signal-coral font-bold">x</span>
                      <span>{{ settings.t('No sales, profit, or survival predictions', 'Tidak memprediksi omzet, profit, atau peluang bertahan') }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="font-mono text-signal-coral font-bold">x</span>
                      <span>{{ settings.t('Informal vendors are not counted', 'Pedagang informal tidak tercatat penuh') }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="font-mono text-signal-coral font-bold">x</span>
                      <span>{{ settings.t('No listings, payments, or accounts', 'Tanpa listing sewa, pembayaran, atau akun') }}</span>
                    </li>
                  </ul>
                </div>

                <p class="font-sans text-[11.5px] leading-[1.55] text-ink-muted">
                  {{ settings.homeCopy.value.mapPage.cardFootnote }}
                </p>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mint hover:text-[#6EE7B7] underline underline-offset-4 cursor-pointer"
                  @click="openAboutModal('limits')"
                >
                  <span>{{ settings.t('Full methodology & limits', 'Metodologi & batasan lengkap') }}</span>
                  <ChevronRight class="w-3 h-3" />
                </button>
              </div>
            </Transition>
          </div>

          <!-- Settings Icon Button (Language EN/ID, Map Dark/Light Theme, Reading Helpers) -->
          <button
            type="button"
            :aria-label="settings.settingsCopy.value.navTooltip"
            :title="`${settings.settingsCopy.value.navTooltip} · ${settings.settingsCopy.value.navTooltipHintMap}`"
            class="relative w-[clamp(30px,3.4vw,38px)] h-[clamp(30px,3.4vw,38px)] rounded-full border flex items-center justify-center transition-all duration-fast ease-signal cursor-pointer"
            :class="
              settingsOpen
                ? 'border-mint bg-mint/15 text-mint shadow-[0_0_16px_rgba(16,185,129,0.32)]'
                : 'border-white/15 bg-[#0D131C] text-ink-secondary hover:border-mint/60 hover:text-mint'
            "
            @click.stop="settingsOpen = true; goodToKnowOpen = false; regionPickerOpen = false; layerPickerOpen = false; searchDropdownOpen = false; compactSearchOpen = false"
          >
            <Settings class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span
              class="absolute -bottom-1 -right-0.5 px-1 rounded-full border font-mono text-[7px] font-bold uppercase leading-[12px]"
              :class="settings.isMapLight.value ? 'bg-emerald-50 border-emerald-600/50 text-emerald-700' : 'bg-[#102721] border-mint/50 text-mint'"
            >
              {{ settings.locale.value }}
            </span>
          </button>

          <!-- Shortlist Pill (Icon-Only Circle With Count Badge on < xl, Full Pill on xl+) -->
          <button
            type="button"
            :aria-label="settings.t('Open shortlist', 'Buka daftar pendek')"
            :title="`${settings.t('Shortlist', 'Daftar pendek')} (${shortlist.items.value.length})`"
            class="relative inline-flex items-center justify-center gap-1.5 h-[clamp(30px,3.4vw,38px)] w-[clamp(30px,3.4vw,38px)] xl:w-auto xl:px-3.5 rounded-full bg-[#0D131C] border transition-all font-sans text-[12px] font-semibold cursor-pointer"
            :class="
              drawerOpen && rightTab === 'shortlist'
                ? 'border-mint/70 text-mint shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                : 'border-white/15 text-ink-primary hover:border-white/30'
            "
            @click="openShortlistTab"
          >
            <Bookmark class="w-3.5 h-3.5 shrink-0" />
            <span class="hidden xl:inline">{{ settings.t('Shortlist', 'Daftar') }}</span>
            <span class="hidden xl:inline font-mono text-[11px] text-mint">({{ shortlist.items.value.length }})</span>
            <span
              v-if="shortlist.items.value.length > 0"
              class="xl:hidden absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-mint text-[#071510] font-mono text-[9px] font-bold flex items-center justify-center"
            >
              {{ shortlist.items.value.length }}
            </span>
          </button>

          <!-- About Mint CTA (Icon-Only Circle on < xl, Full Pill on xl+) -->
          <button
            type="button"
            :aria-label="settings.t('About Ascend', 'Tentang Ascend')"
            :title="settings.t('About Ascend · Methodology & data', 'Tentang Ascend · Metodologi & data')"
            class="btn-mint h-[clamp(30px,3.4vw,38px)] w-[clamp(30px,3.4vw,38px)] xl:w-auto xl:px-4 text-[12px] font-bold shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer"
            @click="openAboutModal('labels')"
          >
            <BookOpen class="w-3.5 h-3.5 xl:hidden" :stroke-width="2.2" />
            <span class="hidden xl:inline">{{ settings.t('About', 'Tentang') }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ==================== MAPLIBRE GL JS FULL-SCREEN CANVAS ==================== -->
    <div ref="mapContainer" class="w-full h-full" />

    <!-- Live Hover Popover Card on Map (Desktop, 4-way collision-aware flexible placement, Layer-Aware) -->
    <div
      v-if="hoveredInfo && !loading && !error"
      class="pointer-events-none hidden lg:block fixed top-0 left-0 z-20 w-[272px] rounded-xl bg-[#10151F]/95 backdrop-blur-md border border-white/15 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.72)]"
      :style="hoverTooltipStyle"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-primary truncate">
          {{ hoveredInfo.kecamatan }}
        </span>
        <UiLabelBadge :label="hoveredInfo.label" size="sm" uppercase />
      </div>
      <p class="mt-1.5 font-sans text-[11.5px] leading-snug text-ink-secondary">
        {{ settings.labelText.value[hoveredInfo.label].headlineDescription }}
      </p>
      <p class="mt-2 pt-1.5 border-t border-white/[0.08] font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-muted">
        <template v-if="activeLayerId === 'supply'">
          {{ hoveredInfo.actual_k1 }} {{ settings.t('open coffee shops in ~500 m', 'kedai kopi aktif dalam ~500 m') }} · {{ hoveredInfo.actual }} {{ settings.t('here', 'di titik ini') }}
        </template>
        <template v-else-if="activeLayerId === 'demand'">
          {{ settings.t('Demand supports', 'Daya dukung permintaan') }} ~{{ hoveredInfo.expected_k1.toFixed(1) }} · {{ hoveredInfo.actual_k1 }} {{ settings.t('open now', 'aktif') }}
        </template>
        <template v-else-if="activeLayerId === 'gap'">
          {{ settings.t('Room balance', 'Selisih ruang') }}: {{ hoveredInfo.gap >= 0 ? `+${hoveredInfo.gap.toFixed(1)}` : hoveredInfo.gap.toFixed(1) }} ({{ hoveredInfo.actual_k1 }} vs ~{{ hoveredInfo.expected_k1.toFixed(1) }})
        </template>
        <template v-else-if="activeLayerId === 'confidence'">
          {{ hoveredInfo.confidence === 'low' ? settings.confidenceText.value.low.title : settings.confidenceText.value.normal.title }}
        </template>
        <template v-else>
          {{ hoveredInfo.actual_k1 }} {{ settings.t('coffee shops in 500 m', 'kedai kopi dalam 500 m') }} · {{ hoveredInfo.actual }} {{ settings.t('in this spot', 'di titik ini') }}
        </template>
      </p>
    </div>

    <!-- ==================== LOADING SKELETON OVERLAY (FALLBACK ONLY WHEN TRANSITION OVERLAY IS CLOSED) ==================== -->
    <div
      v-if="loading && !mapTransition.visible.value"
      class="absolute inset-0 z-50 bg-[#090C11]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
      aria-busy="true"
    >
      <div class="w-full max-w-sm rounded-2xl bg-[#111620] border border-white/10 p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-center gap-2.5">
          <UiAscendMark :size="28" class="animate-pulse" />
          <span class="font-mono text-[11px] uppercase tracking-[0.16em] text-mint">
            LOADING OPPORTUNITY MAP
          </span>
        </div>
        <div class="space-y-2.5">
          <div class="h-3 w-full rounded skeleton-bar" />
          <div class="h-3 w-4/5 mx-auto rounded skeleton-bar" />
          <div class="h-24 w-full rounded-xl skeleton-bar" />
        </div>
      </div>
    </div>

    <!-- ==================== ERROR STATE WITH RETRY BUTTON ==================== -->
    <div
      v-else-if="error"
      class="absolute inset-0 z-50 bg-[#090C11]/95 flex items-center justify-center p-6"
    >
      <div class="w-full max-w-md rounded-2xl bg-[#111620] border border-signal-coral/40 p-6 text-center space-y-4 shadow-2xl">
        <div class="w-11 h-11 rounded-full bg-signal-coral/15 border border-signal-coral/40 flex items-center justify-center text-signal-coral mx-auto">
          <AlertTriangle class="w-5 h-5" />
        </div>
        <h1 class="font-editorial font-semibold text-[22px] text-ink-primary">
          Unable to load map data
        </h1>
        <p class="font-sans text-[14px] text-ink-secondary">
          {{ HOME_COPY.mapPage.loadError }}
        </p>
        <button
          type="button"
          class="btn-mint h-10 px-5 text-[13.5px] cursor-pointer"
          @click="retryLoad"
        >
          <RefreshCw class="w-4 h-4" />
          <span>{{ HOME_COPY.mapPage.retry }}</span>
        </button>
      </div>
    </div>

    <!-- ==================== 2. LEFT FLOATING MAP CONTROLS (FLUID BOUNDED SCALE, ZERO OVERLAP WITH LEGEND) ==================== -->
    <div
      v-if="!loading && !error"
      class="absolute top-[62px] lg:top-[84px] left-2.5 lg:left-4 z-20 flex flex-col items-center gap-2 origin-top-left transition-transform duration-200"
      :style="{ transform: `scale(${leftRailScale})` }"
    >
      <div class="flex flex-col items-center p-1.5 rounded-2xl bg-[#111620]/95 backdrop-blur-md border border-white/10 shadow-xl gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          class="w-9 h-9 rounded-xl hover:bg-white/[0.08] flex items-center justify-center text-ink-primary transition-colors cursor-pointer"
          @click="zoomInMap"
        >
          <Plus class="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          class="w-9 h-9 rounded-xl hover:bg-white/[0.08] flex items-center justify-center text-ink-primary transition-colors cursor-pointer"
          @click="zoomOutMap"
        >
          <Minus class="w-4 h-4" />
        </button>

        <!-- Dedicated 3D Tilt & Extruded Buildings Toggle (Matches Loconomics!) -->
        <button
          type="button"
          aria-label="Toggle 3D buildings view"
          :aria-pressed="is3DMode"
          title="Toggle 3D buildings & angled perspective"
          class="w-9 h-9 rounded-xl font-mono text-[11px] font-bold tracking-[0.04em] flex items-center justify-center transition-all cursor-pointer"
          :class="
            is3DMode
              ? 'bg-mint text-[#071510] shadow-[0_0_16px_rgba(16,185,129,0.4)]'
              : 'hover:bg-white/[0.08] text-ink-secondary hover:text-ink-primary'
          "
          @click="toggle3DMode"
        >
          3D
        </button>

        <span class="w-6 h-px bg-white/10 my-0.5" aria-hidden="true" />

        <!-- Fixed Device "Show my position" Button (Device pin only, fast 3-tier resolver!) -->
        <button
          type="button"
          aria-label="Use my current position"
          :title="userLocation ? 'Re-center on my current position' : 'Show my current device position'"
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
          :class="
            userLocation
              ? 'bg-mint/20 border border-mint/60 text-mint shadow-[0_0_14px_rgba(16,185,129,0.28)]'
              : 'hover:bg-white/[0.08] text-mint/85 hover:text-mint'
          "
          @click="locateUserPosition(false)"
        >
          <Loader2 v-if="locating" class="w-4 h-4 animate-spin text-mint" />
          <LocateFixed v-else class="w-4 h-4" />
        </button>

        <button
          type="button"
          aria-label="Reset map view"
          title="Reset map view"
          class="w-9 h-9 rounded-xl hover:bg-white/[0.08] flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
          @click="resetMapView"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>

        <span class="w-6 h-px bg-white/10 my-0.5" aria-hidden="true" />

        <!-- Multi-Variant Map Style Switcher (Dark | Colorful | Minimal B&W | Satellite) -->
        <div ref="stylePickerAnchor" class="relative">
          <button
            type="button"
            aria-label="Change map style"
            :aria-expanded="stylePickerOpen"
            title="Map style: Dark, Colorful, Minimal B&W, Satellite"
            class="w-9 h-9 rounded-full p-0.5 border-2 transition-all cursor-pointer overflow-hidden shadow-md"
            :class="stylePickerOpen ? 'border-mint scale-105' : 'border-white/30 hover:border-mint/70'"
            @click.stop="stylePickerOpen = !stylePickerOpen"
          >
            <!-- Live Mini Swatch Representing Active Style -->
            <span
              class="w-full h-full rounded-full block relative overflow-hidden"
              :style="
                mapStyleId === 'bright'
                  ? { background: 'linear-gradient(135deg, #DCFCE7 0%, #F8FAFC 55%, #99F6E4 100%)' }
                  : mapStyleId === 'bw'
                    ? { background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 55%, #CBD5E1 100%)' }
                    : mapStyleId === 'satellite'
                      ? { background: 'linear-gradient(135deg, #2D4A2E 0%, #596943 48%, #475338 74%, #1B3B4B 100%)' }
                      : { background: 'linear-gradient(135deg, #151C28 0%, #0B0F16 58%, #122836 100%)' }
              "
            >
              <span
                class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] -rotate-12"
                :class="
                  mapStyleId === 'bright' || mapStyleId === 'bw'
                    ? 'bg-white'
                    : mapStyleId === 'satellite'
                      ? 'bg-[#E2E8F0]/80'
                      : 'bg-[#4C5B6E]/80'
                "
              />
              <span
                class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] -rotate-12"
                :class="
                  mapStyleId === 'bright' || mapStyleId === 'bw'
                    ? 'bg-white/90'
                    : mapStyleId === 'satellite'
                      ? 'bg-[#CBD5E1]/70'
                      : 'bg-[#334155]/75'
                "
              />
            </span>
          </button>

          <!-- Expandable Horizontal Pill Bar of 4 Circular Map Style Thumbnails (Matches Loconomics!) -->
          <Transition
            enter-active-class="transition duration-200 ease-signal"
            enter-from-class="opacity-0 -translate-x-2 scale-95"
            enter-to-class="opacity-100 translate-x-0 scale-100"
            leave-active-class="transition duration-150 ease-signal"
            leave-from-class="opacity-100 translate-x-0 scale-100"
            leave-to-class="opacity-0 -translate-x-2 scale-95"
          >
            <div
              v-if="stylePickerOpen"
              role="menu"
              aria-label="Map style options"
              class="absolute left-12 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 px-2.5 py-2 rounded-full bg-[#111620]/95 backdrop-blur-xl border border-white/15 shadow-[0_18px_48px_rgba(0,0,0,0.82)]"
            >
              <button
                v-for="opt in localizedStyleOptions"
                :key="opt.id"
                type="button"
                role="menuitemradio"
                :aria-checked="mapStyleId === opt.id"
                :title="`${opt.label} · ${opt.hint}`"
                class="group flex flex-col items-center gap-1 px-1 cursor-pointer"
                @click="switchMapStyle(opt.id)"
              >
                <span
                  class="w-10 h-10 rounded-full p-0.5 border-2 transition-all block overflow-hidden"
                  :class="
                    mapStyleId === opt.id
                      ? 'border-mint shadow-[0_0_16px_rgba(16,185,129,0.55)] scale-105'
                      : 'border-white/20 group-hover:border-white/55'
                  "
                >
                  <span
                    class="w-full h-full rounded-full block relative overflow-hidden"
                    :style="
                      opt.id === 'bright'
                        ? { background: 'linear-gradient(135deg, #BBF7D0 0%, #F8FAFC 52%, #99F6E4 100%)' }
                        : opt.id === 'bw'
                          ? { background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 52%, #CBD5E1 100%)' }
                          : opt.id === 'satellite'
                            ? { background: 'radial-gradient(circle at 28% 28%, #6B7B4E 0%, #3E5233 44%, #2B3B27 72%, #193545 100%)' }
                            : { background: 'linear-gradient(135deg, #161E2B 0%, #0B0F16 58%, #122836 100%)' }
                    "
                  >
                    <!-- Aerial texture speckles for Satellite thumbnail -->
                    <span
                      v-if="opt.id === 'satellite'"
                      class="absolute top-1.5 right-2 w-2.5 h-2 rounded-[2px] bg-[#9E7B5B]/75 rotate-12"
                    />
                    <span
                      v-if="opt.id === 'satellite'"
                      class="absolute bottom-2 left-1.5 w-3 h-2 rounded-[2px] bg-[#788765]/80 -rotate-6"
                    />
                    <span
                      class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2.5px] -rotate-12"
                      :class="
                        opt.id === 'bright' || opt.id === 'bw'
                          ? 'bg-white'
                          : opt.id === 'satellite'
                            ? 'bg-[#E2E8F0]/80'
                            : 'bg-[#4C5B6E]/80'
                      "
                    />
                    <span
                      class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2.5px] -rotate-12"
                      :class="
                        opt.id === 'bright' || opt.id === 'bw'
                          ? 'bg-white/90'
                          : opt.id === 'satellite'
                            ? 'bg-[#CBD5E1]/65'
                            : 'bg-[#334155]/75'
                      "
                    />
                  </span>
                </span>
                <span
                  class="font-mono text-[8px] uppercase tracking-[0.08em] whitespace-nowrap"
                  :class="mapStyleId === opt.id ? 'text-mint font-bold' : 'text-ink-muted group-hover:text-ink-primary'"
                >
                  {{ opt.label }}
                </span>
              </button>
            </div>
          </Transition>
        </div>

        <span class="w-6 h-px bg-white/10 my-0.5" aria-hidden="true" />

        <!-- Disabled RENT Layer Stub (Honest Coming Soon) -->
        <button
          type="button"
          class="w-10 py-1.5 rounded-xl bg-white/[0.03] border border-dashed border-[#334155]/90 flex flex-col items-center justify-center gap-0.5 text-[#64748B] hover:border-[#64748B] transition-colors cursor-pointer"
          :title="settings.t('Rent layer launches in Phase 3', 'Lapisan sewa hadir pada Fase 3')"
          @click="triggerRentNotice"
        >
          <Tag class="w-3.5 h-3.5" />
          <span class="font-mono text-[7.5px] tracking-[0.1em] uppercase">{{ settings.t('RENT', 'SEWA') }}</span>
          <span class="font-mono text-[6.5px] font-bold tracking-[0.06em] uppercase text-signal-amber">
            {{ settings.t('SOON', 'SEGERA') }}
          </span>
        </button>
      </div>

      <!-- Live GPS User Position Status Card -->
      <Transition
        enter-active-class="transition duration-200 ease-signal"
        enter-from-class="opacity-0 -translate-x-2"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition duration-150 ease-signal"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 -translate-x-2"
      >
        <div
          v-if="locationBanner"
          class="absolute left-14 top-[118px] w-[276px] rounded-xl bg-[#111722]/95 backdrop-blur-xl border p-3.5 shadow-2xl space-y-2 select-text"
          :class="
            locationBanner.kind === 'error'
              ? 'border-signal-coral/45'
              : 'border-mint/45'
          "
        >
          <div class="flex items-start justify-between gap-2">
            <p
              class="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
              :class="locationBanner.kind === 'error' ? 'text-signal-coral' : 'text-mint'"
            >
              <Navigation class="w-3 h-3 shrink-0" />
              <span>{{ locationBanner.title }}</span>
            </p>
            <button
              type="button"
              aria-label="Dismiss location notice"
              class="text-ink-muted hover:text-ink-primary cursor-pointer"
              @click="locationBanner = null"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="font-sans text-[11.5px] leading-snug text-ink-secondary">
            {{ locationBanner.body }}
          </p>
          <div
            v-if="locationBanner.kind === 'outside' && userLocation"
            class="flex flex-wrap items-center gap-1.5 pt-1"
          >
            <button
              type="button"
              class="px-2.5 py-1 rounded-full bg-mint text-[#071510] font-sans text-[11px] font-bold cursor-pointer"
              @click="flyToNearestCoverageArea"
            >
              Back to map area
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/15 font-sans text-[11px] text-ink-primary hover:border-mint/50 cursor-pointer"
              @click="flyToUserPin"
            >
              My GPS pin
            </button>
          </div>
          <div
            v-else-if="locationBanner.kind === 'error'"
            class="flex flex-wrap items-center gap-1.5 pt-1"
          >
            <button
              type="button"
              class="px-2.5 py-1 rounded-full bg-mint text-[#071510] font-sans text-[11px] font-bold cursor-pointer"
              @click="resolveWithIpFallback(false)"
            >
              Use approximate device IP
            </button>
          </div>
        </div>
      </Transition>

      <!-- Subtle Toast when clicking Rent Coming Soon -->
      <Transition
        enter-active-class="transition duration-200 ease-signal"
        enter-from-class="opacity-0 -translate-x-2"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition duration-150 ease-signal"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 -translate-x-2"
      >
        <div
          v-if="rentNotice"
          class="absolute left-14 top-[256px] w-56 rounded-xl bg-[#121822]/95 backdrop-blur-md border border-signal-amber/40 p-3 shadow-2xl"
        >
          <p class="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-signal-amber">
            {{ settings.t('RENT LAYER · COMING SOON', 'LAPISAN SEWA · SEGERA HADIR') }}
          </p>
          <p class="mt-1 font-sans text-[11.5px] leading-snug text-ink-secondary">
            {{ settings.t('Private lease-quote overlay launches in Phase 3 without scraping restricted listings.', 'Lapisan perbandingan sewa pribadi hadir pada Fase 3 tanpa mengambil listing terbatas.') }}
          </p>
        </div>
      </Transition>
    </div>

    <!-- ==================== 5. BOTTOM-LEFT COLLAPSIBLE INTERACTIVE LEGEND (DYNAMIC PER LAYER + FAST (i) HOVER INFO) ==================== -->
    <aside
      v-if="!loading && !error"
      v-show="!drawerOpen || viewportW >= 1024"
      aria-label="Map layer legend"
      class="absolute bottom-4 lg:bottom-7 left-2.5 lg:left-4 w-[256px] sm:w-[274px] rounded-2xl bg-[#10151E]/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-visible origin-bottom-left transition-transform duration-200"
      :class="hoveredLegendTip ? 'z-40' : 'z-20'"
      :style="{ transform: `scale(${legendScale})` }"
      @mouseleave="hoveredLegendTip = null"
    >
      <!-- Instant Fast-Hover (i) Quick Info Card Floating Cleanly Beside Top of Legend -->
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0 -translate-x-1 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100 translate-x-0 scale-100"
        leave-to-class="opacity-0 -translate-x-1 scale-95"
      >
        <div
          v-if="hoveredLegendTip && !legendCollapsed && activeLayerId === 'labels'"
          role="tooltip"
          class="pointer-events-none absolute left-[calc(100%+12px)] top-0 z-50 w-[252px] rounded-2xl bg-[#0E141D]/95 backdrop-blur-xl border border-white/15 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.8)] space-y-1.5"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{
                backgroundColor:
                  hoveredLegendTip === 'low_confidence'
                    ? '#94A3B8'
                    : MAP_LABEL_COPY[hoveredLegendTip].color,
              }"
            />
            <span class="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink-primary">
              {{
                hoveredLegendTip === 'low_confidence'
                  ? settings.confidenceText.value.low.title
                  : settings.labelText.value[hoveredLegendTip].title
              }}
            </span>
          </div>
          <p class="font-sans text-[11.5px] leading-[1.52] text-ink-secondary">
            {{
              hoveredLegendTip === 'low_confidence'
                ? settings.confidenceText.value.low.quickTip
                : settings.labelText.value[hoveredLegendTip].quickTip
            }}
          </p>
        </div>
      </Transition>

      <div class="px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-white/[0.07]">
        <button
          type="button"
          class="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer min-w-0"
          @click="legendCollapsed = !legendCollapsed"
        >
          <span class="truncate">{{ activeLayerMeta.legendTitle }}</span>
          <ChevronUp v-if="legendCollapsed" class="w-3.5 h-3.5 text-ink-muted shrink-0" />
          <ChevronDown v-else class="w-3.5 h-3.5 text-ink-muted shrink-0" />
        </button>

        <button
          v-if="activeLayerId === 'labels' && activeLabelFilter"
          type="button"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint/15 border border-mint/45 font-mono text-[8.5px] uppercase text-mint hover:bg-mint/25 cursor-pointer shrink-0"
          @click="activeLabelFilter = null; applyMapFiltersAndSelection()"
        >
          <RotateCcw class="w-2.5 h-2.5" />
          <span>{{ settings.t('All', 'Semua') }}</span>
        </button>

        <button
          v-else-if="activeLayerId !== 'labels'"
          type="button"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/15 font-mono text-[8.5px] uppercase text-ink-secondary hover:text-mint hover:border-mint/45 cursor-pointer shrink-0"
          @click="selectDataLayer('labels')"
        >
          <RotateCcw class="w-2.5 h-2.5" />
          <span>{{ settings.t('Labels', 'Label') }}</span>
        </button>
      </div>

      <!-- Active Region Filter Chip Inside Legend When Filtered -->
      <div
        v-if="!legendCollapsed && activeRegion.kind !== 'all'"
        class="px-3 pt-2.5"
      >
        <div class="px-2.5 py-1.5 rounded-xl bg-mint/10 border border-mint/35 flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-mint truncate">
            <MapPin class="w-3 h-3 shrink-0" />
            <span class="truncate">{{ activeRegionLabel }}</span>
          </span>
          <button
            type="button"
            aria-label="Clear area filter"
            class="text-mint/80 hover:text-ink-primary cursor-pointer shrink-0"
            @click="selectRegionFilter({ kind: 'all' })"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>

      <!-- LAYER 1 (DEFAULT): MARKET ROOM 4-LABEL INTERACTIVE FILTER + FAST (i) HOVER INFO -->
      <div v-if="!legendCollapsed && activeLayerId === 'labels'" class="p-3 space-y-1.5">
        <div
          v-for="lbl in legendLabels"
          :key="lbl"
          class="w-full px-2 py-1.5 rounded-lg flex items-center justify-between gap-1.5 transition-all"
          :class="
            activeLabelFilter === lbl
              ? 'bg-white/[0.1] ring-1 ring-white/25'
              : activeLabelFilter && activeLabelFilter !== lbl
                ? 'opacity-45 hover:opacity-90'
                : 'hover:bg-white/[0.05]'
          "
        >
          <button
            type="button"
            class="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
            :title="settings.t(`Click to filter ${settings.labelText.value[lbl].title} areas`, `Klik untuk filter area ${settings.labelText.value[lbl].title}`)"
            @click="toggleLabelFilter(lbl)"
          >
            <!-- Patterned Swatch -->
            <span
              class="w-6 h-3.5 rounded-[3px] shrink-0 border border-black/40"
              :style="
                lbl === 'opportunity'
                  ? { backgroundColor: '#10B981', backgroundImage: 'repeating-linear-gradient(-45deg, rgba(4,47,34,0.42) 0 2px, transparent 2px 5px)' }
                  : lbl === 'fair'
                    ? { backgroundColor: '#E5940A', backgroundImage: 'repeating-linear-gradient(0deg, rgba(69,26,3,0.4) 0 1.5px, transparent 1.5px 4px)' }
                    : lbl === 'crowded'
                      ? { backgroundColor: '#D93D3D', backgroundImage: 'repeating-linear-gradient(45deg, rgba(69,10,10,0.42) 0 1.5px, transparent 1.5px 5px), repeating-linear-gradient(-45deg, rgba(69,10,10,0.42) 0 1.5px, transparent 1.5px 5px)' }
                      : { backgroundColor: '#536275', backgroundImage: 'radial-gradient(rgba(226,232,240,0.45) 0.9px, transparent 0.9px)', backgroundSize: '4px 4px' }
              "
            />
            <ChevronsUp v-if="lbl === 'opportunity'" class="w-3.5 h-3.5 text-mint shrink-0" />
            <Equal v-else-if="lbl === 'fair'" class="w-3.5 h-3.5 text-signal-amber shrink-0" />
            <Layers v-else-if="lbl === 'crowded'" class="w-3 h-3 text-signal-coral shrink-0" />
            <CircleDot v-else class="w-3 h-3 text-[#94A3B8] shrink-0" />
            <span class="font-sans text-[11.5px] text-ink-primary truncate">
              {{ settings.labelText.value[lbl].title }}
            </span>
          </button>

          <!-- Fast Hover (i) Info Trigger Right Next to Label Text -->
          <button
            type="button"
            :aria-label="`Info: ${settings.labelText.value[lbl].title}`"
            class="w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0 transition-colors cursor-help"
            :class="hoveredLegendTip === lbl ? 'bg-mint/20 text-mint' : 'text-ink-muted/80 hover:text-mint hover:bg-mint/15'"
            @mouseenter.stop="hoveredLegendTip = lbl"
            @mouseleave="hoveredLegendTip = null"
            @focus.stop="hoveredLegendTip = lbl"
            @blur="hoveredLegendTip = null"
            @click.stop="hoveredLegendTip = hoveredLegendTip === lbl ? null : lbl"
          >
            <Info class="w-3 h-3" :stroke-width="2.1" />
          </button>

          <button
            type="button"
            class="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-muted shrink-0 min-w-[26px] text-right cursor-pointer"
            @click="toggleLabelFilter(lbl)"
          >
            {{ meta?.label_counts ? meta.label_counts[lbl].toLocaleString('en-US') : MAP_LABEL_COPY[lbl].shortPattern }}
          </button>
        </div>

        <!-- Low Confidence Dashed Row + Fast Hover (i) Info -->
        <div class="pt-1.5 mt-1.5 border-t border-white/[0.08] px-2 flex items-center justify-between gap-1.5">
          <span class="flex items-center gap-2 min-w-0 flex-1">
            <span class="w-6 h-3.5 rounded-[3px] border border-dashed border-[#CBD5E1] bg-[#64748B]/25 shrink-0" />
            <span class="font-sans text-[11.5px] text-ink-secondary truncate">
              {{ settings.confidenceText.value.low.title }}
            </span>
          </span>
          <button
            type="button"
            :aria-label="`Info: ${settings.confidenceText.value.low.title}`"
            class="w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0 transition-colors cursor-help"
            :class="hoveredLegendTip === 'low_confidence' ? 'bg-mint/20 text-mint' : 'text-ink-muted/80 hover:text-mint hover:bg-mint/15'"
            @mouseenter.stop="hoveredLegendTip = 'low_confidence'"
            @mouseleave="hoveredLegendTip = null"
            @focus.stop="hoveredLegendTip = 'low_confidence'"
            @blur="hoveredLegendTip = null"
            @click.stop="hoveredLegendTip = hoveredLegendTip === 'low_confidence' ? null : 'low_confidence'"
          >
            <Info class="w-3 h-3" :stroke-width="2.1" />
          </button>
          <span class="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-muted shrink-0">
            {{ settings.t('DASHED', 'PUTUS') }}
          </span>
        </div>

        <!-- 500 M Scale Line -->
        <div class="pt-2 px-2 flex items-center gap-2.5 text-ink-muted">
          <div class="w-12 h-1.5 border-b border-l border-r border-white/35" aria-hidden="true" />
          <span class="font-mono text-[9px] uppercase tracking-[0.12em]">500 M</span>
        </div>
      </div>

      <!-- LAYER 2: ACTIVE SHOPS CHOROPLETH LEGEND -->
      <div v-else-if="!legendCollapsed && activeLayerId === 'supply'" class="p-3 space-y-2.5">
        <p class="px-1 font-sans text-[11px] leading-snug text-ink-secondary">
          Open coffee shops counted across each area and its 6 neighbors.
        </p>
        <div class="px-1 space-y-1.5">
          <div class="h-2.5 w-full rounded-full" style="background: linear-gradient(90deg, #1B3B3A 0%, #CA8A04 35%, #EA580C 68%, #EF4444 100%);" />
          <div class="flex items-center justify-between font-mono text-[8.5px] uppercase text-ink-muted">
            <span>0 to 2 quiet</span>
            <span>4 to 10 mid</span>
            <span>25+ dense</span>
          </div>
        </div>
        <div class="pt-1.5 border-t border-white/[0.08] px-1 flex items-center gap-2.5 text-ink-muted">
          <div class="w-12 h-1.5 border-b border-l border-r border-white/35" aria-hidden="true" />
          <span class="font-mono text-[9px] uppercase tracking-[0.12em]">500 M</span>
        </div>
      </div>

      <!-- LAYER 3: LOCAL DEMAND CHOROPLETH LEGEND -->
      <div v-else-if="!legendCollapsed && activeLayerId === 'demand'" class="p-3 space-y-2.5">
        <p class="px-1 font-sans text-[11px] leading-snug text-ink-secondary">
          Estimated coffee shops neighborhood demand typically supports (~500 m).
        </p>
        <div class="px-1 space-y-1.5">
          <div class="h-2.5 w-full rounded-full" style="background: linear-gradient(90deg, #1E293B 0%, #0F766E 30%, #14B8A6 58%, #10B981 80%, #00E5A8 100%);" />
          <div class="flex items-center justify-between font-mono text-[8.5px] uppercase text-ink-muted">
            <span>&lt;2 thin</span>
            <span>6 to 16 strong</span>
            <span>30+ hub</span>
          </div>
        </div>
        <div class="pt-1.5 border-t border-white/[0.08] px-1 flex items-center gap-2.5 text-ink-muted">
          <div class="w-12 h-1.5 border-b border-l border-r border-white/35" aria-hidden="true" />
          <span class="font-mono text-[9px] uppercase tracking-[0.12em]">500 M</span>
        </div>
      </div>

      <!-- LAYER 4: ROOM BALANCE (GAP) DIVERGING LEGEND -->
      <div v-else-if="!legendCollapsed && activeLayerId === 'gap'" class="p-3 space-y-2.5">
        <p class="px-1 font-sans text-[11px] leading-snug text-ink-secondary">
          Expected demand minus active shops. Mint shows positive room left.
        </p>
        <div class="px-1 space-y-1.5">
          <div class="h-2.5 w-full rounded-full" style="background: linear-gradient(90deg, #DC2626 0%, #D97706 38%, #64748B 50%, #14B8A6 75%, #00E5A8 100%);" />
          <div class="flex items-center justify-between font-mono text-[8.5px] uppercase text-ink-muted">
            <span>Crowded (-)</span>
            <span>Balanced</span>
            <span>Room (+)</span>
          </div>
        </div>
        <div class="pt-1.5 border-t border-white/[0.08] px-1 flex items-center gap-2.5 text-ink-muted">
          <div class="w-12 h-1.5 border-b border-l border-r border-white/35" aria-hidden="true" />
          <span class="font-mono text-[9px] uppercase tracking-[0.12em]">500 M</span>
        </div>
      </div>

      <!-- LAYER 5: DATA CONFIDENCE LEGEND -->
      <div v-else-if="!legendCollapsed && activeLayerId === 'confidence'" class="p-3 space-y-2">
        <div class="px-1.5 py-1.5 rounded-lg bg-white/[0.03] flex items-center justify-between gap-2">
          <span class="flex items-center gap-2">
            <span class="w-5 h-3.5 rounded-[3px] bg-[#14B8A6]/65 border border-[#14B8A6]" />
            <span class="font-sans text-[11.5px] text-ink-primary">Normal coverage</span>
          </span>
          <span class="font-mono text-[9px] text-ink-muted">{{ confidenceCounts.normal.toLocaleString('en-US') }}</span>
        </div>
        <div class="px-1.5 py-1.5 rounded-lg bg-signal-amber/10 border border-signal-amber/30 flex items-center justify-between gap-2">
          <span class="flex items-center gap-2">
            <span class="w-5 h-3.5 rounded-[3px] bg-signal-amber/70 border border-dashed border-[#FEF3C7]" />
            <span class="font-sans text-[11.5px] text-ink-primary">Low confidence</span>
          </span>
          <span class="font-mono text-[9px] font-bold text-signal-amber">{{ confidenceCounts.low.toLocaleString('en-US') }}</span>
        </div>
        <p class="px-1 font-sans text-[10.5px] leading-snug text-ink-muted">
          Dashed amber zones have fewer than 3 mapped open-data places nearby.
        </p>
      </div>
    </aside>

    <!-- ==================== SELECTED ~500 M COUNTING RING PILL + 4. ASK ASCEND PREVIEW BAR ==================== -->
    <div
      v-if="!loading && !error"
      class="pointer-events-none hidden xl:flex flex-col items-center gap-2.5 absolute bottom-8 left-1/2 z-20 transition-all duration-300"
      :class="drawerOpen ? '-translate-x-[calc(50%+84px)]' : '-translate-x-1/2'"
    >
      <!-- Selected Area 500 m Scope Pill (Screen M2!) -->
      <Transition
        enter-active-class="transition duration-250 ease-signal"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-signal"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="selectedFeature"
          class="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10151E]/95 backdrop-blur-md border border-white/15 shadow-xl"
        >
          <span class="w-2 h-2 rounded-full bg-mint shadow-[0_0_8px_rgba(16,185,129,0.9)]" aria-hidden="true" />
          <span class="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-primary">
            {{ selectedFeature.properties.kecamatan || settings.t('Unnamed area', 'Area tanpa nama') }} · {{ settings.t('THIS AREA + 6 NEIGHBORS, ABOUT 500 M', 'AREA INI + 6 TETANGGA, SEKITAR 500 M') }}
          </span>
        </div>
      </Transition>

      <!-- Bottom Ask Ascend Coming Soon Pill -->
      <button
        type="button"
        class="pointer-events-auto inline-flex items-center gap-3 h-11 px-4 rounded-full bg-[#111620]/95 backdrop-blur-md border border-dashed border-[#334155]/90 hover:border-[#64748B] shadow-2xl transition-colors cursor-pointer"
        @click="openAskTab"
      >
        <Sparkles class="w-4 h-4 text-[#94A3B8] shrink-0" />
        <span class="font-sans text-[12.5px] text-[#94A3B8]">
          {{ settings.t('Ask Ascend: where is there room for a coffee shop near campuses?', 'Tanya Ascend: di mana ada ruang untuk kedai kopi dekat kampus?') }}
        </span>
        <span class="px-2 py-0.5 rounded bg-signal-amber/15 border border-signal-amber/40 font-mono text-[8.5px] font-bold uppercase tracking-[0.08em] text-signal-amber shrink-0">
          {{ settings.t('COMING SOON', 'SEGERA HADIR') }}
        </span>
      </button>
    </div>

    <!-- ==================== 3. UNIFIED 3-TAB COLLAPSIBLE RIGHT DOCK (DESKTOP) / COMPACT HALF-HEIGHT SHEET (< lg) ==================== -->
    <aside
      v-if="!loading && !error"
      aria-label="Area inspector and shortlist panel"
      class="fixed z-30 select-text transition-transform duration-300 ease-signal
             inset-x-2 sm:inset-x-3 bottom-2 h-[48vh] min-h-[268px] max-h-[404px] rounded-2xl
             lg:inset-x-auto lg:top-[84px] lg:bottom-[34px] lg:right-4 lg:h-auto lg:min-h-0 lg:max-h-none lg:w-[402px] lg:rounded-2xl"
      :class="
        drawerOpen
          ? 'translate-y-0 lg:translate-x-0'
          : 'translate-y-[112%] lg:translate-y-0 lg:translate-x-[calc(100%+16px)]'
      "
    >
      <!-- Desktop Square Rounded-Left Edge Arrow Handle (Always visible both when open AND docked on right edge when closed!) -->
      <button
        type="button"
        :aria-label="drawerOpen ? 'Collapse side panel' : 'Expand side panel'"
        :title="drawerOpen ? 'Hide side panel' : 'Open side panel'"
        class="hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 -left-8 w-8 h-14 rounded-l-xl bg-[#111620]/95 backdrop-blur-xl border-y border-l border-white/15 hover:border-mint/65 text-ink-secondary hover:text-mint shadow-[-8px_0_24px_rgba(0,0,0,0.55)] z-40 transition-colors cursor-pointer"
        @click="drawerOpen = !drawerOpen"
      >
        <ChevronRight v-if="drawerOpen" class="w-4 h-4" />
        <ChevronLeft v-else class="w-4 h-4" />
      </button>

      <!-- Main Glass Drawer Shell (Zero X button; clean edge toggle on desktop & tap-bar on compact) -->
      <div class="w-full h-full flex flex-col rounded-2xl bg-[#10151E]/95 backdrop-blur-xl border border-white/15 shadow-[0_24px_75px_rgba(0,0,0,0.78)] overflow-hidden">
        <!-- Compact Top Grab Bar (Tap to collapse cleanly, no X icon) -->
        <button
          type="button"
          aria-label="Collapse panel"
          class="lg:hidden w-full flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-0.5 text-ink-muted hover:text-ink-primary cursor-pointer"
          @click="drawerOpen = false"
        >
          <span class="w-9 h-1 rounded-full bg-white/25" aria-hidden="true" />
          <ChevronDown class="w-3 h-3 opacity-70" />
        </button>

        <!-- 3-Tab Pill Switcher Header (Compact on < lg, Spacious on lg+) -->
        <div
          role="tablist"
          aria-label="Map panel views"
          class="shrink-0 flex items-center gap-1.5 px-3 py-2 lg:px-3.5 lg:py-3 border-b border-white/10 bg-[#0D121A]/90"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="rightTab === 'area'"
            class="h-7 lg:h-8 px-3 lg:px-3.5 rounded-full font-mono text-[9.5px] lg:text-[10px] font-bold uppercase tracking-[0.11em] transition-all cursor-pointer shrink-0"
            :class="
              rightTab === 'area'
                ? 'bg-mint text-[#071510] shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                : 'bg-[#121822] border border-white/15 text-ink-secondary hover:text-ink-primary hover:border-white/30'
            "
            @click="rightTab = 'area'"
          >
            {{ settings.t('AREA', 'AREA') }}
          </button>

          <button
            type="button"
            role="tab"
            :aria-selected="rightTab === 'shortlist'"
            class="h-7 lg:h-8 px-2.5 lg:px-3 rounded-full font-mono text-[9.5px] lg:text-[10px] font-bold uppercase tracking-[0.08em] transition-all cursor-pointer shrink-0"
            :class="
              rightTab === 'shortlist'
                ? 'bg-mint text-[#071510] shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                : 'bg-[#121822] border border-white/15 text-ink-secondary hover:text-ink-primary hover:border-white/30'
            "
            @click="rightTab = 'shortlist'"
          >
            {{ settings.t('SHORTLIST', 'DAFTAR') }} {{ shortlist.items.value.length }}/{{ shortlist.maxItems }}
          </button>

          <button
            type="button"
            role="tab"
            :aria-selected="rightTab === 'ask'"
            class="flex-1 min-w-0 h-7 lg:h-8 px-2 lg:px-2.5 rounded-full border border-dashed font-mono text-[8.5px] lg:text-[9px] uppercase tracking-[0.07em] transition-all cursor-pointer inline-flex items-center justify-center gap-1"
            :class="
              rightTab === 'ask'
                ? 'bg-white/[0.08] border-[#94A3B8]/70 text-[#E2E8F0]'
                : 'bg-white/[0.02] border-[#334155] text-[#94A3B8] hover:border-[#64748B]'
            "
            @click="rightTab = 'ask'"
          >
            <span class="truncate">{{ settings.t('ASK ASCEND', 'TANYA ASCEND') }}</span>
            <span class="px-1 py-0.5 rounded bg-signal-amber/15 font-mono text-[7px] font-bold text-signal-amber shrink-0">
              {{ settings.t('SOON', 'SEGERA') }}
            </span>
          </button>
        </div>

        <!-- TAB BODY 1: SELECTED AREA INSPECTOR -->
        <MapAreaPanel
          v-if="rightTab === 'area' && selectedFeature"
          :feature="selectedFeature"
          :saved="selectedSaved"
          :limit-reached="limitNotice"
          :storage-available="shortlist.storageAvailable.value"
          :distance-km="selectedDistanceKm"
          :has-user-location="Boolean(userLocation)"
          :locating-user="locating"
          :route-visible="routeVisible"
          :route-loading="routeLoading"
          :travel-mode="travelMode"
          :routes-by-mode="routesByMode"
          @back="selectArea(null, false)"
          @toggle-shortlist="handleToggleShortlist"
          @open-ask="openAskTab"
          @request-location="locateUserPosition(true)"
          @toggle-route="handleToggleRoute"
          @select-travel-mode="handleSelectTravelMode"
        />

        <!-- TAB BODY 1 EMPTY STATE (Wireframe-matched clean Area landing state!) -->
        <div
          v-else-if="rightTab === 'area'"
          class="flex-1 flex flex-col justify-between min-h-0 px-6 py-6 overflow-y-auto"
        >
          <div class="flex-1 flex flex-col items-center justify-center text-center py-6">
            <!-- Stepped Ascend Staircase Icon (Matches wireframe silhouette in Luhur Signal Mint) -->
            <div class="w-16 h-16 rounded-2xl bg-mint/[0.07] border border-mint/25 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.14)]">
              <svg
                class="w-11 h-9 text-mint"
                viewBox="0 0 56 44"
                fill="none"
                aria-hidden="true"
              >
                <rect x="23" y="4" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" />
                <rect x="17" y="11" width="22" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" />
                <rect x="11" y="18" width="34" height="8" rx="1.5" stroke="currentColor" stroke-width="1.8" />
                <rect x="5" y="26" width="46" height="9" rx="1.5" stroke="currentColor" stroke-width="1.8" />
              </svg>
            </div>

            <h2 class="mt-5 font-editorial font-semibold text-[23px] text-ink-primary leading-tight tracking-[-0.01em]">
              {{ settings.t('Select an area on the map.', 'Pilih area pada peta.') }}
            </h2>

            <p class="mt-2 font-sans text-[13px] leading-[1.6] text-ink-secondary max-w-[260px]">
              {{ settings.t('Hover to preview, click to open the area card.', 'Arahkan kursor untuk pratinjau, klik untuk membuka kartu area.') }}
            </p>

            <!-- Dashed Clickable Shortlist Reminder Box -->
            <button
              type="button"
              class="mt-8 w-full rounded-2xl bg-white/[0.025] border border-dashed border-[#334155]/90 hover:border-mint/55 hover:bg-mint/[0.04] px-4 py-4 flex items-center gap-3 text-left transition-all cursor-pointer group"
              @click="openShortlistTab"
            >
              <Bookmark class="w-4 h-4 text-mint shrink-0 transition-transform group-hover:scale-110" />
              <span class="font-mono text-[10px] leading-[1.6] uppercase tracking-[0.11em] text-ink-secondary group-hover:text-ink-primary">
                {{ settings.t(`SHORTLIST ${shortlist.items.value.length}/${shortlist.maxItems} · OPEN THE SHORTLIST TAB TO REVIEW SAVED AREAS`, `DAFTAR PENDEK ${shortlist.items.value.length}/${shortlist.maxItems} · BUKA TAB DAFTAR PENDEK UNTUK MELIHAT AREA TERSIMPAN`) }}
              </span>
            </button>
          </div>

          <!-- Clean Pinned Bottom Disclaimer + About Link -->
          <div class="shrink-0 pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-[11px] text-ink-muted">
            <span class="font-sans leading-snug">
              {{ settings.homeCopy.value.footer.disclaimer }}
            </span>
            <button
              type="button"
              class="font-sans font-medium text-ink-secondary hover:text-mint underline underline-offset-4 shrink-0 cursor-pointer transition-colors"
              @click="openAboutModal('labels')"
            >
              {{ settings.t('About', 'Tentang') }}
            </button>
          </div>
        </div>

        <!-- TAB BODY 2: SHORTLIST TAB -->
        <MapShortlistPanel
          v-else-if="rightTab === 'shortlist'"
          :items="shortlist.items.value"
          :max-items="shortlist.maxItems"
          :selected-h3="selectedFeature?.properties.h3 ?? null"
          :quick-picks="quickPicks"
          :light-mode="settings.isMapLight.value"
          @fly-to="flyToShortlist"
          @remove="shortlist.remove"
          @select-feature="(feat) => selectArea(feat, settings.autoZoomOnSelect.value)"
        />

        <!-- TAB BODY 3: ASK ASCEND COMING SOON PREVIEW -->
        <div
          v-else
          class="flex-1 overflow-y-auto px-5 py-5 space-y-4"
        >
          <div class="rounded-2xl bg-white/[0.025] border border-dashed border-[#334155]/90 p-5 space-y-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-signal-amber/15 border border-signal-amber/40 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-signal-amber">
              <Sparkles class="w-3 h-3" />
              <span>COMING SOON · PHASE 2 ASSISTANT</span>
            </span>

            <h2 class="font-editorial font-semibold text-[21px] text-[#CBD5E1] leading-snug">
              Ask Ascend map assistant
            </h2>

            <p class="font-sans text-[13px] leading-[1.64] text-[#94A3B8]">
              In Phase 2, describe your target customers or preferred district in plain English and Ascend will filter mapped neighborhoods, fly the map to matching spots, and run break-even scenarios using only verified map counts.
            </p>

            <div class="space-y-2 pt-1">
              <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[#64748B]">
                PLANNED EXAMPLE PROMPTS
              </p>
              <div class="rounded-xl bg-[#0B0F16]/80 border border-white/[0.07] px-3 py-2 font-sans text-[12px] text-[#94A3B8]">
                "Where could a student open a coffee kiosk near campuses?"
              </div>
              <div class="rounded-xl bg-[#0B0F16]/80 border border-white/[0.07] px-3 py-2 font-sans text-[12px] text-[#94A3B8]">
                "Highlight Opportunity neighborhoods with strong transit access"
              </div>
            </div>

            <p class="pt-1 font-mono text-[9.5px] text-[#64748B]">
              Designed for users 18+. Do not enter personal information.
            </p>
          </div>

          <button
            type="button"
            class="btn-mint w-full h-11 text-[13px] cursor-pointer"
            @click="spotlightOpportunities"
          >
            <span>Spotlight live Opportunity spots now</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- ==================== 6. BOTTOM-RIGHT OPEN DATA ATTRIBUTION STRIP (PRD US-009) ==================== -->
    <footer
      v-if="!loading && !error"
      class="pointer-events-auto absolute bottom-1.5 right-3 sm:right-4 z-20 hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#090C11]/90 backdrop-blur-sm border border-white/[0.08] font-mono text-[8.5px] uppercase tracking-[0.09em] text-ink-muted"
    >
      <template v-if="isSatelliteBasemap">
        <span>ESRI WORLD IMAGERY</span>
        <span>·</span>
      </template>
      <span>OPENFREEMAP</span>
      <span>·</span>
      <span>OPENMAPTILES</span>
      <span>·</span>
      <span>© OPENSTREETMAP CONTRIBUTORS</span>
      <span>·</span>
      <span>OVERTURE MAPS FOUNDATION</span>
      <span>·</span>
      <span>WORLDPOP</span>
    </footer>

    <!-- Shared About Ascend Modal (6-Tab Redesign backed by real meta.json) -->
    <HomeInfoModal
      :open="infoOpen"
      :active-tab="infoTab"
      :meta="meta"
      :loading="loading"
      :error="error"
      :data-version-label="dataVersionLabel"
      :close-label="settings.t('Back to the map', 'Kembali ke peta')"
      :light-mode="settings.isMapLight.value"
      @close="infoOpen = false"
      @update:active-tab="infoTab = $event"
      @retry="retryLoad"
    />

    <!-- Map Settings Modal (Language EN/ID, Map Dark/Light Theme, Reading Helpers, Local Privacy) -->
    <UiSettingsModal
      :open="settingsOpen"
      context="map"
      :light-mode="settings.isMapLight.value"
      :shortlist-count="shortlist.items.value.length"
      @close="settingsOpen = false"
      @theme-changed="handleMapThemeChanged"
      @clear-shortlist="shortlist.clearAll()"
    />
  </div>
</template>
