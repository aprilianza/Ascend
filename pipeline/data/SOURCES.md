# Data sources (checked 25 Nov 2026)

All downloads are limited to the study bbox from `pipeline/config/area.yaml`
(Kota Bandung + Dayeuhkolot + Bojongsoang + 1 km buffer: lon 107.536–107.7492, lat −7.0243 to −6.827).
Raw files are cached in `pipeline/data/raw/` and are not committed.

| Source | Release / snapshot | Access | Licence |
|---|---|---|---|
| Overture Maps Places | `2026-11-18.0` (latest on 25 Nov 2026) | DuckDB on `s3://overturemaps-us-west-2/release/2026-11-18.0/theme=places/type=place/*` | CDLA Permissive 2.0 (most records), Apache 2.0 (Foursquare), CC0 (AllThePlaces) |
| OpenStreetMap | Overpass snapshot `2026-11-25T15:39:19Z` | Overpass API, 16 tiles, `amenity`/`shop`/`office`/transit tags, `out center` | ODbL 1.0 |
| OSM administrative boundaries | Nominatim + Overpass via OSMnx, 25 Nov 2026 | Kota Bandung r13290062 (30 kecamatan, admin_level 6), Dayeuhkolot r19172317, Bojongsoang r19172316 | ODbL 1.0 |
| WorldPop Global2 R2025A v1 | 2026 estimate, 100 m, constrained, Indonesia | `idn_pop_2026_CN_100m_R2025A_v1.tif` from data.worldpop.org | CC BY 4.0, doi:10.5258/SOTON/WP00839 |

## Schema confirmation

- The Overture `2026-11-18.0` place schema has **no `categories` column**. It has `taxonomy`
  (`primary`, `hierarchy`, `alternates`) and `basic_category`.
  All filters use `taxonomy.primary` (see `pipeline/config/categories.yaml`).
- Full label counts in the bbox: `docs/category_check.csv` (Overture `food_and_drink` labels by
  hierarchy and status; OSM `amenity=cafe|restaurant|fast_food|food_court` by `cuisine`).

## Findings that change the planned filters

1. **`operating_status` is almost always empty.** Of 80,052 Overture places in the bbox,
   79,931 have `operating_status = null`, 119 are `open` and 2 are closed. Keeping only `open`
   would remove 99.8% of the data. The pipeline therefore keeps `open` **and** `null`,
   drops only `permanently_closed` / `temporarily_closed`, and reports the counts
   (`pipeline/data/processed/overture_filter_stats.json`).
2. **`confidence ≥ 0.5`** keeps 45,332 of 80,052 places (57%).
3. **`internet_cafe` sits under `cafe` in the Overture hierarchy** (56 records). Filtering on the
   `cafe` parent would count warnet as coffee shops, so the filter lists exact `taxonomy.primary`
   values only. Same reason for `coffee_roastery` under `coffee_shop`.
4. OSM is much thinner than Overture here: 497 `amenity=cafe` vs 2,534 Overture coffee shops / cafes
   (after filters). After de-duplication: 2,911 coffee shops (2,432 Overture, 479 OSM).

## Coffee shop definition used (D3)

Overture `taxonomy.primary` ∈ {`coffee_shop`, `cafe`, `animal_cafe`, `hong_kong_style_cafe`} and
OSM `amenity=cafe` (excluding `cuisine` bubble_tea, juice, ice_cream, tea). Excluded: internet cafe,
roastery, tea room, bubble tea, juice bar, dessert shop.

## Open item for the team

Nopri: fill in `docs/sample_check_coffee.csv` (30 random records, street imagery or visit) and
report the error rate in `docs/model_report.md` (target ≤ 15%).
