"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { Zap, ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setIsLoading(true);

        try {
            // better-auth v1 API for request password reset
            const result = await authClient.forgetPassword({
                email,
                redirectTo: "/reset-password", // Where user lands after clicking email link
            });

            if (result.error) {
                setError(result.error.message || "Failed to send reset email");
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
            {/* Background patterns matching landing page */}
            <div className="absolute inset-0 hero-dot-grid pointer-events-none -z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gradient-to-r from-emerald-500/15 via-blue-500/10 to-amber-500/15 dark:from-emerald-500/10 dark:via-blue-500/8 dark:to-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Top Navbar */}
            <header className="w-full border-b border-border/40 bg-background/50 backdrop-blur-md z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                            <Zap className="size-4 fill-current" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            Resumarq
                        </span>
                    </Link>
                    <Link href="/sign-in">
                        <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                            <ArrowLeft className="size-4" />
                            Back to Sign In
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Card Wrapper */}
            <main className="flex-1 flex items-center justify-center p-4 z-10">
                <Card className="w-full max-w-md bg-card/65 dark:bg-card/40 backdrop-blur-lg border border-border/80 dark:border-border/40 shadow-2xl rounded-2xl">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password?</CardTitle>
                        <CardDescription className="text-muted-foreground/80 mt-1">
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {success ? (
                            <div className="text-center space-y-5 py-4">
                                <div className="mx-auto w-12 h-12 bg-emerald-100/80 dark:bg-emerald-950/30 rounded-full flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/40">
                                    <svg
                                        className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg text-foreground">Check your inbox</h3>
                                    <p className="text-sm text-muted-foreground/90 leading-relaxed">
                                        We&apos;ve sent a password reset link to<br />
                                        <span className="font-medium text-foreground">{email}</span>
                                    </p>
                                </div>
                                <div className="pt-2 text-xs text-muted-foreground/85">
                                    Didn&apos;t receive the email? Check your spam folder or{" "}
                                    <button
                                        onClick={() => setSuccess(false)}
                                        className="text-primary hover:underline hover:text-primary/95 font-semibold transition-colors"
                                    >
                                        try again
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-foreground/90">Email Address</Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="bg-background/50 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary h-11 pl-10"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isLoading}
                                        />
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive text-center font-medium animate-pulse">{error}</p>
                                )}

                                <Button type="submit" className="w-full h-11 cursor-pointer font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all" disabled={isLoading}>
                                    {isLoading ? (
                                        <span className="flex items-center gap-2 justify-center">
                                            <Spinner size="sm" />
                                            Sending...
                                        </span>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>
                        )}

                        <p className="text-center text-sm text-muted-foreground/80">
                            Remember your password?{" "}
                            <Link href="/sign-in" className="text-primary hover:underline hover:text-primary/95 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
