import { useState } from 'react';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import { useDatabase } from '@/context/DatabaseContext';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const ContactSchema = z.object({
    fullName: z.string().min(2, 'Name is required').max(100, 'Name is too long'),
    email: z.string().email('Please enter a valid email address'),
    subject: z.string().min(2, 'Subject is required').max(150, 'Subject is too long'),
    message: z.string().min(10, 'Message is too short').max(1000, 'Message is too long')
});

type ContactFormData = z.infer<typeof ContactSchema>;

export function Contact() {
    const { db, submitContactForm } = useDatabase();
    const settings = db.siteSettings;
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ContactFormData>({
        resolver: zodResolver(ContactSchema),
    });

    const onSubmit = async (data: ContactFormData) => {
        setSubmitting(true);
        const result = await submitContactForm(data);
        setSubmitting(false);
        if (result.success) {
            setSent(true);
            toast.success('Message sent successfully');
        } else {
            toast.error(result.error || 'Failed to send message. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-background py-14 relative overflow-hidden">
            {/* Luxury Background Hint */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.03)_0%,_transparent_80%)] pointer-events-none z-0" />

            <SEO
                title="Concierge & Support | Golden Tier"
                description="Connect with Golden Tier for exclusive support regarding our premium research compounds, logistics, or partner inquiries."
            />
            <div className="container mx-auto px-6 md:px-12 max-w-5xl relative z-10">
                <Breadcrumbs />
                <div className="text-center mb-16 mt-8">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C] mb-4 block">Concierge</span>
                    <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6 tracking-tight">Contact Us</h1>
                    <p className="text-lg text-muted-foreground font-light max-w-xl mx-auto tracking-wide">
                        Our dedicated support team is available to assist you with inquiries regarding our formulations, logistics, or partner program.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {[
                        { icon: Mail, title: 'Direct Email', detail: settings.contactEmail, sub: 'Priority Response' },
                        { icon: Phone, title: 'Dedicated Phone', detail: settings.contactPhone, sub: settings.businessHours },
                        { icon: MapPin, title: 'Headquarters', detail: settings.contactLocation, sub: settings.shippingInfo },
                    ].map((item) => (
                        <div key={item.title} className="bg-card border border-[#D4AF37]/20 p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(212,175,55,0.08)] text-center group hover:-translate-y-1 transition-all duration-500">
                            <div className="w-14 h-14 bg-card border border-[#D4AF37]/10 flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <item.icon className="h-5 w-5 text-[#AA771C]" />
                            </div>
                            <h3 className="font-serif text-xl text-foreground mb-2">{item.title}</h3>
                            <p className="text-muted-foreground text-sm font-light tracking-wide">{item.detail}</p>
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mt-4">{item.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-card border border-[#D4AF37]/20 p-10 md:p-16 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col items-center text-center mb-12">
                        <div className="w-16 h-16 bg-[#111] border border-[#222] flex items-center justify-center mb-6 shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-[#D4AF37]/20 blur-xl rounded-full" />
                            <MessageSquare className="h-6 w-6 text-[#D4AF37] relative z-10" />
                        </div>
                        <h2 className="text-3xl font-serif text-foreground tracking-tight">Send an Inquiry</h2>
                        <p className="text-sm font-light text-muted-foreground mt-3 max-w-md tracking-wide">Provide detailed information so our team can assist you most effectively.</p>
                    </div>
                    {sent ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                                <span className="text-emerald-600 text-2xl">✓</span>
                            </div>
                            <h3 className="text-2xl font-serif text-foreground mb-2">Message Dispatched</h3>
                            <p className="text-sm text-muted-foreground">We will get back to you as soon as possible.</p>
                        </div>
                    ) : (
                        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)} aria-label="Contact form">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div>
                                    <label htmlFor="contact-fullName" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">Full Name</label>
                                    <input id="contact-fullName" type="text" {...register('fullName')} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'error-fullName' : undefined} className="w-full h-14 px-5 bg-muted border border-[#D4AF37]/20 focus:ring-1 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] focus:bg-card text-sm transition-all outline-none" placeholder="Dr. John Doe" />
                                    {errors.fullName && <p id="error-fullName" className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="contact-email" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">Email Address</label>
                                    <input id="contact-email" type="email" {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'error-contact-email' : undefined} className="w-full h-14 px-5 bg-muted border border-[#D4AF37]/20 focus:ring-1 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] focus:bg-card text-sm transition-all outline-none" placeholder="name@institution.edu" />
                                    {errors.email && <p id="error-contact-email" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="contact-subject" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">Subject</label>
                                <input id="contact-subject" type="text" {...register('subject')} aria-invalid={!!errors.subject} aria-describedby={errors.subject ? 'error-subject' : undefined} className="w-full h-14 px-5 bg-muted border border-[#D4AF37]/20 focus:ring-1 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] focus:bg-card text-sm transition-all outline-none" placeholder="Nature of your inquiry" />
                                {errors.subject && <p id="error-subject" className="text-xs text-red-600 mt-1">{errors.subject.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="contact-message" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">Message</label>
                                <textarea id="contact-message" rows={5} {...register('message')} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'error-message' : undefined} className="w-full px-5 py-5 bg-muted border border-[#D4AF37]/20 focus:ring-1 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] focus:bg-card text-sm transition-all resize-none outline-none" placeholder="Please detail your request..." />
                                {errors.message && <p id="error-message" className="text-xs text-red-600 mt-1">{errors.message.message}</p>}
                            </div>
                            <button type="submit" disabled={submitting} className="w-full h-16 mt-8 bg-[#111] border border-[#111] text-white text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-black shadow-md group relative overflow-hidden flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                                <span className="relative z-10 transition-colors group-hover:text-[#D4AF37]">{submitting ? 'SENDING...' : 'DISPATCH MESSAGE'}</span>
                                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-500 ease-out group-hover:w-full" />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
