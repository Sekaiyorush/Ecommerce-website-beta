# UI/UX Reimplementation Strategy & Specification (Pro Max)

## 1. Vision & Design Philosophy
The "Golden Tier Peptide" platform should embody **Modern Luxury** and **Scientific Precision**. The goal is to move beyond a standard e-commerce site into a high-end, high-trust boutique experience.

### Core Pillars
- **Elegance:** Minimalist layouts with generous whitespace and refined typography.
- **Trust:** Clear scientific evidence (Research page), verified reviews, and secure checkout indicators.
- **Engagement:** Micro-interactions and smooth transitions (Framer Motion) that provide a "tactile" digital feel.
- **Accessibility:** WCAG 2.1 AA compliance as a baseline, ensuring inclusivity for all users.

---

## 2. Design System & Tokens (Enhanced)

### Typography
- **Primary Serif:** `Playfair Display` — For headings, hero sections, and product names. Represents tradition and luxury.
- **Primary Sans:** `Inter` — For body text, UI labels, and data. Represents modern efficiency and clarity.
- **Scale:**
  - `Display 1`: 64px / 1.1 leading (Hero)
  - `Heading 1`: 48px / 1.2 leading (Page Titles)
  - `Heading 2`: 32px / 1.3 leading (Section Headers)
  - `Body Large`: 18px / 1.6 leading
  - `Body Regular`: 16px / 1.6 leading
  - `UI Label`: 12px / 1.2 leading (Uppercase, tracking 0.2em)

### Color Palette (Gold Standard)
- **Primary Gold:** `#D4AF37` (Base Metallic)
- **Accent Gold:** `#AA771C` (Deep Metallic for contrast)
- **Neutral Light:** `#FFFFFF` (Background), `#F8FAF8` (Surface)
- **Neutral Dark:** `#111111` (Deep Black for primary actions), `#334155` (Slate for secondary text)
- **Success:** `#10B981` (Emerald)
- **Warning:** `#F59E0B` (Amber)
- **Error:** `#F43F5E` (Rose)

---

## 3. Component Reimplementation Roadmap

### Phase 1: Global Elements (High Impact)
- [ ] **Navigation (Header):** 
  - Implementation of a "Glassmorphism" effect on scroll.
  - Interactive Mega-menu for product categories.
  - Refined search experience with instant results (Search Hub).
- [ ] **Footer:**
  - Tiered information architecture (Shop, Company, Support, Legal).
  - Social proof integration (Instagram feed or trust badges).

### Phase 2: Product Discovery
- [ ] **Product Grid (Products Page):**
  - Advanced filtering (Sidebar) with count indicators.
  - "Quick View" modal functionality.
  - Adaptive grid (1 col mobile, 2 col tablet, 3-4 col desktop).
- [ ] **Product Details:**
  - Immersive image gallery with zoom capability.
  - Sticky "Add to Cart" bar for mobile.
  - Science-backed feature sections (Research links).

### Phase 3: Conversion & Checkout
- [ ] **Shopping Cart (Sidebar):**
  - Real-time subtotal updates.
  - "Recommended Add-ons" section.
  - Free shipping progress bar.
- [ ] **Checkout Flow:**
  - Single-page "Accordion" layout to reduce friction.
  - Address autocomplete integration.
  - Clear trust signals (SSL, Payment icons).

---

## 4. Component Layout Specifications

### Adaptive Grid System
| Device | Columns | Gutter | Margin | Container Max-Width |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile** | 4 | 16px | 20px | Full Width |
| **Tablet** | 8 | 24px | 40px | 768px |
| **Desktop**| 12 | 24px | 80px | 1280px |

### Product Grid (Products Page)
- **Columns:** `grid-cols-1` (Mobile) → `grid-cols-2` (Tablet) → `grid-cols-3` (Laptop) → `grid-cols-4` (Desktop).
- **Aspect Ratio:** `aspect-[4/5]` for product images to maintain elegant, taller product shots.

### Shopping Cart (Sidebar)
- **Width:** Desktop `400px` (Right-aligned), Mobile `100vw`.
- **Layout:** Sticky header (Cart Title) + Scrollable Item List + Sticky Footer (Totals & Checkout).
- **Z-Index:** `z-[100]` to ensure it overlays all other elements.

---

## 5. UX Best Practices (Pro Max Requirements)

### Interactive States
- **Skeletons:** Every data-fetching component must have a high-fidelity skeleton state (Shimmer effect).
- **Transitions:** Page transitions should be subtle (opacity + slight Y-axis shift).
- **Haptic Feedback:** Visual feedback on touch/click (scale down 2-3% on active state).

### Accessibility Checklist
- [ ] Contrast ratio > 4.5:1 for all text.
- [ ] Full keyboard navigation support (Focus rings visible).
- [ ] ARIA labels for all icon-only buttons.
- [ ] Error messages associated with inputs via `aria-describedby`.

---

## 5. Technical Guidelines for Engineering
- **Library Choice:** Continue using `Framer Motion` for animations and `Lucide React` for iconography.
- **Styling:** Strict adherence to Tailwind CSS utility-first approach with custom theme extensions.
- **Performance:** 
  - Next-gen image formats (WebP/AVIF).
  - Component lazy loading for non-critical paths.
  - Debouncing intensive search/filter operations.

---

## 6. Implementation Checklist for Current Round

### Immediate Actions
1. **Audit:** Identify components still using standard HTML elements instead of UI-kit primitives.
2. **Refactor:** Update `Button`, `Input`, and `Card` components to match the new Design Tokens.
3. **Verify:** Run a contrast audit using Lighthouse/WAVE.

---
**Clio (Planning)**  
*Golden Tier Peptide Project*
