# Resumarq Frontend (Web) 🖥️

This directory contains the user-facing web application for Resumarq, built using **Next.js (App Router)**. It provides an intuitive, responsive, and highly interactive interface for students and professionals to upload their resumes, provide Job Descriptions (JDs), and receive deep AI-powered insights.

---

## 🛠️ Key Technologies

- **Framework**: Next.js 14+ (App Router, Server Actions, SSR/SSG)
- **Styling**: Tailwind CSS & Shadcn UI for a fast, modern, and accessible design system.
- **Authentication**: Better Auth for seamless, secure user management.
- **Payments**: Razorpay integration for handling premium credits and subscriptions.
- **Background Jobs**: Inngest for dispatching and orchestrating communication with our AI microservice.

---

## 🌊 Core Frontend Workflows

### 1. Authentication (Better Auth)
We use **Better Auth** to manage user identities securely and efficiently. 
- **Session Management**: Better Auth handles secure HTTP-only cookies and session tokens. 
- **Protected Routes**: Next.js middleware works alongside Better Auth to ensure that only authenticated users can access the dashboard and analysis tools. 
- **Client & Server State**: We utilize Better Auth's React hooks and server-side utilities to seamlessly fetch the user's profile and subscription status across both client components and server actions.

### 2. The Analysis Pipeline (Upload, Inngest & Polling)
Because deep LLM analysis takes time, our frontend uses a non-blocking, asynchronous workflow to ensure the UI never freezes.

1. **Document Upload**: The user uploads their Resume (PDF) and a target JD via the browser. Next.js securely uploads the PDF to **AWS S3**.
2. **Database Initialization**: Next.js creates a new analysis record in **MongoDB** with a `pending` status, storing the S3 key and the JD text.
3. **Inngest Dispatch**: Next.js fires an event to our local **Inngest** worker. The worker updates the database status to `processing`.
4. **Fire-and-Forget API Call**: The Inngest worker sends an HTTP POST request to our external FastAPI agent server. The FastAPI server immediately responds with a `202 Accepted` status and runs the AI workload in its own background thread.
5. **Client-Side Polling**: Meanwhile, the Next.js client enters a "Processing" state. It polls the MongoDB database at regular intervals to check the analysis status.
6. **Results Rendering**: Once the FastAPI server finishes its background task, it updates the MongoDB record directly to `completed`. The Next.js polling detects this change, fetches the structured JSON results, and renders the actionable insights dashboard.

---

## 📂 Folder Structure

```text
web/
├── app/                  # Next.js App Router (Pages, Layouts, API routes)
│   ├── (auth)/           # Login, Register, and Better Auth endpoints
│   └── dashboard/        # Protected user dashboard and analysis results
├── components/           # Reusable UI components (Shadcn UI, forms, charts)
├── inngest/              # Inngest client setup and background workflow definitions
├── lib/                  # Utility functions, Better Auth client setup, MongoDB wrappers
├── hooks/                # Custom React hooks (e.g., usePolling, useUpload)
├── public/               # Static assets (images, icons)
├── styles/               # Global CSS and Tailwind variables
├── .env.example          # Template for environment variables
├── package.json          # Project dependencies and scripts
└── next.config.js        # Next.js configuration
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **Inngest CLI** (for local testing of background jobs)

### 1. Install Dependencies
Navigate into the `web` directory and install the required packages:

```bash
cd web
npm install
```

### 2. Environment Variables
We use environment variables to configure API endpoints, authentication secrets, and payment gateways. 

Duplicate the provided `.env.example` file and rename it to `.env.local`:

```bash
cp .env.example .env.local
```
*Note: Open `.env.local` and fill in your actual credentials (e.g., MongoDB URI, AWS S3 keys, Better Auth secrets, Razorpay keys, Agent Server URL).*

### 3. Database Index Setup
Verify and establish all MongoDB indexes (analyses, payments, userProfiles, resumes, demoAccess) to optimize query performance:

```bash
npm run db:setup
```

### 4. Run the Development Server
Start the Next.js local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### 5. Run the Inngest Dev Server
To process the background events locally, open a new terminal window and run:

```bash
npx inngest-cli@latest dev
```

---

## 📦 Available Scripts

- `npm run dev`: Starts the development server with Hot Module Replacement.
- `npm run build`: Creates an optimized production build.
- `npm run start`: Starts the application in production mode using the compiled build.
- `npm run lint`: Runs ESLint to catch syntax and styling issues.
- `npm run db:setup`: Verifies and creates MongoDB collection indexes out-of-band.
