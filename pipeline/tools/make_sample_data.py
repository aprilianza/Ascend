"""Generate SYNTHETIC sample data that follows data contract v1.0.0.

Purpose: let the web team build the map, card, and shortlist before the real
model exists. Every number here is random. Do not use it in the proposal,
video, or screenshots. The real pipeline (07_export) overwrites these files.

    python pipeline/tools/make_sample_data.py            # writes web/public/data/
    python pipeline/tools/make_sample_data.py --out DIR

Requires: h3>=4, jsonschema>=4
"""

from __future__ import annotations

import argparse
import json
import random
from datetime import datetime, timezone
from pathlib import Path

import h3

from contract import CONTRACT_VERSION, LABELS, REPO_ROOT, poisson_label, validate

SEED = 42
RES = 9
ALPHA = 0.05
MIN_GAP = 1.0
NOT_ENOUGH_DEMAND_MAX_E = 0.3

# Three clusters of 19 hexagons (k-ring 2). Profiles are invented, not findings.
# The 7 hexagons at each cluster centre form a "pocket" whose supply is multiplied
# by pocket_mult, so the sample contains crowded and opportunity pockets.
CLUSTERS = [
    # name, lat, lon, kecamatan, area_name, mean expected per hex, pocket_mult
    ("dense", -6.8915, 107.6107, "Coblong", "kota_bandung", 2.2, 2.5),
    ("mixed", -6.9733, 107.6303, "Dayeuhkolot", "telkom_area", 2.0, 0.05),
    ("sparse", -6.9550, 107.6950, "Gedebage", "kota_bandung", 0.03, 1.0),
]

# feature -> (text when effect > 0, text when effect < 0)
FACTOR_TEXT = {
    "pop_k1": ("Many residents nearby", "Few residents nearby"),
    "campus_k2": ("Campus nearby", "No campus nearby"),
    "office_k1": ("Many offices nearby", "Few offices nearby"),
    "transit_k1": ("Good bus and angkot access", "Little public transport nearby"),
    "dist_station_m": ("Close to a train station", "Far from a train station"),
    "school_k1": ("Schools nearby", "Few schools nearby"),
}


def poisson_draw(rng: random.Random, mu: float) -> int:
    # Knuth; fine for small mu
    if mu <= 0:
        return 0
    limit, k, p = pow(2.718281828459045, -mu), 0, 1.0
    while True:
        p *= rng.random()
        if p <= limit:
            return k
        k += 1


def ring_geometry(cell: str) -> dict:
    ring = [[round(lng, 5), round(lat, 5)] for lat, lng in h3.cell_to_boundary(cell)]
    # GeoJSON (RFC 7946): exterior ring counter-clockwise
    area2 = sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]))
    if area2 < 0:
        ring.reverse()
    ring.append(ring[0])
    return {"type": "Polygon", "coordinates": [ring]}


def make_factors(rng: random.Random) -> list[dict]:
    feats = rng.sample(sorted(FACTOR_TEXT), 3)
    effects = sorted((round(rng.uniform(0.1, 1.2) * rng.choice([1, -1]), 1) or 0.1 for _ in feats), key=abs, reverse=True)
    return [
        {"feature": f, "text": FACTOR_TEXT[f][0 if e > 0 else 1], "effect": e}
        for f, e in zip(feats, effects)
    ]


