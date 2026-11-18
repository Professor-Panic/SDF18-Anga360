import os

import psycopg
from psycopg.rows import dict_row


def get_db():
    """FastAPI dependency: one connection per request, closed when the request ends."""
    with psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row) as db:
        yield db
