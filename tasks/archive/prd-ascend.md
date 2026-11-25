> **DIGANTIKAN (24 Nov 2026).** File ini arsip PRD v2 dan tidak berlaku lagi. Acuan yang berlaku: `tasks/prd-ascend-v3-id.md`.

# PRD: Ascend — Demand vs. Competition Map for New Food Businesses in Bandung

**Team:** Rosun Gank · **Competition:** STACK 2026 (GDGoC ITB) · **Case:** Case 2 — Stronger Communities and Everyday Services
**Status:** Draft v2 (open questions resolved, review fixes applied) · **Last updated:** 22 Nov 2026

---

## 1. Introduction / Overview

People opening a small food or beverage business in Bandung usually pick a location by intuition: a busy street, a friend's tip, or whatever space is vacant. They cannot see whether an area already has more similar outlets than local demand can support, and they find out only after paying rent.

**Ascend** is a free web map that shows where a new coffee shop still has room. The map divides the study area into small hexagons (~0.1 km² each). For each hexagon, Ascend:

1. Counts how many coffee shops **already operate** there (from open map data).
2. Estimates how many coffee shops the area's **demand** typically supports (from population, campuses, offices, and transit access), using a machine-learning model.
3. Compares the two numbers and labels the hexagon **"opportunity"**, **"fair"**, or **"crowded"**, with the three strongest reasons behind the estimate.

Users pick a business type, explore the labelled map, open an area card that explains the label, and save a shortlist of candidate areas.

This PRD covers the whole product but splits the work into three phases that match the competition timeline:

| Phase | Deadline | What ships |
|---|---|---|
| **P1 — Semifinal** | 30 Nov 2026 | Data pipeline, coffee shop model, static web map with area cards and shortlist |
| **P2 — Pre-Final** | 16 Dec 2026 (before Final Day) | FastAPI backend, eatery model, AI chat assistant, user validation study, field check |
| **P3 — Final Day** | 16 Dec 2026 (build session) | Area comparison view, rental-price layer from consenting owners |

> **Competition rule reminder:** Planned features must never be shown as finished. Anything not built yet must be visibly marked in the UI ("Coming soon"), in the README, and in the video.

### Glossary (for junior developers)

| Term | Meaning |
|---|---|
| **H3** | Uber's hexagonal grid system. Each hexagon has a string ID (e.g. `8965b1a3a2bffff`). We use **resolution 9** (average area ≈ 0.105 km²). |
| **k-ring** | The hexagon plus its neighbours up to *k* steps away. `k=1` = the hexagon + its 6 neighbours. |
| **Actual count** | Number of coffee shops currently mapped inside a hexagon. |
| **Expected count** | Number of coffee shops the model predicts for a hexagon based only on demand features. |
| **Gap** | `expected − actual`. Positive = room for more outlets; negative = more outlets than demand typically supports. |
| **OOF (out-of-fold) prediction** | A prediction made for a hexagon by a model that **did not see that hexagon during training**. Prevents the model from just memorising the actual count. |
| **SHAP** | A method that explains how much each feature pushed a single prediction up or down. |
| **Demand feature** | A feature describing potential customers (people, students, workers, commuters) — never a count of other food outlets. |

---

## 2. Goals

- **G-1:** Show every hexagon in the study area (Kota Bandung + Telkom University area) with an "opportunity / fair / crowded" label for coffee shops by the semifinal (30 Nov 2026).
- **G-2:** Explain each label with the top 3 contributing factors in plain English, so a non-technical first-time owner understands *why*.
- **G-3:** Let a user go from opening the site to a saved shortlist of 3 areas in **under 2 minutes**.
- **G-4:** Produce a demand model that **beats a population-only baseline** on spatially cross-validated error (see §8), with metrics documented for the proposal.
- **G-5:** Flag low-confidence areas honestly, so users know where open data is likely incomplete (e.g. informal stalls).
- **G-6:** Keep the whole pipeline reproducible from raw open data with one command per stage, so judges can verify originality and the team can rebuild quickly on Final Day.

---

## 3. User Stories

Primary user: **a first-time owner of a small food or beverage business in Bandung** (e.g. a student opening a coffee kiosk) who cannot afford professional location analysis.
Secondary "user": **the developer** who builds and maintains the data pipeline.

