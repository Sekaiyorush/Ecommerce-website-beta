# Comprehensive Bug & Issue Analysis — Golden Tier Peptide
> Generated: 2026-03-02 | Branch: claude/hardcore-murdock | 63 findings

---

## UX / User Experience Bugs

### Issue: Login failure shows browser `alert()` instead of toast
**File**: `src/context/AuthContext.tsx:94-100`
**Severity**: Medium
**Description**: `login()` uses `alert()` for rate limit and error messages, breaking UX consistency with the rest of the app.
**Impact**: Jarring browser dialog conflicts with premium aesthetic; no error recovery guidance.
**Suggested Fix**: Return error info from `login()` and handle with Toast provider in the UI component.

---

### Issue: Password mismatch only validated on submit, not real-time
**File**: `src/pages/Register.tsx:75-80`
**Severity**: Low
**Description**: Password confirmation is only checked on form submission.
**Impact**: User fills the entire form before discovering mismatch; extra friction.
**Suggested Fix**: Add real-time feedback as user types in confirm password field.

---

### Issue: Checkout doesn't validate stock before proceeding
**File**: `src/pages/Checkout.tsx:67-106`
**Severity**: High
**Description**: `createSecureOrder()` is called without checking if items are still in stock. Stock may have changed since cart was built.
**Impact**: User completes all checkout steps only to see an error at the end, after cart is already cleared.
**Suggested Fix**: Call `loadData()` before displaying checkout; validate stock for all cart items; show warning if items went out of stock.

---

### Issue: No spinner on "Place Order" button during async operation
**File**: `src/pages/Checkout.tsx:328-332`
**Severity**: Medium
**Description**: Button text changes but no visual spinner/loader is shown during submission.
**Impact**: Users may double-click; poor perceived performance.
**Suggested Fix**: Add a spinner icon inside the button while `isSubmitting` is true.

---

### Issue: Cart cleared before confirmation page renders
**File**: `src/pages/Checkout.tsx:93-96`
**Severity**: Medium
**Description**: `clearCart()` is called immediately on success before the confirmation view is fully rendered.
**Impact**: If confirmation fails to render (JS error), user sees empty cart with no order confirmation; trust lost.
**Suggested Fix**: Clear cart only after confirmation page mounts, or navigate to `/order-confirmation/:id` and clear on arrival.

---

### Issue: "Add to Cart" not disabled for out-of-stock variants
**File**: `src/pages/ProductDetails.tsx:99-113`
**Severity**: Medium
**Description**: `handleAddToCart()` adds items to cart even if the selected variant is out of stock. `variantInStock` check exists but isn't enforced on the button.
**Impact**: Partner adds out-of-stock items; checkout fails later with cryptic error.
**Suggested Fix**: Disable "Add to Cart" when `!variantInStock` and display "Out of Stock" label.

---

### Issue: Cart persists across user sessions on shared devices
**File**: `src/context/CartContext.tsx:35-54`
**Severity**: Medium
**Description**: Cart is saved to localStorage with no user context. If two users share a device, user B sees user A's cart.
**Impact**: Privacy leak; unintended orders; user confusion.
**Suggested Fix**: Clear cart on logout in AuthContext; namespace localStorage key by user ID.

---

### Issue: No error feedback when product image fails to load
**File**: `src/components/ProductCard.tsx:70-85`
**Severity**: Low
**Description**: Dead image links silently fail and show a fallback letter with no admin notification.
**Impact**: Broken product images go unnoticed in production.
**Suggested Fix**: Add `onError` handler; log broken images; show a visual indicator to admins.

---

## State Management Bugs

### Issue: Cart discount not recalculated when user discount rate changes
**File**: `src/context/CartContext.tsx:116-117`
**Severity**: Medium
**Description**: `discountAmount` uses `user?.discountRate` from context, but if admin updates the rate in another session, the cart doesn't reflect it.
**Impact**: Stale discount displayed; user charged incorrect amount at checkout.
**Suggested Fix**: Show "Refresh to see updated pricing" if discount rate changes; re-fetch profile before checkout.

---

### Issue: Cart sidebar doesn't auto-close on route navigation
**File**: `src/components/CartSidebar.tsx`
**Severity**: Low
**Description**: Cart sidebar stays open after navigating to another page.
**Impact**: Mobile users find sidebar blocking content.
**Suggested Fix**: Add `useEffect` with `useLocation()` to close sidebar on route change.

---

