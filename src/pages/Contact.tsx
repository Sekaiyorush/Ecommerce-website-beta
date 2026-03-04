import { useState } from 'react';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import { useDatabase } from '@/context/DatabaseContext';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function Contact() {
    const { db } = useDatabase();
    const settings = db.siteSettings;
    const [sent, setSent] = useState(false);
    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="min-h-screen bg-white py-14 relative overflow-hidden">
            {/* Luxury Background Hint */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.03)_0%,_rgba(255,255,255,1)_80%)] pointer-events-none z-0" />

            <SEO
                title="Concierge & Support | Golden Tier"
                description="Connect with Golden Tier for exclusive support regarding our premium research compounds, logistics, or partner inquiries."
            />
            <div className="container mx-auto px-6 md:px-12 max-w-5xl relative z-10">
                <Breadcrumbs />
                <div className="text-center mb-16 mt-8">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C] mb-4 block">Concierge</span>
                    <h1 className="text-4xl md:text-6xl font-serif text-slate-900 mb-6 tracking-tight">Contact Us</h1>
                    <p className="text-lg text-slate-500 font-light max-w-xl mx-auto tracking-wide">
                        Our dedicated support team is available to assist you with inquiries regarding our formulations, logistics, or partner program.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {[
                        { icon: Mail, title: 'Direct Email', detail: settings.contactEmail, sub: 'Priority Response' },
                        { icon: Phone, title: 'Dedicated Phone', detail: settings.contactPhone, sub: settings.businessHours },
                        { icon: MapPin, title: 'Headquarters', detail: settings.contactLocation, sub: settings.shippingInfo },
                    ].map((item) => (
                        <div key={item.title} className="bg-white border border-[#D4AF37]/20 p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(212,175,55,0.08)] text-center group hover:-translate-y-1 transition-all duration-500">
                            <div className="w-14 h-14 bg-white border border-[#D4AF37]/10 flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <item.icon className="h-5 w-5 text-[#AA771C]" />
                            </div>
                            <h3 className="font-serif text-xl text-slate-900 mb-2">{item.title}</h3>
                            <p className="text-slate-500 text-sm font-light tracking-wide">{item.detail}</p>
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mt-4">{item.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white border border-[#D4AF37]/20 p-10 md:p-16 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col items-center text-center mb-12">
                        <div className="w-16 h-16 bg-[#111] border border-[#222] flex items-center justify-center mb-6 shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-[#D4AF37]/20 blur-xl rounded-full" />
                            <MessageSquare className="h-6 w-6 text-[#D4AF37] relative z-10" />
                        </div>
                        <h2 className="text-3xl font-serif text-slate-900 tracking-tight">Send an Inquiry</h2>
                        <p className="text-sm font-light text-slate-500 mt-3 max-w-md tracking-wide">Provide detailed information so our team can assist you most effectively.</p>
                    </div>
                    {sent ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                                <span className="text-emerald-600 text-2xl">✓</span>
                            </div>
                            <h3 className="text-2xl font-serif text-slate-900 mb-2">Message Dispatched</h3>
                            <p className="text-sm text-slate-500">We will get back to you as soon as possible.</p>
                        </div>
                    ) : (
                        <form className="space-y-8" onSubmit={handleContactSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-3">Full Name</label>
                                    <input type="text" required className="w-full h-14 px-5 bg-slate-50 border border-[#D4AF37]/20 focus:ring-1 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] focus:bg-white text-sm transition-all outline-none" placeholder="Dr. John Doe" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-3">Email Address</label>
                                    <input type="email" required className="w-full h-14 px-5 bg-slate-50 border border-[#D4AF37]/20 focus:ring-1 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] focus:bg-white text-sm transition-all outline-none" placeholder="name@institution.edu" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-3">Subject</label>
                                <input type="text" required className="w-full h-14 px-5 bg-slate-50 border border-[#D4AF37]/20 focus:ring-1 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] focus:bg-white text-sm transition-all outline-none" placeholder="Nature of your inquiry" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-3">Message</label>
                                <textarea rows={5} required className="w-full px-5 py-5 bg-slate-50 border border-[#D4AF37]/20 focus:ring-1 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] focus:bg-white text-sm transition-all resize-none outline-none" placeholder="Please detail your request..." />
                            </div>
                            <button type="submit" className="w-full h-16 mt-8 bg-[#111] border border-[#111] text-white text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-black shadow-md group relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                                <span className="relative z-10 transition-colors group-hover:text-[#D4AF37]">DISPATCH MESSAGE</span>
                                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-500 ease-out group-hover:w-full" />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
