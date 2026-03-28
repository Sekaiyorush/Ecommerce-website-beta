import { SEO } from '@/components/SEO';

export function Terms() {
    return (
        <div className="min-h-screen bg-background py-16 relative overflow-hidden">
            <SEO title="Terms of Service" description="Read the terms and conditions governing your use of Golden Tier Peptide products and services." />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.03)_0%,_transparent_80%)] pointer-events-none z-0" />

            <div className="container mx-auto px-6 md:px-12 max-w-4xl relative z-10">
                <div className="text-center mb-16">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C] mb-4 block">Legal</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight">Terms of Service</h1>
                </div>

                <div className="bg-card border border-[#D4AF37]/20 p-10 md:p-16 shadow-[0_8px_30px_rgba(0,0,0,0.02)] prose prose-slate max-w-none prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-tight prose-h3:text-2xl prose-h3:text-foreground prose-h3:mb-6 prose-p:text-muted-foreground prose-p:font-light prose-p:leading-relaxed prose-p:tracking-wide prose-strong:text-foreground prose-strong:font-semibold">
                    <h3 className="flex items-center gap-4">
                        <span className="w-10 h-px bg-[#D4AF37] inline-block" />
                        1. Exclusive Research Applications
                    </h3>
                    <p>
                        All chemical architecture provided by Golden Tier is distributed <strong>solely and strictly for advanced in-vitro research and laboratory-based analytical use</strong>. These compounds are categorically <strong>not</strong> for any human use, therapeutic diagnostics, veterinary applications, or domestic scenarios. By proceeding with an acquisition via our platform, you legally bind yourself to this definition and declare you are an authorized researcher operating within a compliant institutional or independent lab environment.
                    </p>

                    <h3 className="flex items-center gap-4 mt-12">
                        <span className="w-10 h-px bg-[#D4AF37] inline-block" />
                        2. Indemnification & Liability
                    </h3>
                    <p>
                        The executing acquirer claims totalitarian responsibility enforcing safe storage, handling regulations, and overarching legal compliance governing their geographic jurisdiction regarding research materials. Under zero circumstances shall Golden Tier bare liability for damages—consequential, tertiary, direct or otherwise—spawning from the handling, interaction, or experimental usage of our physical distributions.
                    </p>

                    <h3 className="flex items-center gap-4 mt-12">
                        <span className="w-10 h-px bg-[#D4AF37] inline-block" />
                        3. Temporal Thresholds
                    </h3>
                    <p>
                        You are mandated to be at least 18 chronological years of age to interact securely with our procurement modules. The execution of an acquisition intrinsically confirms satisfaction of this legal requirement.
                    </p>

                    <h3 className="flex items-center gap-4 mt-12">
                        <span className="w-10 h-px bg-[#D4AF37] inline-block" />
                        4. Account Nullification
                    </h3>
                    <p>
                        Golden Tier wields the unequivocal sovereign right to block, freeze, or permanently vaporize consumer or partner accounts if our internal logic flags suspicion of non-compliant usage, intent to consume, or any infraction breaching these parameters spanning these Terms.
                    </p>

                    <h3 className="flex items-center gap-4 mt-12">
                        <span className="w-10 h-px bg-[#D4AF37] inline-block" />
                        5. Iterative Frameworks
                    </h3>
                    <p>
                        We preserve the right to dynamically append or edit these terms unilaterally. Ceaseless usage of the Golden Tier acquisition platform inherently validates your compliance with all synchronous, updated frameworks.
                    </p>
                </div>
            </div>
        </div>
    );
}
