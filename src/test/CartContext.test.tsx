import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import React from 'react';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isPartner: false,
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

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>
    {children}
  </CartProvider>
);

describe('CartContext', () => {
  it('initializes with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.cartCount).toBe(0);
    expect(result.current.cartTotal).toBe(0);
  });

  it('can add items to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });
    
    act(() => {
      result.current.addToCart({
        id: '123',
        name: 'Test Product',
        price: 100,
        sku: 'TEST-SKU',
        description: '',
        fullDescription: undefined,
        category: 'Test',
        purity: '99%',
        inStock: true,
        stockQuantity: 10,
        benefits: [],
        dosage: undefined,
        imageUrl: undefined,
        createdAt: '',
        updatedAt: '',
        lowStockThreshold: 10
      });
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.cartCount).toBe(1);
    expect(result.current.items[0].product.name).toBe('Test Product');
  });
});
