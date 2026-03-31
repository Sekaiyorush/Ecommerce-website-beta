import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Terms } from '../Terms';

// Supabase is mocked globally in setup.ts

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

function renderTerms() {
  return render(
    <MemoryRouter>
      <Terms />
    </MemoryRouter>
  );
}

describe('Terms page', () => {
  it('renders without crashing', () => {
    expect(() => renderTerms()).not.toThrow();
  });

  it('sets document.title via SEO component', () => {
    renderTerms();
    expect(document.title).toContain('Terms of Service');
  });

  it('renders the Terms of Service heading', () => {
    renderTerms();
    expect(screen.getByRole('heading', { name: /terms of service/i })).toBeInTheDocument();
  });
});
