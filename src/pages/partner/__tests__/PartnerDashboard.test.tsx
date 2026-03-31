import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PartnerDashboard } from '../PartnerDashboard';
import React from 'react';

// Supabase is mocked globally in setup.ts

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'partner-1',
      email: 'partner@test.com',
      name: 'Jane Partner',
      partnerId: 'p-1',
      discountRate: 15,
    },
    profile: { role: 'partner', full_name: 'Jane Partner', status: 'active' },
    isAdmin: false,
    isPartner: true,
    isCustomer: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/DatabaseContext', () => ({
  useDatabase: () => ({
    db: {
      products: [
        {
          id: 'prod-1',
          sku: 'BPC-157',
          name: 'BPC-157',
          price: 2500,
          category: 'Healing',
          purity: '99%',
          stockQuantity: 50,
          description: 'A healing peptide.',
          status: 'active',
          variants: [],
          imageUrl: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      orders: [
        {
          id: 'ORD-2026-001',
          partnerId: 'p-1',
          customerId: 'partner-1',
          customerName: 'Jane Partner',
          items: [{ name: 'BPC-157', quantity: 1, price: 2125 }],
          total: 2125,
          status: 'processing',
          paymentStatus: 'paid',
          createdAt: '2026-03-01',
        },
      ],
      partners: [
        {
          id: 'p-1',
          email: 'partner@test.com',
          name: 'Jane Partner',
          company: 'Research Lab',
          status: 'active',
          referredBy: null,
          discountRate: 15,
        },
      ],
      customers: [],
      invitationCodes: [],
      users: [],
      inventoryLogs: [],
      siteSettings: {},
    },
    isLoading: false,
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
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (k: string) => k }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

// Stub heavy sub-components
vi.mock('../PartnerNetwork', () => ({
  PartnerNetwork: () => <div data-testid="partner-network">Partner Network</div>,
}));

vi.mock('@/components/OrderDetailsModal', () => ({
  OrderDetailsModal: () => <div data-testid="order-details-modal">Order Details</div>,
}));

const originalTitle = document.title;
afterEach(() => {
  document.title = originalTitle;
});

function renderPartnerDashboard() {
  return render(
    <MemoryRouter>
      <PartnerDashboard />
    </MemoryRouter>
  );
}

describe('PartnerDashboard page', () => {
  it('renders without crashing', () => {
    expect(() => renderPartnerDashboard()).not.toThrow();
  });

  it('sets document.title via SEO component', () => {
    renderPartnerDashboard();
    expect(document.title).toContain('Partner Dashboard');
  });

  it('renders the Partner Dashboard heading', () => {
    renderPartnerDashboard();
    expect(screen.getByRole('heading', { name: /partner dashboard/i })).toBeInTheDocument();
  });

  it('displays the partner discount rate badge', () => {
    renderPartnerDashboard();
    expect(screen.getByText(/15%\s*partner advantage/i)).toBeInTheDocument();
  });

  it('renders the overview stats section with Discount Rate label', () => {
    renderPartnerDashboard();
    expect(screen.getByText(/discount rate/i)).toBeInTheDocument();
  });

  it('renders the tab navigation with partner-specific tabs', () => {
    renderPartnerDashboard();
    expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /partner shop/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /my network/i })).toBeInTheDocument();
  });

  it('shows the welcome message with partner name', () => {
    renderPartnerDashboard();
    expect(screen.getByText(/welcome back.*jane partner/i)).toBeInTheDocument();
  });
});
