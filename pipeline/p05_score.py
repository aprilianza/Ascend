"""US-006: k-ring gap, labels (negative binomial or Poisson test on k-ring 1) and confidence flag.

Output: pipeline/data/processed/scores.parquet (study cells only)
"""

from __future__ import annotations

import json

import h3
import numpy as np
import pandas as pd

from pipeline.common import PROCESSED, load_yaml, log
from pipeline.tools.contract import LABELS, negbin_label, poisson_label

STEP = "05_score"


def kring(values: pd.Series, cells: list[str]) -> np.ndarray:
    lookup = values.to_dict()
    return np.array([sum(lookup.get(n, 0) for n in h3.grid_disk(c, 1)) for c in cells], dtype="float64")


def nb_dispersion(a: np.ndarray, e: np.ndarray) -> float:
    """Method-of-moments NB2 dispersion: Var(A) = E + d * E^2."""
    return max(0.0, float(np.sum((a - e) ** 2 - e) / np.sum(e**2)))


def score(alpha: float | None = None, method: str | None = None) -> pd.DataFrame:
    p = load_yaml("labels.yaml")
    alpha = p["alpha"] if alpha is None else alpha
    method = p["method"] if method is None else method
    grid = pd.read_parquet(PROCESSED / "grid.parquet")
    oof = pd.read_parquet(PROCESSED / "oof.parquet").set_index("h3")
    feats = pd.read_parquet(PROCESSED / "features.parquet").set_index("h3")
    poi = pd.read_parquet(PROCESSED / "mapped_pois.parquet")["h3"].value_counts()

    study = grid[grid["in_study_area"]].copy()
    cells = study["h3"].tolist()
    # k-ring sums use buffer cells too, so edge hexagons keep all 6 neighbours
    study["actual"] = oof.loc[cells, "actual"].to_numpy()
    study["expected"] = oof.loc[cells, "expected"].to_numpy()
    study["actual_k1"] = kring(oof["actual"], cells).astype(int)
    study["expected_k1"] = kring(oof["expected"], cells)
    study["poi_k1"] = kring(poi, cells).astype(int)
    study["pop_k1"] = feats.loc[cells, "pop_k1"].to_numpy()

    ned = p["not_enough_demand"]
    pop_cut = float(np.percentile(study["pop_k1"], ned["pop_k1_percentile"]))
    study["not_enough_demand"] = (study["pop_k1"] < pop_cut) & (study["expected_k1"] < ned["max_expected_k1"])

    e_round = study["expected_k1"].round(1).to_numpy()  # labels must match the exported (rounded) numbers
    disp = nb_dispersion(study["actual_k1"].to_numpy(), e_round)
    labels, pvals = [], []
    for a, e, n in zip(study["actual_k1"], e_round, study["not_enough_demand"]):
        kw = {"alpha": alpha, "min_gap": p["min_gap"], "not_enough_demand": bool(n)}
        if method == "negbin_kring1":
            lab, pv = negbin_label(int(a), float(e), dispersion=disp, **kw)
        else:
            lab, pv = poisson_label(int(a), float(e), **kw)
        labels.append(lab)
        pvals.append(pv)
    study["label"] = labels
    study["p_value"] = pvals
    study["confidence"] = np.where(study["poi_k1"] < p["low_confidence_min_poi"], "low", "normal")
    study.attrs.update({"alpha": alpha, "method": method, "nb_dispersion": round(disp, 4), "pop_k1_cut": pop_cut})
    return study


def report(study: pd.DataFrame) -> dict:
    share = study["label"].value_counts(normalize=True).reindex(LABELS, fill_value=0)
    oc = share["opportunity"] + share["crowded"]
    ok = share.max() <= 0.60 and 0.05 <= oc <= 0.35
    log(STEP, f"{study.attrs['method']} alpha={study.attrs['alpha']}: " + ", ".join(f"{k} {v:.1%}" for k, v in share.items())
        + f" | opp+crowded {oc:.1%} | low confidence {(study['confidence'] == 'low').mean():.1%}"
        + (" | within targets" if ok else " | OUTSIDE targets"))
    return {"shares": share.round(4).to_dict(), "opp_plus_crowded": round(float(oc), 4), "within_targets": bool(ok)}


def main() -> None:
    study = score()
    summary = report(study)
    a = study.attrs
    log(STEP, f"NB dispersion {a['nb_dispersion']}; not_enough_demand pop_k1 cut (p10): {a['pop_k1_cut']:.0f}")
    # sensitivity (recorded in model_report.md): other alpha values and the plain Poisson test
    sens = {
        f"{m}_alpha_{al}": report(score(alpha=al, method=m))
        for m in ("negbin_kring1", "poisson_kring1")
        for al in (0.01, 0.05, 0.10)
    }
    poisson = score(method="poisson_kring1")
    agree = pd.crosstab(poisson["label"], study["label"]).to_dict()
    study.to_parquet(PROCESSED / "scores.parquet", index=False)
    (PROCESSED / "label_params.json").write_text(
        json.dumps({**study.attrs, "summary": summary, "sensitivity": sens, "poisson_vs_final": agree}, indent=2)
    )


if __name__ == "__main__":
    main()
