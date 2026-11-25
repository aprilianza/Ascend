"""Run the whole Ascend pipeline:  python -m pipeline.run  [--from STEP]

Steps: grid -> sources -> places -> features -> train -> score -> explain -> export
"""

from __future__ import annotations

import argparse
import importlib
import time

STEPS = [
    ("grid", "pipeline.p01_grid"),
    ("sources", "pipeline.sources"),
    ("places", "pipeline.p02_places"),
    ("features", "pipeline.p03_features"),
    ("train", "pipeline.p04_train"),
    ("score", "pipeline.p05_score"),
    ("explain", "pipeline.p06_explain"),
    ("export", "pipeline.p07_export"),
]


def main() -> None:
    ap = argparse.ArgumentParser(description="Run the Ascend data pipeline")
    ap.add_argument("--from", dest="start", choices=[s for s, _ in STEPS], default="grid")
    args = ap.parse_args()
    names = [s for s, _ in STEPS]
    for name, module in STEPS[names.index(args.start):]:
        t = time.time()
        print(f"=== {name} ===", flush=True)
        importlib.import_module(module).main()
        print(f"=== {name} done in {time.time() - t:.0f}s ===", flush=True)


if __name__ == "__main__":
    main()