Stories are grouped by phase. Each story should be small enough for one focused work session.

---

### Phase 1 — Semifinal (due 30 Nov 2026)

Phase 1 has more work than 9 days comfortably allow, so every story has a priority. **Must** stories are required for the semifinal video. **Should** stories are done if Must stories are finished. **Could** stories may be shown as a labelled Figma mockup instead.

| Priority | Stories | Owner |
|---|---|---|
| **Must** | US-001 – US-009, US-011, US-014 | US-001 – US-008: Aprilianza · US-009, US-011, US-014: TBD |
| **Should** | US-010, US-013 | TBD |
| **Could** | US-012 (shortlist), `kecamatan` column in US-002 | US-012: TBD · `kecamatan`: Aprilianza |

#### US-001: Set up the repository and project structure
**Description:** As a developer, I need a clean repository with a clear folder layout so the team can work in parallel and the committee can review the development history.

**Acceptance Criteria:**
- [ ] Git repository initialised with folders `pipeline/`, `web/`, `api/` (empty placeholder for P2), `docs/`
- [ ] `.gitignore` excludes raw data files, `.env`, virtual environments, `node_modules/`, and build output
- [ ] `.env.example` exists listing every required variable (no real values)
- [ ] Root `README.md` with project summary, setup steps for `pipeline/` and `web/`, data sources with licences, and an "AI assistance" section
- [ ] `pipeline/` has a pinned dependency file (e.g. `requirements.txt` or `pyproject.toml`) for Python 3.11
- [ ] Lint passes (`ruff check pipeline/`)

#### US-002: Define the study area and H3 grid
**Description:** As a developer, I need a fixed set of H3 hexagons covering Kota Bandung and the Telkom University area so every later step uses the same grid.

**Acceptance Criteria:**
- [ ] Kota Bandung boundary is loaded from OpenStreetMap (administrative boundary, saved to `pipeline/data/boundaries/`)
- [ ] Telkom University area is a **3 km radius circle** (decided 22 Nov 2026) around the main campus point (set in `pipeline/config/area.yaml`, default `-6.9733, 107.6303`; verify the point on a map before use)
- [ ] The union of both shapes is filled with H3 resolution 9 cells; result saved as `pipeline/data/processed/grid.parquet` with columns `h3`, `area_name` (`kota_bandung` or `telkom_area`), `kecamatan`
- [ ] *(Could)* `kecamatan` (district name) is filled from OSM district boundaries; cells outside any known district get `null`. If skipped, the column exists and is all `null`
- [ ] Script prints the number of cells (expected roughly 1,500–2,500) and saves a quick-look PNG map to `docs/figures/grid.png`
- [ ] Lint passes

#### US-003: Download and clean coffee shop locations (target data)
**Description:** As a developer, I need a clean, de-duplicated list of coffee shops so the "actual count" per hexagon is as accurate as open data allows.

**Acceptance Criteria:**
- [ ] Overture Maps Places (latest release; release name recorded in `pipeline/data/SOURCES.md`) is queried for the study-area bounding box using DuckDB
- [ ] OSM points/polygons with `amenity=cafe` are downloaded for the same bounding box
- [ ] A config file `pipeline/config/categories.yaml` maps each business type to its source categories. **Coffee shop definition (decided 22 Nov 2026):** any place that mainly sells coffee or drinks, including small coffee kiosks/stands. Include Overture `coffee_shop`, `cafe`, and any coffee kiosk/stand category present in the release; OSM `amenity=cafe`. **Exclude** pure roasteries (e.g. Overture `coffee_roastery`), dessert/ice-cream/bakery categories, and OSM `shop=coffee` (coffee-bean retail)
- [ ] Category names are verified against the actual Overture release before use (list of distinct categories in the study area saved to `pipeline/data/overture_categories.csv`)
- [ ] Overture records with `confidence` below a configurable threshold (default `0.5`) are dropped
- [ ] Duplicates across sources are merged: two records within **30 m** count as one if `rapidfuzz.fuzz.token_set_ratio(name_a, name_b) ≥ 80` after normalising names (lowercase, punctuation removed, generic words such as "kopi", "coffee", "cafe", "kedai" removed). Records with no name are merged only if within 10 m
- [ ] Output `pipeline/data/processed/coffee_shops.parquet` with columns `id`, `name`, `lat`, `lon`, `source`, `h3`
- [ ] Script prints counts before and after de-duplication per source
- [ ] Lint passes

