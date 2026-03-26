import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { SEO } from '@/components/SEO';
import { logger } from '@/lib/logger';
import { formatTHB } from '@/lib/formatPrice';
import {
  Package,
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  Box,
  Eye
} from 'lucide-react';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { ShippingAddresses } from '@/components/ShippingAddresses';
import { formatDate } from '@/lib/formatDate';

export function UserDashboard() {
  const { user } = useAuth();
  const { db, updateCustomer } = useDatabase();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'profile'>('overview');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get user's orders
  const userOrders = db.orders.filter(o => o.customerId === user?.id);

  // Get user profile
  const userProfile = db.customers.find(c => c.email === user?.email) || {
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: undefined,
    totalOrders: userOrders.length,
    totalSpent: userOrders.reduce((sum, o) => sum + o.total, 0),
    joinedAt: '2024-01-01',
    status: 'active'
  };

  const [formData, setFormData] = useState({
    name: userProfile.name,
    phone: userProfile.phone || '',
    street: userProfile.address?.street || '',
    city: userProfile.address?.city || '',
    state: userProfile.address?.state || '',
    zip: userProfile.address?.zip || '',
    country: userProfile.address?.country || '',
  });

  const [saveError, setSaveError] = useState('');

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await updateCustomer(userProfile.id, {
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        }
      });
      setIsEditingProfile(false);
    } catch (e) {
      logger.error(e);
      setSaveError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-blue-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-card py-12 md:py-24 relative overflow-hidden">
      <SEO title="My Account" description="Manage your Golden Tier Peptide account, view order history, update shipping addresses, and edit your profile." />
      {/* Luxury Background Hint */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_rgba(255,255,255,1)_60%)]" />

      <div className="container px-6 max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 border-b border-[#D4AF37]/20 pb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2 tracking-tight">My Account</h1>
          <p className="text-sm text-muted-foreground tracking-wide">Welcome back, {user?.name}</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-8 mb-12">
          {[
            { id: 'overview', label: 'OVERVIEW', icon: Package },
            { id: 'orders', label: 'ORDERS', icon: ShoppingBag },
            { id: 'addresses', label: 'ADDRESSES', icon: MapPin },
            { id: 'profile', label: 'PROFILE', icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'orders' | 'addresses' | 'profile')}
              className={`flex items-center space-x-2 pb-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all relative ${activeTab === tab.id
                ? 'text-[#D4AF37]'
                : 'text-muted-foreground hover:text-[#AA771C]'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#D4AF37]" />
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Stats — Clean */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-8 border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">Total Orders</p>
                    <p className="text-4xl font-serif text-foreground">{userProfile.totalOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-card border border-[#D4AF37]/10 flex items-center justify-center shadow-sm">
                    <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                </div>
              </div>

              <div className="bg-card p-8 border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">Total Spent</p>
                    <p className="text-4xl font-serif text-foreground">{formatTHB(userProfile.totalSpent)}</p>
                  </div>
                  <div className="w-12 h-12 bg-card border border-[#D4AF37]/10 flex items-center justify-center shadow-sm">
                    <CreditCard className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                </div>
              </div>

              <div className="bg-card p-8 border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">Member Since</p>
                    <p className="text-2xl font-serif text-foreground mt-2">{new Date(userProfile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="w-12 h-12 bg-card border border-[#D4AF37]/10 flex items-center justify-center shadow-sm">
                    <User className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders — Clean */}
            <div className="bg-card border border-[#D4AF37]/20 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
              <div className="p-8 border-b border-[#D4AF37]/10 flex items-center justify-between">
                <h3 className="text-2xl font-serif text-foreground tracking-tight">Recent Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground hover:text-[#AA771C] flex items-center transition-colors group"
                >
                  VIEW ALL <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="divide-y divide-[#D4AF37]/10">
                {userOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-muted/50 transition-colors gap-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-12 h-12 bg-card border border-[#D4AF37]/10 flex items-center justify-center shadow-sm">
                        <Box className="h-5 w-5 text-[#AA771C]" />
                      </div>
                      <div>
                        <p className="font-serif text-lg text-foreground">{order.id}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-6 justify-between md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="font-serif text-xl text-foreground">{formatTHB(order.total)}</p>
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 text-[9px] font-bold tracking-[0.2em] uppercase border mt-2 ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                          order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                            'bg-amber-50 text-[#AA771C] border-[#D4AF37]/30'
                          }`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        className="p-3 text-muted-foreground hover:text-[#AA771C] hover:bg-[#D4AF37]/5 transition-colors border border-transparent hover:border-[#D4AF37]/30"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {userOrders.length === 0 && (
                  <div className="p-16 text-center">
                    <ShoppingBag className="h-12 w-12 text-[#D4AF37]/30 mx-auto mb-6" />
                    <p className="text-sm text-muted-foreground mb-6 tracking-wide">No orders yet.</p>
                    <Link to="/products" className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] border-b border-[#D4AF37]/30 pb-1 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all">Start shopping</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab — Clean */}
        {activeTab === 'orders' && (
          <div className="bg-card border border-[#D4AF37]/20 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <div className="p-8 border-b border-[#D4AF37]/10">
              <h3 className="text-2xl font-serif text-foreground tracking-tight">Order History</h3>
            </div>
            <div className="divide-y divide-[#D4AF37]/10">
              {userOrders.map((order) => (
                <div key={order.id} className="p-8">
                  <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                    <div>
                      <p className="font-serif text-lg text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 text-[9px] font-bold tracking-[0.2em] uppercase border ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                      order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                        'bg-amber-50 text-[#AA771C] border-[#D4AF37]/30'
                      }`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </span>
                  </div>
                  <div className="space-y-3 bg-muted border border-[#D4AF37]/10 p-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground tracking-wide">{item.quantity}x <span className="font-semibold text-foreground">{item.name}</span></span>
                        <span className="text-foreground font-medium">{formatTHB(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] hover:text-[#D4AF37] flex items-center transition-colors group"
                    >
                      <Eye className="h-4 w-4 mr-2" /> VIEW DETAILS
                    </button>
                    <span className="font-serif text-xl text-foreground">Total: {formatTHB(order.total)}</span>
                  </div>
                </div>
              ))}
              {userOrders.length === 0 && (
                <div className="p-20 text-center">
                  <ShoppingBag className="h-16 w-16 text-[#D4AF37]/30 mx-auto mb-6" />
                  <p className="text-sm text-muted-foreground tracking-wide mb-6">No orders yet.</p>
                  <Link to="/products" className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] border-b border-[#D4AF37]/30 pb-1 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all">Browse products</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="bg-card border border-[#D4AF37]/20 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <ShippingAddresses />
          </div>
        )}

        {/* Profile Tab — Clean */}
        {activeTab === 'profile' && (
          <div className="bg-card border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <div className="p-8 border-b border-[#D4AF37]/10 flex flex-wrap gap-4 items-center justify-between">
              <h3 className="text-2xl font-serif text-foreground tracking-tight">Profile Information</h3>
              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-6 py-3 border border-[#D4AF37]/30 text-[#AA771C] text-[10px] font-bold tracking-[0.2em] uppercase hover:border-[#D4AF37] transition-colors"
                >
                  EDIT PROFILE
                </button>
              ) : (
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setFormData({
                        name: userProfile.name,
                        phone: userProfile.phone || '',
                        street: userProfile.address?.street || '',
                        city: userProfile.address?.city || '',
                        state: userProfile.address?.state || '',
                        zip: userProfile.address?.zip || '',
                        country: userProfile.address?.country || '',
                      });
                    }}
                    className="px-6 py-3 border border-transparent text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase hover:text-muted-foreground transition-colors"
                    disabled={isSaving}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-8 py-3 bg-[#111] text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors disabled:opacity-50 relative overflow-hidden group border border-[#111] shadow-md"
                    disabled={isSaving}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                    <span className="relative z-10">{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-500 ease-out group-hover:w-full" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-8 space-y-10">
              {saveError && (
                <div className="bg-red-50 text-red-600 p-4 border border-red-200 text-sm">
                  {saveError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">FULL NAME</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    readOnly={!isEditingProfile}
                    className={`w-full px-4 h-12 transition-all text-sm tracking-wide ${isEditingProfile ? 'bg-transparent border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-0 text-foreground' : 'bg-muted border border-transparent text-muted-foreground cursor-not-allowed'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">EMAIL</label>
                  <input
                    type="email"
                    value={userProfile.email}
                    readOnly
                    className="w-full px-4 h-12 bg-muted border border-transparent text-sm tracking-wide text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">PHONE</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    readOnly={!isEditingProfile}
                    className={`w-full px-4 h-12 transition-all text-sm tracking-wide ${isEditingProfile ? 'bg-transparent border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-0 text-foreground' : 'bg-muted border border-transparent text-muted-foreground cursor-not-allowed'}`}
                    placeholder="e.g., +1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="border-t border-[#D4AF37]/10 pt-10">
                <h4 className="text-lg font-serif text-foreground mb-8 flex items-center tracking-tight">
                  <MapPin className="h-5 w-5 mr-3 text-[#D4AF37]" />
                  Shipping Address
                </h4>

                {isEditingProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">STREET ADDRESS</label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full px-4 h-12 bg-transparent border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-0 text-sm tracking-wide text-foreground transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">CITY</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 h-12 bg-transparent border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-0 text-sm tracking-wide text-foreground transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">STATE / PROVINCE</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-4 h-12 bg-transparent border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-0 text-sm tracking-wide text-foreground transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">ZIP / POSTAL CODE</label>
                      <input
                        type="text"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        className="w-full px-4 h-12 bg-transparent border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-0 text-sm tracking-wide text-foreground transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">COUNTRY</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 h-12 bg-transparent border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-0 text-sm tracking-wide text-foreground transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-muted border border-[#D4AF37]/10 shadow-inner">
                    {userProfile.address?.street ? (
                      <address className="not-italic text-muted-foreground leading-relaxed text-sm tracking-wide">
                        {userProfile.address.street}<br />
                        {userProfile.address.city}, {userProfile.address.state} {userProfile.address.zip}<br />
                        {userProfile.address.country}
                      </address>
                    ) : (
                      <p className="text-muted-foreground text-sm">No address saved yet. Click 'EDIT PROFILE' to add one.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedOrderId && (
        <OrderDetailsModal
          order={userOrders.find(o => o.id === selectedOrderId)!}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
