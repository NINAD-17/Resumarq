# Resumarq Frontend (Web) 🖥️

This directory contains the user-facing web application for Resumarq, built using **Next.js (App Router)**. It provides an intuitive, responsive, and highly interactive interface for students and professionals to upload their resumes, provide Job Descriptions (JDs), and receive deep AI-powered insights.

---

## 🛠️ Key Technologies

- **Framework**: Next.js 15+ (App Router, Server Actions, SSR)
- **Styling**: Tailwind CSS & Shadcn UI for a clean, accessible design system.
- **Authentication**: Better Auth for seamless, secure user management.
- **Payments**: Razorpay integration for handling premium credits and subscriptions.
- **Background Queue**: Redis (`ioredis`) for enqueuing asynchronous analysis jobs.

---

## 🌊 Core Frontend Workflows

### 1. Authentication (Better Auth)
We use **Better Auth** to manage user identities securely and efficiently. 
- **Session Management**: Better Auth handles secure HTTP-only cookies and session tokens. 
- **Protected Routes**: Next.js route protection proxy works alongside Better Auth to ensure only authenticated users can access the dashboard and analysis tools. 
- **Client & Server State**: We utilize Better Auth's React hooks and server-side utilities to seamlessly fetch user profiles and quotas.

### 2. The Analysis Pipeline (Upload, Redis Queue & Live Polling)
Because deep multi-agent LLM analysis takes time, our frontend uses a non-blocking, asynchronous workflow:

1. **Document Upload**: The user uploads their Resume (PDF) and an optional target JD via the browser. Next.js securely uploads the PDF directly to **AWS S3**.
2. **Database Initialization**: Next.js creates a new analysis record in **MongoDB** with a `pending` status, storing the S3 key and JD text.
3. **Redis Job Enqueue**: Next.js immediately pushes a job payload (`analysisId`, `resumeS3Key`, `jdText`) into the **Redis** queue (`resumarq:jobs`) via `ioredis` and returns `201 Created`.
4. **Worker Processing**: The background Python worker dequeues the job, runs the LangGraph multi-agent pipeline, and streams live milestone status updates back into MongoDB.
5. **Live Status & Results**: The Next.js dashboard polls MongoDB to show real-time progress steps (`extracting_data`, `analyzing_ats`, `evaluating_impact`, `researching_company`, `compiling_report`). As soon as the status flips to `completed`, the full interactive audit is displayed.

---

## 📂 Folder Structure

```text
web/
├── app/                  # Next.js App Router (Pages, Layouts, API routes)
│   ├── (auth)/           # Sign-in, Sign-up, Forgot Password
│   ├── api/              # Analyses, Auth, Payments, Resumes API endpoints
│   └── dashboard/        # Protected user dashboard and analysis results
├── components/           # Reusable UI components (Shadcn UI, forms, charts)
├── lib/                  # Redis client, Better Auth setup, MongoDB helpers
├── types/                # TypeScript interfaces and MongoDB document models
├── public/               # Static assets (images, icons)
├── styles/               # Global CSS and Tailwind variables
├── .env.example          # Template for environment variables
├── package.json          # Project dependencies and scripts
└── next.config.ts        # Next.js configuration
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (or pnpm / yarn)
- **Redis** (Local Redis or Redis Cloud Free Tier)

### 1. Install Dependencies
Navigate into the `web` directory and install packages:

```bash
cd web
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Required keys:
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis URI (e.g. `redis://localhost:6379` or Redis Cloud connection URL)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (for password reset / verification)

### 3. Database Index Setup
Initialize MongoDB indexes to optimize query performance:

```bash
npm run db:setup
```

### 4. Run the Development Server
Start the Next.js local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.
