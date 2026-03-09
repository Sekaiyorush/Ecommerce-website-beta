# Master Work Plan — Golden Tier Peptide
> Consolidated from SECURITY_AUDIT.md + BUG_ANALYSIS.md + AUDIT_REPORT_20260309.md | 2026-03-09
> Lead Planner: Clio | Branch: climpire/196453c5

---

## 2026-03-09 Audit Summary (Round 1)
**Overall Health Score: 68.0 / 100 (Grade: C+)**
*Latest full report: [AUDIT_REPORT_20260309.md](./AUDIT_REPORT_20260309.md)*

---

## Severity Summary (Updated 2026-03-09)

| Severity | Security | Bugs | Total |
|---|---|---|---|
| Critical | 5 | 2 | 7 |
| High | 5 | 14 | 19 |
| Medium | 10 | 32 | 42 |
| Low | 7 | 15 | 22 |
| **TOTAL** | **27** | **63** | **90** |

---

## Work Streams (Frontend — Agents Assigned)

### Stream Alpha — Security: Auth & Config
**Files owned:** `src/context/AuthContext.tsx`, `src/lib/supabase.ts`

| # | Issue | Severity | Source |
|---|---|---|---|
| A1 | `alert(error.message)` → toast.error() throughout auth flow | Medium | SEC §1, BUG §UX |
| A2 | All auth error messages must be generic (no user enumeration) | Medium | SEC §6 |
| A3 | Validate Supabase URL starts with `https://` and key starts with `eyJ` | Medium | SEC §4 |

---

### Stream Beta — Form Validation
**Files owned:** `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/Contact.tsx`, `src/pages/Checkout.tsx`

| # | Issue | Severity | Source |
|---|---|---|---|
| B1 | Add Zod + react-hook-form schema to Login.tsx | Medium | SEC §3, BUG §Data |
| B2 | Add Zod schema to Register.tsx; add invitation code format guard (`/^[A-Z0-9]{6,}$/`) before RPC | Low | SEC §3 |
| B3 | Add Zod validation to Contact.tsx (prevent stored XSS vector) | Medium | SEC §3 |
| B4 | Add Zod validation to Checkout.tsx shipping form (phone regex, zip regex, address max length) | Low | SEC §3 |

---

### Stream Gamma — Product & Cart UX + Security
**Files owned:** `src/pages/ProductDetails.tsx`, `src/components/ProductCard.tsx`, `src/context/CartContext.tsx`

| # | Issue | Severity | Source |
|---|---|---|---|
| G1 | Disable "Add to Cart" button when selected variant is out of stock | Medium | BUG §UX |
| G2 | Show partner-discounted price in ProductCard tiles with "Your Price" label | Medium | BUG §Business |
| G3 | Show partner-discounted price in variant chip selector on ProductDetails | High | BUG §State |
| G4 | Fix `variantStock` undefined — default to `0` | Medium | BUG §TS |
| G5 | Namespace localStorage cart key by userId (`goldentier_cart_${userId}`) | Medium | BUG §UX |
| G6 | Clear cart on logout (watch auth user becoming null) | Medium | BUG §UX |
| G7 | Validate cart loaded from localStorage with Zod schema | Medium | SEC §6 |
| G8 | Wrap cart calculations in `useMemo` (cartCount, cartSubtotal, discountAmount, cartTotal) | Low | BUG §Perf |
| G9 | Debounce `saveCartToStorage()` writes (500ms) | Low | BUG §Perf |

---

### Stream Delta — Performance, Accessibility & Data Layer
**Files owned:** `src/pages/Products.tsx`, `src/components/CartSidebar.tsx`, `src/lib/formatPrice.ts`, `src/context/DatabaseContext.tsx`

| # | Issue | Severity | Source |
|---|---|---|---|
| D1 | `useMemo` for filtered/searched products array in Products.tsx | Medium | BUG §Perf |
| D2 | Debounce search input (500ms) in Products.tsx | Medium | BUG §Missing |
| D3 | CartSidebar: auto-close on route change via `useLocation()` | Low | BUG §State |
| D4 | CartSidebar: `text-slate-300` → `text-slate-500` (WCAG AA contrast) | Medium | BUG §a11y |
| D5 | `formatPrice.ts`: guard against `NaN` / `Infinity` → return `฿0.00 THB` | Low | BUG §TS |
| D6 | `loadData()`: set error state on failure; show user-visible error banner | High | BUG §Data, §Error |
| D7 | `addProduct()`: remove optimistic update; only update state after Supabase confirms | Medium | BUG §State |
| D8 | `updateOrder()`: validate status against enum; enforce valid state transitions | Medium | BUG §TS |
| D9 | Add `loading="lazy"` to all product `<img>` tags in ProductCard | Medium | BUG §Perf |

---

### Stream Epsilon — UI/UX Pro Max Reimplementation
**Files owned:** `src/components/ui/`, `src/App.tsx`, `src/index.css`, `tailwind.config.js`

