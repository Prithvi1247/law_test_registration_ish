"""
In-memory rate limiting, keyed per caller.

Deliberately simple: a dict of deques guarded by a lock. This is enough
for a single backend process. If this app runs multiple worker
processes/containers behind a load balancer, this limiter's state is
per-process, not shared — requests get a higher effective limit than
configured since each worker counts independently. If that matters for
your deployment, swap this for a shared store (Redis `INCR` + `EXPIRE` is
the usual choice) — `is_allowed()` below is the only function that would
need to change.
"""

import threading
import time
from collections import defaultdict, deque

from . import config

_lock = threading.Lock()
_requests: dict[str, deque] = defaultdict(deque)


def is_allowed(key: str) -> bool:
    """Returns True and records the request if `key` is under its limit
    for the current window; returns False (and records nothing) if not."""
    now = time.monotonic()
    window_start = now - config.RATE_LIMIT_WINDOW_SECONDS

    with _lock:
        bucket = _requests[key]
        while bucket and bucket[0] < window_start:
            bucket.popleft()

        if len(bucket) >= config.RATE_LIMIT_MAX_REQUESTS:
            return False

        bucket.append(now)
        return True
