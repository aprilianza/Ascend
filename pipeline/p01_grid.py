"""Study-area boundaries and the H3 resolution-9 grid with a 1 km edge buffer.

Outputs
- pipeline/data/boundaries/{study_area,kecamatan}.geojson
- pipeline/data/processed/grid.parquet  (h3, area_name, kecamatan, in_study_area, lat, lon)
- pipeline/config/area.yaml             (bbox of study area + buffer, used by every query)
- docs/figures/grid.png
"""

from __future__ import annotations

import geopandas as gpd
import h3
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import osmnx as ox
import pandas as pd
from shapely.geometry import Point
from shapely.ops import unary_union

from pipeline.common import (
    BOUNDARIES,
    CACHE,
    FIGURES,
    PROCESSED,
    USER_AGENT,
    log,
    settings,
    write_yaml,
)

STEP = "01_grid"
METRIC_CRS = 32748  # UTM 48S, metres


def _setup_osmnx() -> None:
    ox.settings.use_cache = True
    ox.settings.cache_folder = str(CACHE / "osmnx")
    ox.settings.requests_timeout = 300
    ox.settings.http_user_agent = USER_AGENT


def fetch_boundaries(cfg: dict) -> gpd.GeoDataFrame:
    """One row per kecamatan in the study area, with area_name."""
    _setup_osmnx()
    sa = cfg["study_area"]
    kota = ox.geocode_to_gdf(f"R{sa['kota_bandung']['osm_relation']}", by_osmid=True)
    kota_poly = kota.geometry.iloc[0]

    f = ox.features_from_polygon(
        kota_poly, tags={"boundary": "administrative", "admin_level": "6"}
    )
    f = f[
        f.geom_type.isin(["Polygon", "MultiPolygon"])
        & (f.get("admin_level") == "6")
        & (f.get("boundary") == "administrative")
    ]
    kec = f[f.representative_point().within(kota_poly)][["name", "geometry"]].copy()
    kec["area_name"] = "kota_bandung"
    if len(kec) != 30:
        raise SystemExit(f"Expected 30 kecamatan in Kota Bandung, got {len(kec)}")

    rows = [kec]
    for item in sa["telkom_area"]:
        g = ox.geocode_to_gdf(f"R{item['osm_relation']}", by_osmid=True)
        rows.append(
            gpd.GeoDataFrame(
                {"name": [item["name"]], "area_name": ["telkom_area"]},
                geometry=[g.geometry.iloc[0]],
                crs=4326,
            )
        )
    out = gpd.GeoDataFrame(pd.concat(rows, ignore_index=True), crs=4326)
    return out.rename(columns={"name": "kecamatan"}).reset_index(drop=True)


def build_grid(kec: gpd.GeoDataFrame, res: int, buffer_m: float) -> gpd.GeoDataFrame:
    study = unary_union(kec.geometry.values)
    study_m = gpd.GeoSeries([study], crs=4326).to_crs(METRIC_CRS)
    buffered = study_m.buffer(buffer_m).to_crs(4326).iloc[0]

    cells = sorted(h3.geo_to_cells(buffered.__geo_interface__, res))
    lat, lon = zip(*(h3.cell_to_latlng(c) for c in cells))
    grid = gpd.GeoDataFrame(
        {"h3": cells, "lat": lat, "lon": lon},
        geometry=[Point(x, y) for x, y in zip(lon, lat)],
        crs=4326,
    )
    joined = gpd.sjoin(grid, kec[["kecamatan", "area_name", "geometry"]], how="left", predicate="within")
    joined = joined[~joined.index.duplicated(keep="first")]
    grid["kecamatan"] = joined["kecamatan"]
    grid["area_name"] = joined["area_name"]
    grid["in_study_area"] = grid["kecamatan"].notna()
    return grid


def save_figure(kec: gpd.GeoDataFrame, grid: gpd.GeoDataFrame) -> None:
    hexes = gpd.GeoDataFrame(
        grid[["h3", "in_study_area", "area_name"]].copy(),
        geometry=gpd.GeoSeries.from_xy([0] * len(grid), [0] * len(grid)),
        crs=4326,
    )
    from shapely.geometry import Polygon

    hexes["geometry"] = [
        Polygon([(lng, lat) for lat, lng in h3.cell_to_boundary(c)]) for c in grid["h3"]
    ]
    fig, ax = plt.subplots(figsize=(8, 8))
    colors = hexes["area_name"].map({"kota_bandung": "#4C78A8", "telkom_area": "#F58518"}).fillna("#DDDDDD")
    hexes.plot(ax=ax, color=colors, edgecolor="white", linewidth=0.1)
    kec.boundary.plot(ax=ax, color="black", linewidth=0.4)
    ax.set_title("Ascend grid: H3 res 9 (blue Kota Bandung, orange Telkom area, grey 1 km buffer)")
    ax.set_axis_off()
    fig.tight_layout()
    fig.savefig(FIGURES / "grid.png", dpi=150)
    plt.close(fig)


def main() -> None:
    cfg = settings()
    kec = fetch_boundaries(cfg)
    kec.to_file(BOUNDARIES / "kecamatan.geojson", driver="GeoJSON")
    study = gpd.GeoDataFrame(geometry=[unary_union(kec.geometry.values)], crs=4326)
    study.to_file(BOUNDARIES / "study_area.geojson", driver="GeoJSON")

    areas = kec.to_crs(METRIC_CRS).assign(km2=lambda d: d.area / 1e6)
    log(STEP, f"boundary area: {areas.groupby('area_name')['km2'].sum().round(2).to_dict()}")

    grid = build_grid(kec, cfg["h3_resolution"], cfg["buffer_m"])
    n_in = int(grid["in_study_area"].sum())
    n_buf = len(grid) - n_in
    log(STEP, f"cells in study area: {n_in} (expected ~1950); buffer cells: {n_buf}")
    lo, hi = cfg["expected_cells"]
    if not lo <= n_in <= hi:
        raise SystemExit(f"Cell count {n_in} outside {lo}-{hi}: boundaries are probably wrong")

    pd.DataFrame(grid.drop(columns="geometry")).to_parquet(PROCESSED / "grid.parquet", index=False)

    # bbox of the buffered grid (cell boundaries), rounded outward to 4 decimals
    pts = [p for c in grid["h3"] for p in h3.cell_to_boundary(c)]
    lats, lons = [p[0] for p in pts], [p[1] for p in pts]
    bbox = {
        "xmin": round(min(lons) - 5e-5, 4),
        "ymin": round(min(lats) - 5e-5, 4),
        "xmax": round(max(lons) + 5e-5, 4),
        "ymax": round(max(lats) + 5e-5, 4),
    }
    write_yaml(
        "area.yaml",
        {
            "bbox": bbox,
            "cells_in_study_area": n_in,
            "cells_buffer": n_buf,
            "kecamatan": len(kec),
        },
        header="# GENERATED by pipeline/p01_grid.py. Do not edit by hand.\n"
        "# bbox = study area (Kota Bandung + Dayeuhkolot + Bojongsoang) + 1 km buffer.",
    )
    log(STEP, f"bbox: {bbox}")
    save_figure(kec, grid)
    log(STEP, "wrote grid.parquet, area.yaml, docs/figures/grid.png")


if __name__ == "__main__":
    main()
