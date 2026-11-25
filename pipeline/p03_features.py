"""Demand features per H3 cell (study area + buffer).

Output: pipeline/data/processed/features.parquet, one row per h3, no missing values.
"""

from __future__ import annotations

import h3
import numpy as np
import pandas as pd
import rasterio
from rasterio.windows import from_bounds
from scipy.spatial import cKDTree

from pipeline.common import PROCESSED, load_yaml, log, settings, study_bbox
from pipeline.p02_places import _xy, dedup, filter_overture
from pipeline.sources import osm_pois, overture_places, worldpop_path

STEP = "03_features"
FORBIDDEN = ("cafe", "coffee", "restaurant", "food", "eatery")


def population(grid: pd.DataFrame, res: int) -> pd.Series:
    """Sum WorldPop 100 m pixels into the H3 cell that contains each pixel centre."""
    b = study_bbox()
    with rasterio.open(worldpop_path()) as src:
        win = from_bounds(b["xmin"] - 0.01, b["ymin"] - 0.01, b["xmax"] + 0.01, b["ymax"] + 0.01, src.transform)
        arr = src.read(1, window=win, boundless=True, fill_value=0).astype("float64")
        tr = src.window_transform(win)
        nodata = src.nodata
    if nodata is not None:
        arr[arr == nodata] = 0
    arr[~np.isfinite(arr) | (arr < 0)] = 0
    rows, cols = np.nonzero(arr)
    xs, ys = rasterio.transform.xy(tr, rows, cols, offset="center")
    cells = [h3.latlng_to_cell(y, x, res) for x, y in zip(xs, ys)]
    s = pd.Series(arr[rows, cols]).groupby(pd.Series(cells)).sum()
    return grid["h3"].map(s).fillna(0.0)


def group_points(name: str, spec: dict, ov: pd.DataFrame, osm: pd.DataFrame) -> pd.DataFrame:
    parts = []
    sel = pd.Series(False, index=ov.index)
    if "overture_primary" in spec:
        sel |= ov["taxonomy_primary"].isin(spec["overture_primary"])
    if "overture_top" in spec:
        top = ov["taxonomy_hierarchy"].apply(lambda h: h[0] if h is not None and len(h) else None)
        sel |= top.isin(spec["overture_top"])
    if sel.any():
        parts.append(ov.loc[sel, ["name", "lat", "lon"]])
    if "osm" in spec:
        osel = pd.Series(False, index=osm.index)
        for key, vals in spec["osm"].items():
            osel |= osm[key].notna() if vals == "*" else osm[key].isin(vals)
        for key, vals in spec.get("osm_exclude", {}).items():
            osel &= ~osm[key].isin(vals)
        parts.append(osm.loc[osel, ["name", "lat", "lon"]])
    pts = pd.concat(parts, ignore_index=True)
    out = dedup(pts)
    log(STEP, f"{name}: {len(pts)} points, {len(out)} after dedup")
    return out


def kring_sum(counts: pd.Series, cells: list[str], k: int) -> np.ndarray:
    lookup = counts.to_dict()
    return np.array([sum(lookup.get(n, 0) for n in h3.grid_disk(c, k)) for c in cells], dtype="float64")


def main() -> None:
    cfg = settings()
    res = cfg["h3_resolution"]
    spec = load_yaml("features.yaml")
    grid = pd.read_parquet(PROCESSED / "grid.parquet")
    cells = grid["h3"].tolist()
    ov, _ = filter_overture(overture_places(), cfg["overture"]["min_confidence"])
    osm = osm_pois()

    feats = pd.DataFrame({"h3": cells})
    feats["pop"] = population(grid, res).to_numpy()
    pop = feats.set_index("h3")["pop"]
    feats["pop_k1"] = kring_sum(pop, cells, 1)
    feats["pop_k2"] = kring_sum(pop, cells, 2)
    log(STEP, f"population in study cells: {feats.loc[grid['in_study_area'].to_numpy(), 'pop'].sum():,.0f}")

    centers = _xy(grid["lat"].to_numpy(), grid["lon"].to_numpy())
    groups = {g: group_points(g, spec[g], ov, osm) for g in set(spec["kring_counts"]) | set(spec["distance_to"])}
    for g in spec["kring_counts"]:
        pts = groups[g]
        cnt = pd.Series([h3.latlng_to_cell(a, b, res) for a, b in zip(pts["lat"], pts["lon"])]).value_counts()
        feats[f"{g}_k1"] = kring_sum(cnt, cells, 1)
        feats[f"{g}_k2"] = kring_sum(cnt, cells, 2)
    camp = cfg["telkom_campus"]  # the Telkom University point is always a campus
    groups["campus"] = pd.concat(
        [groups["campus"], pd.DataFrame({"name": ["Telkom University"], "lat": [camp["lat"]], "lon": [camp["lon"]]})],
        ignore_index=True,
    )
    for g in spec["distance_to"]:
        pts = groups[g]
        d, _ = cKDTree(_xy(pts["lat"].to_numpy(), pts["lon"].to_numpy())).query(centers)
        feats[f"dist_{g}_m"] = np.round(d, 0)

    bad = [c for c in feats.columns if any(w in c.lower() for w in FORBIDDEN)]
    if bad:
        raise SystemExit(f"Food/drink columns are not allowed as features: {bad}")
    if feats.isna().any().any():
        raise SystemExit(f"Missing values in features: {feats.columns[feats.isna().any()].tolist()}")
    feats.to_parquet(PROCESSED / "features.parquet", index=False)
    log(STEP, f"wrote features.parquet: {feats.shape[0]} cells x {feats.shape[1] - 1} features")


if __name__ == "__main__":
    main()
