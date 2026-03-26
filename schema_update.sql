-- schema_update.sql
-- Run this script in the Supabase SQL editor to implement architectural enhancements

-- ==========================================
-- 1. AUTOMATED PROFILE CREATION TRIGGER
-- ==========================================
-- Securely creates a public.profiles entry whenever a new auth.users signup occurs.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'customer', -- Hardcoded to prevent role escalation via user metadata
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the hidden auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 2. MISSING RLS POLICIES
-- ==========================================
-- Profiles: Users need to be able to edit their own data (e.g. name, phone), and Admins need full control.
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles." ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products: Admins occasionally need to delete mistakenly created products
CREATE POLICY "Admins can delete products." ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders: Users should be able to update their order status (like canceling a pending order)
CREATE POLICY "Users can update their own orders." ON public.orders FOR UPDATE USING (auth.uid() = customer_id);

-- Order Items: Cart management requires updating and deleting line items
CREATE POLICY "Users can update their own order items." ON public.order_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND customer_id = auth.uid())
);
CREATE POLICY "Users can delete their own order items." ON public.order_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND customer_id = auth.uid())
);


-- ==========================================
-- 3. FOREIGN KEY INDEXES
-- ==========================================
-- Required to prevent sequential table scans when joining or cascading deletes
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by ON public.profiles(invited_by);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_created_by ON public.invitation_codes(created_by);


-- ==========================================
-- 4. AUTOMATED updated_at TIMESTAMPS
-- ==========================================
-- Postgres doesn't auto-update timestamp columns on UPDATE. This ensures it happens at the DB level.
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_products_modtime ON public.products;
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_orders_modtime ON public.orders;
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


-- ==========================================
-- 5. CURRENCY PRECISION ENFORCEMENT
-- ==========================================
-- Locks financial fields to 2 decimal places to prevent unpredictable floating-point rounding errors
ALTER TABLE public.products ALTER COLUMN price TYPE numeric(10,2);
ALTER TABLE public.orders ALTER COLUMN total_amount TYPE numeric(10,2);
ALTER TABLE public.order_items ALTER COLUMN price_at_purchase TYPE numeric(10,2);
