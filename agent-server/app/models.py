"""
Resumarq Agent Server — Request/Response Models

Pydantic models for the /analyze endpoint.
These match the types defined in web/types/analysis.ts.
"""

from pydantic import BaseModel


# ─── Request ──────────────────────────────────────────────────────


class AnalyzeRequest(BaseModel):
    """Incoming request from Inngest via Next.js."""

    analysis_id: str
    resume_s3_key: str
    jd_text: str


# ─── Response (matches web/types/analysis.ts → AnalysisResults) ──


class AnalysisScores(BaseModel):
    overall_fit: int  # 0-100
    ats_compatibility: int  # 0-100
    content_quality: int  # 0-100
    layout_readability: int  # 0-100


class Finding(BaseModel):
    category: str
    severity: str  # "critical" | "warning" | "suggestion"
    title: str
    description: str

    # Type: string or None | Default: None (makes it optional in JSON)
    source: str | None = None # it's like (str | None) = None


class Recommendation(BaseModel):
    priority: str  # "high" | "medium" | "low"
    title: str
    description: str
    original_text: str | None = None
    suggested_text: str | None = None


class HyperlinkCheck(BaseModel):
    text: str
    url: str
    is_accessible: bool
    note: str | None = None


class AnalyzeResponse(BaseModel):
    """Complete analysis results — written to MongoDB by Inngest after this returns."""

    scores: AnalysisScores
    summary: str
    findings: list[Finding]
    recommendations: list[Recommendation]
    hyperlinks: list[HyperlinkCheck]
    matched_skills: list[str]
    missing_skills: list[str]
