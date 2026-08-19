from pydantic import BaseModel

class CompanyRoleSearchInfo(BaseModel):
    focus_areas: list[str]
    common_interview_questions: list[str]
    interview_style: str

class CompanySearchProfile(BaseModel):
    company_name: str
    ceo: str | None = None
    founders: list[str] = []
    about: str
    domain: str | None = None
    culture: list[str] = []
    role_info: CompanyRoleSearchInfo
