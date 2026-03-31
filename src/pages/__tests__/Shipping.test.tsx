import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Shipping } from '../Shipping';

// Supabase is mocked globally in setup.ts
// Shipping has no context dependencies — no additional mocks required.

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (k: string) => k }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

function renderShipping() {
  return render(
    <MemoryRouter>
      <Shipping />
    </MemoryRouter>
  );
}

describe('Shipping page', () => {
  it('renders without crashing', () => {
    const { container } = renderShipping();
    expect(container).toBeTruthy();
  });

  it('sets document.title via SEO component', () => {
    renderShipping();
    expect(document.title).toContain('Shipping & Returns');
  });

  it('renders the main "Shipping & Returns" heading', () => {
    renderShipping();
    expect(screen.getByRole('heading', { name: /shipping & returns/i })).toBeInTheDocument();
  });

  it('renders the "Logistics Policy" section heading', () => {
    renderShipping();
    expect(screen.getByRole('heading', { name: /logistics policy/i })).toBeInTheDocument();
  });

  it('renders the "Returns & Integrity" section heading', () => {
    renderShipping();
    expect(screen.getByRole('heading', { name: /returns & integrity/i })).toBeInTheDocument();
  });

  it('contains shipping-related content about business days', () => {
    renderShipping();
    const matches = screen.getAllByText(/business days/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
