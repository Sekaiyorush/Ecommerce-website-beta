import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { About } from '../About';
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

function renderAbout() {
  return render(
    <MemoryRouter initialEntries={['/about']}>
      <About />
    </MemoryRouter>
  );
}

describe('About page', () => {
  it('renders without crashing', () => {
    expect(() => renderAbout()).not.toThrow();
  });

  it('updates document.title via the SEO component', () => {
    renderAbout();
    expect(document.title).toContain('Golden Tier Peptide');
    expect(document.title).toContain('About');
  });

  it('renders the primary hero heading', () => {
    renderAbout();
    expect(
      screen.getByRole('heading', { name: /elevating scientific discovery/i })
    ).toBeInTheDocument();
  });

  it('renders the "Our Philosophy" section heading', () => {
    renderAbout();
    expect(screen.getByText(/our philosophy/i)).toBeInTheDocument();
  });

  it('renders the four value-pillar cards', () => {
    renderAbout();
    expect(screen.getByText('Uncompromising Quality')).toBeInTheDocument();
    expect(screen.getByText('Elite Standards')).toBeInTheDocument();
    expect(screen.getByText('Dedicated Research')).toBeInTheDocument();
    expect(screen.getByText('Global Network')).toBeInTheDocument();
  });

  it('renders the "Our Purpose" eyebrow label', () => {
    renderAbout();
    expect(screen.getByText(/our purpose/i)).toBeInTheDocument();
  });
});
