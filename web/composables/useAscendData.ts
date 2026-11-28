import type { AreaCollection, AreaFeature, BusinessType, Meta } from '~/types/areas'
import { assertContract } from '~/types/areas'

interface DataCacheState {
  meta: Meta | null
  areasByType: Partial<Record<BusinessType, AreaCollection>>
}

const memoryCache: DataCacheState = {
  meta: null,
  areasByType: {},
}

export function formatDataVersion(meta: Meta | null): string {
  if (!meta) return 'Loading...'
  const date = new Date(meta.generated_at)
  const formattedDate = Number.isNaN(date.getTime())
    ? meta.generated_at.slice(0, 10)
    : new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
  return `v${meta.contract_version} · ${formattedDate}`
}

export function useAscendData() {
  const config = useRuntimeConfig()
  const apiBase = (config.public.apiBase as string) || ''

  const meta = useState<Meta | null>('ascend-meta', () => memoryCache.meta)
  const areas = useState<AreaCollection | null>('ascend-areas', () => memoryCache.areasByType.coffee_shop ?? null)
  const loadingMeta = useState<boolean>('ascend-loading-meta', () => false)
  const loadingAreas = useState<boolean>('ascend-loading-areas', () => false)
  const error = useState<string | null>('ascend-data-error', () => null)

  async function getMeta(force = false): Promise<Meta> {
    if (!force && memoryCache.meta) {
      meta.value = memoryCache.meta
      return memoryCache.meta
    }

    loadingMeta.value = true
    error.value = null
    try {
      const url = apiBase ? `${apiBase}/meta` : '/data/meta.json'
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const parsed = (await res.json()) as Meta
      assertContract(parsed.contract_version)
      memoryCache.meta = parsed
      meta.value = parsed
      return parsed
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load map metadata'
      error.value = msg
      throw err
    }
    finally {
      loadingMeta.value = false
    }
  }

  async function getAreas(type: BusinessType = 'coffee_shop', force = false): Promise<AreaCollection> {
    if (!force && memoryCache.areasByType[type]) {
      areas.value = memoryCache.areasByType[type]!
      return memoryCache.areasByType[type]!
    }

    loadingAreas.value = true
    error.value = null
    try {
      const currentMeta = meta.value ?? (await getMeta(force))
      const entry = currentMeta.business_types.find(b => b.id === type)
      if (!entry || !entry.available || !entry.file) {
        throw new Error(`Business type ${type} is not available yet.`)
      }

      const url = apiBase
        ? `${apiBase}/areas?business_type=${encodeURIComponent(type)}`
        : `/data/${entry.file}`

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const parsed = (await res.json()) as AreaCollection
      assertContract(parsed.contract_version)
      memoryCache.areasByType[type] = parsed
      areas.value = parsed
      return parsed
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load map data'
      error.value = msg
      throw err
    }
    finally {
      loadingAreas.value = false
    }
  }

  async function loadAll(type: BusinessType = 'coffee_shop', force = false) {
    try {
      await getMeta(force)
      await getAreas(type, force)
    }
    catch {
      // Error state already captured in ref
    }
  }

  const totalCells = computed(() => {
    if (!meta.value) return 0
    const counts = meta.value.label_counts
    return counts.opportunity + counts.fair + counts.crowded + counts.not_enough_demand
  })

  const dataVersionLabel = computed(() => formatDataVersion(meta.value))

  const coblongHighlight = computed<AreaFeature | null>(() => {
    if (!areas.value) return null
    const coblongCells = areas.value.features.filter(
      f => (f.properties.kecamatan ?? '').toLowerCase() === 'coblong',
    )
    if (coblongCells.length === 0) return areas.value.features[0] ?? null
    const sorted = [...coblongCells].sort((a, b) => b.properties.gap - a.properties.gap)
    return sorted[0] ?? null
  })

  const topOpportunities = computed<AreaFeature[]>(() => {
    if (!areas.value) return []
    return areas.value.features
      .filter(f => f.properties.label === 'opportunity')
      .sort((a, b) => b.properties.gap - a.properties.gap)
      .slice(0, 6)
  })

  return {
    meta,
    areas,
    loadingMeta,
    loadingAreas,
    loading: computed(() => loadingMeta.value || loadingAreas.value),
    error,
    totalCells,
    dataVersionLabel,
    coblongHighlight,
    topOpportunities,
    getMeta,
    getAreas,
    loadAll,
  }
}
