"""
Shared LLM Initialization Utility for Google Gemini
"""
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings

logger = logging.getLogger(__name__)

def get_model(model_name: str, temperature: float = 0.1):
    """
    Initialize ChatGoogleGenerativeAI based on settings.
    """
    logger.info("Initializing Google Gemini model: model=%s, temperature=%.2f", model_name, temperature)
    
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=settings.google_api_key,
        temperature=temperature,
    )

# ──────────────────────────────────────────────────────────────────────
# UNIVERSAL SWITCHER REFERENCE (Commented Out)
#
# If you decide to add multiple model providers (e.g. OpenAI, Anthropic) 
# and want to hot-swap them purely via .env without editing code:
#
# 1. Add "langchain>=0.2.0" to your pyproject.toml dependencies
# 2. Add provider libraries (e.g. "langchain-openai", "langchain-anthropic")
# 3. Uncomment the code below and replace get_model() above:
#
# from langchain.chat_models import init_chat_model
#
# def get_model(model_name: str, temperature: float = 0.1):
#     kwargs = {}
#     if settings.model_provider == "google_genai":
#         kwargs["google_api_key"] = settings.google_api_key
#     
#     return init_chat_model(
#         model=model_name,
#         model_provider=settings.model_provider,
#         temperature=temperature,
#         **kwargs
#     )
# ──────────────────────────────────────────────────────────────────────
