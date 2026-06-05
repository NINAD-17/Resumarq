"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { validatePassword } from "@/lib/password-validation";
import { Spinner } from "@/components/ui/spinner";
import { Zap, ArrowLeft } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

export default function SignUpPage() {
    const router = useRouter();
    const [callbackUrl, setCallbackUrl] = useState("/dashboard");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Retrieve callback URL safely without triggering useSearchParams Suspense build warnings
    useEffect(() => {
        if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            const cb = searchParams.get("callbackUrl");
            if (cb) {
                setCallbackUrl(cb);
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

    const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

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
            const result = await signUp.email({
                email,
                password,
                name,
            });

            if (result.error) {
                setError(result.error.message || "Failed to create account");
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setError("");
        setIsLoading(true);

        try {
            await signIn.social({
                provider: "google",
                callbackURL: callbackUrl,
            });
        } catch (err) {
            setError("Failed to sign up with Google");
            console.error(err);
            setIsLoading(false);
        }
    };

    // Get strength data once to avoid multiple calls
    const passwordValidation = password ? validatePassword(password) : null;
    const strength = passwordValidation?.strength || "weak";

    // Direct color assignment based on strength
    const strengthColors = {
        weak: "bg-red-500",
        medium: "bg-yellow-500",
        strong: "bg-green-500",
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-background overflow-x-hidden">
            {/* Background patterns matching landing page */}
            <div className="absolute inset-0 hero-dot-grid pointer-events-none -z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gradient-to-r from-emerald-500/15 via-blue-500/10 to-amber-500/15 dark:from-emerald-500/10 dark:via-blue-500/8 dark:to-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Top Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                            <Zap className="size-4 fill-current" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            Resumarq
                        </span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                            <ArrowLeft className="size-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </header>
            {/* Spacer to push content below the fixed navbar */}
            <div className="h-16 w-full shrink-0" />

            {/* Main Card Wrapper */}
            <main className="flex-1 flex items-center justify-center p-4 z-10 my-6">
                <Card className="w-full max-w-md bg-card/65 dark:bg-card/40 backdrop-blur-lg border border-border/80 dark:border-border/40 shadow-2xl rounded-2xl">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
                        <CardDescription className="text-muted-foreground/80 mt-1">Start optimizing your career with AI insights</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Google Sign Up */}
                        <Button
                            variant="outline"
                            className="w-full border-border/60 hover:bg-accent/80 hover:text-accent-foreground cursor-pointer flex items-center justify-center gap-2.5 h-11"
                            onClick={handleGoogleSignUp}
                            disabled={isLoading}
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full border-border/40" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card/90 dark:bg-card/25 backdrop-blur-sm px-3 text-muted-foreground/80">
                                    or continue with email
                                </span>
                            </div>
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailSignUp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-foreground/90">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="bg-background/50 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary h-11"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-foreground/90">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="bg-background/50 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary h-11"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-foreground/90">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-background/50 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary h-11"
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                {/* Password strength indicator - only show when user starts typing */}
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
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/90">Confirm Password</Label>
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
                                        Creating account...
                                    </span>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground/80">
                            Already have an account?{" "}
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
