"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { validatePassword } from "@/lib/password-validation";
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

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token. Please request a new password reset link.");
        }
    }, [token]);

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

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-red-600 dark:text-red-400"
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
                        <div>
                            <h3 className="font-semibold text-lg">Invalid Reset Link</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                This password reset link is invalid or has expired.
                            </p>
                        </div>
                        <Button asChild className="w-full">
                            <Link href="/forgot-password">Request New Reset Link</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
                    <CardDescription>Enter your new password below</CardDescription>
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
                                <h3 className="font-semibold text-lg">Password reset successful!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Your password has been updated. You can now sign in with your new password.
                                </p>
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/sign-in">Sign In</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                {/* Password strength - only show when typing */}
                                {password && (
                                    <div className="space-y-2">
                                        <div className="flex gap-1">
                                            <div className={`h-1 flex-1 rounded ${strengthColors[strength]}`} />
                                            <div className={`h-1 flex-1 rounded ${strength !== "weak" ? strengthColors[strength] : "bg-muted"}`} />
                                            <div className={`h-1 flex-1 rounded ${strength === "strong" ? strengthColors[strength] : "bg-muted"}`} />
                                        </div>
                                        {passwordErrors.length > 0 && (
                                            <ul className="text-xs text-destructive space-y-0.5">
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
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-destructive">Passwords do not match</p>
                                )}
                            </div>

                            {error && (
                                <p className="text-sm text-destructive text-center">{error}</p>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
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
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Spinner size="lg" />
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
