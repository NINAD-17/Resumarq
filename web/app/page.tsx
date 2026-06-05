import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Zap, Target, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { RecruiterCTA } from "@/components/landing/recruiter-cta";
import { HowItWorks } from "@/components/landing/how-it-works";
import { getServerSession } from "@/lib/session";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LandingPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;
  const errorParam = typeof resolvedParams.error === "string" ? resolvedParams.error : undefined;
  
  const isRecruiter = 
    token && 
    process.env.RECRUITER_TOKEN && 
    token === process.env.RECRUITER_TOKEN;

  // Check if user is logged in
  const session = await getServerSession();
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 selection:text-primary relative">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <Header session={session} />

      {/* Error banner for recruiter init failures */}
      {errorParam && (
        <div className="fixed top-16 left-0 right-0 z-30 px-4 pt-2">
          <div className="mx-auto max-w-xl rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            {errorParam === "invalid_token"
              ? "Invalid recruiter access link. Please check the URL you received."
              : "Something went wrong initializing your recruiter session. Please try again."}
          </div>
        </div>
      )}

      <main className="flex-1 pt-14 md:pt-22">
        {/* ─── Hero Section ───────────────────────────────────────── */}
        <section className="relative px-4 pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden flex flex-col items-center text-center">
          {/* Subtle minimal background dot grid pattern covering the whole hero section */}
          <div className="absolute inset-0 hero-dot-grid pointer-events-none -z-10" />
          
          {/* Center glowing gradient blob positioned directly behind the text */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-emerald-500/25 via-blue-500/20 to-amber-500/25 dark:from-emerald-500/20 dark:via-blue-500/15 dark:to-amber-500/20 rounded-full blur-[130px] pointer-events-none landing-glow-pulse -z-10" />

          {/* Floating badges for high-effort visual polish */}
          <div className="absolute left-[6%] top-[28%] hidden lg:flex items-center gap-3 bg-card/85 backdrop-blur-md border border-border/80 p-3.5 rounded-2xl shadow-xl animate-float-slow select-none z-10">
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Shield className="size-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-foreground">ATS Compliance</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Audit Passed</p>
            </div>
          </div>

          <div className="absolute right-[6%] top-[22%] hidden lg:flex items-center gap-3 bg-card/85 backdrop-blur-md border border-border/80 p-3.5 rounded-2xl shadow-xl animate-float-delayed select-none z-10">
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Target className="size-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-foreground">JD Matching</p>
              <p className="text-[10px] text-muted-foreground font-semibold">94% Fit Score</p>
            </div>
          </div>

          <div className="absolute left-[12%] bottom-[22%] hidden lg:flex items-center gap-3 bg-card/85 backdrop-blur-md border border-border/80 p-3.5 rounded-2xl shadow-xl animate-float-slow select-none z-10" style={{ animationDelay: "1.5s" }}>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-foreground">AI Rewriter</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Impact Optimized</p>
            </div>
          </div>

          <div className="container relative z-10 max-w-4xl mx-auto space-y-6 landing-fade-up">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Resume Intelligence, <br className="hidden md:block" />
              <span className="hero-gradient-text">Engineered for Impact.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Resumarq uses multi-agent AI to analyze your resume against job descriptions, uncovering exactly what you need to land the interview.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              {isRecruiter && !isLoggedIn && (
                <RecruiterCTA token={token as string} />
              )}
              
              {!isRecruiter && (
                <Link href={isLoggedIn ? "/dashboard" : "/sign-up"}>
                  <Button size="lg" className="w-full sm:w-auto text-base h-12 px-10 shadow-lg shadow-primary/25 cursor-pointer rounded-full transition-transform hover:scale-105">
                    {isLoggedIn ? "Go to Dashboard" : "Get Started Now"}
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </Link>
              )}
              
              {!isLoggedIn && (
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-10 border-2 bg-background/50 backdrop-blur-sm cursor-pointer rounded-full hover:bg-accent">
                    View Interactive Demo
                  </Button>
                </Link>
              )}
            </div>
            
            {isRecruiter && !isLoggedIn && (
              <p className="text-sm text-muted-foreground mt-2">
                Special access granted via recruiter link. No login required for your first analysis.
              </p>
            )}
          </div>

          {/* Hero Video Placeholder */}
          <div className="container relative z-10 max-w-5xl mx-auto mt-24 landing-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-2xl border border-border/50 glass-card p-2 md:p-3 shadow-2xl">
              <div className="relative rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center group cursor-pointer border border-border">
                {/* Fallback image or blank background */}
                <div className="absolute inset-0 bg-gradient-to-br from-background to-muted/50" />
                
                {/* Play Button Overlay */}
                <div className="relative z-10 size-20 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="size-8 ml-1" />
                </div>
                <p className="absolute bottom-6 left-0 right-0 text-center font-medium text-muted-foreground z-10">
                  See how Resumarq analyzes a resume in 60 seconds
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Section ───────────────────────────────────── */}
        <section id="features" className="py-24 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-2xl md:text-4xl font-bold mb-6 tracking-tight">Go Beyond Grammar Checks</h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Our multi-agent system reads like a hiring manager, evaluating impact, quantification, and true skill match.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm transition-all hover:shadow-md hover:border-score-ats/50">
                <div className="size-14 rounded-xl bg-score-ats/10 flex items-center justify-center mb-6 text-score-ats">
                  <Shield className="size-7" />
                </div>
                <h3 className="text-lg font-bold mb-3">ATS Compatibility Audit</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Identify formatting issues, missing contact details, and structural problems that cause applicant tracking systems to reject your resume.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm transition-all hover:shadow-md hover:border-score-impact/50">
                <div className="size-14 rounded-xl bg-score-impact/10 flex items-center justify-center mb-6 text-score-impact">
                  <Zap className="size-7" />
                </div>
                <h3 className="text-lg font-bold mb-3">Impact & Tone Scoring</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We analyze every bullet point for strong action verbs and quantifiable results, providing line-by-line rewrite suggestions.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm transition-all hover:shadow-md hover:border-score-match/50">
                <div className="size-14 rounded-xl bg-score-match/10 flex items-center justify-center mb-6 text-score-match">
                  <Target className="size-7" />
                </div>
                <h3 className="text-lg font-bold mb-3">Job Description Gap Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Paste a target job description to discover exact keyword gaps, missing responsibilities, and seniority misalignments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── How it Works ───────────────────────────────────────── */}
        <HowItWorks />

        {/* ─── Pricing Section ────────────────────────────────────── */}
        <section id="pricing" className="py-24 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-2xl md:text-4xl font-bold mb-6 tracking-tight">Simple, Transparent Pricing</h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Pay only for what you need. Secure payments powered by Razorpay (UPI supported).
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Pay Per Analysis */}
              <div className="bg-card rounded-3xl p-8 md:p-10 border border-border shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-2">Pay Per Analysis</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-extrabold">₹40</span>
                  <span className="text-muted-foreground">/ report</span>
                </div>
                <p className="text-muted-foreground mb-8 text-lg">
                  Perfect for refining your resume for a specific dream job.
                </p>
                <ul className="space-y-4 mb-10 flex-1">
                  {["1 Detailed AI Analysis", "ATS Compatibility Audit", "Impact & Bullet Rewrites", "Job Description Gap Analysis"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="size-6 text-score-ats shrink-0" />
                      <span className="text-base">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={isLoggedIn ? "/dashboard" : "/sign-up"}>
                  <Button className="w-full text-lg h-14 cursor-pointer rounded-xl">Get Started</Button>
                </Link>
              </div>

              {/* Monthly Subscription */}
              <div className="bg-card rounded-3xl p-8 md:p-10 border-2 border-primary/20 shadow-sm flex flex-col relative opacity-80 grayscale-[20%]">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-muted text-muted-foreground px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border border-border">
                  COMING SOON
                </div>
                <h3 className="text-xl font-bold mb-2">Monthly Pro</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-extrabold">₹200</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <p className="text-muted-foreground mb-8 text-lg">
                  For active job seekers applying to multiple roles.
                </p>
                <ul className="space-y-4 mb-10 flex-1">
                  {["10 Analyses per month", "All Pay Per Analysis features", "Priority processing queue", "Compare multiple JDs"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="size-6 text-muted-foreground shrink-0" />
                      <span className="text-base text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button disabled className="w-full text-lg h-14 rounded-xl cursor-not-allowed bg-muted text-muted-foreground">
                  Currently Not Available
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-background py-12 border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Zap className="size-3.5 fill-current" />
            </div>
            <span className="text-lg font-bold tracking-tight">Resumarq</span>
            <span className="text-muted-foreground text-sm ml-2">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
