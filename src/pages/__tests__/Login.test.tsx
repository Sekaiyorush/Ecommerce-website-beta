import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';
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
    login: vi.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' }),
    register: vi.fn(),
    logout: vi.fn(),
    validateCode: vi.fn(),
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

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login page', () => {
  it('renders email and password input fields', () => {
    renderLogin();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    // password input is type="password" so not found via textbox role — use id
    expect(document.getElementById('login-password')).toBeInTheDocument();
  });

  it('has proper htmlFor/id label associations for email field', () => {
    renderLogin();
    const emailLabel = screen.getByText('Email');
    expect(emailLabel).toHaveAttribute('for', 'login-email');
    expect(document.getElementById('login-email')).toBeInTheDocument();
  });

  it('has proper htmlFor/id label association for password field', () => {
    renderLogin();
    const passwordLabel = screen.getByText('Password');
    expect(passwordLabel).toHaveAttribute('for', 'login-password');
    expect(document.getElementById('login-password')).toBeInTheDocument();
  });

  it('renders the password visibility toggle button', () => {
    renderLogin();
    expect(
      screen.getByRole('button', { name: /show password/i })
    ).toBeInTheDocument();
  });

  it('toggles password field type when visibility button is clicked', async () => {
    renderLogin();
    const passwordInput = document.getElementById('login-password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    await userEvent.click(toggleBtn);

    expect(passwordInput.type).toBe('text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
  });

  it('has a link to the forgot password page', () => {
    renderLogin();
    const forgotLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });

  it('has a link to the register page', () => {
    renderLogin();
    // "Apply Now" links to /register
    const registerLink = screen.getByRole('link', { name: /apply now/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('renders a submit button labeled "Sign In"', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submit button is of type submit', () => {
    renderLogin();
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    expect(submitBtn).toHaveAttribute('type', 'submit');
  });
});
