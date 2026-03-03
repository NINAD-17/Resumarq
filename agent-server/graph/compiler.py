"""
Compiler — Merges all agent outputs into the final AnalyzeResponse.

Pure Python — NO LLM call. Takes the state after Critic approval and:
1. Calculates final scores using deterministic Python functions
2. Extracts convenience fields (matched/missing skills) from Gap Analysis
3. Packages everything into one AnalyzeResponse dict for the /analyze endpoint

This is the LAST step before the response is returned to Inngest.
"""

import logging

from graph.state import AgentState
from schemas.results import (
    ATSAuditResult,
    CriticResult,
    GapAnalysisResult,
    ImpactAuditResult,
    calculate_ats_score,
    calculate_impact_score,
    calculate_match_score,
)

logger = logging.getLogger(__name__)


def compiler_node(state: AgentState) -> dict:
    """
    Final Node: Merge all audit results into a single AnalyzeResponse dict.

    - Deserializes each audit result from state (they're stored as dicts)
    - Runs deterministic Python scoring functions
    - Packages everything into the structure defined in app/models.py
    """
    # ── Deserialize audit results from state ──────────────────────
    ats_audit = ATSAuditResult(**state["ats_audit"])
    impact_audit = ImpactAuditResult(**state["impact_audit"])
    critic_result = CriticResult(**state["critic_result"])

    # Gap analysis is optional (None in resume-only mode)
    gap_analysis = (
        GapAnalysisResult(**state["gap_analysis"])
        if state.get("gap_analysis")
        else None
    )

    # ── Calculate deterministic scores ────────────────────────────
    ats_score = calculate_ats_score(ats_audit.rules)
    impact_score = calculate_impact_score(impact_audit)
    match_score = calculate_match_score(gap_analysis) if gap_analysis else None

    # ── Extract skills from gap analysis ──────────────────────────
    matched_skills: list[str] = []
    missing_skills: list[str] = []
    if gap_analysis:
        matched_skills = [
            s.skill for s in gap_analysis.skill_matches if s.match_type != "missing"
        ]
        missing_skills = [
            s.skill
            for s in gap_analysis.skill_matches
            if s.match_type == "missing" and s.importance == "required"
        ]

    logger.info(
        "Compiler: ATS=%d, Impact=%d, Match=%s, Overall=%d",
        ats_score,
        impact_score,
        str(match_score) if match_score is not None else "N/A",
        critic_result.final_overall_score,
    )

    # ── Build the final response ────────────────────────────────────
    final_result = {
        "scores": {
            "overall": critic_result.final_overall_score,  # Critic's holistic score
            "ats": ats_score,  # Calculated from rules
            "impact": impact_score,  # Calculated from bullets
            "match": match_score,  # Calculated from skills (null if no JD)
        },
        "summary": critic_result.final_summary,
        "ats_audit": state["ats_audit"],  # Full ATSAuditResult (rules + findings)
        "impact_audit": state[
            "impact_audit"
        ],  # Full ImpactAuditResult (bullet rewrites)
        "gap_analysis": state.get("gap_analysis"),  # Full GapAnalysisResult or null
        "additional_findings": [
            f.model_dump() for f in critic_result.additional_findings
        ],
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }

    return {
        "final_result": final_result,
        "status": "complete",
    }
