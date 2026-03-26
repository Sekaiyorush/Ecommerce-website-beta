import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Ticket, Check, X, ArrowRight } from 'lucide-react';
import { SecurityAlert } from '@/components/ui/security-alert';
import { SEO } from '@/components/SEO';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  invitationCode: z.string()
    .min(6, 'Invitation code must be at least 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Invalid invitation code format'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type RegisterFormData = z.infer<typeof RegisterSchema>;

export function Register() {
  const [name, setName] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; message: string; type?: string } | null>(null);
  const { register: registerUser, validateCode } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
  });

  const validateInvitationCode = async (code: string) => {
    if (!code) {
      setCodeValidation(null);
      return;
    }

    setCodeValidating(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const result = await validateCode(code);

    if (result.valid && result.code) {
      let typeLabel = 'User';
      if (result.code.type === 'admin_partner') typeLabel = 'Partner';
      if (result.code.type === 'partner_user') typeLabel = 'Customer (via Partner)';

      setCodeValidation({
        valid: true,
        message: `Valid ${typeLabel} invitation code`,
        type: result.code.type,
      });
    } else {
      setCodeValidation({
        valid: false,
        message: result.error || 'Invalid invitation code',
      });
    }
    setCodeValidating(false);
  };

  const handleCodeChange = (value: string) => {
    const upper = value.trim().toUpperCase();
    setValue('invitationCode', upper, { shouldValidate: false });
    if (upper.length >= 6) {
      validateInvitationCode(upper);
    } else {
      setCodeValidation(null);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');

    if (!codeValidation?.valid) {
      setServerError('Please enter a valid invitation code');
      return;
    }

    setIsLoading(true);

    const result = await registerUser(name, data.email, data.password, data.invitationCode);

    if (result.success) {
      navigate('/');
    } else {
      setServerError(result.error || 'Registration failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans">
      <SEO title="Create Account" description="Register for a Golden Tier Peptide account with an invitation code to access premium research compounds." />
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06)_0%,_transparent_60%)]" />

      <div className="flex-1 flex items-center justify-center py-12 px-6 relative z-10 w-full">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <img src="/brand-logo-gold.png" alt="Golden Tier Logo" className="h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
            </div>
            <h1 className="text-4xl font-serif tracking-tight text-gold-gradient mb-3">Create Account</h1>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold-primary">Invitation-only Registration</p>
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
              {/* Invitation Code - First and most important */}
              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">
                  Invitation Code <span className="text-[#D4AF37]">*</span>
                </label>
                <div className="relative">
                  <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                  <input
                    type="text"
                    {...register('invitationCode')}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    aria-invalid={!!errors.invitationCode}
                    aria-describedby={errors.invitationCode ? 'error-invitationCode' : undefined}
                    className={`w-full h-12 pl-12 pr-12 bg-transparent border focus:ring-0 transition-all uppercase text-sm text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600 ${codeValidation?.valid
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                      : codeValidation && !codeValidation.valid
                        ? 'border-red-300 bg-red-50/50 dark:bg-red-900/20'
                        : 'border-[#D4AF37]/20 focus:border-[#D4AF37]'
                      }`}
                    placeholder="ENTER INVITATION CODE"
                  />
                  {codeValidating && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!codeValidating && codeValidation && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {codeValidation.valid ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {codeValidation && (
                  <p className={`text-xs mt-1.5 ${codeValidation.valid ? 'text-emerald-600' : 'text-red-600'}`}>
                    {codeValidation.message}
                  </p>
                )}
                {errors.invitationCode && !codeValidation && (
                  <p id="error-invitationCode" className="text-xs text-red-600 mt-1.5">{errors.invitationCode.message}</p>
                )}
                <p className="text-[10px] tracking-wide uppercase text-muted-foreground mt-2">
                  Need a code? Contact an admin
                </p>
              </div>

              <div className="border-t border-[#D4AF37]/20 pt-6">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-sm transition-all text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      placeholder="ENTER FULL NAME"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                  <input
                    type="email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'error-email' : undefined}
                    className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-sm transition-all text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="ENTER YOUR EMAIL"
                  />
                </div>
                {errors.email && (
                  <p id="error-email" className="text-xs text-red-600 mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      onChange: (e) => setPasswordValue(e.target.value),
                    })}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'error-password' : undefined}
                    className="w-full h-12 pl-12 pr-12 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-sm transition-all text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="CREATE PASSWORD"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#D4AF37] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="error-password" className="text-xs text-red-600 mt-1.5">{errors.password.message}</p>
                )}
                <PasswordStrengthMeter password={passwordValue} />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'error-confirmPassword' : undefined}
                    className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-sm transition-all text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="CONFIRM PASSWORD"
                  />
                </div>
                {errors.confirmPassword && (
                  <p id="error-confirmPassword" className="text-xs text-red-600 mt-1.5">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !codeValidation?.valid}
                className="mt-8 group relative w-full h-12 bg-[#111] dark:bg-gold-500 text-white dark:text-slate-900 font-semibold text-[10px] tracking-[0.2em] uppercase transition-all disabled:opacity-50 overflow-hidden border border-[#111] dark:border-gold-500"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] dark:from-slate-900 dark:to-slate-800 transition-all duration-500 ease-out group-hover:w-full" />
              </button>
            </form>

            <div className="mt-8 text-center text-[10px] tracking-[0.2em] uppercase font-bold text-muted-foreground">
              <span>Already have an account? </span>
              <Link to="/login" className="text-gold-primary hover:text-gold-500 ml-2 transition-colors border-b border-gold-primary/30 hover:border-gold-500 pb-0.5">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
