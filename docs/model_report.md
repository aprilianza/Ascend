# Ascend model report: coffee shop, data v1 (25 Nov 2026)

Reproduce everything below with `python -m pipeline.run` (seed 42). Raw numbers:
`pipeline/models/metrics.json`, `pipeline/data/processed/label_params.json` (local),
`web/public/data/meta.json`.

## 1. Data

| Item | Value |
|---|---|
| Study area | Kota Bandung (30 kecamatan) + Dayeuhkolot + Bojongsoang, 206.9 km² (OSM boundaries) |
| Grid | H3 resolution 9: **1,976 study cells** + 803 buffer cells within 1 km |
| Population (WorldPop 2026, study cells) | 2,849,325 (Kota Bandung 2,591,726; Telkom area 257,599) |
| Coffee shops (after filters + de-dup) | 2,911 in the bbox; 2,625 in grid cells; 2,426 in study cells |
| Mapped POIs (for the confidence flag) | 51,302 after de-dup |

Source versions, filters and the `operating_status` finding: `pipeline/data/SOURCES.md`.

**Category sample check (target error ≤ 15%): not met, 20% (6 of 30).** Desk check of 30 random
records on Google Maps (category, closed status, position) by Nopri, assisted by Claude Code,
28 Nov 2026; results in `docs/sample_check_coffee.csv`. A record is an error when it is not a coffee
shop or is permanently closed.

| Result | Records |
|---|---|
| Coffee shop, not permanently closed | 20 (3 borderline: a warkop and a cafe listed as restaurant or cafeteria, a steak cafe) |
| Not a coffee shop | 5: boba, Thai tea, two ice cream places, a restaurant |
| Permanently closed | 1 (2 more are temporarily closed and are kept) |
| Not found on Google Maps | 4 (excluded; error among the 26 found records is 23%) |
| Position within 50 m (of the records found at this point) | 20 yes, 3 no |

Pattern: the errors come from the broad `cafe` label (Overture and OSM), which also covers drink and
dessert shops. If small drink cafes (boba, Thai tea) were counted as cafes, since they compete for the
same walk-in drink customers, the error would be 13%; the pipeline uses the coffee-only definition, so
20% is the figure we report. Effect: coffee-shop counts are somewhat too high, more so near malls and
campuses, which makes `crowded` slightly more likely. Not fixed in this version: a name filter
(boba, thai tea, ice cream, es krim) would be tuned on this same sample, so it needs a fresh sample to
check.

## 2. Demand model

- Target: coffee shops per hexagon. Features (19, no food or drink counts): `pop`, `pop_k1`, `pop_k2`,
  k-ring 1 and 2 counts of campus, school, office, transit, retail, lodging and health POIs,
  `dist_campus_m` (nearest campus, Telkom University point included), `dist_station_m`.
- LightGBM `objective=poisson` (600 trees, 15 leaves, learning rate 0.03) vs Poisson GLM on `log1p(pop_k1)`.
- Spatial CV: `GroupKFold` 5 folds, groups = 76 H3 resolution-7 parents. Expected = out-of-fold prediction.
  Trained on study + buffer cells (2,779); metrics below are for the 1,976 study cells.

| Metric (out-of-fold, study cells) | LightGBM | GLM baseline | Target |
|---|---|---|---|
| Mean Poisson deviance | **1.444** | 2.833 | LightGBM ≥ 10% lower → **49% lower, met** |
| MAE | 0.949 | 1.333 | |
| Spearman (expected vs actual) | **0.615** | 0.437 | ≥ 0.5 → **met** |

Per fold, Spearman ranges from 0.41 to 0.69 (folds 1 and 4 below 0.5: these folds are mostly
low-density edge areas where most hexagons have 0 or 1 shop). LightGBM beats the GLM in every fold.

**Most important features** (share of total gain, 5 folds): `lodging_k1` 25%, `retail_k1` 21%,
`lodging_k2` 9%, `dist_campus_m` 6%, `office_k2` 5%, `health_k1` 4%.
Caveat: hotels and shops mark commercial streets, but their counts also reflect how completely an
area is mapped (mapping bias). The model learns where coffee shops usually are, not true demand.

## 3. Labels

### Over-dispersion: switch from Poisson to negative binomial

The plan was to replace the Poisson test with a negative binomial test if real data is
over-dispersed. It is: the Pearson dispersion of actual vs expected is **2.29 per hexagon and 2.76
on k-ring 1** (a Poisson process gives 1.0). With a Poisson test, too many cells look significant.

- Method now: **`negbin_kring1`**, same rule as the Poisson k-ring test (A and E summed over k-ring 1, one-sided test,
  `alpha = 0.05`, `min_gap = 1`), with a negative binomial NB2 distribution, Var = E + a·E².
- `a = 0.127`, estimated by the method of moments on the study cells (`p05_score.nb_dispersion`).
- Data contract bumped to **v1.1.0** (additive: new `method` value, optional `nb_dispersion`). The UI needs no change.

| Rule (alpha 0.05) | opportunity | crowded | fair | not enough demand |
|---|---|---|---|---|
| Poisson k-ring 1 (original default) | 88 (4.5%) | 252 (12.8%) | 1,516 (76.7%) | 120 (6.1%) |
| **Negative binomial k-ring 1 (used)** | **18 (0.9%)** | **142 (7.2%)** | **1,696 (85.8%)** | **120 (6.1%)** |

Every NB label is also a Poisson label; the NB test drops 70 opportunity and 110 crowded labels
that the Poisson test would have given only because it ignores the extra variance.

### Alpha and the targets

