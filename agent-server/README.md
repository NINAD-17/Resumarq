# Resumarq Agent Server & Worker ⚙️

This directory contains the core AI pipeline and asynchronous processing engine for Resumarq. Built with **LangGraph**, **Python Redis Workers**, and **FastAPI**, this system dequeues resume analysis requests from Redis, parses PDFs from S3, and orchestrates multi-agent LLM workflows to generate deep, actionable insights.

---

## 🌊 The Analysis Architecture

Our architecture strictly decouples the web frontend from heavy AI workloads via Redis:

1. **Job Enqueue**: When a user submits an analysis request, Next.js enqueues a job payload (`analysisId`, `resumeS3Key`, `jdText`) directly to the Redis queue (`resumarq:jobs`).
2. **Worker Processing (`worker.py`)**: The standalone Python worker pulls jobs using non-blocking `BRPOP`. Workers enforce concurrency limits via `asyncio.Semaphore` so the server never gets overloaded.
3. **Multi-Agent Pipeline (LangGraph)**: The worker loads the resume from S3, parses the PDF via PyMuPDF and Gemini multimodal, and runs specialized AI agents in parallel tiers (ATS audit, Impact metrics, Gap analysis, Company research with Google Search grounding, Critic review, and Report synthesis).
4. **Live Progress & Persistence**: As the graph streams through each node, it updates MongoDB status in real-time. Upon completion, the full validated report is saved to MongoDB.
5. **Monitoring (`app/main.py`)**: A lightweight FastAPI service exposes a `/health` endpoint reporting MongoDB connectivity, Redis status, and pending queue depth.

---

## 🤖 The Multi-Agent System (LangGraph)

Instead of relying on a single prompt, we use **LangGraph** to coordinate a team of specialized agents with strict **Pydantic** structured schemas and **Tenacity** exponential backoff retries:

```text
START ──► [resume_parser, jd_parser] (Tier 1: Parallel Parsing)
      ──► [ats_audit, impact_audit, gap_analysis, company_researcher] (Tier 2: Parallel Audits & Grounding)
      ──► critic (Tier 3: Quality Check & Revisions)
      ──► compiler (Tier 4: Scoring & Final Report) ──► END
```

---

## 📂 Folder Structure

```text
agent-server/
├── worker.py             # Asynchronous Redis job consumer & worker process
├── app/                  # FastAPI monitoring service, config, models, DB logic
│   ├── main.py           # Health check and queue monitoring API
│   ├── config.py         # App & Redis configuration settings
│   ├── tasks.py          # Multi-agent graph execution task
│   ├── db.py             # Motor async MongoDB client
│   ├── db_writes.py      # MongoDB status and results writes
│   └── models.py         # Pydantic models for jobs and results
├── graph/                # LangGraph node definitions, state, and compiler
│   ├── builder.py        # Graph assembly and routing logic
│   ├── state.py          # Shared pipeline state TypedDict
│   ├── compiler.py       # Final deterministic score aggregation
│   └── nodes/            # Specialized agent node implementations
├── schemas/              # Pydantic models for structured agent outputs
├── pyproject.toml        # Python project configuration (uv package manager)
├── uv.lock               # Dependency lockfile
└── .env.example          # Example environment configuration
```

---

## 🚀 Installation & Local Development

### Prerequisites
- **Python** (3.11 or higher)
- **uv** (Fast Python package installer)
- **Redis** (Local Redis instance or Redis Cloud Free Tier)

### 1. Set Up the Environment
```bash
cd agent-server
uv sync

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required keys:
- `MONGODB_URI`: Your MongoDB connection string
- `REDIS_URL`: Your Redis connection string (e.g. `redis://localhost:6379` or Redis Cloud URI)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`
- `GOOGLE_API_KEY`: Google Gemini API key

### 3. Run the Background Worker
Start the Redis consumer to begin processing analysis jobs:

```bash
python worker.py
```

### 4. (Optional) Run the Health & Monitoring Server
Start the FastAPI monitoring API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)
