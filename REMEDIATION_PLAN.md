# Remediation Plan — Round 1
**Project:** Golden Tier Peptide — E-commerce Platform
**Date:** 2026-03-09
**Audit Round:** 1
**Overall Score:** 85 / 100

---

## Audit Score Breakdown

| Dimension           | Score | Weight | Notes |
|---------------------|-------|--------|-------|
| Functionality       | 88    | 25%    | Core flows present; payment gateway absent |
| Security            | 82    | 25%    | IDOR risk, client-side discount calc, service-role leak |
| Code Quality        | 87    | 20%    | Good conventions; DatabaseContext monolith at 818 lines |
| Maintainability     | 70    | 15%    | Weakest dimension; missing tests, no audit trail for RPC |
| Design / UX         | 90    | 15%    | Brand consistent; role-gating messaging incomplete |

**Weighted Total: 85 / 100**

---

## Merge Blocker Conditions

Merge to `main` is **BLOCKED** until all three QA test artifacts, both Design fixes, and the specified Performance/Operations items are delivered and verified.

### QA Test Artifacts Required (4 tracks)

| # | Track | Acceptance Criterion |
|---|-------|----------------------|
| QA-1 | Invitation-code RPC coverage | Vitest test exercising `validate_invitation_code` RPC — valid, expired, over-limit, and already-used code paths all asserted |
| QA-2 | `handle_new_user()` trigger reliability | Vitest/integration test confirming that a new auth signup always creates a `profiles` row with the correct default role and status |
| QA-3 | Partner-role cart restriction guard | Vitest test confirming that non-partner (customer/admin) users cannot add items to cart and receive the correct access-denied UI |
| QA-4 | End-to-End Cart & Auth Flows | Successful Playwright/Vitest execution of the full authentication and cart management lifecycle (login -> add to cart -> cart persistence -> logout) |

### Design Fixes Required (2 blockers)

| # | Blocker | Acceptance Criterion |
|---|---------|----------------------|
| D-1 | Role-gated cart UI | ProductCard and CartSidebar display a clear "Partner access required" message instead of an enabled Add-to-Cart button for customer/admin roles |
| D-2 | Non-partner access messaging in product catalog | Products page shows a persistent, branded banner informing non-partner users that purchasing requires partner status, with a CTA pointing to the invitation/registration flow |

### Performance & Operations Required (2 blockers)

| # | Item | Acceptance Criterion |
|---|------|----------------------|
| P-1 | React Memoization & Debouncing | Implementation of `useMemo` for cart/product calculations and 500ms debounce for search/storage writes (ref: Master Plan G8, G9, D1, D2) |
| O-1 | Performance Threshold Monitoring | Operations verification that post-optimization LCP is < 1.5s and search latency remains under 200ms during concurrent updates |

---

## Prioritized Remediation Roadmap

### P0 — Merge Blockers (resolve before merge)

These items block the review gate. All must be resolved in the current round.

1. **[QA-1]** Write Vitest test for `validate_invitation_code` RPC — four code paths
2. **[QA-2]** Write Vitest/integration test for `handle_new_user()` trigger
3. **[QA-3]** Write Vitest test for partner-role cart guard (CartContext + CartSidebar)
4. **[QA-4]** Execute E2E validation for Cart and Auth flows
5. **[D-1]** Implement role-gated UI in `ProductCard.tsx` and `CartSidebar.tsx`
6. **[D-2]** Add non-partner access banner to `Products.tsx`
7. **[P-1]** Implement `useMemo` and debounce optimizations (Master Plan G8, G9, D1, D2)
8. **[O-1]** Establish and monitor performance thresholds post-optimization
9. **[THEME]** Implement Dark/Light/System theme with analytics and rollback procedures (CEO Request)

### P1 — Critical Security (next round, pre-launch)

6. Verify and harden RLS on `orders` table — confirm customers can only read their own rows
7. Move discount calculation server-side (Supabase RPC) — remove client-side `discount_rate` trust
8. Audit any temporary Supabase service-role client instantiation on the frontend and remove it
9. Enforce server-side total recalculation before order insert to prevent price manipulation

### P2 — High Reliability (next round, pre-launch)

10. Make inventory deduction atomic — wrap order creation + stock decrement in a single Postgres transaction / RPC
11. Re-fetch product prices at checkout submission (not from stale cart state)
12. Add error handling for silent `loadData()` failures — surface toast notifications and retry logic

### P3 — Feature Completeness (pre-launch backlog)

13. Integrate a payment processor (Stripe or equivalent) — orders currently record no payment
14. Implement transactional email notifications (order confirmation, status updates)
15. Add product catalog pagination and advanced filtering

### P4 — Maintainability (ongoing)

16. Split `DatabaseContext.tsx` (818 lines) into domain-specific hooks/contexts
17. Expand Vitest coverage to Cart, Checkout, Auth flow, and Partner Dashboard
18. Add E2E tests (Playwright or Cypress) for the full purchase funnel

---

## Team Assignments

| Track | Owner Department | Dependencies |
|-------|-----------------|-------------|
| QA-1, QA-2, QA-3 | QA/QC | Supabase project access, Vitest setup |
| D-1, D-2 | Design/Engineering | AuthContext role check, Tailwind tokens |
| P1 Security | Engineering | Supabase RLS admin access, server-side RPC authoring |
| P2 Reliability | Engineering | Postgres transaction knowledge |
| P3 Features | Engineering + Design | Payment provider account |
| P4 Maintainability | Engineering | — |

---

## Notes from Prior Audit Deliverables

- **SECURITY_AUDIT.md** (Planning worktree 196453c5): 32 findings across 7 categories — all P1 security items above are sourced from this document.
- **BUG_ANALYSIS.md** (Planning worktree 196453c5): 63 findings — 2 critical, 14 high, 32 medium, 15 low. P2 and P3 items align with the high-priority findings.
- **DESIGN_AUDIT_REPORT.md**: Confirmed D-1 and D-2 as the two unresolved design blockers; App.tsx line 174 JSX fix was already applied.
- **CHANGELOG_AND_TEST_RESULTS.md**: Baseline is 4/4 passing tests in `LandingPage.test.tsx` only. All three QA tracks are net-new test files.
