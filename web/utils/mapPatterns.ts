import type { Map as MapLibreMap } from 'maplibre-gl'
import type { AreaFeature, AreaLabel } from '~/types/areas'

export const MAP_PATTERN_IDS: Record<AreaLabel, string> = {
  opportunity: 'ascend-pat-opportunity',
  fair: 'ascend-pat-fair',
  crowded: 'ascend-pat-crowded',
  not_enough_demand: 'ascend-pat-not-enough-demand',
}

export const MAP_LABEL_COPY: Record<
  AreaLabel,
  {
    title: string
    shortPattern: string
    headlineDescription: string
    extraHint?: string
    color: string
    darkStroke: string
    barBg: string
    badgeBg: string
    badgeBorder: string
    badgeText: string
  }
> = {
  opportunity: {
    title: 'Opportunity',
    shortPattern: 'HATCH',
    headlineDescription: 'Fewer coffee shops than demand here typically supports.',
    color: '#10B981',
    darkStroke: '#065F46',
    barBg: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.16)',
    badgeBorder: 'rgba(16, 185, 129, 0.52)',
    badgeText: '#34D399',
  },
  fair: {
    title: 'Fair',
    shortPattern: 'LINES',
    headlineDescription: 'Coffee shops here are about what demand typically supports.',
    color: '#F59E0B',
    darkStroke: '#92400E',
    barBg: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
    badgeBorder: 'rgba(245, 158, 11, 0.5)',
    badgeText: '#FBBF24',
  },
  crowded: {
    title: 'Crowded',
    shortPattern: 'CROSS',
    headlineDescription: 'More coffee shops than demand here typically supports.',
    color: '#EF4444',
    darkStroke: '#7F1D1D',
    barBg: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.16)',
    badgeBorder: 'rgba(239, 68, 68, 0.5)',
    badgeText: '#F87171',
  },
  not_enough_demand: {
    title: 'Not enough demand',
    shortPattern: 'DOTS',
    headlineDescription: 'Too few people nearby for a coffee shop to be sure of steady custom.',
    extraHint: 'A quiet area is not a bad area; it may suit a different business type.',
    color: '#64748B',
    darkStroke: '#334155',
    barBg: '#64748B',
    badgeBg: 'rgba(100, 116, 139, 0.2)',
    badgeBorder: 'rgba(148, 163, 184, 0.45)',
    badgeText: '#CBD5E1',
  },
}

export const ROUTE_TARGET_X_ICON_ID = 'ascend-route-target-x'

