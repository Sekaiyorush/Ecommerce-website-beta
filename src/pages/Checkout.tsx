import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart, getItemPrice } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import {
    ArrowLeft,
    CheckCircle2,
    Truck,
    CreditCard,
    ShoppingBag,
    MapPin,
    Building2,
    Landmark,
    Bitcoin,
    AlertTriangle,
} from 'lucide-react';
import { formatTHB } from '@/lib/formatPrice';
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
    phone: z.string().regex(/\d{7,}/, 'Please enter a valid phone number (at least 7 digits)'),
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
                    const currentVariant = currentProduct.variants?.find((v: any) => v.sku === item.selectedVariant!.sku);
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
            console.error('Order placement failed:', err);
            setOrderError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ──── Empty cart ────
    if (items.length === 0 && step !== 3) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-10 w-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Your cart is empty</h2>
                    <p className="text-slate-500 mb-6">Add some products before checking out.</p>
                    <Link
                        to="/products"
                        className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 md:py-12">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">

                {/* Back link */}
                <Link to="/products" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping
                </Link>

                {validationWarning && step !== 3 && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-medium text-amber-900">Cart Validation Notice</h4>
                            <p className="text-amber-700 text-sm mt-1">{validationWarning}</p>
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-10 gap-2">
                    {[
                        { num: 1, label: 'Shipping' },
                        { num: 2, label: 'Payment' },
                        { num: 3, label: 'Confirmation' },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors
                ${step >= s.num ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                            </div>
                            <span className={`ml-2 text-sm font-medium hidden sm:inline ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                            {i < 2 && <div className={`w-12 sm:w-20 h-0.5 mx-3 ${step > s.num ? 'bg-slate-900' : 'bg-slate-200'}`} />}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ──── Left: Form ──── */}
                    <div className="lg:col-span-2">

                        {/* Step 1: Shipping */}
                        {step === 1 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                        <Truck className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">Shipping Information</h2>
                                        <p className="text-sm text-slate-500">Where should we send your order?</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                                            <input type="text" value={shipping.fullName}
                                                onChange={e => updateShipping('fullName', e.target.value)}
                                                className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-200 focus:border-slate-300" />
                                            {shippingErrors.fullName && (
                                                <p className="text-xs text-red-600 mt-1">{shippingErrors.fullName}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                                            <input type="email" value={shipping.email}
                                                onChange={e => updateShipping('email', e.target.value)}
                                                className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-200 focus:border-slate-300" />
                                            {shippingErrors.email && (
                                                <p className="text-xs text-red-600 mt-1">{shippingErrors.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number *</label>
                                        <input type="tel" value={shipping.phone}
                                            onChange={e => updateShipping('phone', e.target.value)}
                                            className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
                                            placeholder="+1 (555) 000-0000" />
                                        {shippingErrors.phone && (
                                            <p className="text-xs text-red-600 mt-1">{shippingErrors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address *</label>
                                        <input type="text" value={shipping.address}
                                            onChange={e => updateShipping('address', e.target.value)}
                                            className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
                                            placeholder="123 Main St, Apt 4" />
                                        {shippingErrors.address && (
                                            <p className="text-xs text-red-600 mt-1">{shippingErrors.address}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">City *</label>
                                            <input type="text" value={shipping.city}
                                                onChange={e => updateShipping('city', e.target.value)}
                                                className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-200 focus:border-slate-300" />
                                            {shippingErrors.city && (
                                                <p className="text-xs text-red-600 mt-1">{shippingErrors.city}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                                            <input type="text" value={shipping.state}
                                                onChange={e => updateShipping('state', e.target.value)}
                                                className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-200 focus:border-slate-300" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">ZIP</label>
                                            <input type="text" value={shipping.zip}
                                                onChange={e => updateShipping('zip', e.target.value)}
                                                className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-200 focus:border-slate-300" />
                                            {shippingErrors.zip && (
                                                <p className="text-xs text-red-600 mt-1">{shippingErrors.zip}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Country *</label>
                                            <input type="text" value={shipping.country}
                                                onChange={e => updateShipping('country', e.target.value)}
                                                className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
                                                placeholder="US" />
                                            {shippingErrors.country && (
                                                <p className="text-xs text-red-600 mt-1">{shippingErrors.country}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Order Notes (optional)</label>
                                        <textarea rows={2} value={shipping.notes}
                                            onChange={e => updateShipping('notes', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-200 focus:border-slate-300 resize-none"
                                            placeholder="Special delivery instructions..." />
                                    </div>
                                </div>

                                <button
                                    onClick={handleContinueToPayment}
                                    className="w-full mt-6 h-12 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Continue to Payment
                                </button>
                            </div>
                        )}

                        {/* Step 2: Payment Method */}
                        {step === 2 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">Payment Method</h2>
                                        <p className="text-sm text-slate-500">Select how you'd like to pay</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {/* Bank Transfer */}
                                    <button
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4
                      ${paymentMethod === 'bank_transfer' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                      ${paymentMethod === 'bank_transfer' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <Landmark className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Bank Transfer</p>
                                            <p className="text-sm text-slate-500 mt-0.5">Transfer directly to our bank account. Order ships after payment confirmation.</p>
                                        </div>
                                    </button>

                                    {/* Crypto */}
                                    <button
                                        onClick={() => setPaymentMethod('crypto')}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4
                      ${paymentMethod === 'crypto' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                      ${paymentMethod === 'crypto' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <Bitcoin className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Cryptocurrency</p>
                                            <p className="text-sm text-slate-500 mt-0.5">Pay with BTC, ETH, or USDT. Details provided after order placement.</p>
                                        </div>
                                    </button>
                                </div>

                                {/* Payment Instructions Preview */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                    <p className="text-sm font-medium text-amber-800 mb-1">How it works:</p>
                                    <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
                                        <li>Place your order below</li>
                                        <li>You'll receive payment details on the confirmation page</li>
                                        <li>Send payment within 48 hours</li>
                                        <li>We verify and ship your order</li>
                                    </ol>
                                </div>

                                {orderError && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                        <p className="text-sm font-medium text-red-800">{orderError}</p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 h-12 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isSubmitting}
                                        className="flex-1 h-12 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? 'Placing Order...' : `Place Order — ${formatTHB(cartTotal)}`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 3 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Placed Successfully!</h2>
                                    <p className="text-slate-500">Order ID: <span className="font-mono font-medium text-slate-700">{orderId}</span></p>
                                </div>

                                {/* Payment Instructions */}
                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
                                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        {paymentMethod === 'bank_transfer' ? <Landmark className="h-5 w-5" /> : <Bitcoin className="h-5 w-5" />}
                                        Payment Instructions
                                    </h3>

                                    {paymentMethod === 'bank_transfer' ? (
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between py-2 border-b border-slate-200">
                                                <span className="text-slate-500">Bank</span>
                                                <span className="font-medium text-slate-900">Contact us for details</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-slate-200">
                                                <span className="text-slate-500">Reference</span>
                                                <span className="font-mono font-medium text-slate-900">{orderId}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-slate-200">
                                                <span className="text-slate-500">Amount</span>
                                                <span className="font-bold text-slate-900">{formatTHB(cartTotal)}</span>
                                            </div>
                                            <p className="text-slate-500 mt-2">
                                                Please include your Order ID as the payment reference. We will confirm your payment and ship within 1-2 business days.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between py-2 border-b border-slate-200">
                                                <span className="text-slate-500">Amount</span>
                                                <span className="font-bold text-slate-900">{formatTHB(cartTotal)} equivalent</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-slate-200">
                                                <span className="text-slate-500">Reference</span>
                                                <span className="font-mono font-medium text-slate-900">{orderId}</span>
                                            </div>
                                            <p className="text-slate-500 mt-2">
                                                Please contact us at our support email with your Order ID to receive the wallet address for payment. We accept BTC, ETH, and USDT.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Shipping Summary */}
                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
                                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <MapPin className="h-5 w-5" /> Shipping To
                                    </h3>
                                    <div className="text-sm text-slate-600 space-y-1">
                                        <p className="font-medium text-slate-900">{shipping.fullName}</p>
                                        <p>{shipping.address}</p>
                                        <p>{shipping.city}{shipping.state ? `, ${shipping.state}` : ''} {shipping.zip}</p>
                                        <p>{shipping.country}</p>
                                        <p className="text-slate-500">{shipping.phone}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        to="/dashboard"
                                        className="flex-1 h-12 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center"
                                    >
                                        View My Orders
                                    </Link>
                                    <Link
                                        to="/products"
                                        className="flex-1 h-12 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center"
                                    >
                                        Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ──── Right: Order Summary Sidebar ──── */}
                    {step !== 3 && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-24">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5" /> Order Summary
                                </h3>

                                <ul className="space-y-3 mb-4">
                                    {items.map(item => (
                                        <li key={`${item.product.id}-${item.selectedVariant?.sku || 'base'}`} className="flex justify-between items-start text-sm">
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{item.product.name}</p>
                                                {item.selectedVariant && (
                                                    <p className="text-xs text-slate-400">{item.selectedVariant.label}</p>
                                                )}
                                                <p className="text-slate-400">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="font-medium text-slate-700 ml-4">
                                                {formatTHB(getItemPrice(item) * item.quantity)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Subtotal</span>
                                        <span className="text-slate-900">{formatTHB(cartSubtotal)}</span>
                                    </div>
                                    {isPartner && discountAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-emerald-600">Partner Discount</span>
                                            <span className="text-emerald-600">-{formatTHB(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Shipping</span>
                                        <span className="text-slate-900">Calculated after payment</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-100">
                                        <span>Total</span>
                                        <span>{formatTHB(cartTotal)}</span>
                                    </div>
                                </div>

                                {/* Trust signals */}
                                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Building2 className="h-3.5 w-3.5" />
                                        <span>Secure & encrypted checkout</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Truck className="h-3.5 w-3.5" />
                                        <span>Ships within 1-3 business days</span>
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