#### US-004: Build demand features per hexagon
**Description:** As a developer, I need demand features for every hexagon so the model can estimate how many outlets an area typically supports.

**Acceptance Criteria:**
- [ ] Population: WorldPop 100 m population raster for Indonesia is summed into each hexagon → `pop`. **Use the latest available year as-is, without rescaling** (decided 22 Nov 2026); the year is recorded in `SOURCES.md` and shown in the About panel
- [ ] From OSM, the following are counted per hexagon: universities/colleges (`amenity=university|college`), schools (`amenity=school`), offices (`office=*` or `building=office`), bus/angkot stops (`highway=bus_stop`, `public_transport=platform`), train stations (`railway=station`)
- [ ] For each raw feature, a k-ring sum is added for `k=1` and `k=2` (e.g. `pop_k1`, `pop_k2`, `campus_k2`)
- [ ] Distance features are added: `dist_campus_m` and `dist_station_m` (metres from hexagon centre to nearest feature)
- [ ] **No food or beverage outlet counts are used as features** (enforced by a check that fails the script if any feature column name contains `cafe`, `coffee`, `restaurant`, `food`, or `eatery`)
- [ ] Output `pipeline/data/processed/features.parquet`, one row per `h3`, no missing values (missing counts filled with 0)
- [ ] Lint passes

#### US-005: Train the coffee shop demand model with spatial cross-validation
**Description:** As a developer, I need a model that predicts the expected number of coffee shops from demand features, evaluated in a way that does not leak information between nearby hexagons.

**Acceptance Criteria:**
- [ ] Model: LightGBM regressor with `objective="poisson"` (target = actual coffee shop count per hexagon)
- [ ] Spatial cross-validation: hexagons are grouped by their **H3 resolution 7 parent**, and a 5-fold `GroupKFold` is used so neighbouring hexagons stay in the same fold
- [ ] A **baseline model** (Poisson GLM using only `pop_k1`) is evaluated with the same folds
- [ ] Metrics reported for both models: mean Poisson deviance, MAE, and Spearman correlation between expected and actual
- [ ] Each hexagon's **expected count is its OOF prediction** (from the fold where it was held out), not an in-sample prediction
- [ ] All 5 fold models are saved to `pipeline/models/coffee_shop_fold{0-4}.lgb`, together with a mapping `h3 → fold` (needed so each hexagon is explained by the same model that produced its expected count, see US-007)
- [ ] Metrics are written to `docs/model_report.md` (table + short interpretation) and `pipeline/models/metrics.json`
- [ ] Random seed is fixed so results are reproducible
- [ ] Lint passes

#### US-006: Compute gap, labels, and confidence
**Description:** As a user, I want each area labelled in simple terms so I can quickly see where competition is low or high.

**Acceptance Criteria:**
- [ ] `gap = expected − actual` and `ratio = (actual + 1) / (expected + 1)` are computed per hexagon
- [ ] Labels follow these fixed rules (thresholds stored in `pipeline/config/labels.yaml`; decided 22 Nov 2026):
  - `opportunity` if `gap ≥ 1` **and** `ratio ≤ 0.67`
  - `crowded` if `gap ≤ −1` **and** `ratio ≥ 1.5`
  - `fair` otherwise
- [ ] Hexagons with very low demand (`pop_k1` below the 10th percentile **and** expected < 0.3) are labelled `not_enough_demand` and shown grey instead of "opportunity"
- [ ] `confidence` is `low` if the hexagon's k-ring 1 contains fewer than a configurable number of mapped POIs (default 3), otherwise `normal`. A "mapped POI" is any Overture place (all categories, after the confidence filter) plus any OSM node/way with an `amenity`, `shop`, or `office` tag, de-duplicated as in US-003. Reason: sparse mapping usually means outlets (especially informal stalls) are missing
- [ ] Script prints label counts and shares. If any single label covers **more than 60%** of hexagons, the script prints a warning; thresholds are then tuned in `labels.yaml` and the final values plus the reason are recorded in `docs/model_report.md`
- [ ] Output saved to `pipeline/data/processed/scores.parquet`
- [ ] Example: a hexagon with actual = 0 and expected = 2.4 → gap 2.4, ratio 0.29 → `opportunity`
- [ ] Lint passes

