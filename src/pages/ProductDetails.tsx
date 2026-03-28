import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { useToast } from '@/components/ui/useToast';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ShoppingCart, Check, ShieldCheck, ArrowLeft, Plus, Minus, FileText } from 'lucide-react';
import { ReviewList } from '@/components/reviews/ReviewList';
import type { ProductVariant } from '@/data/products';
import { formatTHB } from '@/lib/formatPrice';

export function ProductDetails() {
    const { sku } = useParams<{ sku: string }>();
    const { db } = useDatabase();
    const { addToCart } = useCart();
    const { isPartner, user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);

    const product = db.products.find(p => p.sku === sku);

    // Auto-select first variant when product loads
    useEffect(() => {
        if (product?.variants && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
        }
    }, [product]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!product) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center relative">
                <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)]" />
                <div className="text-center bg-card border border-[#D4AF37]/20 p-16 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative z-10 max-w-lg">
                    <h2 className="text-4xl font-serif text-foreground mb-4 tracking-tight">Compound Not Found</h2>
                    <p className="text-muted-foreground mb-10 text-sm leading-relaxed tracking-wide">The specific compound you are looking for does not exist or has been removed from our catalog.</p>
                    <Link to="/products" className="inline-flex items-center justify-center px-8 py-4 bg-[#111] text-white font-semibold text-[10px] tracking-[0.2em] uppercase transition-all hover:bg-black group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                        <span className="relative z-10">Return to Catalog</span>
                        <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-500 ease-out group-hover:w-full" />
                    </Link>
                </div>
            </div>
        );
    }

    const hasVariants = product.variants && product.variants.length > 0;
    const activePrice = selectedVariant?.price ?? product.price;
    const variantInStock = selectedVariant ? selectedVariant.stock > 0 : product.inStock;
    const variantStock = selectedVariant?.stock ?? product.stockQuantity ?? 0;
    const allVariantsOutOfStock = hasVariants ? product.variants!.every(v => v.stock <= 0) : !product.inStock;

    const getDiscountedPrice = (price: number) => {
        if (isPartner && user?.discountRate) {
            return price * (1 - user.discountRate / 100);
        }
        return price;
    };

    const currentPrice = getDiscountedPrice(activePrice);

    const handleAddToCart = () => {
        addToCart(product, selectedVariant, quantity);
        const variantLabel = selectedVariant ? ` (${selectedVariant.label})` : '';
        addToast({ message: `Added ${quantity}x ${product.name}${variantLabel} to your cart.`, type: 'success' });
    };

    return (
        <div className="min-h-screen bg-background py-12 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)]" />

            <SEO
                title={`${product.name} | Golden Tier`}
                description={product.description || `Premium research grade ${product.name}. >99% purity guaranteed for laboratory research.`}
            />

            <div className="container mx-auto px-6 md:px-12 relative z-10">
                <Breadcrumbs />

                <button
                    onClick={() => navigate('/products')}
                    className="inline-flex items-center text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] hover:text-[#D4AF37] mb-12 mt-8 transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 mr-3 group-hover:-translate-x-1 transition-transform" />
                    BACK TO CATALOG
                </button>

                <div className="bg-card border border-[#D4AF37]/20 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2">

                        {/* Left: Product Image */}
                        <div className="relative bg-muted flex items-center justify-center p-12 md:p-32 border-b md:border-b-0 md:border-r border-[#D4AF37]/20 overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/5 via-transparent to-transparent opacity-100 pointer-events-none" />

                            <div className="absolute top-8 left-8 z-10 flex items-center space-x-2 px-4 py-2 bg-card border border-[#D4AF37]/20 shadow-sm">
                                <Check className="h-4 w-4 text-[#D4AF37]" />
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C]">{product.purity}</span>
                            </div>

                            <span className={`absolute top-8 right-8 px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase z-10 shadow-sm ${!allVariantsOutOfStock ? 'bg-card text-emerald-600 border border-emerald-100' : 'bg-card text-red-600 border border-red-100'}`}>
                                {!allVariantsOutOfStock ? 'IN STOCK' : 'OUT OF STOCK'}
                            </span>

                            <div className="relative z-0 w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} loading="lazy" className="w-full h-full object-contain filter" />
                                ) : (
                                    <div className="w-full h-full bg-card flex items-center justify-center shadow-inner border border-[#D4AF37]/10">
                                        <span className="text-[#D4AF37] font-serif text-6xl">{product.name.split('-')[0]?.split(' ')[0]}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Product Details */}
                        <div className="p-8 md:p-14 lg:p-20 flex flex-col justify-center bg-card">
                            <div className="mb-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="h-[1px] w-8 bg-[#D4AF37]" />
                                    <span className="text-[10px] font-bold tracking-[0.4em] text-[#AA771C] uppercase">{product.category}</span>
                                </div>
                                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground tracking-tighter leading-[0.9] mb-8">{product.name}</h1>
                                <div className="flex items-center space-x-4">
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">REFERENCE: {selectedVariant?.sku || product.sku}</p>
                                    <div className="h-4 w-[1px] bg-border" />
                                    <div className="flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600 uppercase">Validated Purity</p>
                                    </div>
                                </div>
                            </div>

                            <div className="my-10">
                                <p className="text-muted-foreground leading-relaxed text-base md:text-lg tracking-wide font-light max-w-xl">{product.description}</p>
                            </div>

                            {/* Variant Selector — Radio Button Chips */}
                            {hasVariants && (
                                <div className="mb-10">
                                    <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground block mb-4">SPECIFICATION</label>
                                    <div className="flex flex-wrap gap-3">
                                        {product.variants!.map(v => {
                                            const isSelected = selectedVariant?.sku === v.sku;
                                            const isOutOfStock = v.stock <= 0;
                                            const variantDiscountedPrice = isPartner && user?.discountRate ? v.price * (1 - user.discountRate / 100) : null;
                                            return (
                                                <button
                                                    key={v.sku}
                                                    onClick={() => !isOutOfStock && setSelectedVariant(v)}
                                                    disabled={isOutOfStock}
                                                    className={`px-6 py-4 text-[10px] font-bold tracking-[0.2em] border transition-all duration-500 flex flex-col items-center min-w-[120px] uppercase ${
                                                        isOutOfStock
                                                            ? 'border-border bg-muted/50 text-muted-foreground line-through cursor-not-allowed opacity-50'
                                                            : isSelected
                                                                ? 'border-gold-500 bg-[#111] text-white shadow-xl scale-105 z-10'
                                                                : 'border-gold-300/20 bg-card text-muted-foreground hover:border-gold-500/50 hover:bg-gold-500/5'
                                                    }`}
                                                >
                                                    <span>{v.label}</span>
                                                    {variantDiscountedPrice !== null && !isOutOfStock && (
                                                        <span className={`mt-1 font-bold ${isSelected ? 'text-gold-300' : 'text-gold-600'}`}>
                                                            {formatTHB(variantDiscountedPrice)}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {isPartner ? (
                                <>
                                    <div className="mb-14">
                                        <div className="flex items-baseline gap-6 mb-2">
                                            <span className="text-6xl md:text-7xl font-serif text-gold-gradient tracking-tighter">{formatTHB(currentPrice)}</span>
                                            {user?.discountRate && (
                                                <span className="text-2xl text-muted-foreground line-through font-light italic">{formatTHB(activePrice)}</span>
                                            )}
                                        </div>
                                        {user?.discountRate && (
                                            <div className="inline-flex items-center px-4 py-2 bg-gold-500/5 border border-gold-300/20 rounded-full mt-6">
                                                <Check className="h-3 w-3 mr-3 text-gold-600" />
                                                <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-gold-700">
                                                    PARTNER PRIVILEGE: {user.discountRate}% REDUCTION
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch gap-6 mb-16">
                                        <div className="flex flex-col gap-4">
                                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground">UNIT COUNT</span>
                                            <div className="flex items-center bg-card p-1 border border-gold-300/20 shadow-premium justify-between min-h-[60px] min-w-[160px]">
                                                <button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    disabled={quantity <= 1}
                                                    className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-gold-600 hover:bg-gold-500/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="text-xl font-bold text-foreground font-serif">{quantity}</span>
                                                <button
                                                    onClick={() => setQuantity(Math.min(variantStock, quantity + 1))}
                                                    disabled={quantity >= variantStock}
                                                    className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-gold-600 hover:bg-gold-500/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col justify-end">
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={!variantInStock}
                                                className="w-full h-20 flex items-center justify-center space-x-4 bg-[#111] text-white font-bold text-[11px] tracking-[0.4em] uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black border border-[#111] shadow-2xl group relative overflow-hidden active:scale-[0.98]"
                                            >
                                                <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
                                                <ShoppingCart className="relative z-10 h-5 w-5 transition-transform group-hover:-translate-y-1" />
                                                <span className="relative z-10">{variantInStock ? 'ACQUIRE COMPOUND' : 'UNAVAILABLE'}</span>
                                                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-gradient transition-all duration-700 ease-out group-hover:w-full" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="mb-12 p-8 bg-muted border border-[#D4AF37]/20 shadow-sm relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#AA771C] to-[#D4AF37]" />
                                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-foreground mb-3">Partner Access Required</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">Pricing and procurement are strictly reserved for verified partners. <a href="/contact" className="text-[#D4AF37] hover:text-[#AA771C] font-semibold underline underline-offset-4 decoration-[#D4AF37]/40 transition-all">Request access</a> to join our network.</p>
                                </div>
                            )}

                            {/* Extras Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-10 border-t border-[#D4AF37]/10">
                                {product.dosage && (
                                    <div className="flex items-start gap-4">
                                        <div className="p-4 bg-card border border-[#D4AF37]/20 text-[#D4AF37] shadow-sm flex-shrink-0">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-foreground mb-2">DOSAGE PROTOCOL</h4>
                                            <p className="text-xs text-muted-foreground tracking-wide leading-relaxed">{product.dosage}</p>
                                        </div>
                                    </div>
                                )}

                                {product.benefits && product.benefits.length > 0 && (
                                    <div className="flex items-start gap-4">
                                        <div className="p-4 bg-card border border-[#D4AF37]/20 text-[#D4AF37] shadow-sm flex-shrink-0">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-foreground mb-2">PRIMARY FOCUS</h4>
                                            <ul className="text-xs text-muted-foreground tracking-wide leading-relaxed space-y-2">
                                                {product.benefits.slice(0, 2).map((b, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <span className="text-[#D4AF37] mr-2 mt-0.5">•</span>
                                                        <span>{b}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Extended Description */}
                <div className="mt-16 bg-card border border-[#D4AF37]/20 p-10 md:p-16 shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
                    <h2 className="text-3xl font-serif text-foreground mb-10 tracking-tight">Compound Specifications</h2>
                    <div className="text-muted-foreground space-y-10 tracking-wide leading-relaxed text-sm md:text-base">
                        <p className="whitespace-pre-wrap">{product.fullDescription || product.description}</p>
                        {product.benefits && product.benefits.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-foreground mb-6 block">Investigative Pathways</h4>
                                <ul className="space-y-4">
                                    {product.benefits.map((b, i) => (
                                        <li key={i} className="flex items-start">
                                            <div className="w-1.5 h-1.5 rounded-none bg-[#D4AF37] mt-2 mr-4 shrink-0 rotate-45" />
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="bg-[#111] p-10 mt-16 border border-[#222] relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
                            <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4AF37] mb-4 block">MANDATORY DISCLAIMER</h4>
                            <p className="text-sm text-muted-foreground mb-0 leading-relaxed tracking-wide relative z-10 max-w-4xl">All formulations distributed by Golden Tier are strictly synthesized for laboratory research and analytical methodology only. They are expressly restricted from use as human therapeutics, diagnostics, or consumable supplements.</p>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-16 bg-card border border-[#D4AF37]/20 p-10 md:p-16 shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
                    <h2 className="text-3xl font-serif text-foreground mb-10 tracking-tight">Customer Reviews</h2>
                    <ReviewList productId={product.id} />
                </div>
            </div>
        </div>
    );
}
