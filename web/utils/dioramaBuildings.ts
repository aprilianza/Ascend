import type { AreaLabel } from '~/types/areas'

export type LandmarkId = 'ashop' | 'kiosk' | 'gedung-sate' | 'ruko'

export interface DioramaBuilding {
  id: LandmarkId
  slotCode: string
  shortLabel: string
  name: string
  stageTag: string
  district: string
  label: AreaLabel
  siteImageSrc: string
  dioramaImageSrc: string
  // Staggered 3D generation pop-up timing (ms)
  generateDelayMs: number
  // Exact millimeter-measured pad anchors on the clean 1376x768 City-Skyline Nusantara landscape
  leftPct: number
  topPct: number
  widthPct: number
  anchorYOffsetPct: number
}

export const DIORAMA_BUILDINGS: DioramaBuilding[] = [
  {
    id: 'ashop',
    slotCode: 'LOC 01',
    shortLabel: 'A-SHOP',
    name: 'A-SHOP Corner Cafe',
    stageTag: '3D Corner Cafe Diorama',
    district: 'Coblong · Dago',
    label: 'opportunity',
    siteImageSrc: '/images/buildings/ashop-site.png',
    dioramaImageSrc: '/images/buildings/ashop-diorama.png',
    generateDelayMs: 260,
    leftPct: 18.8,
    topPct: 44.4,
    widthPct: 19.6,
    anchorYOffsetPct: -80,
  },
  {
    id: 'kiosk',
    slotCode: 'LOC 02',
    shortLabel: 'Kiosk',
    name: 'Starter Coffee Kiosk',
    stageTag: '3D Pioneering Kiosk Diorama',
    district: 'Dayeuhkolot · Bojongsoang',
    label: 'opportunity',
    siteImageSrc: '/images/buildings/kiosk-site.png',
    dioramaImageSrc: '/images/buildings/kiosk-diorama.png',
    generateDelayMs: 560,
    leftPct: 22.8,
    topPct: 87.6,
    widthPct: 21.8,
    anchorYOffsetPct: -78,
  },
  {
    id: 'gedung-sate',
    slotCode: 'LOC 03',
    shortLabel: 'Gedung Sate',
    name: 'Gedung Sate Landmark',
    stageTag: '3D Civic Landmark Diorama',
    district: 'Bandung Wetan',
    label: 'fair',
    siteImageSrc: '/images/buildings/gedung-sate-site.png',
    dioramaImageSrc: '/images/buildings/gedung-sate-diorama.png',
    generateDelayMs: 860,
    leftPct: 82.8,
    topPct: 38.6,
    widthPct: 24.5,
    anchorYOffsetPct: -78,
  },
  {
    id: 'ruko',
    slotCode: 'LOC 04',
    shortLabel: 'Commercial',
    name: 'Commercial Ruko Complex',
    stageTag: '3D Urban Retail Diorama',
    district: 'Lengkong · Sumur Bandung',
    label: 'crowded',
    siteImageSrc: '/images/buildings/ruko-site.png',
    dioramaImageSrc: '/images/buildings/ruko-diorama.png',
    generateDelayMs: 1160,
    leftPct: 78.2,
    topPct: 89.8,
    widthPct: 26.2,
    anchorYOffsetPct: -78,
  },
]
