# Consolidated Remediation List — Round 1 Final Push
**Date:** 2026-03-09
**Lead:** Planning (Mina/Clio)

This document represents the "single pass" consolidated requirements from all department leads to resolve all blocking and incomplete items for the Golden Tier Peptide e-commerce transformation.

---

## 1. Development (Lead: Atlas/Engineering)
*Focus: Performance, State Management, and Reliability*

| Task ID | Item | Specification |
|---------|------|---------------|
| DEV-01  | `useMemo` Optimizations | Implement `useMemo` for filtered products in `Products.tsx` and all cart calculations in `CartContext.tsx` (subtotal, discount, total). |
| DEV-02  | Debounce Inputs | Apply 500ms debounce to the search input in `Products.tsx` and the `saveCartToStorage` operation. |
| DEV-03  | Cart Persistence Fix | Ensure cart is namespaced by `userId` and cleared on logout. |
| DEV-04  | Variant Stock Guard | Fix `variantStock` undefined issues and disable "Add to Cart" for out-of-stock items. |

## 2. Design (Lead: Pixel)
*Focus: UX Polish and Role-Gated Messaging*

| Task ID | Item | Specification |
|---------|------|---------------|
| DES-01  | Partner-Gated UI | Replace "Add to Cart" with "Partner Access Required" (disabled button or styled link) for non-partner roles in `ProductCard` and `CartSidebar`. |
| DES-02  | Product Catalog Banner | Implement a branded, persistent banner in `Products.tsx` informing non-partners of the membership model with a CTA to Register. |
| DES-03  | Skeleton Loaders | Add high-fidelity shimmer skeletons for Product Grid and Dashboard cards to improve perceived performance. |

## 3. QA / QC (Lead: Kuromi)
*Focus: Test Coverage and E2E Validation*

| Task ID | Item | Specification |
|---------|------|---------------|
| QA-01   | Invitation RPC Tests | Vitest coverage for `validate_invitation_code` (success, expired, used, over-limit). |
| QA-02   | Auth Trigger Tests | Verify `handle_new_user()` correctly creates profile rows with default roles. |
| QA-03   | Role-Gate Logic Tests | Assert that Cart/Checkout routes and actions are blocked for `customer` roles. |
| QA-04   | E2E Flow Validation | Manual/Automated run of the full path: Registration -> Login -> Product Selection -> Cart Mgmt -> Logout. |

## 4. Operations (Lead: Atlas)
*Focus: Monitoring and Deployment Readiness*

| Task ID | Item | Specification |
|---------|------|---------------|
| OPS-01  | Performance Monitoring | Set up monitoring for LCP (< 1.5s) and CLS (< 0.1) post-optimization. |
| OPS-02  | Search Latency Audit | Verify search debounce effectively keeps API/Filtering latency under 200ms. |
| OPS-03  | Supabase Key Rotation | Confirm anon key rotation if legacy `.env` exposure is suspected. |

## 5. Final Round 1 Review Blockers (Immediate Remediation)

| Task ID | Item | Specification |
|---------|------|---------------|
| R1-1    | Checkout Role-Gate | Implement `isPartner` check in `CheckoutPage.tsx` with redirect to `/products`. |
| R1-2    | Catalog Skeletons | Replace inline `animate-pulse` in `Products.tsx` with `ProductCardSkeleton`. |
| R1-3    | Branded Alerts | Add `gold` variant to `Alert` component in `src/components/ui/alert.tsx`. |
| R1-4    | Auth RPC Verification | Ensure `AuthReliability.test.tsx` passes in CI/CD. |

---

## Execution Strategy
All teams are to proceed in **parallel**. The review cycle will not restart until all P0 items (marked as blockers in `REMEDIATION_PLAN.md` and `MASTER_WORK_PLAN.md`) are verified by Planning.
