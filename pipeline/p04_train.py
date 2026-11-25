"""Demand model with spatial cross-validation.

LightGBM (Poisson) vs a Poisson GLM baseline on log1p(pop_k1), same 5 spatial folds
(GroupKFold, group = H3 resolution-7 parent). Expected count per cell = its out-of-fold prediction.

Outputs
- pipeline/models/coffee_shop_fold{0..4}.lgb
- pipeline/models/metrics.json
- pipeline/data/processed/oof.parquet  (h3, fold, actual, expected, expected_glm, raw_log)
"""

from __future__ import annotations

import json

import h3
import lightgbm as lgb
import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy.stats import spearmanr
from sklearn.metrics import mean_absolute_error, mean_poisson_deviance
from sklearn.model_selection import GroupKFold

from pipeline.common import MODELS, PROCESSED, log, settings

STEP = "04_train"
BUSINESS = "coffee_shop"
N_FOLDS = 5


def lgb_params(seed: int) -> dict:
    return {
        "objective": "poisson",
        "learning_rate": 0.03,
        "n_estimators": 600,
        "num_leaves": 15,
        "min_child_samples": 20,
        "subsample": 0.8,
        "subsample_freq": 1,
        "colsample_bytree": 0.8,
        "reg_lambda": 1.0,
        "random_state": seed,
        "deterministic": True,
        "force_row_wise": True,
        "verbose": -1,
    }


def load_table() -> tuple[pd.DataFrame, list[str]]:
    grid = pd.read_parquet(PROCESSED / "grid.parquet")
    feats = pd.read_parquet(PROCESSED / "features.parquet")
    shops = pd.read_parquet(PROCESSED / "coffee_shops.parquet")
    df = grid[["h3", "in_study_area"]].merge(feats, on="h3", validate="one_to_one")
    df["actual"] = df["h3"].map(shops["h3"].value_counts()).fillna(0).astype(int)
    feature_cols = [c for c in feats.columns if c != "h3"]
    return df, feature_cols


def metrics(y: np.ndarray, pred: np.ndarray) -> dict:
    pred = np.clip(pred, 1e-6, None)
    return {
        "poisson_deviance": round(float(mean_poisson_deviance(y, pred)), 4),
        "mae": round(float(mean_absolute_error(y, pred)), 4),
        "spearman": round(float(spearmanr(y, pred).statistic), 4),
    }


def main() -> None:
    cfg = settings()
    seed = cfg["seed"]
    df, cols = load_table()
    groups = np.array([h3.cell_to_parent(c, cfg["group_resolution"]) for c in df["h3"]])
    log(STEP, f"{len(df)} cells ({int(df['in_study_area'].sum())} in study area), {len(cols)} features, "
              f"{len(set(groups))} res-7 groups, {int(df['actual'].sum())} coffee shops")

    X, y = df[cols], df["actual"].to_numpy()
    oof = np.zeros(len(df))
    oof_raw = np.zeros(len(df))
    oof_glm = np.zeros(len(df))
    fold_of = np.full(len(df), -1)
    per_fold = []
    for k, (tr, te) in enumerate(GroupKFold(n_splits=N_FOLDS).split(X, y, groups)):
        model = lgb.LGBMRegressor(**lgb_params(seed))
        model.fit(X.iloc[tr], y[tr])
        oof_raw[te] = model.predict(X.iloc[te], raw_score=True)
        oof[te] = np.exp(oof_raw[te])
        fold_of[te] = k
        model.booster_.save_model(str(MODELS / f"{BUSINESS}_fold{k}.lgb"))

        x_tr = sm.add_constant(np.log1p(df["pop_k1"].to_numpy()[tr]))
        x_te = sm.add_constant(np.log1p(df["pop_k1"].to_numpy()[te]), has_constant="add")
        glm = sm.GLM(y[tr], x_tr, family=sm.families.Poisson()).fit()
        oof_glm[te] = glm.predict(x_te)
        per_fold.append({"fold": k, "n": len(te), "lgbm": metrics(y[te], oof[te]), "glm": metrics(y[te], oof_glm[te])})

    study = df["in_study_area"].to_numpy()
    result = {
        "business_type": BUSINESS,
        "validation": f"GroupKFold {N_FOLDS} folds, groups = H3 res-{cfg['group_resolution']} parents",
        "features": cols,
        "lgbm_params": lgb_params(seed),
        "study_area": {"n": int(study.sum()), "lgbm": metrics(y[study], oof[study]), "glm": metrics(y[study], oof_glm[study])},
        "all_cells": {"n": len(df), "lgbm": metrics(y, oof), "glm": metrics(y, oof_glm)},
        "per_fold": per_fold,
    }
    s = result["study_area"]
    gain = 1 - s["lgbm"]["poisson_deviance"] / s["glm"]["poisson_deviance"]
    result["deviance_improvement_vs_glm"] = round(gain, 4)
    (MODELS / "metrics.json").write_text(json.dumps(result, indent=2))
    pd.DataFrame(
        {"h3": df["h3"], "fold": fold_of, "actual": y, "expected": oof, "raw_log": oof_raw, "expected_glm": oof_glm}
    ).to_parquet(PROCESSED / "oof.parquet", index=False)
    log(STEP, f"study area LightGBM {s['lgbm']} | GLM {s['glm']} | deviance improvement {gain:.1%}")


if __name__ == "__main__":
    main()
