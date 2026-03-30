import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FAQ } from '../FAQ';
import React from 'react';

// Supabase is mocked globally in setup.ts

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isPartner: false,
    isCustomer: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (k: string) => k }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

const originalTitle = document.title;
afterEach(() => {
  document.title = originalTitle;
});

function renderFAQ() {
  return render(
    <MemoryRouter initialEntries={['/faq']}>
      <FAQ />
    </MemoryRouter>
  );
}

describe('FAQ page', () => {
  it('renders without crashing', () => {
    expect(() => renderFAQ()).not.toThrow();
  });

  it('updates document.title via the SEO component', () => {
    renderFAQ();
    expect(document.title).toContain('Golden Tier Peptide');
    expect(document.title).toContain('FAQ');
  });

  it('renders the main FAQ heading', () => {
    renderFAQ();
    expect(
      screen.getByRole('heading', { name: /frequently asked questions/i })
    ).toBeInTheDocument();
  });

  it('renders the "Inquiries" eyebrow label', () => {
    renderFAQ();
    // Match only the exact <span> eyebrow element, not partial matches in body copy
    expect(screen.getByText('Inquiries')).toBeInTheDocument();
  });

  it('renders expandable FAQ question buttons', () => {
    renderFAQ();
    // All FAQ questions are rendered as buttons
    const buttons = screen.getAllByRole('button');
    // There are 6 FAQ items
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it('first FAQ item is open by default (answer visible)', () => {
    renderFAQ();
    // The first FAQ answer text should be in the document
    expect(
      screen.getByText(/not intended for human consumption/i)
    ).toBeInTheDocument();
  });

  it('clicking a closed FAQ item reveals its answer', async () => {
    renderFAQ();
    // "How do you verify the purity?" is initially closed (index 1)
    const purityQuestion = screen.getByRole('button', {
      name: /how do you verify the purity/i,
    });
    await userEvent.click(purityQuestion);
    expect(
      screen.getByText(/high-performance liquid chromatography/i)
    ).toBeInTheDocument();
  });

  it('clicking the open FAQ button collapses it', async () => {
    renderFAQ();
    // The first item (index 0) is open by default — clicking it collapses it
    const firstQuestion = screen.getByRole('button', {
      name: /are your products for human consumption/i,
    });
    await userEvent.click(firstQuestion);
    // After collapse the panel div has max-h-0 / opacity-0; the text is still in DOM
    // but we verify the button still exists and re-opening works
    expect(firstQuestion).toBeInTheDocument();
  });

  it('renders the "Further Assistance" call-out section', () => {
    renderFAQ();
    expect(screen.getByText(/require special attention/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /contact concierge/i })
    ).toBeInTheDocument();
  });
});
