import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Research } from '../Research';

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

function renderResearch() {
  return render(
    <MemoryRouter initialEntries={['/research']}>
      <Research />
    </MemoryRouter>
  );
}

describe('Research page', () => {
  it('renders without crashing', () => {
    expect(() => renderResearch()).not.toThrow();
  });

  it('sets document.title via SEO component', () => {
    renderResearch();
    expect(document.title).toContain('Research Standards');
  });

  it('renders the Analytical Excellence heading', () => {
    renderResearch();
    expect(screen.getByRole('heading', { name: /analytical excellence/i })).toBeInTheDocument();
  });
});
