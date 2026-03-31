import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminDashboard } from '../AdminDashboard';
import React from 'react';

// Supabase is mocked globally in setup.ts

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'admin@test.com', name: 'Admin User' },
    profile: { role: 'admin', full_name: 'Admin User', status: 'active' },
    role: 'admin',
    loading: false,
    isAdmin: true,
    isPartner: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/DatabaseContext', () => ({
  useDatabase: () => ({
    db: {
      products: [
        {
          id: '1',
          sku: 'BPC-157',
          name: 'BPC-157',
          price: 2500,
          category: 'Healing',
          purity: '99%',
          stockQuantity: 100,
          description: 'A healing peptide',
          status: 'active',
          variants: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      orders: [
        {
          id: 'ORD-2026-001',
          customerId: 'user-1',
          customerName: 'John Doe',
          items: [],
          total: 2500,
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: '2026-03-01',
          userType: 'partner',
        },
      ],
      partners: [],
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
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn(), t: (key: string) => key }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

// Mock heavy admin sub-pages so only the shell is tested
vi.mock('@/components/admin/DashboardAnalytics', () => ({
  DashboardAnalytics: () => <div data-testid="dashboard-analytics">Dashboard Analytics</div>,
}));

vi.mock('../ProductsManagement', () => ({
  ProductsManagement: () => <div>Products</div>,
}));
vi.mock('../OrdersManagement', () => ({
  OrdersManagement: () => <div>Orders</div>,
}));
vi.mock('../PartnersManagement', () => ({
  PartnersManagement: () => <div>Partners</div>,
}));
vi.mock('../PartnerNetwork', () => ({
  PartnerNetwork: () => <div>Partner Network</div>,
}));
vi.mock('../QRCodeManager', () => ({
  QRCodeManager: () => <div>QR Codes</div>,
}));
vi.mock('../CustomersManagement', () => ({
  CustomersManagement: () => <div>Customers</div>,
}));
vi.mock('../InventoryManagement', () => ({
  InventoryManagement: () => <div>Inventory</div>,
}));
vi.mock('../InvitationCodeManagement', () => ({
  InvitationCodeManagement: () => <div>Invitation Codes</div>,
}));
vi.mock('../PartnerAnalytics', () => ({
  PartnerAnalytics: () => <div>Partner Analytics</div>,
}));
vi.mock('../SettingsManagement', () => ({
  SettingsManagement: () => <div>Settings</div>,
}));
vi.mock('../AuditLogViewer', () => ({
  AuditLogViewer: () => <div>Audit Log</div>,
}));

const originalTitle = document.title;
afterEach(() => {
  document.title = originalTitle;
});

// AdminDashboard uses <Routes> internally with path="/" for the root child.
// Wrapping with a parent route at "/admin/*" makes relative Routes work correctly.
function renderAdminDashboard(initialPath = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminDashboard', () => {
  it('renders without crashing', () => {
    expect(() => renderAdminDashboard()).not.toThrow();
  });

  it('updates document.title via the SEO component', () => {
    renderAdminDashboard();
    expect(document.title).toContain('Admin Dashboard');
  });

  it('renders the main Dashboard heading in the header', () => {
    renderAdminDashboard();
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders the Admin label in the sidebar', () => {
    renderAdminDashboard();
    // The sidebar logo area renders the exact text "Admin" in a <span>
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders a navigation link to the Products sub-page', () => {
    renderAdminDashboard();
    const productsLink = screen.getByRole('link', { name: /products/i });
    expect(productsLink).toBeInTheDocument();
    expect(productsLink).toHaveAttribute('href', '/admin/products');
  });

  it('renders a navigation link to the Orders sub-page', () => {
    renderAdminDashboard();
    const ordersLink = screen.getByRole('link', { name: /orders/i });
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink).toHaveAttribute('href', '/admin/orders');
  });

  it('renders a navigation link to the Partners sub-page', () => {
    renderAdminDashboard();
    const partnersLink = screen.getByRole('link', { name: /^partners$/i });
    expect(partnersLink).toBeInTheDocument();
    expect(partnersLink).toHaveAttribute('href', '/admin/partners');
  });

  it('renders navigation links to all major sub-pages', () => {
    renderAdminDashboard();
    const expectedLabels = [
      'Dashboard',
      'Products',
      'Orders',
      'Inventory',
      'Customers',
      'Partners',
      'Invitation Codes',
      'QR Codes',
      'Audit Log',
      'Settings',
    ];
    for (const label of expectedLabels) {
      expect(screen.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })).toBeInTheDocument();
    }
  });

  it('renders a "VIEW SITE" link that navigates to the home page', () => {
    renderAdminDashboard();
    const viewSiteLink = screen.getByRole('link', { name: /view site/i });
    expect(viewSiteLink).toBeInTheDocument();
    expect(viewSiteLink).toHaveAttribute('href', '/');
  });

  it('renders the DashboardAnalytics component at the root admin route', () => {
    renderAdminDashboard('/admin');
    expect(screen.getByTestId('dashboard-analytics')).toBeInTheDocument();
  });

  it('renders a Logout button in the sidebar', () => {
    renderAdminDashboard();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});
