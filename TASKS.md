# 🎯 CLAW-EMPIRE TASK ASSIGNMENTS
# GoldenTier Website Fixes - Based on Audit Report

**Project:** GoldenTier Peptide Partners (Ecommerce-website-beta)  
**Audit Score:** 68/100 (Grade C+)  
**Total Issues:** 90 (7 Critical, 19 High, 42 Medium, 22 Low)  
**Date:** March 9, 2026

---

## 🚨 CRITICAL PRIORITY (Fix First - Blockers)

### Task C1: Fix Variant Stock Undefined Bug
**$ Directive for:** Bolt (Senior Dev) + Kitty (QA)
**Files:** `src/pages/ProductDetails.tsx:69-71`
**Severity:** Blocker

```
$ Create task for Bolt and Kitty:
Title: "Fix variantStock undefined crash in ProductDetails"
Priority: CRITICAL
Files: src/pages/ProductDetails.tsx

Issue: variantStock calculation can return undefined, causing NaN/crashes
Current: variantStock = selectedVariant?.stock ?? product.stockQuantity
Fix: variantStock = selectedVariant?.stock ?? product.stockQuantity ?? 0

Acceptance Criteria:
- [ ] Default stock to 0 when undefined
- [ ] Add TypeScript guard
- [ ] Test with products that have no stock data
- [ ] Verify no runtime crashes

Branch: fix/variant-stock-undefined
```

---

### Task C2: Disable "Add to Cart" for Out-of-Stock Items
**$ Directive for:** ARIA (Frontend) + Luna (UI)
**Files:** `src/pages/ProductDetails.tsx:99-113`
**Severity:** Blocker

```
$ Create task for ARIA and Luna:
Title: "Disable Add to Cart button when variant out of stock"
Priority: CRITICAL
Files: src/pages/ProductDetails.tsx

Issue: Users can add out-of-stock items to cart, causing checkout failures

Acceptance Criteria:
- [ ] Check variantInStock before allowing addToCart
- [ ] Disable button with visual "Out of Stock" state
- [ ] Show greyed-out styling on disabled button
- [ ] Display stock status label ("In Stock" / "Out of Stock")
- [ ] Test with both in-stock and out-of-stock variants

Design: Luna to provide disabled button styling (gold theme, not grey)
Branch: fix/disable-add-to-cart-oos
```

---

### Task C3: Cart Performance - Add useMemo
**$ Directive for:** RIVER (Integration) + Lint (Code Quality)
**Files:** `src/context/CartContext.tsx`
**Severity:** Blocker

```
$ Create task for RIVER and Lint:
Title: "Optimize cart calculations with useMemo"
Priority: CRITICAL
Files: src/context/CartContext.tsx

Issue: cartCount, cartSubtotal, discountAmount, cartTotal recalculate on every render

Acceptance Criteria:
- [ ] Wrap cartCount in useMemo
- [ ] Wrap cartSubtotal in useMemo  
- [ ] Wrap discountAmount in useMemo
- [ ] Wrap cartTotal in useMemo
- [ ] Add dependency arrays correctly
- [ ] Verify no re-render loops
- [ ] Performance test: should reduce renders significantly

Code Review: Lint to review for correct memoization patterns
Branch: perf/cart-usememo-optimization
```

---

### Task C4: Debounce Cart localStorage Saves
**$ Directive for:** Turbo (Operations) + Nova (Junior)
**Files:** `src/context/CartContext.tsx`
**Severity:** Blocker

```
$ Create task for Turbo and Nova:
Title: "Debounce cart localStorage writes (500ms)"
Priority: CRITICAL
Files: src/context/CartContext.tsx

Issue: Every cart change triggers immediate localStorage write (performance hit)

Acceptance Criteria:
- [ ] Implement 500ms debounce on saveCartToStorage
- [ ] Use lodash debounce or custom implementation
- [ ] Ensure final state is always saved (flush on unmount)
- [ ] Test rapid cart modifications
- [ ] Measure performance improvement

Guidance: Turbo to mentor Nova on debounce patterns
Branch: perf/debounce-cart-storage
```

---

### Task C5: Clear Cart on Logout
**$ Directive for:** Vault (Security) + RIVER (Integration)
**Files:** `src/context/AuthContext.tsx`, `src/context/CartContext.tsx`
**Severity:** Blocker