#### US-007: Generate plain-English explanations with SHAP
**Description:** As a user, I want to see the three main reasons behind an area's estimate so I can trust (or question) the label.

**Acceptance Criteria:**
- [ ] SHAP `TreeExplainer` is run for every hexagon using **the fold model in which that hexagon was held out** (from US-005), so the factors explain the same expected count shown in the area card
- [ ] Check: for each hexagon, the SHAP base value plus the sum of SHAP values matches the model's raw (log-scale) prediction within 0.01
- [ ] For each hexagon, the 3 features with the largest absolute SHAP value are kept, with their sign
- [ ] Each feature has a human-readable template in `pipeline/config/feature_labels.yaml`, e.g. `pop_k1` → "Many residents nearby" (positive) / "Few residents nearby" (negative)
- [ ] Each factor is stored as `{ "feature": "pop_k1", "text": "Many residents nearby", "effect": +0.8 }` where `effect` is the SHAP value rounded to 1 decimal. Note: LightGBM Poisson SHAP values are on the log scale, so `effect` is used only for ranking and direction (↑/↓), never shown to users as "+0.8 outlets"
- [ ] Spot check: for 5 random hexagons, the explanation text matches the direction of the raw feature values (documented in `docs/model_report.md`)
- [ ] Lint passes

#### US-008: Export map data for the web app
**Description:** As a developer, I need one static file per business type that the web app can load without a backend.

**Acceptance Criteria:**
- [ ] Export `web/public/data/coffee_shop.geojson` (polygons from H3 cells) with properties: `h3`, `kecamatan`, `area_name`, `actual`, `expected` (1 decimal), `gap` (1 decimal), `label`, `confidence`, `factors` (array of 3)
- [ ] Export `web/public/data/meta.json` with: data release names/years, model metrics summary, label thresholds, generation timestamp
- [ ] GeoJSON file is under 3 MB (coordinates rounded to 5 decimals)
- [ ] A single command runs the whole pipeline end-to-end (e.g. `make all` or `python -m pipeline.run`), documented in the README
- [ ] Lint passes

#### US-009: Show the labelled map
**Description:** As a first-time owner, I want to see a map of Bandung coloured by opportunity so I can spot promising areas at a glance.

**Acceptance Criteria:**
- [ ] Nuxt 3 app with MapLibre GL JS renders the **OpenFreeMap** basemap (no API key; decided 22 Nov 2026) centred on Bandung
- [ ] Hexagons from `coffee_shop.geojson` are drawn with fill colours: opportunity = green, fair = yellow, crowded = red, not_enough_demand = grey
- [ ] Low-confidence hexagons are drawn with lower opacity and a dashed outline
- [ ] A legend explains all four colours and the low-confidence style
- [ ] Map attribution shows OpenStreetMap, Overture Maps, and WorldPop
- [ ] Map is usable at 375 px width (mobile) and desktop
- [ ] Typecheck/lint passes (`nuxi typecheck`, ESLint)
- [ ] Verify in browser using dev-browser skill

#### US-010: Choose a business type
**Description:** As a user, I want to pick my business type so the map shows competition for the right kind of outlet.

**Acceptance Criteria:**
- [ ] A selector at the top of the page shows "Coffee shop" (active, selected by default) and "Eatery" (disabled, with a "Coming soon" badge)
- [ ] Selecting a type loads `/data/<type>.geojson`; a loading indicator is shown while fetching
- [ ] If the file fails to load, an error message with a "Retry" button is shown
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

#### US-011: Open an area card
**Description:** As a user, I want to click an area and see why it got its label so I can judge whether it suits me.

**Acceptance Criteria:**
- [ ] Clicking a hexagon highlights it and opens an area card (side panel on desktop, bottom sheet on mobile)
- [ ] The card shows: district name (or "Unnamed area"), label badge, "Coffee shops here: X", "Demand typically supports: about Y", and the 3 factors with ↑ / ↓ arrows
- [ ] If `confidence = low`, the card shows: "Low confidence — open data may miss some outlets here, such as informal stalls."
- [ ] The card has a short footnote: "Estimate based on open data. Not financial advice." with a link to an "About the method" section
- [ ] Clicking outside or pressing Esc closes the card
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

