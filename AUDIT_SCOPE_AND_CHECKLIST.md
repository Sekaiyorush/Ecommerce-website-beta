# Round 1: Priority Audit Scope & Checklist

**Owner:** Sage/Clio (Planning)  
**Goal:** Define the exact verification steps for Checkout post-merge correctness, DatabaseContext RLS/query integrity, and highlight test coverage gaps across core e-commerce modules.

## 1. Checkout.tsx Post-Merge Functional Correctness
*Context: Checkout.tsx had merge conflicts and was refactored to use RPC calls and Zod validation.*

- [ ] **CH-01: Form Validation Logic**
  - Verify Zod schema strictly catches invalid emails, short phone numbers (min 7 digits), and missing required fields (Name, Address, City, Country).
  - Verify error messages display correctly under corresponding fields on the Shipping step.
- [ ] **CH-02: Client-Side Cart Validation (`useEffect`)**
  - Verify the component accurately detects price changes or stock unavailability by cross-referencing Supabase `products` table upon mount.
  - Ensure the `validationWarning` UI properly displays when discrepancies exist.
- [ ] **CH-03: RPC Order Placement (`handlePlaceOrder`)**
  - Confirm that clicking "Place Order" calls `createSecureOrder` correctly with mapped cart items and shipping data.
  - Verify that cart is cleared only upon successful RPC response (`success: true` and `order_id` present).
- [ ] **CH-04: Multi-Step Flow Navigation**
  - Ensure users can seamlessly move back and forth between Shipping (Step 1) and Payment (Step 2) without losing form state.
  - Verify users are locked into Confirmation (Step 3) upon success and cart is empty.
- [ ] **CH-05: Design Token Verification (Design Team Handoff)**
  - Ensure brand tokens (`#D4AF37` / `#AA771C` gold) and Slate theme colors are consistently applied without layout breaking from the merge.

## 2. DatabaseContext.tsx RLS & Query Integrity
*Context: Manages global optimistic state and interacts with Supabase backend.*

- [ ] **DB-01: Initial Load & Query Optimizations (`loadData`)**
  - Audit `Promise.all` query structure fetching products, profiles, orders, etc. 
  - *Risk:* Loading `orders` without RLS or limits could leak other users' PII if the RLS policy is misconfigured on the `orders` table. Check if RLS correctly scopes to `auth.uid() = customer_id` for regular users and `true` only for admins.
- [ ] **DB-02: RPC Integrations**
  - Audit `create_secure_order` integration. Ensure pricing source of truth relies exclusively on the server RPC and does not blindly trust client-side subtotal inputs.
  - Audit `delete_user` and `log_audit_event` integrations for correct parameter mapping.
- [ ] **DB-03: Secure Partner Registration (`addPartner`)**
  - Review the temporary client instantiation for partner creation. Confirm it does not inadvertently grant the new user admin privileges or leak the current admin session.
- [ ] **DB-04: Inventory Log Consistency (`addInventoryLog`)**
  - Verify race-condition handling when updating stock directly via `products` update followed by `inventory_log` insert. Consider if this logic should also be moved to an RPC transaction for atomicity.

## 3. Test Coverage Gaps vs. Core Platform Requirements
*Context: Currently, the repository contains only one test file (`src/test/LandingPage.test.tsx`). The core platform requires exhaustive testing.*

| Module / Core Requirement | Current Coverage | Missing Test Scenarios | Priority |
| :--- | :--- | :--- | :--- |
| **Product Catalog** | None | Component rendering (ProductCard, Products grid), category filtering, search functionality, out-of-stock UI states. | High |
| **Shopping Cart** | None | `CartContext` state management (add/remove/update quantity), subtotal/discount calculations, local storage persistence. | Critical |
| **Checkout Flow** | None | Form schema validation, RPC integration mocking (`createSecureOrder`), multi-step navigation, success/error state rendering. | Critical |
| **RBAC (AuthContext)** | None | Role derivation (`user`, `partner`, `admin`), protected route access (`<AdminRoute>`), partner discount application logic. | High |
| **DatabaseContext** | None | Optimistic UI updates, error handling on failed queries, data mapping from Supabase snake_case to camelCase. | Medium |

## Next Steps for Execution (Round 1)
1. **Developer:** Review and execute CH-01 through CH-04, and DB-01 through DB-04 using local Supabase instances or staging DB.
2. **Designer (Pixel):** Review CH-05 directly against `Checkout.tsx`.
3. **QA/Developer:** Scaffold missing test suites starting with Cart and Checkout (Critical priority) using Vitest/React Testing Library.