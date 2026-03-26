import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const GoldenMoleculeCanvas = lazy(() => import('../components/GoldenMolecule').then(m => ({ default: m.GoldenMoleculeCanvas })));

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background mt-12 md:mt-24 mb-16 px-6 md:px-12 font-sans">
      {/* Subtle Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.05)_0%,_transparent_70%)]" />

      <div className="container relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">

        {/* Left Side: Typography */}
        <div className="flex-1 flex flex-col space-y-8 text-left">

          <div className="inline-flex items-center space-x-3 px-4 py-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 w-max">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[10px] text-[#AA771C] font-bold tracking-[0.3em] uppercase">Premium Research Grade</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-foreground leading-[1.1]">
            Unlock the <br />
            Future of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#AA771C] via-[#F3E5AB] to-[#D4AF37]">Research</span>
          </h1>

          <div className="w-12 h-[1px] bg-[#D4AF37] opacity-50" />

          <p className="max-w-md text-sm text-muted-foreground leading-relaxed tracking-wide uppercase">
            Premium grade compounds for laboratory use. Validated purity, consistent quality, and uncompromising precision.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 pt-4">
            <Link
              to="/products"
              aria-label="View our complete catalog of research peptides"
              className="relative inline-flex h-14 items-center justify-center bg-[#111] px-8 text-[11px] font-bold tracking-[0.2em] text-white uppercase overflow-hidden group border border-[#111] focus:ring-2 focus:ring-[#D4AF37] outline-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
              <span className="relative z-10 transition-colors group-hover:text-[#D4AF37]">View Catalog</span>
              <ArrowRight className="relative z-10 ml-3 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-[#D4AF37]" aria-hidden="true" />
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-500 ease-out group-hover:w-full" />
            </Link>
          </div>
        </div>

        {/* Right Side: Abstract Visual / Stats */}
        <div className="flex-1 relative w-full lg:h-[500px] flex items-center justify-center lg:justify-end">
          {/* 3D Canvas Container */}
          <div className="absolute inset-0 w-full h-full mix-blend-multiply opacity-90 max-w-[500px] right-0 ml-auto">
            <ErrorBoundary>
              <Suspense fallback={<div className="w-full h-full" />}>
                <GoldenMoleculeCanvas />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Architectural Wireframe Element */}
          <div className="relative w-full max-w-md aspect-square border-l border-t border-[#D4AF37]/20 flex items-center justify-center p-8 bg-transparent pointer-events-none transition-colors duration-1000 z-20 mix-blend-difference">
            <div className="absolute inset-4 border border-[#D4AF37]/10 flex flex-col justify-between p-6">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#D4AF37]" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#D4AF37]" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#D4AF37]" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#D4AF37]" />

              <div className="flex justify-between items-start opacity-70">
                <div className="space-y-1">
                  <p className="text-3xl font-serif text-foreground transition-colors duration-500">99%<span className="text-[#D4AF37]">+</span></p>
                  <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-muted-foreground">Purity</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-3xl font-serif text-foreground transition-colors duration-500">3D<span className="text-[#D4AF37]">+</span></p>
                  <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-muted-foreground">Model</p>
                </div>
              </div>

              <div className="flex justify-center text-center opacity-70">
                <div className="space-y-1">
                  <p className="text-3xl font-serif text-foreground transition-colors duration-500">24<span className="text-xl">h</span></p>
                  <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-muted-foreground">Shipping</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