```
$ Create task for Vault and RIVER:
Title: "Clear cart when user logs out"
Priority: CRITICAL
Files: src/context/AuthContext.tsx, src/context/CartContext.tsx

Issue: Cart persists across user sessions (privacy leak on shared devices)

Acceptance Criteria:
- [ ] Watch for auth user becoming null
- [ ] Clear cart state on logout
- [ ] Clear localStorage cart on logout
- [ ] Namespace localStorage key by userId: goldentier_cart_${userId}
- [ ] Test: User A logs out, User B logs in, should see empty cart
- [ ] Security review by Vault

Security Note: This is a privacy vulnerability per Vault's assessment
Branch: fix/cart-clear-on-logout
```

---

## 🔴 HIGH PRIORITY (Fix This Week)

### Task H1: Fix Alert() in Auth - Use Toast
**$ Directive for:** Pixel (UX) + ECHO (Frontend)
**Files:** `src/context/AuthContext.tsx:94-100`
**Severity:** High

```
$ Create task for Pixel and ECHO:
Title: "Replace browser alert() with toast notifications in auth flow"
Priority: HIGH
Files: src/context/AuthContext.tsx

Issue: alert() breaks UX consistency with premium aesthetic

Acceptance Criteria:
- [ ] Replace all alert() calls with sonner toast.error()
- [ ] Return error info from login() instead of alerting
- [ ] Handle in UI components with toast notifications
- [ ] Maintain error messages for user feedback
- [ ] Test error scenarios (wrong password, rate limit)

UX Note: Pixel to specify toast styling (gold theme, consistent with brand)
Branch: fix/auth-toast-notifications
```

---

### Task H2: Validate Stock Before Checkout
**$ Directive for:** Bolt (Backend) + Kitty (QA)
**Files:** `src/pages/Checkout.tsx:67-106`
**Severity:** High

```
$ Create task for Bolt and Kitty:
Title: "Validate stock availability before checkout"
Priority: HIGH
Files: src/pages/Checkout.tsx

Issue: createSecureOrder() called without checking current stock

Acceptance Criteria:
- [ ] Call loadData() before displaying checkout
- [ ] Validate stock for all cart items
- [ ] Show warning if items went out of stock
- [ ] Prevent checkout if items unavailable
- [ ] Offer to remove unavailable items from cart
- [ ] Test race condition: item goes OOS while in cart

Testing: Kitty to test edge cases and race conditions
Branch: fix/checkout-stock-validation
```

---

### Task H3: Fix Partner Discount Display
**$ Directive for:** Luna (UI) + ARIA (Frontend)
**Files:** `src/pages/ProductDetails.tsx:73-92`
**Severity:** High

```
$ Create task for Luna and ARIA:
Title: "Show partner discount in variant selector"
Priority: HIGH
Files: src/pages/ProductDetails.tsx, src/components/ProductCard.tsx

Issue: Partner sees wrong prices in variant selector vs checkout

Acceptance Criteria:
- [ ] Show discounted price in variant chip labels
- [ ] Add "Your Price: ฿X,XXX" label for partners
- [ ] Show original price struck through
- [ ] Apply to ProductCard tiles too
- [ ] Verify math matches checkout total

Design: Luna to design partner pricing display (premium feel)
Branch: fix/partner-discount-display
```

---

### Task H4: Remove Optimistic Update on addProduct
**$ Directive for:** Clio (Architecture) + Lint (Code Quality)
**Files:** `src/context/DatabaseContext.tsx:367-388`
**Severity:** High

```
$ Create task for Clio and Lint:
Title: "Remove optimistic update in addProduct - wait for DB confirmation"
Priority: HIGH
Files: src/context/DatabaseContext.tsx

Issue: Product appears in UI before DB confirms; if insert fails, state/DB diverge

Acceptance Criteria:
- [ ] Remove immediate state update in addProduct
- [ ] Wait for Supabase insert to succeed
- [ ] Only update state after confirmation
- [ ] OR call loadData() to re-fetch after insert
- [ ] Handle error case properly
- [ ] Ensure no duplicate products on retry

Architecture Note: Clio to decide best pattern (confirmation vs re-fetch)
Branch: fix/remove-optimistic-addproduct
```

---

### Task H5: Fix loadData() Race Condition
**$ Directive for:** Clio (Architecture) + Bolt (Dev)
**Files:** `src/context/DatabaseContext.tsx:507-528`
**Severity:** High

