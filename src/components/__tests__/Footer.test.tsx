import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../Footer';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ data: [], error: null }) }) },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com' },
    profile: { role: 'customer', full_name: 'Test User' },
    role: 'customer',
    loading: false,
    isAdmin: false,
    isPartner: false,
  }),
}));

vi.mock('@/context/DatabaseContext', () => ({
  useDatabase: () => ({
    db: {
      siteSettings: {
        companyName: 'Golden Tier Peptide',
        contactEmail: '',
        contactPhone: '',
        contactLocation: '',
        businessHours: '',
        shippingInfo: '',
        companyDescription: '',
      },
    },
    products: [],
    orders: [],
    loading: false,
    refreshData: vi.fn(),
    logAudit: vi.fn(),
  }),
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: [],
    addItem: vi.fn(),
    total: 0,
    itemCount: 0,
    isOpen: false,
    setIsOpen: vi.fn(),
  }),
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('Footer', () => {
  it('renders copyright text with brand name', () => {
    renderFooter();
    expect(screen.getByText(/golden tier peptide/i)).toBeInTheDocument();
  });

  it('renders copyright symbol and current year', () => {
    renderFooter();
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`©.*${year}`, 'i'))).toBeInTheDocument();
  });

  it('has a Footer Navigation landmark', () => {
    renderFooter();
    expect(screen.getByRole('navigation', { name: 'Footer Navigation' })).toBeInTheDocument();
  });

  it('renders all expected footer nav links', () => {
    renderFooter();
    const nav = screen.getByRole('navigation', { name: 'Footer Navigation' });
    const links = nav.querySelectorAll('a');
    const labels = Array.from(links).map((a) => a.textContent?.trim());
    expect(labels).toContain('Products');
    expect(labels).toContain('About');
    expect(labels).toContain('Research');
    expect(labels).toContain('Contact');
    expect(labels).toContain('Terms');
    expect(labels).toContain('Privacy');
  });

  it('footer links point to the correct paths', () => {
    renderFooter();
    const nav = screen.getByRole('navigation', { name: 'Footer Navigation' });
    const productsLink = nav.querySelector('a[href="/products"]');
    expect(productsLink).toBeInTheDocument();
    const privacyLink = nav.querySelector('a[href="/privacy"]');
    expect(privacyLink).toBeInTheDocument();
  });

  it('renders the disclaimer blurb', () => {
    renderFooter();
    expect(screen.getByText(/for research purposes only/i)).toBeInTheDocument();
  });
});
