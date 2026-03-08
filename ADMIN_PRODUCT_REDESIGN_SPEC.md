# Redesign Specification: Admin Product Management

## Overview
Transform the current `ProductsManagement` page into a high-performance, intuitive administrative tool. The redesign focuses on data density, speed of common tasks (stock/price updates), and robust bulk management.

## 1. Architectural Changes
- **Framework:** Transition to `@tanstack/react-table` (shadcn/ui `DataTable`).
- **Form Pattern:** Replace the single long modal with a multi-tabbed `Dialog`.
- **State Management:** Enhance `useDatabase` context usage for optimistic UI updates during inline editing.

## 2. Component Enhancements (shadcn/ui)

### A. The Products DataTable
| Feature | Implementation |
| :--- | :--- |
| **Row Selection** | Checkboxes for all rows + "Select All". |
| **Product Cell** | Image thumbnail (40x40) + Name + SKU (subtext). |
| **Status Badge** | `In Stock` (Green), `Low Stock` (<20, Amber), `Out of Stock` (Red). |
| **Variants Cell** | Collapsible list or summary count with hover-to-view details. |
| **Actions** | Dropdown menu (`Edit`, `Duplicate`, `View QR`, `Delete`). |
| **Inline Editing** | Clickable Price/Stock cells to open a mini-popover for instant updates. |

### B. Add/Edit Product Modal (Dialog + Tabs)
- **Tab 1: General Info:** Name, Category, SKU, Short Description.
- **Tab 2: Details & Media:** Full Description, Image URL (with preview), Benefits, Dosage.
- **Tab 3: Pricing & Inventory:** Base Price, Base Stock, Purity, Low Stock Threshold.
- **Tab 4: Variants:** Advanced variant grid with bulk pricing/stock adjustment for variants.

### C. Bulk Action Toolbar
- Visible only when rows are selected.
- Actions: `Delete Selected`, `Update Category`, `Set Status`, `Export CSV`.

## 3. UI/UX Strategy (best practices)
- **Keyboard Shortcuts:** Support `Esc` to close modals, `Enter` to save inline edits.
- **Sticky Header:** Keep the table header and search/bulk-actions visible during scroll.
- **Empty State:** Professional "No products found" illustration with a "Clear Filters" button.
- **Loading State:** Skeleton screens for table rows during data fetching/processing.

## 4. Visual Identity
- **Primary Color:** `#D4AF37` (Gold) for primary buttons and active states.
- **Surface:** Slate 900 for dark mode elements, high-contrast white/slate-50 for table rows.
- **Typography:** Sans-serif (Inter/Geist) with strict hierarchy.

## 5. Proposed Component Structure
```
src/components/admin/
├── product-table/
│   ├── DataTable.tsx
│   ├── Columns.tsx
│   ├── RowActions.tsx
│   └── InlineStockEdit.tsx
└── product-form/
    ├── ProductDialog.tsx
    ├── GeneralTab.tsx
    ├── PricingTab.tsx
    └── VariantEditor.tsx
```

## 6. Implementation Checklist
- [ ] Implement shadcn/ui DataTable foundations.
- [ ] Define column definitions with custom renderers (Status, Product, Actions).
- [ ] Create the multi-tabbed Product Dialog.
- [ ] Integrate `BulkActionToolbar` with table selection state.
- [ ] Add inline adjustment popovers for Price/Stock.
- [ ] Verify accessibility (ARIA labels, keyboard nav).
- [ ] Test with large product sets (>50 items).
