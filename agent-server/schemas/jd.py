"""
Job Description Profile Schema

Structured representation of a parsed job description.
Used as output from the JD Parser node.
"""

from pydantic import BaseModel


class JDProfile(BaseModel):
    role_title: str
    company_name: str | None = None
    seniority_level: str = "unknown"  # junior | mid | senior | lead | principal
    required_skills: list[str] = []
    preferred_skills: list[str] = []
    responsibilities: list[str] = []
    tech_stack: list[str] = []  # All technologies mentioned
    years_of_experience: str | None = None
    work_type: str | None = None  # remote | hybrid | onsite
    visa_sponsorship: bool | None = None
    salary_range: str | None = None
    culture_signals: list[str] = []
    additional_info: list[str] = []
