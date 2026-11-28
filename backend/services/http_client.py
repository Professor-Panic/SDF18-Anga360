"""Tiny JSON-over-HTTP helper for the backend's calls to other services (standard library only)."""

import json
import urllib.error
import urllib.parse
import urllib.request


class UpstreamError(Exception):

    def __init__(self, message, status=502):
        super().__init__(message)
        self.message = message
        self.status = status


def request_json(url, *, data=None, headers=None, timeout=15):
    """GET `url`, or POST `data` (a dict, sent as a form) when it is given, and parse the JSON reply.
    HTTP error statuses (401, 404, 429...) are re-raised as urllib.error.HTTPError so the caller
    can decide what each one means. Network failures and non-JSON replies become UpstreamError.
    """
    body = urllib.parse.urlencode(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers or {}, method="POST" if body else "GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError:
        raise  # must come before URLError: HTTPError is a subclass of it
    except (urllib.error.URLError, OSError) as e:  # DNS failure, refused, timed out, blocked...
        raise UpstreamError("Couldn't reach the data provider. Try again in a moment.") from e
    except ValueError as e:  # the body wasn't JSON
        raise UpstreamError("The data provider sent back something we couldn't read.") from e
