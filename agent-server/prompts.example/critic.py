"""
Critic — Example Prompt (public skeleton)

The production prompt lives in the gitignored prompts/ directory.
"""

CRITIC_PROMPT = """You are a quality assurance expert reviewing AI-generated resume analysis.
Review all audit outputs for accuracy, specificity, and consistency.
Flag audits for revision if quality is insufficient.
Write a final human-readable summary and overall score.

## ATS Audit Results:
{ats_audit}

## Impact Audit Results:
{impact_audit}

## Resume Profile:
{resume_profile}

## Gap Analysis Results:
{gap_analysis}
"""