| # | Issue | Severity | Source |
|---|---|---|---|
| E1 | Implement "Premium" design tokens (gold theme, glassmorphism) in UI primitives | Medium | UI/UX Strategy |
| E2 | Add high-fidelity skeleton loaders (shimmer) to all async components | Medium | UI/UX Strategy |
| E3 | Standardize typography (Playfair Display for headings, Inter for body) | Medium | UI/UX Strategy |
| E4 | Implement "Quick View" modal for Product Grid | Low | UI/UX Strategy |
| E5 | Mobile-first optimization for Checkout flow (Single-page accordion) | High | UI/UX Strategy |

---

### Stream Zeta — Quality, Reliability & Automation
**Files owned:** `QUALITY_AND_RELIABILITY_STRATEGY.md`, `src/test/`, `playwright.config.ts` (future)

| # | Issue | Severity | Source |
|---|---|---|---|
| Z1 | Execute Round 1 Manual QA Audit using QA_CHECKLIST.md | High | Quality Strategy |
| Z2 | Install and configure Playwright for Critical Path E2E testing | High | Quality Strategy |
| Z3 | Expand Vitest coverage to 70%+ (focus on Cart/Database Contexts) | Medium | Quality Strategy |
| Z4 | Implement single-step atomic registration RPC (backend coordination) | High | Quality Strategy |
| Z5 | Establish Core Web Vitals targets (LCP < 1.5s, CLS < 0.1) | Medium | Quality Strategy |
| Z6 | Audit ARIA labels and keyboard navigation for premium UI components | Medium | Quality Strategy |

---

## Requires Supabase / Backend Work (Cannot be fixed in frontend code)

These items require direct Supabase dashboard access or Edge Function deployment:

| # | Issue | Severity | Action Required |
|---|---|---|---|
| S1 | Verify RLS policy on `orders` table prevents IDOR | **Critical** | Supabase dashboard → check `customer_id = auth.uid()` policy |
| S2 | `createSecureOrder` RPC must recalculate all totals server-side | **Critical** | Edit Supabase RPC function |
| S3 | `create_secure_order` RPC must fetch prices from DB, never trust client values | **Critical** | Edit Supabase RPC function |
| S4 | Role assignment must happen only in server-side RPC, never from client invitation response | **High** | Edit `validate_invitation_code` RPC |
| S5 | Move secondary Supabase client / service-role operations to Edge Function | **Critical** | Create Supabase Edge Function |
| S6 | `validate_invitation_code` RPC must use `SELECT FOR UPDATE` (prevent race condition) | Medium | Edit Supabase RPC function |
| S7 | Ensure `createSecureOrder` uses a DB transaction with ROLLBACK on error | High | Edit Supabase RPC function |
| S8 | Inventory deduction should happen at shipment trigger, not order creation | High | Supabase trigger on `orders.status` change |
| S9 | Add inventory restore + refund trigger on order cancellation | Medium | Supabase trigger |
| S10 | Enforce password strength policy server-side in Supabase Auth settings | Medium | Supabase Auth settings |

---

## Requires New Integrations (Major Features)

| # | Feature | Priority | Notes |
|---|---|---|---|
| I1 | **Payment processor** (Stripe/PayPal) | Critical | No revenue collected without this |
| I2 | **Email notifications** (SendGrid/Mailgun/Edge Function) | High | Customers never receive confirmations |
| I3 | **CSP headers** configuration | Medium | Vite config + production server |

---

## Environment / Secrets (Immediate Manual Action)

> **Do NOW, before anything else:**
> 1. Check `git log --all -- .env.local` — if `.env.local` was ever committed, rotate the Supabase anon key immediately in the Supabase dashboard
> 2. Verify `.env.local` is in `.gitignore`
> 3. Rotate key: Supabase dashboard → Settings → API → Regenerate anon key

---

## File Ownership Map (no conflicts between streams)

| Stream | Files |
|---|---|
| Alpha | `src/context/AuthContext.tsx`, `src/lib/supabase.ts` |
| Beta | `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/Contact.tsx`, `src/pages/Checkout.tsx` |
| Gamma | `src/pages/ProductDetails.tsx`, `src/components/ProductCard.tsx`, `src/context/CartContext.tsx` |
| Delta | `src/pages/Products.tsx`, `src/components/CartSidebar.tsx`, `src/lib/formatPrice.ts`, `src/context/DatabaseContext.tsx` |

---

## Progress Tracker

- [x] **Alpha** — Auth security + config ✅
- [x] **Beta** — Form validation ✅
- [x] **Gamma** — Product & cart UX/security ✅
- [x] **Delta** — Performance, a11y, data layer ✅
- [ ] **Epsilon** — UI/UX Pro Max Reimplementation (Planning phase complete 📄)
- [ ] **Zeta** — Quality, Reliability & Automation (Strategy defined 📄)
- [ ] **QA & Design Testing Phase** — Validating core flows and design gaps (TEST_STRATEGY_AND_CHECKLIST.md)
- [ ] **Supabase** — Backend/RLS/RPC (manual)
- [ ] **Integrations** — Payments + Email (future sprint)
