"""
Resumarq Agent Server — Monitoring & Health API

Provides health checks, Redis queue depth monitoring, and system metrics.
Called strictly server-to-server (e.g. Next.js server, AWS ALB, Docker healthcheck).
Jobs are processed asynchronously by the Redis worker (app.worker).
"""

import logging
import redis.asyncio as aioredis
from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.security import APIKeyHeader

from app.config import settings
from app.db import client as mongo_client

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Resumarq Agent Server",
    description="Internal Monitoring & Health API for Resumarq AI Agent Pipeline",
    version="0.2.0",
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str | None = Security(api_key_header)) -> str | None:
    """Validate API key if API_KEY is configured in settings."""
    if settings.api_key and api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key


@app.get("/health")
async def health_check():
    """
    Lightweight public health check endpoint for AWS ALB, Docker, or internal monitors.
    Returns 200 OK without requiring authentication.
    """
    return {"status": "ok", "version": "0.2.0"}


@app.get("/status")
async def status_check(_api_key: str | None = Depends(verify_api_key)):
    """
    Detailed system status & queue metrics endpoint (protected by X-API-Key if configured).
    Checks connectivity to MongoDB, Redis, and reports current queue depth and model configuration.
    """
    # Check MongoDB
    mongo_status = "connected"
    try:
        await mongo_client.admin.command("ping")
    except Exception as e:
        mongo_status = f"error: {str(e)}"

    # Check Redis
    redis_status = "connected"
    queue_length = 0
    try:
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        await r.ping()
        queue_length = await r.llen(settings.redis_queue_name)
        await r.aclose()
    except Exception as e:
        redis_status = f"error: {str(e)}"

    overall_status = "ok" if mongo_status == "connected" and redis_status == "connected" else "degraded"

    return {
        "status": overall_status,
        "version": "0.2.0",
        "mongodb": mongo_status,
        "redis": {
            "status": redis_status,
            "queue_name": settings.redis_queue_name,
            "pending_jobs": queue_length,
        },
        "models": {
            "provider": settings.model_provider,
            "lite": settings.model_lite,
            "flash": settings.model_flash,
            "pro": settings.model_pro,
        },
        "concurrency_limit": settings.max_concurrent_tasks,
    }
