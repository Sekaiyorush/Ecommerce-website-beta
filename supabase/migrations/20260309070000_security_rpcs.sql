-- Security Remediation Migration: Rate Limiting & Secure Invitation RPCs

-- 1. Ensure invitation_codes has all required columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation_codes' AND COLUMN_NAME = 'type') THEN
        ALTER TABLE public.invitation_codes ADD COLUMN type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation_codes' AND COLUMN_NAME = 'notes') THEN
        ALTER TABLE public.invitation_codes ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation_codes' AND COLUMN_NAME = 'partner_id') THEN
        ALTER TABLE public.invitation_codes ADD COLUMN partner_id UUID REFERENCES public.profiles(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation_codes' AND COLUMN_NAME = 'default_discount_rate') THEN
        ALTER TABLE public.invitation_codes ADD COLUMN default_discount_rate INTEGER;
    END IF;
END $$;

-- 2. Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    action TEXT NOT NULL,
    attempts INTEGER DEFAULT 1,
    last_attempt TIMESTAMPTZ DEFAULT now(),
    UNIQUE(identifier, action)
);

-- 3. Rate Limiting Function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_max_attempts INTEGER,
    p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attempts INTEGER;
BEGIN
    -- Cleanup old entries for this identifier/action
    DELETE FROM public.rate_limits 
    WHERE last_attempt < now() - (p_window_minutes * interval '1 minute')
    AND identifier = p_identifier AND action = p_action;

    -- Get or create entry
    INSERT INTO public.rate_limits (identifier, action, attempts, last_attempt)
    VALUES (p_identifier, p_action, 1, now())
    ON CONFLICT (identifier, action)
    DO UPDATE SET
        attempts = CASE 
            WHEN public.rate_limits.last_attempt < now() - (p_window_minutes * interval '1 minute') THEN 1
            ELSE public.rate_limits.attempts + 1
        END,
        last_attempt = now()
    RETURNING attempts INTO v_attempts;

    -- Return true if within limits
    RETURN v_attempts <= p_max_attempts;
END;
$$;

-- 4. Validate Invitation Code Function
CREATE OR REPLACE FUNCTION public.validate_invitation_code(code_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code RECORD;
BEGIN
    SELECT * INTO v_code 
    FROM public.invitation_codes 
    WHERE code = code_input AND is_active = true;

    IF v_code IS NULL THEN
        RETURN json_build_object('valid', false, 'message', 'Invalid or inactive invitation code');
    END IF;

    IF v_code.expires_at IS NOT NULL AND v_code.expires_at < now() THEN
        RETURN json_build_object('valid', false, 'message', 'Invitation code has expired');
    END IF;

    IF v_code.current_uses >= v_code.max_uses THEN
        RETURN json_build_object('valid', false, 'message', 'Invitation code has reached maximum uses');
    END IF;

    RETURN json_build_object(
        'valid', true,
        'role', v_code.role,
        'type', v_code.type,
        'partner_id', v_code.partner_id,
        'default_discount_rate', v_code.default_discount_rate
    );
END;
$$;

-- 5. Use Invitation Code Function
CREATE OR REPLACE FUNCTION public.use_invitation_code(code_input TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.invitation_codes
    SET current_uses = current_uses + 1
    WHERE code = code_input;
END;
$$;

-- 6. Create Profile with Invitation RPC
CREATE OR REPLACE FUNCTION public.create_profile_with_invitation(
    p_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_validation JSON;
    v_role TEXT;
    v_partner_id UUID;
    v_discount_rate INTEGER;
BEGIN
    -- 1. Validate the code again inside the transaction
    v_validation := public.validate_invitation_code(p_code);
    
    IF NOT (v_validation->>'valid')::BOOLEAN THEN
        RETURN v_validation;
    END IF;

    v_role := v_validation->>'role';
    v_partner_id := (v_validation->>'partner_id')::UUID;
    v_discount_rate := (v_validation->>'default_discount_rate')::INTEGER;

    -- If no default discount rate provided, use defaults
    IF v_discount_rate IS NULL THEN
        IF v_role = 'partner' THEN
            v_discount_rate := 20;
        ELSE
            v_discount_rate := 0;
        END IF;
    END IF;

    -- 2. Create the profile
    INSERT INTO public.profiles (
        id, email, full_name, role, discount_rate, invited_by, status
    ) VALUES (
        p_id, p_email, p_full_name, v_role, v_discount_rate, v_partner_id, 'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = p_full_name,
        role = v_role,
        discount_rate = v_discount_rate,
        invited_by = v_partner_id,
        status = 'active';

    -- 3. Consume the invitation
    UPDATE public.invitation_codes
    SET current_uses = current_uses + 1
    WHERE code = p_code;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
