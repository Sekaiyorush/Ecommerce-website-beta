import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductsManagement } from '../ProductsManagement';
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
      products: [
        {
          id: '1',
          sku: 'BPC-157',
          name: 'BPC-157',
          price: 2500,
          category: 'Healing',
          purity: '99%',
          stockQuantity: 100,
          description: 'A powerful healing peptide',
          fullDescription: 'Extended healing peptide description.',
          benefits: ['Healing', 'Recovery'],
          dosage: '250mcg daily',
          status: 'active',
          variants: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: '2',
          sku: 'TB-500',
          name: 'TB-500',
          price: 3200,
          category: 'Recovery',
          purity: '99.5%',
          stockQuantity: 50,
          description: 'Thymosin Beta-4 fragment',
          fullDescription: '',
          benefits: ['Recovery'],
          dosage: '500mcg weekly',
          status: 'active',
          variants: [],
          createdAt: '2026-01-15',
          updatedAt: '2026-01-15',
        },
      ],
      partners: [],
      customers: [],
      orders: [],
      invitationCodes: [],
      users: [],
      inventoryLogs: [],
      siteSettings: {},
    },
    isLoading: false,
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
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

// useToast is consumed directly from context — mock the hook so tests don't need a Provider
vi.mock('@/components/ui/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/components/admin/BulkActionToolbar', () => ({
  BulkActionToolbar: () => <div data-testid="bulk-action-toolbar" />,
}));

const originalTitle = document.title;
afterEach(() => {
  document.title = originalTitle;
});

function renderProductsManagement() {
  return render(
    <MemoryRouter>
      <ProductsManagement />
    </MemoryRouter>
  );
}

describe('ProductsManagement', () => {
  it('renders without crashing', () => {
    expect(() => renderProductsManagement()).not.toThrow();
  });

  it('updates document.title via the SEO component', () => {
    renderProductsManagement();
    expect(document.title).toContain('Products');
  });

  it('renders the Products Management heading', () => {
    renderProductsManagement();
    expect(
      screen.getByRole('heading', { name: /products management/i })
    ).toBeInTheDocument();
  });

  it('renders the "Add New Product" button', () => {
    renderProductsManagement();
    expect(
      screen.getByRole('button', { name: /add new product/i })
    ).toBeInTheDocument();
  });

  it('renders the search input for products', () => {
    renderProductsManagement();
    expect(
      screen.getByPlaceholderText(/search by name, sku, or category/i)
    ).toBeInTheDocument();
  });

  it('renders the "All Products" category filter button', () => {
    renderProductsManagement();
    expect(
      screen.getByRole('button', { name: /all products/i })
    ).toBeInTheDocument();
  });

  it('renders table column headers for the product list', () => {
    renderProductsManagement();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders mocked product rows with correct names', () => {
    renderProductsManagement();
    // BPC-157 appears in both the name cell and the SKU cell — use getAllByText
    expect(screen.getAllByText('BPC-157').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TB-500').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the mocked product SKUs in the SKU column', () => {
    renderProductsManagement();
    // Each product's SKU is rendered at least twice (name cell + SKU column)
    const bpcInstances = screen.getAllByText('BPC-157');
    expect(bpcInstances.length).toBeGreaterThanOrEqual(2);
    const tbInstances = screen.getAllByText('TB-500');
    expect(tbInstances.length).toBeGreaterThanOrEqual(2);
  });

  it('renders dynamic category filter buttons derived from products', () => {
    renderProductsManagement();
    // "Healing" and "Recovery" are categories from mock data
    expect(screen.getByRole('button', { name: /^Healing$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Recovery$/i })).toBeInTheDocument();
  });

  it('renders the BulkActionToolbar', () => {
    renderProductsManagement();
    expect(screen.getByTestId('bulk-action-toolbar')).toBeInTheDocument();
  });

  it('renders Actions column header for the product table', () => {
    renderProductsManagement();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
