"""
Impact Audit Node

Evaluates every bullet point in the resume for quality, quantification,
action verbs, and impact. Also analyzes career progression and gaps.

Runs in parallel with ATS Audit and Gap Analysis.
Input: state["resume_profile"] (from Resume Parser)
"""

import json
import logging

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings
from graph.state import AgentState
from schemas.results import ImpactAuditResult

logger = logging.getLogger(__name__)

# ─── LLM with Pydantic structured output ─────────────────────────

llm = ChatGoogleGenerativeAI(
    model=settings.gemini_audit_model,
    google_api_key=settings.google_api_key,
    temperature=0.2,  # Slightly higher for creative rewrites
)

# Returns a dict matching ImpactAuditResult's JSON schema
structured_llm = llm.with_structured_output(
    schema=ImpactAuditResult.model_json_schema(),
    method="json_schema",
)


# ─── Load Prompt ──────────────────────────────────────────────────


def _load_prompt() -> str:
    """Load the impact audit prompt from the gitignored prompts directory."""
    try:
        from prompts.impact_audit import IMPACT_AUDIT_PROMPT

        return IMPACT_AUDIT_PROMPT
    except ImportError:
        logger.warning("Production prompt not found — using example prompt")
        from prompts.impact_audit import IMPACT_AUDIT_PROMPT

        return IMPACT_AUDIT_PROMPT


# ─── Graph Node ───────────────────────────────────────────────────


def impact_audit_node(state: AgentState) -> dict:
    """
    Node 4: Evaluate bullet point quality and career progression.

    - Scores every bullet 0-100 (is_quantified, has_strong_verb, shows_outcome, etc.)
    - Provides specific rewrites for weak bullets (with [X%], [N] placeholders)
    - Notes career progression and employment gaps
    - Calculates overall quantification rate
    - Supports revision: if Critic flags revise_impact, uses revision_notes
    """
    resume_profile = state["resume_profile"]

    prompt_template = _load_prompt()
    prompt = prompt_template.format(resume_profile=json.dumps(resume_profile, indent=2))

    # If this is a revision run, prepend the critic's feedback
    revision_notes = state.get("revision_notes")
    if state.get("revision_count", 0) > 0 and revision_notes:
        prompt = (
            f"## REVISION — Previous audit had issues:\n"
            f"{revision_notes}\n\n"
            f"Re-evaluate with the above feedback in mind.\n\n"
            f"{prompt}"
        )
        logger.info(
            "Running Impact Audit REVISION (attempt %d)", state["revision_count"]
        )
    else:
        logger.info("Running Impact Audit...")

    message = HumanMessage(content=prompt)

    # LLM evaluates each bullet → returns dict
    raw_result: dict = structured_llm.invoke([message])

    # Validate through Pydantic
    validated = ImpactAuditResult(**raw_result)

    logger.info(
        "Impact Audit complete: %d bullets evaluated, quantification rate: %.0f%%",
        len(validated.bullet_audits),
        validated.overall_quantification_rate * 100,
    )

    return {"impact_audit": validated.model_dump()}
