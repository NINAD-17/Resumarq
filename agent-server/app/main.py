"""
Resumarq Agent Server — FastAPI Application

Entry point for the agent server. Handles:
- API key authentication for internal requests (from Inngest)
- /analyze endpoint to trigger resume analysis
- /health endpoint for monitoring
"""

import logging

from fastapi import Depends, FastAPI, HTTPException, Security, BackgroundTasks
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import AnalyzeRequest, AnalyzeAccepted
from app.tasks import run_analysis_task

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Resumarq Agent Server",
    description="Internal AI agent server for resume analysis",
    version="0.1.0",
)

# CORS middleware for Next.js frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API key auth — prevents public access to the agent server
api_key_header = APIKeyHeader(name="X-API-Key")


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """Validate the API key matches the configured secret."""
    if api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key


@app.get("/health")
async def health_check():
    """Health check endpoint — no auth required."""
    return {
        "status": "ok",
        "version": "0.1.0",
        "models": {
            "provider": settings.model_provider,
            "lite": settings.model_lite,
            "flash": settings.model_flash,
            "pro": settings.model_pro,
        }
    }


@app.post("/analyze", response_model=AnalyzeAccepted, status_code=202)
async def analyze(
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    _api_key: str = Depends(verify_api_key),
):
    """
    Run multi-agent analysis on a resume against a job description.

    Called by Inngest (via Next.js) when a user creates a new analysis.
    This endpoint is non-blocking (Fire-and-Forget): it accepts the request,
    queues the graph execution as a background task, and returns 202 Accepted.
    The background task handles saving the results to MongoDB.
    """
    logger.info("Accepting analysis_id=%s for background processing", request.analysis_id)
    
    background_tasks.add_task(run_analysis_task, request)
    
    return AnalyzeAccepted(analysis_id=request.analysis_id)
