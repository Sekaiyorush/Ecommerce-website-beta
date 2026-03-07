-- Add missing shipping and payment columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_name text,
ADD COLUMN IF NOT EXISTS shipping_email text,
ADD COLUMN IF NOT EXISTS shipping_phone text,
ADD COLUMN IF NOT EXISTS shipping_address text,
ADD COLUMN IF NOT EXISTS shipping_city text,
ADD COLUMN IF NOT EXISTS shipping_state text,
ADD COLUMN IF NOT EXISTS shipping_zip text,
ADD COLUMN IF NOT EXISTS shipping_country text,
ADD COLUMN IF NOT EXISTS shipping_notes text,
ADD COLUMN IF NOT EXISTS payment_method text;

-- Add variant_sku to order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS variant_sku text;

-- Create create_secure_order RPC
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
  v_stock int;
  v_user_role text;
  v_discount_rate int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role, discount_rate INTO v_user_role, v_discount_rate
  FROM profiles WHERE id = v_user_id;

  -- Calculate total and check stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_variant_sku := v_item->>'variant_sku';

    -- Fetch product details
    SELECT price, stock_quantity INTO v_db_price, v_stock
    FROM products WHERE id = v_product_id;

    IF v_db_price IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Product not found');
    END IF;

    -- Apply discount if partner
    IF v_user_role = 'partner' THEN
      v_db_price := v_db_price * (1 - (v_discount_rate::numeric / 100.0));
    END IF;

    v_total := v_total + (v_db_price * v_quantity);
  END LOOP;

  -- Generate friendly ID
  v_friendly_id := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 6));

  -- Insert Order
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

  -- Insert Order Items and Deduct Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_variant_sku := v_item->>'variant_sku';

    SELECT price INTO v_db_price FROM products WHERE id = v_product_id;
    IF v_user_role = 'partner' THEN
      v_db_price := v_db_price * (1 - (v_discount_rate::numeric / 100.0));
    END IF;

    INSERT INTO order_items (
      order_id, product_id, quantity, price_at_purchase, variant_sku
    ) VALUES (
      v_order_id, v_product_id, v_quantity, v_db_price, v_variant_sku
    );
    
    -- Deduct stock directly inside RPC
    UPDATE products SET stock_quantity = GREATEST(stock_quantity - v_quantity, 0)
    WHERE id = v_product_id;
  END LOOP;

  RETURN json_build_object('success', true, 'order_id', v_friendly_id, 'total', v_total);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;