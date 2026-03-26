import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('Uncaught error in 3D Canvas:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
                    {/* Decorative gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-white to-[#AA771C]/5" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.08)_0%,_rgba(255,255,255,0)_70%)]" />
                    {/* Decorative ring */}
                    <div className="relative w-24 h-24 mb-4">
                        <div className="absolute inset-0 border border-[#D4AF37]/30 rounded-full animate-pulse" />
                        <div className="absolute inset-3 border border-[#D4AF37]/20 rounded-full" />
                        <div className="absolute inset-6 bg-gradient-to-br from-[#D4AF37]/10 to-[#AA771C]/10 rounded-full flex items-center justify-center">
                            <span className="text-[#D4AF37] font-serif text-lg">Au</span>
                        </div>
                    </div>
                    <p className="relative text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C] mb-1">Golden Tier</p>
                    <p className="relative text-xs text-muted-foreground text-center tracking-wide">Premium Research Compounds</p>
                </div>
            );
        }

        return this.props.children;
    }
}
