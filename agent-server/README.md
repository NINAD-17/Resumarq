# Resumarq Agent Server ⚙️

This directory contains the core intelligence and processing engine for Resumarq. Built with **FastAPI** and **Langgraph**, this server acts as a dedicated microservice that receives analysis triggers, parses resumes, and orchestrates complex multi-agent LLM workflows to generate deep, actionable insights.

---

## 🌊 The Analysis Workflow

Our architecture strictly decouples the web frontend from heavy AI workloads. Here is how the FastAPI server handles a request:

1. **Fire-and-Forget Reception**: The server receives an HTTP POST request from the web app's Inngest worker. The payload contains an `analysisId`, the `resumeS3Key` (since the frontend already uploaded the PDF to S3), and the `jdText`.
2. **Immediate 202 Response**: FastAPI immediately returns a `202 Accepted` status, indicating that the job has been successfully queued. This prevents any HTTP timeout issues on the frontend.
3. **Background Task Execution**: Using FastAPI's background processing capabilities, the server begins executing the analysis task in an asynchronous thread.
4. **Text Extraction**: The background worker downloads the resume from AWS S3 using the provided key and utilizes **PyMuPDF** to accurately extract the raw text.
5. **Agentic Processing (Langgraph)**: The extracted text and JD are passed into our Langgraph state machine, which routes the data through multiple specialized AI agents.
6. **Database Write**: Once the Langgraph workflow completes, the backend connects directly to **MongoDB** using the `analysisId` and updates the document status to `completed`, saving the structured analysis results. (The frontend polls the database to detect this change).

---

## 🤖 The Multi-Agent System (Langgraph)

Analyzing a resume against a JD requires complex reasoning. Instead of using a single massive prompt, we use **Langgraph** to orchestrate a team of specialized agents. Each agent focuses on a specific task and validates its output using **Pydantic**.

The graph routes data through specific nodes, handling:
- **Information Extraction**: Structuring the raw text into logical sections.
- **Skills Analysis**: Cross-referencing candidate skills against the JD to identify missing keywords.
- **Impact & Metrics Evaluation**: Scanning bullet points for strong action verbs and quantifiable achievements.
- **ATS & Formatting Check**: Evaluating structural integrity and readability.
- **Synthesis & Scoring**: Aggregating the findings, calculating a final score, and compiling the structured JSON report.

---

## 📂 Folder Structure

```text
agent-server/
├── app/                  # FastAPI app setup, config, routes, database logic
│   ├── main.py           # FastAPI application entry point
│   ├── tasks.py          # Background tasks logic
│   └── db_writes.py      # MongoDB connection and update logic
├── graph/                # Langgraph node definitions, state, and edges
├── prompts/              # System prompts used by the LLM agents
├── schemas/              # Pydantic models for strictly structured LLM outputs
├── pyproject.toml        # Python project configuration (uv package manager)
├── uv.lock               # Dependency lockfile
└── .env.example          # Example environment configuration
```

---

## 🚀 Installation & Local Development

### Prerequisites
- **Python** (3.10 or higher)
- **uv** (Fast Python package installer)

### 1. Set Up the Environment
Navigate to the `agent-server` directory and use `uv` to install dependencies and create a virtual environment:

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
Copy the example environment file and update it with your actual credentials (e.g., LLM API keys, AWS S3 keys, MongoDB URI):

```bash
cp .env.example .env
```

### 3. Run the FastAPI Server
Start the application using Uvicorn (from within the `app` module):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- The API will be accessible at: [http://localhost:8000](http://localhost:8000)
- Interactive API documentation (Swagger UI) is available at: [http://localhost:8000/docs](http://localhost:8000/docs)
