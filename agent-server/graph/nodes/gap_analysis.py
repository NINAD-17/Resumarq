"""
Gap Analysis Node

Compares resume skills and experience against job description requirements.
Finds matched skills, missing skills, seniority fit, and suggests keywords to add.

Runs in parallel with ATS Audit and Impact Audit.
Skipped if no JD is provided (resume-only mode).
Input: state["resume_profile"] + state["jd_profile"]
"""

import json
import logging

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings
from graph.state import AgentState
from schemas.results import GapAnalysisResult

logger = logging.getLogger(__name__)

# ─── LLM with Pydantic structured output ─────────────────────────

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.google_api_key,
    temperature=0.1,
)

# Returns a dict matching GapAnalysisResult's JSON schema
structured_llm = llm.with_structured_output(
    schema=GapAnalysisResult.model_json_schema(),
    method="json_schema",
)


# ─── Load Prompt ──────────────────────────────────────────────────


def _load_prompt() -> str:
    """Load the gap analysis prompt from the gitignored prompts directory."""
    try:
        from prompts.gap_analysis import GAP_ANALYSIS_PROMPT

        return GAP_ANALYSIS_PROMPT
    except ImportError:
        logger.warning("Production prompt not found — using example prompt")
        from prompts.example.gap_analysis import GAP_ANALYSIS_PROMPT

        return GAP_ANALYSIS_PROMPT


# ─── Graph Node ───────────────────────────────────────────────────


def gap_analysis_node(state: AgentState) -> dict:
    """
    Node 5: Compare resume against job description.

    - Matches each required/preferred skill (exact, semantic, or missing)
    - Checks each JD responsibility against resume evidence
    - Compares seniority signals
    - Suggests specific keywords and phrases to add
    - Skipped if no JD profile is available (resume-only mode)
    """
    jd_profile = state.get("jd_profile")

    # Skip if no JD was provided — resume-only mode
    if not jd_profile:
        logger.info("No JD profile available — skipping Gap Analysis")
        return {"gap_analysis": None}

    resume_profile = state["resume_profile"]

    prompt_template = _load_prompt()
    prompt = prompt_template.format(
        resume_profile=json.dumps(resume_profile, indent=2),
        jd_profile=json.dumps(jd_profile, indent=2),
    )

    logger.info("Running Gap Analysis...")

    message = HumanMessage(content=prompt)

    # LLM compares resume vs JD → returns dict
    raw_result: dict = structured_llm.invoke([message])

    # Validate through Pydantic
    validated = GapAnalysisResult(**raw_result)

    # Count matched vs missing required skills
    required_skills = [s for s in validated.skill_matches if s.importance == "required"]
    matched_required = [s for s in required_skills if s.match_type != "missing"]

    logger.info(
        "Gap Analysis complete: %d/%d required skills matched, seniority %s",
        len(matched_required),
        len(required_skills),
        "matches" if validated.seniority_match else "mismatch",
    )

    return {"gap_analysis": validated.model_dump()}