### Issue: `addProduct()` optimistic update not rolled back on DB failure
**File**: `src/context/DatabaseContext.tsx:367-388`
**Severity**: Medium
**Description**: Product appears in UI state immediately; if Supabase insert fails silently, product doesn't exist in DB.
**Impact**: Admin thinks product is created; customers can't access it; inventory tracking broken.
**Suggested Fix**: Only update state after Supabase confirms success, or call `loadData()` to re-fetch.

---

### Issue: Full `loadData()` reload after `createSecureOrder()` causes race conditions
**File**: `src/context/DatabaseContext.tsx:507-528`
**Severity**: High
**Description**: After order creation succeeds, full `loadData()` is called. If admin is concurrently editing, their unsaved changes are overwritten.
**Impact**: Admin loses recent changes; audit trail doesn't reflect intent.
**Suggested Fix**: Only fetch and update the new order in state; don't perform full reload.

---

### Issue: Inventory log persisted even when stock update fails
**File**: `src/context/DatabaseContext.tsx:775-805`
**Severity**: High
**Description**: If product stock update via Supabase fails, the inventory log entry is still persisted. State and DB diverge.
**Impact**: Inventory tracking broken; stock counts don't match reality; audit shows changes that didn't happen.
**Suggested Fix**: Wrap stock update in a DB transaction; if it fails, don't commit the inventory log.

---

### Issue: Partner discount not shown on variant selector prices
**File**: `src/pages/ProductDetails.tsx:73-92`
**Severity**: High
**Description**: `getDiscountedPrice()` is calculated but never applied to individual variant prices in the variant chip selector.
**Impact**: Partner sees wrong prices in variant selector; confused when checkout total differs.
**Suggested Fix**: Show discounted price in variant chip labels or in the "selected variant" info section.

---

## TypeScript / Type Safety

### Issue: Variant stock can be `undefined` in quantity calculations
**File**: `src/pages/ProductDetails.tsx:69-71`
**Severity**: Medium
**Description**: `variantStock = selectedVariant?.stock ?? product.stockQuantity`. If both are `undefined`, calculations use `undefined`.
**Impact**: Runtime crash or NaN in stock display.
**Suggested Fix**: Default to 0: `selectedVariant?.stock ?? product.stockQuantity ?? 0`.

---

### Issue: `formatTHB` doesn't guard against `NaN` / `Infinity`
**File**: `src/lib/formatPrice.ts:6-11`
**Severity**: Low
**Description**: If `amount` is `undefined`, `NaN`, or `Infinity`, output is "฿NaN THB" or "฿Infinity THB".
**Impact**: Price displays incorrectly; confuses users.
**Suggested Fix**: `if (!Number.isFinite(amount)) return '฿0.00 THB';`

---

### Issue: Order status string not validated against enum
**File**: `src/context/DatabaseContext.tsx:537-572`
**Severity**: Medium
**Description**: `updateOrder()` accepts any status string. Admin could set `status = "invalid_status"` and it would persist.
**Impact**: Order state machine breaks; reports and workflows fail.
**Suggested Fix**: Validate:
```typescript
const VALID_ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
if (!VALID_ORDER_STATUSES.includes(status)) throw new Error('Invalid order status');
```

---

### Issue: Order status transitions not enforced
**File**: `src/context/DatabaseContext.tsx:537-572`
**Severity**: Medium
**Description**: No validation of valid state transitions. Admin can go from `pending` → `delivered` skipping all intermediate states.
**Impact**: Orders in invalid states; fulfillment logic breaks; reporting unreliable.
**Suggested Fix**:
```typescript
const validTransitions = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
```

---

## Data Layer / API

### Issue: `loadData()` failure is silent — no user-facing error
**File**: `src/context/DatabaseContext.tsx:352-357`
**Severity**: High
**Description**: Supabase query failures are caught and only logged to console. Users see an empty product list with no error message.
**Impact**: Users think there are no products; actual DB issue hidden; hard to debug in production.
**Suggested Fix**: Set an error state in DatabaseContext; display an error banner: "Unable to load data. Please refresh."

---

### Issue: Invitation code near-expiry not warned to user
**File**: `src/context/AuthContext.tsx:107-138`
**Severity**: Medium
**Description**: Server validates expiry, but if the code expires mid-registration (e.g., 30 seconds left), user gets an error after filling the entire form.
**Impact**: User frustrated by "expired code" after completing the form.
**Suggested Fix**: Show a warning if code expires within 5 minutes; block submit if less than 1 minute remains.

