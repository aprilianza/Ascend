"""Download raw open data for the study bbox (cached under pipeline/data/raw/).

- Overture Places (all categories): used for coffee shops, demand features and mapped-POI counts
- OSM POIs with amenity/shop/office/transport tags (Overpass): coffee shops, features, mapped POIs
- WorldPop Global2 R2025A 2026 raster for Indonesia
"""

from __future__ import annotations

import json

import duckdb
import pandas as pd
import requests

from pipeline.common import RAW, USER_AGENT, bbox_overpass, log, overpass, settings, study_bbox

STEP = "sources"


def overture_places(refresh: bool = False) -> pd.DataFrame:
    cfg = settings()["overture"]
    out = RAW / f"overture_places_{cfg['release']}.parquet"
    if out.exists() and not refresh:
        return pd.read_parquet(out)
    b = study_bbox()
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';")
    src = f"s3://overturemaps-us-west-2/release/{cfg['release']}/theme=places/type=place/*"
    log(STEP, f"querying Overture {cfg['release']} for bbox {b}")
    df = con.execute(
        f"""
        SELECT id,
               names.primary                AS name,
               ST_X(geometry)               AS lon,
               ST_Y(geometry)               AS lat,
               confidence,
               operating_status,
               basic_category,
               taxonomy.primary             AS taxonomy_primary,
               taxonomy.hierarchy           AS taxonomy_hierarchy,
               brand.names.primary          AS brand,
               brand.wikidata               AS brand_wikidata,
               list_transform(sources, lambda s: s.dataset) AS datasets
        FROM read_parquet('{src}', hive_partitioning=1)
        WHERE bbox.xmin BETWEEN {b['xmin']} AND {b['xmax']}
          AND bbox.ymin BETWEEN {b['ymin']} AND {b['ymax']}
        """
    ).df()
    df.to_parquet(out, index=False)
    log(STEP, f"Overture places in bbox: {len(df)}")
    return df


OSM_QUERY = """
[out:json][timeout:240];
(
  nwr["amenity"]({bbox});
  nwr["shop"]({bbox});
  nwr["office"]({bbox});
  nwr["highway"="bus_stop"]({bbox});
  nwr["public_transport"~"platform|station|stop_position"]({bbox});
  nwr["railway"~"station|halt"]({bbox});
);
out center tags;
"""


def _split(b: dict[str, float], n: int) -> list[dict[str, float]]:
    dx, dy = (b["xmax"] - b["xmin"]) / n, (b["ymax"] - b["ymin"]) / n
    return [
        {
            "xmin": round(b["xmin"] + i * dx, 5),
            "xmax": round(b["xmin"] + (i + 1) * dx, 5),
            "ymin": round(b["ymin"] + j * dy, 5),
            "ymax": round(b["ymin"] + (j + 1) * dy, 5),
        }
        for i in range(n)
        for j in range(n)
    ]


def osm_pois(refresh: bool = False) -> pd.DataFrame:
    out = RAW / "osm_pois.parquet"
    if out.exists() and not refresh:
        return pd.read_parquet(out)
    b = study_bbox()
    n = 4  # split the bbox into n x n tiles; one big query times out on public servers
    elements: dict[str, dict] = {}
    stamp = [""]

    def fetch(tile: dict[str, float], depth: int, label: str) -> None:
        try:
            data = overpass(OSM_QUERY.format(bbox=bbox_overpass(tile)), timeout=240, refresh=refresh, attempts=4)
        except RuntimeError:
            if depth >= 3:
                raise
            log(STEP, f"OSM tile {label} failed; splitting into 4")
            for sub in _split(tile, 2):
                fetch(sub, depth + 1, label + "." + str(len(elements) % 10))
            return
        stamp[0] = data.get("osm3s", {}).get("timestamp_osm_base", stamp[0])
        for el in data["elements"]:
            elements[f"{el['type']}{el['id']}"] = el
        log(STEP, f"OSM tile {label}: {len(data['elements'])} elements")

    for k, tile in enumerate(_split(b, n)):
        fetch(tile, 0, f"{k + 1}/{n * n}")
    timestamp = stamp[0]
    rows = []
    for el in elements.values():
        if el["type"] == "node":
            lat, lon = el.get("lat"), el.get("lon")
        else:
            c = el.get("center") or {}
            lat, lon = c.get("lat"), c.get("lon")
        if lat is None or lon is None:
            continue
        t = el.get("tags", {})
        rows.append(
            {
                "id": f"{el['type'][0]}{el['id']}",
                "lat": lat,
                "lon": lon,
                "name": t.get("name"),
                "amenity": t.get("amenity"),
                "shop": t.get("shop"),
                "office": t.get("office"),
                "highway": t.get("highway"),
                "public_transport": t.get("public_transport"),
                "railway": t.get("railway"),
                "cuisine": t.get("cuisine"),
                "brand": t.get("brand"),
                "brand_wikidata": t.get("brand:wikidata"),
                "tags": json.dumps(t, ensure_ascii=False),
            }
        )
    df = pd.DataFrame(rows)
    df.to_parquet(out, index=False)
    log(STEP, f"OSM POIs in bbox: {len(df)} (timestamp {timestamp})")
    (RAW / "osm_timestamp.txt").write_text(timestamp)
    return df


def worldpop_path() -> str:
    cfg = settings()["worldpop"]
    path = RAW / cfg["file"]
    if not path.exists():
        log(STEP, f"downloading WorldPop raster {cfg['url']}")
        tmp = path.with_suffix(".part")
        with requests.get(cfg["url"], stream=True, timeout=600, headers={"User-Agent": USER_AGENT}) as r:
            r.raise_for_status()
            with open(tmp, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
        tmp.rename(path)
    return str(path)


def main() -> None:
    overture_places()
    osm_pois()
    worldpop_path()


if __name__ == "__main__":
    main()
