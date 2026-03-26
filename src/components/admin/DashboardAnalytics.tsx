import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '@/context/DatabaseContext';
import { supabase } from '@/lib/supabase';
import { formatTHB } from '@/lib/formatPrice';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Package,
  Users,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'order' | 'user' | 'inventory' | 'partner';
  message: string;
  timestamp: string;
  read: boolean;
}

interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  newCustomers: number;
  customersChange: number;
  lowStockCount: number;
}

export function DashboardAnalytics() {
  const { db, isLoading } = useDatabase();

  // Calculate stats using useMemo instead of useEffect to avoid cascading renders
  const stats = useMemo<DashboardStats>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current month orders
    const currentMonthOrders = db.orders.filter(o => 
      new Date(o.createdAt) >= thirtyDaysAgo
    );
    const previousMonthOrders = db.orders.filter(o => 
      new Date(o.createdAt) >= sixtyDaysAgo && new Date(o.createdAt) < thirtyDaysAgo
    );

    // Revenue
    const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = previousMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Orders change
    const ordersChange = previousMonthOrders.length > 0
      ? ((currentMonthOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100
      : 0;

    // New customers
    const currentCustomers = db.customers.filter(c => 
      new Date(c.joinedAt) >= thirtyDaysAgo
    ).length;
    const previousCustomers = db.customers.filter(c => 
      new Date(c.joinedAt) >= sixtyDaysAgo && new Date(c.joinedAt) < thirtyDaysAgo
    ).length;
    const customersChange = previousCustomers > 0
      ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
      : 0;

    // Low stock
    const lowStockCount = db.products.filter(p => 
      p.stockQuantity < (p.lowStockThreshold || 10)
    ).length;

    return {
      totalRevenue: currentRevenue,
      revenueChange,
      totalOrders: currentMonthOrders.length,
      ordersChange,
      newCustomers: currentCustomers,
      customersChange,
      lowStockCount
    };
  }, [db.orders, db.customers, db.products]);

  // Generate initial activities
  const initialActivities = useMemo<Activity[]>(() => {
    const newActivities: Activity[] = [];
    
    // Recent orders
    db.orders.slice(0, 5).forEach(order => {
      newActivities.push({
        id: `order-${order.id}`,
        type: 'order',
        message: `New order #${order.id} for ${formatTHB(order.total)}`,
        timestamp: order.createdAt,
        read: false
      });
    });

    // Low stock alerts
    db.products
      .filter(p => p.stockQuantity < (p.lowStockThreshold || 10))
      .slice(0, 3)
      .forEach(product => {
        newActivities.push({
          id: `stock-${product.id}`,
          type: 'inventory',
          message: `Low stock alert: ${product.name} (${product.stockQuantity} units left)`,
          timestamp: new Date().toISOString(),
          read: false
        });
      });

    // Sort by timestamp
    newActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return newActivities.slice(0, 10);
  }, [db.orders, db.products]);

  // Initialize state with computed values
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [unreadCount, setUnreadCount] = useState(() => initialActivities.filter(a => !a.read).length);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        // Refresh activities when new order comes in
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as { id: string; total: number; created_at: string };
          const newActivity: Activity = {
            id: `order-${newOrder.id}`,
            type: 'order',
            message: `New order #${newOrder.id} for ${formatTHB(Number(newOrder.total))}`,
            timestamp: newOrder.created_at,
            read: false
          };
          setActivities(prev => [newActivity, ...prev].slice(0, 10));
          setUnreadCount(c => c + 1);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case 'inventory': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'user': return <Users className="h-4 w-4 text-blue-500" />;
      case 'partner': return <CheckCircle className="h-4 w-4 text-purple-500" />;
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with notifications */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground">Real-time business insights</p>
        </div>
        <button className="relative p-2 text-muted-foreground hover:text-gold-600 hover:bg-gold-50 rounded-xl transition-colors">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Stats Grid — Clean */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">30-Day Revenue</p>
              <p className="text-2xl font-semibold text-foreground">{formatTHB(stats.totalRevenue)}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          {stats.revenueChange === 0 && stats.totalRevenue > 0 ? (
            <div className="flex items-center text-sm text-blue-600">
              <span className="px-2 py-0.5 bg-blue-100 rounded-full text-xs font-medium">New</span>
              <span className="text-muted-foreground ml-2">first month</span>
            </div>
          ) : (
            <div className={`flex items-center text-sm ${stats.revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.revenueChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span className="font-medium">{Math.abs(stats.revenueChange).toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Orders</p>
              <p className="text-2xl font-semibold text-foreground">{stats.totalOrders}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          {stats.ordersChange === 0 && stats.totalOrders > 0 ? (
            <div className="flex items-center text-sm text-blue-600">
              <span className="px-2 py-0.5 bg-blue-100 rounded-full text-xs font-medium">New</span>
              <span className="text-muted-foreground ml-2">first month</span>
            </div>
          ) : (
            <div className={`flex items-center text-sm ${stats.ordersChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.ordersChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span className="font-medium">{Math.abs(stats.ordersChange).toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          )}
        </div>

        {/* New Customers */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">New Customers</p>
              <p className="text-2xl font-semibold text-foreground">{stats.newCustomers}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          {stats.customersChange === 0 && stats.newCustomers > 0 ? (
            <div className="flex items-center text-sm text-blue-600">
              <span className="px-2 py-0.5 bg-blue-100 rounded-full text-xs font-medium">New</span>
              <span className="text-muted-foreground ml-2">first month</span>
            </div>
          ) : (
            <div className={`flex items-center text-sm ${stats.customersChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.customersChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span className="font-medium">{Math.abs(stats.customersChange).toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className={`p-6 rounded-xl border ${stats.lowStockCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-card border-border'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Low Stock Alerts</p>
              <p className={`text-2xl font-semibold ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-foreground'}`}>{stats.lowStockCount}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.lowStockCount > 0 ? 'bg-amber-100' : 'bg-muted'}`}>
              <AlertCircle className={`h-5 w-5 ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.lowStockCount > 0 ? 'Products need attention' : 'All stock levels healthy'}
          </p>
        </div>
      </div>

      {/* Activity Feed & Quick Actions — Clean */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <Link to="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {activities.length > 0 ? activities.map((activity) => (
              <div key={activity.id} className={`flex items-center justify-between p-3 rounded-lg ${activity.read ? 'bg-muted' : 'bg-muted'}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center border border-border">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{activity.message}</p>
                    <p className="text-sm text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
                {!activity.read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/admin/products/new" className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium text-foreground">Add New Product</span>
            </Link>
            <Link to="/admin/orders" className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium text-foreground">View Orders</span>
            </Link>
            <Link to="/admin/invitation-codes" className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium text-foreground">Generate Invite Code</span>
            </Link>
            {stats.lowStockCount > 0 && (
              <Link to="/admin/inventory" className="flex items-center space-x-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <span className="font-medium text-amber-700">Restock Inventory ({stats.lowStockCount})</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
