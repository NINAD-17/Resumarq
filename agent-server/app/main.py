"""
Resumarq Agent Server — FastAPI Application

Entry point for the agent server. Handles:
- API key authentication for internal requests (from Inngest)
- /analyze endpoint to trigger resume analysis
- /health endpoint for monitoring
"""

import logging

from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.security import APIKeyHeader

from app.config import settings
from app.models import AnalyzeRequest, AnalyzeResponse

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Resumarq Agent Server",
    description="Internal AI agent server for resume analysis",
    version="0.1.0",
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
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    _api_key: str = Depends(verify_api_key),
):
    """
    Run multi-agent analysis on a resume against a job description.

    Called by Inngest (via Next.js) when a user creates a new analysis.
    The graph runs synchronously — Inngest handles the async timeout.
    """
    from graph.builder import graph

    # Initial state passed into the graph
    initial_state = {
        "analysis_id": request.analysis_id,
        "resume_s3_key": request.resume_s3_key,
        "jd_text": request.jd_text,
        "resume_bytes": b"",  # Populated by resume_parser_node
        "resume_profile": None,
        "jd_profile": None,
        "ats_audit": None,
        "impact_audit": None,
        "gap_analysis": None,
        "critic_result": None,
        "revision_count": 0,
        "revision_notes": None,
        "final_result": None,
        "status": "processing",
        "error": None,
    }

    logger.info("Starting analysis graph for analysis_id=%s", request.analysis_id)
    try:
        final_state = await graph.ainvoke(initial_state)
    except Exception as e:
        logger.exception("Graph failed for analysis_id=%s", request.analysis_id)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    if final_state.get("status") == "failed" or not final_state.get("final_result"):
        error = final_state.get("error", "Unknown error")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {error}")

    logger.info("Analysis complete for analysis_id=%s", request.analysis_id)
    return AnalyzeResponse(**final_state["final_result"])
