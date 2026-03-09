# Design Error States Specification
**Owner:** Design (Iris)
**Date:** 2026-03-09
**Scope:** Security-related UI flows — Login, Register, Forgot Password, Reset Password

---

## Overview

This document specifies user-friendly error states for all security-related user flows, responding to the Backend & Security Audit findings that flagged raw error exposure and missing user feedback as UX and security risks.

All error/feedback components follow the Golden Tier Peptide brand system:
- Gold accent: `#D4AF37` / `#AA771C`
- Font: serif headings + `tracking-[0.2em] uppercase` labels
- Backdrop blur cards, subtle shadows, border `border-[#D4AF37]/20`

---

## New Components Delivered

### 1. `SecurityAlert` (`src/components/ui/security-alert.tsx`)

A branded, dismissible alert component with four severity variants.

| Variant | Use Case | Visual |
|---------|----------|--------|
| `error` | Login failure, registration error, password mismatch | Red border/bg, `ShieldAlert` icon |
| `warning` | Rate limit notice, session expiry warning | Amber border/bg, `AlertCircle` icon |
| `success` | Confirmation messages (fallback to in-page states) | Emerald border/bg, `CheckCircle2` icon |
| `info` | Informational notices matching brand gold | Gold border/bg, `Info` icon |

**Design Principles:**
- `role="alert"` + `aria-live="assertive"` for screen reader accessibility
- Labeled severity prefix (`ERROR`, `NOTICE`, `SUCCESS`, `INFO`) in 9px uppercase — separates the meta-category from the human message
- Dismissible via `onDismiss` prop — users can clear stale errors before retrying
- No raw technical error strings exposed to the user (enforced at call sites)

**Usage Example:**
```tsx
<SecurityAlert
  variant="error"
  message="We couldn't sign you in. Please check your credentials and try again."
  onDismiss={() => setServerError('')}
/>
```

---

### 2. `PasswordStrengthMeter` (`src/components/auth/PasswordStrengthMeter.tsx`)

A real-time password strength visual for Register and Reset Password flows.

**Scoring System (0–4):**
| Score | Label | Color |
|-------|-------|-------|
| 0 | — | Slate |
| 1 | Weak | Red |
| 2 | Fair | Amber |
| 3 | Good | Blue |
| 4 | Strong | Emerald |

**Criteria (each adds +1):**
1. Length ≥ 8 characters
2. Contains uppercase letter
3. Contains number
4. Contains special character

**Visual:**
- 4-segment horizontal bar — each segment fills with the score color as criteria are met
- Micro-checklist below the bar: 4 dots turn emerald when each requirement is satisfied
- Renders only when the password field has content (mounts/unmounts smoothly)

**Design Rationale:**
- Guides users toward stronger passwords without blocking form submission
- Complements the server-side password policy enforcement recommended in the security audit
- Matches project's 10px uppercase label convention

---

## Auth Page Updates

### Login (`src/pages/Login.tsx`)
- **Before:** `<div className="bg-red-50 text-red-600 ...">` (plain div, raw message)
- **After:** `<SecurityAlert variant="error" message={serverError} onDismiss={...} />`
- Error is dismissible; icon + label improve scanability

### Register (`src/pages/Register.tsx`)
- **Before:** Plain red div for server error
- **After:** `<SecurityAlert variant="error" ... />` + `<PasswordStrengthMeter password={passwordValue} />`
- Password field now tracks value into local `passwordValue` state, feeding the strength meter
- Strength meter appears inline below the password input

### Forgot Password (`src/pages/ForgotPassword.tsx`)
- **Before:** Plain red div
- **After:** `<SecurityAlert variant="error" ... />` (dismissible)

### Reset Password (`src/pages/ResetPassword.tsx`)
- **Before:** Plain red div; expired-session check commented out
- **After:** `<SecurityAlert variant="error" ... />` + `<PasswordStrengthMeter password={password} />`
- **New:** Expired/invalid session error is now surfaced: `"Your password reset link has expired or is invalid. Please request a new one."` — previously the `setError` call was commented out, leaving users with a blank page

---

## Error Message Guidelines

All user-facing messages must follow these rules (applied at call sites):

| Scenario | Recommended Message |
|----------|---------------------|
| Login failed (wrong credentials) | "We couldn't sign you in. Please check your credentials and try again." |
| Login — account locked / too many attempts | "Access temporarily restricted. Please wait a few minutes and try again." |
| Registration — invalid invitation code | "This invitation code is invalid or has already been used." |
| Registration — email already registered | "An account with this email already exists. Sign in instead?" |
| Registration — server error | "Account creation failed. Please try again or contact support." |
| Forgot password — error | "We couldn't send a reset link. Please check the email address." |
| Reset password — link expired | "Your password reset link has expired or is invalid. Please request a new one." |
| Reset password — passwords do not match | "Passwords do not match. Please re-enter both fields." |
| Generic catch-all | "Something went wrong. Please try again." |

> **Security Note:** Never expose raw Supabase error messages (e.g., `"User not found"`, `"Invalid login credentials"`). These enable user enumeration. All messages above are intentionally generic about whether the email/account exists.

---

## Accessibility Checklist

- [x] `role="alert"` on SecurityAlert — fires announcement on mount
- [x] `aria-live="assertive"` — high-priority announcement for screen readers
- [x] `aria-hidden="true"` on decorative icons
- [x] `aria-label="Dismiss"` on the close button
- [x] Sufficient color contrast: red-700 on red-50 (≥ 4.5:1), emerald-700 on emerald-50 (≥ 4.5:1)
- [x] PasswordStrengthMeter uses both color and text labels (not color alone)

---

## Handoff Notes for Development

1. The `SecurityAlert` component is drop-in for all `bg-red-50 text-red-600` error divs across the codebase — search for this pattern to find remaining instances in admin/partner pages.
2. `PasswordStrengthMeter` only renders when `password` prop is non-empty — no layout shift on empty state.
3. Error messages at call sites should be sanitized before being passed to `SecurityAlert`. Do **not** pass `error.message` from Supabase directly.
4. The `warning` variant of `SecurityAlert` is reserved for future rate-limit banners (e.g., 5-attempt lockout countdown).
