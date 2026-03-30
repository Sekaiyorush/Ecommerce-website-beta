import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart, getItemPrice } from '../CartContext';
import type { Product, ProductVariant } from '@/data/products';

// ---------------------------------------------------------------------------
// Mock AuthContext — CartProvider calls useAuth() for user + isPartner
// ---------------------------------------------------------------------------
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/context/AuthContext';
const mockUseAuth = vi.mocked(useAuth);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    name: 'BPC-157',
    description: 'A healing peptide',
    price: 500,
    category: 'Recovery',
    purity: '99%',
    inStock: true,
    stockQuantity: 10,
    sku: 'BPC-157-5MG',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    sku: 'BPC-157-10MG',
    label: '10mg',
    price: 900,
    stock: 5,
    ...overrides,
  };
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CartContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();

    // Default: unauthenticated, non-partner user
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isPartner: false,
      isCustomer: false,
      login: vi.fn(),
      register: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updatePassword: vi.fn(),
      logout: vi.fn(),
      validateCode: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('starts with an empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      expect(result.current.items).toEqual([]);
    });

    it('starts with cartCount of 0', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      expect(result.current.cartCount).toBe(0);
    });

    it('starts with cartSubtotal of 0', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      expect(result.current.cartSubtotal).toBe(0);
    });

    it('starts with cartTotal of 0', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      expect(result.current.cartTotal).toBe(0);
    });

    it('starts with isOpen false', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      expect(result.current.isOpen).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('addToCart', () => {
    it('adds a product to the cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => {
        result.current.addToCart(product);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('prod-1');
      expect(result.current.items[0].quantity).toBe(1);
    });

    it('does not add when stockQuantity is 0', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct({ stockQuantity: 0 });

      act(() => {
        result.current.addToCart(product);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('increments quantity when the same product is added again', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => {
        result.current.addToCart(product);
        result.current.addToCart(product);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });

    it('caps quantity at stock limit', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct({ stockQuantity: 3 });

      act(() => {
        result.current.addToCart(product, undefined, 10); // request 10, stock is 3
      });

      expect(result.current.items[0].quantity).toBe(3);
    });

    it('adds a specific quantity when quantityToAdd is provided', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => {
        result.current.addToCart(product, undefined, 3);
      });

      expect(result.current.items[0].quantity).toBe(3);
    });

    it('adds a product with a variant', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();
      const variant = makeVariant();

      act(() => {
        result.current.addToCart(product, variant);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].selectedVariant?.sku).toBe('BPC-157-10MG');
    });

    it('treats same product with different variant skus as separate line items', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();
      const variant1 = makeVariant({ sku: 'BPC-5MG', label: '5mg', price: 500 });
      const variant2 = makeVariant({ sku: 'BPC-10MG', label: '10mg', price: 900 });

      act(() => {
        result.current.addToCart(product, variant1);
        result.current.addToCart(product, variant2);
      });

      expect(result.current.items).toHaveLength(2);
    });

    it('treats same product with no variant as the same line item as a variant-less entry', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => {
        result.current.addToCart(product);
        result.current.addToCart(product);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe('removeFromCart', () => {
    it('removes an item by productId', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => { result.current.addToCart(product); });
      act(() => { result.current.removeFromCart('prod-1'); });

      expect(result.current.items).toHaveLength(0);
    });

    it('only removes the matching variant, leaving others intact', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();
      const v1 = makeVariant({ sku: 'VAR-1', label: '5mg', price: 500, stock: 10 });
      const v2 = makeVariant({ sku: 'VAR-2', label: '10mg', price: 900, stock: 10 });

      act(() => {
        result.current.addToCart(product, v1);
        result.current.addToCart(product, v2);
      });
      act(() => { result.current.removeFromCart('prod-1', 'VAR-1'); });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].selectedVariant?.sku).toBe('VAR-2');
    });

    it('does nothing when removing a product that is not in the cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => { result.current.addToCart(product); });
      act(() => { result.current.removeFromCart('non-existent-id'); });

      expect(result.current.items).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  describe('updateQuantity', () => {
    it('updates the quantity of an existing item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => { result.current.addToCart(product); });
      act(() => { result.current.updateQuantity('prod-1', 5); });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('removes the item when quantity is set to 0', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => { result.current.addToCart(product); });
      act(() => { result.current.updateQuantity('prod-1', 0); });

      expect(result.current.items).toHaveLength(0);
    });

    it('removes the item when quantity is set to a negative number', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => { result.current.addToCart(product); });
      act(() => { result.current.updateQuantity('prod-1', -3); });

      expect(result.current.items).toHaveLength(0);
    });

    it('caps quantity at stock limit', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct({ stockQuantity: 4 });

      act(() => { result.current.addToCart(product); });
      act(() => { result.current.updateQuantity('prod-1', 99); });

      expect(result.current.items[0].quantity).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  describe('clearCart', () => {
    it('removes all items from the cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product1 = makeProduct({ id: 'p1', sku: 'P1' });
      const product2 = makeProduct({ id: 'p2', sku: 'P2' });

      act(() => {
        result.current.addToCart(product1);
        result.current.addToCart(product2);
      });
      act(() => { result.current.clearCart(); });

      expect(result.current.items).toHaveLength(0);
    });

    it('resets cartCount to 0 after clear', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => { result.current.addToCart(product, undefined, 3); });
      act(() => { result.current.clearCart(); });

      expect(result.current.cartCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('derived totals', () => {
    it('cartCount returns total number of units across all items', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const p1 = makeProduct({ id: 'p1', sku: 'P1', stockQuantity: 20 });
      const p2 = makeProduct({ id: 'p2', sku: 'P2', stockQuantity: 20 });

      act(() => {
        result.current.addToCart(p1, undefined, 3);
        result.current.addToCart(p2, undefined, 2);
      });

      expect(result.current.cartCount).toBe(5);
    });

    it('cartSubtotal sums price * quantity for all items', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct({ price: 500 });

      act(() => { result.current.addToCart(product, undefined, 2); });

      // 500 * 2 = 1000
      expect(result.current.cartSubtotal).toBe(1000);
    });

    it('uses variant price over product price in cartSubtotal', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct({ price: 500 });
      const variant = makeVariant({ price: 900, stock: 10 });

      act(() => { result.current.addToCart(product, variant, 1); });

      expect(result.current.cartSubtotal).toBe(900);
    });

    it('cartTotal equals cartSubtotal when user is not a partner', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct({ price: 500 });

      act(() => { result.current.addToCart(product, undefined, 2); });

      expect(result.current.cartTotal).toBe(result.current.cartSubtotal);
      expect(result.current.discountAmount).toBe(0);
    });

    it('applies partner discount to cartTotal', () => {
      // Re-mock useAuth to simulate a partner with 20% discount
      mockUseAuth.mockReturnValue({
        user: {
          id: 'partner-1',
          email: 'partner@example.com',
          name: 'Test Partner',
          role: 'partner',
          discountRate: 20,
          joinedAt: '2024-01-01T00:00:00Z',
        },
        isAuthenticated: true,
        isAdmin: false,
        isPartner: true,
        isCustomer: false,
        login: vi.fn(),
        register: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updatePassword: vi.fn(),
        logout: vi.fn(),
        validateCode: vi.fn(),
      });

      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct({ price: 1000 });

      act(() => { result.current.addToCart(product, undefined, 1); });

      // subtotal = 1000, 20% discount = 200, total = 800
      expect(result.current.cartSubtotal).toBe(1000);
      expect(result.current.discountAmount).toBe(200);
      expect(result.current.cartTotal).toBe(800);
    });

    it('calculates multi-item subtotal correctly', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const p1 = makeProduct({ id: 'p1', sku: 'P1', price: 300, stockQuantity: 20 });
      const p2 = makeProduct({ id: 'p2', sku: 'P2', price: 700, stockQuantity: 20 });

      act(() => {
        result.current.addToCart(p1, undefined, 2); // 600
        result.current.addToCart(p2, undefined, 1); // 700
      });

      expect(result.current.cartSubtotal).toBe(1300);
    });
  });

  // -------------------------------------------------------------------------
  describe('toggleCart / isOpen / setIsOpen', () => {
    it('toggles isOpen from false to true', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => { result.current.toggleCart(); });

      expect(result.current.isOpen).toBe(true);
    });

    it('toggles isOpen back to false', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => { result.current.toggleCart(); });
      act(() => { result.current.toggleCart(); });

      expect(result.current.isOpen).toBe(false);
    });

    it('setIsOpen sets the value directly', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => { result.current.setIsOpen(true); });
      expect(result.current.isOpen).toBe(true);

      act(() => { result.current.setIsOpen(false); });
      expect(result.current.isOpen).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('localStorage persistence', () => {
    it('saves cart to localStorage after debounce', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => { result.current.addToCart(product); });

      // Flush the 500ms debounce timer
      act(() => { vi.runAllTimers(); });

      const stored = localStorage.getItem('goldentier_cart_guest');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].product.id).toBe('prod-1');
    });

    it('uses user-specific key when user is logged in', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-abc',
          email: 'user@example.com',
          name: 'User',
          role: 'customer',
          joinedAt: '2024-01-01T00:00:00Z',
        },
        isAuthenticated: true,
        isAdmin: false,
        isPartner: false,
        isCustomer: true,
        login: vi.fn(),
        register: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updatePassword: vi.fn(),
        logout: vi.fn(),
        validateCode: vi.fn(),
      });

      const { result } = renderHook(() => useCart(), { wrapper });
      const product = makeProduct();

      act(() => { result.current.addToCart(product); });
      act(() => { vi.runAllTimers(); });

      expect(localStorage.getItem('goldentier_cart_user-abc')).not.toBeNull();
      expect(localStorage.getItem('goldentier_cart_guest')).toBeNull();
    });

    it('loads cart from localStorage on mount', () => {
      const storedCart = [
        {
          product: {
            id: 'prod-1',
            name: 'BPC-157',
            price: 500,
            sku: 'BPC-157-5MG',
            description: 'A healing peptide',
            category: 'Recovery',
            purity: '99%',
            inStock: true,
            stockQuantity: 10,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          quantity: 3,
        },
      ];
      localStorage.setItem('goldentier_cart_guest', JSON.stringify(storedCart));

      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
    });

    it('ignores invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('goldentier_cart_guest', 'not-valid-json{{{');

      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.items).toHaveLength(0);
    });

    it('ignores schema-invalid data in localStorage gracefully', () => {
      // quantity is a string — fails zod validation
      const bad = [{ product: { id: 'p1', name: 'X', price: 100, sku: 'X' }, quantity: 'five' }];
      localStorage.setItem('goldentier_cart_guest', JSON.stringify(bad));

      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.items).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('getItemPrice helper', () => {
    it('returns the product price when no variant is selected', () => {
      const product = makeProduct({ price: 500 });
      const item = { product, quantity: 1 };
      expect(getItemPrice(item)).toBe(500);
    });

    it('returns the variant price when a variant is selected', () => {
      const product = makeProduct({ price: 500 });
      const variant = makeVariant({ price: 900 });
      const item = { product, quantity: 1, selectedVariant: variant };
      expect(getItemPrice(item)).toBe(900);
    });
  });

  // -------------------------------------------------------------------------
  describe('useCart error guard', () => {
    it('throws when used outside CartProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useCart())).toThrow(
        'useCart must be used within a CartProvider'
      );
      consoleSpy.mockRestore();
    });
  });
});
