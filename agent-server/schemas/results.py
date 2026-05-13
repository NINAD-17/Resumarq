"""
Audit Result Schemas

Output schemas for each audit node and the critic.
Scores are calculated in Python (deterministic), NOT by the LLM.
Each scoring function takes the LLM's structured output and produces a 0-100 score.
"""

from pydantic import BaseModel


# ─── ATS Audit ────────────────────────────────────────────────────
#
# The ATS Audit prompt lists specific rules (e.g. "contact_completeness",
# "standard_section_headers"). The LLM evaluates each rule against the
# resume and returns a list of ATSRuleResult objects.


class ATSRuleResult(BaseModel):
    rule_id: str  # Predefined ID, e.g. "contact_completeness"
    rule_name: str  # Human-readable, e.g. "Contact Info Completeness"
    status: str  # "pass" | "warning" | "critical"
    finding: str | None = None  # What specifically is wrong
    suggestion: str | None = None  # How to fix it
    affected_content: str | None = None  # The text causing the issue


class ATSAuditResult(BaseModel):
    rules: list[ATSRuleResult]


def calculate_ats_score(rules: list[ATSRuleResult]) -> int:
    """
    Deterministic ATS score from rule results.

    Starts at 100 and deducts points per issue:
    - critical issue: -10 points (e.g. missing contact info)
    - warning issue:  -4 points  (e.g. inconsistent date format)
    - pass: no deduction

    10 critical issues → score 0 (floor). This is intentional —
    a resume with 10 critical ATS problems WILL fail ATS systems.
    """
    score = 100
    for rule in rules:
        if rule.status == "critical":
            score -= 10
        elif rule.status == "warning":
            score -= 4
    return max(0, score)


# ─── Impact Audit ─────────────────────────────────────────────────
#
# The Impact Audit evaluates every bullet point in the resume.
# For each bullet, the LLM scores its quality (0-100) and flags issues.
# It also checks the overall career story (progression, gaps).


class BulletAuditResult(BaseModel):
    original_text: str
    experience_company: str  # Which job this bullet belongs to
    is_quantified: bool  # Contains numbers, percentages, scale
    has_strong_verb: bool  # Starts with action verb (Built, Led, Reduced)
    shows_outcome: bool  # Shows impact, not just a task description
    is_too_vague: bool  # "Worked on various projects" = vague
    is_too_long: bool  # Over 2 lines loses impact
    weak_verb_used: str | None = None  # e.g. "Responsible for"
    issues: list[str] = []  # Specific problems found
    suggested_rewrite: str | None = None  # Rewrite with [X%] placeholders
    bullet_score: int  # 0-100, scored by the LLM


class CareerProgressionNote(BaseModel):
    """
    Observations about the career arc over time.

    Examples:
    - positive: "Strong progression from Junior → Senior in 3 years"
    - warning: "Lateral moves without title changes for 4 years"
    - neutral: "Career transition from marketing to engineering"
    """

    observation: str
    severity: str  # "positive" | "warning" | "neutral"


class ImpactAuditResult(BaseModel):
    bullet_audits: list[BulletAuditResult]
    career_progression_notes: list[CareerProgressionNote] = []
    employment_gaps: list[str] = []  # e.g. "6 month gap between Job A and Job B"
    overall_quantification_rate: float  # 0.0-1.0 (% of bullets with numbers)


def calculate_impact_score(result: ImpactAuditResult) -> int:
    """
    Deterministic impact score from bullet audits.

    Formula:
    1. Average all bullet_score values (each scored 0-100 by LLM)
    2. Apply penalty for low quantification rate:
       - < 20% of bullets quantified → -20 penalty (severe)
       - < 40% of bullets quantified → -10 penalty (moderate)
       - 40%+ → no penalty
    3. Clamp result to 0-100

    Example: 5 bullets averaging 65, quantification rate 30%
    → 65 - 10 = 55/100
    """
    if not result.bullet_audits:
        return 50  # No bullets to evaluate — neutral score

    avg_bullet = sum(b.bullet_score for b in result.bullet_audits) / len(
        result.bullet_audits
    )

    # Penalty for low quantification — check severe case first
    quant_penalty = 0
    if result.overall_quantification_rate < 0.2:
        quant_penalty = 20
    elif result.overall_quantification_rate < 0.4:
        quant_penalty = 10

    return max(0, min(100, round(avg_bullet - quant_penalty)))


