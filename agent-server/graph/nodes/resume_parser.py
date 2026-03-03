"""
Resume Parser Node

Downloads the resume PDF from S3 and sends it to Gemini (multimodal)
to extract a structured ResumeProfile.

This is the only node that receives the raw PDF visually — all other
nodes work with the extracted structured data.
"""

import base64
import logging

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings
from app.services.s3 import download_resume_from_s3
from graph.state import AgentState
from schemas.resume import ResumeProfile

logger = logging.getLogger(__name__)

# ─── LLM with Pydantic structured output ─────────────────────────

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.google_api_key,
    temperature=0.1,  # Low temp for consistent extraction
)

# .with_structured_output() using json_schema method.
# Tells Gemini to return JSON matching our Pydantic model's schema.
# Returns a dict (not a Pydantic instance) — we validate with Pydantic after.
structured_llm = llm.with_structured_output(
    schema=ResumeProfile.model_json_schema(),
    method="json_schema",
)


# ─── Load Prompt ──────────────────────────────────────────────────


def _load_prompt() -> str:
    """Load the resume parser prompt from the gitignored prompts directory."""
    try:
        from prompts.resume_parser import RESUME_PARSER_PROMPT

        return RESUME_PARSER_PROMPT
    except ImportError:
        logger.warning("Production prompt not found — using example prompt")
        from prompts.example.resume_analysis import RESUME_PARSER_PROMPT

        return RESUME_PARSER_PROMPT


# ─── Graph Node ───────────────────────────────────────────────────


def resume_parser_node(state: AgentState) -> dict:
    """
    Node 1: Download resume from S3 and parse into ResumeProfile.

    - Downloads PDF bytes from S3 using the resume_s3_key
    - Encodes as base64 for Gemini's multimodal input
    - Uses .with_structured_output() with json_schema method
    - Validates the response through Pydantic model
    - Stores both resume_bytes and parsed profile in state
    """
    # Download PDF from S3
    logger.info("Downloading resume from S3: %s", state["resume_s3_key"])
    resume_bytes = download_resume_from_s3(state["resume_s3_key"])
    logger.info("Downloaded %d bytes", len(resume_bytes))

    # Encode PDF as base64 data URI
    # PDFs are treated as images in langchain-google-genai
    pdf_base64 = base64.b64encode(resume_bytes).decode("utf-8")

    prompt = _load_prompt()

    # Multimodal message: PDF as data URI + text prompt
    # Format follows official LangChain docs for PDF input
    message = HumanMessage(
        content=[
            {
                "type": "image_url",
                "image_url": f"data:application/pdf;base64,{pdf_base64}",
            },
            {"type": "text", "text": prompt},
        ]
    )

    logger.info("Parsing resume with Gemini (structured output)...")

    # structured_llm returns a dict, not a Pydantic instance
    raw_result: dict = structured_llm.invoke([message])

    # Validate through Pydantic model for type safety
    validated = ResumeProfile(**raw_result)

    logger.info(
        "Parsed resume: %d experiences, %d skills, %d projects",
        len(validated.experience),
        len(validated.skills),
        len(validated.projects),
    )

    return {
        "resume_bytes": resume_bytes,
        "resume_profile": validated.model_dump(),
    }