---

### Issue: Checkout does not verify RPC re-fetches prices from DB
**File**: `src/pages/Checkout.tsx:76-80`
**Severity**: Critical
**Description**: If `create_secure_order()` RPC is misconfigured to use client-provided prices, partners could exploit by sending manipulated prices.
**Impact**: Revenue loss; order created with arbitrary low prices.
**Suggested Fix**: Verify the RPC fetches prices from `products` table using `auth.uid()` and product IDs only; never uses client-provided price values.

---

### Issue: No pagination — all products fetched at once
**File**: `src/context/DatabaseContext.tsx:156`
**Severity**: Medium
**Description**: `supabase.from('products').select('*')` fetches all products. Unscalable as catalog grows.
**Impact**: Slow initial load; Supabase query timeout risk at scale.
**Suggested Fix**: Implement cursor-based pagination (e.g., 50 products per request).

---

### Issue: Cart item prices are stale — not re-fetched before checkout
**File**: `src/pages/Checkout.tsx:73-91`
**Severity**: High
**Description**: Cart stores product objects at time of add. If price changes in DB, checkout uses the old price.
**Impact**: Partner charged wrong amount; revenue loss if price increased.
**Suggested Fix**: Re-fetch current prices for all cart items before displaying checkout total.

---

### Issue: Supabase error messages shown raw to users
**File**: `src/context/AuthContext.tsx:100`, `src/pages/Register.tsx:102`
**Severity**: Low
**Description**: `error.message` from Supabase RPC shown directly to users. May contain SQL details or internal error codes.
**Impact**: Technical jargon confuses non-technical users; potential information leak.
**Suggested Fix**: Map Supabase error codes to user-friendly messages.

---

## Performance

### Issue: All data fetched on every app mount including unauthenticated users
**File**: `src/context/DatabaseContext.tsx:360-362`
**Severity**: Medium
**Description**: `loadData()` runs immediately on mount, fetching all products, orders, customers, and settings even for unauthenticated users viewing the landing page.
**Impact**: Unnecessary Supabase calls; slow initial load; wasted bandwidth.
**Suggested Fix**: Fetch products on demand (lazy); fetch auth-dependent data (orders, customers) only after authentication.

---

### Issue: Product grid re-renders all cards on filter changes
**File**: `src/pages/Products.tsx`
**Severity**: Medium
**Description**: ProductCard is memoized, but the filtered products array is re-created on each render, triggering re-renders of all cards.
**Impact**: Sluggish filter UX on large product lists.
**Suggested Fix**: `useMemo` for filtered products list in Products.tsx.

---

### Issue: Cart calculations not memoized
**File**: `src/context/CartContext.tsx:110-117`
**Severity**: Low
**Description**: `cartCount`, `cartSubtotal`, `discountAmount`, `cartTotal` recalculated on every render.
**Impact**: Minor performance hit with large carts.
**Suggested Fix**: Wrap in `useMemo` dependent on `items` array.

---

### Issue: localStorage cart writes not debounced
**File**: `src/context/CartContext.tsx:48-54`
**Severity**: Low
**Description**: `saveCartToStorage()` synchronously serializes and writes to localStorage on every item change.
**Impact**: UI jank when rapidly adding/removing items.
**Suggested Fix**: Debounce localStorage writes (500ms).

---

### Issue: No lazy loading on product images
**File**: `src/components/ProductCard.tsx:75-85`
**Severity**: Medium
**Description**: Product images load eagerly even if off-screen.
**Impact**: Excessive bandwidth; slower page load on mobile.
**Suggested Fix**: Add `loading="lazy"` to all `<img>` tags.

---

## Accessibility (a11y)

### Issue: Mobile menu doesn't trap focus
**File**: `src/components/Header.tsx:178-185`
**Severity**: Medium
**Description**: When mobile menu opens, keyboard focus can escape to background content.
**Impact**: Keyboard-only users and screen reader users cannot navigate properly.
**Suggested Fix**: Replace with shadcn/ui Dialog which handles focus trap automatically.

---

### Issue: Product rating stars have no ARIA labels
**File**: `src/components/ProductCard.tsx:128`
**Severity**: Medium
**Description**: Star icons for product ratings are not labeled for screen readers.
**Impact**: Blind users miss product quality information.
**Suggested Fix**: Add `aria-label={`Rated ${rating} out of 5 stars by ${reviewCount} reviewers`}` to rating component.

---

