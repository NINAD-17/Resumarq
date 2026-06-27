"""
ATS Audit Node

Evaluates the resume's compatibility with Applicant Tracking Systems.
Uses a predefined set of 15 rules — the LLM evaluates each one and
the score is calculated in Python (not by the LLM).

Runs in parallel with Impact Audit and Gap Analysis.
Input: state["resume_profile"] (from Resume Parser)
"""

import json
import logging

from langchain_core.messages import HumanMessage
from graph.llm import get_model

from app.config import settings
from graph.state import AgentState
from schemas.results import ATSAuditResult

logger = logging.getLogger(__name__)

# ─── LLM with Pydantic structured output ─────────────────────────

llm = get_model(
    model_name=settings.model_flash,
    temperature=0.1,
)

# Returns a dict matching ATSAuditResult's JSON schema
structured_llm = llm.with_structured_output(
    schema=ATSAuditResult.model_json_schema(),
    method="json_schema",
)


# ─── Load Prompt ──────────────────────────────────────────────────


def _load_prompt() -> str:
    """Load the ATS audit prompt from the gitignored prompts directory."""
    try:
        from prompts.ats_audit import ATS_AUDIT_PROMPT

        return ATS_AUDIT_PROMPT
    except ImportError:
        logger.warning("Production prompt not found — using example prompt")
        from prompts_example.ats_audit import ATS_AUDIT_PROMPT

        return ATS_AUDIT_PROMPT


# ─── Graph Node ───────────────────────────────────────────────────


def ats_audit_node(state: AgentState) -> dict:
    """
    Node 3: Evaluate resume's ATS compatibility.

    - Receives the parsed resume profile from state
    - Evaluates 15 predefined rules (listed in the prompt)
    - LLM returns pass/warning/critical for each rule
    - Score is NOT in the LLM output — calculated in Python after
    - Supports revision: if Critic flags revise_ats, uses revision_notes
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
        logger.info("Running ATS Audit REVISION (attempt %d)", state["revision_count"])
    else:
        logger.info("Running ATS Audit...")

    message = HumanMessage(content=prompt)

    # LLM evaluates each rule → returns dict
    raw_result: dict = structured_llm.invoke([message])

    # Validate through Pydantic
    validated = ATSAuditResult(**raw_result)

    logger.info(
        "ATS Audit complete: %d rules evaluated (%d pass, %d warning, %d critical)",
        len(validated.rules),
        sum(1 for r in validated.rules if r.status == "pass"),
        sum(1 for r in validated.rules if r.status == "warning"),
        sum(1 for r in validated.rules if r.status == "critical"),
    )

    return {"ats_audit": validated.model_dump()}