#### US-012: Save a shortlist of areas
**Description:** As a user, I want to save interesting areas to a shortlist so I can compare and visit them later.

**Acceptance Criteria:**
- [ ] The area card has a "Save to shortlist" button; it changes to "Saved ✓" when the area is already saved
- [ ] A shortlist panel lists saved areas with district name, label badge, and actual vs expected
- [ ] Clicking a shortlist item flies the map to that hexagon and opens its card
- [ ] Each item has a "Remove" button
- [ ] Maximum 10 items; trying to add an 11th shows a message
- [ ] Shortlist is stored in `localStorage` and survives a page reload; if `localStorage` is unavailable the app still works (shortlist just isn't persisted)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

#### US-013: "About the method" and honesty markers
**Description:** As a user (and as a judge), I want to understand how estimates are made and what is not built yet, so I can trust the product.

**Acceptance Criteria:**
- [ ] An "About" panel explains in ≤ 200 words: data sources, what "expected" means, label rules, known limitations (missing informal stalls, data year)
- [ ] The panel shows model metrics and data versions from `meta.json`
- [ ] Every not-yet-built feature visible in the UI (Eatery, AI assistant) carries a "Coming soon" badge and cannot be used
- [ ] The README has a "Status" table listing each feature as Done / In progress / Planned
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

#### US-014: Deploy the prototype
**Description:** As the team, we need a public link to the prototype for the semifinal video and proposal.

**Acceptance Criteria:**
- [ ] `nuxt generate` builds a static site with the data files included
- [ ] Site is deployed to a free static host (Vercel or Netlify) and reachable via HTTPS
- [ ] First meaningful map render under 3 s on a simulated "Fast 4G" connection
- [ ] No API keys or secrets in the built files or the repository
- [ ] Deployment URL added to the README
- [ ] Verify in browser using dev-browser skill

---

### Phase 2 — Pre-Final (7–16 Dec 2026)

#### US-015: Serve data through a FastAPI backend
**Description:** As a developer, I need an API so the chat assistant and future features can query area data in one place.

**Acceptance Criteria:**
- [ ] FastAPI app in `api/` with endpoints:
  - `GET /areas?business_type=coffee_shop` → GeoJSON (same schema as US-008)
  - `GET /areas/{h3}?business_type=coffee_shop` → one area's properties, 404 if unknown
  - `GET /meta` → contents of `meta.json`
- [ ] Data is loaded once at startup from the pipeline output files
- [ ] Input validation: unknown `business_type` returns 422 with a clear message
- [ ] Automated tests for each endpoint (`pytest`) pass
- [ ] Web app switches from static files to the API via an environment variable, with static files as fallback
- [ ] Lint passes

#### US-016: Add the eatery business type
**Description:** As an owner opening a small eatery, I want the same map for eateries.

**Acceptance Criteria:**
- [ ] `categories.yaml` defines eatery categories. **Eatery definition (decided 22 Nov 2026):** warung makan, rumah makan, and casual restaurants. **Exclude** fast-food chains and fine dining, because the target users are small independent owners. Exact Overture/OSM categories (e.g. OSM `amenity=restaurant` without a `brand` tag of a known chain; `amenity=fast_food` excluded) are listed and documented in `categories.yaml`
- [ ] Pipeline runs for `eatery` with no code changes besides config, producing `eatery.geojson` and its own metrics in `docs/model_report.md`
- [ ] Eatery option in the selector is enabled and the "Coming soon" badge removed
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

#### US-017: AI chat assistant grounded in map data
**Description:** As a user, I want to describe my budget, target customers, and preferred district in chat so the assistant suggests areas from the map that fit me.

**Acceptance Criteria:**
- [ ] Chat panel in the web app; requests go to `POST /chat` on the backend (the Gemini API key is only on the server)
- [ ] The assistant uses function calling to query area data (e.g. `search_areas(business_type, kecamatan, label, limit)`, `get_area(h3)`); it must not answer with area numbers that did not come from these functions
- [ ] Every suggested area in a reply is shown as a clickable chip that opens its area card on the map
- [ ] If the user asks about something the data cannot answer (e.g. exact rent, guaranteed profit), the assistant says so instead of guessing
- [ ] Rate limit: max 20 messages per session; errors shown as a friendly message
- [ ] A test set of 10 prompts is run; every number in the replies matches the data (results logged in `docs/chat_eval.md`)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

#### US-018: Run the user validation study
**Description:** As the team, we need evidence that Ascend helps real prospective owners, for the Final Day pitch.

**Acceptance Criteria:**
- [ ] At least 10 prospective owners participate (consent recorded, no personal data stored beyond first name/initials)
- [ ] Each participant shortlists 3 areas for a coffee kiosk twice: once with Google Maps only, once with Ascend (order alternated between participants)
- [ ] **Shortlists are scored against ground truth, not against Ascend's own labels** (using Ascend's labels would be circular). Ground truth = outlets actually observed in the field check (US-019). To make this possible, the study task is limited to a fixed set of candidate areas that are all field-checked
- [ ] Primary metric per task: average number of field-observed coffee outlets per shortlisted area (lower = better). Secondary metrics: time to shortlist, confidence rating (1–5)
- [ ] Results summarised honestly in `docs/validation.md`, including negative findings
- [ ] Raw anonymised results stored in `docs/validation_raw.csv`

