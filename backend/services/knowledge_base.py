from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1] / 'ml' / 'knowledge_base'
KNOWLEDGE_BASE_PATH = BASE_DIR / 'disease_knowledge_base.json'


@lru_cache(maxsize=1)
def load_disease_knowledge_base() -> dict[str, dict[str, Any]]:
    with KNOWLEDGE_BASE_PATH.open('r', encoding='utf-8') as file_handle:
        return json.load(file_handle)