```
$ Create task for Clio and Bolt:
Title: "Fix race condition in loadData() after order creation"
Priority: HIGH
Files: src/context/DatabaseContext.tsx

Issue: Full reload after createSecureOrder() overwrites concurrent admin edits

Acceptance Criteria:
- [ ] Only fetch and update the new order in state
- [ ] Don't perform full loadData() reload
- [ ] Merge new data instead of replacing all state
- [ ] Preserve unsaved admin changes
- [ ] Test concurrent admin + customer actions

Architecture: This is a data consistency issue - needs careful fix
Branch: fix/order-race-condition
```

---

### Task H6: Add Loading Spinner to Place Order
**$ Directive for:** Luna (Animations) + ECHO (Frontend)
**Files:** `src/pages/Checkout.tsx:328-332`
**Severity:** Medium

```
$ Create task for Luna and ECHO:
Title: "Add loading spinner to Place Order button"
Priority: HIGH
Files: src/pages/Checkout.tsx

Issue: No visual feedback during order submission (users may double-click)

Acceptance Criteria:
- [ ] Add spinner icon inside button during isSubmitting
- [ ] Disable button while submitting
- [ ] Use consistent loading animation (gold theme)
- [ ] Maintain button width to prevent layout shift
- [ ] Test slow network conditions

Animation: Luna to provide spinner component/design
Branch: feat/checkout-loading-spinner
```

---

## 🟡 MEDIUM PRIORITY (Fix Next Sprint)

### Task M1: Add Zod Validation to Forms
**$ Directive for:** Spiki (Dev Lead) + Nova (Junior)
**Files:** `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/Checkout.tsx`
**Severity:** Medium

```
$ Create task for Spiki and Nova:
Title: "Add Zod schema validation to all public forms"
Priority: MEDIUM
Files: src/pages/Login.tsx, Register.tsx, Checkout.tsx

Issue: Forms lack client-side validation; XSS vectors

Acceptance Criteria:
- [ ] Login.tsx: email format, password min length
- [ ] Register.tsx: invitation code format /^[A-Z0-9]{6,}$/
- [ ] Checkout.tsx: phone regex, zip regex, address max length
- [ ] Contact.tsx: prevent stored XSS
- [ ] Show validation errors inline
- [ ] Prevent form submission if invalid

Mentoring: Spiki to guide Nova on Zod + react-hook-form patterns
Branch: feat/form-zod-validation
```

---

### Task M2: Debounce Search Input
**$ Directive for:** Turbo (Operations) + ARIA (Frontend)
**Files:** `src/pages/Products.tsx`
**Severity:** Blocker (per audit)

```
$ Create task for Turbo and ARIA:
Title: "Debounce product search input (500ms)"
Priority: MEDIUM
Files: src/pages/Products.tsx

Issue: Search triggers on every keystroke (performance hit)

Acceptance Criteria:
- [ ] Implement 500ms debounce on search input
- [ ] Use lodash debounce or custom hook
- [ ] Show loading state while searching
- [ ] Cancel pending searches on new input
- [ ] Test rapid typing

Performance: Turbo to measure before/after
Branch: perf/debounce-search
```

---

### Task M3: useMemo for Filtered Products
**$ Directive for:** RIVER (Integration) + Lint (Code Quality)
**Files:** `src/pages/Products.tsx`
**Severity:** Blocker (per audit)

```
$ Create task for RIVER and Lint:
Title: "Optimize product filtering with useMemo"
Priority: MEDIUM
Files: src/pages/Products.tsx

Issue: Filtered products array recalculates on every render

Acceptance Criteria:
- [ ] Wrap filtered products in useMemo
- [ ] Proper dependency array (search, filters, sort)
- [ ] Verify no unnecessary re-renders
- [ ] Performance test with large product catalog

Code Quality: Lint to review dependency arrays
Branch: perf/product-filter-memo
```

---

### Task M4: Cart Sidebar Auto-Close on Navigation
**$ Directive for:** ECHO (Frontend)
**Files:** `src/components/CartSidebar.tsx`
**Severity:** Low

```
$ Create task for ECHO:
Title: "Auto-close cart sidebar on route change"
Priority: MEDIUM
Files: src/components/CartSidebar.tsx

Issue: Cart stays open when navigating to new page

Acceptance Criteria:
- [ ] Add useEffect with useLocation
- [ ] Close sidebar on route change
- [ ] Maintain open/close state within same page
- [ ] Test mobile experience

Solo task for ECHO (good junior-level task)
Branch: fix/cart-sidebar-route-close
```

---

### Task M5: Fix Image Loading Errors
**$ Directive for:** Nova (Junior) + Pixel (UX)
**Files:** `src/components/ProductCard.tsx:70-85`
**Severity:** Low