#### US-019: Field-check top opportunity areas
**Description:** As the team, we need to check whether "opportunity" areas are really less crowded, including outlets that open data misses.

**Acceptance Criteria:**
- [ ] The 10 `opportunity` hexagons with the highest gap are selected, plus the extra candidate areas used in the validation study (US-018)
- [ ] Each is checked by visit or street-level imagery; recorded: actual outlets seen (including informal stalls), notes, date
- [ ] Results and the share of areas that are confirmed "not crowded" are written to `docs/field_check.md`

---

### Phase 3 — Final Day (16 Dec 2026)

#### US-020: Compare shortlisted areas side by side
**Description:** As a user, I want to compare 2–3 shortlisted areas side by side so I can make a final choice.

**Acceptance Criteria:**
- [ ] From the shortlist panel, the user selects 2 or 3 areas and clicks "Compare"
- [ ] A comparison view shows a column per area: label, actual vs expected, gap, confidence, top 3 factors
- [ ] Selecting fewer than 2 areas disables the "Compare" button with a hint
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

#### US-021: Rental-price layer from consenting owners
**Description:** As a user, I want to see sample rental prices so I can rule out areas I cannot afford.

**Acceptance Criteria:**
- [ ] A simple form lets a property owner submit: monthly rent (IDR), space size (m²), location pin, and an explicit consent checkbox; submission is blocked without consent
- [ ] Only the hexagon ID, rent, and size are stored and shown — never the exact pin, name, or contact
- [ ] A map toggle "Show rent samples" shows median rent per hexagon for hexagons with ≥ 1 sample, with the sample count
- [ ] Any sample can be deleted by the team on request (documented process in README)
- [ ] **Data source (decided 22 Nov 2026):** collect real samples from consenting owners around Telkom University first; if fewer than 15 real samples exist by Final Day, fill the gap with synthetic samples
- [ ] Every sample has a `source` field (`real_consented` or `synthetic`); the map and the demo clearly show which is which, and synthetic samples are never mixed into the same median as real ones without saying so
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

## 4. Functional Requirements

**Data pipeline**
- FR-1: The pipeline must use only open data: Overture Maps Places, OpenStreetMap, and WorldPop.
- FR-2: The pipeline must build an H3 resolution 9 grid covering Kota Bandung plus a configurable-radius circle around Telkom University.
- FR-3: The pipeline must merge coffee shop records from Overture and OSM and remove duplicates (≤ 30 m apart with similar names).
- FR-4: The pipeline must compute demand features per hexagon (population, campuses, schools, offices, transit stops, stations; k-ring sums; distances) and must fail if any food-outlet count is used as a feature.
- FR-5: The pipeline must be configurable by business type through `categories.yaml`, without code changes.
- FR-6: Each stage must be runnable on its own, and the full pipeline must run with a single documented command.

