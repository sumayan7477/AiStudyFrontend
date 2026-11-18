import type { LoginRequest, RegisterFormValues } from "../types/auth";

/**
 * Client-side checks that mirror the backend rules (RegisterDto / LoginDto / PasswordPolicy).
 * The server still validates everything; these only give faster feedback.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const FULL_NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 256;

export const PASSWORD_RULES_TEXT =
    "8-128 characters with at least one uppercase letter, one lowercase letter and one digit.";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

// Unicode-aware, like .NET char.IsUpper / IsLower / IsDigit used by the API.
const UPPER = /\p{Lu}/u;
const LOWER = /\p{Ll}/u;
const DIGIT = /\p{Nd}/u;
const EMAIL = /^[^\s@]+@[^\s@]+$/;

export function validatePassword(password: string): string | undefined {
    if (!password) return "Password is required.";
    if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    if (password.length > PASSWORD_MAX_LENGTH) return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
    if (!UPPER.test(password)) return "Password must contain an uppercase letter.";
    if (!LOWER.test(password)) return "Password must contain a lowercase letter.";
    if (!DIGIT.test(password)) return "Password must contain a digit.";
    return undefined;
}

export function validateEmail(email: string): string | undefined {
    const value = email.trim();
    if (!value) return "Email is required.";
    if (value.length > EMAIL_MAX_LENGTH) return `Email must be at most ${EMAIL_MAX_LENGTH} characters.`;
    if (!EMAIL.test(value)) return "Enter a valid email address.";
    return undefined;
}

export function validateRegistration(values: RegisterFormValues): FieldErrors<RegisterFormValues> {
    const errors: FieldErrors<RegisterFormValues> = {};

    const fullName = values.fullName.trim();
    if (!fullName) errors.fullName = "Full name is required.";
    else if (fullName.length > FULL_NAME_MAX_LENGTH) errors.fullName = `Full name must be at most ${FULL_NAME_MAX_LENGTH} characters.`;

    const email = validateEmail(values.email);
    if (email) errors.email = email;

    const password = validatePassword(values.password);
    if (password) errors.password = password;

    if (!values.confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords do not match.";

    return errors;
}

/** Login only checks presence/format; complexity rules must not block older passwords. */
export function validateLogin(values: LoginRequest): FieldErrors<LoginRequest> {
    const errors: FieldErrors<LoginRequest> = {};

    const email = validateEmail(values.email);
    if (email) errors.email = email;

    if (!values.password) errors.password = "Password is required.";
    else if (values.password.length > PASSWORD_MAX_LENGTH) errors.password = `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;

    return errors;
}

/** Topic/subject for AI generation (AiRequestLimits.MaxTopicLength on the API). */
export const TOPIC_MAX_LENGTH = 200;

export function validateTopic(topic: string): string | undefined {
    const value = topic.trim();
    if (!value) return "Please enter a topic.";
    if (value.length > TOPIC_MAX_LENGTH) return `Topic must be at most ${TOPIC_MAX_LENGTH} characters.`;
    return undefined;
}

/** Picks the first server message for each known form field (keys from parseApiError are camelCase). */
export function pickFieldErrors<T>(
    serverErrors: Record<string, string[]>,
    fields: readonly (keyof T & string)[],
): FieldErrors<T> {
    const result: FieldErrors<T> = {};

    for (const field of fields) {
        const messages = serverErrors[field];
        if (messages && messages.length > 0) result[field] = messages[0];
    }

    return result;
}
