# Master Test Strategy & Checklist

## 1. Overview
This document outlines the initial testing strategy and specific validation checklists for the e-commerce platform, focusing on validating core user flows (backed by Supabase) and addressing identified design gaps.

## 2. Core Flows to Validate (QA/QC Focus)

### 2.1 Product Catalog Browsing
- [ ] Verify all products load correctly from the live Supabase database.
- [ ] Verify product details (price, description, images, inventory status) display accurately.
- [ ] Test filtering and sorting functionality.
- [ ] Validate loading states and skeleton screens during data fetch.

### 2.2 Cart Operations (Partner Role)
- [ ] Verify partner users can successfully add items to the cart.
- [ ] Verify partner users can remove items or update quantities in the cart.
- [ ] Verify cart totals (including any partner-specific pricing/discounts) calculate correctly based on Supabase data.
- [ ] Verify cart state persists correctly across page navigations and reloads.

### 2.3 Invitation-Code Registration
- [ ] Verify the registration flow correctly validates invitation codes against the Supabase backend.
- [ ] Test successful registration with valid invitation codes.
- [ ] Test error handling and UI feedback for invalid, expired, or already used invitation codes.
- [ ] Verify newly registered users are assigned the correct roles and permissions in the database.

## 3. Design Gaps to Validate (Design Focus)

### 3.1 Empty Cart State
- [ ] Audit the current visual feedback when a user's cart is empty.
- [ ] Define and validate a missing design spec for the empty cart state (needs clear CTA to continue shopping).

### 3.2 Error / 404 Pages
- [ ] Audit the current 404 (Not Found) page experience.
- [ ] Audit application Error Boundaries (e.g., when Supabase fetch fails).
- [ ] Define and validate design specs for error states to ensure consistent branding and recovery paths.

### 3.3 Mobile Breakpoints (Product Catalog)
- [ ] Audit the product catalog layout on standard mobile viewports (e.g., 320px, 375px, 414px).
- [ ] Identify layout breaks, illegible text, or inappropriate touch target sizes on mobile.

## 4. Next Steps
1. **QA/QC (Tori):** Execute Section 2 against the live application and document functional findings.
2. **Design (Pixel):** Execute Section 3, document visual discrepancies, and provide missing design specifications.
3. **Engineering:** Await finalized test reports and design specs before scoping and implementing fixes.