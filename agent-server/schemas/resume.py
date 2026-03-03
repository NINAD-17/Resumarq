"""
Resume Profile Schema

Structured representation of a parsed resume.
Used as output from the Resume Parser node.
"""

from pydantic import BaseModel


class PersonalInfo(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    other_urls: list[str] = []


class Bullet(BaseModel):
    text: str
    has_number: bool  # Contains digit or percentage
    starts_with_verb: bool
    verb_used: str | None = None  # The opening verb if found


class Experience(BaseModel):
    company: str
    role: str
    start_date: str | None = None
    end_date: str | None = None  # "Present" if current
    duration_months: int | None = None
    location: str | None = None
    bullets: list[Bullet] = []


class Education(BaseModel):
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    gpa: str | None = None
    achievements: list[str] = []


class Project(BaseModel):
    name: str
    description: str | None = None
    technologies: list[str] = []
    urls: list[str] = []
    bullets: list[Bullet] = []


class Certification(BaseModel):
    name: str
    issuer: str | None = None
    date: str | None = None
    url: str | None = None


class AdditionalSection(BaseModel):
    section_name: str  # e.g. "Publications", "Awards", "Languages"
    content: list[str] = []  # Raw lines from that section


class ResumeProfile(BaseModel):
    personal_info: PersonalInfo
    summary: str | None = None
    experience: list[Experience] = []
    education: list[Education] = []
    skills: list[str] = []  # All skills consolidated
    projects: list[Project] = []
    certifications: list[Certification] = []
    additional_sections: list[AdditionalSection] = []
    missing_standard_sections: list[str] = []
    estimated_pages: int = 1
    has_columns_or_tables: bool = False
    raw_text: str = ""
