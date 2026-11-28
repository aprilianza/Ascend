# Ascend

A map that shows, for every ~0.1 km² hexagon in Bandung and the Telkom University area, how many
coffee shops are there compared with how many local demand usually supports. Built for STACK 2026
(GDGoC ITB), Case 2, by team Rosun Gank.

**Live demo:** https://ascend-rose-nine.vercel.app/ (no account or login needed; open **Open the map**).

- `pipeline/`: Python data pipeline (open data → demand model → labels → GeoJSON)
- `web/`: Nuxt 3 + MapLibre front end (reads the static files in `web/public/data/`)
- `docs/`: JSON schemas, model report, simulation script, figures

## Setup

### Supported environment

| Part | Requirement | Tested on |
|---|---|---|
| Web app | Node.js 20 or later, npm; a current desktop or mobile browser with WebGL | Node 24, Chromium (1440 px desktop and 375 px mobile) |
| Data pipeline | Python 3.11 or later, about 500 MB free disk for raw downloads | Python 3.12 on macOS |

No API keys or secrets are needed. Nothing secret is committed to this repository.

### Web app (local)

```bash
cd web
npm install
npm run dev          # http://localhost:3000
```

Production build and local fallback (the same static site that is deployed):

```bash
cd web
npm run generate     # writes .output/public
npm run preview
```

Deployment: Vercel (`web/vercel.json`, root directory `web`). `netlify.toml` is kept as a backup host.

### Data pipeline (optional)

Only needed to rebuild the map data; the web app already ships the latest output. Requires Python 3.11+ (developed on 3.12).

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pipeline.run            # whole pipeline, about 15-60 min on first run (downloads)
.venv/bin/python -m pipeline.run --from train   # re-run from a later step using cached data
.venv/bin/ruff check pipeline/
```

Raw downloads are cached in `pipeline/data/raw/` and `pipeline/data/cache/` (not committed).
The last step validates the output against the JSON schemas in `docs/schema/` and
only then replaces `web/public/data/coffee_shop.geojson` and `meta.json`.

| Step | Module | Output |
|---|---|---|
| 1 Grid | `p01_grid.py` | `grid.parquet`, `config/area.yaml`, `docs/figures/grid.png` |
| 2 Sources | `sources.py` | Overture, OSM and WorldPop extracts for the study bbox |
| 3 Places | `p02_places.py` | `docs/category_check.csv`, `coffee_shops.parquet`, `mapped_pois.parquet` |
| 4 Features | `p03_features.py` | `features.parquet` |
| 5 Model | `p04_train.py` | 5 fold models, `models/metrics.json`, `oof.parquet` |
| 6 Labels | `p05_score.py` | `scores.parquet` |
| 7 Explain | `p06_explain.py` | `factors.parquet` |
| 8 Export | `p07_export.py` | `web/public/data/coffee_shop.geojson`, `meta.json` |

Label-rule simulation: `python docs/sim_labels.py`.

## Data sources and third-party resources

| Source | Version | Licence | Attribution |
|---|---|---|---|
| Overture Maps Places | release 2026-11-18.0 | CDLA Permissive 2.0 (most), Apache 2.0 (Foursquare), CC0 (AllThePlaces) | © Overture Maps Foundation |
| OpenStreetMap (Overpass API) | snapshot, see `meta.json` | ODbL 1.0 | © OpenStreetMap contributors |
| WorldPop Global2 R2025A, 100 m constrained | 2026 estimate | CC BY 4.0 | WorldPop, doi:10.5258/SOTON/WP00839 |
| OpenFreeMap basemap | public instance | free, attribution required | OpenFreeMap, OpenMapTiles, © OpenStreetMap contributors |
| Esri World Imagery (optional satellite view) | live tiles | Esri terms of use, attribution required | Esri, Maxar, Earthstar Geographics |

Details and checks: `pipeline/data/SOURCES.md`.

Online services called by the web app at run time:

| Service | Used for | When |
|---|---|---|
| OpenFreeMap tiles, Esri World Imagery | basemap and optional satellite view | always / when satellite is selected |
| OSRM public routers (`routing.openstreetmap.de`, `router.project-osrm.org`) | walking, cycling and driving route to a selected area | only when a route is requested; falls back to a straight-line estimate |
| GeoJS, ipapi.co | approximate city-level location from the IP address | only after "Locate me" and only if device location fails; the map says so |
| Google Fonts | Josefin Sans and Manrope | page load |

Main libraries: Nuxt 3, Vue 3, MapLibre GL JS, three.js, Tailwind CSS, lucide-vue-next (web);
LightGBM, SHAP, scikit-learn, statsmodels, SciPy, h3, GeoPandas, OSMnx, DuckDB, rasterio (pipeline,
pinned in `requirements.txt`).

## Status

| Item | Status |
|---|---|
| Data pipeline: grid, places, features, model, labels, SHAP explanations, export | Done (see `docs/model_report.md`) |
| Web map: hexagon map, area card with top factors, About, shortlist, routes, locate me | Done |
| Deployment on Vercel | Done |
| Category sample check of 30 records (target error ≤ 15%) | In progress |
| Eatery business type, chat assistant, break-even calculator, compare view, rent layer | Planned, not built |

**Simulated or synthetic parts, clearly identified:**

- `docs/sim_labels.py` uses synthetic hexagons to compare label rules. Its numbers are not Bandung data.
- `pipeline/tools/make_sample_data.py` makes synthetic sample data for front-end work. The deployed map
  uses the real pipeline output (`meta.json` has `is_sample: false`); if sample data is ever loaded,
  the map shows a "sample data" badge.

## Known limitations

1. The model learns the usual relation between demand proxies and coffee shops in Bandung. A gap means
   "different from the city pattern", not proven unmet demand.
2. Informal stalls and new shops are often missing from open data. Overture `operating_status` is almost
   always empty, so some closed places may still be counted.
3. Hotel and shop counts also reflect how completely an area is mapped.
4. WorldPop 2026 population is a modelled estimate.
5. Labels are conservative: 18 opportunity cells out of 1,976. They are candidates for a field check,
   not recommendations.
6. Only the coffee-shop business type is available.

## Team and contributions

| Member | Role | Contribution |
|---|---|---|
| Azziz Abdul Ghofur | Lead, backend and AI | Team lead; backend and chat assistant (planned after the semifinal) |
| Aprilianza Muhammad Yusup | Product and ML lead | Data pipeline, demand model, label rule, SHAP explanations, model report, front-end fixes |
| Bill Stephen Sembiring | Front end and UI/UX | Visual design, landing page, interactive map and area card |
| Nopri Anita Libertiana Saragih | Data quality and research | Source checks, category sample check, field-check planning |

## AI assistance

| Tool | Role |
|---|---|
| Claude Code (Anthropic) | Drafted parts of the data pipeline, model and label code, the model report and README, and front-end fixes |
| Gemini (Google) | Drafted parts of the front-end code and interface text |

All AI-drafted work was reviewed, run and tested by the team, and the team can explain every part of it.
Every number in the proposal can be reproduced with the commands above.

## Versions

| Version | Commit |
|---|---|
| Semifinal submission | to be recorded at submission |
