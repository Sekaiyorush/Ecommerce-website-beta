import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  barColor: string;
  checks: { label: string; met: boolean }[];
}

function evaluateStrength(password: string): StrengthResult {
  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character (!@#$…)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = checks.filter(c => c.met).length as 0 | 1 | 2 | 3 | 4;

  const levels: Array<{ label: string; color: string; barColor: string }> = [
    { label: '', color: 'text-muted-foreground', barColor: 'bg-muted' },
    { label: 'Weak', color: 'text-red-500', barColor: 'bg-red-400' },
    { label: 'Fair', color: 'text-amber-500', barColor: 'bg-amber-400' },
    { label: 'Good', color: 'text-blue-500', barColor: 'bg-blue-400' },
    { label: 'Strong', color: 'text-emerald-500', barColor: 'bg-emerald-500' },
  ];

  return { score: metCount, checks, ...levels[metCount] };
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => evaluateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn('space-y-2 pt-1', className)}>
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {([1, 2, 3, 4] as const).map((level) => (
            <div
              key={level}
              className={cn(
                'h-1 flex-1 transition-all duration-300',
                strength.score >= level ? strength.barColor : 'bg-muted border border-border'
              )}
            />
          ))}
        </div>
        {strength.label && (
          <span className={cn('text-[10px] font-bold tracking-[0.15em] uppercase w-12 text-right', strength.color)}>
            {strength.label}
          </span>
        )}
      </div>

      {/* Requirement checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {strength.checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5">
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors',
                check.met ? 'bg-emerald-500' : 'bg-muted'
              )}
            />
            <span className={cn('text-[10px] tracking-wide', check.met ? 'text-muted-foreground' : 'text-muted-foreground')}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
