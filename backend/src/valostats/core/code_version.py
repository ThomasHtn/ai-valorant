"""Fingerprint of the code that computes report views, so a deploy never serves views computed by older code."""

import hashlib
from functools import lru_cache
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
# What a stored view depends on: the calculations, their constants, the fact types and the DTOs.
# Collection, routes and caching code are left out so changing them keeps the stored views.
VIEW_SOURCES = ("analysis", "constants", "domain", "schemas", "services/report_service.py")
# Hex digits kept: enough to tell deploys apart.
DIGEST_LENGTH = 16


@lru_cache
def code_version() -> str:
    digest = hashlib.sha256()
    for source in VIEW_SOURCES:
        root = PACKAGE_ROOT / source
        for path in sorted(root.rglob("*.py")) if root.is_dir() else [root]:
            digest.update(path.relative_to(PACKAGE_ROOT).as_posix().encode())
            digest.update(path.read_bytes())
    return digest.hexdigest()[:DIGEST_LENGTH]