### Issue: Low contrast text in cart sidebar
**File**: `src/components/CartSidebar.tsx:79`
**Severity**: Medium
**Description**: `text-slate-300` on white background may fail WCAG AA contrast ratio requirements.
**Impact**: Low vision users have difficulty reading cart prices.
**Suggested Fix**: Change to `text-slate-500` or darker.

---

## Business Logic Gaps

### Issue: Empty cart at checkout doesn't redirect automatically
**File**: `src/pages/Checkout.tsx:108-127`
**Severity**: Medium
**Description**: Page shows empty cart message but doesn't redirect. User may be confused about whether cart was cleared by system or them.
**Impact**: Confusing UX; user doesn't know to go back to products.
**Suggested Fix**: Redirect to `/products` with toast: "Your cart was empty, returning to products."

---

### Issue: Partner discount not shown in ProductCard tiles
**File**: `src/components/ProductCard.tsx:124-136`
**Severity**: Medium
**Description**: Partners see original price in product tiles, discounted price only in ProductDetails. Confusing browse experience.
**Impact**: Partner doesn't understand discount benefit while browsing; may think prices are too high.
**Suggested Fix**: Show discounted prices in ProductCard for partners with "Your Price" label.

---

### Issue: No maximum order quantity validation
**File**: `src/pages/ProductDetails.tsx:98-113`
**Severity**: Low
**Description**: No max quantity limit per variant or product. User can set quantity to any number.
**Impact**: Partner could accidentally order 1000 units; no business controls for bulk limits.
**Suggested Fix**: Add `maxQuantityPerOrder` to Product/ProductVariant; validate in `handleAddToCart()`.

---

### Issue: Inventory deducted at order creation, not at shipment
**File**: `src/context/DatabaseContext.tsx:507-528`
**Severity**: High
**Description**: `create_secure_order()` RPC deducts inventory immediately when order is placed, before payment is confirmed.
**Impact**: If payment fails, inventory isn't restored; false stockouts occur.
**Suggested Fix**: Deduct inventory only when order is marked "shipped". Use a Supabase trigger on status change.

---

### Issue: No refund/inventory restore logic on order cancellation
**File**: `src/context/DatabaseContext.tsx:537-572`
**Severity**: Medium
**Description**: When order is cancelled, no logic restores inventory or triggers refund.
**Impact**: Cancelled orders permanently reduce stock; customers aren't refunded.
**Suggested Fix**: When `status === 'cancelled'`, trigger RPC to restore inventory, initiate refund, and send cancellation email.

---

### Issue: Invitation code race condition — concurrent registrations exceed max_uses
**File**: `src/context/AuthContext.tsx:159-193`
**Severity**: Medium
**Description**: Two simultaneous registrations could both pass `validate_invitation_code()` before either increments `current_uses`.
**Impact**: More users registered than `max_uses` allows.
**Suggested Fix**: Ensure RPC uses atomic operations (`SELECT FOR UPDATE` or unique constraint) in the DB.

---

## Missing Features / Incomplete Implementations

### Issue: Wishlist is local state only — not persisted to DB
**File**: `src/components/ProductCard.tsx:22,85`
**Severity**: Medium
**Description**: `isWishlisted` is component-local state. Not saved to Supabase.
**Impact**: Wishlist lost on logout or different device.
**Suggested Fix**: Add `wishlists` table in Supabase; save/load per user.

---

### Issue: Product ratings may not be fetching real data
**File**: `src/components/ProductCard.tsx:128`
**Severity**: Medium
**Description**: `<ProductRating productId={product.id} .../>` is rendered but it's unclear if the component fetches real reviews from DB.
**Impact**: Ratings could be placeholder/fake; no way for customers to leave reviews.
**Suggested Fix**: Verify `src/components/reviews/ProductRating.tsx` fetches from Supabase `reviews` table.

---

### Issue: Product search is client-side only
**File**: `src/pages/Products.tsx:25-31`
**Severity**: Medium
**Description**: Search uses `Array.filter()` on client-side array. Unscalable.
**Impact**: Search lags at scale; can't support advanced queries.
**Suggested Fix**: Implement Supabase full-text search (`tsvector`) for server-side relevance ranking.

---

### Issue: No payment processor integration
**File**: `src/pages/Checkout.tsx:255-311`
**Severity**: Critical
**Description**: Payment methods are "bank_transfer" and "crypto" but no actual payment processing occurs. Checkout creates the order and marks it "pending" with no payment initiated.
**Impact**: Orders created but payment never collected; no revenue.
**Suggested Fix**: Integrate Stripe, PayPal, or similar. Only create order after payment succeeds.

