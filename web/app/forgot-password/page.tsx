"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";

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
            const result = await authClient.requestPasswordReset({
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
                    <CardDescription>
                        Enter your email and we&apos;ll send you a reset link
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-green-600 dark:text-green-400"
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
                            <div>
                                <h3 className="font-semibold text-lg">Check your email</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We&apos;ve sent a password reset link to{" "}
                                    <span className="font-medium text-foreground">{email}</span>
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Didn&apos;t receive the email? Check your spam folder or{" "}
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="text-primary hover:underline"
                                >
                                    try again
                                </button>
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-destructive text-center">{error}</p>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Spinner size="sm" />
                                        Sending...
                                    </span>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    )}

                    <p className="text-center text-sm text-muted-foreground">
                        Remember your password?{" "}
                        <Link href="/sign-in" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
