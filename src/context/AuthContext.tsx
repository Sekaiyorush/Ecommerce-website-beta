import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { InvitationCode } from '@/data/invitations';
import { useDatabase } from './DatabaseContext';
import { supabase } from '@/lib/supabase';

export type UserRole = 'customer' | 'partner' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  partnerId?: string;
  discountRate?: number;
  invitedBy?: string;
  invitedByName?: string;
  invitationCode?: string;
  joinedAt: string;
  company?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, invitationCode: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  validateCode: (code: string) => Promise<{ valid: boolean; code?: InvitationCode; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { refreshData } = useDatabase();

  const fetchProfile = async (id: string, email: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) {
      setUser({
        id: data.id,
        email: email,
        name: data.full_name || email.split('@')[0],
        role: data.role as UserRole,
        partnerId: data.role === 'partner' ? data.id : undefined,
        discountRate: data.discount_rate,
        joinedAt: data.created_at,
        company: data.company_name,
        phone: data.phone_number,
      });
    } else if (error) {
      console.error("Could not fetch profile", error);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setIsLoaded(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Check rate limit before attempting login
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_identifier: email,
      p_action: 'login',
      p_max_attempts: 5,
      p_window_minutes: 15,
    });

    if (allowed === false) {
      return { success: false, error: 'Too many login attempts. Please wait 15 minutes before trying again.' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Generic message to prevent user enumeration (A2)
      return { success: false, error: 'Invalid email or password. Please try again.' };
    }
    return { success: true };
  };

  // Server-side invitation code validation via RPC
  const validateCode = async (code: string): Promise<{ valid: boolean; code?: InvitationCode; error?: string }> => {
    const { data, error } = await supabase.rpc('validate_invitation_code', {
      code_input: code,
    });

    if (error) {
      return { valid: false, error: error.message };
    }

    if (!data || !data.valid) {
      return { valid: false, error: data?.message || 'Invalid or expired invitation code' };
    }

    // Map the RPC response to an InvitationCode-like object for the register flow
    const invCode: InvitationCode = {
      id: code,
      code: code,
      type: data.type || (data.role === 'partner' ? 'admin_partner' : 'admin_user'),
      createdBy: '',
      createdByName: '',
      createdAt: '',
      maxUses: 1,
      usedCount: 0,
      usedBy: [],
      isActive: true,
      notes: '',
      partnerId: data.partner_id || undefined,
      defaultDiscountRate: data.default_discount_rate || 0,
    };

    return { valid: true, code: invCode };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    invitationCode: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Check rate limit for registration
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_identifier: email,
      p_action: 'register',
      p_max_attempts: 3,
      p_window_minutes: 30,
    });

    if (allowed === false) {
      return { success: false, error: 'Too many attempts. Please wait and try again.' };
    }

    // Validate the invitation code server-side via RPC
    const validation = await validateCode(invitationCode);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const invCode = validation.code!;
    // Determine role from the server-validated invitation code type
    const role: UserRole = invCode.type === 'admin_partner' || invCode.type === 'partner_user'
      ? 'partner'
      : 'customer';

    // Register the user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Registration auth error:', authError.message);
      return { success: false, error: 'Registration failed. Please try again.' };
    }

    if (authData.user) {
      // Create profile and consume invitation in a single atomic transaction via RPC
      const { data: profileData, error: profileError } = await supabase.rpc('create_profile_with_invitation', {
        p_id: authData.user.id,
        p_full_name: name,
        p_email: email,
        p_code: invitationCode,
      });

      if (profileError || (profileData && !profileData.success)) {
        console.error('Registration profile error:', profileError?.message || profileData?.error);
        return { success: false, error: 'Registration failed during profile creation. Please contact support.' };
      }

      // Refresh data
      await refreshData();
      return { success: true };
    }

    return { success: false, error: 'Failed to create user' };
  };

  const resetPasswordForEmail = async (email: string) => {
    // Rate limit password reset requests
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_identifier: email,
      p_action: 'password_reset',
      p_max_attempts: 3,
      p_window_minutes: 60,
    });

    if (allowed === false) {
      return { success: false, error: 'Too many attempts. Please wait and try again.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      console.error('Password reset error:', error.message);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
    return { success: true };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error('Update password error:', error.message);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-[1px] border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isPartner: user?.role === 'partner',
        isCustomer: user?.role === 'customer',
        login,
        register,
        resetPasswordForEmail,
        updatePassword,
        logout,
        validateCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