| Method | alpha 0.01 | alpha 0.05 | alpha 0.10 |
|---|---|---|---|
| NB: opportunity + crowded | 3.0% | **8.1%** | 14.6% |
| NB: fair | 90.9% | 85.8% | 79.4% |
| Poisson: opportunity + crowded | 8.1% | 17.2% | 23.8% |

- Target "opportunity + crowded between 5% and 35%": **met** at alpha 0.05 (8.1%).
- Target "no label above 60%": **not met**. `fair` is 85.8%, and no alpha in the allowed range
  (0.01–0.10) brings it under 60%. We keep **alpha = 0.05**: the target was written for the old
  fixed-threshold rule, and the simulation (§5) shows that a large `fair` share is what an honest
  test produces when most differences are within random variation. The map says "fair" when the
  data cannot tell; that is the intended behaviour.

### Where the labels are

| Area | opportunity | crowded | fair | not enough demand |
|---|---|---|---|---|
| Kota Bandung | 18 | 124 | 1,443 | 14 |
| Telkom area (Dayeuhkolot + Bojongsoang) | 0 | 18 | 253 | 106 |

- Opportunity cells cluster in Astanaanyar (4), Andir, Regol, Bojongloa Kidul (2 each). All 18 have
  normal confidence. Six have 0 mapped coffee shops within ~500 m where 4–8 are expected: these
  are the first candidates for the field check, because informal stalls may be missing.
- Crowded cells: Arcamanik and Cidadap (14 each), Bojongsoang (12), Lengkong and Sumur Bandung (10 each).
- Low confidence (fewer than 3 mapped POIs in k-ring 1): 68 cells (3.4%).
- `not_enough_demand`: `pop_k1` below the 10th percentile (2,369 people) and expected < 0.3.
- The model expects 2,148 shops in study cells against 2,426 observed (11% fewer): out-of-fold
  predictions are slightly low inside the city, so `crowded` is somewhat more likely than
  `opportunity`. Recorded as a known bias; a calibration step is a possible later improvement.

## 4. Explanations

- SHAP `TreeExplainer` on the fold model that produced each cell's OOF prediction (the reloaded
  model reproduces the stored OOF prediction exactly).
- Additivity check (base value + SHAP sum = raw log prediction): max error **1.3e-14** (limit 0.01).
- Top 3 factors by |SHAP|. Card text describes the cell (above or below the median study cell);
  the arrow comes from the sign of the effect. In 12% of factor lines the two point different ways
  (for example ↑ "Few residents in the wider area"), which happens when the model's effect is not
  monotonic. This is correct SHAP output, not a bug; About explains "arrows show how each factor
  moves the estimate".

**5 random hexagons (seed 7), checked by hand**

| Kecamatan | Label | A / E (k-ring 1) | Factors | Check |
|---|---|---|---|---|
| Gedebage | fair | 1 / 2.9 | ↓ Few hotels in the wider area; ↑ Few residents in the wider area; ↓ No hotels nearby | Plausible: suburban edge, few hotels |
| Bojongloa Kidul | fair | 3 / 2.6 | ↑ Many residents in this spot; ↓ Few shops nearby; ↑ Few hotels in the wider area | Plausible: dense housing, little retail |
| Bandung Kulon | fair | 4 / 4.4 | ↑ Many shops nearby; ↑ Many residents in this spot; ↑ Schools nearby | Plausible |
| Cibeunying Kidul | fair | 8 / 12.6 | ↑ Many shops nearby; ↑ Offices nearby; ↑ Many residents in this spot | Plausible: commercial street; gap 4.6 but not significant under NB |
| Cibiru | not enough demand | 0 / 0.3 | ↓ Few shops nearby; ↓ Few residents in this spot; ↓ Few hotels in the wider area | Plausible: eastern fringe |

## 5. Label-rule simulation

`python docs/sim_labels.py`. Parameters (top of the script): 2,269 synthetic hexagons (H3 disk k=27),
smoothed lognormal demand calibrated to a mean of 1.8 outlets per hexagon and 41% of hexagons
expecting fewer than 1, actual counts drawn from Poisson; scenario B marks 10% of cells (in
pockets of a cell plus its ring) as under-supplied (actual mean ×0.25) and 10% as over-supplied (×2);
20 repetitions, seed 42. The model is assumed perfect, so these are upper bounds; real data adds
model error and over-dispersion (which is why the NB test is used above).

| Rule | Scenario A: supply = demand everywhere (every label is a false alarm) | Scenario B precision / recall |
|---|---|---|
| v1: per hexagon, gap/ratio | 14.6% opportunity, 12.7% crowded | opportunity 28% / 46%, crowded 32% / 48% |
| Poisson test, per hexagon | 0.5%, 2.8% | 67% / 8%, 51% / 24% |
| **Poisson test, k-ring 1** | **3.1%, 3.8%** | **57% / 42%, 51% / 50%** |

With the v1 rule about 7 in 10 opportunity labels are chance. The per-hexagon test is precise but
finds almost nothing, because counts are too small. Summing over k-ring 1 finds about 4 in 10 real
pockets while keeping false alarms at 3 to 4% per label.

## 6. Limitations

1. The model learns the usual relation between demand proxies and coffee shops in Bandung; a gap
   means "different from the city pattern", not "unmet demand" for certain.
2. Informal stalls and new shops are missing from open data; Overture `operating_status` is almost
   always empty, so some closed places may be counted.
   The category sample check found 20% errors (target 15%): some drink and dessert shops tagged
   `cafe` are counted as coffee shops.
3. Hotel and shop counts carry mapping-completeness bias.
4. WorldPop 2026 is a modelled estimate (alpha release R2025A).
5. Labels are conservative after the NB switch: 18 opportunity cells. They are candidates to check
   in the field, not recommendations.
