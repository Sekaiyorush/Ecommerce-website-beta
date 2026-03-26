-- Security Remediation Migration
-- Fixes: role escalation, missing delete_user RPC, missing site_settings table,
--        missing RLS on rate_limits, discount rate constraint, contact_submissions table

-- ==========================================
-- 1. FIX ROLE ESCALATION IN handle_new_user()
-- ==========================================
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
  )
  ON CONFLICT (id) DO NOTHING; -- Avoid conflict with create_profile_with_invitation RPC
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. CREATE delete_user RPC (admin-only)
-- ==========================================
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Verify caller is admin
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: admin role required');
  END IF;

  -- Prevent self-deletion
  IF user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Cannot delete your own account');
  END IF;

  -- Delete profile (cascades to related data via foreign keys)
  DELETE FROM profiles WHERE id = user_id;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ==========================================
-- 3. CREATE site_settings TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  contact_email TEXT DEFAULT 'support@goldentierpeptide.com',
  contact_phone TEXT DEFAULT 'Contact via email first',
  contact_location TEXT DEFAULT 'United States',
  business_hours TEXT DEFAULT 'Mon-Fri, 9AM-5PM',
  shipping_info TEXT DEFAULT 'Shipping worldwide',
  company_name TEXT DEFAULT 'Golden Tier Peptide',
  company_description TEXT DEFAULT 'Premium research-grade peptides for laboratory use.',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default row
INSERT INTO public.site_settings (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view site settings"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_site_settings_modtime ON public.site_settings;
CREATE TRIGGER update_site_settings_modtime
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ==========================================
-- 4. ADD RLS TO rate_limits TABLE
-- ==========================================
ALTER TABLE IF EXISTS public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies added — check_rate_limit RPC is SECURITY DEFINER and bypasses RLS
-- This blocks all direct table access from PostgREST

-- ==========================================
-- 5. DISCOUNT RATE CONSTRAINT
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'check_discount_rate'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT check_discount_rate
      CHECK (discount_rate IS NULL OR (discount_rate >= 0 AND discount_rate <= 100));
  END IF;
END $$;

-- ==========================================
-- 6. CREATE contact_submissions TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can submit
CREATE POLICY "Authenticated users can submit contact forms"
  ON public.contact_submissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can view and update
CREATE POLICY "Admins can view contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update contact submissions"
  ON public.contact_submissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON public.contact_submissions(created_at DESC);