function buildPatternCanvas(label: AreaLabel): ImageData {
  const size = 24
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  if (label === 'opportunity') {
    // Calm vivid emerald fill + refined diagonal hatch (HATCH)
    ctx.fillStyle = '#0FA974'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(2, 44, 34, 0.42)'
    ctx.lineWidth = 1.6
    for (let i = -size; i <= size * 2; i += 8) {
      ctx.beginPath()
      ctx.moveTo(i, size)
      ctx.lineTo(i + size, 0)
      ctx.stroke()
    }
  } else if (label === 'fair') {
    // Calm smoked warm amber + gentle horizontal lines (LINES) so 1,696 Fair cells stay serene
    ctx.fillStyle = '#C98512'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(48, 22, 4, 0.28)'
    ctx.lineWidth = 1.35
    for (let y = 4; y < size; y += 8) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y)
      ctx.stroke()
    }
  } else if (label === 'crowded') {
    // Refined coral fill + crisp diagonal cross-hatch mesh (CROSS)
    ctx.fillStyle = '#D94343'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(69, 10, 10, 0.4)'
    ctx.lineWidth = 1.35
    for (let i = -size; i <= size * 2; i += 8) {
      ctx.beginPath()
      ctx.moveTo(i, size)
      ctx.lineTo(i + size, 0)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + size, size)
      ctx.stroke()
    }
  } else {
    // Cool slate fill + clean stippled dots (DOTS)
    ctx.fillStyle = '#55667B'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = 'rgba(241, 245, 249, 0.42)'
    const coords = [
      [4, 4],
      [16, 4],
      [10, 12],
      [22, 12],
      [4, 20],
      [16, 20],
    ]
    for (const [cx, cy] of coords) {
      ctx.beginPath()
      ctx.arc(cx!, cy!, 1.35, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return ctx.getImageData(0, 0, size, size)
}

/**
 * Registers the signature glowing Warm Amber X target icon (echoing the homepage ASCEND treasure-hunt X!)
 * for marking the selected route destination on MapLibre.
 */
export function registerRouteTargetXIcon(map: MapLibreMap): void {
  if (map.hasImage(ROUTE_TARGET_X_ICON_ID)) return
  const size = 76
  const c = size / 2
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Soft outer warm amber halo
  const halo = ctx.createRadialGradient(c, c, 6, c, c, 34)
  halo.addColorStop(0, 'rgba(245, 158, 11, 0.52)')
  halo.addColorStop(0.55, 'rgba(245, 158, 11, 0.16)')
  halo.addColorStop(1, 'rgba(245, 158, 11, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(c, c, 34, 0, Math.PI * 2)
  ctx.fill()

  // Crisp dark contrast disc so the glowing X pops on Dark, Light, and Satellite maps
  ctx.fillStyle = 'rgba(9, 13, 18, 0.88)'
  ctx.beginPath()
  ctx.arc(c, c, 21, 0, Math.PI * 2)
  ctx.fill()

  // Outer golden target ring + 4 compass ticks (exact HeroTreasureRoute detail!)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.arc(c, c, 21, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  const ticks: Array<[number, number, number, number]> = [
    [c, 11, c, 15],
    [c, size - 15, c, size - 11],
    [11, c, 15, c],
    [size - 15, c, size - 11, c],
  ]
  for (const [x1, y1, x2, y2] of ticks) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // Bold glowing Warm Amber X cross
  const xGrad = ctx.createLinearGradient(c - 10, c - 10, c + 10, c + 10)
  xGrad.addColorStop(0, '#FEF08A')
  xGrad.addColorStop(0.5, '#F59E0B')
  xGrad.addColorStop(1, '#D97706')

  ctx.shadowColor = 'rgba(245, 158, 11, 0.9)'
  ctx.shadowBlur = 10
  ctx.strokeStyle = xGrad
  ctx.lineWidth = 5.4
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(c - 9.5, c - 9.5)
  ctx.lineTo(c + 9.5, c + 9.5)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(c + 9.5, c - 9.5)
  ctx.lineTo(c - 9.5, c + 9.5)
  ctx.stroke()

  map.addImage(ROUTE_TARGET_X_ICON_ID, ctx.getImageData(0, 0, size, size), { pixelRatio: 2 })
}

export function registerMapFillPatterns(map: MapLibreMap): void {
  const labels: AreaLabel[] = ['opportunity', 'fair', 'crowded', 'not_enough_demand']
  for (const label of labels) {
    const id = MAP_PATTERN_IDS[label]
    if (!map.hasImage(id)) {
      const imgData = buildPatternCanvas(label)
      map.addImage(id, imgData, { pixelRatio: 2 })
    }
  }
}

export function computeFeatureCentroid(feature: AreaFeature): [number, number] {
  const ring = feature.geometry.coordinates[0] ?? []
  if (ring.length === 0) return [107.6191, -6.9175]
  let lng = 0
  let lat = 0
  const count = Math.max(1, ring.length - 1)
  for (let i = 0; i < count; i++) {
    lng += ring[i]![0]!
    lat += ring[i]![1]!
  }
  return [lng / count, lat / count]
}

/**
 * Finds exact immediate 6 edge-sharing neighbors (about 500 m) of a selected hexagon
 * using shared vertex proximity so no external runtime library is needed in the browser.
 */
export function findNeighborH3Ids(selected: AreaFeature, allFeatures: AreaFeature[]): string[] {
  const selRing = selected.geometry.coordinates[0] ?? []
  if (selRing.length < 3) return []
  const [selLng, selLat] = computeFeatureCentroid(selected)
  const neighbors: string[] = []

  for (const feat of allFeatures) {
    const id = feat.properties.h3
    if (id === selected.properties.h3) continue
    const ring = feat.geometry.coordinates[0]
    if (!ring || ring.length < 3) continue
    // Fast bounding reject (~650m in degrees)
    const first = ring[0]!
    if (Math.abs(first[0]! - selLng) > 0.008 || Math.abs(first[1]! - selLat) > 0.008) continue

    let sharedVerts = 0
    for (let i = 0; i < selRing.length - 1; i++) {
      const sv = selRing[i]!
      for (let j = 0; j < ring.length - 1; j++) {
        const rv = ring[j]!
        if (Math.abs(sv[0]! - rv[0]!) < 0.00018 && Math.abs(sv[1]! - rv[1]!) < 0.00018) {
          sharedVerts += 1
          break
        }
      }
      if (sharedVerts >= 2) break
    }

    if (sharedVerts >= 2) {
      neighbors.push(id)
    }
  }

  return neighbors
}

export function formatExpectedCount(val: number): string {
  if (val < 1) return val.toFixed(1)
  const rounded = Math.round(val)
  if (Math.abs(val - rounded) < 0.15) return String(rounded)
  return val.toFixed(1)
}

/**
 * Computes great-circle distance in kilometers between two [lng, lat] coordinates.
 */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/**
 * Ray-casting point-in-polygon test against a GeoJSON polygon exterior ring.
 */
export function pointInRing(pt: [number, number], ring: number[][]): boolean {
  const [x, y] = pt
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0]
    const yi = ring[i]?.[1]
    const xj = ring[j]?.[0]
    const yj = ring[j]?.[1]
    if (xi === undefined || yi === undefined || xj === undefined || yj === undefined) continue
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Checks whether a user's live [lng, lat] position lies inside any mapped Bandung area,
 * and returns the nearest mapped area plus great-circle distance in km.
 */
export function findUserCoverageFeature(
  lng: number,
  lat: number,
  features: AreaFeature[],
): {
  containing: AreaFeature | null
  nearest: AreaFeature | null
  distanceKm: number
} {
  let containing: AreaFeature | null = null
  let nearest: AreaFeature | null = null
  let minKm = Number.POSITIVE_INFINITY

  for (const feat of features) {
    const ring = feat.geometry.coordinates[0]
    if (!ring || ring.length < 3) continue
    if (!containing && pointInRing([lng, lat], ring)) {
      containing = feat
    }
    const center = computeFeatureCentroid(feat)
    const dist = haversineKm([lng, lat], center)
    if (dist < minKm) {
      minKm = dist
      nearest = feat
    }
  }

  return {
    containing,
    nearest: containing ?? nearest,
    distanceKm: containing ? 0 : (Number.isFinite(minKm) ? minKm : 0),
  }
}

export function formatDistanceKm(km: number): string {
  if (km < 0.25) return 'You are here'
  if (km < 1) return `~${Math.round(km * 1000)} m from you`
  if (km < 10) return `~${km.toFixed(1)} km from you`
  return `~${Math.round(km)} km from you`
}
