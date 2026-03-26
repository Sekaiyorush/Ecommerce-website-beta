import React, { useState } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import { type Order } from '@/data/products';
import { formatDate } from '@/lib/formatDate';
import { formatTHB } from '@/lib/formatPrice';
import { TableRowSkeleton } from '@/components/skeletons/TableRowSkeleton';
import { OrderNotes } from '@/components/admin/OrderNotes';
import { BulkActionToolbar } from '@/components/admin/BulkActionToolbar';
import {
  Search,
  Filter,
  Package,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Download
} from 'lucide-react';
import { SEO } from '@/components/SEO';

export function OrdersManagement() {
  const { db, updateOrder: contextUpdateOrder, isLoading } = useDatabase();
  const orders = db.orders;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const bulkUpdateStatus = (status: Order['status']) => {
    selectedOrders.forEach(id => {
      contextUpdateOrder(id, { status });
    });
    setSelectedOrders(new Set());
  };

  const bulkExportCSV = () => {
    const selected = orders.filter(o => selectedOrders.has(o.id));
    const csv = [
      ['Order ID', 'Customer', 'Date', 'Total', 'Status', 'Payment'].join(','),
      ...selected.map(o =>
        [o.id, o.customerName, o.createdAt, o.total.toFixed(2), o.status, o.paymentStatus].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-foreground';
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    contextUpdateOrder(orderId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <SEO title="Orders | Admin" description="View and manage all customer orders." />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Orders Management</h2>
          <p className="text-muted-foreground">View and manage customer orders</p>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActionToolbar
        selectedCount={selectedOrders.size}
        totalCount={filteredOrders.length}
        onClearSelection={() => setSelectedOrders(new Set())}
        onSelectAll={() => setSelectedOrders(new Set(filteredOrders.map(o => o.id)))}
        actions={[
          {
            label: 'Mark Processing',
            icon: <Clock className="h-3 w-3" />,
            onClick: () => bulkUpdateStatus('processing'),
          },
          {
            label: 'Mark Shipped',
            icon: <Truck className="h-3 w-3" />,
            onClick: () => bulkUpdateStatus('shipped'),
          },
          {
            label: 'Mark Delivered',
            icon: <CheckCircle2 className="h-3 w-3" />,
            onClick: () => bulkUpdateStatus('delivered'),
          },
          {
            label: 'Export CSV',
            icon: <Download className="h-3 w-3" />,
            onClick: bulkExportCSV,
          },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, color: 'text-foreground' },
          { label: 'Pending', value: orders.filter((o) => o.status === 'pending').length, color: 'text-orange-600' },
          { label: 'Processing', value: orders.filter((o) => o.status === 'processing').length, color: 'text-yellow-600' },
          { label: 'Shipped', value: orders.filter((o) => o.status === 'shipped').length, color: 'text-blue-600' },
          { label: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length, color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-background p-4 rounded-lg border border-border text-center">
            <p className="text-2xl font-bold {stat.color}">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders by ID, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg bg-background focus:ring-primary focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-alt">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                    onChange={toggleAllOrders}
                    className="rounded border-border text-foreground focus:ring-slate-200"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Order ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Payment</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <TableRowSkeleton columns={8} rows={5} />
              ) : filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className={`hover:bg-surface-alt/50 ${selectedOrders.has(order.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-border text-foreground focus:ring-slate-200"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{order.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatTHB(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                          className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => contextUpdateOrder(order.id, { paymentStatus: e.target.value as Order['paymentStatus'] })}
                        className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                          order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-2 hover:bg-surface-alt rounded-lg text-muted-foreground hover:text-primary"
                      >
                        {expandedOrder === order.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 bg-surface-alt/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-3">Order Items</h4>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div
                                  key={item.productId}
                                  className="flex items-center justify-between p-2 bg-background rounded"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p>{item.name}</p>
                                      {item.variantSku && (
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">
                                          Variant: {item.variantSku}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.quantity} x {formatTHB(item.price)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-3">Customer Details</h4>
                            <div className="p-3 bg-background rounded text-sm space-y-3">
                              <div>
                                <h5 className="font-medium text-xs text-muted-foreground mb-1">ACCOUNT</h5>
                                <div><span className="text-muted-foreground">ID: </span><span>{order.customerId}</span></div>
                                <div><span className="text-muted-foreground">Name: </span><span>{order.customerName}</span></div>
                                <div><span className="text-muted-foreground">Type: </span><span className="capitalize">{order.userType}</span></div>
                              </div>
                              <div className="pt-3 border-t border-border">
                                <h5 className="font-medium text-xs text-muted-foreground mb-1">SHIPPING & PAYMENT</h5>
                                <div><span className="text-muted-foreground">Method: </span><span className="capitalize">{order.paymentMethod?.replace('_', ' ') || 'N/A'}</span></div>
                                <div><span className="text-muted-foreground">Name: </span><span>{order.shippingName || 'N/A'}</span></div>
                                <div><span className="text-muted-foreground">Email: </span><span>{order.shippingEmail || 'N/A'}</span></div>
                                <div><span className="text-muted-foreground">Phone: </span><span>{order.shippingPhone || 'N/A'}</span></div>
                                {order.shippingAddress && (
                                  <div className="mt-1 text-xs">
                                    <p>{order.shippingAddress}</p>
                                    <p>{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
                                    <p>{order.shippingCountry}</p>
                                  </div>
                                )}
                                {order.shippingNotes && (
                                  <div className="mt-2 text-xs italic text-muted-foreground">
                                    Note: {order.shippingNotes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Order Notes */}
                          <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-border">
                            <OrderNotes orderId={order.dbId || ''} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
              }
            </tbody>
          </table>
        </div>

        {!isLoading && filteredOrders.length === 0 && (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
