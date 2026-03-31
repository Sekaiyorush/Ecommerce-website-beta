import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPassword } from '../ForgotPassword';
import React from 'react';

// Supabase is mocked globally in setup.ts

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    isAuthenticated: false,
    isAdmin: false,
    isPartner: false,
    isCustomer: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    validateCode: vi.fn(),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ success: false, error: 'Not found' }),
    updatePassword: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (k: string) => k }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

function renderForgotPassword() {
  return render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );
}

describe('ForgotPassword page', () => {
  it('renders the heading text', () => {
    renderForgotPassword();
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
  });

  it('renders the email input with matching htmlFor/id association', () => {
    renderForgotPassword();
    const label = screen.getByText(/email address/i);
    expect(label).toHaveAttribute('for', 'forgot-email');
    expect(document.getElementById('forgot-email')).toBeInTheDocument();
  });

  it('email input is of type email', () => {
    renderForgotPassword();
    const input = document.getElementById('forgot-email') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('has a submit button labeled "Send Reset Link"', () => {
    renderForgotPassword();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('submit button is of type submit', () => {
    renderForgotPassword();
    expect(screen.getByRole('button', { name: /send reset link/i })).toHaveAttribute('type', 'submit');
  });

  it('has a link back to the login page', () => {
    renderForgotPassword();
    const backLink = screen.getByRole('link', { name: /back to login/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/login');
  });

  it('sets document.title via SEO component', () => {
    renderForgotPassword();
    expect(document.title).toContain('Forgot Password');
  });
});
