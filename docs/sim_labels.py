"""US-006a: simulation that compares three label rules on synthetic data (PRD §10).

All data here is synthetic, not Bandung. The "model" is assumed perfect (expected = true demand),
so in scenario A every opportunity/crowded label is a false alarm.

Run:  python docs/sim_labels.py
"""

from __future__ import annotations

import h3
import numpy as np
from scipy.stats import poisson

# ---- simulation parameters (explained in docs/model_report.md) -------------------------------
SEED = 42
REPS = 20                     # repeat each scenario and average the rates
CENTER = h3.latlng_to_cell(-6.92, 107.61, 9)
DISK_K = 27                   # hexagonal region of 3*27*28+1 = 2269 cells
TARGET_MEAN = 1.8             # mean expected outlets per hexagon
TARGET_SHARE_BELOW_1 = 0.41   # share of hexagons expecting fewer than 1 outlet
SMOOTH_K = 2                  # spatial smoothing of the demand field (k-ring average)
POCKET_SHARE = 0.10           # scenario B: 10% under-supplied + 10% over-supplied cells
UNDER_MULT = 0.25             # actual mean = 0.25 x demand in an under-supplied pocket
OVER_MULT = 2.0               # actual mean = 2.0 x demand in an over-supplied pocket
ALPHA = 0.05
MIN_GAP = 1.0
# v1 rule (PRD v2, 22 Nov): gap = E - A, ratio = (A + 1) / (E + 1)
V1_GAP, V1_RATIO_LOW, V1_RATIO_HIGH = 1.0, 0.67, 1.5
# ----------------------------------------------------------------------------------------------

CELLS = sorted(h3.grid_disk(CENTER, DISK_K))
INDEX = {c: i for i, c in enumerate(CELLS)}
RING1 = [np.array([INDEX[n] for n in h3.grid_disk(c, 1) if n in INDEX]) for c in CELLS]


def _smooth(z: np.ndarray, k: int) -> np.ndarray:
    nb = [np.array([INDEX[n] for n in h3.grid_disk(c, k) if n in INDEX]) for c in CELLS]
    s = np.array([z[ix].mean() for ix in nb])
    return (s - s.mean()) / s.std()


def demand_field(rng: np.random.Generator) -> np.ndarray:
    """Lognormal field, calibrated so mean ~= TARGET_MEAN and P(mu < 1) ~= TARGET_SHARE_BELOW_1."""
    z = _smooth(rng.standard_normal(len(CELLS)), SMOOTH_K)
    best, best_err = None, np.inf
    for sigma in np.linspace(0.3, 2.0, 69):
        a = np.log(TARGET_MEAN) - np.log(np.mean(np.exp(sigma * z)))
        mu = np.exp(a + sigma * z)
        err = abs((mu < 1).mean() - TARGET_SHARE_BELOW_1)
        if err < best_err:
            best, best_err = mu, err
    return best


def pockets(rng: np.random.Generator) -> np.ndarray:
    """0 = normal, +1 = under-supplied, -1 = over-supplied. Pockets are a cell plus its ring."""
    state = np.zeros(len(CELLS), dtype=int)
    target = int(POCKET_SHARE * len(CELLS))
    for sign in (1, -1):
        while (state == sign).sum() < target:
            c = rng.integers(len(CELLS))
            free = RING1[c][state[RING1[c]] == 0]
            state[free[: target - (state == sign).sum()]] = sign
    return state


def rule_v1(a: np.ndarray, e: np.ndarray) -> np.ndarray:
    gap, ratio = e - a, (a + 1) / (e + 1)
    return np.where((gap >= V1_GAP) & (ratio <= V1_RATIO_LOW), 1, np.where((gap <= -V1_GAP) & (ratio >= V1_RATIO_HIGH), -1, 0))


def rule_poisson(a: np.ndarray, e: np.ndarray) -> np.ndarray:
    gap = e - a
    p_low = poisson.cdf(a, e)
    p_high = poisson.sf(a - 1, e)
    return np.where((p_low < ALPHA) & (gap >= MIN_GAP), 1, np.where((p_high < ALPHA) & (gap <= -MIN_GAP), -1, 0))


def rule_poisson_kring(a: np.ndarray, e: np.ndarray) -> np.ndarray:
    a1 = np.array([a[ix].sum() for ix in RING1])
    e1 = np.array([e[ix].sum() for ix in RING1])
    return rule_poisson(a1, e1)


RULES = {
    "v1: per hexagon, gap/ratio": rule_v1,
    "Poisson test, per hexagon": rule_poisson,
    "Poisson test, k-ring 1 (chosen)": rule_poisson_kring,
}


def main() -> None:
    rng = np.random.default_rng(SEED)
    a_rates = {r: np.zeros(2) for r in RULES}
    b_stats = {r: np.zeros(4) for r in RULES}  # TP_opp, labeled_opp, TP_crowd, labeled_crowd
    truth_tot = np.zeros(2)
    mean_mu, below1 = [], []
    for _ in range(REPS):
        mu = demand_field(rng)
        mean_mu.append(mu.mean())
        below1.append((mu < 1).mean())
        actual_a = rng.poisson(mu)
        state = pockets(rng)
        lam = mu * np.where(state == 1, UNDER_MULT, np.where(state == -1, OVER_MULT, 1.0))
        actual_b = rng.poisson(lam)
        truth_tot += [(state == 1).sum(), (state == -1).sum()]
        for name, rule in RULES.items():
            la = rule(actual_a, mu)
            a_rates[name] += [(la == 1).mean(), (la == -1).mean()]
            lb = rule(actual_b, mu)
            b_stats[name] += [
                ((lb == 1) & (state == 1)).sum(),
                (lb == 1).sum(),
                ((lb == -1) & (state == -1)).sum(),
                (lb == -1).sum(),
            ]

    print(f"Synthetic hexagons: {len(CELLS)}, reps: {REPS}, seed: {SEED}")
    print(f"Mean expected per hexagon: {np.mean(mean_mu):.2f}; share expecting < 1: {np.mean(below1):.0%}")
    print()
    print("| Rule | Scenario A: supply = demand (all should be fair) | Scenario B: precision / recall |")
    print("|---|---|---|")
    for name in RULES:
        o, c = a_rates[name] / REPS
        tp_o, n_o, tp_c, n_c = b_stats[name]
        prec_o = tp_o / n_o if n_o else float("nan")
        prec_c = tp_c / n_c if n_c else float("nan")
        rec_o, rec_c = tp_o / truth_tot[0], tp_c / truth_tot[1]
        print(
            f"| {name} | {o:.1%} opportunity, {c:.1%} crowded | "
            f"opportunity {prec_o:.0%} / {rec_o:.0%}, crowded {prec_c:.0%} / {rec_c:.0%} |"
        )


if __name__ == "__main__":
    main()