**Model**
- FR-7: The system must train a LightGBM Poisson model to predict outlet counts from demand features.
- FR-8: The system must evaluate the model and a population-only baseline with 5-fold spatial cross-validation grouped by H3 resolution 7 parent cells.
- FR-9: The expected count shown to users must be the out-of-fold prediction for that hexagon.
- FR-10: The system must label each hexagon `opportunity`, `fair`, `crowded`, or `not_enough_demand` using the thresholds in `labels.yaml`.
- FR-11: The system must flag hexagons with sparse surrounding POI data as `confidence = low`.
- FR-12: The system must generate the top 3 SHAP factors per hexagon with plain-English text, using the same fold model that produced that hexagon's expected count.

**Web app**
- FR-13: The web app must display the labelled hexagon map with a legend and data attribution.
- FR-14: The web app must let users choose a business type; unavailable types must be visibly disabled.
- FR-15: When a user clicks a hexagon, the web app must open an area card with label, actual count, expected count, factors, and a confidence warning when applicable.
- FR-16: The web app must let users save up to 10 areas to a shortlist stored in the browser.
- FR-17: The web app must show an "About the method" panel with data versions, metrics, and limitations.
- FR-18: The web app must work on mobile (≥ 375 px wide) and desktop browsers.

**Backend and AI (Phase 2)**
- FR-19: The backend must expose area and metadata endpoints as defined in US-015.
- FR-20: The chat assistant must get area facts only through backend functions, and must decline questions the data cannot answer.
- FR-21: API keys must exist only on the server, loaded from environment variables.

**Final Day (Phase 3)**
- FR-22: The web app must allow comparing 2–3 shortlisted areas side by side.
- FR-23: Rent samples must only be accepted with explicit consent and must be displayed only aggregated per hexagon.

**Honesty and compliance**
- FR-24: Every feature that is not finished must be marked "Coming soon" in the UI and listed as Planned in the README.
- FR-25: The README must disclose material AI assistance (tool and role) and all third-party data/libraries with licences.

---

## 5. Non-Goals (Out of Scope)

- No prediction of revenue, profit, or chance of business survival — Ascend only compares supply with typical demand.
- No guarantee or recommendation that a business will succeed; Ascend is not financial advice.
- No cities other than Kota Bandung and the Telkom University area.
- No business types other than coffee shop (P1) and eatery (P2).
- No user accounts, login, or cloud-synced shortlists.
- No real-time or live footfall data.
- No scraping of Google Maps or any other source that forbids it in its terms.
- No native mobile app (the web app must be mobile-friendly instead).
- No payments, listings marketplace, or tenant–landlord matching (that is what LapakIn does).
- No backend in Phase 1 — the semifinal prototype is fully static.

---

## 6. Design Considerations

- **Audience:** non-technical first-time owners. Avoid words like "residual", "SHAP", or "H3" in the UI; use "areas", "coffee shops here", "demand typically supports".
- **Language:** UI in English (competition language). Indonesian translation is a possible later addition.
- **Layout:** full-screen map; business-type selector and "About" button at the top; legend bottom-left; area card as right side panel (desktop) or bottom sheet (mobile); shortlist as a collapsible panel.
- **Colour:** green / yellow / red / grey must also differ in lightness so colour-blind users can tell them apart; the label text is always shown next to the colour in cards.
- **Accessibility:** all buttons keyboard-reachable; area card closable with Esc; contrast ratio ≥ 4.5:1 for text.
- **Mockups:** Figma mockups of P2/P3 screens (chat, comparison, rent layer) may be shown in the semifinal video, clearly labelled "Mockup".

---

## 7. Technical Considerations

**Proposed repository layout**
```
ascend/
├── pipeline/            # Python 3.11
│   ├── config/          # categories.yaml, labels.yaml, feature_labels.yaml, area.yaml
│   ├── data/            # raw/ (git-ignored), processed/, SOURCES.md
│   ├── models/          # fold models + metrics.json
│   └── src/             # 01_grid, 02_places, 03_features, 04_train, 05_score, 06_explain, 07_export
├── web/                 # Nuxt 3 + MapLibre GL JS; public/data/*.geojson
├── api/                 # FastAPI (Phase 2)
└── docs/                # model_report.md, validation.md, field_check.md, figures/
```

