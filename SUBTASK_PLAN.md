# Execution Plan: Admin Product Management Redesign

This plan outlines the steps for the Dev team to implement the redesigned Admin Product Management interface as per the `ADMIN_PRODUCT_REDESIGN_SPEC.md`.

## Phase 1: Environment & Dependencies
1. **Install `@tanstack/react-table`**: Required for the new `DataTable` component.
2. **Verify shadcn/ui components**: Ensure `Table`, `Dialog`, `Tabs`, `DropdownMenu`, `Popover`, `Badge`, `Checkbox`, `Command`, `Input`, `Textarea`, `Select` are available and up-to-date in `src/components/ui/`.

## Phase 2: Modular Component Development
1. **Table Components (`src/components/admin/product-table/`)**:
    - `Columns.tsx`: Define columns with custom renderers for image, status badges, and actions.
    - `DataTable.tsx`: Implement the main table wrapper with sorting and filtering.
    - `RowActions.tsx`: Action menu for each row.
    - `InlineStockEdit.tsx`: Popover for quick stock adjustments.
2. **Form Components (`src/components/admin/product-form/`)**:
    - `ProductDialog.tsx`: Main modal using `Dialog` and `Tabs`.
    - `GeneralTab.tsx`, `PricingTab.tsx`, `DetailsTab.tsx`, `VariantEditor.tsx`: Individual tab contents.

## Phase 3: Integration & Refactoring
1. **Update `ProductsManagement.tsx`**:
    - Replace current manual table with the new `DataTable`.
    - Replace the old modal with the new `ProductDialog`.
    - Integrate `BulkActionToolbar` using table selection state.
2. **Connect to `DatabaseContext`**:
    - Ensure all CRUD operations use the context methods correctly.
    - Implement optimistic updates for inline stock/price changes.

## Phase 4: Validation & Polishing
1. **Unit Tests**:
    - Test product creation/editing logic.
    - Test bulk action functionality.
2. **UI/UX Audit**:
    - Verify responsiveness on different screen sizes.
    - Check accessibility (keyboard navigation, screen reader labels).
3. **Performance Check**:
    - Ensure smooth scrolling and filtering with 50+ products.

## Success Criteria
- [ ] Product management is significantly faster (less clicking/scrolling).
- [ ] Bulk actions are functional and intuitive.
- [ ] Inline editing works as expected without full page reloads or modal pops.
- [ ] UI is consistent with the Golden Tier brand guidelines.
