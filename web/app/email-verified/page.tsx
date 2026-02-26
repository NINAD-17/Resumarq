"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Email Verification Callback Page
 * 
 * Better Auth automatically verifies the email when user clicks the link.
 * This page is the callback URL after verification completes.
 * 
 * Query params from Better Auth:
 * - ?error=INVALID_TOKEN - if verification failed
 * - (no error) - verification succeeded
 */
function EmailVerificationContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    // If there's an error query param, verification failed
    const isError = !!error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6 text-center space-y-4">
                    {isError ? (
                        <>
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
                                <h3 className="font-semibold text-lg">Verification failed</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {error === "INVALID_TOKEN"
                                        ? "This verification link is invalid or has expired."
                                        : "Something went wrong during verification."}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Button asChild className="w-full">
                                    <Link href="/sign-in">Sign In</Link>
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Need a new verification link?{" "}
                                    <Link href="/sign-up" className="text-primary hover:underline">
                                        Sign up again
                                    </Link>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
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
                                <h3 className="font-semibold text-lg">Email verified!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Your email has been successfully verified. You can now access all features.
                                </p>
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/">Continue to App</Link>
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function EmailVerifiedPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Spinner size="lg" />
                </div>
            }
        >
            <EmailVerificationContent />
        </Suspense>
    );
}
