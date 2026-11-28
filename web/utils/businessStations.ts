export type BusinessStationId =
  | 'gerobak'
  | 'kios'
  | 'warung'
  | 'lapak'
  | 'kelontong'
  | 'ruko'
  | 'kaki-lima'
  | 'pasar'

export interface BusinessStationMeta {
  id: BusinessStationId
  label: string
  hint: string
  defaultSide: 'left' | 'right'
}

export const BUSINESS_STATIONS: readonly BusinessStationMeta[] = [
  { id: 'gerobak', label: 'GEROBAK', hint: 'Mobile street coffee', defaultSide: 'left' },
  { id: 'kios', label: 'KIOS', hint: 'Compact corner booth', defaultSide: 'left' },
  { id: 'warung', label: 'WARUNG', hint: 'Neighborhood regular', defaultSide: 'left' },
  { id: 'lapak', label: 'LAPAK', hint: 'Pop-up daily spot', defaultSide: 'left' },
  { id: 'kelontong', label: 'KELONTONG', hint: 'Everyday block shop', defaultSide: 'right' },
  { id: 'ruko', label: 'RUKO', hint: 'Commercial row store', defaultSide: 'right' },
  { id: 'kaki-lima', label: 'KAKI LIMA', hint: 'Evening sidewalk hub', defaultSide: 'right' },
  { id: 'pasar', label: 'PASAR', hint: 'Local market anchor', defaultSide: 'right' },
] as const
