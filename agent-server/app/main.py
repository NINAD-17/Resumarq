"""
Resumarq Agent Server — FastAPI Application

Entry point for the agent server. Handles:
- API key authentication for internal requests (from Inngest)
- /analyze endpoint to trigger resume analysis
- /health endpoint for monitoring
"""

from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.security import APIKeyHeader

from app.config import settings
from app.models import AnalyzeRequest, AnalyzeResponse

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
    Run AI analysis on a resume against a job description.

    Called by Inngest (via Next.js) when a user creates a new analysis.
    """
    # TODO: Wire to LangGraph pipeline in C6
    raise HTTPException(
        status_code=501,
        detail="Analysis pipeline not yet connected",
    )
