import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Register } from '../Register';
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
    register: vi.fn().mockResolvedValue({ success: false, error: 'Failed' }),
    logout: vi.fn(),
    // validateCode returns invalid by default so the form stays accessible
    validateCode: vi.fn().mockResolvedValue({ valid: false, error: 'Invalid code' }),
    resetPasswordForEmail: vi.fn(),
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

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

describe('Register page', () => {
  it('renders all five registration fields', () => {
    renderRegister();

    // Invitation code (id: register-code)
    expect(document.getElementById('register-code')).toBeInTheDocument();
    // Full name (id: register-name)
    expect(document.getElementById('register-name')).toBeInTheDocument();
    // Email (id: register-email)
    expect(document.getElementById('register-email')).toBeInTheDocument();
    // Password (id: register-password)
    expect(document.getElementById('register-password')).toBeInTheDocument();
    // Confirm password (id: register-confirm)
    expect(document.getElementById('register-confirm')).toBeInTheDocument();
  });

  it('has proper htmlFor/id association for Invitation Code label', () => {
    renderRegister();
    const label = screen.getByText(/invitation code/i);
    expect(label).toHaveAttribute('for', 'register-code');
  });

  it('has proper htmlFor/id association for Full Name label', () => {
    renderRegister();
    const label = screen.getByText('Full Name');
    expect(label).toHaveAttribute('for', 'register-name');
  });

  it('has proper htmlFor/id association for Email label', () => {
    renderRegister();
    // There are two "Email" labels in Register (label text). We want the one that
    // points to register-email. Query by htmlFor attribute directly.
    const emailLabel = document.querySelector('label[for="register-email"]');
    expect(emailLabel).toBeInTheDocument();
  });

  it('has proper htmlFor/id association for Password label', () => {
    renderRegister();
    const label = document.querySelector('label[for="register-password"]');
    expect(label).toBeInTheDocument();
  });

  it('has proper htmlFor/id association for Confirm Password label', () => {
    renderRegister();
    const label = document.querySelector('label[for="register-confirm"]');
    expect(label).toBeInTheDocument();
  });

  it('does not show password strength meter before any typing', () => {
    renderRegister();
    // PasswordStrengthMeter renders null when password is empty
    expect(screen.queryByText(/weak|fair|good|strong/i)).not.toBeInTheDocument();
  });

  it('shows password strength meter after typing in the password field', async () => {
    renderRegister();
    const passwordInput = document.getElementById('register-password') as HTMLInputElement;
    await userEvent.type(passwordInput, 'abc');
    // At least 1 check label from the strength checklist should appear
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows "Strong" strength label for a strong password', async () => {
    renderRegister();
    const passwordInput = document.getElementById('register-password') as HTMLInputElement;
    await userEvent.type(passwordInput, 'MyP@ssw0rd!');
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('has a link back to the login page', () => {
    renderRegister();
    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('renders the Create Account submit button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });
});
