"""
Resumarq Agent Server — Configuration

All settings are loaded from environment variables via pydantic-settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Server configuration loaded from environment variables."""

    # MongoDB
    mongodb_uri: str

    # AWS S3
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str
    aws_s3_bucket_name: str

    # Google Gemini
    google_api_key: str

    # Model names — override via .env to swap models without code changes
    gemini_parser_model: str = "gemini-3.5-flash"   # Resume/JD parsing (multimodal)
    gemini_audit_model: str = "gemini-3.5-flash"    # ATS/Impact/Gap audits
    gemini_critic_model: str = "gemini-3.5-flash"   # Critic (highest reasoning)

    # CORS settings
    frontend_url: str = "http://localhost:3000"

    # Internal API key — must match AGENT_SERVER_KEY in Next.js
    api_key: str

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()  # type: ignore[call-arg]
