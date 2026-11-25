/**
 * Data contract v1.0.0 — TypeScript mirror of docs/schema/areas.schema.json
 * and docs/schema/meta.schema.json. See docs/data-contract.md.
 *
 * Rule: if a field changes here, it changes in the JSON Schema and in
 * pipeline/tools/contract.py in the same commit.
 */

export const CONTRACT_MAJOR = 1

export type BusinessType = 'coffee_shop' | 'eatery'
export type AreaLabel = 'opportunity' | 'fair' | 'crowded' | 'not_enough_demand'
export type Confidence = 'normal' | 'low'
export type AreaName = 'kota_bandung' | 'telkom_area'

export interface Factor {
  /** Internal feature name, e.g. "pop_k1". Not shown in the UI. */
  feature: string
  /** Plain-English reason shown in the UI, max 60 chars. */
  text: string
  /** SHAP value on log scale. Use only the sign (arrow) and order — never display the number. */
  effect: number
}

export interface AreaProperties {
  /** H3 res-9 cell ID, unique. Use as MapLibre `promoteId`. */
  h3: string
  /** null → show "Unnamed area". Max 40 chars. */
  kecamatan: string | null
  area_name: AreaName
  /** Outlets inside this hexagon only. */
  actual: number
  /** Model estimate for this hexagon only, 1 decimal. */
  expected: number
  /** Outlets within about 500 m (hexagon + 6 neighbours). Shown in the card. */
  actual_k1: number
  /** Demand typically supports, within about 500 m, 1 decimal. Shown in the card. */
  expected_k1: number
  /** expected_k1 − actual_k1, 1 decimal. Positive = room for more. */
  gap: number
  /** Statistical value used for the label. Never shown in the UI. null for not_enough_demand. */
  p_value: number | null
  label: AreaLabel
  confidence: Confidence
  /** Exactly 3, sorted by importance. Title in UI: "What drives demand at this spot". */
  factors: [Factor, Factor, Factor]
}

export interface AreaFeature {
  type: 'Feature'
  geometry: { type: 'Polygon'; coordinates: number[][][] }
  properties: AreaProperties
}

export interface AreaCollection {
  type: 'FeatureCollection'
  contract_version: string
  business_type: BusinessType
  /** true → show a "Sample data" badge; never use for video or screenshots. */
  is_sample: boolean
  generated_at: string
  features: AreaFeature[]
}

export interface Metrics {
  poisson_deviance: number
  mae: number
  spearman: number
}

export interface Meta {
  contract_version: string
  generated_at: string
  is_sample: boolean
  business_types: Array<{
    id: BusinessType
    label: string
    /** false → disabled option with a "Coming soon" badge. */
    available: boolean
    file: string | null
  }>
  data_sources: Array<{ name: string; version: string; license: string; attribution: string }>
  /** null → "Metrics available after the first model run". */
  model: { name: string; validation: string; metrics: Metrics; baseline_metrics: Metrics } | null
  label_params: {
    method: 'poisson_kring1'
    alpha: number
    min_gap: number
    not_enough_demand_max_expected_k1: number
    low_confidence_min_poi: number
  }
  label_counts: Record<AreaLabel, number>
}

/** Arrow for a factor. */
export const factorDirection = (f: Factor): 'up' | 'down' => (f.effect >= 0 ? 'up' : 'down')

/** Throws if the file was produced for a different major contract version. */
export function assertContract(v: string): void {
  const major = Number(v.split('.')[0])
  if (major !== CONTRACT_MAJOR) {
    throw new Error(`Data contract v${v} is not supported (expected v${CONTRACT_MAJOR}.x)`)
  }
}
