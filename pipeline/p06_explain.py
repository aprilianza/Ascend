"""US-007: top-3 SHAP factors per hexagon, from the fold model that made its OOF prediction.

Output: pipeline/data/processed/factors.parquet (h3, factors[list of 3 dicts], additivity_err)
"""

from __future__ import annotations

import json

import lightgbm as lgb
import numpy as np
import pandas as pd
import shap

from pipeline.common import MODELS, PROCESSED, load_yaml, log

STEP = "06_explain"
BUSINESS = "coffee_shop"
ADDITIVITY_TOL = 0.01


def main() -> None:
    texts = load_yaml("feature_labels.yaml")
    cols = json.loads((MODELS / "metrics.json").read_text())["features"]
    missing = [c for c in cols if c not in texts]
    if missing:
        raise SystemExit(f"feature_labels.yaml has no text for: {missing}")

    grid = pd.read_parquet(PROCESSED / "grid.parquet")
    feats = pd.read_parquet(PROCESSED / "features.parquet").set_index("h3")
    oof = pd.read_parquet(PROCESSED / "oof.parquet").set_index("h3")
    study_cells = grid.loc[grid["in_study_area"], "h3"].tolist()
    median = feats.loc[study_cells, cols].median()

    rows = []
    for k in sorted(oof["fold"].unique()):
        cells = [c for c in study_cells if oof.at[c, "fold"] == k]
        if not cells:
            continue
        booster = lgb.Booster(model_file=str(MODELS / f"{BUSINESS}_fold{k}.lgb"))
        X = feats.loc[cells, cols]
        ex = shap.TreeExplainer(booster)
        sv = ex.shap_values(X)
        base = float(np.ravel(ex.expected_value)[0])
        raw = booster.predict(X, raw_score=True)
        err = np.abs(base + sv.sum(axis=1) - raw)
        drift = np.abs(raw - oof.loc[cells, "raw_log"].to_numpy()).max()
        if drift > 1e-6:
            raise SystemExit(f"fold {k}: reloaded model does not reproduce the OOF prediction ({drift})")
        for i, c in enumerate(cells):
            top = np.argsort(-np.abs(sv[i]))[:3]
            factors = []
            for j in top:
                f = cols[j]
                side = "high" if X.iat[i, j] > median[f] else "low"
                factors.append({"feature": f, "text": texts[f][side], "effect": round(float(sv[i, j]), 2)})
            # keep |effect| order after rounding (contract rule)
            factors.sort(key=lambda d: abs(d["effect"]), reverse=True)
            rows.append({"h3": c, "factors": factors, "additivity_err": float(err[i])})

    out = pd.DataFrame(rows)
    worst = out["additivity_err"].max()
    log(STEP, f"SHAP for {len(out)} study cells; max additivity error {worst:.2e} (limit {ADDITIVITY_TOL})")
    if worst > ADDITIVITY_TOL:
        raise SystemExit("SHAP additivity check failed")
    out["factors"] = out["factors"].apply(json.dumps)
    out.to_parquet(PROCESSED / "factors.parquet", index=False)


if __name__ == "__main__":
    main()
