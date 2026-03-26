import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { formatTHB } from '@/lib/formatPrice';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingBag,
  Bell,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'commission' | 'network' | 'system';
  message: string;
  timestamp: string;
  read: boolean;
}

interface PartnerStats {
  purchaseVolume: number;
  purchaseChange: number;
  networkSize: number;
  networkGrowth: number;
  monthlyOrders: number;
  ordersChange: number;
  conversionRate: number;
}

export function PartnerAnalytics() {
  const { user } = useAuth();
  const { db } = useDatabase();

  const partnerDetails = db.partners.find(p => p.id === user?.partnerId);
  const partnerOrders = db.orders.filter(o => o.partnerId === user?.partnerId);
  const referredPartners = db.partners.filter(p => p.referredBy === user?.partnerId);

  // Calculate stats using useMemo
  const stats = useMemo<PartnerStats>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current month orders
    const currentMonthOrders = partnerOrders.filter(o => 
      new Date(o.createdAt) >= thirtyDaysAgo
    );
    const previousMonthOrders = partnerOrders.filter(o => 
      new Date(o.createdAt) >= sixtyDaysAgo && new Date(o.createdAt) < thirtyDaysAgo
    );

    // Purchase volume calculation
    const totalPurchases = partnerOrders.reduce((sum, o) => sum + o.total, 0);
    
    // Previous month purchases
    const prevPurchases = previousMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const purchaseChange = prevPurchases > 0 
      ? ((totalPurchases - prevPurchases) / prevPurchases) * 100 
      : 0;

    // Network growth
    const currentNetwork = referredPartners.length;
    const prevNetwork = Math.max(0, currentNetwork - 3);
    const networkGrowth = prevNetwork > 0
      ? ((currentNetwork - prevNetwork) / prevNetwork) * 100
      : 0;

    // Orders change
    const ordersChange = previousMonthOrders.length > 0
      ? ((currentMonthOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100
      : 0;

    // Conversion rate (simplified)
    const conversionRate = referredPartners.length > 0 
      ? (referredPartners.filter(p => p.status === 'active').length / referredPartners.length) * 100
      : 0;

    return {
      purchaseVolume: totalPurchases,
      purchaseChange,
      networkSize: currentNetwork,
      networkGrowth,
      monthlyOrders: currentMonthOrders.length,
      ordersChange,
      conversionRate
    };
  }, [partnerOrders, referredPartners, partnerDetails]);

  // Generate notifications using useMemo
  const notifications = useMemo<Notification[]>(() => {
    const newNotifications: Notification[] = [];
    
    // Recent orders
    partnerOrders.slice(0, 3).forEach(order => {
      newNotifications.push({
        id: `order-${order.id}`,
        type: 'order',
        message: `Order #${order.id} confirmed - ${formatTHB(order.total)}`,
        timestamp: order.createdAt,
        read: false
      });
    });

    // Network updates
    referredPartners.slice(0, 2).forEach(partner => {
      newNotifications.push({
        id: `network-${partner.id}`,
        type: 'network',
        message: `${partner.name} joined your network`,
        timestamp: new Date().toISOString(),
        read: false
      });
    });

    // Sort by timestamp
    newNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return newNotifications.slice(0, 10);
  }, [partnerOrders, referredPartners]);

  // Calculate unread count
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
      case 'commission': return <DollarSign className="h-4 w-4 text-gold-500" />;
      case 'network': return <Users className="h-4 w-4 text-blue-500" />;
      case 'system': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Performance Analytics</h2>
          <p className="text-muted-foreground">Track your growth and purchases</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="relative p-2 text-muted-foreground hover:text-gold-600 hover:bg-gold-50 rounded-xl transition-colors">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <Link 
            to="/products"
            className="hidden sm:flex items-center px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-shadow"
          >
            Quick Order <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-gold-200/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Total Purchases</p>
              <p className="text-3xl font-serif text-foreground">{formatTHB(stats.purchaseVolume)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className={`flex items-center text-sm ${stats.purchaseChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${stats.purchaseChange < 0 && 'rotate-180'}`} />
            <span className="font-medium">{Math.abs(stats.purchaseChange).toFixed(1)}%</span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        </div>

        {/* Network Size */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-gold-200/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Network Size</p>
              <p className="text-3xl font-serif text-foreground">{stats.networkSize}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className={`flex items-center text-sm ${stats.networkGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${stats.networkGrowth < 0 && 'rotate-180'}`} />
            <span className="font-medium">{Math.abs(stats.networkGrowth).toFixed(1)}%</span>
            <span className="text-muted-foreground ml-1">growth</span>
          </div>
        </div>

        {/* Monthly Orders */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-gold-200/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Monthly Orders</p>
              <p className="text-3xl font-serif text-foreground">{stats.monthlyOrders}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className={`flex items-center text-sm ${stats.ordersChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${stats.ordersChange < 0 && 'rotate-180'}`} />
            <span className="font-medium">{Math.abs(stats.ordersChange).toFixed(1)}%</span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-gold-200/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Active Rate</p>
              <p className="text-3xl font-serif text-foreground">{stats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-500/20">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.conversionRate >= 50 ? 'Excellent performance!' : 'Keep recruiting!'}
          </p>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-gold-200/50 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl tracking-tight text-foreground">Recent Updates</h3>
          <button className="text-sm text-gold-600 hover:text-gold-700 font-medium">
            Mark all read
          </button>
        </div>
        <div className="space-y-3">
          {notifications.length > 0 ? notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`flex items-center justify-between p-4 rounded-xl transition-colors ${notification.read ? 'bg-muted' : 'bg-gold-50/50 border border-gold-100/50'}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notification.read ? 'bg-white' : 'bg-white shadow-sm'}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{notification.message}</p>
                  <p className="text-sm text-muted-foreground">{formatTimeAgo(notification.timestamp)}</p>
                </div>
              </div>
              {!notification.read && (
                <span className="w-2 h-2 bg-gold-500 rounded-full"></span>
              )}
            </div>
          )) : (
            <p className="text-muted-foreground text-center py-8">No new notifications</p>
          )}
        </div>
      </div>
    </div>
  );
}
