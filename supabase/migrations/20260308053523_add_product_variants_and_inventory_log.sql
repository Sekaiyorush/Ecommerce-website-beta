-- Migration: add_product_variants_and_inventory_log
-- Description: Adds a JSONB variants column to the products table and creates the missing inventory_log table for tracking.

-- ============================================================
-- CHANGES
-- ============================================================

-- 1. Add variants column (JSONB) to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;

-- 2. Create inventory_log table for tracking stock changes
CREATE TABLE IF NOT EXISTS public.inventory_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  change_quantity integer NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('received', 'sold', 'damaged', 'returned', 'adjustment')),
  notes TEXT,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  variant_sku TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Enable RLS for inventory_log
ALTER TABLE public.inventory_log ENABLE ROW LEVEL SECURITY;

-- Admins can view and insert all logs
CREATE POLICY "admins_all" ON public.inventory_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update products (already exists, but ensuring it)
-- This is where they will update the variants JSONB column.

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_inventory_log_product_id ON public.inventory_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_performed_by ON public.inventory_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_inventory_log_variant_sku ON public.inventory_log(variant_sku);

-- ============================================================
-- UPDATE create_secure_order RPC
-- ============================================================

-- This function replaces the existing one to properly support variant-based price and stock
CREATE OR REPLACE FUNCTION public.create_secure_order(
  p_items jsonb,
  p_shipping_name text,
  p_shipping_email text,
  p_shipping_phone text,
  p_shipping_address text,
  p_shipping_city text,
  p_shipping_state text,
  p_shipping_zip text,
  p_shipping_country text,
  p_shipping_notes text,
  p_payment_method text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order_id uuid;
  v_friendly_id text;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_variant_sku text;
  v_db_price numeric(10,2);
  v_db_stock int;
  v_db_variants jsonb;
  v_variant_found boolean;
  v_variant jsonb;
  v_user_role text;
  v_discount_rate int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role, discount_rate INTO v_user_role, v_discount_rate
  FROM profiles WHERE id = v_user_id;

  -- 1. Calculate total and check stock/variants
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_variant_sku := v_item->>'variant_sku';

    -- Fetch product details including variants
    SELECT price, stock_quantity, variants INTO v_db_price, v_db_stock, v_db_variants
    FROM products WHERE id = v_product_id;

    IF v_db_price IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Product ' || v_product_id || ' not found');
    END IF;

    -- Variant logic
    IF v_variant_sku IS NOT NULL AND v_variant_sku <> '' THEN
      v_variant_found := false;
      FOR v_variant IN SELECT * FROM jsonb_array_elements(v_db_variants)
      LOOP
        IF v_variant->>'sku' = v_variant_sku THEN
          v_db_price := (v_variant->>'price')::numeric;
          v_db_stock := (v_variant->>'stock')::int;
          v_variant_found := true;
          EXIT;
        END IF;
      END LOOP;
      
      IF NOT v_variant_found THEN
        RETURN json_build_object('success', false, 'error', 'Variant SKU ' || v_variant_sku || ' not found for product ' || v_product_id);
      END IF;
    END IF;

    -- Stock check
    IF v_db_stock < v_quantity THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient stock for ' || v_product_id || (CASE WHEN v_variant_sku IS NOT NULL THEN ' (' || v_variant_sku || ')' ELSE '' END));
    END IF;

    -- Apply discount if partner
    IF v_user_role = 'partner' THEN
      v_db_price := v_db_price * (1 - (v_discount_rate::numeric / 100.0));
    END IF;

    v_total := v_total + (v_db_price * v_quantity);
  END LOOP;

  -- 2. Generate friendly ID
  v_friendly_id := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 6));

  -- 3. Insert Order
  INSERT INTO orders (
    friendly_id, customer_id, total_amount, status, payment_status,
    shipping_name, shipping_email, shipping_phone, shipping_address,
    shipping_city, shipping_state, shipping_zip, shipping_country,
    shipping_notes, payment_method
  ) VALUES (
    v_friendly_id, v_user_id, v_total, 'pending', 'pending',
    p_shipping_name, p_shipping_email, p_shipping_phone, p_shipping_address,
    p_shipping_city, p_shipping_state, p_shipping_zip, p_shipping_country,
    p_shipping_notes, p_payment_method
  ) RETURNING id INTO v_order_id;

  -- 4. Insert Order Items and Deduct Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_variant_sku := v_item->>'variant_sku';

    -- Re-fetch price/variants for final insertion logic
    SELECT price, variants INTO v_db_price, v_db_variants FROM products WHERE id = v_product_id;
    
    IF v_variant_sku IS NOT NULL AND v_variant_sku <> '' THEN
      FOR v_variant IN SELECT * FROM jsonb_array_elements(v_db_variants)
      LOOP
        IF v_variant->>'sku' = v_variant_sku THEN
          v_db_price := (v_variant->>'price')::numeric;
          EXIT;
        END IF;
      END LOOP;
    END IF;

    IF v_user_role = 'partner' THEN
      v_db_price := v_db_price * (1 - (v_discount_rate::numeric / 100.0));
    END IF;

    INSERT INTO order_items (
      order_id, product_id, quantity, price_at_purchase, variant_sku
    ) VALUES (
      v_order_id, v_product_id, v_quantity, v_db_price, v_variant_sku
    );
    
    -- Deduct stock directly inside RPC
    IF v_variant_sku IS NOT NULL AND v_variant_sku <> '' THEN
      -- Deduct from variant JSONB
      UPDATE products 
      SET variants = (
        SELECT jsonb_agg(
          CASE 
            WHEN val->>'sku' = v_variant_sku 
            THEN jsonb_set(val, '{stock}', ( (val->>'stock')::int - v_quantity )::text::jsonb)
            ELSE val 
          END
        )
        FROM jsonb_array_elements(variants) AS val
      )
      WHERE id = v_product_id;
    ELSE
      -- Deduct from base stock
      UPDATE products SET stock_quantity = GREATEST(stock_quantity - v_quantity, 0)
      WHERE id = v_product_id;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'order_id', v_friendly_id, 'total', v_total);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
