import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResetPassword } from '../ResetPassword';
import React from 'react';

// Supabase is mocked globally in setup.ts — getSession returns { session: null }
// which triggers the "link expired" error state; we override it here to return a
// live session so the form renders normally.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

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
    resetPasswordForEmail: vi.fn(),
    updatePassword: vi.fn().mockResolvedValue({ success: true }),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (k: string) => k }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

function renderResetPassword() {
  return render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  );
}

describe('ResetPassword page', () => {
  it('renders the heading text', () => {
    renderResetPassword();
    expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();
  });

  it('renders the new password input with matching htmlFor/id association', () => {
    renderResetPassword();
    const label = screen.getByText(/^new password$/i);
    expect(label).toHaveAttribute('for', 'reset-password');
    expect(document.getElementById('reset-password')).toBeInTheDocument();
  });

  it('new password input is of type password', () => {
    renderResetPassword();
    const input = document.getElementById('reset-password') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('renders the confirm password input with matching htmlFor/id association', () => {
    renderResetPassword();
    const label = screen.getByText(/confirm password/i);
    expect(label).toHaveAttribute('for', 'reset-confirm');
    expect(document.getElementById('reset-confirm')).toBeInTheDocument();
  });

  it('confirm password input is of type password', () => {
    renderResetPassword();
    const input = document.getElementById('reset-confirm') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('has a submit button labeled "Update Password"', () => {
    renderResetPassword();
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
  });

  it('submit button is of type submit', () => {
    renderResetPassword();
    expect(screen.getByRole('button', { name: /update password/i })).toHaveAttribute('type', 'submit');
  });

  it('sets document.title via SEO component', () => {
    renderResetPassword();
    expect(document.title).toContain('Reset Password');
  });
});
