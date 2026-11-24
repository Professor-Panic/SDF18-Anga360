"""Currency exchange rates (USD base), fetched once on the server and shared by everyone.

The source updates about once a day, so we keep what we fetched for 6 hours. If the source is
down we hand back the last rates we had, marked stale, rather than nothing.
"""

import threading
import time
import urllib.error

from .http_client import UpstreamError, request_json

URL = "https://open.er-api.com/v6/latest/USD"  # free, no key
CACHE_SECONDS = 6 * 3600
RETRY_SECONDS = 60  # after a failure, wait this long before bothering the source again

_lock = threading.Lock()
_state = {"rates": None, "fetched": 0.0, "stale": False, "failed_at": 0.0}


def get_rates():
    """-> {"rates": {"USD": 1, "KES": 129.1, ...}, "stale": bool}. Raises UpstreamError if we have nothing."""
    with _lock:
        now = time.time()
        if _state["rates"] and now - _state["fetched"] < CACHE_SECONDS:
            return {"rates": _state["rates"], "stale": _state["stale"]}
        if not _state["rates"] and now - _state["failed_at"] < RETRY_SECONDS:
            raise UpstreamError("Exchange rates aren't available right now.", 502)

        try:
            data = request_json(URL, timeout=5)
            rates = data["rates"]
            if data.get("result") != "success" or not rates.get("KES"):
                raise ValueError("unexpected rates payload")
        except (UpstreamError, urllib.error.HTTPError, KeyError, ValueError, TypeError, AttributeError) as e:
            print("Exchange-rate fetch failed:", e)
            _state["failed_at"] = now
            if _state["rates"]:  # keep serving the old rates, and try again in a minute
                _state.update(fetched=now - CACHE_SECONDS + RETRY_SECONDS, stale=True)
                return {"rates": _state["rates"], "stale": True}
            raise UpstreamError("Exchange rates aren't available right now.", 502) from e

        _state.update(rates=rates, fetched=now, stale=False)
        return {"rates": rates, "stale": False}
