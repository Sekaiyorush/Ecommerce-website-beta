import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from '../pages/Checkout';
import React from 'react';

// Mock AuthContext to provide a partner user so CheckoutPage doesn't redirect
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'partner@example.com', name: 'Partner', discountRate: 20 },
    isAuthenticated: true,
    isAdmin: false,
    isPartner: true,
    isCustomer: false,
    login: async () => ({ success: true }),
    register: async () => ({ success: true }),
    resetPasswordForEmail: async () => ({ success: true }),
    updatePassword: async () => ({ success: true }),
    logout: async () => {},
    validateCode: async () => ({ valid: true })
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock CartContext to provide an empty cart
vi.mock('../context/CartContext', () => ({
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

// Mock DatabaseContext
vi.mock('../context/DatabaseContext', () => ({
  useDatabase: () => ({
    createSecureOrder: vi.fn(),
  }),
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock logger
vi.mock('../lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }
}));

describe('CheckoutPage', () => {
  it('renders empty cart state initially', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    });
  });
});
