"""
Critic Node

Reviews all audit outputs for quality and consistency.
Can flag ATS or Impact audits for revision (max 2 loops).
Writes the final human-readable summary and overall score.

This node runs AFTER all three audits complete.
It's the quality gate before results are compiled and returned.
"""

import json
import logging

from langchain_core.messages import HumanMessage
from graph.llm import get_model

from app.config import settings
from graph.state import AgentState
from schemas.results import CriticResult

logger = logging.getLogger(__name__)

# ─── LLM with Pydantic structured output ─────────────────────────

llm = get_model(
    model_name=settings.model_pro,
    temperature=0.1,
)

# Returns a dict matching CriticResult's JSON schema
structured_llm = llm.with_structured_output(
    schema=CriticResult.model_json_schema(),
    method="json_schema",
)


# ─── Load Prompt ──────────────────────────────────────────────────


def _load_prompt() -> str:
    """Load the critic prompt from the gitignored prompts directory."""
    try:
        from prompts.critic import CRITIC_PROMPT

        return CRITIC_PROMPT
    except ImportError:
        logger.warning("Production prompt not found — using example prompt")
        from prompts_example.critic import CRITIC_PROMPT

        return CRITIC_PROMPT


# ─── Graph Node ───────────────────────────────────────────────────


def critic_node(state: AgentState) -> dict:
    """
    Node 6: Review audit quality and decide whether to revise or approve.

    - Receives all audit results from state
    - Checks for vague findings, miscalibrated scores, contradictions
    - Can flag revise_ats or revise_impact (never both at once)
    - Writes the final human-readable summary
    - If revision_count >= 2, forces approval regardless of quality
    """
    revision_count = state.get("revision_count", 0)

    # Safety valve: max 2 revision loops — prevent infinite cycles
    if revision_count >= 2:
        logger.warning(
            "Max revision count reached (%d) — forcing approval without LLM call",
            revision_count,
        )
        # Avoid LLM call: build approval payload from previous state or fallback
        existing_critic = state.get("critic_result") or {}
        result = {
            "approved": True,
            "revise_ats": False,
            "revise_impact": False,
            "revision_notes": None,
            "title": existing_critic.get("title", "Resume Analysis"),
            "final_overall_score": existing_critic.get("final_overall_score", 70),
            "final_summary": existing_critic.get("final_summary", "Analysis completed after maximum revisions."),
            "additional_findings": existing_critic.get("additional_findings", []),
        }
        validated = CriticResult(**result)
    else:
        raw_result = _run_critic(state)
        validated = CriticResult(**raw_result)

    # Log the critic's decision
    if validated.approved:
        logger.info(
            "Critic APPROVED — overall score: %d, summary: %s",
            validated.final_overall_score,
            validated.final_summary[:80],
        )
    else:
        revising = []
        if validated.revise_ats:
            revising.append("ATS")
        if validated.revise_impact:
            revising.append("Impact")
        logger.info(
            "Critic REJECTED — requesting revision of: %s (attempt %d)",
            ", ".join(revising),
            revision_count + 1,
        )

    return {
        "critic_result": validated.model_dump(),
        # Increment revision_count so the graph knows how many loops we've done
        "revision_count": revision_count + 1,
        # Pass revision notes to the audit nodes for their next run
        "revision_notes": validated.revision_notes,
    }


def _run_critic(state: AgentState) -> dict:
    """
    Internal: Build the prompt and call the LLM.
    Separated so we can override the result in the max-revision case.
    """
    prompt_template = _load_prompt()

    # Build the prompt with all audit data
    gap_analysis = state.get("gap_analysis")
    prompt = prompt_template.format(
        ats_audit=json.dumps(state["ats_audit"], indent=2),
        impact_audit=json.dumps(state["impact_audit"], indent=2),
        resume_profile=json.dumps(state["resume_profile"], indent=2),
        gap_analysis=(
            json.dumps(gap_analysis, indent=2)
            if gap_analysis
            else "N/A — resume-only mode"
        ),
    )

    logger.info("Running Critic review...")
    message = HumanMessage(content=prompt)

    # LLM reviews everything → returns dict
    raw_result: dict = structured_llm.invoke([message])
    return raw_result
