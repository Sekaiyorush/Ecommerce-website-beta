import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Contact } from '../Contact';
import React from 'react';

// Supabase is mocked globally in setup.ts

vi.mock('@/context/DatabaseContext', () => ({
  useDatabase: () => ({
    db: {
      siteSettings: {
        contactEmail: 'support@goldentierpeptide.com',
        contactPhone: '+1 800 000 0000',
        contactLocation: 'Bangkok, Thailand',
        businessHours: 'Mon–Fri 9am–6pm',
        shippingInfo: 'Worldwide shipping',
        companyName: 'Golden Tier Peptide',
        companyDescription: 'Premium research compounds',
      },
    },
    products: [],
    orders: [],
    loading: false,
    refreshData: vi.fn(),
    logAudit: vi.fn(),
    submitContactForm: vi.fn().mockResolvedValue({ success: true }),
  }),
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

// sonner toast is not installed in jsdom — stub it out
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderContact() {
  return render(
    <MemoryRouter initialEntries={['/contact']}>
      <Contact />
    </MemoryRouter>
  );
}

describe('Contact page', () => {
  it('renders the main heading "Contact Us"', () => {
    renderContact();
    expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument();
  });

  it('sets document.title via SEO component', () => {
    renderContact();
    expect(document.title).toContain('Concierge & Support');
  });

  // ---- Full Name field ----
  it('renders the Full Name input with matching htmlFor/id association', () => {
    renderContact();
    const label = screen.getByText(/full name/i);
    expect(label).toHaveAttribute('for', 'contact-fullName');
    expect(document.getElementById('contact-fullName')).toBeInTheDocument();
  });

  it('Full Name input has aria-invalid attribute', () => {
    renderContact();
    const input = document.getElementById('contact-fullName')!;
    expect(input).toHaveAttribute('aria-invalid');
  });

  // ---- Email field ----
  it('renders the Email Address input with matching htmlFor/id association', () => {
    renderContact();
    const label = screen.getByText(/email address/i);
    expect(label).toHaveAttribute('for', 'contact-email');
    expect(document.getElementById('contact-email')).toBeInTheDocument();
  });

  it('Email input has aria-invalid attribute', () => {
    renderContact();
    const input = document.getElementById('contact-email')!;
    expect(input).toHaveAttribute('aria-invalid');
  });

  // ---- Subject field ----
  it('renders the Subject input with matching htmlFor/id association', () => {
    renderContact();
    const label = screen.getByText(/^subject$/i);
    expect(label).toHaveAttribute('for', 'contact-subject');
    expect(document.getElementById('contact-subject')).toBeInTheDocument();
  });

  it('Subject input has aria-invalid attribute', () => {
    renderContact();
    const input = document.getElementById('contact-subject')!;
    expect(input).toHaveAttribute('aria-invalid');
  });

  // ---- Message field ----
  it('renders the Message textarea with matching htmlFor/id association', () => {
    renderContact();
    const label = screen.getByText(/^message$/i);
    expect(label).toHaveAttribute('for', 'contact-message');
    expect(document.getElementById('contact-message')).toBeInTheDocument();
  });

  it('Message textarea has aria-invalid attribute', () => {
    renderContact();
    const textarea = document.getElementById('contact-message')!;
    expect(textarea).toHaveAttribute('aria-invalid');
  });

  // ---- Submit button ----
  it('has a submit button labeled "Dispatch Message"', () => {
    renderContact();
    expect(screen.getByRole('button', { name: /dispatch message/i })).toBeInTheDocument();
  });

  it('submit button is of type submit', () => {
    renderContact();
    expect(screen.getByRole('button', { name: /dispatch message/i })).toHaveAttribute('type', 'submit');
  });

  // ---- aria-describedby (only set when there are errors; absent by default) ----
  it('Full Name input has no aria-describedby when there are no validation errors', () => {
    renderContact();
    const input = document.getElementById('contact-fullName')!;
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});
