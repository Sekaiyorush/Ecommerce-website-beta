import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OrdersManagement } from '../OrdersManagement';
import React from 'react';

// Supabase is mocked globally in setup.ts

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'admin@test.com', name: 'Admin User' },
    profile: { role: 'admin', full_name: 'Admin User', status: 'active' },
    role: 'admin',
    loading: false,
    isAdmin: true,
    isPartner: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/DatabaseContext', () => ({
  useDatabase: () => ({
    db: {
      products: [],
      partners: [],
      customers: [],
      orders: [
        {
          id: 'ORD-2026-001',
          dbId: 'db-uuid-1',
          customerId: 'user-1',
          customerName: 'John Doe',
          items: [
            {
              productId: 'prod-1',
              name: 'BPC-157',
              quantity: 2,
              price: 2500,
            },
          ],
          total: 5000,
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: 'bank_transfer',
          createdAt: '2026-03-01T10:00:00Z',
          userType: 'partner',
          shippingName: 'John Doe',
          shippingEmail: 'john@test.com',
          shippingPhone: '+66123456789',
        },
        {
          id: 'ORD-2026-002',
          dbId: 'db-uuid-2',
          customerId: 'user-2',
          customerName: 'Jane Smith',
          items: [],
          total: 1500,
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: '2026-02-15T09:00:00Z',
          userType: 'customer',
        },
      ],
      invitationCodes: [],
      users: [],
      inventoryLogs: [],
      siteSettings: {},
    },
    isLoading: false,
    updateOrder: vi.fn().mockResolvedValue({ success: true }),
    refreshData: vi.fn(),
    logAudit: vi.fn(),
  }),
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: [],
    addItem: vi.fn(),
    total: 0,
    itemCount: 0,
    isOpen: false,
    setIsOpen: vi.fn(),
  }),
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (key: string) => key }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

// OrderNotes makes its own Supabase calls — stub it out
vi.mock('@/components/admin/OrderNotes', () => ({
  OrderNotes: () => <div data-testid="order-notes">Order Notes</div>,
}));

vi.mock('@/components/admin/BulkActionToolbar', () => ({
  BulkActionToolbar: () => <div data-testid="bulk-action-toolbar" />,
}));

vi.mock('@/components/skeletons/TableRowSkeleton', () => ({
  TableRowSkeleton: () => <tr data-testid="table-row-skeleton"><td>Loading…</td></tr>,
}));

const originalTitle = document.title;
afterEach(() => {
  document.title = originalTitle;
});

function renderOrdersManagement() {
  return render(
    <MemoryRouter>
      <OrdersManagement />
    </MemoryRouter>
  );
}

describe('OrdersManagement', () => {
  it('renders without crashing', () => {
    expect(() => renderOrdersManagement()).not.toThrow();
  });

  it('updates document.title via the SEO component', () => {
    renderOrdersManagement();
    expect(document.title).toContain('Orders');
  });

  it('renders the Orders Management heading', () => {
    renderOrdersManagement();
    expect(
      screen.getByRole('heading', { name: /orders management/i })
    ).toBeInTheDocument();
  });

  it('renders the search input for orders', () => {
    renderOrdersManagement();
    expect(
      screen.getByPlaceholderText(/search orders/i)
    ).toBeInTheDocument();
  });

  it('renders the status filter dropdown defaulting to "All Status"', () => {
    renderOrdersManagement();
    // Multiple <select> elements exist (per-row status/payment dropdowns + the filter bar).
    // The filter bar select has an "all" option — find it by its unique default value.
    const allSelects = screen.getAllByRole('combobox');
    const statusFilter = allSelects.find(
      (el) => (el as HTMLSelectElement).value === 'all'
    );
    expect(statusFilter).toBeInTheDocument();
  });

  it('renders the orders table with correct column headers', () => {
    renderOrdersManagement();
    expect(screen.getByText('Order ID')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  it('renders mocked order rows from the database context', () => {
    renderOrdersManagement();
    expect(screen.getByText('ORD-2026-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ORD-2026-002')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders order count stat cards', () => {
    renderOrdersManagement();
    // "Total Orders", "Pending", "Delivered", "Processing" appear as stat card labels.
    // They also appear as <option> text in the dropdowns — use getAllByText.
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Delivered').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a "select all" checkbox in the table header', () => {
    renderOrdersManagement();
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is the "select all" in <thead>
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the BulkActionToolbar', () => {
    renderOrdersManagement();
    expect(screen.getByTestId('bulk-action-toolbar')).toBeInTheDocument();
  });
});
