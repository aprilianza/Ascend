"""Export web/public/data/coffee_shop.geojson + meta.json (data contract v1.1.0).

The files are validated with pipeline/tools/contract.py first; on any problem the pipeline stops
and the existing files are left untouched.
"""

from __future__ import annotations

import json
import os
import tempfile
from datetime import UTC, datetime

import h3
import pandas as pd

from pipeline.common import MODELS, PROCESSED, RAW, WEB_DATA, load_yaml, log, settings
from pipeline.tools.contract import CONTRACT_VERSION, LABELS, validate_files

STEP = "07_export"
BUSINESS = "coffee_shop"


def ring(cell: str) -> list[list[float]]:
    pts = [[round(lng, 5), round(lat, 5)] for lat, lng in h3.cell_to_boundary(cell)]
    area2 = sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]))
    if area2 < 0:  # RFC 7946: exterior ring counter-clockwise
        pts.reverse()
    return [*pts, pts[0]]


def build() -> tuple[dict, dict]:
    cfg = settings()
    lp = load_yaml("labels.yaml")
    scores = pd.read_parquet(PROCESSED / "scores.parquet")
    factors = pd.read_parquet(PROCESSED / "factors.parquet").set_index("h3")["factors"].map(json.loads)
    m = json.loads((MODELS / "metrics.json").read_text())
    lparams = json.loads((PROCESSED / "label_params.json").read_text())
    now = datetime.now(UTC).replace(microsecond=0).isoformat()

    features = []
    for r in scores.itertuples(index=False):
        e1 = round(float(r.expected_k1), 1)
        props = {
            "h3": r.h3,
            "kecamatan": r.kecamatan,
            "area_name": r.area_name,
            "actual": int(r.actual),
            "expected": round(float(r.expected), 1),
            "actual_k1": int(r.actual_k1),
            "expected_k1": e1,
            "gap": round(e1 - int(r.actual_k1), 1),
            "p_value": None if r.p_value is None or pd.isna(r.p_value) else round(float(r.p_value), 4),
            "label": r.label,
            "confidence": r.confidence,
            "factors": factors[r.h3],
        }
        features.append({"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [ring(r.h3)]}, "properties": props})

    areas = {
        "type": "FeatureCollection",
        "contract_version": CONTRACT_VERSION,
        "business_type": BUSINESS,
        "is_sample": False,
        "generated_at": now,
        "features": features,
    }
    counts = scores["label"].value_counts().reindex(LABELS, fill_value=0).astype(int).to_dict()
    osm_ts = (RAW / "osm_timestamp.txt").read_text().strip() if (RAW / "osm_timestamp.txt").exists() else "unknown"
    meta = {
        "contract_version": CONTRACT_VERSION,
        "generated_at": now,
        "is_sample": False,
        "business_types": [
            {"id": "coffee_shop", "label": "Coffee shop", "available": True, "file": "coffee_shop.geojson"},
            {"id": "eatery", "label": "Eatery", "available": False, "file": None},
        ],
        "data_sources": [
            {"name": "Overture Maps Places", "version": cfg["overture"]["release"],
             "license": "CDLA-Permissive-2.0 and others", "attribution": "© Overture Maps Foundation"},
            {"name": "OpenStreetMap", "version": f"Overpass snapshot {osm_ts[:10]}",
             "license": "ODbL 1.0", "attribution": "© OpenStreetMap contributors"},
            {"name": "WorldPop Global2 R2025A", "version": str(cfg["worldpop"]["year"]),
             "license": "CC BY 4.0", "attribution": "WorldPop (doi:10.5258/SOTON/WP00839)"},
        ],
        "model": {
            "name": "LightGBM (Poisson)",
            "validation": m["validation"],
            "metrics": m["study_area"]["lgbm"],
            "baseline_metrics": m["study_area"]["glm"],
        },
        "label_params": {
            "method": lparams["method"],
            "alpha": lp["alpha"],
            "min_gap": lp["min_gap"],
            "not_enough_demand_max_expected_k1": lp["not_enough_demand"]["max_expected_k1"],
            "low_confidence_min_poi": lp["low_confidence_min_poi"],
            **({"nb_dispersion": lparams["nb_dispersion"]} if lparams["method"] == "negbin_kring1" else {}),
        },
        "label_counts": counts,
    }
    return areas, meta


def write_atomic(areas: dict, meta: dict) -> None:
    """Validate in a temp dir; replace the web files only if the contract passes."""
    WEB_DATA.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=WEB_DATA.parent) as tmp:
        a_tmp = os.path.join(tmp, f"{BUSINESS}.geojson")
        m_tmp = os.path.join(tmp, "meta.json")
        with open(a_tmp, "w", encoding="utf-8") as f:
            json.dump(areas, f, ensure_ascii=False, separators=(",", ":"))
        with open(m_tmp, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
        from pathlib import Path

        problems = validate_files(Path(a_tmp), Path(m_tmp))
        if problems:
            for p in problems[:20]:
                log(STEP, f"FAIL {p}")
            raise SystemExit(f"Export violates data contract v{CONTRACT_VERSION}; existing files kept")
        os.replace(a_tmp, WEB_DATA / f"{BUSINESS}.geojson")
        os.replace(m_tmp, WEB_DATA / "meta.json")
    size = (WEB_DATA / f"{BUSINESS}.geojson").stat().st_size / 1e6
    log(STEP, f"wrote {len(areas['features'])} areas ({size:.2f} MB) + meta.json; contract v{CONTRACT_VERSION} OK")


def main() -> None:
    areas, meta = build()
    write_atomic(areas, meta)
    log(STEP, f"label counts: {meta['label_counts']}")


if __name__ == "__main__":
    main()
