# Ascend

A map that shows, for every ~0.1 km² hexagon in Bandung and the Telkom University area, how many
coffee shops are there compared with how many local demand usually supports. Built for STACK 2026
(GDGoC ITB), Case 2, by team Rosun Gank.

- `pipeline/`: Python data pipeline (open data → demand model → labels → GeoJSON)
- `web/`: Nuxt 3 + MapLibre front end (reads the static files in `web/public/data/`)
- `docs/`: data contract, model report, simulation script, figures
- `tasks/`: product requirements (`prd-ascend-v3-id.md`)

## Pipeline setup

Requires Python 3.11+ (developed on 3.12).

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pipeline.run            # whole pipeline, about 15-60 min on first run (downloads)
.venv/bin/python -m pipeline.run --from train   # re-run from a later step using cached data
.venv/bin/ruff check pipeline/
```

Raw downloads are cached in `pipeline/data/raw/` and `pipeline/data/cache/` (not committed).
The last step validates the output against the data contract (`docs/data-contract.md`) and
only then replaces `web/public/data/coffee_shop.geojson` and `meta.json`.

| Step | Module | Output |
|---|---|---|
| 1 Grid (US-002) | `p01_grid.py` | `grid.parquet`, `config/area.yaml`, `docs/figures/grid.png` |
| 2 Sources | `sources.py` | Overture, OSM and WorldPop extracts for the study bbox |
| 3 Places (US-000, US-003) | `p02_places.py` | `docs/category_check.csv`, `coffee_shops.parquet`, `mapped_pois.parquet` |
| 4 Features (US-004) | `p03_features.py` | `features.parquet` |
| 5 Model (US-005) | `p04_train.py` | 5 fold models, `models/metrics.json`, `oof.parquet` |
| 6 Labels (US-006) | `p05_score.py` | `scores.parquet` |
| 7 Explain (US-007) | `p06_explain.py` | `factors.parquet` |
| 8 Export (US-008) | `p07_export.py` | `web/public/data/coffee_shop.geojson`, `meta.json` |

Label-rule simulation (US-006a): `python docs/sim_labels.py`.

## Data sources and licences

| Source | Version | Licence | Attribution |
|---|---|---|---|
| Overture Maps Places | release 2026-11-18.0 | CDLA Permissive 2.0 (most), Apache 2.0 (Foursquare), CC0 (AllThePlaces) | © Overture Maps Foundation |
| OpenStreetMap (Overpass API) | snapshot, see `meta.json` | ODbL 1.0 | © OpenStreetMap contributors |
| WorldPop Global2 R2025A, 100 m constrained | 2026 estimate | CC BY 4.0 | WorldPop, doi:10.5258/SOTON/WP00839 |
| OpenFreeMap basemap | public instance | free, attribution required | OpenFreeMap, OpenMapTiles, © OpenStreetMap contributors |

Details and checks: `pipeline/data/SOURCES.md`.

## Status

| Item | Status |
|---|---|
| Data contract v1.0.0 + sample data | Done |
| Pipeline: grid, places, features, model, labels, SHAP, export (US-000 to US-008) | Done (see `docs/model_report.md`) |
| Label simulation script (US-006a) | Done |
| Category sample check of 30 records (US-003) | In progress (Nopri) |
| Web map, area card, About, shortlist (US-009 to US-013) | In progress (Bill) |
| Deployment (US-014) | Planned |
| Eatery business type, chat, break-even calculator, compare view, rent layer | Planned (after semifinal) |

## AI assistance

The team used an AI coding assistant to draft parts of the pipeline code and documentation.
All code was reviewed, run and checked by the team; every number in the proposal can be
reproduced with the commands above.