**Libraries (suggested):** Pipeline: `duckdb` (Overture query), `osmnx` or Overpass API (OSM), `rasterio` + `exactextract`/`rasterstats` (WorldPop), `h3` v4, `geopandas`, `lightgbm`, `shap`, `scikit-learn` (GroupKFold, baseline), `rapidfuzz` (name matching), `ruff`. Web: `nuxt` 3, `maplibre-gl`. Basemap: **OpenFreeMap** (free, no API key, OSM-based; keep its attribution visible).

**Known risks and constraints**
- **Circularity of the model:** the model is trained on current outlet counts, so it learns where outlets *typically* are given demand, not true demand. This is accepted and explained: the gap shows areas that differ from the city-wide pattern. Using only demand features and OOF predictions limits this effect. It must be stated in the proposal and the About panel.
- **Missing informal stalls:** open data under-counts small warungs and kiosks → handled by the low-confidence flag and the field check (US-019).
- **Data year mismatch:** WorldPop year may differ from Overture/OSM year → record years in `meta.json` and the About panel.
- **Category accuracy:** Overture categories can be wrong (e.g. a restaurant tagged as cafe) → manual spot check of 30 random records, error rate noted in `model_report.md`.
- **Licences:** OSM data requires "© OpenStreetMap contributors" attribution (ODbL); WorldPop is CC BY 4.0; Overture licences differ by source — check the Places theme licence for the release used.
- **Performance:** ~2,000 hexagons render fine as a single GeoJSON layer in MapLibre; no tiling needed.
- **Privacy:** Phase 1 stores no personal data. Phase 2/3 data from people (validation study, rent samples) is minimised, consented, and anonymised.
- **Secrets:** Gemini API key only in server environment variables; never in the repo or the web bundle.

---

## 8. Success Metrics

**Model (by semifinal)**
- LightGBM mean Poisson deviance on spatial CV is **at least 10% lower** than the population-only baseline.
- Spearman correlation between expected and actual counts on held-out folds ≥ 0.5.
- Category spot check error rate reported (target ≤ 15%).

**Product (by semifinal)**
- A new user can reach a saved shortlist of 3 areas in under 2 minutes (tested with 3 people outside the team).
- Site loads and renders the map in under 3 s on Fast 4G.
- Zero features presented as finished that are not finished.

**Impact (by Final Day)**
- In the validation study (≥ 10 people), areas shortlisted with Ascend have **fewer field-observed coffee outlets on average** than areas shortlisted with Google Maps only (scored against field-check ground truth, not Ascend's labels).
- Secondary: time to shortlist with Ascend is not longer than without, and average confidence rating is higher.
- At least 7 of the 10 field-checked `opportunity` areas are confirmed as not crowded.

> These are targets. If the results miss them, they must be reported as they are (competition rule on accurate reporting).

---

## 9. Decisions and Open Questions

### Decisions (resolved 22 Nov 2026)

| # | Question | Decision | Where applied |
|---|---|---|---|
| 1 | Telkom area boundary | 3 km radius circle around the main campus | US-002 |
| 2 | Label thresholds | Fixed rules (`gap ≥ 1 & ratio ≤ 0.67` / `gap ≤ −1 & ratio ≥ 1.5`), tuned only if one label covers > 60% of hexagons | US-006 |
| 3 | Coffee shop definition | Coffee shops, cafés, and coffee kiosks/stands; no roasteries, dessert places, or coffee-bean shops | US-003 |
| 4 | Eatery definition (P2) | Warung makan, rumah makan, casual restaurants; no fast-food chains or fine dining | US-016 |
| 5 | WorldPop year | Latest available year as-is, year shown to users | US-004, US-013 |
| 6 | Basemap | OpenFreeMap | US-009, §7 |
| 7 | Ownership | Aprilianza owns the data pipeline and model (US-001 – US-008) | Phase 1 priority table |
| 8 | Rent samples (P3) | Real consented samples first, labelled synthetic fallback if fewer than 15 | US-021 |

### Still open

1. **Other members' ownership:** who owns the web map (US-009 – US-014), the proposal, the video, and the validation study? Needed for the proposal's "member contributions" section.
2. **Final label thresholds:** confirmed only after the first pipeline run (US-006).
3. **Exact Overture category names:** confirmed after listing the categories in the release (US-003).
4. **Validation study candidate areas:** which fixed set of areas participants choose from, so all of them can be field-checked (US-018, US-019).
