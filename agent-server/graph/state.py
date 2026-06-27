"""
Graph State — Shared state passed between all nodes.

TypedDict ensures type safety across the LangGraph pipeline.
Each node reads what it needs and writes its output back to state.
"""

from typing import TypedDict


class AgentState(TypedDict):
    # ── Inputs ─────────────────────────────────────────
    analysis_id: str
    resume_s3_key: str
    jd_text: str | None

    # ── Parser Outputs ─────────────────────────────────
    resume_profile: dict | None  # Serialized ResumeProfile
    jd_profile: dict | None  # Serialized JDProfile

    # ── Audit Outputs ──────────────────────────────────
    ats_audit: dict | None  # Serialized ATSAuditResult
    impact_audit: dict | None  # Serialized ImpactAuditResult
    gap_analysis: dict | None  # Serialized GapAnalysisResult

    # ── Critic ─────────────────────────────────────────
    critic_result: dict | None  # Serialized CriticResult
    revision_count: int  # Max 2, prevents infinite loops
    revision_notes: str | None  # Critic passes notes to revised agent

    # ── Final ──────────────────────────────────────────
    final_result: dict | None  # Serialized AnalyzeResponse
    status: str  # "processing" | "complete" | "failed"
    error: str | None
