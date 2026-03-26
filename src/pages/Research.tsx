import { FlaskConical, ShieldCheck, FileSearch, BookOpen } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function Research() {
    return (
        <div className="min-h-screen bg-card py-14 relative overflow-hidden">
            {/* Luxury Background Hint */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.03)_0%,_rgba(255,255,255,1)_80%)] pointer-events-none z-0" />

            <SEO
                title="Research Standards | Golden Tier"
                description="Explore Golden Tier's commitment to analytical integrity, rigorous third-party verification, and strict purity protocols for all elite compounds."
            />
            <div className="container mx-auto px-6 md:px-12 max-w-5xl relative z-10">
                <Breadcrumbs />
                <div className="text-center mb-16 mt-8">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C] mb-4 block">Protocols</span>
                    <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6 tracking-tight">Analytical Excellence</h1>
                    <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed tracking-wide">
                        Our dedication to absolute scientific integrity dictates every step of our synthesis, analysis, and fulfillment processes.
                    </p>
                </div>

                <div className="space-y-8">
                    {[
                        {
                            icon: FlaskConical,
                            title: 'Independent Verification',
                            content: 'Every isolated batch undergoes rigorous, independent third-party analysis using High-Performance Liquid Chromatography (HPLC) and Mass Spectrometry (MS) to definitively confirm identity and concentration. Comprehensive Certificates of Analysis (CoA) accompany every order upon request.',
                        },
                        {
                            icon: ShieldCheck,
                            title: 'Supreme Purity Thresholds',
                            content: 'We adhere to an uncompromising minimum purity threshold of 98%, with the majority of formulations testing significantly above 99%. Our stringent QA/QC protocol includes multiphase visual inspection, precise gravimetric verification, and final tier-approval before distribution.',
                        },
                        {
                            icon: FileSearch,
                            title: 'Complete Traceability',
                            content: 'Each distinct formulation is assigned a precise SKU and immutable batch identifier, ensuring absolute traceability from sterile synthesis to secured delivery. Our digital ledger system allows elite researchers instant access to batch-specific analytical reporting.',
                        },
                        {
                            icon: BookOpen,
                            title: 'Restricted In-Vitro Application',
                            content: 'All compounds distributed by Golden Tier are synthesized exclusively for advanced in-vitro research and highly regulated laboratory environments. They are legally restricted from human or veterinary consumption and are supplied strictly to qualified research bodies.',
                        },
                    ].map((item, index) => (
                        <div key={item.title} className="bg-card border border-[#D4AF37]/20 p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(212,175,55,0.08)] transition-all duration-500 group relative overflow-hidden">
                            {/* Subtle hover gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -translate-x-full group-hover:translate-x-full" />

                            <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                                <div className="w-16 h-16 bg-[#111] border border-[#222] flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden group-hover:border-[#D4AF37]/50 transition-colors duration-500">
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-[#D4AF37]/20 blur-xl rounded-full" />
                                    <item.icon className="h-7 w-7 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <span className="text-[10px] font-bold text-[#AA771C] font-mono">0{index + 1}</span>
                                        <h3 className="text-2xl font-serif text-foreground tracking-tight">{item.title}</h3>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed font-light mt-4 tracking-wide">{item.content}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
