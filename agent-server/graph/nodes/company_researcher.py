"""
Company Insights Researcher Agent Node

Uses Google Search grounding to fetch CEO, founders, about, culture,
and typical interview focus areas and questions for a specific role.
Caches researched profiles in MongoDB companies collection.
Compares resume against findings and generates personalized prep guide.
"""

import json
import logging
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from app.config import settings
from app.db import get_companies_collection
from graph.state import AgentState
from graph.llm import get_model, invoke_with_retry

logger = logging.getLogger(__name__)

from schemas.company import CompanySearchProfile, CompanyRoleSearchInfo

# ─── Graph Node ───────────────────────────────────────────────────────

async def company_researcher_node(state: AgentState) -> dict:
    """
    Agent Node: Research target company/role and align with candidate resume.
    
    1. Checks if company_name exists in parsed jd_profile.
    2. Looks up company details in MongoDB 'companies' cache.
    3. If missing or new role, queries Google Search with Gemini grounding.
    4. Caches parsed results back to MongoDB.
    5. Generates a personalized interview guide matching the candidate's resume.
    """
    jd_profile = state.get("jd_profile")
    if not jd_profile or not jd_profile.get("company_name"):
        logger.info("No company name provided in JD — skipping company researcher")
        return {"company_research": None}

    company_name = jd_profile["company_name"].strip()
    role_title = jd_profile.get("role_title", "Software Engineer").strip()
    
    logger.info("Running Company Researcher for %s -> %s", company_name, role_title)

    # ── 1. Query Cache ────────────────────────────────────────────────
    try:
        companies_col = get_companies_collection()
        company_doc = await companies_col.find_one({
            "company_name": {"$regex": f"^{company_name}$", "$options": "i"}
        })
    except Exception as e:
        logger.error("Error reading from companies collection: %s", str(e))
        company_doc = None

    role_key = role_title.lower().replace(" ", "_")
    company_info = None

    if company_doc and "roles" in company_doc and role_key in company_doc["roles"]:
        logger.info("Retrieved cached insights from MongoDB for %s -> %s", company_name, role_title)
        role_insights = company_doc["roles"][role_key]
        company_info = {
            "company_name": company_doc["company_name"],
            "ceo": company_doc.get("ceo"),
            "founders": company_doc.get("founders", []),
            "about": company_doc.get("about", ""),
            "domain": company_doc.get("domain"),
            "culture": company_doc.get("culture", []),
            "role_info": role_insights
        }
    else:
        # ── 2. Run Google Search Grounding ────────────────────────────
        logger.info("No cached info for %s -> %s. Performing web search...", company_name, role_title)
        
        # Initialize Google Search grounding model using the standard flash model
        llm_with_search = get_model(
            model_name=settings.model_flash,
            temperature=0.1
        ).bind(tools=[{"google_search": {}}])
        
        search_prompt = (
            f"Perform a Google Search to find detailed information about the company '{company_name}'.\n"
            f"Specifically locate:\n"
            f"1. The current CEO and founders.\n"
            f"2. What the company does, its industry domain, and core mission.\n"
            f"3. Core company culture and values.\n"
            f"4. What the interview process is like, what they look for in candidates, "
            f"and typical questions asked specifically for the role of '{role_title}' at '{company_name}'."
        )
        
        try:
            search_response = invoke_with_retry(llm_with_search, [HumanMessage(content=search_prompt)])
            search_text = search_response.content
        except Exception as e:
            logger.error("Failed to fetch Google Search results: %s. Using default prompt fallback.", str(e))
            search_text = f"Fallback info: {company_name} is a company. Role is {role_title}."

        # ── 3. Parse Search Results into Schema ────────────────────────
        parser_llm = get_model(
            model_name=settings.model_flash,
            temperature=0.1
        ).with_structured_output(
            schema=CompanySearchProfile.model_json_schema(),
            method="json_schema"
        )
        
        parse_prompt = (
            f"You are a database parsing engineer. Parse the raw Google Search text about "
            f"'{company_name}' and the role of '{role_title}' into the requested JSON schema.\n\n"
            f"Raw Search Output:\n{search_text}"
        )
        
        try:
            parsed_result: dict = invoke_with_retry(parser_llm, [HumanMessage(content=parse_prompt)])
            # Validate with Pydantic for safety
            validated = CompanySearchProfile(**parsed_result)
            company_info = validated.model_dump()
        except Exception as e:
            logger.error("Failed to parse search results into structured JSON: %s. Using fallback values.", str(e))
            # Fallback schema instance
            fallback = CompanySearchProfile(
                company_name=company_name,
                about=f"A technology/business organization doing work in the industry.",
                role_info=CompanyRoleSearchInfo(
                    focus_areas=["Technical skills", "Communication", "Problem solving"],
                    common_interview_questions=["Walk me through your resume", "Why do you want to join us?"],
                    interview_style="Technical and conversational"
                )
            )
            company_info = fallback.model_dump()

        # ── 4. Cache Back to MongoDB ──────────────────────────────────
        try:
            if company_doc:
                # Company exists, but this role's search data is missing. Add/update the role
                await companies_col.update_one(
                    {"_id": company_doc["_id"]},
                    {
                        "$set": {
                            f"roles.{role_key}": company_info["role_info"]
                        }
                    }
                )
                logger.info("Appended new role '%s' to cached company '%s'", role_title, company_name)
            else:
                # Create a completely new company document
                new_doc = {
                    "company_name": company_info["company_name"],
                    "ceo": company_info.get("ceo"),
                    "founders": company_info.get("founders", []),
                    "about": company_info.get("about", ""),
                    "domain": company_info.get("domain"),
                    "culture": company_info.get("culture", []),
                    "roles": {
                        role_key: company_info["role_info"]
                    }
                }
                await companies_col.insert_one(new_doc)
                logger.info("Created new cached company record for '%s'", company_name)
        except Exception as e:
            logger.error("Error writing to companies database: %s", str(e))

    # ── 5. Generate Resume-Aligned Prep Guide ─────────────────────────
    logger.info("Generating personalized interview prep guide...")
    resume_profile = state.get("resume_profile") or {}
    
    advice_llm = get_model(
        model_name=settings.model_pro,
        temperature=0.2
    )
    
    advice_prompt = (
        f"You are an expert Executive Interview Coach and Senior Recruiter.\n"
        f"You need to prepare a candidate for their upcoming interview at '{company_name}' for the role of '{role_title}'.\n\n"
        f"COMPANY DATA:\n"
        f"- About: {company_info.get('about')}\n"
        f"- CEO/Leadership: {company_info.get('ceo')}\n"
        f"- Culture & Values: {', '.join(company_info.get('culture', []))}\n\n"
        f"INTERVIEW FOCUS & STYLE:\n"
        f"- Focus Areas: {', '.join(company_info['role_info'].get('focus_areas', []))}\n"
        f"- Style/Format: {company_info['role_info'].get('interview_style')}\n"
        f"- Common Questions: {', '.join(company_info['role_info'].get('common_interview_questions', []))}\n\n"
        f"CANDIDATE RESUME PROFILE:\n"
        f"{json.dumps(resume_profile, indent=2)}\n\n"
        f"INSTRUCTIONS:\n"
        f"Generate a detailed, custom-tailored, and encouraging Markdown Interview Preparation Guide for this candidate.\n"
        f"Structure your response with the following sections:\n"
        f"### 🏢 Company Profile & Context\n"
        f"Provide a brief overview of the company, leadership details, and any cultural signals they should align with.\n\n"
        f"### 🎯 What They Look For\n"
        f"Detail the specific expectations of this role at this company, and how the candidate's skills map to them.\n\n"
        f"### 💡 Key Strengths to Highlight\n"
        f"Point out 2-3 specific experiences, technologies, or projects from the candidate's resume that they should focus on and talk about during the interview to make a strong impression.\n\n"
        f"### ❓ Practice Interview Questions\n"
        f"Provide 3 tailored questions they are likely to get, and give advice on how they can leverage their resume experience to frame a perfect answer."
    )
    
    try:
        advice_response = invoke_with_retry(advice_llm, [HumanMessage(content=advice_prompt)])
        personalized_guide = advice_response.content
    except Exception as e:
        logger.error("Failed to generate personalized interview guide: %s", str(e))
        personalized_guide = "Could not generate interview guide due to a model error."

    return {
        "company_research": {
            "company_profile": {
                "company_name": company_info.get("company_name", company_name),
                "ceo": company_info.get("ceo"),
                "founders": company_info.get("founders", []),
                "about": company_info.get("about", ""),
                "domain": company_info.get("domain"),
                "culture": company_info.get("culture", []),
                "role_info": {
                    "focus_areas": company_info["role_info"].get("focus_areas", []),
                    "common_interview_questions": company_info["role_info"].get("common_interview_questions", []),
                    "interview_style": company_info["role_info"].get("interview_style", ""),
                },
            },
            "personalized_guide": personalized_guide,
        }
    }
