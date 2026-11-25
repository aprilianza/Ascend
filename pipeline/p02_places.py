"""Category check, coffee-shop locations and mapped POIs.

Outputs
- docs/category_check.csv                 (Overture labels + OSM tags in the bbox)
- pipeline/data/processed/coffee_shops.parquet  (id, name, lat, lon, source, h3, taxonomy_primary)
- pipeline/data/processed/mapped_pois.parquet   (id, lat, lon, h3; for the confidence flag)
"""

from __future__ import annotations

import re

import h3
import numpy as np
import pandas as pd
from rapidfuzz import fuzz
from scipy.cluster.hierarchy import DisjointSet
from scipy.spatial import cKDTree

from pipeline.common import DOCS, PROCESSED, load_yaml, log, settings
from pipeline.sources import osm_pois, overture_places

STEP = "02_places"
CLOSED = {"permanently_closed", "temporarily_closed", "closed"}
STOPWORDS = {"kopi", "coffee", "coffeeshop", "cafe", "kafe", "caffe", "café", "kedai", "warung", "the", "and", "dan", "shop"}
DEDUP_NAMED_M = 30.0
DEDUP_UNNAMED_M = 10.0
NAME_MATCH = 80


# ---------------------------------------------------------------- filters ---
def filter_overture(df: pd.DataFrame, min_conf: float) -> tuple[pd.DataFrame, dict]:
    stats = {
        "total": len(df),
        "status_open": int((df["operating_status"] == "open").sum()),
        "status_null": int(df["operating_status"].isna().sum()),
        "status_closed": int(df["operating_status"].isin(CLOSED).sum()),
    }
    keep = ~df["operating_status"].isin(CLOSED) & (df["confidence"] >= min_conf)
    stats["kept"] = int(keep.sum())
    return df[keep].copy(), stats


def category_check(ov: pd.DataFrame, osm: pd.DataFrame) -> pd.DataFrame:
    """Category check query, run on the cached bbox extract (all statuses, all confidences)."""
    fd = ov[ov["taxonomy_hierarchy"].apply(lambda h: h is not None and "food_and_drink" in list(h))].copy()
    fd["hierarchy"] = fd["taxonomy_hierarchy"].apply(lambda h: " > ".join(h))
    fd["operating_status"] = fd["operating_status"].fillna("null")
    a = (
        fd.groupby(["taxonomy_primary", "hierarchy", "basic_category", "operating_status"], dropna=False)
        .size()
        .rename("n")
        .reset_index()
        .assign(source="overture")
        .rename(columns={"taxonomy_primary": "label"})
    )
    o = osm[osm["amenity"].isin(["cafe", "restaurant", "fast_food", "food_court"])].copy()
    o["cuisine"] = o["cuisine"].fillna("(none)")
    b = (
        o.groupby(["amenity", "cuisine"])
        .size()
        .rename("n")
        .reset_index()
        .assign(source="osm", operating_status="", basic_category="")
        .rename(columns={"amenity": "label", "cuisine": "hierarchy"})
    )
    b["hierarchy"] = "cuisine=" + b["hierarchy"]
    out = pd.concat([a, b], ignore_index=True)[["source", "label", "hierarchy", "basic_category", "operating_status", "n"]]
    return out.sort_values(["source", "n"], ascending=[True, False])


# ------------------------------------------------------------------ dedup ---
def normalize_name(name: object) -> str:
    if not isinstance(name, str):
        return ""
    s = re.sub(r"[^\w\s]", " ", name.lower())
    return " ".join(w for w in s.split() if w not in STOPWORDS)


def _xy(lat: np.ndarray, lon: np.ndarray) -> np.ndarray:
    """Local equirectangular metres; accurate to <0.1% over the study bbox."""
    lat0 = np.deg2rad(-6.93)
    return np.column_stack([np.deg2rad(lon) * 6_371_000 * np.cos(lat0), np.deg2rad(lat) * 6_371_000])


def dedup(df: pd.DataFrame) -> pd.DataFrame:
    """Merge records of the same place (within 30 m and similar name, or within 10 m if a name is missing).

    Keeps the first record of each group, so sort by source preference before calling.
    """
    df = df.reset_index(drop=True)
    xy = _xy(df["lat"].to_numpy(), df["lon"].to_numpy())
    names = [normalize_name(n) for n in df["name"]]
    raw = df["name"].fillna("").astype(str).str.strip().to_numpy()
    ds = DisjointSet(range(len(df)))
    for i, j in cKDTree(xy).query_pairs(DEDUP_NAMED_M):
        d = float(np.hypot(*(xy[i] - xy[j])))
        if not raw[i] or not raw[j]:
            same = d <= DEDUP_UNNAMED_M
        elif not names[i] or not names[j]:  # name was only stopwords, e.g. "Kopi"
            same = raw[i].lower() == raw[j].lower() or d <= DEDUP_UNNAMED_M
        else:
            same = fuzz.token_set_ratio(names[i], names[j]) >= NAME_MATCH
        if same:
            ds.merge(i, j)
    root = np.array([ds[i] for i in range(len(df))])
    first = pd.Series(np.arange(len(df))).groupby(root).transform("min").to_numpy()
    return df[first == np.arange(len(df))].copy()


