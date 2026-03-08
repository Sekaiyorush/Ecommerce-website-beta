import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { formatDate } from '@/lib/formatDate';
import { formatTHB } from '@/lib/formatPrice';
import { PartnerNetwork } from './PartnerNetwork';
import {
  Package,
  ShoppingBag,
  Users,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  Box,
  ArrowUpRight,
  UserPlus,
  Eye,
  Percent
} from 'lucide-react';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';

export function PartnerDashboard() {
  const { user } = useAuth();
  const { db } = useDatabase();
  const { orders, partners, products } = db;
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'network' | 'shop'>('overview');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Get partner details
  const partnerDetails = partners.find(p => p.id === user?.partnerId);

  // Get partner's orders
  const partnerOrders = orders.filter(o => o.partnerId === user?.partnerId);

  // Get referred partners (downline)
  const referredPartners = partners.filter(p => p.referredBy === user?.partnerId);

  // Get partner's referrer (upline)
  const referrer = partnerDetails?.referredBy
    ? partners.find(p => p.id === partnerDetails.referredBy)
    : null;

  // Calculate stats
  const totalPurchases = partnerOrders.reduce((sum, o) => sum + o.total, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-blue-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  // Calculate discounted price
  const getDiscountedPrice = (price: number) => {
    if (user?.discountRate) {
      return price * (1 - user.discountRate / 100);
    }
    return price;
  };

  return (
    <div className="min-h-screen bg-white py-12 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.03)_0%,_rgba(255,255,255,1)_60%)]" />
      <div className="container px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 border-b border-[#D4AF37]/20 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 tracking-tight mb-2">Partner Dashboard</h1>
            <p className="text-sm text-slate-400 tracking-wide">Welcome back, {user?.name}</p>
          </div>
          <span className="px-6 py-2.5 bg-[#111] text-white border border-[#111] text-[10px] font-bold tracking-[0.2em] uppercase shadow-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
            <span className="relative z-10">{user?.discountRate}% PARTNER ADVANTAGE</span>
          </span>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-8 mb-12 border-b border-[#D4AF37]/20 pb-4">
          {[
            { id: 'overview', label: 'OVERVIEW', icon: Package },
            { id: 'shop', label: 'PARTNER SHOP', icon: ShoppingBag },
            { id: 'orders', label: 'ORDERS', icon: Box },
            { id: 'network', label: 'MY NETWORK', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'orders' | 'network' | 'shop')}
              className={`flex items-center space-x-2 pb-2 text-[10px] font-bold tracking-[0.2em] transition-all relative ${activeTab === tab.id
                ? 'text-[#D4AF37]'
                : 'text-slate-400 hover:text-[#AA771C]'
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
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">Discount Rate</p>
                    <p className="text-4xl font-serif text-slate-900">{user?.discountRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-white border border-[#D4AF37]/10 flex items-center justify-center shadow-sm">
                    <Percent className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">Total Purchases</p>
                    <p className="text-4xl font-serif text-slate-900">{formatTHB(totalPurchases)}</p>
                  </div>
                  <div className="w-12 h-12 bg-white border border-[#D4AF37]/10 flex items-center justify-center shadow-sm">
                    <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">Network Size</p>
                    <p className="text-4xl font-serif text-slate-900">{referredPartners.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#111] flex items-center justify-center shadow-sm border border-[#222]">
                    <Users className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              {/* Recent Orders */}
              <div className="bg-white border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="p-8 border-b border-[#D4AF37]/10 flex items-center justify-between">
                  <h3 className="text-2xl font-serif text-slate-900 tracking-tight">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 hover:text-[#AA771C] flex items-center transition-colors group"
                  >
                    VIEW ALL <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="divide-y divide-[#D4AF37]/10">
                  {partnerOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white border border-[#D4AF37]/10 flex items-center justify-center shadow-sm">
                          <Box className="h-5 w-5 text-[#AA771C]" />
                        </div>
                        <div>
                          <p className="font-serif text-lg text-slate-900">{order.id}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-serif text-xl text-slate-900">{formatTHB(order.total)}</p>
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
                          className="p-3 text-slate-400 hover:text-[#AA771C] hover:bg-[#D4AF37]/5 transition-colors border border-transparent hover:border-[#D4AF37]/30"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {partnerOrders.length === 0 && (
                    <div className="p-16 text-center">
                      <ShoppingBag className="h-12 w-12 text-[#D4AF37]/30 mx-auto mb-6" />
                      <p className="text-sm text-slate-500 mb-6 tracking-wide">No orders yet.</p>
                      <button onClick={() => setActiveTab('shop')} className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] hover:text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1 hover:border-[#D4AF37] transition-all">Start shopping</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Network Preview */}
              <div className="bg-white border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="p-8 border-b border-[#D4AF37]/10 flex items-center justify-between">
                  <h3 className="text-2xl font-serif text-slate-900 tracking-tight">My Network</h3>
                  <button
                    onClick={() => setActiveTab('network')}
                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 hover:text-[#AA771C] flex items-center transition-colors group"
                  >
                    VIEW ALL <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="p-8">
                  {referrer && (
                    <div className="mb-8 p-6 bg-slate-50 border border-[#D4AF37]/10 shadow-inner">
                      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-4">My Referrer</p>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white border border-[#D4AF37]/30 flex items-center justify-center">
                          <span className="text-[#D4AF37] font-serif text-lg">{(referrer.name || referrer.email || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-serif text-xl tracking-tight text-slate-900">{referrer.name || referrer.email}</p>
                          <p className="text-sm text-slate-500 mt-1">{referrer.company}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-6">My Referrals ({referredPartners.length})</p>
                    {referredPartners.length > 0 ? (
                      <div className="space-y-6">
                        {referredPartners.slice(0, 3).map((p) => (
                          <div key={p.id} className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white border border-[#D4AF37]/10 flex items-center justify-center shadow-sm">
                              <span className="text-slate-400 font-serif">{(p.name || p.email || '?').charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-serif text-lg text-slate-900 leading-tight">{p.name || p.email}</p>
                              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{p.company}</p>
                            </div>
                            <span className={`px-3 py-1 text-[9px] font-bold tracking-[0.2em] uppercase border ${p.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                              p.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <UserPlus className="h-10 w-10 text-[#D4AF37]/30 mx-auto mb-4" />
                        <p className="text-sm text-slate-500 tracking-wide">No referrals yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Partner Shop Tab */}
        {activeTab === 'shop' && (
          <div className="space-y-12">
            <div className="bg-[#111] p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-2xl border border-[#222]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
              <div className="flex items-center space-x-6 relative z-10 mb-6 md:mb-0">
                <div className="w-16 h-16 bg-white flex items-center justify-center shadow-lg">
                  <Percent className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <span className="text-slate-300 text-lg tracking-wide font-light">Your Exclusive Advantage: <span className="text-[#D4AF37] font-serif text-3xl ml-2">{user?.discountRate}%</span></span>
              </div>
              <Link
                to="/products"
                className="bg-white text-[#111] hover:bg-slate-50 px-8 py-4 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center transition-all shadow-md relative z-10 border border-transparent hover:border-[#D4AF37]/30"
              >
                BROWSE CATALOG <ArrowUpRight className="h-4 w-4 ml-2" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="bg-white border border-[#D4AF37]/20 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(212,175,55,0.08)] transition-all duration-500 hover:-translate-y-2 group flex flex-col">
                  <div className="aspect-[4/3] bg-white flex items-center justify-center p-8 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.05)_0%,_rgba(255,255,255,0)_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain filter contrast-125" />
                    ) : (
                      <div className="w-20 h-20 bg-slate-50 border border-[#D4AF37]/10 flex items-center justify-center shadow-inner">
                        <span className="text-slate-400 font-serif">{product.name.split('-')[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-8 border-t border-[#D4AF37]/10 flex flex-col flex-1">
                    <h3 className="font-serif text-2xl tracking-tight text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#AA771C] group-hover:to-[#D4AF37] transition-all">{product.name}</h3>
                    <p className="text-sm text-slate-500 mt-3 tracking-wide leading-relaxed line-clamp-2 flex-1">{product.description}</p>
                    <div className="mt-8 flex items-end justify-between pt-6 border-t border-[#D4AF37]/10">
                      <div>
                        <p className="text-xs text-slate-400 line-through mb-1 tracking-wide">{formatTHB(product.price)}</p>
                        <p className="text-2xl font-serif text-[#D4AF37]">{formatTHB(getDiscountedPrice(product.price))}</p>
                      </div>
                      <span className="px-3 py-1 bg-[#111] text-[#D4AF37] text-[9px] font-bold tracking-[0.2em] uppercase border border-[#D4AF37]/30 shadow-md">
                        SAVE {formatTHB(product.price - getDiscountedPrice(product.price))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-[#D4AF37]/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <div className="p-8 md:p-10 border-b border-[#D4AF37]/10">
              <h3 className="text-3xl font-serif text-slate-900 tracking-tight">Order History</h3>
            </div>
            <div className="divide-y divide-[#D4AF37]/10">
              {partnerOrders.map((order) => (
                <div key={order.id} className="p-8 md:p-10 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-[#AA771C] uppercase mb-2">{order.id}</p>
                      <p className="text-sm font-light text-slate-500 tracking-wide">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`inline-flex items-center space-x-2 px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                      order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                        'bg-amber-50 text-[#AA771C] border-[#D4AF37]/30'
                      }`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </span>
                  </div>
                  <div className="space-y-4 bg-white p-6 border border-[#D4AF37]/10 shadow-inner">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-light tracking-wide">{item.quantity}x <span className="font-serif text-lg text-slate-900 ml-2">{item.name}</span></span>
                        <span className="text-[#D4AF37] font-serif text-lg">{formatTHB(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex items-center justify-between pt-6 border-t border-[#D4AF37]/10">
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 hover:text-[#AA771C] flex items-center group transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" /> VIEW TRACKING
                    </button>
                    <span className="font-serif text-3xl text-slate-900 tracking-tight">{formatTHB(order.total)}</span>
                  </div>
                </div>
              ))}
              {partnerOrders.length === 0 && (
                <div className="p-20 text-center">
                  <ShoppingBag className="h-16 w-16 text-[#D4AF37]/30 mx-auto mb-6" />
                  <p className="text-slate-500 mb-6 font-light text-lg tracking-wide">No acquisitions recorded yet.</p>
                  <button onClick={() => setActiveTab('shop')} className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] hover:text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1 hover:border-[#D4AF37] transition-all">Access Partner Shop</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <PartnerNetwork />
        )}
      </div>

      {/* Modals */}
      {selectedOrderId && (
        <OrderDetailsModal
          order={partnerOrders.find(o => o.id === selectedOrderId)!}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
