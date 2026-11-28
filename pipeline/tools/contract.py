"""Data contract v1.1.0 helpers: label rule + validation.

Used by make_sample_data.py now, and by the real pipeline later
(05_score uses `poisson_label`, 07_export calls `validate_files` before writing).

    python pipeline/tools/contract.py web/public/data/coffee_shop.geojson web/public/data/meta.json

Requires: jsonschema>=4
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

CONTRACT_VERSION = "1.1.0"
REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_DIR = REPO_ROOT / "docs" / "schema"

LABELS = ("opportunity", "fair", "crowded", "not_enough_demand")


# ---------------------------------------------------------------- label rule

def poisson_cdf(k: int, mu: float) -> float:
    """P(X <= k) for X ~ Poisson(mu)."""
    if k < 0:
        return 0.0
    if mu <= 0:
        return 1.0
    term = math.exp(-mu)
    total = term
    for i in range(1, k + 1):
        term *= mu / i
        total += term
    return min(total, 1.0)


def poisson_label(
    actual_k1: int,
    expected_k1: float,
    *,
    alpha: float = 0.05,
    min_gap: float = 1.0,
    not_enough_demand: bool = False,
) -> tuple[str, float | None]:
    """Return (label, one-sided p-value) following the k-ring label rule.

    `not_enough_demand` is decided by the caller (pop_k1 percentile + expected_k1 rule).
    """
    if not_enough_demand:
        return "not_enough_demand", None
    gap = expected_k1 - actual_k1
    p_low = poisson_cdf(actual_k1, expected_k1)              # P(X <= A)
    p_high = 1.0 - poisson_cdf(actual_k1 - 1, expected_k1)   # P(X >= A)
    p_value = p_low if gap >= 0 else p_high
    if p_low < alpha and gap >= min_gap:
        return "opportunity", p_value
    if p_high < alpha and gap <= -min_gap:
        return "crowded", p_value
    return "fair", p_value


def negbin_label(
    actual_k1: int,
    expected_k1: float,
    *,
    dispersion: float,
    alpha: float = 0.05,
    min_gap: float = 1.0,
    not_enough_demand: bool = False,
) -> tuple[str, float | None]:
    """Same rule as `poisson_label`, with a negative binomial test (v1.1.0, method negbin_kring1).

    NB2 parameterisation: mean E, Var = E + dispersion * E^2. dispersion = 0 falls back to Poisson.
    """
    if dispersion <= 0:
        return poisson_label(actual_k1, expected_k1, alpha=alpha, min_gap=min_gap, not_enough_demand=not_enough_demand)
    if not_enough_demand:
        return "not_enough_demand", None
    from scipy.stats import nbinom

    n = 1.0 / dispersion
    p = n / (n + expected_k1) if expected_k1 > 0 else 1.0
    gap = expected_k1 - actual_k1
    p_low = float(nbinom.cdf(actual_k1, n, p))
    p_high = float(nbinom.sf(actual_k1 - 1, n, p))
    p_value = p_low if gap >= 0 else p_high
    if p_low < alpha and gap >= min_gap:
        return "opportunity", p_value
    if p_high < alpha and gap <= -min_gap:
        return "crowded", p_value
    return "fair", p_value


# ---------------------------------------------------------------- validation

def _load(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def schema_errors(instance: dict, schema_name: str) -> list[str]:
    from jsonschema import Draft202012Validator

    schema = _load(SCHEMA_DIR / schema_name)
    validator = Draft202012Validator(schema, format_checker=Draft202012Validator.FORMAT_CHECKER)
    return [
        f"{schema_name}: {'/'.join(map(str, e.absolute_path)) or '<root>'}: {e.message}"
        for e in sorted(validator.iter_errors(instance), key=lambda e: list(e.absolute_path))
    ]


def semantic_errors(areas: dict, meta: dict) -> list[str]:
    """Cross-field rules that JSON Schema cannot express."""
    errs: list[str] = []
    params = meta.get("label_params", {})
    alpha = params.get("alpha", 0.05)
    min_gap = params.get("min_gap", 1.0)

    if areas.get("contract_version") != meta.get("contract_version"):
        errs.append("contract_version differs between areas file and meta.json")
    if areas.get("is_sample") != meta.get("is_sample"):
        errs.append("is_sample differs between areas file and meta.json")
    if params.get("method") == "negbin_kring1" and "nb_dispersion" not in params:
        errs.append("label_params.nb_dispersion is required when method is negbin_kring1")

    seen: set[str] = set()
    counts = dict.fromkeys(LABELS, 0)
    for i, feat in enumerate(areas.get("features", [])):
        p = feat["properties"]
        where = f"features[{i}] ({p['h3']})"
        if p["h3"] in seen:
            errs.append(f"{where}: duplicate h3")
        seen.add(p["h3"])
        counts[p["label"]] += 1

        ring = feat["geometry"]["coordinates"][0]
        if ring[0] != ring[-1]:
            errs.append(f"{where}: polygon ring is not closed")
        if p["actual"] > p["actual_k1"]:
            errs.append(f"{where}: actual > actual_k1")
        if abs(p["gap"] - (p["expected_k1"] - p["actual_k1"])) > 0.06:
            errs.append(f"{where}: gap != expected_k1 - actual_k1")

        effects = [abs(f["effect"]) for f in p["factors"]]
        if effects != sorted(effects, reverse=True):
            errs.append(f"{where}: factors not sorted by |effect| descending")

        if p["label"] == "not_enough_demand":
            if p["p_value"] is not None:
                errs.append(f"{where}: p_value must be null for not_enough_demand")
            continue
        if p["p_value"] is None:
            errs.append(f"{where}: p_value is null but label is {p['label']}")
            continue
        if p["label"] == "opportunity" and not (p["p_value"] < alpha + 1e-4 and p["gap"] >= min_gap - 0.05):
            errs.append(f"{where}: opportunity label does not match p_value/gap")
        if p["label"] == "crowded" and not (p["p_value"] < alpha + 1e-4 and p["gap"] <= -min_gap + 0.05):
            errs.append(f"{where}: crowded label does not match p_value/gap")

    if counts != meta.get("label_counts"):
        errs.append(f"label_counts in meta.json {meta.get('label_counts')} != actual {counts}")

    bt = areas.get("business_type")
    entry = next((b for b in meta.get("business_types", []) if b["id"] == bt), None)
    if entry is None or not entry["available"]:
        errs.append(f"business_type '{bt}' is not listed as available in meta.json")
    return errs


def validate(areas: dict, meta: dict) -> list[str]:
    return schema_errors(areas, "areas.schema.json") + schema_errors(meta, "meta.schema.json") + semantic_errors(areas, meta)


def validate_files(areas_path: Path, meta_path: Path) -> list[str]:
    errs = validate(_load(areas_path), _load(meta_path))
    size_mb = areas_path.stat().st_size / 1_000_000
    if size_mb > 3:
        errs.append(f"{areas_path.name} is {size_mb:.2f} MB (limit 3 MB)")
    return errs


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: python pipeline/tools/contract.py <areas.geojson> <meta.json>")
    problems = validate_files(Path(sys.argv[1]), Path(sys.argv[2]))
    for msg in problems:
        print("FAIL", msg)
    print("OK: files match data contract v" + CONTRACT_VERSION if not problems else f"{len(problems)} problem(s)")
    sys.exit(1 if problems else 0)
