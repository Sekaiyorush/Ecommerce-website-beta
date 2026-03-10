# Technical Specification: Dark/Light Theme Implementation

## 1. Overview
Implementation of a robust, accessible, and performant theme switching system (Light, Dark, System) for the Golden Tier Peptide platform, utilizing Tailwind CSS and `next-themes` (or a custom `ThemeProvider` context).

## 2. Architectural Implementation
- **Theme Engine:** `ThemeProvider` context in `src/context/ThemeContext.tsx`.
- **Persistence:** LocalStorage using key `vite-ui-theme` (default).
- **CSS Strategy:** Tailwind `darkMode: 'class'` (class-based switching on `<html>` element).
- **System Preference:** Support for `prefers-color-scheme` via the 'system' theme option.

## 3. Component Details
### A. ThemeToggle (`src/components/ThemeToggle.tsx`)
- Dropdown menu allowing users to select "Light", "Dark", or "System".
- Animated icons (Sun/Moon) with smooth transitions.
- Ghost button variant for header integration.

### B. ThemeProvider (`src/context/ThemeContext.tsx`)
- Manages the active theme state.
- Applies the correct class to the `document.documentElement`.
- Synchronizes with LocalStorage for persistence across sessions.

---

## 4. Operations & Maintenance (Atlas Requirements)

### A. Analytics Integration Requirements
- **Tracking Events:**
  - `theme_change`: Track when a user manually switches themes.
    - Properties: `from_theme`, `to_theme`, `timestamp`.
  - `theme_initial_load`: Track the theme applied on initial load (including system preference).
    - Properties: `theme`, `is_system_default: boolean`.
- **Implementation Note:** Integration with the existing analytics framework (to be established) to monitor user preference trends.

### B. Deployment Rollback Procedures
- **Pre-deployment Check:** Verify that `darkMode: 'class'` is correctly set in `tailwind.config.js`.
- **Rollback Trigger:** If the theme switching causes layout breakage or contrast issues (WCAG failures) on critical paths (Checkout, Admin).
- **Rollback Steps:**
  1. Revert the commit introducing `ThemeProvider` in `App.tsx`.
  2. If LocalStorage state persists incorrectly, bump the `storageKey` version to force a reset to `system` default.
  3. Re-verify the "Gold" brand consistency in the previous stable version.

---

## 5. Security & Infrastructure (Vault Requirements)

### A. CSP Compatibility
- The `ThemeProvider` must avoid inline `style` attributes that violate strict Content Security Policy (CSP).
- Class-based theme switching (adding `.dark` to `<html>`) is the preferred method to remain CSP-compliant.

### B. LocalStorage Guardrails
- **Sanitization:** Ensure that the value retrieved from LocalStorage is validated against the allowed enum (`light`, `dark`, `system`).
- **Fallbacks:** If an invalid or corrupted value is found in LocalStorage, default to `system` and clear the corrupted key.

---

## 6. Design & UX Guidelines (Echo-R Requirements)

### A. Contrast Ratio Validation
- All "Gold" tokens (`#D4AF37`, `#AA771C`) must maintain WCAG 2.1 AA compliance (ratio > 4.5:1) against the Dark Mode surface (`Slate 900`).
- Use secondary gold tokens if necessary for better legibility in dark mode.

### B. Visual Consistency Audit
- Ensure all `shadcn/ui` primitives (Tabs, Dialog, Popover, etc.) have explicit `dark:` variant classes defined.
- Surface colors in dark mode should use a consistent elevation palette (e.g., `Slate 900` for base, `Slate 800` for cards/modals).

---

## 7. Implementation Checklist
- [x] Create `ThemeContext.tsx` and `ThemeProvider`.
- [x] Create `ThemeToggle.tsx` component.
- [x] Integrate `ThemeProvider` into `App.tsx` or `main.tsx`.
- [ ] Implement Analytics tracking for theme changes.
- [ ] Finalize WCAG contrast audit for Dark Mode.
- [ ] Document rollback validation in CI pipeline.
