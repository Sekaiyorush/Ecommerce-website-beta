import { Shield, Award, Microscope, Users } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function About() {
    return (
        <div className="min-h-screen bg-card relative overflow-hidden">
            {/* Luxury Background Hint */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.03)_0%,_rgba(255,255,255,1)_80%)] pointer-events-none z-0" />

            <SEO
                title="About | Golden Tier"
                description="Learn about Golden Tier's mission to provide the highest-purity, reliable research compounds for scientific exploration."
            />
            <div className="container mx-auto px-6 md:px-12 pt-12 relative z-10">
                <Breadcrumbs />
            </div>

            {/* Hero Section */}
            <section className="relative py-24 md:py-32 bg-[#111] text-white mt-12 overflow-hidden border-b border-[#222]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 blur-3xl -translate-y-1/2 translate-x-1/3 rounded-full pointer-events-none" />
                <div className="container mx-auto px-6 md:px-12 max-w-5xl relative z-10">
                    <div className="max-w-3xl">
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4AF37] mb-6 block">Our Purpose</span>
                        <h1 className="text-5xl md:text-7xl font-serif mb-8 tracking-tight leading-tight">Elevating Scientific Discovery</h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light tracking-wide">
                            We are an ultra-premium research compound supplier committed to absolute purity, rigorous analytical testing, and exceptional quality for the global scientific community.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-6 md:px-12 max-w-5xl py-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    {[
                        { icon: Shield, title: 'Uncompromising Quality', desc: 'Every formulation undergoes rigorous third-party HPLC and mass spectrometry testing to guarantee purity levels above 99%.' },
                        { icon: Award, title: 'Elite Standards', desc: 'We adhere to strict GMP-compliant protocols and maintain comprehensive analytical documentation for every single batch.' },
                        { icon: Microscope, title: 'Dedicated Research', desc: 'Our compounds are synthesized exclusively for legitimate scientific research, analytical progression, and laboratory applications.' },
                        { icon: Users, title: 'Global Network', desc: 'We collaborate with distinguished researchers and leading institutions worldwide through our vetted, exclusive partner program.' },
                    ].map((item) => (
                        <div key={item.title} className="bg-card border border-[#D4AF37]/20 p-10 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(212,175,55,0.08)] transition-all duration-500 hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-card border border-[#D4AF37]/10 flex items-center justify-center mb-8 shadow-sm">
                                <item.icon className="h-6 w-6 text-[#AA771C] group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <h3 className="text-2xl font-serif text-foreground mb-4 tracking-tight">{item.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed tracking-wide">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="relative bg-card border border-[#D4AF37]/20 p-12 md:p-20 shadow-[0_8px_30px_rgba(0,0,0,0.02)] text-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.03)_0%,_transparent_70%)] pointer-events-none" />
                    <div className="relative z-10">
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C] mb-4 block">The Vision</span>
                        <h2 className="text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#AA771C] via-[#F3E5AB] to-[#D4AF37] mb-6 tracking-tight">Our Philosophy</h2>
                        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto tracking-wide text-base">
                            Golden Tier exists to arm elite researchers with the highest-quality compounds attainable. We believe that absolute analytical purity is the non-negotiable foundation of meaningful scientific discovery. Every formulation we provide is backed by transparent, verifiable data and handled with precise care.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
