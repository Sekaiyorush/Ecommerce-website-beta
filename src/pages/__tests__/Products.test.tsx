import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Products } from '../Products';
import React from 'react';

// Supabase is mocked globally in setup.ts

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    isAuthenticated: false,
    isAdmin: false,
    isPartner: false,
    isCustomer: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    validateCode: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updatePassword: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/DatabaseContext', () => ({
  useDatabase: () => ({
    db: {
      products: [],
      partners: [],
      customers: [],
      orders: [],
      invitationCodes: [],
      users: [],
      inventoryLogs: [],
      siteSettings: {},
    },
    isLoading: true,
    dbError: null,
    refreshData: vi.fn(),
    logAudit: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    createSecureOrder: vi.fn(),
  }),
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    toggleCart: vi.fn(),
    isOpen: false,
    cartCount: 0,
    cartSubtotal: 0,
    cartTotal: 0,
  }),
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (k: string) => k }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

const originalTitle = document.title;
afterEach(() => {
  document.title = originalTitle;
});

function renderProducts({ isLoading = true, products = [] } = {}) {
  // Re-mock with custom values per test
  vi.mocked(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@/context/DatabaseContext').useDatabase
  ).mockReturnValue({
    db: {
      products,
      partners: [],
      customers: [],
      orders: [],
      invitationCodes: [],
      users: [],
      inventoryLogs: [],
      siteSettings: {},
    },
    isLoading,
    dbError: null,
    refreshData: vi.fn(),
    logAudit: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/products']}>
      <Products />
    </MemoryRouter>
  );
}

describe('Products page', () => {
  it('renders without crashing while loading', () => {
    expect(() =>
      render(
        <MemoryRouter initialEntries={['/products']}>
          <Products />
        </MemoryRouter>
      )
    ).not.toThrow();
  });

  it('shows skeleton cards when isLoading is true', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>
    );
    // ProductCardSkeleton renders divs with Skeleton children; at least one
    // bg-muted skeleton element should be present
    const skeletons = document.querySelectorAll('.bg-muted');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the "Research Catalog" heading', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('heading', { name: /research catalog/i })
    ).toBeInTheDocument();
  });

  it('updates document.title via the SEO component', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>
    );
    expect(document.title).toContain('Research Catalog');
    expect(document.title).toContain('Golden Tier Peptide');
  });

  it('renders the search input', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>
    );
    expect(
      screen.getByPlaceholderText(/search compounds/i)
    ).toBeInTheDocument();
  });

  it('shows the non-partner upgrade banner for non-partner users', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>
    );
    expect(screen.getByText(/partner exclusive/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request partner access/i })).toBeInTheDocument();
  });
});
