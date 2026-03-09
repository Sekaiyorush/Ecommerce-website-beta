# Finalized Execution Plan: E-commerce Platform Transformation (Round 1)
**Project:** Golden Tier Peptide — E-commerce Platform
**Lead Planner:** Clio (Senior, Planning)
**Date:** 2026-03-09
**Status:** FINALIZED — Ready for Sequential Execution

---

## 1. Core Objective
Transform the existing UI component library into a fully functional, high-performance e-commerce platform with a robust product catalog, secure cart management, and role-based access control (RBAC), adhering to the "Golden Tier" premium brand standards (`#D4AF37` / `#AA771C`).

---

## 2. Detailed Task Sequence

### Phase 1: Structural Audit & Validation (Immediate)
| Task ID | Task Description | Owner | Success Criteria |
|:---|:---|:---|:---|
| **P1-A** | **Design Inventory Audit:** Audit `ProductCard`, `CartSidebar`, and `Checkout` flow against gold brand standards and role-gated visibility rules. | Design (Pixel) | Audit report identifying all UI/UX gaps vs functional requirements. |
| **P1-B** | **State Management Audit:** Audit `DatabaseContext` and cart wiring for potential race conditions and performance bottlenecks (addressing "Atlas" concerns). | Operations (Atlas) | Performance audit report with specific optimization recommendations for cart/catalog. |

### Phase 2: Functional Remediation (Merge Blockers)
| Task ID | Task Description | Owner | Success Criteria |
|:---|:---|:---|:---|
| **P2-D1** | **Role-Gated Cart UI (D-1):** Implement "Partner access required" messaging in `ProductCard.tsx` and `CartSidebar.tsx` for non-partner roles. | Design/Eng | "Add to Cart" is disabled/hidden; clear branded messaging is displayed. |
| **P2-D2** | **Catalog Access Banner (D-2):** Add a persistent, branded banner to `Products.tsx` informing users of the partner-only model. | Design/Eng | High-visibility banner with registration CTA present on the products page. |
| **P2-Q1** | **Invitation RPC Testing (QA-1):** Write Vitest tests for `validate_invitation_code` (valid, expired, over-limit, used). | QA/Eng | 100% path coverage for the invitation RPC confirmed by Vitest. |
| **P2-Q2** | **New User Trigger Testing (QA-2):** Write integration tests for `handle_new_user()` Postgres trigger. | QA/Eng | Verified profile creation and role assignment for new auth signups. |
| **P2-Q3** | **Cart Guard Testing (QA-3):** Write Vitest tests for partner-role cart restriction guards. | QA/Eng | Non-partner users are programmatically blocked from adding items to cart. |

### Phase 3: Admin & Infrastructure Enhancements
| Task ID | Task Description | Owner | Success Criteria |
|:---|:---|:---|:---|
| **P3-ADM** | **Admin Product Redesign:** Implement `DataTable` and multi-tabbed `ProductDialog` as per `ADMIN_PRODUCT_REDESIGN_SPEC.md`. | Engineering | Redesigned admin interface with bulk actions and inline editing functional. |
| **P3-SEC** | **Security Hardening (P1):** Verify RLS on `orders` and implement server-side discount calculations (Supabase RPCs). | Engineering | Security audit confirms no IDOR risk or client-side price manipulation possible. |

---

## 3. Deliverable Criteria

### A. UI/UX Standard
- **Consistency:** All gold accents must use `#D4AF37` (Primary) or `#AA771C` (Deep Gold).
- **Responsive:** Checkout flow must be mobile-optimized (single-page accordion pattern).
- **Feedback:** All asynchronous actions (Add to Cart, Login, Checkout) must have shimmer skeleton loaders or toast feedback.

### B. Technical Integrity
- **Type Safety:** Zero `any` types in new e-commerce logic; all data passed to RPCs must be validated with Zod.
- **Performance:** Cart subtotal and total calculations must be memoized; `saveCartToStorage` must be debounced.
- **Reliability:** No silent failures in `loadData()`; all errors must be caught and surfaced via toast or UI banners.

### C. Validation & Sign-Off
1.  **Code Review:** All merge blockers must pass peer review.
2.  **QA Sign-Off:** All three QA test artifacts (QA-1, QA-2, QA-3) must be passing in CI.
3.  **Design Sign-Off:** Visual review of D-1 and D-2 against the premium brand guide.

---

## 4. Resource Allocation
- **Planning (Clio):** Strategy oversight and roadmap maintenance.
- **Operations (Atlas):** Database integration, performance optimization, and backend RPC coordination.
- **Design (Pixel):** UI/UX consistency, brand tokens, and accessibility.
- **QA/QC (Kuromi):** Test automation and functional verification.
