"""
Resumarq Agent Server — Redis Worker

Pulls resume analysis jobs from a Redis queue and executes the multi-agent
pipeline asynchronously with configurable concurrency and graceful shutdown.

Usage:
    python -m app.worker
    or
    python worker.py
"""

import asyncio
import json
import logging
import signal
import sys
from typing import Set

import redis.asyncio as aioredis
from pydantic import ValidationError

from app.config import settings
from app.models import AnalyzeRequest
from app.tasks import run_analysis_task
from app.db_writes import mark_analysis_failed

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("worker")

# Set to keep track of active running tasks for graceful shutdown
active_tasks: Set[asyncio.Task] = set()


async def process_job(payload_str: str, semaphore: asyncio.Semaphore) -> None:
    """
    Process a single analysis job dequeued from Redis.
    Releases the concurrency semaphore upon completion or failure.
    """
    analysis_id = "unknown"
    try:
        data = json.loads(payload_str)
        request = AnalyzeRequest.model_validate(data)
        analysis_id = request.analysis_id
        logger.info("🚀 [WORKER] Starting analysis task for analysis_id=%s", analysis_id)

        await run_analysis_task(request)
        logger.info("✅ [WORKER] Finished analysis task for analysis_id=%s", analysis_id)

    except json.JSONDecodeError as e:
        logger.error("❌ [WORKER] Failed to decode JSON payload: %s", str(e))
    except ValidationError as e:
        logger.error("❌ [WORKER] Invalid job payload schema: %s", str(e))
        # If we can extract an analysis_id from raw JSON, mark it as failed in DB
        try:
            raw_id = json.loads(payload_str).get("analysisId") or json.loads(payload_str).get("analysis_id")
            if raw_id:
                await mark_analysis_failed(raw_id, f"Invalid job payload schema: {str(e)}")
        except Exception:
            pass
    except Exception as e:
        logger.exception("❌ [WORKER] Unexpected error processing job for analysis_id=%s: %s", analysis_id, str(e))
        if analysis_id != "unknown":
            try:
                await mark_analysis_failed(analysis_id, f"Worker processing failed: {str(e)}")
            except Exception:
                pass
    finally:
        semaphore.release()


async def run_worker() -> None:
    """
    Main worker loop.
    Connects to Redis, pops jobs from the queue with backpressure, and dispatches them.
    """
    logger.info("=" * 60)
    logger.info("Starting Resumarq Redis Worker")
    logger.info("Queue: %s", settings.redis_queue_name)
    logger.info("Max Concurrency: %d", settings.max_concurrent_tasks)
    logger.info("Model Provider: %s", settings.model_provider)
    logger.info("=" * 60)

    shutdown_event = asyncio.Event()

    # Register OS signal handlers for graceful shutdown (POSIX & Windows compatible)
    loop = asyncio.get_running_loop()

    def handle_shutdown_signal(sig_name: str) -> None:
        logger.info("Received %s signal. Initiating graceful shutdown...", sig_name)
        shutdown_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, lambda s=sig.name: handle_shutdown_signal(s))
        except NotImplementedError:
            # signal handlers via loop are not supported on Windows default event loop
            signal.signal(sig, lambda s, f, s_name=sig.name: handle_shutdown_signal(s_name))

    # Semaphore for concurrency control
    semaphore = asyncio.Semaphore(settings.max_concurrent_tasks)

    # Initialize Redis client
    redis_client = aioredis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_connect_timeout=10,
        socket_keepalive=True,
        retry_on_timeout=True,
    )

    try:
        # Ping Redis to verify connection upfront
        await redis_client.ping()
        logger.info(" Connected to Redis successfully at %s", settings.redis_url.split("@")[-1])
    except Exception as e:
        logger.error("❌ Failed to connect to Redis at %s: %s", settings.redis_url, str(e))
        logger.error("Please verify your REDIS_URL in .env")
        await redis_client.aclose()
        return

    logger.info("Worker is ready and waiting for jobs...")

    while not shutdown_event.is_set():
        try:
            # 1. Acquire semaphore BEFORE popping from Redis
            # This ensures backpressure: if all workers are busy, we don't pop jobs
            # and leave them hanging in memory.
            try:
                # Wait up to 1 second for an available concurrency slot
                await asyncio.wait_for(semaphore.acquire(), timeout=1.0)
            except asyncio.TimeoutError:
                # No slot available right now, loop around and check shutdown_event
                continue

            # 2. Block-pop job from Redis queue with short timeout so we can respond to shutdown
            # BRPOP returns a tuple: (queue_name, payload) or None on timeout
            result = await redis_client.brpop(settings.redis_queue_name, timeout=2)

            if result is None:
                # Timeout without any job, release semaphore and continue
                semaphore.release()
                continue

            _, payload = result
            logger.info("📥 [WORKER] Received job from queue '%s'", settings.redis_queue_name)

            # 3. Spawn background task for processing
            task = asyncio.create_task(process_job(payload, semaphore))
            active_tasks.add(task)
            task.add_done_callback(active_tasks.discard)

        except aioredis.ConnectionError as e:
            logger.warning("Redis connection lost: %s. Reconnecting in 3s...", str(e))
            # If we acquired the semaphore in this iteration, release it
            try:
                semaphore.release()
            except ValueError:
                pass
            await asyncio.sleep(3)
        except Exception as e:
            if not shutdown_event.is_set():
                logger.exception("Unexpected error in worker loop: %s", str(e))
            try:
                semaphore.release()
            except ValueError:
                pass
            await asyncio.sleep(1)

    # Graceful Shutdown
    logger.info("Shutdown event received. Waiting for %d active task(s) to finish...", len(active_tasks))
    if active_tasks:
        done, pending = await asyncio.wait(active_tasks, timeout=30.0)
        if pending:
            logger.warning("Cancelling %d unfinished task(s) due to shutdown timeout", len(pending))
            for t in pending:
                t.cancel()

    await redis_client.aclose()
    logger.info("Worker stopped cleanly.")


def start_worker():
    """CLI entrypoint for running the worker."""
    try:
        asyncio.run(run_worker())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Worker process terminated.")


if __name__ == "__main__":
    start_worker()
