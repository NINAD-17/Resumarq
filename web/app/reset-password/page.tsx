"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { validatePassword } from "@/lib/password-validation";
import { Spinner } from "@/components/ui/spinner";
import { Zap, ArrowLeft, KeyRound } from "lucide-react";

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

export default function ResetPasswordPage() {
    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingToken, setIsCheckingToken] = useState(true);

    // Retrieve reset token safely without useSearchParams Suspense boundaries
    useEffect(() => {
        if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            const tokenParam = searchParams.get("token");
            setToken(tokenParam);
            setIsCheckingToken(false);
            if (!tokenParam) {
                setError("Invalid or missing reset token. Please request a new password reset link.");
            }
        }
    }, []);

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (value) {
            const validation = validatePassword(value);
            setPasswordErrors(validation.errors);
        } else {
            setPasswordErrors([]);
        }
    };

    // Get strength data once to avoid multiple calls
    const passwordValidation = password ? validatePassword(password) : null;
    const strength = passwordValidation?.strength || "weak";

    const strengthColors = {
        weak: "bg-red-500",
        medium: "bg-yellow-500",
        strong: "bg-green-500",
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("Invalid reset token");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const validation = validatePassword(password);
        if (!validation.isValid) {
            setError("Please fix password requirements");
            return;
        }

        setIsLoading(true);

        try {
            const result = await authClient.resetPassword({
                newPassword: password,
                token,
            });

            if (result.error) {
                setError(result.error.message || "Failed to reset password");
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
                {isCheckingToken ? (
                    <div className="flex flex-col items-center gap-3">
                        <Spinner size="lg" />
                        <p className="text-sm text-muted-foreground">Verifying token...</p>
                    </div>
                ) : !token ? (
                    <Card className="w-full max-w-md bg-card/65 dark:bg-card/40 backdrop-blur-lg border border-border/80 dark:border-border/40 shadow-2xl rounded-2xl">
                        <CardContent className="pt-8 text-center space-y-5">
                            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/25">
                                <svg
                                    className="w-6 h-6 text-destructive"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-foreground">Invalid Reset Link</h3>
                                <p className="text-sm text-muted-foreground/90 leading-relaxed px-4">
                                    This password reset link is invalid, has expired, or is missing a token.
                                </p>
                            </div>
                            <Button asChild className="w-full h-11 font-medium mt-2">
                                <Link href="/forgot-password">Request New Link</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="w-full max-w-md bg-card/65 dark:bg-card/40 backdrop-blur-lg border border-border/80 dark:border-border/40 shadow-2xl rounded-2xl">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-2xl font-bold tracking-tight font-sans">Reset Password</CardTitle>
                            <CardDescription className="text-muted-foreground/80 mt-1">Enter your new password below</CardDescription>
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
                                        <h3 className="font-semibold text-lg text-foreground">Password updated!</h3>
                                        <p className="text-sm text-muted-foreground/90">
                                            Your password was reset successfully. You can now sign in.
                                        </p>
                                    </div>
                                    <Button asChild className="w-full h-11 font-medium mt-2">
                                        <Link href="/sign-in">Sign In</Link>
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="bg-background/50 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary h-11 pl-10"
                                                value={password}
                                                onChange={(e) => handlePasswordChange(e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                                        </div>
                                        {/* Password strength - only show when typing */}
                                        {password && (
                                            <div className="space-y-2 pt-1">
                                                <div className="flex gap-1.5">
                                                    <div className={`h-1 flex-1 rounded ${strengthColors[strength]}`} />
                                                    <div className={`h-1 flex-1 rounded ${strength !== "weak" ? strengthColors[strength] : "bg-muted/40"}`} />
                                                    <div className={`h-1 flex-1 rounded ${strength === "strong" ? strengthColors[strength] : "bg-muted/40"}`} />
                                                </div>
                                                {passwordErrors.length > 0 && (
                                                    <ul className="text-xs text-destructive space-y-0.5 mt-1 font-medium">
                                                        {passwordErrors.map((err, i) => (
                                                            <li key={i}>• {err}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            className="bg-background/50 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary h-11"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                        />
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-xs text-destructive font-medium">Passwords do not match</p>
                                        )}
                                    </div>

                                    {error && (
                                        <p className="text-sm text-destructive text-center font-medium animate-pulse">{error}</p>
                                    )}

                                    <Button type="submit" className="w-full h-11 cursor-pointer font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all" disabled={isLoading}>
                                        {isLoading ? (
                                            <span className="flex items-center gap-2 justify-center">
                                                <Spinner size="sm" />
                                                Resetting...
                                            </span>
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
