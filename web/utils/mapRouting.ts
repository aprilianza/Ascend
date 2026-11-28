import { haversineKm } from '~/utils/mapPatterns'

export type TravelMode = 'walking' | 'driving' | 'cycling'

export interface RouteResult {
  mode: TravelMode
  distanceKm: number
  durationMin: number
  straightLineKm: number
  ratio: number
  coordinates: [number, number][]
  source: 'osrm' | 'estimated'
}

// Realistic Bandung urban speeds for instant fallback when public routing endpoints are unreachable
const FALLBACK_SPEED_KMH: Record<TravelMode, number> = {
  walking: 4.8,
  cycling: 13.5,
  driving: 24.0,
}

const FALLBACK_DETOUR: Record<TravelMode, number> = {
  walking: 1.28,
  cycling: 1.32,
  driving: 1.36,
}

const routeCache = new Map<string, RouteResult>()

function buildFallbackRoute(
  from: [number, number],
  to: [number, number],
  mode: TravelMode,
): RouteResult {
  const straight = Math.max(0.05, haversineKm(from, to))
  const distanceKm = straight * FALLBACK_DETOUR[mode]
  const durationMin = Math.max(1, Math.round((distanceKm / FALLBACK_SPEED_KMH[mode]) * 60))

  // Smooth gently arched path so even offline fallback looks clean on the map
  const steps = 16
  const coords: [number, number][] = []
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const arcOffset = Math.min(0.004, Math.hypot(dx, dy) * 0.12)
  const perpX = -dy
  const perpY = dx
  const perpLen = Math.hypot(perpX, perpY) || 1

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const bend = Math.sin(t * Math.PI) * arcOffset
    coords.push([
      from[0] + dx * t + (perpX / perpLen) * bend,
      from[1] + dy * t + (perpY / perpLen) * bend,
    ])
  }

  return {
    mode,
    distanceKm,
    durationMin,
    straightLineKm: straight,
    ratio: Number((distanceKm / straight).toFixed(1)),
    coordinates: coords,
    source: 'estimated',
  }
}

async function fetchOsrmEndpoint(url: string, timeoutMs = 4500): Promise<{
  distance: number
  duration: number
  coordinates: [number, number][]
} | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    const data = (await res.json()) as {
      code?: string
      routes?: Array<{
        distance: number
        duration: number
        geometry?: { coordinates?: [number, number][] }
      }>
    }
    const first = data.routes?.[0]
    const coords = first?.geometry?.coordinates
    if (!first || !coords || coords.length < 2) return null
    return {
      distance: first.distance,
      duration: first.duration,
      coordinates: coords,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetches a real street-following OpenStreetMap route via public OSRM servers for walking, driving, or cycling,
 * with caching and instant geometric fallback so the UI always stays responsive.
 */
export async function fetchRealtimeRoute(
  from: [number, number],
  to: [number, number],
  mode: TravelMode,
): Promise<RouteResult> {
  const key = `${from[0].toFixed(4)},${from[1].toFixed(4)}->${to[0].toFixed(4)},${to[1].toFixed(4)}:${mode}`
  const cached = routeCache.get(key)
  if (cached) return cached

  const straight = Math.max(0.05, haversineKm(from, to))
  // Skip slow inter-island / extreme routes > 150 km and show fast estimate
  if (straight > 150) {
    const est = buildFallbackRoute(from, to, mode)
    routeCache.set(key, est)
    return est
  }

  const coordPair = `${from[0].toFixed(6)},${from[1].toFixed(6)};${to[0].toFixed(6)},${to[1].toFixed(6)}`
  const query = '?overview=full&geometries=geojson'

  // OpenStreetMap.de hosts dedicated real foot / bike / car routing profiles
  const primaryUrls: Record<TravelMode, string[]> = {
    walking: [
      `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordPair}${query}`,
      `https://router.project-osrm.org/route/v1/foot/${coordPair}${query}`,
    ],
    driving: [
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordPair}${query}`,
      `https://router.project-osrm.org/route/v1/driving/${coordPair}${query}`,
    ],
    cycling: [
      `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${coordPair}${query}`,
      `https://router.project-osrm.org/route/v1/bike/${coordPair}${query}`,
    ],
  }

  for (const url of primaryUrls[mode]) {
    const raw = await fetchOsrmEndpoint(url)
    if (raw) {
      const distanceKm = Math.max(0.05, raw.distance / 1000)
      const durationMin = Math.max(1, Math.round(raw.duration / 60))
      const result: RouteResult = {
        mode,
        distanceKm,
        durationMin,
        straightLineKm: straight,
        ratio: Number(Math.max(1, distanceKm / straight).toFixed(1)),
        coordinates: raw.coordinates,
        source: 'osrm',
      }
      routeCache.set(key, result)
      return result
    }
  }

  const fallback = buildFallbackRoute(from, to, mode)
  routeCache.set(key, fallback)
  return fallback
}

export function formatRouteDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function formatRouteDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hrs = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`
}

/**
 * Generates a geodesic polygon ring around [lng, lat] with radius in meters
 * for visualizing 5-minute (~400 m) and 10-minute (~800 m) walking reach rings on the map.
 */
export function buildReachCirclePolygon(
  center: [number, number],
  radiusMeters: number,
  segments = 48,
): [number, number][] {
  const [lng, lat] = center
  const latRad = (lat * Math.PI) / 180
  const dLat = radiusMeters / 111320
  const dLng = radiusMeters / (111320 * Math.cos(latRad))
  const ring: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    ring.push([lng + Math.cos(theta) * dLng, lat + Math.sin(theta) * dLat])
  }
  return ring
}

/**
 * Multi-provider IP geolocation fallback for Windows/desktop browsers where OS location services are unavailable.
 */
export async function fetchApproximateIpLocation(): Promise<{
  lng: number
  lat: number
  city: string | null
} | null> {
  const providers: Array<{
    url: string
    parse: (d: Record<string, unknown>) => { lng: number; lat: number; city: string | null } | null
  }> = [
    {
      url: 'https://get.geojs.io/v1/ip/geo.json',
      parse: (d) => {
        const lat = Number(d.latitude)
        const lng = Number(d.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
        return { lng, lat, city: typeof d.city === 'string' ? d.city : null }
      },
    },
    {
      url: 'https://ipapi.co/json/',
      parse: (d) => {
        const lat = Number(d.latitude)
        const lng = Number(d.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
        return { lng, lat, city: typeof d.city === 'string' ? d.city : null }
      },
    },
  ]

  for (const prov of providers) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3600)
    try {
      const res = await fetch(prov.url, { signal: controller.signal })
      if (!res.ok) continue
      const data = (await res.json()) as Record<string, unknown>
      const parsed = prov.parse(data)
      if (parsed) return parsed
    } catch {
      // Try next fallback provider
    } finally {
      clearTimeout(timer)
    }
  }
  return null
}
