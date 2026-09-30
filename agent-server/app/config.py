"""
Resumarq Agent Server — Configuration

All settings are loaded from environment variables via pydantic-settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Server configuration loaded from environment variables."""

    # MongoDB
    mongodb_uri: str

    # Storage Provider Configuration: "s3" or "cloudinary"
    storage_provider: str = "s3"

    # AWS S3 (Optional if using Cloudinary)
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = ""
    aws_s3_bucket_name: str = ""

    # Cloudinary (Optional if using AWS S3)
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    cloudinary_url: str = ""

    # Google Gemini
    google_api_key: str

    # Universal model switching configuration (override via .env)
    model_provider: str = "google_genai"
    model_lite: str = "gemini-3.5-flash"   # Used for fast, cost-efficient, or basic tasks
    model_flash: str = "gemini-3.5-flash"  # Standard balanced model for extraction and audits
    model_pro: str = "gemini-3.5-flash"    # Premium/deep reasoning model (e.g. Critic review)

    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    redis_queue_name: str = "resumarq:jobs"
    max_concurrent_tasks: int = 2

    # Internal API Security
    api_key: str = ""

    # LangSmith Observability
    langchain_tracing_v2: str = "false"
    langchain_endpoint: str = "https://api.smith.langchain.com"
    langchain_api_key: str = ""
    langchain_project: str = "resumarq-agent-server"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()  # type: ignore[call-arg]

# Copy LangSmith configuration to system os.environ so LangChain auto-tracer detects it
import os

if settings.langchain_api_key:
    os.environ["LANGCHAIN_TRACING_V2"] = settings.langchain_tracing_v2
    os.environ["LANGCHAIN_ENDPOINT"] = settings.langchain_endpoint
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
