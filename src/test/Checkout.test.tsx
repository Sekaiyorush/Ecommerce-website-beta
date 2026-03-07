import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from '../pages/Checkout';
import { DatabaseProvider } from '../context/DatabaseContext';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <DatabaseProvider>
      <AuthProvider>
        <CartProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </CartProvider>
      </AuthProvider>
    </DatabaseProvider>
  </MemoryRouter>
);

describe('CheckoutPage', () => {
  it('renders empty cart state initially', async () => {
    render(
      <TestWrapper>
        <CheckoutPage />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    });
  });
});
