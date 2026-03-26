import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product, Partner, Customer, Order } from '@/data/products';
import type { InvitationCode, InvitationCodeType } from '@/data/invitations';
import type { User } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/emailService';

export interface SiteSettings {
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  businessHours: string;
  shippingInfo: string;
  companyName: string;
  companyDescription: string;
}

// We manage global mapped state here for optimistic UI updates
export interface AppDatabase {
  products: Product[];
  partners: Partner[];
  customers: Customer[];
  orders: Order[];
  invitationCodes: InvitationCode[];
  users: User[];
  inventoryLogs: InventoryLog[];
  siteSettings: SiteSettings;
}

export interface InventoryLog {
  id: string;
  productId: string;
  changeQuantity: number;
  reason: 'received' | 'sold' | 'damaged' | 'returned' | 'adjustment';
  notes?: string;
  performedBy?: string;
  performedByName?: string;
  variantSku?: string;
  createdAt: string;
}

// Internal types for Supabase row mappings
interface OrderItemRow {
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  variant_sku?: string | null;
  products?: { name: string } | null;
}

type DbRecord = Record<string, string | number | boolean | null | string[] | undefined>;

interface DatabaseContextType {
  db: AppDatabase;
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>;
  isLoading: boolean;
  dbError: string | null;
  refreshData: () => Promise<void>;

  // Products
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Orders
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<{ success: boolean; error?: string }>;
  createSecureOrder: (params: {
    items: { product_id: string; quantity: number; variant_sku?: string | null }[];
    shipping_name: string;
    shipping_email: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state?: string;
    shipping_zip?: string;
    shipping_country: string;
    shipping_notes?: string;
    payment_method?: string;
  }) => Promise<{ success: boolean; order_id?: string; total?: number; error?: string }>;

  // Partners
  addPartner: (data: { name: string; email: string; password: string; company: string; phone: string; discountRate: number; status: string; referredBy?: string; notes?: string }) => Promise<{ success: boolean; error?: string }>;
  updatePartner: (id: string, updates: Partial<Partner>) => void;
  deletePartner: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Customers
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  // Invitations
  addInvitationCode: (code: InvitationCode) => Promise<void>;
  updateInvitationCode: (id: string, updates: Partial<InvitationCode>) => Promise<void>;
  deleteInvitationCode: (codeStr: string) => Promise<void>;

  // Inventory
  addInventoryLog: (log: Omit<InventoryLog, 'id' | 'createdAt' | 'performedByName'>, updateVariantStock?: boolean) => Promise<void>;

  // Audit
  logAudit: (action: string, entityType: string, entityId: string, details?: Record<string, unknown>) => Promise<void>;

  // Site Settings
  updateSiteSettings: (updates: Partial<SiteSettings>) => Promise<boolean>;

