import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';
import { CheckoutPage } from '@/pages/Checkout';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Mock product
const mockProduct = {
  id: 'prod-1',
  sku: 'SKU1',
  name: 'Test Peptide',
  description: 'Test Description',
  price: 1000,
  category: 'Research',
  purity: '99%',
  inStock: true,
  stockQuantity: 100,
  benefits: [],
  imageUrl: '',
  createdAt: '',
  updatedAt: '',
  lowStockThreshold: 10
};

// We'll control the mock return value per test
let mockAuthValue: Record<string, unknown>;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    refreshCartPrices: vi.fn(),
    clearCart: vi.fn(),
    toggleCart: vi.fn(),
    isOpen: false,
    setIsOpen: vi.fn(),
    cartCount: 0,
    cartSubtotal: 0,
    discountAmount: 0,
    cartTotal: 0,
  }),
  getItemPrice: (item: { selectedVariant?: { price: number }; product: { price: number } }) =>
    item.selectedVariant?.price ?? item.product.price,
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('@/context/DatabaseContext', () => ({
  useDatabase: () => ({
    createSecureOrder: vi.fn(),
  }),
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }
}));

// Mock ProductRating to avoid Supabase calls
vi.mock('@/components/reviews/ProductRating', () => ({
  ProductRating: () => <div data-testid="product-rating" />
}));

describe('Partner-Role Cart Restriction', () => {
  it('should NOT show Add to Cart button for non-partner users', () => {
    mockAuthValue = {
      user: { id: 'user-1', email: 'cust@example.com', role: 'customer' },
      isAuthenticated: true,
      isAdmin: false,
      isPartner: false,
      isCustomer: true,
      login: vi.fn(),
      register: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updatePassword: vi.fn(),
      logout: vi.fn(),
      validateCode: vi.fn()
    };

    render(
      <MemoryRouter>
        <ProductCard product={mockProduct as any} />
      </MemoryRouter>
    );

    // Non-partner users see "Unlock Partner Pricing" lock overlay instead of price/cart
    expect(screen.getByText(/Unlock Partner Pricing/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
    // "Apply" link directs to /contact
    expect(screen.getByText(/Apply/i)).toBeInTheDocument();
  });

  it('should show product price for partner users in ProductCard', () => {
    mockAuthValue = {
      user: { id: 'user-2', email: 'partner@example.com', role: 'partner', discountRate: 20 },
      isAuthenticated: true,
      isAdmin: false,
      isPartner: true,
      isCustomer: false,
      login: vi.fn(),
      register: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updatePassword: vi.fn(),
      logout: vi.fn(),
      validateCode: vi.fn()
    };

    render(
      <MemoryRouter>
        <ProductCard product={mockProduct as any} />
      </MemoryRouter>
    );

    // Partner users should NOT see "Unlock Partner Pricing"
    expect(screen.getByText(/Test Peptide/i)).toBeInTheDocument();
    expect(screen.queryByText(/Unlock Partner Pricing/i)).not.toBeInTheDocument();
  });

  it('should redirect non-partners away from CheckoutPage', () => {
    mockAuthValue = {
      user: { id: 'user-1', email: 'cust@example.com', role: 'customer' },
      isAuthenticated: true,
      isAdmin: false,
      isPartner: false,
      isCustomer: true,
      login: vi.fn(),
      register: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updatePassword: vi.fn(),
      logout: vi.fn(),
      validateCode: vi.fn()
    };

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/products" element={<div>Products Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Non-partner users are redirected to /products via <Navigate>
    expect(screen.getByText('Products Page')).toBeInTheDocument();
    expect(screen.queryByText(/Shipping Information/i)).not.toBeInTheDocument();
  });
});
