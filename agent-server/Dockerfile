# ============================================================
# Resumarq Agent Server & Redis Worker Dockerfile
# ============================================================

# 1. Base Image: Lightweight Python 3.11 on Debian Bookworm Slim
FROM python:3.11-slim

# 2. Environment Configurations
# - PYTHONUNBUFFERED=1: Stream logs immediately to Docker without buffering
# - PYTHONDONTWRITEBYTECODE=1: Avoid writing .pyc files inside container
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/root/.local/bin:$PATH"

# 3. Install essential OS utilities (curl and CA certificates for SSL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy Astral uv binary for ultra-fast package installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 5. Set working directory
WORKDIR /app

# 6. Copy pyproject.toml and install Python dependencies into system Python
COPY pyproject.toml .
RUN uv pip install --system -r pyproject.toml

# 7. Copy application source code
COPY app/ ./app/
COPY graph/ ./graph/
COPY schemas/ ./schemas/
COPY prompts/ ./prompts/
COPY prompts_example/ ./prompts_example/
COPY worker.py .

# 8. Expose FastAPI monitoring port
EXPOSE 8000

# 9. Default container command (runs both FastAPI health monitor & Redis worker)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} & exec python worker.py"]

