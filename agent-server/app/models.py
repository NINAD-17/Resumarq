"""
Resumarq Agent Server — Request/Response Models

Pydantic models for the /analyze endpoint.
These match the types defined in web/types/analysis.ts → AnalysisResults.
"""

from pydantic import BaseModel, Field


# ─── Request ──────────────────────────────────────────────────────


class AnalyzeRequest(BaseModel):
    """Incoming request from Inngest via Next.js."""

    model_config = {"populate_by_name": True}

    analysis_id: str = Field(alias="analysisId")
    resume_s3_key: str = Field(alias="resumeS3Key")
    jd_text: str | None = Field(default=None, alias="jdText")


# ─── Response Models ──────────────────────────────────────────────


class AnalysisScores(BaseModel):
    overall: int  # Critic's holistic score (0-100)
    ats: int  # ATS score, calculated from rules (0-100)
    impact: int  # Impact score, calculated from bullets (0-100)
    match: int | None = None  # Match score vs JD (0-100), null if no JD provided


class AnalyzeResponse(BaseModel):
    """
    Complete analysis results returned by the multi-agent graph.
    Written to MongoDB by Inngest after this is returned.
    Matches AnalysisResults in web/types/analysis.ts.
    """

    scores: AnalysisScores

    # Critic's 2-3 sentence human-readable conclusion
    summary: str

    # Full structured audit outputs (serialized Pydantic models)
    ats_audit: dict  # ATSAuditResult — list of rules with pass/warning/critical
    impact_audit: dict  # ImpactAuditResult — bullet scores and rewrites
    gap_analysis: dict | None = None  # GapAnalysisResult or null (resume-only)

    # Critic's additional findings that other agents missed
    additional_findings: list[dict] = []

    # Convenience fields extracted from gap_analysis
    matched_skills: list[str] = []  # Required skills present in resume
    missing_skills: list[str] = []  # Required skills absent from resume
