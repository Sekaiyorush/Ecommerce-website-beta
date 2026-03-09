import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';
import { CheckoutPage } from '@/pages/Checkout';
import { AuthProvider } from '@/context/AuthContext';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { CartProvider } from '@/context/CartContext';
import { MemoryRouter } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

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
  updatedAt: ''
};

describe('Partner-Role Cart Restriction', () => {
  it('should NOT show "Add to Cart" button for non-partner users in ProductCard', async () => {
    // Mock user as a regular customer (not a partner)
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'cust@example.com' } } },
      error: null
    });
    
    // Mock profile as customer
    const fromSpy = vi.spyOn(supabase, 'from');
    (fromSpy as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { id: 'user-1', role: 'customer', discount_rate: 0 }, 
        error: null 
      })
    });

    render(
      <MemoryRouter>
        <DatabaseProvider>
          <AuthProvider>
            <ProductCard product={mockProduct as any} />
          </AuthProvider>
        </DatabaseProvider>
      </MemoryRouter>
    );

    // Should show "Partner Exclusive" instead of price/cart
    expect(await screen.findByText(/Partner Exclusive/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Request Access/i)).toBeInTheDocument();
  });

  it('should show "Add to Cart" button for partner users in ProductCard', async () => {
    // Mock user as a partner
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'user-2', email: 'partner@example.com' } } },
      error: null
    });
    
    // Mock profile as partner
    const fromSpy = vi.spyOn(supabase, 'from');
    (fromSpy as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { id: 'user-2', role: 'partner', discount_rate: 20 }, 
        error: null 
      })
    });

    render(
      <MemoryRouter>
        <DatabaseProvider>
          <AuthProvider>
            <ProductCard product={mockProduct as any} />
          </AuthProvider>
        </DatabaseProvider>
      </MemoryRouter>
    );

    // Should NOT show "Partner Exclusive"
    expect(await screen.findByText(/Test Peptide/i)).toBeInTheDocument();
    expect(screen.queryByText(/Partner Exclusive/i)).not.toBeInTheDocument();
  });

  it('should verify if CheckoutPage restricts non-partners', async () => {
    // Mock user as a regular customer
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'cust@example.com' } } },
      error: null
    });
    
    // Mock profile as customer
    const fromSpy = vi.spyOn(supabase, 'from');
    (fromSpy as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { id: 'user-1', role: 'customer', discount_rate: 0 }, 
        error: null 
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    });

    // Mock localStorage to have items in cart
    const cartItems = [{ product: mockProduct, quantity: 1 }];
    localStorage.setItem('goldentier_cart_user-1', JSON.stringify(cartItems));

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <DatabaseProvider>
          <AuthProvider>
            <CartProvider>
              <CheckoutPage />
            </CartProvider>
          </AuthProvider>
        </DatabaseProvider>
      </MemoryRouter>
    );

    // Currently, it does NOT restrict. So we expect to see "Shipping Information"
    // If it WAS restricted, we might see a redirect or an error.
    expect(await screen.findByText(/Shipping Information/i)).toBeInTheDocument();
  });
});