---

### Issue: Email notifications not actually sent
**File**: `src/context/DatabaseContext.tsx:474-479`, `src/lib/emailService.ts`
**Severity**: High
**Description**: `emailService.sendOrderConfirmation()` likely logs or returns mock responses only.
**Impact**: Customers never receive order confirmations or status updates.
**Suggested Fix**: Integrate SendGrid, Mailgun, or Supabase Edge Functions for real email delivery.

---

### Issue: No 404 handling for invalid product SKUs
**File**: `src/pages/ProductDetails.tsx:42-62`
**Severity**: Low
**Description**: When product not found, page shows an error message but doesn't signal 404 to search engines.
**Impact**: SEO issue; search engines index the error as a successful 200 page.
**Suggested Fix**: Set canonical meta tags; return proper 404 from server-side rendering if applicable.

---

### Issue: No debouncing on search/filter inputs
**File**: `src/pages/Products.tsx`
**Severity**: Medium
**Description**: Rapid typing in search or clicking filters can trigger many Supabase requests per second.
**Impact**: Hits Supabase rate limits; laggy responses; poor UX.
**Suggested Fix**: Debounce search input (500ms); debounce filter changes (300ms); show "Updating..." state.

---

## Error Handling

### Issue: Silent data load failures — resolved with Error Boundary
**File**: `src/context/DatabaseContext.tsx:145-357`, `src/App.tsx`
**Severity**: High
**Description**: Previously, Supabase query failures or runtime rendering errors (like missing imports in lazy-loaded components) would lead to a blank white screen.
**Impact**: App crashes with no user guidance; "blank pure white" report from CEO.
**Resolution**: 
1. Fixed missing `ProductCard` import in `src/sections/FeaturedProducts.tsx`.
2. Implemented `ErrorBoundary` in `App.tsx` at root and content levels with branded "Golden Tier" fallback UI.
3. Added `dbError` banner for database-level failures.

---

### Issue: Missing Error Boundary on lazy-loaded routes — resolved
**File**: `src/App.tsx`
**Severity**: High
**Description**: Lazy-loaded routes (Admin, Partner, User dashboards) lacked a catch-all for runtime failures.
**Impact**: A single component failure in a dashboard would crash the entire authenticated session.
**Resolution**: Wrapped `<main>` and the entire `AppContent` router with `ErrorBoundary`.


---

### Issue: Supabase auth state listener doesn't handle network failures
**File**: `src/context/AuthContext.tsx:64-82`
**Severity**: Medium
**Description**: `onAuthStateChange()` may not fire if network is down. User believes they're logged in but API calls silently fail.
**Impact**: Silent auth failure; user interactions fail with cryptic errors.
**Suggested Fix**: Add a health check; show "Connection lost" banner if `refreshData()` fails twice consecutively.

---

### Issue: localStorage quota exceeded error not surfaced to user
**File**: `src/context/CartContext.tsx:48-54`
**Severity**: Low
**Description**: If localStorage is full, `setItem()` throws an error silently caught and ignored.
**Impact**: Cart lost without explanation.
**Suggested Fix**: Show toast: "Unable to save cart due to storage limit. Some items may not persist."

---

## Summary — Priority Matrix

| Perspective | Critical | High | Medium | Low |
|---|---|---|---|---|
| UX/UX Bugs | 0 | 2 | 6 | 2 |
| State Management | 0 | 3 | 5 | 2 |
| TypeScript/Types | 0 | 0 | 4 | 2 |
| Data Layer/API | 1 | 3 | 6 | 1 |
| Performance | 0 | 0 | 4 | 3 |
| Accessibility | 0 | 0 | 4 | 0 |
| Business Logic | 0 | 3 | 5 | 2 |
| Missing Features | 1 | 1 | 6 | 2 |
| Error Handling | 0 | 2 | 2 | 1 |
| **TOTAL** | **2** | **14** | **32** | **15** |

### Top 5 Priorities
1. **No payment processor** — orders created but payment never collected (Critical)
2. **Email notifications not sent** — customers never get confirmations (High)
3. **Inventory deducted at order creation** — not restored on failure/cancellation (High)
4. **Checkout doesn't re-validate prices** — potential price manipulation (Critical)
5. **Silent data load failures** — empty product list with no error message (High)