def build(rng: random.Random) -> tuple[dict, dict]:
    cells: dict[str, dict] = {}
    for name, lat, lon, kec, area, mean_e, pocket_mult in CLUSTERS:
        center = h3.latlng_to_cell(lat, lon, RES)
        pocket = set(h3.grid_disk(center, 1))
        for cell in sorted(h3.grid_disk(center, 2)):
            e = max(0.0, rng.gauss(mean_e, mean_e * 0.35))
            mult = pocket_mult if cell in pocket else 1.0
            cells[cell] = {
                "cluster": name,
                "kecamatan": kec,
                "area_name": area,
                "expected_raw": e,
                "actual": poisson_draw(rng, e * mult),
            }

    # k-ring sums over cells present in the sample (edges are truncated; fine for a sample)
    features = []
    for cell, c in cells.items():
        ring = [n for n in h3.grid_disk(cell, 1) if n in cells]
        a_k1 = sum(cells[n]["actual"] for n in ring)
        e_k1 = round(sum(cells[n]["expected_raw"] for n in ring), 1)
        label, p = poisson_label(
            a_k1, e_k1, alpha=ALPHA, min_gap=MIN_GAP,
            not_enough_demand=e_k1 < NOT_ENOUGH_DEMAND_MAX_E,
        )
        features.append({
            "type": "Feature",
            "geometry": ring_geometry(cell),
            "properties": {
                "h3": cell,
                "kecamatan": c["kecamatan"],
                "area_name": c["area_name"],
                "actual": c["actual"],
                "expected": round(c["expected_raw"], 1),
                "actual_k1": a_k1,
                "expected_k1": e_k1,
                "gap": round(e_k1 - a_k1, 1),
                "p_value": None if p is None else round(p, 4),
                "label": label,
                "confidence": "low" if c["cluster"] == "sparse" else "normal",
                "factors": make_factors(rng),
            },
        })

    # Planted edge cases so every UI state can be designed
    props = [f["properties"] for f in features]
    mixed = [p for p in props if p["area_name"] == "telkom_area"]
    for p in mixed[:2]:
        p["confidence"] = "low"                        # low confidence outside the sparse cluster
    sparse = [p for p in props if p["kecamatan"] == "Gedebage"]
    for p in sparse[:2]:
        p["kecamatan"] = None                          # unknown district -> "Unnamed area"
    dense = [p for p in props if p["kecamatan"] == "Coblong"]
    for p in dense[-4:]:
        p["kecamatan"] = "Cibeunying Kidul"            # longer district name

    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    counts = dict.fromkeys(LABELS, 0)
    for p in props:
        counts[p["label"]] += 1

    areas = {
        "type": "FeatureCollection",
        "contract_version": CONTRACT_VERSION,
        "business_type": "coffee_shop",
        "is_sample": True,
        "generated_at": now,
        "features": features,
    }
    meta = {
        "contract_version": CONTRACT_VERSION,
        "generated_at": now,
        "is_sample": True,
        "business_types": [
            {"id": "coffee_shop", "label": "Coffee shop", "available": True, "file": "coffee_shop.geojson"},
            {"id": "eatery", "label": "Eatery", "available": False, "file": None},
        ],
        "data_sources": [
            {"name": "Synthetic sample", "version": "seed 42", "license": "n/a",
             "attribution": "Sample data, not real results"},
            {"name": "Overture Maps Places", "version": "TBD (real run)", "license": "CDLA-Permissive-2.0 and others",
             "attribution": "© Overture Maps Foundation"},
            {"name": "OpenStreetMap", "version": "TBD (real run)", "license": "ODbL 1.0",
             "attribution": "© OpenStreetMap contributors"},
            {"name": "WorldPop Global2 R2025A", "version": "2026", "license": "CC BY 4.0",
             "attribution": "WorldPop (doi:10.5258/SOTON/WP00839)"},
        ],
        "model": None,
        "label_params": {
            "method": "poisson_kring1",
            "alpha": ALPHA,
            "min_gap": MIN_GAP,
            "not_enough_demand_max_expected_k1": NOT_ENOUGH_DEMAND_MAX_E,
            "low_confidence_min_poi": 3,
        },
        "label_counts": counts,
    }
    return areas, meta


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, default=REPO_ROOT / "web" / "public" / "data")
    args = ap.parse_args()

    areas, meta = build(random.Random(SEED))

    problems = validate(areas, meta)
    if problems:
        raise SystemExit("Sample violates the contract:\n" + "\n".join(problems))

    counts = meta["label_counts"]
    missing = [k for k, v in counts.items() if v == 0]
    if missing:
        raise SystemExit(f"Sample is missing labels {missing}; change SEED or CLUSTERS")

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "coffee_shop.geojson").write_text(json.dumps(areas, indent=2) + "\n", encoding="utf-8")
    (args.out / "meta.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(areas['features'])} sample hexagons to {args.out}")
    print("Label counts:", counts)


if __name__ == "__main__":
    main()
