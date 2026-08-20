"""
Resumarq Agent Server — Worker Runner

Entrypoint script for launching the Redis background worker.
Implementation lives in app.worker.
"""

from app.worker import start_worker

if __name__ == "__main__":
    start_worker()