# ------------------------------------------------------------------- main ---
def coffee_shops(ov: pd.DataFrame, osm: pd.DataFrame, cats: dict, res: int) -> pd.DataFrame:
    c = cats["coffee_shop"]
    a = ov[ov["taxonomy_primary"].isin(c["overture_primary"])]
    a = pd.DataFrame(
        {
            "id": "ov:" + a["id"],
            "name": a["name"],
            "lat": a["lat"],
            "lon": a["lon"],
            "source": "overture",
            "taxonomy_primary": a["taxonomy_primary"],
        }
    )
    b = osm[osm["amenity"].isin(c["osm"]["amenity"])]
    cuisine = b["cuisine"].fillna("").str.split(";")
    b = b[~cuisine.apply(lambda xs: any(x.strip() in c["osm_exclude_cuisine"] for x in xs))]
    b = pd.DataFrame(
        {
            "id": "osm:" + b["id"],
            "name": b["name"],
            "lat": b["lat"],
            "lon": b["lon"],
            "source": "osm",
            "taxonomy_primary": "osm:amenity=" + b["amenity"],
        }
    )
    both = pd.concat([b, a], ignore_index=True)  # OSM first: its points are hand-placed
    log(STEP, f"coffee shops before dedup: osm={len(b)}, overture={len(a)}, total={len(both)}")
    out = dedup(both)
    log(STEP, f"coffee shops after dedup: {out['source'].value_counts().to_dict()}, total={len(out)}")
    out["h3"] = [h3.latlng_to_cell(la, lo, res) for la, lo in zip(out["lat"], out["lon"])]
    return out


def mapped_pois(ov: pd.DataFrame, osm: pd.DataFrame, cats: dict, res: int) -> pd.DataFrame:
    keys = cats["mapped_poi_osm_keys"]
    o = osm[osm[keys].notna().any(axis=1)]
    both = pd.concat(
        [
            pd.DataFrame({"id": "osm:" + o["id"], "name": o["name"], "lat": o["lat"], "lon": o["lon"]}),
            pd.DataFrame({"id": "ov:" + ov["id"], "name": ov["name"], "lat": ov["lat"], "lon": ov["lon"]}),
        ],
        ignore_index=True,
    )
    out = dedup(both)
    log(STEP, f"mapped POIs: {len(both)} before dedup, {len(out)} after")
    out["h3"] = [h3.latlng_to_cell(la, lo, res) for la, lo in zip(out["lat"], out["lon"])]
    return out[["id", "lat", "lon", "h3"]]


def main() -> None:
    cfg = settings()
    cats = load_yaml("categories.yaml")
    res = cfg["h3_resolution"]
    ov_all = overture_places()
    osm = osm_pois()

    category_check(ov_all, osm).to_csv(DOCS / "category_check.csv", index=False)
    log(STEP, "wrote docs/category_check.csv")

    ov, stats = filter_overture(ov_all, cfg["overture"]["min_confidence"])
    log(STEP, f"Overture filter: {stats}")
    pd.Series(stats).to_json(PROCESSED / "overture_filter_stats.json")

    cs = coffee_shops(ov, osm, cats, res)
    cs[["id", "name", "lat", "lon", "source", "h3", "taxonomy_primary"]].to_parquet(
        PROCESSED / "coffee_shops.parquet", index=False
    )
    mapped_pois(ov, osm, cats, res).to_parquet(PROCESSED / "mapped_pois.parquet", index=False)
    write_sample_check(cs, cfg["seed"])


def write_sample_check(cs: pd.DataFrame, seed: int, n: int = 30) -> None:
    """Sample check form: 30 random coffee-shop records to verify on street imagery or on site.

    Not overwritten once it exists, so the filled-in answers are never lost.
    """
    path = DOCS / "sample_check_coffee.csv"
    if path.exists():
        log(STEP, "docs/sample_check_coffee.csv exists; kept as is")
        return
    s = cs.sample(n=min(n, len(cs)), random_state=seed).copy()
    s["maps_link"] = [f"https://www.google.com/maps/search/?api=1&query={la:.6f},{lo:.6f}" for la, lo in zip(s["lat"], s["lon"])]
    for col in ("is_coffee_shop_Y_N", "still_open_Y_N_unknown", "position_ok_within_50m_Y_N", "checked_by", "date", "notes"):
        s[col] = ""
    s[["id", "name", "source", "taxonomy_primary", "lat", "lon", "maps_link",
       "is_coffee_shop_Y_N", "still_open_Y_N_unknown", "position_ok_within_50m_Y_N", "checked_by", "date", "notes"]].to_csv(
        path, index=False
    )
    log(STEP, f"wrote {path.name} ({len(s)} records) for the manual sample check")


if __name__ == "__main__":
    main()