```
$ Create task for Nova and Pixel:
Title: "Add error handling for failed product images"
Priority: MEDIUM
Files: src/components/ProductCard.tsx

Issue: Broken images show fallback letter without admin notification

Acceptance Criteria:
- [ ] Add onError handler to img tags
- [ ] Show visual indicator for broken images
- [ ] Log broken image URLs (console or analytics)
- [ ] Graceful fallback with placeholder
- [ ] Optional: Admin notification for repeated failures

UX: Pixel to design broken image placeholder (on-brand)
Guidance: Good learning task for Nova
Branch: fix/product-image-error-handling
```

---

### Task M6: Fix Price Formatting Edge Cases
**$ Directive for:** Lint (Code Quality)
**Files:** `src/lib/formatPrice.ts:6-11`
**Severity:** Low

```
$ Create task for Lint:
Title: "Guard against NaN/Infinity in formatPrice"
Priority: MEDIUM
Files: src/lib/formatPrice.ts

Issue: formatTHB returns "฿NaN THB" or "฿Infinity THB" for bad inputs

Acceptance Criteria:
- [ ] Guard against undefined input → return "฿0.00 THB"
- [ ] Guard against NaN → return "฿0.00 THB"
- [ ] Guard against Infinity → return "฿0.00 THB"
- [ ] Guard against negative → return "฿0.00 THB" or absolute value
- [ ] Add unit tests for edge cases

Solo task for Lint (code quality focus)
Branch: fix/price-format-guards
```

---

## 🎨 UI/UX IMPROVEMENTS (Nice to Have)

### Task U1: Real-Time Password Validation
**$ Directive for:** Luna (UI) + ECHO (Frontend)
**Files:** `src/pages/Register.tsx:75-80`
**Severity:** Low

```
$ Create task for Luna and ECHO:
Title: "Add real-time password match validation"
Priority: LOW
Files: src/pages/Register.tsx

Issue: Password mismatch only checked on submit

Acceptance Criteria:
- [ ] Validate password match as user types
- [ ] Show "Passwords match" / "Passwords don't match" indicator
- [ ] Use green check / red X with animation
- [ ] Disable submit until passwords match
- [ ] Accessible error messaging

Design: Luna to design match indicator (subtle, elegant)
Branch: feat/realtime-password-validation
```

---

### Task U2: Add Lazy Loading to Product Images
**$ Directive for:** RIVER (Integration)
**Files:** `src/components/ProductCard.tsx`
**Severity:** Medium

```
$ Create task for RIVER:
Title: "Add lazy loading to product images"
Priority: LOW
Files: src/components/ProductCard.tsx

Issue: All images load immediately (slow initial page load)

Acceptance Criteria:
- [ ] Add loading="lazy" to all product <img> tags
- [ ] Verify browser support (native lazy loading)
- [ ] Test with large product catalogs
- [ ] Measure initial page load improvement

Solo task for RIVER (performance optimization)
Branch: perf/lazy-load-images
```

---

## 📝 HOW TO ASSIGN THESE TASKS

### In Claw-Empire UI:
1. Go to Kanban board
2. Create new task with title and description
3. Assign to primary agent (first name listed)
4. Add secondary agent as collaborator
5. Set priority and branch name

### Example CEO Directive:
```
$ Create task for Bolt and Kitty:
Title: "Fix variantStock undefined crash"
Priority: CRITICAL
Branch: fix/variant-stock-undefined
Acceptance: [list criteria]
```

---

## 🎯 SUGGESTED SPRINT 1 (This Week)

**Critical Blockers (Must Fix):**
- C1: Fix variantStock undefined (Bolt + Kitty)
- C2: Disable Add to Cart OOS (ARIA + Luna)
- C3: Cart useMemo optimization (RIVER + Lint)
- C4: Debounce cart storage (Turbo + Nova)
- C5: Clear cart on logout (Vault + RIVER)

**High Priority:**
- H1: Replace alert() with toast (Pixel + ECHO)
- H2: Validate stock before checkout (Bolt + Kitty)
- H3: Fix partner discount display (Luna + ARIA)
- H6: Add checkout loading spinner (Luna + ECHO)

**Total: 9 tasks for Sprint 1**

---

## 📊 EXPECTED IMPROVEMENTS

After completing these tasks:

| Metric | Before | After |
|--------|--------|-------|
| Critical Bugs | 7 | 0 |
| Performance | 58/100 | 75/100 |
| UX Score | 88/100 | 92/100 |
| Overall Score | 68/100 | 80/100 |

---

*Ready to assign these tasks to your agents!* 🦋🚀
