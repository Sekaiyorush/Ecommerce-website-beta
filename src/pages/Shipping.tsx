import { SEO } from '@/components/SEO';

export function Shipping() {
    return (
        <div className="min-h-screen bg-background py-16 relative overflow-hidden">
            <SEO title="Shipping & Returns" description="Explore Golden Tier Peptide shipping options, delivery timelines, and return policies for research compounds." />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.03)_0%,_transparent_80%)] pointer-events-none z-0" />

            <div className="container mx-auto px-6 md:px-12 max-w-4xl relative z-10">
                <div className="text-center mb-16">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C] mb-4 block">Logistics</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight">Shipping & Returns</h1>
                </div>

                <div className="bg-card border border-[#D4AF37]/20 p-10 md:p-16 shadow-[0_8px_30px_rgba(0,0,0,0.02)] prose prose-slate max-w-none prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-tight prose-h3:text-2xl prose-h3:text-foreground prose-h3:mb-6 prose-h4:text-lg prose-h4:text-foreground prose-p:text-muted-foreground prose-p:font-light prose-p:tracking-wide prose-p:leading-relaxed prose-li:text-muted-foreground prose-li:font-light prose-li:tracking-wide prose-strong:text-foreground prose-strong:font-semibold">
                    <h3 className="flex items-center gap-4">
                        <span className="w-10 h-px bg-[#D4AF37] inline-block" />
                        Logistics Policy
                    </h3>
                    <p>
                        We process and orchestrate secure shipping Monday through Friday. Authorizations finalized before 1:00 PM EST are typically fulfilled the exact same day. Authorizations processed post-cutoff or during weekends commence fulfillment the following business cycle.
                    </p>

                    <h4>Domestic Priority (US)</h4>
                    <ul className="marker:text-[#AA771C]">
                        <li><strong>Standard Fulfillment:</strong> 3-5 business days</li>
                        <li><strong>Priority Fulfillment:</strong> 2-3 business days</li>
                        <li><strong>Expedited Overnight:</strong> Next business day (where infrastructure allows)</li>
                    </ul>

                    <h4>International Reach</h4>
                    <p>
                        Golden Tier provides shipping to vetted international destinations. Delivery intervals range typically from 7-14 business days. The acquirer assumes ultimate responsibility for all customs clearance, definitive import duties, and strict comprehension regarding local importation regulations of analytical compounds. We claim zero liability for pacakges seized by regulatory authorities.
                    </p>

                    <hr className="my-16 border-t border-[#D4AF37]/20" />

                    <h3 className="flex items-center gap-4">
                        <span className="w-10 h-px bg-[#D4AF37] inline-block" />
                        Returns & Integrity
                    </h3>
                    <p>
                        Due to the ultra-sensitive nature of our synthesized compounds, returns are strictly prohibited once a package enters transit and the temperature/quality seal logic is breached. This absolute policy guarantees the pristine purity and uncompromising integrity of our entire active supply chain.
                    </p>

                    <h4>Refund Exclusions</h4>
                    <ul className="marker:text-[#AA771C]">
                        <li><strong>Transit Compromise:</strong> Should a parcel arrive damaged, photographic documentation is required; inform our concierge within 48 hours.</li>
                        <li><strong>Fulfillment Discrepancies:</strong> If a packing sequence error occurred on our end, the accurate items will be reshipped instantly at zero cost to the client.</li>
                        <li><strong>Tracking Absences:</strong> If standard tracking reflects null updates for 14 days (domestic) or 30 days (international), a formal investigation triggers, yielding a replacement or refund based on resolution.</li>
                    </ul>

                    <div className="mt-12 p-8 border border-[#D4AF37]/10 bg-muted tracking-wide text-sm text-muted-foreground text-center">
                        For any logistical anomalies or integrity inquiries, direct correspondence to <a href="mailto:support@goldentierpeptide.com" className="text-[#AA771C] hover:text-[#D4AF37] font-semibold transition-colors">support@goldentierpeptide.com</a> citing your Authorization ID.
                    </div>
                </div>
            </div>
        </div>
    );
}
