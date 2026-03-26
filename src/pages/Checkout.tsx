import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCart, getItemPrice } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { logger } from '@/lib/logger';
import {
    ArrowLeft,
    CheckCircle2,
    Truck,
    CreditCard,
    ShoppingBag,
    Building2,
    Landmark,
    Bitcoin,
    AlertTriangle,
    Loader2,
} from 'lucide-react';
import { formatTHB } from '@/lib/formatPrice';
import { SEO } from '@/components/SEO';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

type PaymentMethod = 'bank_transfer' | 'crypto';

interface ShippingForm {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    notes: string;
}

const ShippingSchema = z.object({
    fullName: z.string().min(1, 'Full name is required').max(200, 'Full name is too long'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().regex(/^\+?\d[\d\s\-()]{6,19}$/, 'Please enter a valid phone number (7-20 characters)'),
    address: z.string().min(1, 'Street address is required').max(200, 'Address is too long'),
    city: z.string().min(1, 'City is required').max(200, 'City name is too long'),
    state: z.string().max(200, 'State name is too long').optional(),
    zip: z.string().max(20, 'ZIP code is too long').optional(),
    country: z.string().min(1, 'Country is required').max(200, 'Country name is too long'),
    notes: z.string().optional(),
});

type ShippingErrors = Partial<Record<keyof ShippingForm, string>>;

export function CheckoutPage() {
    const { items, cartSubtotal, discountAmount, cartTotal, clearCart, refreshCartPrices } = useCart();
    const { user, isPartner } = useAuth();
    const { createSecureOrder } = useDatabase();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [orderError, setOrderError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
    const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({});
    const [validationWarning, setValidationWarning] = useState('');

    useEffect(() => {
        let mounted = true;
        const validateCart = async () => {
            if (items.length === 0) return;
            
            // Fetch fresh products from DB for validation
            const { data: currentProducts } = await supabase.from('products').select('*');
            if (!currentProducts || !mounted) return;
            
            let stockIssue = false;
            let priceChanged = false;

            for (const item of items) {
                const currentProduct = currentProducts.find(p => p.id === item.product.id);
                if (!currentProduct) {
                    stockIssue = true;
                    continue;
                }

                if (item.selectedVariant) {
                    const currentVariant = currentProduct.variants?.find((v: { sku: string; stock: number; price: number }) => v.sku === item.selectedVariant!.sku);
                    if (!currentVariant || currentVariant.stock < item.quantity) {
                        stockIssue = true;
                    }
                    if (currentVariant && currentVariant.price !== item.selectedVariant.price) {
                        priceChanged = true;
                    }
                } else {
                    if (currentProduct.in_stock === false || currentProduct.stock_quantity < item.quantity) {
                        stockIssue = true;
                    }
                    if (Number(currentProduct.price) !== item.product.price) {
                        priceChanged = true;
                    }
                }
            }

            if (priceChanged) {
                // Map the raw DB products to the Product type expected by refreshCartPrices
                const mappedProducts = currentProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description || '',
                    fullDescription: p.full_description,
                    price: Number(p.price),
                    category: p.category,
                    purity: p.purity || '',
                    inStock: p.in_stock !== false,
                    stockQuantity: p.stock_quantity || 0,
                    sku: p.sku,
                    benefits: p.benefits || [],
                    dosage: p.dosage,
                    imageUrl: p.image_url,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at,
                    lowStockThreshold: p.low_stock_threshold || 10,
                    variants: p.variants || undefined,
                }));
                refreshCartPrices(mappedProducts);
            }

            if (stockIssue) {
                setValidationWarning('Some items in your cart are no longer in stock. Please review your cart.');
            } else if (priceChanged) {
                setValidationWarning('Prices for some items have updated. Please review your total.');
            }
        };
        validateCart();
        return () => { mounted = false; };
    }, [items.length, refreshCartPrices]);
    const [shipping, setShipping] = useState<ShippingForm>({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        notes: '',
    });

    const updateShipping = (field: keyof ShippingForm, value: string) => {
        setShipping(prev => ({ ...prev, [field]: value }));
        if (shippingErrors[field]) {
            setShippingErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleContinueToPayment = () => {
        const result = ShippingSchema.safeParse(shipping);
        if (!result.success) {
            const fieldErrors: ShippingErrors = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof ShippingForm;
                if (!fieldErrors[field]) {
                    fieldErrors[field] = issue.message;
                }
            }
            setShippingErrors(fieldErrors);
            return;
        }
        setShippingErrors({});
        setStep(2);
    };

    const handlePlaceOrder = async () => {
        if (items.length === 0 || !user) return;
        setIsSubmitting(true);
        setOrderError('');

        try {
            // Use server-side RPC for secure order creation
            // Prices, discounts, and stock are validated on the server
            const result = await createSecureOrder({
                items: items.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    variant_sku: item.selectedVariant?.sku || null,
                })),
                shipping_name: shipping.fullName,
                shipping_email: shipping.email,
                shipping_phone: shipping.phone,
                shipping_address: shipping.address,
                shipping_city: shipping.city,
                shipping_state: shipping.state,
                shipping_zip: shipping.zip,
                shipping_country: shipping.country,
                shipping_notes: shipping.notes,
                payment_method: paymentMethod,
            });

            if (result.success && result.order_id) {
                setOrderId(result.order_id);
                clearCart();
                setStep(3);
            } else {
                setOrderError(result.error || 'Failed to place order. Please try again.');
            }
        } catch (err) {
            logger.error('Order placement failed:', err);
            setOrderError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ──── Partner check ────
    if (!isPartner) {
        return <Navigate to="/products" replace />;
    }

    // ──── Empty cart ────
    if (items.length === 0 && step !== 3) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 relative overflow-hidden">
                {/* Subtle Glow */}
                <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06)_0%,_transparent_70%)]" />
                
                <div className="text-center relative z-10">
                    <div className="w-24 h-24 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-8 relative">
                        {/* Corner accents */}
                        <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-[#D4AF37]" />
                        <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-[#D4AF37]" />
                        <ShoppingBag className="h-10 w-10 text-[#D4AF37]/40" />
                    </div>
                    <h2 className="text-3xl font-serif text-foreground mb-3">Your cart is empty</h2>
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-10">Add premium compounds before checking out</p>
                    
                    <Link
                        to="/products"
                        className="relative inline-flex h-14 items-center justify-center bg-[#111] dark:bg-gold-500 px-10 text-[11px] font-bold tracking-[0.2em] text-white dark:text-foreground uppercase overflow-hidden group border border-[#111] dark:border-gold-500 focus:ring-2 focus:ring-[#D4AF37] outline-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                        <span className="relative z-10 transition-colors group-hover:text-[#D4AF37] dark:group-hover:text-slate-800">Browse Products</span>
                        <ArrowLeft className="relative z-10 ml-3 h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1 group-hover:text-[#D4AF37] dark:group-hover:text-slate-800" />
                        <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#AA771C] dark:from-slate-900 dark:to-slate-800 transition-all duration-500 ease-out group-hover:w-full" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 md:py-16 font-sans">
            <SEO title="Checkout | Golden Tier" description="Complete your order for premium research compounds. Secure checkout with partner pricing." />
            {/* Subtle Glow Background */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.02)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.04)_0%,_transparent_70%)]" />

            <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-6xl">

                {/* Back link */}
                <Link to="/products" className="inline-flex items-center text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-[#D4AF37] mb-10 transition-colors uppercase group">
                    <ArrowLeft className="h-3 w-3 mr-2 transition-transform group-hover:-translate-x-1" /> Back to Research Catalog
                </Link>

                {validationWarning && step !== 3 && (
                    <div className="mb-10 p-6 border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/20 flex items-start gap-4">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="text-xs font-bold tracking-widest text-amber-900 dark:text-amber-200 uppercase">Cart Validation Notice</h4>
                            <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px] font-medium mt-1 leading-relaxed">
                                {validationWarning}
                            </p>
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-16 gap-4">
                    {[
                        { num: 1, label: 'SHIPPING' },
                        { num: 2, label: 'PAYMENT' },
                        { num: 3, label: 'CONFIRMATION' },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center">
                            <div className="relative">
                                <div className={`flex items-center justify-center w-8 h-8 border text-[10px] font-bold tracking-widest transition-all
                                    ${step >= s.num ? 'border-[#D4AF37] bg-card text-gold-primary' : 'border-border dark:border-slate-700 text-muted-foreground'}`}>
                                    {step > s.num ? <CheckCircle2 className="h-3 w-3" /> : s.num}
                                </div>
                                {step === s.num && (
                                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[#AA771C]" />
                                )}
                            </div>
                            <span className={`ml-3 text-[10px] font-bold tracking-[0.2em] hidden sm:inline transition-colors ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {s.label}
                            </span>
                            {i < 2 && <div className={`w-8 sm:w-16 h-[1px] mx-4 transition-colors ${step > s.num ? 'bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* ──── Left: Form ──── */}
                    <div className="lg:col-span-8">

                        {/* Step 1: Shipping */}
                        {step === 1 && (
                            <div className="bg-card border border-border dark:border-slate-700 p-8 md:p-10 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#AA771C] to-[#D4AF37] opacity-20" />
                                
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-12 h-12 border border-[#D4AF37]/20 flex items-center justify-center">
                                        <Truck className="h-5 w-5 text-gold-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-serif text-foreground leading-none">Shipping Information</h2>
                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-2">Delivery logistics for premium compounds</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">Full Name *</label>
                                            <input type="text" value={shipping.fullName}
                                                onChange={e => updateShipping('fullName', e.target.value)}
                                                className="w-full h-12 px-4 border border-border dark:border-slate-700 bg-transparent focus:border-[#D4AF37] outline-none transition-colors" />
                                            {shippingErrors.fullName && (
                                                <p className="text-[10px] text-red-600 font-bold tracking-tight mt-1 uppercase italic">{shippingErrors.fullName}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">Email *</label>
                                            <input type="email" value={shipping.email}
                                                onChange={e => updateShipping('email', e.target.value)}
                                                className="w-full h-12 px-4 border border-border dark:border-slate-700 bg-transparent focus:border-[#D4AF37] outline-none transition-colors" />
                                            {shippingErrors.email && (
                                                <p className="text-[10px] text-red-600 font-bold tracking-tight mt-1 uppercase italic">{shippingErrors.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">Phone Number *</label>
                                        <input type="tel" value={shipping.phone}
                                            onChange={e => updateShipping('phone', e.target.value)}
                                            className="w-full h-12 px-4 border border-border dark:border-slate-700 bg-transparent focus:border-[#D4AF37] outline-none transition-colors"
                                            placeholder="+1 (555) 000-0000" />
                                        {shippingErrors.phone && (
                                            <p className="text-[10px] text-red-600 font-bold tracking-tight mt-1 uppercase italic">{shippingErrors.phone}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">Street Address *</label>
                                        <input type="text" value={shipping.address}
                                            onChange={e => updateShipping('address', e.target.value)}
                                            className="w-full h-12 px-4 border border-border dark:border-slate-700 bg-transparent focus:border-[#D4AF37] outline-none transition-colors"
                                            placeholder="123 Main St, Apt 4" />
                                        {shippingErrors.address && (
                                            <p className="text-[10px] text-red-600 font-bold tracking-tight mt-1 uppercase italic">{shippingErrors.address}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        <div className="col-span-2 sm:col-span-1 space-y-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">City *</label>
                                            <input type="text" value={shipping.city}
                                                onChange={e => updateShipping('city', e.target.value)}
                                                className="w-full h-12 px-4 border border-border dark:border-slate-700 bg-transparent focus:border-[#D4AF37] outline-none transition-colors" />
                                            {shippingErrors.city && (
                                                <p className="text-[10px] text-red-600 font-bold tracking-tight mt-1 uppercase italic">{shippingErrors.city}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">State</label>
                                            <input type="text" value={shipping.state}
                                                onChange={e => updateShipping('state', e.target.value)}
                                                className="w-full h-12 px-4 border border-border dark:border-slate-700 bg-transparent focus:border-[#D4AF37] outline-none transition-colors" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">ZIP</label>
                                            <input type="text" value={shipping.zip}
                                                onChange={e => updateShipping('zip', e.target.value)}
                                                className="w-full h-12 px-4 border border-border dark:border-slate-700 bg-transparent focus:border-[#D4AF37] outline-none transition-colors" />
                                            {shippingErrors.zip && (
                                                <p className="text-[10px] text-red-600 font-bold tracking-tight mt-1 uppercase italic">{shippingErrors.zip}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">Country *</label>
                                            <input type="text" value={shipping.country}
                                                onChange={e => updateShipping('country', e.target.value)}
                                                className="w-full h-12 px-4 border border-border dark:border-slate-700 bg-transparent focus:border-[#D4AF37] outline-none transition-colors"
                                                placeholder="US" />
                                            {shippingErrors.country && (
                                                <p className="text-[10px] text-red-600 font-bold tracking-tight mt-1 uppercase italic">{shippingErrors.country}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">Order Notes (optional)</label>
                                        <textarea rows={3} value={shipping.notes}
                                            onChange={e => updateShipping('notes', e.target.value)}
                                            className="w-full px-4 py-4 border border-border dark:border-slate-700 bg-transparent focus:border-[#D4AF37] outline-none transition-colors resize-none"
                                            placeholder="Special delivery instructions..." />
                                    </div>
                                </div>

                                <button
                                    onClick={handleContinueToPayment}
                                    className="w-full mt-10 h-14 bg-[#111] dark:bg-gold-500 text-white dark:text-foreground text-[11px] font-bold tracking-[0.2em] uppercase overflow-hidden relative group border border-[#111] dark:border-gold-500 transition-all"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_3s_infinite]" />
                                    <span className="relative z-10 group-hover:text-[#D4AF37] dark:group-hover:text-slate-800">Continue to Payment</span>
                                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#D4AF37] dark:bg-slate-800 transition-all duration-500 group-hover:w-full" />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Payment Method */}
                        {step === 2 && (
                            <div className="bg-card border border-border p-8 md:p-10 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#AA771C] to-[#D4AF37] opacity-20" />
                                
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-12 h-12 border border-[#D4AF37]/20 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-[#AA771C]" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-serif text-foreground leading-none">Payment Method</h2>
                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-2">Secure settlement for research acquisition</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10">
                                    {/* Bank Transfer */}
                                    <button
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`w-full p-6 border transition-all flex items-start gap-5 relative group
                                            ${paymentMethod === 'bank_transfer' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-border hover:border-border'}`}
                                    >
                                        {paymentMethod === 'bank_transfer' && (
                                            <>
                                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#AA771C]" />
                                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#AA771C]" />
                                            </>
                                        )}
                                        <div className={`w-12 h-12 border flex items-center justify-center shrink-0 transition-colors
                                            ${paymentMethod === 'bank_transfer' ? 'border-[#D4AF37] text-[#AA771C]' : 'border-border text-muted-foreground/50'}`}>
                                            <Landmark className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-xs font-bold tracking-widest uppercase transition-colors ${paymentMethod === 'bank_transfer' ? 'text-foreground' : 'text-muted-foreground'}`}>Bank Transfer</p>
                                            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">Direct settlement via secure wire. Order ships after internal verification.</p>
                                        </div>
                                    </button>

                                    {/* Crypto */}
                                    <button
                                        onClick={() => setPaymentMethod('crypto')}
                                        className={`w-full p-6 border transition-all flex items-start gap-5 relative group
                                            ${paymentMethod === 'crypto' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-border hover:border-border'}`}
                                    >
                                        {paymentMethod === 'crypto' && (
                                            <>
                                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#AA771C]" />
                                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#AA771C]" />
                                            </>
                                        )}
                                        <div className={`w-12 h-12 border flex items-center justify-center shrink-0 transition-colors
                                            ${paymentMethod === 'crypto' ? 'border-[#D4AF37] text-[#AA771C]' : 'border-border text-muted-foreground/50'}`}>
                                            <Bitcoin className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-xs font-bold tracking-widest uppercase transition-colors ${paymentMethod === 'crypto' ? 'text-foreground' : 'text-muted-foreground'}`}>Cryptocurrency</p>
                                            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">Fast-track settlement with BTC, ETH, or USDT. Payment details issued post-order.</p>
                                        </div>
                                    </button>
                                </div>

                                {/* Payment Instructions Preview */}
                                <div className="bg-muted border-l-2 border-[#D4AF37] p-6 mb-10">
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#AA771C] uppercase mb-4">Acquisition Protocol:</p>
                                    <ol className="text-[11px] text-muted-foreground space-y-3">
                                        <li className="flex gap-3"><span className="text-[#D4AF37] font-bold">01</span> Execute order placement below</li>
                                        <li className="flex gap-3"><span className="text-[#D4AF37] font-bold">02</span> Secure payment details will be displayed</li>
                                        <li className="flex gap-3"><span className="text-[#D4AF37] font-bold">03</span> Remit within 48 hours to maintain research priority</li>
                                        <li className="flex gap-3"><span className="text-[#D4AF37] font-bold">04</span> Verification & prioritized logistics dispatch</li>
                                    </ol>
                                </div>

                                {orderError && (
                                    <div className="mb-10 p-4 border border-red-100 bg-red-50/30 flex items-center gap-3">
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                        <p className="text-[10px] font-bold tracking-tight text-red-600 uppercase italic">{orderError}</p>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="h-14 px-8 border border-border text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase hover:bg-muted transition-colors"
                                    >
                                        Return to Shipping
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isSubmitting}
                                        className="flex-1 h-14 bg-[#111] text-white text-[11px] font-bold tracking-[0.2em] uppercase overflow-hidden relative group border border-[#111] transition-all disabled:opacity-50"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_3s_infinite]" />
                                        <span className="relative z-10 flex items-center justify-center gap-3 group-hover:text-[#D4AF37]">
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Authorizing Acquisition...
                                                </>
                                            ) : (
                                                `Authorize Order — ${formatTHB(cartTotal)}`
                                            )}
                                        </span>
                                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#D4AF37] transition-all duration-500 group-hover:w-full" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 3 && (
                            <div className="bg-card border border-border p-8 md:p-12 relative overflow-hidden text-center">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#AA771C] via-[#F3E5AB] to-[#D4AF37]" />
                                
                                <div className="w-20 h-20 border border-[#D4AF37] flex items-center justify-center mx-auto mb-8 relative">
                                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-[#AA771C]" />
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-[#AA771C]" />
                                    <CheckCircle2 className="h-10 w-10 text-[#AA771C]" />
                                </div>

                                <h2 className="text-4xl font-serif text-foreground mb-4">Acquisition Successful</h2>
                                <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-muted-foreground mb-10">Order Reference: <span className="text-[#AA771C] font-mono tracking-normal ml-2">{orderId}</span></p>

                                {/* Payment Instructions */}
                                <div className="bg-muted border border-border p-8 mb-10 text-left relative">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        {paymentMethod === 'bank_transfer' ? <Landmark className="h-12 w-12" /> : <Bitcoin className="h-12 w-12" />}
                                    </div>
                                    
                                    <h3 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase mb-6 flex items-center gap-3">
                                        <div className="w-1 h-4 bg-[#D4AF37]" />
                                        Payment Instructions
                                    </h3>

                                    {paymentMethod === 'bank_transfer' ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-3 border-b border-border">
                                                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Settlement Bank</span>
                                                <span className="text-xs font-bold text-foreground uppercase">Contact Support for Details</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-border">
                                                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Reference Code</span>
                                                <span className="text-xs font-mono font-bold text-[#AA771C]">{orderId}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-border">
                                                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Exact Amount</span>
                                                <span className="text-lg font-serif text-foreground">{formatTHB(cartTotal)}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-4">
                                                Please specify the <span className="font-bold text-foreground">Reference Code</span> in your transfer memo. Fulfillment commences upon bank verification (est. 24-48h).
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-3 border-b border-border">
                                                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Settlement Amount</span>
                                                <span className="text-lg font-serif text-foreground">{formatTHB(cartTotal)} <span className="text-[10px] font-sans font-bold text-muted-foreground uppercase">Equiv</span></span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-border">
                                                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Protocol Reference</span>
                                                <span className="text-xs font-mono font-bold text-[#AA771C]">{orderId}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-4">
                                                Contact <span className="font-bold text-foreground italic">logistics@goldentier.com</span> with your Reference Code to obtain the encrypted wallet address for BTC, ETH, or USDT settlement.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Shipping Summary */}
                                <div className="border border-border p-8 mb-12 text-left bg-card">
                                    <h3 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase mb-6 flex items-center gap-3">
                                        <div className="w-1 h-4 bg-[#D4AF37]" />
                                        Logistics Destination
                                    </h3>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Consignee</p>
                                            <p className="text-xs font-bold text-foreground uppercase">{shipping.fullName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Contact</p>
                                            <p className="text-xs font-bold text-foreground uppercase">{shipping.phone}</p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Address</p>
                                            <p className="text-xs font-bold text-foreground uppercase leading-relaxed">
                                                {shipping.address}, {shipping.city}<br />
                                                {shipping.state ? `${shipping.state}, ` : ''}{shipping.zip} {shipping.country}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        to="/dashboard"
                                        className="flex-1 h-14 bg-[#111] text-white text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center hover:bg-slate-900 transition-colors"
                                    >
                                        View Acquisition History
                                    </Link>
                                    <Link
                                        to="/products"
                                        className="flex-1 h-14 border border-border text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase flex items-center justify-center hover:bg-muted transition-colors"
                                    >
                                        Continue Research
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ──── Right: Order Summary Sidebar ──── */}
                    {step !== 3 && (
                        <div className="lg:col-span-4">
                            <div className="bg-card border border-border p-8 sticky top-24 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.05)_0%,_transparent_70%)]" />
                                
                                <h3 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase mb-8 flex items-center gap-3">
                                    <ShoppingBag className="h-4 w-4 text-[#AA771C]" />
                                    Order Summary
                                </h3>

                                <ul className="space-y-6 mb-8">
                                    {items.map(item => (
                                        <li key={`${item.product.id}-${item.selectedVariant?.sku || 'base'}`} className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="text-xs font-bold text-foreground uppercase truncate">{item.product.name}</p>
                                                {item.selectedVariant && (
                                                    <p className="text-[10px] font-bold text-[#AA771C] uppercase mt-1">{item.selectedVariant.label}</p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Quantity: {item.quantity}</p>
                                            </div>
                                            <span className="text-xs font-bold text-foreground whitespace-nowrap">
                                                {formatTHB(getItemPrice(item) * item.quantity)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="border-t border-border pt-6 space-y-3">
                                    <div className="flex justify-between items-center text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                                        <span>Subtotal</span>
                                        <span className="text-foreground">{formatTHB(cartSubtotal)}</span>
                                    </div>
                                    {isPartner && discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-[11px] font-bold tracking-widest text-emerald-600 uppercase">
                                            <span>Partner Discount</span>
                                            <span>-{formatTHB(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                                        <span>Logistics</span>
                                        <span className="text-foreground">Post-Settlement</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-6 border-t border-border">
                                        <span className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">Total Acquisition</span>
                                        <span className="text-xl font-serif text-[#AA771C]">{formatTHB(cartTotal)}</span>
                                    </div>
                                </div>

                                {/* Trust signals */}
                                <div className="mt-10 pt-8 border-t border-border space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 border border-border flex items-center justify-center">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        </div>
                                        <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">Encrypted Transaction Protocol</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 border border-border flex items-center justify-center">
                                            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                                        </div>
                                        <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">Prioritized Logistics (1-3 Days)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
