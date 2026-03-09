# Planning Conditional Approval — Round 1
**Project:** Golden Tier Peptide — E-commerce Platform
**Date:** 2026-03-09
**Issued by:** Planning (Juno/Sage)
**Status:** CONDITIONAL APPROVAL — Merge Blocked

---

## Decision Summary

The codebase has been audited against the core project goal:
> *Transform the UI component library into a functional e-commerce platform with product catalog and cart.*

**Overall Score: 85 / 100**

The codebase is structurally sound and architecturally consistent with the stated requirements. The provider hierarchy, routing, Supabase integration, and role-based access control scaffolding are all in place. Planning issues a **conditional approval** for this round.

**Merge to `main` remains BLOCKED** until the conditions below are fully satisfied.

---

## Approval Conditions

### Condition 1 — QA Test Artifacts (3 required)

QA/QC must deliver verifiable test artifacts for each of the following critical paths before merge is unblocked:

| Artifact | Description |
|----------|-------------|
| **QA-1** | Vitest test for `validate_invitation_code` RPC (valid / expired / over-limit / already-used) |
| **QA-2** | Vitest/integration test for `handle_new_user()` Postgres trigger (profile row creation + correct default role) |
| **QA-3** | Vitest test for partner-role cart restriction guard (non-partner users cannot add to cart; access-denied UI fires) |

QA will issue final sign-off without re-opening a new review round once these three artifacts pass.

### Condition 2 — Design Blockers (2 required)

Engineering/Design must ship both UI fixes before merge is unblocked:

| Fix | Description |
|-----|-------------|
| **D-1** | `ProductCard.tsx` and `CartSidebar.tsx` display a "Partner access required" message for non-partner roles — no enabled Add-to-Cart button for customer or admin |
| **D-2** | `Products.tsx` displays a persistent branded banner informing non-partner users of the partner-only purchasing model, with a CTA pointing to the invitation/registration flow |

---

## Rationale for Conditional (Not Full) Approval

| Factor | Finding |
|--------|---------|
| Maintainability (70/100) | Weakest dimension; 818-line `DatabaseContext.tsx` monolith, sparse test coverage |
| Untested critical paths | Invitation-code RPC and trigger reliability have zero test coverage at baseline |
| Role-gate UI gaps | Cart/checkout are correctly route-protected but the product catalog gives non-partner users no actionable messaging |
| Security (82/100) | IDOR on orders, client-side discount calc, and service-role client are deferred to P1 (next round); not merge-blocking at this stage given they require deeper backend work |

---

## Post-Approval Roadmap Commitments

Once the five merge-blocker conditions are satisfied, the following items are committed for the **next round** (pre-launch):

- P1 Security: RLS hardening, server-side discount calc, service-role client removal
- P2 Reliability: Atomic inventory transaction, price re-fetch at checkout, silent-failure error handling
- P3 Features: Payment processor integration, transactional email notifications
- P4 Maintainability: `DatabaseContext.tsx` decomposition, expanded test coverage

See `REMEDIATION_PLAN.md` for the full prioritized backlog with team assignments.

---

## Sign-Off Record

| Role | Status | Condition |
|------|--------|-----------|
| Planning (Sage/Juno) | Conditional Approval | All 5 blocker conditions met |
| QA/QC (Kuromi) | Conditional Approval | QA-1, QA-2, QA-3 test artifacts passing |
| Design (Pixel/Luna) | Conditional Approval | D-1 and D-2 UI fixes shipped |

**Full approval and merge unblock require all three departments to lift their conditions simultaneously.**
