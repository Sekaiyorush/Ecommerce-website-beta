import { useState } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SEO } from '@/components/SEO';
import {
  LayoutDashboard,
  Package,
  Users,
  QrCode,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  UserCircle,
  Network,
  Link as LinkIcon,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react';

// Admin sub-pages
import { ProductsManagement } from './ProductsManagement';
import { PartnersManagement } from './PartnersManagement';
import { PartnerNetwork } from './PartnerNetwork';
import { QRCodeManager } from './QRCodeManager';
import { OrdersManagement } from './OrdersManagement';
import { CustomersManagement } from './CustomersManagement';
import { InventoryManagement } from './InventoryManagement';
import { InvitationCodeManagement } from './InvitationCodeManagement';
import { PartnerAnalytics } from './PartnerAnalytics';
import { SettingsManagement } from './SettingsManagement';
import { AuditLogViewer } from './AuditLogViewer';
import { DashboardAnalytics } from '@/components/admin/DashboardAnalytics';

export function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/admin/inventory', label: 'Inventory', icon: Package },
    { path: '/admin/customers', label: 'Customers', icon: UserCircle },
    { path: '/admin/partners', label: 'Partners', icon: Users },
    { path: '/admin/partner-network', label: 'Partner Network', icon: Network },
    { path: '/admin/partner-analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/invitation-codes', label: 'Invitation Codes', icon: LinkIcon },
    { path: '/admin/qr-codes', label: 'QR Codes', icon: QrCode },
    { path: '/admin/audit-log', label: 'Audit Log', icon: Shield },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-card flex relative">
      <SEO title="Admin Dashboard | Golden Tier" description="Manage products, partners, orders, and settings for Golden Tier Peptide." />
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(212,175,55,0.03)_0%,_transparent_80%)]" />

      {/* Sidebar — Luxury */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-[#D4AF37]/20 transform transition-transform duration-300 shadow-[0_0_40px_rgba(0,0,0,0.02)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="h-full flex flex-col relative z-20">
          {/* Logo */}
          <div className="p-6 border-b border-[#D4AF37]/20">
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/brand-logo-gold.png" alt="Logo" className="h-12 w-auto group-hover:scale-105 transition-transform duration-500" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#AA771C] font-bold">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300 border ${location.pathname === item.path
                  ? 'bg-[#111] text-[#D4AF37] border-[#D4AF37]/30 shadow-md'
                  : 'text-muted-foreground hover:text-[#AA771C] hover:bg-muted hover:border-[#D4AF37]/10 border-transparent'
                  }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-[#D4AF37]/20 bg-card">
            <div className="flex items-center space-x-3 p-3 border border-[#D4AF37]/10 mb-3 shadow-sm">
              <div className="w-8 h-8 bg-card border border-[#D4AF37]/30 flex items-center justify-center">
                <span className="text-[#D4AF37] font-serif text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-foreground text-sm truncate">{user?.name}</p>
                <p className="text-[9px] tracking-widest text-muted-foreground truncate uppercase">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center space-x-3 w-full px-4 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground hover:text-[#AA771C] transition-colors border border-transparent hover:border-[#D4AF37]/30 hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-md border-b border-[#D4AF37]/20 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-muted-foreground hover:text-[#AA771C] transition-colors"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-2xl font-serif text-foreground hidden sm:block tracking-tight">Dashboard</h1>
          <Link
            to="/"
            className="px-6 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all duration-300"
          >
            VIEW SITE
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 md:p-12 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardAnalytics />} />
            <Route path="/products" element={<ProductsManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/orders" element={<OrdersManagement />} />
            <Route path="/customers" element={<CustomersManagement />} />
            <Route path="/partners" element={<PartnersManagement />} />
            <Route path="/partner-network" element={<PartnerNetwork />} />
            <Route path="/partner-analytics" element={<PartnerAnalytics />} />
            <Route path="/invitation-codes" element={<InvitationCodeManagement />} />
            <Route path="/qr-codes" element={<QRCodeManager />} />
            <Route path="/audit-log" element={<AuditLogViewer />} />
            <Route path="/settings" element={<SettingsManagement />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
