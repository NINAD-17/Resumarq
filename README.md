# Resumarq

AI-powered resume and job description intelligence platform. Resumarq uses a multi-agent LLM system to deliver structured, actionable, deeply personalized resume analysis — far beyond generic tips.

## What It Does

- **Multi-agent analysis** — specialized AI agents parse resumes, analyze job descriptions, research companies, and generate targeted improvements
- **ATS scoring** — compatibility scores across keyword match, quantification, tone calibration, and completeness
- **Diff-style rewrites** — specific bullet-by-bullet improvement suggestions, not generic advice
- **Interview prep** — personalized questions based on your resume × job description intersection
- **Networking strategy** — outreach templates and connection suggestions

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Web App   | Next.js, Tailwind CSS, shadcn/ui |
| AI Server | FastAPI, LangChain, LangGraph    |
| Database  | MongoDB + Atlas Search           |
| Storage   | AWS S3                           |
| Job Queue | Inngest                          |
| Hosting   | Vercel (web), AWS (AI server)    |