# ─── Gap Analysis ─────────────────────────────────────────────────
#
# Compares resume skills/experience against JD requirements.
# Only runs when mode is "resume_jd" (JD text is provided).


class SkillMatch(BaseModel):
    skill: str
    match_type: str  # "exact" | "semantic" | "missing"
    semantic_equivalent: str | None = None  # e.g. resume has "React", JD says "ReactJS"
    importance: str  # "required" | "preferred"


class ResponsibilityCoverage(BaseModel):
    responsibility: str  # From JD
    covered: bool  # Does the resume have evidence of this?
    evidence: str | None = None  # Which part of resume covers this
    gap_note: str | None = None  # What's missing if not covered


class GapAnalysisResult(BaseModel):
    skill_matches: list[SkillMatch]
    responsibility_coverage: list[ResponsibilityCoverage]
    seniority_match: bool = True
    seniority_note: str | None = None  # e.g. "JD wants senior, resume shows mid-level"
    keywords_to_add: list[str] = []  # JD keywords completely absent from resume
    keyword_suggestions: list[str] = []  # Phrases to naturally weave in


def calculate_match_score(result: GapAnalysisResult) -> int:
    """
    Deterministic match score from skill and responsibility coverage.

    Weighted formula:
    - 60% → Required skill match rate (8/10 matched = 80% → 48 points)
    - 30% → Responsibility coverage rate (5/8 covered = 62.5% → 18.75 points)
    - 10% → Seniority match (yes = 10 points, no = 0)

    Example: 48 + 18.75 + 10 = ~77/100
    """
    required = [s for s in result.skill_matches if s.importance == "required"]
    if not required:
        return 70  # No required skills listed — give a neutral score

    matched = [s for s in required if s.match_type != "missing"]
    skill_pct = len(matched) / len(required)

    # Responsibility coverage rate
    if result.responsibility_coverage:
        covered_resp = [r for r in result.responsibility_coverage if r.covered]
        resp_pct = len(covered_resp) / len(result.responsibility_coverage)
    else:
        resp_pct = 0.5  # No responsibilities listed — neutral

    seniority_bonus = 10 if result.seniority_match else 0

    # Weighted: 60% skills + 30% responsibilities + 10% seniority
    score = (skill_pct * 60) + (resp_pct * 30) + seniority_bonus

    return max(0, min(100, round(score)))


# ─── Critic ───────────────────────────────────────────────────────
#
# The Critic reviews all audit outputs for quality and consistency.
# It can flag agents for revision (max 2 loops) and writes the
# final human-readable summary.


class AdditionalFinding(BaseModel):
    """Findings the Critic catches that other agents missed."""

    category: str
    severity: str  # "critical" | "warning" | "suggestion"
    title: str
    description: str
    suggestion: str


class CriticResult(BaseModel):
    approved: bool  # True = all audits are good, proceed to compile
    revise_ats: bool = False  # True = ATS Audit needs to re-run
    revise_impact: bool = False  # True = Impact Audit needs to re-run
    revision_notes: str | None = None  # Instructions for the revised agent
    additional_findings: list[AdditionalFinding] = []
    final_summary: str  # Personalized, human-readable conclusion (paragraph)
    final_overall_score: int  # 0-100, critic's holistic assessment
    title: str = ""  # Short descriptive title, e.g. "MERN Full-Stack Developer Match"
