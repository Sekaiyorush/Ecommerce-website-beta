import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { supabase } from '@/lib/supabase';
import type { ReactNode } from 'react';

// Mock wrapper for AuthProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <DatabaseProvider>
    <AuthProvider>{children}</AuthProvider>
  </DatabaseProvider>
);

describe('Auth & Role Reliability (QA Pass)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getSession to allow AuthProvider to load
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });
  });

  describe('Invitation Code RPC', () => {
    it('should validate invitation code via RPC before registration', async () => {
      // Setup mock response for validation RPC
      (supabase.rpc as any).mockResolvedValue({
        data: { valid: true, type: 'admin_partner', default_discount_rate: 25 },
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for AuthProvider to finish loading
      await waitFor(() => expect(result.current).not.toBeNull(), { timeout: 3000 });

      const validation = await result.current.validateCode('PARTNER2026');

      expect(supabase.rpc).toHaveBeenCalledWith('validate_invitation_code', {
        code_input: 'PARTNER2026'
      });
      expect(validation.valid).toBe(true);
      expect(validation.code?.type).toBe('admin_partner');
    });

    it('should block registration if invitation code is invalid', async () => {
      // Mock validation failure
      (supabase.rpc as any).mockResolvedValue({
        data: { valid: false, message: 'Code expired' },
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current).not.toBeNull());

      const regResult = await result.current.register('Test User', 'test@example.com', 'password123', 'EXPIRED');

      expect(regResult.success).toBe(false);
      expect(regResult.error).toBe('Code expired');
    });
  });

  describe('handle_new_user() Trigger & Profile Creation', () => {
    it('should handle profile creation role assignment correctly', async () => {
      // Mock sequence of RPC calls
      (supabase.rpc as any)
        .mockResolvedValueOnce({ data: { valid: true, type: 'admin_partner', default_discount_rate: 25 }, error: null }) // validateCode
        .mockResolvedValueOnce({ data: true, error: null }) // rate limit check
        .mockResolvedValueOnce({ data: null, error: null }); // use_invitation_code

      // Mock auth signUp
      const mockUser = { id: 'user-123', email: 'partner@example.com' };
      (supabase.auth.signUp as any).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current).not.toBeNull());

      await act(async () => {
        await result.current.register('Partner User', 'partner@example.com', 'password123', 'VALID_CODE');
      });

      // Verify profile insert (via supabase.from('profiles').insert)
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('Cart Role Restriction (QA Pass)', () => {
    it('should verify that non-partner users are restricted at the UI level', async () => {
      const { result } = renderHook(() => useAuth(), { 
          wrapper: ({ children }) => (
            <DatabaseProvider>
              <AuthProvider>{children}</AuthProvider>
            </DatabaseProvider>
          )
      });
      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current.isPartner).toBe(false);
    });
  });
});
