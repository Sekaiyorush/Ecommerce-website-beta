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

describe('Cart Performance & State Management', () => {
  it('handles rapid sequential additions without performance degradation', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });
    
    const startTime = performance.now();
    
    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.addToCart({
          id: `prod-${i}`,
          name: `Test Product ${i}`,
          price: 100 + i,
          sku: `TEST-SKU-${i}`,
          description: 'A test product',
          fullDescription: null,
          category: 'Test',
          inStock: true,
          stockQuantity: 1000,
          benefits: [],
          dosage: null,
          imageUrl: null,
          createdAt: '',
          updatedAt: '',
          lowStockThreshold: 10
        });
      }
    });

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    expect(result.current.items.length).toBe(100);
    expect(result.current.cartCount).toBe(100);
    
    // Performance expectation: 100 additions should take less than 150ms
    // If state management is inefficient (e.g. deep cloning large arrays constantly without memoization)
    // this will balloon in execution time.
    expect(executionTime).toBeLessThan(150);
  });

  it('handles bulk quantity updates efficiently', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });
    
    act(() => {
      result.current.addToCart({
        id: 'bulk-prod',
        name: 'Bulk Product',
        price: 50,
        sku: 'BULK-SKU',
        description: '',
        fullDescription: null,
        category: 'Test',
        inStock: true,
        stockQuantity: 1000,
        benefits: [],
        dosage: null,
        imageUrl: null,
        createdAt: '',
        updatedAt: '',
        lowStockThreshold: 10
      });
    });

    const startTime = performance.now();
    
    act(() => {
      for (let i = 1; i <= 50; i++) {
        result.current.updateQuantity('bulk-prod', i);
      }
    });

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    expect(result.current.items[0].quantity).toBe(50);
    // Quantity updates should be fast, less than 100ms
    expect(executionTime).toBeLessThan(100);
  });
});
