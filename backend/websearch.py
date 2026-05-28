"""Web search utilities: DuckDuckGo web search and image search."""
import json
import time
from pathlib import Path

from ddgs import DDGS

_CACHE_FILE = Path(__file__).parent / "image_cache.json"


def _load_cache() -> dict[str, str]:
    try:
        return json.loads(_CACHE_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_cache(cache: dict[str, str]) -> None:
    _CACHE_FILE.write_text(json.dumps(cache, indent=2))


_image_cache: dict[str, str] = _load_cache()


def search_web(query: str, max_results: int = 6) -> list[dict]:
    try:
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results))
    except Exception as e:
        return [{"title": "Search unavailable", "body": str(e), "href": ""}]


def search_perfume_image(perfume_id: str, name: str, brand: str) -> str | None:
    """Search DuckDuckGo images for a perfume bottle photo and cache it."""
    if perfume_id in _image_cache:
        return _image_cache[perfume_id]

    query = f"{brand} {name} perfume bottle"
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=5))
        for r in results:
            url = r.get("image", "")
            if any(d in url for d in ["sephora", "fragrantica", "nordstrom", "ulta", "chanel.com", "dior.com", "tomford", "creed", "jomalone"]):
                _image_cache[perfume_id] = url
                _save_cache(_image_cache)
                return url
        if results:
            url = results[0].get("image", "")
            if url:
                _image_cache[perfume_id] = url
                _save_cache(_image_cache)
                return url
    except Exception:
        pass
    return None


def get_cached_image(perfume_id: str) -> str | None:
    return _image_cache.get(perfume_id)
