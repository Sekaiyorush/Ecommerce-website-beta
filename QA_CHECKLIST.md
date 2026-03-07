# QA Test Checklist: Core Flows (Round 1)

**Goal:** Validate the e-commerce platform against real user scenarios, specifically targeting live Supabase-backed routes before any further development work is scoped.

## 1. Product Catalog Browsing
- [ ] **TC-1.1:** Navigate to the main product catalog page (`/products`).
  - **Expected:** All active products from the Supabase `products` table are displayed correctly.
- [ ] **TC-1.2:** Verify product details on the catalog page.
  - **Expected:** Product name, price, image, and brief description match the database records.
- [ ] **TC-1.3:** Test mobile breakpoints for the product catalog.
  - **Expected:** Product grid adjusts smoothly to 1-column or 2-column layouts on mobile devices.
- [ ] **TC-1.4:** Click on a specific product to view details (`/product/:id`).
  - **Expected:** User is successfully routed to the product details page; all product-specific information is loaded from Supabase.
- [ ] **TC-1.5:** Test category filtering/search if applicable.
  - **Expected:** Filtering updates the product list correctly without page reload errors.

## 2. Cart Add/Remove for Partner Role
- [ ] **TC-2.1:** Log in with an account that has the `partner` role assigned in Supabase.
  - **Expected:** Login is successful and user role is accurately retrieved as `partner`.
- [ ] **TC-2.2:** Add a product to the cart from the catalog.
  - **Expected:** Product is added to the cart; any partner-specific pricing or logic is applied correctly.
- [ ] **TC-2.3:** Increment and decrement item quantities in the cart.
  - **Expected:** Cart total updates correctly; item is removed if quantity drops to 0.
- [ ] **TC-2.4:** Remove an item directly from the cart using the 'remove' or 'trash' button.
  - **Expected:** Item is instantly removed from the cart; total reflects the change.
- [ ] **TC-2.5:** Empty Cart State validation.
  - **Expected:** When the cart is empty, a clear visual feedback message (empty cart state) is displayed, with a CTA to return to the catalog.

## 3. Invitation-Code Registration
- [ ] **TC-3.1:** Navigate to the registration page (`/register` or similar).
  - **Expected:** Registration form is displayed, including the required field for an invitation code.
- [ ] **TC-3.2:** Attempt registration with an invalid or expired invitation code.
  - **Expected:** Supabase validation fails; user is shown a clear, descriptive error message.
- [ ] **TC-3.3:** Attempt registration with a valid, unused invitation code.
  - **Expected:** Account is successfully created in Supabase Auth and corresponding user profile tables.
- [ ] **TC-3.4:** Verify code consumption in the database.
  - **Expected:** The used invitation code is marked as `used` or deactivated in Supabase to prevent reuse.
- [ ] **TC-3.5:** Validate automated role assignment.
  - **Expected:** If the invitation code is tied to a specific role (e.g., `partner`), the newly created user is correctly assigned that role in the database.

## Notes & Findings
*(To be filled during execution)*
- **Empty Cart State:** (Design spec pending from Pixel, to be evaluated against current UI)
- **Error/404 Pages:** (Design spec pending from Pixel, verify default fallback behavior)
- **Mobile Breakpoints:** (Pending detailed design review, document functional usability on mobile viewports)
