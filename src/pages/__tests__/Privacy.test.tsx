import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Privacy } from '../Privacy';

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

function renderPrivacy() {
  return render(
    <MemoryRouter>
      <Privacy />
    </MemoryRouter>
  );
}

describe('Privacy page', () => {
  it('renders without crashing', () => {
    expect(() => renderPrivacy()).not.toThrow();
  });

  it('sets document.title via SEO component', () => {
    renderPrivacy();
    expect(document.title).toContain('Privacy Policy');
  });

  it('renders the Privacy Policy heading', () => {
    renderPrivacy();
    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
  });
});