  // Contact
  submitContactForm: (data: { fullName: string; email: string; subject: string; message: string }) => Promise<{ success: boolean; error?: string }>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const INITIAL_DB_STATE: AppDatabase = {
  products: [],
  partners: [],
  customers: [],
  orders: [],
  invitationCodes: [],
  users: [],
  inventoryLogs: [],
  siteSettings: {
    contactEmail: 'support@goldentierpeptide.com',
    contactPhone: 'Contact via email first',
    contactLocation: 'United States',
    businessHours: 'Mon-Fri, 9AM-5PM',
    shippingInfo: 'Shipping worldwide',
    companyName: 'Golden Tier Peptide',
    companyDescription: 'Premium research-grade peptides for laboratory use.'
  }
};

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDbState] = useState<AppDatabase>(INITIAL_DB_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // ─── Audit Logging Helper ────────────────────────────────────────
  const logAudit = async (action: string, entityType: string, entityId: string, details?: Record<string, unknown>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      await supabase.rpc('log_audit_event', {
        p_user_id: session.user.id,
        p_action: action,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_details: details || null,
      });
    } catch {
      // Error handled silently
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const [
        { data: products },
        { data: profiles },
        { data: ordersRaw },
        { data: codes },
        { data: orderItemsRaw },
        { data: inventoryLogsRaw },
        { data: settingsData }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('invitation_codes').select('*'),
        supabase.from('order_items').select('*, products(name)'),
        supabase.from('inventory_log').select('*, profiles(full_name)'),
        supabase.from('site_settings').select('*').eq('id', 'default').single()
      ]);

      if (!products) {
        setDbError('Unable to load products. Please refresh.');
      }

      if (products && profiles) {
        // Parse settings
        let siteSettings = INITIAL_DB_STATE.siteSettings;
        if (settingsData) {
          siteSettings = {
            contactEmail: settingsData.contact_email || siteSettings.contactEmail,
            contactPhone: settingsData.contact_phone || siteSettings.contactPhone,
            contactLocation: settingsData.contact_location || siteSettings.contactLocation,
            businessHours: settingsData.business_hours || siteSettings.businessHours,
            shippingInfo: settingsData.shipping_info || siteSettings.shippingInfo,
            companyName: settingsData.company_name || siteSettings.companyName,
            companyDescription: settingsData.company_description || siteSettings.companyDescription
          };
        }

        // Build a lookup map for profiles
        const profileMap = new Map(profiles.map(p => [p.id, p]));

        // Map profiles into users, partners, and customers
        const users: User[] = profiles.map(p => ({
          id: p.id,
          email: p.email,
          name: p.full_name || p.email.split('@')[0],
          role: p.role,
          discountRate: p.discount_rate,
          partnerId: p.role === 'partner' ? p.id : undefined,
          company: p.company_name,
          phone: p.phone_number,
          joinedAt: p.created_at
        }));

        const partners: Partner[] = profiles.filter(p => p.role === 'partner').map(p => ({
          id: p.id,
          name: p.full_name || '',
          email: p.email,
          company: p.company_name || '',
          phone: p.phone_number || '',
          status: p.status || 'pending',
          discountRate: p.discount_rate || 0,
          totalPurchases: Number(p.total_purchases) || 0,
          totalResold: Number(p.total_resold) || 0,
          joinedAt: p.created_at,
          referredBy: p.invited_by,
          referrals: profiles.filter(r => r.invited_by === p.id).map(r => r.id),
          notes: ''
        }));

        // Group order items by order_id
        const itemsByOrderId = new Map<string, OrderItemRow[]>();
        (orderItemsRaw || []).forEach((item: OrderItemRow) => {
          const existing = itemsByOrderId.get(item.order_id) || [];
          existing.push(item);
          itemsByOrderId.set(item.order_id, existing);
        });

        // Map orders with items and customer names
        const mappedOrders: Order[] = (ordersRaw || []).map(o => {
          const customerProfile = profileMap.get(o.customer_id);
          const items = (itemsByOrderId.get(o.id) || []).map((item: OrderItemRow) => ({
            productId: item.product_id,
            name: item.products?.name || 'Unknown Product',
            quantity: item.quantity,
            price: Number(item.price_at_purchase),
            variantSku: item.variant_sku || undefined,
          }));

          return {
            id: o.friendly_id,
            dbId: o.id,
            customerId: o.customer_id,
            customerName: customerProfile?.full_name || customerProfile?.email?.split('@')[0] || 'Unknown',
            items,
            total: Number(o.total_amount),
            status: o.status,
            paymentStatus: o.payment_status,
            createdAt: o.created_at,
            userType: customerProfile?.role === 'partner' ? 'partner' as const : 'customer' as const,
            partnerId: customerProfile?.role === 'partner' ? o.customer_id : undefined,
            shippingName: o.shipping_name,
            shippingEmail: o.shipping_email,
            shippingPhone: o.shipping_phone,
            shippingAddress: o.shipping_address,
            shippingCity: o.shipping_city,
            shippingState: o.shipping_state,
            shippingZip: o.shipping_zip,
            shippingCountry: o.shipping_country,
            shippingNotes: o.shipping_notes,
            paymentMethod: o.payment_method
          };
        });

        // Compute customer stats from orders
        const customerOrderCounts = new Map<string, { count: number; total: number; lastOrder?: string }>();
        mappedOrders.forEach(o => {
          const existing = customerOrderCounts.get(o.customerId) || { count: 0, total: 0 };
          existing.count++;
          existing.total += o.total;
          if (!existing.lastOrder || o.createdAt > existing.lastOrder) {
            existing.lastOrder = o.createdAt;
          }
          customerOrderCounts.set(o.customerId, existing);
        });

        const customers: Customer[] = profiles.filter(p => p.role === 'customer').map(p => {
          const stats = customerOrderCounts.get(p.id) || { count: 0, total: 0 };
          return {
            id: p.id,
            name: p.full_name || '',
            email: p.email,
            phone: p.phone_number || '',
            totalOrders: stats.count,
            totalSpent: stats.total,
            joinedAt: p.created_at,
            lastOrderAt: stats.lastOrder,
            status: 'active' as const,
            invitedBy: p.invited_by,
            invitedByName: p.invited_by ? profileMap.get(p.invited_by)?.full_name : undefined,
          };
        });

        // Map invitation codes from Supabase snake_case to frontend camelCase
        const mappedCodes: InvitationCode[] = (codes || []).map(c => {
          const creator = c.created_by ? profileMap.get(c.created_by) : null;
          return {
            id: c.code, // PK is the code itself
            code: c.code,
            type: (c.type || (c.role === 'partner' ? 'admin_partner' : 'admin_user')) as InvitationCodeType,
            createdBy: c.created_by || '',
            createdByName: creator?.full_name || creator?.email?.split('@')[0] || 'System',
            createdAt: c.created_at?.split('T')[0] || '',
            expiresAt: c.expires_at?.split('T')[0],
            maxUses: c.max_uses || 1,
            usedCount: c.current_uses || 0,
            usedBy: [], // Would need a separate tracking table for detailed usage
            isActive: c.is_active !== false,
            notes: c.notes || '',
            partnerId: c.partner_id,
            partnerName: c.partner_id ? profileMap.get(c.partner_id)?.full_name : undefined,
            defaultDiscountRate: c.default_discount_rate,
          };
        });

        // Map products
        const mappedProducts: Product[] = products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          fullDescription: p.full_description,
          price: Number(p.price),
          category: p.category,
          purity: p.purity || '',
          inStock: p.in_stock !== false,
          stockQuantity: p.stock_quantity || 0,
          sku: p.sku,
          benefits: p.benefits || [],
          dosage: p.dosage,
          imageUrl: p.image_url,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          lowStockThreshold: p.low_stock_threshold || 10,
          variants: p.variants || undefined,
        }));

        // Map inventory logs
        const mappedLogs: InventoryLog[] = (inventoryLogsRaw || []).map(l => ({
          id: l.id,
          productId: l.product_id,
          changeQuantity: l.change_quantity,
          reason: l.reason,
          notes: l.notes,
          performedBy: l.performed_by,
          performedByName: l.profiles?.full_name || 'Unknown',
          variantSku: l.variant_sku || undefined,
          createdAt: l.created_at,
        }));

        setDbState({
          products: mappedProducts,
          users,
          partners,
          customers,
          orders: mappedOrders,
          invitationCodes: mappedCodes,
          inventoryLogs: mappedLogs,
          siteSettings,
        });
      }
    } catch (err: unknown) {
      // Error handled silently
      setDbError(err instanceof Error ? err.message : 'An unknown error occurred loading data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    loadData();
  }, []);

  const setDb: React.Dispatch<React.SetStateAction<AppDatabase>> = setDbState;

  // ─── Products CRUD ──────────────────────────────────────────────
  const addProduct = async (product: Product) => {
    const { error } = await supabase.from('products').insert({
      sku: product.sku,
      name: product.name,
      description: product.description,
      full_description: product.fullDescription,
      price: product.price,
      category: product.category,
      purity: product.purity,
      in_stock: product.inStock,
      stock_quantity: product.stockQuantity,
      benefits: product.benefits,
      dosage: product.dosage,
      image_url: product.imageUrl
    });
    if (error) {
      // Error handled silently
    } else {
      await loadData();
      logAudit('create', 'product', product.id, { name: product.name, sku: product.sku, price: product.price });
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setDb(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    const dbUpdates: DbRecord = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.fullDescription !== undefined) dbUpdates.full_description = updates.fullDescription;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.purity !== undefined) dbUpdates.purity = updates.purity;
    if (updates.inStock !== undefined) dbUpdates.in_stock = updates.inStock;
    if (updates.stockQuantity !== undefined) dbUpdates.stock_quantity = updates.stockQuantity;
    if (updates.benefits !== undefined) dbUpdates.benefits = updates.benefits;
    if (updates.dosage !== undefined) dbUpdates.dosage = updates.dosage;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;

    await supabase.from('products').update(dbUpdates).eq('id', id);
    logAudit('update', 'product', id, { fields: Object.keys(dbUpdates) });
  };

  const deleteProduct = async (id: string) => {
    const product = db.products.find(p => p.id === id);
    setDb(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
    await supabase.from('products').delete().eq('id', id);
    logAudit('delete', 'product', id, { name: product?.name });
  };

  // ─── Orders CRUD ──────────────────────────────────────────────
  const addOrder = async (order: Order) => {
    setDb(prev => ({ ...prev, orders: [...prev.orders, order] }));

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        friendly_id: order.id,
        customer_id: order.customerId,
        total_amount: order.total,
        status: order.status,
        payment_status: order.paymentStatus,
        shipping_name: order.shippingName,
        shipping_email: order.shippingEmail,
        shipping_phone: order.shippingPhone,
        shipping_address: order.shippingAddress,
        shipping_city: order.shippingCity,
        shipping_state: order.shippingState,
        shipping_zip: order.shippingZip,
        shipping_country: order.shippingCountry,
        shipping_notes: order.shippingNotes,
        payment_method: order.paymentMethod
      })
      .select('id')
      .single();

    if (orderError) {
      // Error handled silently
      return;
    }

    // Update the optimistic order in state with the real Supabase UUID
    if (newOrder) {
      setDb(prev => ({
        ...prev,
        orders: prev.orders.map(o =>
          o.id === order.id ? { ...o, dbId: newOrder.id } : o
        )
      }));
    }

    if (newOrder && order.items && order.items.length > 0) {
      const dbOrderItems = order.items.map(item => ({
        order_id: newOrder.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_purchase: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(dbOrderItems);

      if (itemsError) {
        // Error handled silently
      }
    }

    logAudit('create', 'order', order.id, { total: order.total, itemCount: order.items.length });

    // Send mock order confirmation email
    const customer = db.customers.find(c => c.id === order.customerId);
    if (customer) {
      await emailService.sendOrderConfirmation(customer.email, order.id, order.total);
    }
  };

  // Secure order creation via server-side RPC (validates prices, stock, discounts)
  const createSecureOrder = async (params: {
    items: { product_id: string; quantity: number; variant_sku?: string | null }[];
    shipping_name: string;
    shipping_email: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state?: string;
    shipping_zip?: string;
    shipping_country: string;
    shipping_notes?: string;
    payment_method?: string;
  }): Promise<{ success: boolean; order_id?: string; total?: number; error?: string }> => {
    const { data, error } = await supabase.rpc('create_secure_order', {
      p_items: JSON.stringify(params.items),
      p_shipping_name: params.shipping_name,
      p_shipping_email: params.shipping_email,
      p_shipping_phone: params.shipping_phone,
      p_shipping_address: params.shipping_address,
      p_shipping_city: params.shipping_city,
      p_shipping_state: params.shipping_state || null,
      p_shipping_zip: params.shipping_zip || null,
      p_shipping_country: params.shipping_country,
      p_shipping_notes: params.shipping_notes || null,
      p_payment_method: params.payment_method || 'bank_transfer',
    });

    if (error) {
      // Error handled silently
      return { success: false, error: error.message };
    }

    if (data && data.success) {
      // Refresh data to get the new order from DB
      await loadData();
      logAudit('create', 'order', data.order_id, { total: data.total, method: 'secure_rpc' });
      return { success: true, order_id: data.order_id, total: data.total };
    }

    return { success: false, error: data?.error || 'Unknown error' };
  };

  const updateOrder = async (id: string, updates: Partial<Order>): Promise<{ success: boolean; error?: string }> => {
    const VALID_ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };
    if (updates.status && !(VALID_ORDER_STATUSES as readonly string[]).includes(updates.status)) {
      return { success: false, error: 'Invalid order status' };
    }

    // Check if we're marking as delivered — need to deduct inventory
    const currentOrder = db.orders.find(o => o.id === id);

    if (updates.status && currentOrder?.status) {
      const allowed = VALID_TRANSITIONS[currentOrder.status] || [];
      if (!allowed.includes(updates.status)) {
        return { success: false, error: `Invalid transition from ${currentOrder.status} to ${updates.status}` };
      }
    }

    const isBeingDelivered = updates.status === 'delivered' && currentOrder?.status !== 'delivered';

    setDb(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === id ? { ...o, ...updates } : o)
    }));

    const dbUpdates: DbRecord = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
    await supabase.from('orders').update(dbUpdates).eq('friendly_id', id);

    logAudit('update', 'order', id, {
      fields: Object.keys(dbUpdates),
      previousStatus: currentOrder?.status,
      newStatus: updates.status,
    });

    // Log inventory entries when order is marked as delivered (stock was already deducted at order creation by the RPC)
    if (isBeingDelivered && currentOrder?.items && currentOrder.items.length > 0) {
      for (const item of currentOrder.items) {
        await supabase.from('inventory_log').insert({
          product_id: item.productId,
          change_quantity: -item.quantity,
          reason: 'sold',
          notes: `Order ${id} delivered`,
          performed_by: null,
          variant_sku: item.variantSku || null,
        });
      }
      await loadData();
    }

    // Send mock status update email if status changed
    if (updates.status && currentOrder?.status !== updates.status) {
      const customer = db.customers.find(c => c.id === currentOrder?.customerId);
      if (customer) {
        await emailService.sendOrderStatusUpdate(customer.email, id, updates.status);
      }
    }

    return { success: true };
  };

  // ─── Partners CRUD ──────────────────────────────────────────────
  const addPartner = async (data: {
    name: string; email: string; password: string; company: string;
    phone: string; discountRate: number; status: string; referredBy?: string; notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    // Validate discount rate bounds
    if (data.discountRate < 0 || data.discountRate > 100) {
      return { success: false, error: 'Discount rate must be between 0 and 100' };
    }

    try {
      // Use a temporary client so it doesn't log out the currently active admin
      const tempAuthClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );

      // Create auth user via signUp
      const { data: authData, error: authError } = await tempAuthClient.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) return { success: false, error: authError.message };
      if (!authData.user) return { success: false, error: 'Failed to create user account' };

      // Create profile with partner role using the main client so RLS (Admins can insert profiles) works
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.name,
        role: 'partner',
        company_name: data.company,
        phone_number: data.phone,
        discount_rate: data.discountRate,
        status: data.status || 'active',
        invited_by: data.referredBy || null,
      });

      if (profileError) return { success: false, error: profileError.message };

      logAudit('create', 'partner', authData.user.id, { name: data.name, email: data.email, company: data.company });

      // Refresh data to pick up the new partner
      await loadData();
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  const updatePartner = async (id: string, updates: Partial<Partner>) => {
    setDb(prev => ({
      ...prev,
      partners: prev.partners.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    const dbUpdates: DbRecord = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.discountRate !== undefined) {
      if (updates.discountRate < 0 || updates.discountRate > 100) return;
      dbUpdates.discount_rate = updates.discountRate;
    }
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.company !== undefined) dbUpdates.company_name = updates.company;
    if (updates.phone !== undefined) dbUpdates.phone_number = updates.phone;
    if (updates.referredBy !== undefined) dbUpdates.invited_by = updates.referredBy;
    await supabase.from('profiles').update(dbUpdates).eq('id', id);
    logAudit('update', 'partner', id, { fields: Object.keys(dbUpdates) });
  };

  const deletePartner = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const partner = db.partners.find(p => p.id === id);
      const { error } = await supabase.rpc('delete_user', { user_id: id });

      if (error) {
        // Error handled silently
        return { success: false, error: error.message };
      }

      setDb(prev => ({
        ...prev,
        partners: prev.partners.filter(p => p.id !== id)
      }));

      logAudit('delete', 'partner', id, { name: partner?.name, email: partner?.email });
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      // Error handled silently
      return { success: false, error: message };
    }
  };

  // ─── Customers CRUD ──────────────────────────────────────────────
  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    setDb(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  // ─── Invitations CRUD (NOW WRITES TO SUPABASE) ──────────────────
  const addInvitationCode = async (code: InvitationCode) => {
    setDb(prev => ({ ...prev, invitationCodes: [...prev.invitationCodes, code] }));

    const { error } = await supabase.from('invitation_codes').insert({
      code: code.code,
      role: code.type === 'admin_partner' ? 'partner' : 'customer',
      type: code.type,
      created_by: code.createdBy || null,
      max_uses: code.maxUses,
      current_uses: 0,
      expires_at: code.expiresAt || null,
      is_active: true,
      notes: code.notes || null,
      partner_id: code.partnerId || null,
      default_discount_rate: code.defaultDiscountRate || null,
    });

    if (error) {
      // Error handled silently
    } else {
      logAudit('create', 'invitation_code', code.code, { type: code.type, maxUses: code.maxUses });
    }
  };

  const updateInvitationCode = async (codeStr: string, updates: Partial<InvitationCode>) => {
    setDb(prev => ({
      ...prev,
      invitationCodes: prev.invitationCodes.map(c =>
        (c.code === codeStr || c.id === codeStr) ? { ...c, ...updates } : c
      )
    }));

    const dbUpdates: DbRecord = {};
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.maxUses !== undefined) dbUpdates.max_uses = updates.maxUses;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.usedCount !== undefined) dbUpdates.current_uses = updates.usedCount;

    // Find the actual code string
    const actualCode = db.invitationCodes.find(c => c.code === codeStr || c.id === codeStr)?.code || codeStr;
    await supabase.from('invitation_codes').update(dbUpdates).eq('code', actualCode);
    logAudit('update', 'invitation_code', actualCode, { fields: Object.keys(dbUpdates) });
  };

  const deleteInvitationCode = async (codeStr: string) => {
    setDb(prev => ({
      ...prev,
      invitationCodes: prev.invitationCodes.filter(c => c.code !== codeStr)
    }));
    await supabase.from('invitation_codes').update({ is_active: false }).eq('code', codeStr);
    logAudit('deactivate', 'invitation_code', codeStr);
  };

  // ─── Inventory Logs ──────────────────────────────────────────────
  const addInventoryLog = async (log: Omit<InventoryLog, 'id' | 'createdAt' | 'performedByName'>, updateVariantStock = false) => {
    const { error } = await supabase.from('inventory_log').insert({
      product_id: log.productId,
      change_quantity: log.changeQuantity,
      reason: log.reason,
      notes: log.notes || null,
      performed_by: log.performedBy || null,
      variant_sku: log.variantSku || null,
    });

    if (error) {
      // Error handled silently
      return;
    }

    // Update stock — variant-level or product-level
    if (updateVariantStock && log.variantSku) {
      const product = db.products.find(p => p.id === log.productId);
      if (product?.variants) {
        const updatedVariants = product.variants.map(v => {
          if (v.sku === log.variantSku) {
            return { ...v, stock: Math.max(0, v.stock + log.changeQuantity) };
          }
          return v;
        });
        await supabase.from('products').update({ variants: updatedVariants }).eq('id', log.productId);
      }
    } else {
      // Product-level stock update
      const product = db.products.find(p => p.id === log.productId);
      if (product) {
        const newQty = product.stockQuantity + log.changeQuantity;
        await updateProduct(log.productId, {
          stockQuantity: Math.max(0, newQty),
          inStock: newQty > 0,
        });
      }
    }

    // Refresh to get latest data
    await loadData();
  };

  // ─── Contact Form ──────────────────────────────────────────────
  const submitContactForm = async (data: { fullName: string; email: string; subject: string; message: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('contact_submissions').insert({
        full_name: data.fullName,
        email: data.email,
        subject: data.subject,
        message: data.message,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  // ─── Site Settings ──────────────────────────────────────────────
  const updateSiteSettings = async (updates: Partial<SiteSettings>): Promise<boolean> => {
    setDb(prev => ({
      ...prev,
      siteSettings: { ...prev.siteSettings, ...updates }
    }));

    const dbUpdates: DbRecord = {};
    if (updates.contactEmail !== undefined) dbUpdates.contact_email = updates.contactEmail;
    if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone;
    if (updates.contactLocation !== undefined) dbUpdates.contact_location = updates.contactLocation;
    if (updates.businessHours !== undefined) dbUpdates.business_hours = updates.businessHours;
    if (updates.shippingInfo !== undefined) dbUpdates.shipping_info = updates.shippingInfo;
    if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
    if (updates.companyDescription !== undefined) dbUpdates.company_description = updates.companyDescription;

    const { error } = await supabase.from('site_settings').update(dbUpdates).eq('id', 'default');
    if (error) {
      // Error handled silently
      return false;
    }
    logAudit('update', 'site_settings', 'default', { fields: Object.keys(dbUpdates) });
    return true;
  };

  return (
    <DatabaseContext.Provider value={{
      db, setDb, isLoading, dbError, refreshData: loadData,
      addProduct, updateProduct, deleteProduct,
      addOrder, updateOrder, createSecureOrder,
      addPartner, updatePartner, deletePartner,
      updateCustomer,
      addInvitationCode, updateInvitationCode, deleteInvitationCode,
      addInventoryLog,
      logAudit,
      updateSiteSettings,
      submitContactForm,
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
