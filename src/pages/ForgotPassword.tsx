import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { SecurityAlert } from '@/components/ui/security-alert';
import { SEO } from '@/components/SEO';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { resetPasswordForEmail } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { success, error } = await resetPasswordForEmail(email);
            if (success) {
                setIsSuccess(true);
            } else {
                setError(error || 'Failed to send reset link. Please check your email.');
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
                            <Mail className="h-6 w-6 text-[#AA771C]" />
                        </div>
                        <h1 className="text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#AA771C] via-[#F3E5AB] to-[#D4AF37] mb-3 tracking-tight">Check your email</h1>
                        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                            We've sent a password reset link to <strong className="text-[#D4AF37]">{email}</strong>.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block w-full py-3 bg-[#111] text-white transition-all font-semibold text-[10px] tracking-[0.2em] uppercase overflow-hidden group relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                            <span className="relative z-10">Return to Login</span>
                            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-500 ease-out group-hover:w-full" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans">
            <SEO title="Forgot Password" description="Reset your Golden Tier Peptide account password. Enter your email to receive a secure reset link." />
            <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)]" />

            <div className="flex-1 flex items-center justify-center py-12 px-6 relative z-10 w-full">
                <div className="w-full max-w-md">
                    <Link to="/login" className="inline-flex items-center text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground hover:text-[#D4AF37] mb-8 transition-colors group">
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to login
                    </Link>

                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-6">
                            <img src="/brand-logo-gold.png" alt="Golden Tier Logo" className="h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
                        </div>
                        <h1 className="text-4xl font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#AA771C] via-[#F3E5AB] to-[#D4AF37] mb-3">Reset Password</h1>
                        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C]">Enter email to receive link</p>
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
                                <label htmlFor="forgot-email" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-sm transition-all text-foreground placeholder:text-muted-foreground/50"
                                        placeholder="ENTER EMAIL ADDRESS"
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
                                <span className="relative z-10">{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
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
