import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SecurityAlert } from '@/components/ui/security-alert';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { SEO } from '@/components/SEO';

export function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { updatePassword } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Check if the user has an active session or a recovery token in URL
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            // Supabase automatically logs the user in when they click the recovery link,
            // so session should exist here.
            if (!session) {
                setError('Your password reset link has expired or is invalid. Please request a new one.');
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            const { success, error } = await updatePassword(password);
            if (success) {
                setIsSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(error || 'Failed to reset password. Please try again.');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans">
                <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)]" />

                <div className="flex-1 flex items-center justify-center py-12 px-6 relative z-10 w-full">
                    <div className="w-full max-w-md text-center bg-background/80 backdrop-blur-md border border-[#D4AF37]/20 p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative">
                        <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                            <CheckCircle2 className="h-6 w-6 text-[#D4AF37]" />
                        </div>
                        <h2 className="text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#AA771C] via-[#F3E5AB] to-[#D4AF37] mb-3 tracking-tight">Password Reset Successful</h2>
                        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                            Your password has been securely updated. You will be redirected to the login page shortly.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans">
            <SEO title="Reset Password" description="Set a new password for your Golden Tier Peptide account. Secure your access with updated credentials." />
            <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)]" />

            <div className="flex-1 flex items-center justify-center py-12 px-6 relative z-10 w-full">
                <div className="w-full max-w-md">

                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-6">
                            <img src="/brand-logo-gold.png" alt="Golden Tier Logo" className="h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
                        </div>
                        <h1 className="text-4xl font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#AA771C] via-[#F3E5AB] to-[#D4AF37] mb-3">Set New Password</h1>
                        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C]">Enter your new credentials</p>
                    </div>

                    <div className="bg-background/80 backdrop-blur-md border border-[#D4AF37]/20 p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative">
                        {error && (
                            <SecurityAlert
                              variant="error"
                              message={error}
                              onDismiss={() => setError('')}
                              className="mb-6"
                            />
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="reset-password" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                                    <input
                                        id="reset-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-sm transition-all text-foreground placeholder:text-muted-foreground/50"
                                        placeholder="YOUR NEW PASSWORD"
                                        required
                                    />
                                </div>
                                <PasswordStrengthMeter password={password} />
                            </div>

                            <div>
                                <label htmlFor="reset-confirm" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                                    <input
                                        id="reset-confirm"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-sm transition-all text-foreground placeholder:text-muted-foreground/50"
                                        placeholder="CONFIRM NEW PASSWORD"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-8 group relative w-full h-12 bg-[#111] text-white font-semibold text-[10px] tracking-[0.2em] uppercase transition-all disabled:opacity-50 overflow-hidden flex items-center justify-center space-x-2"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                                <span className="relative z-10">{isLoading ? 'Updating...' : 'Update Password'}</span>
                                <ArrowRight className="relative z-10 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-500 ease-out group-hover:w-full" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
