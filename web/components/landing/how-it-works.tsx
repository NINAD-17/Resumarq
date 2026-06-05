"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Upload your Resume",
    desc: "Upload your PDF. We securely parse the text while preserving your privacy.",
    image: "/upload_resume.png",
  },
  {
    title: "Add a Target Job",
    desc: "Optional: Paste the job description you're aiming for to get highly tailored feedback.",
    image: "/add_job_description.png",
  },
  {
    title: "AI Agents Go to Work",
    desc: "Our specialized LLM agents debate and evaluate your resume from multiple angles.",
    image: "/analyze_resume.png",
  },
  {
    title: "Get Actionable Feedback",
    desc: "Review your scores, fix critical ATS errors, and rewrite weak bullets.",
    image: "/actionable_feedback.png",
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setIsHovered(true); // Pause auto-rotation once user interacts
  };

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-muted/10 border-y border-border/30">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            How <span className="hero-gradient-text">Resumarq</span> Works
          </h2>
          <p className="text-lg text-muted-foreground">
            A seamless, step-by-step workflow designed to elevate your resume from draft to draft-ready.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Side: Steps List */}
          <div className="flex-1 w-full space-y-4">
            {steps.map((step, i) => {
              const isActive = activeStep === i;
              return (
                <div
                  key={i}
                  onClick={() => handleStepClick(i)}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className={cn(
                    "flex gap-5 p-6 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden",
                    isActive
                      ? "bg-card border-primary/20 shadow-md translate-x-2"
                      : "bg-background/40 border-transparent hover:border-border/50 hover:bg-muted/20"
                  )}
                >
                  {/* Left accent bar for active step */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-r-full" />
                  )}

                  <div
                    className={cn(
                      "shrink-0 size-10 rounded-full flex items-center justify-center font-bold text-base transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <h4 className={cn(
                      "text-lg font-bold flex items-center gap-2 transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {step.title}
                      {isActive && <ChevronRight className="size-4 text-primary animate-pulse" />}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side: Animated Mockup Browser / Screen */}
          <div className="flex-1 w-full relative">
            <div className="rounded-2xl border border-border/50 bg-card p-3 shadow-2xl relative overflow-hidden aspect-[4/3] flex flex-col">
              {/* Top window controls */}
              <div className="flex items-center gap-2 px-2 pb-3 border-b border-border/50 shrink-0">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-yellow-500/80" />
                <div className="size-3 rounded-full bg-green-500/80" />
                <div className="text-xs text-muted-foreground/60 ml-2 font-mono truncate">
                  resumarq.com/dashboard
                </div>
              </div>

              {/* Slider Viewport */}
              <div className="relative flex-1 mt-2 rounded-lg overflow-hidden bg-muted/30">
                {steps.map((step, i) => {
                  const isActive = activeStep === i;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "absolute inset-0 transition-all duration-700 ease-in-out flex items-center justify-center p-2",
                        isActive
                          ? "opacity-100 scale-100 translate-x-0 pointer-events-auto"
                          : "opacity-0 scale-95 translate-x-8 pointer-events-none"
                      )}
                    >
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-full object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
