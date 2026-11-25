"""Shared paths, config loading and download helpers for the Ascend pipeline."""

from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import Any

import requests
import yaml

ROOT = Path(__file__).resolve().parents[1]
PIPE = ROOT / "pipeline"
CONFIG = PIPE / "config"
DATA = PIPE / "data"
RAW = DATA / "raw"
PROCESSED = DATA / "processed"
CACHE = DATA / "cache"
BOUNDARIES = DATA / "boundaries"
MODELS = PIPE / "models"
DOCS = ROOT / "docs"
FIGURES = DOCS / "figures"
WEB_DATA = ROOT / "web" / "public" / "data"

USER_AGENT = "ascend-pipeline/0.1 (STACK 2026 student project)"
OVERPASS_URLS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)

for _d in (RAW, PROCESSED, CACHE, BOUNDARIES, MODELS, FIGURES):
    _d.mkdir(parents=True, exist_ok=True)


def load_yaml(name: str) -> dict[str, Any]:
    with open(CONFIG / name, encoding="utf-8") as f:
        return yaml.safe_load(f)


def write_yaml(name: str, data: dict[str, Any], header: str = "") -> None:
    with open(CONFIG / name, "w", encoding="utf-8") as f:
        if header:
            f.write(header.rstrip() + "\n")
        yaml.safe_dump(data, f, sort_keys=False, allow_unicode=True)


def settings() -> dict[str, Any]:
    return load_yaml("settings.yaml")


def study_bbox() -> dict[str, float]:
    """Bounding box of the study area + buffer, written by p01_grid."""
    return load_yaml("area.yaml")["bbox"]


def overpass(query: str, *, timeout: int = 300, refresh: bool = False) -> dict[str, Any]:
    """Run an Overpass query with an on-disk cache and simple mirror fallback."""
    key = hashlib.sha256(query.encode()).hexdigest()[:16]
    path = CACHE / "overpass" / f"{key}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text())
    path.parent.mkdir(parents=True, exist_ok=True)
    last_err: Exception | None = None
    for attempt in range(4):
        url = OVERPASS_URLS[attempt % len(OVERPASS_URLS)]
        try:
            r = requests.post(
                url,
                data={"data": query},
                headers={"User-Agent": USER_AGENT},
                timeout=timeout + 60,
            )
            if r.status_code == 200:
                path.write_text(r.text)
                return r.json()
            last_err = RuntimeError(f"{url} returned {r.status_code}: {r.text[:200]}")
        except requests.RequestException as e:
            last_err = e
        time.sleep(10 * (attempt + 1))
    raise RuntimeError(f"Overpass query failed: {last_err}")


def bbox_overpass(b: dict[str, float]) -> str:
    """Overpass bbox order is (south, west, north, east)."""
    return f"{b['ymin']},{b['xmin']},{b['ymax']},{b['xmax']}"


def log(step: str, msg: str) -> None:
    print(f"[{step}] {msg}", flush=True)
