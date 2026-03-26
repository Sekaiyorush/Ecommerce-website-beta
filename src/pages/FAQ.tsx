import { useState } from 'react';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Plus, Minus } from 'lucide-react';

const faqs = [
    {
        question: 'Are your products for human consumption?',
        answer: 'No. All products sold by Golden Tier Peptide are strictly for laboratory and research use only. They are not intended for human consumption, diagnostic, therapeutic, or agricultural purposes.',
    },
    {
        question: 'How do you verify the purity of your peptides?',
        answer: 'We utilize independent third-party laboratories to conduct High-Performance Liquid Chromatography (HPLC) and Mass Spectrometry (MS) testing on every batch. We guarantee a minimum of 99% purity.',
    },
    {
        question: 'How should peptides be stored?',
        answer: 'Lyophilized (freeze-dried) peptides should be stored in a freezer at -20°C or below for long-term storage. Once reconstituted with bacteriostatic water, they should be stored in a refrigerator at 2°C to 8°C and used within their stable timeframe, typically 2-4 weeks.',
    },
    {
        question: 'What is your shipping policy?',
        answer: 'We offer same-day shipping on all orders placed before 2:00 PM EST. Standard shipping takes 3-5 business days, while expedited options are available at checkout. All packages are shipped discreetly.',
    },
    {
        question: 'Do you ship internationally?',
        answer: 'Yes, we offer international shipping to select countries. However, the buyer is solely responsible for ensuring that the products comply with their local customs and import regulations. We do not take responsibility for seized packages.',
    },
    {
        question: 'What is your return or refund policy?',
        answer: 'Due to the nature of research chemicals and potential degradation if mishandled, we cannot accept returns once the product has left our facility. However, if there is a documented issue with purity or damage during transit, please contact our support team within 48 hours of delivery.',
    },
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-card py-14 relative overflow-hidden">
            {/* Luxury Background Hint */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.03)_0%,_rgba(255,255,255,1)_80%)] pointer-events-none z-0" />

            <SEO
                title="FAQ | Golden Tier"
                description="Find answers to common questions about our research peptides, shipping, and quality standards."
            />

            <div className="container mx-auto px-6 md:px-12 max-w-4xl relative z-10">
                <Breadcrumbs />

                <div className="text-center mb-16 mt-8">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C] mb-4 block">Inquiries</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6 tracking-tight">Frequently Asked Questions</h1>
                    <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed tracking-wide">
                        Comprehensive information regarding our formulations, analytical standards, and acquisition protocols.
                    </p>
                </div>

                <div className="bg-card border border-[#D4AF37]/20 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`border-b border-[#D4AF37]/10 last:border-0 transition-colors ${openIndex === index ? 'bg-muted' : 'hover:bg-muted/50'}`}
                        >
                            <button
                                className="w-full px-8 py-8 flex items-center justify-between text-left focus:outline-none group"
                                onClick={() => toggleFaq(index)}
                            >
                                <span className="text-xl font-serif text-foreground pr-8 group-hover:text-[#AA771C] transition-colors">{faq.question}</span>
                                <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center transition-all duration-300 border ${openIndex === index ? 'bg-[#111] text-[#D4AF37] border-[#111] shadow-md' : 'bg-card text-muted-foreground border-[#D4AF37]/20 group-hover:border-[#D4AF37]/50 group-hover:text-[#AA771C]'}`}>
                                    {openIndex === index ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </span>
                            </button>

                            <div
                                className={`px-8 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 pb-8 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <p className="text-muted-foreground font-light leading-relaxed text-sm md:text-base tracking-wide">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-[#111] text-white p-12 text-center relative overflow-hidden shadow-2xl border border-[#222]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4AF37] mb-4 block">Further Assistance</span>
                        <h2 className="text-3xl font-serif mb-4 tracking-tight">Require Special Attention?</h2>
                        <p className="text-muted-foreground mb-8 font-light max-w-md mx-auto tracking-wide">Our scientific concierge team is available to assist with specific inquiries and partner arrangements.</p>
                        <a href="/contact" className="inline-block bg-card text-[#111] font-bold text-[10px] tracking-[0.2em] uppercase px-8 py-4 hover:bg-muted border border-transparent hover:border-[#D4AF37]/30 transition-all shadow-md group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                            <span className="relative z-10">CONTACT CONCIERGE</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
