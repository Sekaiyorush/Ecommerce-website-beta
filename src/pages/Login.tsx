import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { SecurityAlert } from '@/components/ui/security-alert';
import { SEO } from '@/components/SEO';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormData = z.infer<typeof LoginSchema>;

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        navigate('/');
      } else {
        setServerError(result.error || 'Invalid email or password');
      }
    } catch {
      setServerError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans">
      <SEO title="Sign In" description="Sign in to your Golden Tier Peptide account to access premium research compounds, order tracking, and partner features." />
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06)_0%,_transparent_60%)]" />

      <div className="flex-1 flex items-center justify-center py-12 px-6 relative z-10 w-full">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <img src="/brand-logo-gold.png" alt="Golden Tier Logo" className="h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
            </div>
            <h1 className="text-4xl font-serif tracking-tight text-gold-gradient mb-3">Welcome Back</h1>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold-primary">Access Your Portal</p>
          </div>

          <div className="bg-card/80 backdrop-blur-md border border-[#D4AF37]/20 p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.2)] relative">
            {serverError && (
              <SecurityAlert
                variant="error"
                message={serverError}
                onDismiss={() => setServerError('')}
                className="mb-6"
              />
            )}

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="login-email" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                  <input
                    id="login-email"
                    type="email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'error-email' : undefined}
                    className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-sm transition-all text-foreground placeholder:text-muted-foreground"
                    placeholder="ENTER YOUR EMAIL"
                  />
                </div>
                {errors.email && (
                  <p id="error-email" className="text-xs text-red-600 mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'error-password' : undefined}
                    className="w-full h-12 pl-12 pr-12 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-sm transition-all text-foreground placeholder:text-muted-foreground"
                    placeholder="ENTER YOUR PASSWORD"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#D4AF37] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="error-password" className="text-xs text-red-600 mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase">
                <label className="flex items-center gap-2 group cursor-pointer">
                  <input type="checkbox" className="rounded-none border-[#D4AF37]/30 text-[#D4AF37] focus:ring-[#D4AF37]/30" />
                  <span className="text-muted-foreground group-hover:text-[#D4AF37] transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-gold-primary hover:text-gold-500 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full h-12 bg-[#111] dark:bg-gold-500 text-white dark:text-slate-900 font-semibold text-[10px] tracking-[0.2em] uppercase transition-all disabled:opacity-50 overflow-hidden mt-4 border border-[#111] dark:border-gold-500"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] dark:from-slate-900 dark:to-slate-800 transition-all duration-500 ease-out group-hover:w-full" />
              </button>
            </form>

            <div className="mt-8 text-center text-[10px] tracking-[0.2em] uppercase font-bold text-muted-foreground">
              <span>Don't have an account? </span>
              <Link to="/register" className="text-gold-primary hover:text-gold-500 ml-2 transition-colors border-b border-gold-primary/30 hover:border-gold-500 pb-0.5">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
