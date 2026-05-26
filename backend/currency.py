"""Live USD → INR conversion with 1-hour cache and fallback."""
import time
import requests

_FALLBACK_RATE = 84.0
_cached_rate: float = _FALLBACK_RATE
_cache_ts: float = 0.0
_CACHE_TTL = 3600  # refresh every hour


def get_usd_to_inr() -> float:
    global _cached_rate, _cache_ts
    if time.time() - _cache_ts < _CACHE_TTL:
        return _cached_rate
    try:
        r = requests.get("https://open.er-api.com/v6/latest/USD", timeout=5)
        rate = r.json()["rates"]["INR"]
        _cached_rate = float(rate)
        _cache_ts = time.time()
    except Exception:
        pass   # keep last cached or fallback
    return _cached_rate


def usd_to_inr(usd: int | float | None) -> int | None:
    if usd is None:
        return None
    return round(usd * get_usd_to_inr() / 100) * 100   # round to nearest ₹100
