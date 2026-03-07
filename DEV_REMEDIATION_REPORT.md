# Dev Remediation Report: Functional Components

## CRITICAL & HIGH (Fixed immediately per MVP policy)

### Cart & Checkout
- **Checkout doesn't validate stock before proceeding** (High): `src/pages/Checkout.tsx` - User completes all checkout steps only to see an error at the end, after cart is already cleared. (Fixed)
- **Cart item prices are stale** (High): `src/pages/Checkout.tsx` - If price changes in DB, checkout uses the old price. Not re-fetched before checkout. (Fixed)
- **Full loadData() reload after createSecureOrder()** (High): `src/context/DatabaseContext.tsx` - Causes race conditions and overwrites unsaved admin changes. (Fixed)
- **Checkout does not verify RPC re-fetches prices from DB** (Critical): `src/pages/Checkout.tsx` - Needs to ensure RPC fetches prices securely. (Requires SQL/backend update - reported to backend)
- **No payment processor integration** (Critical): `src/pages/Checkout.tsx` - Future sprint.

### Catalog
- **Partner discount not shown on variant selector prices** (High): `src/pages/ProductDetails.tsx` - Partner sees wrong prices in variant selector. (Fixed)
- **loadData() failure is silent / doesn't set user-visible error state** (High): `src/context/DatabaseContext.tsx` - Blank product list with no error message. (Fixed)
- **Inventory log persisted even when stock update fails** (High): `src/context/DatabaseContext.tsx` - State and DB diverge. (Fixed)

### Auth Flows
- **Email notifications not actually sent** (High): `src/context/DatabaseContext.tsx` - Future sprint.

## MEDIUM & LOW (Warning Report Only - No code changes)

### Cart & Checkout
- **Cart cleared before confirmation page renders** (Medium): `src/pages/Checkout.tsx`
- **"Add to Cart" not disabled for out-of-stock variants** (Medium): `src/components/ProductCard.tsx`
- **Cart persists across user sessions on shared devices** (Medium): `src/context/CartContext.tsx`
- **Cart discount not recalculated when user discount rate changes** (Medium): `src/context/CartContext.tsx`
- **Cart calculations not memoized** (Low): `src/context/CartContext.tsx`
- **localStorage cart writes not debounced** (Low): `src/context/CartContext.tsx`
- **Empty cart at checkout doesn't redirect automatically** (Low): `src/pages/Checkout.tsx`

### Catalog
- **All data fetched on every app mount including unauthenticated users** (Medium): `src/context/DatabaseContext.tsx`

### Auth Flows
- **Login failure shows browser alert() instead of toast** (Medium): `src/context/AuthContext.tsx`
- **Password mismatch only validated on submit, not real-time** (Low): `src/pages/Register.tsx`
- **Supabase auth state listener doesn't handle network failures** (Medium): `src/context/AuthContext.tsx`
