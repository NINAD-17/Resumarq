/**
 * Password Validation Utility
 * 
 * Shared between client components for consistent password requirements.
 * Uses score-based strength calculation.
 */

export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: "weak" | "medium" | "strong";
    score: number;
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length (required)
    if (password.length >= 8) {
        score++;
    } else {
        errors.push("At least 8 characters");
    }

    // Extra point for longer passwords
    if (password.length >= 12) {
        score++;
    }

    // Check for uppercase (required)
    if (/[A-Z]/.test(password)) {
        score++;
    } else {
        errors.push("At least 1 uppercase letter");
    }

    // Check for lowercase (required)
    if (/[a-z]/.test(password)) {
        score++;
    } else {
        errors.push("At least 1 lowercase letter");
    }

    // Check for number (required)
    if (/[0-9]/.test(password)) {
        score++;
    } else {
        errors.push("At least 1 number");
    }

    // Check for special character (required)
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score++;
    } else {
        errors.push("At least 1 special character");
    }

    // Calculate strength based on score
    // Max score = 6 (5 requirements + 1 bonus for 12+ chars)
    let strength: "weak" | "medium" | "strong" = "weak";
    if (score >= 6) {
        strength = "strong";
    } else if (score >= 4) {
        strength = "medium";
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength,
        score,
    };
}
