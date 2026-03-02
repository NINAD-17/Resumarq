"""
JD Parser Node

Parses a job description text into a structured JDProfile.
Text-only — no PDF, no multimodal needed.

Runs in parallel with the Resume Parser node.
This node is skipped if no JD text is provided (resume-only mode).
"""

import logging

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings
from graph.state import AgentState
from schemas.jd import JDProfile

logger = logging.getLogger(__name__)

# ─── LLM with Pydantic structured output ─────────────────────────

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.google_api_key,
    temperature=0.1,
)

# Returns a dict matching JDProfile's JSON schema — validated with Pydantic after
structured_llm = llm.with_structured_output(
    schema=JDProfile.model_json_schema(),
    method="json_schema",
)


# ─── Load Prompt ──────────────────────────────────────────────────


def _load_prompt() -> str:
    """Load the JD parser prompt from the gitignored prompts directory."""
    try:
        from prompts.jd_parser import JD_PARSER_PROMPT

        return JD_PARSER_PROMPT
    except ImportError:
        logger.warning("Production prompt not found — using example prompt")
        from prompts.example.jd_parser import JD_PARSER_PROMPT

        return JD_PARSER_PROMPT


# ─── Graph Node ───────────────────────────────────────────────────


def jd_parser_node(state: AgentState) -> dict:
    """
    Node 2: Parse job description text into JDProfile.

    - Receives raw JD text from state
    - Uses .with_structured_output() with json_schema method
    - Separates required vs preferred skills, infers seniority level
    - Validates through Pydantic model for type safety
    - Skipped if state["jd_text"] is None (resume-only mode)
    """
    jd_text = state.get("jd_text")
    if not jd_text:
        logger.info("No JD text provided — skipping JD parser")
        return {"jd_profile": None}

    prompt = _load_prompt()

    # Text-only message — no multimodal needed for JD parsing
    message = HumanMessage(content=f"{prompt}\n\n## Job Description:\n{jd_text}")

    logger.info("Parsing JD with Gemini (structured output)...")

    # structured_llm returns a dict
    raw_result: dict = structured_llm.invoke([message])

    # Validate through Pydantic model
    validated = JDProfile(**raw_result)

    logger.info(
        "Parsed JD: %s at %s, %d required skills, %d preferred skills",
        validated.role_title,
        validated.company_name or "unknown company",
        len(validated.required_skills),
        len(validated.preferred_skills),
    )

    return {"jd_profile": validated.model_dump()}
