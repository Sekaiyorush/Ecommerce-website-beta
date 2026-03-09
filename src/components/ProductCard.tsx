import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Heart, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/data/products';
import { ProductRating } from '@/components/reviews/ProductRating';
import { formatTHB } from '@/lib/formatPrice';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = memo(function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { isPartner, user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getDiscountedPrice = (price: number) => {
    if (isPartner && user?.discountRate) {
      return price * (1 - user.discountRate / 100);
    }
    return price;
  };

  const hasVariants = product.variants && product.variants.length > 0;
  const displayPrice = hasVariants
    ? Math.min(...product.variants!.map(v => v.price))
    : product.price;
  const discountedPrice = getDiscountedPrice(displayPrice);
  const hasDiscount = isPartner && user?.discountRate;
  const allOutOfStock = hasVariants
    ? product.variants!.every(v => v.stock <= 0)
    : product.stockQuantity === 0;
  const lowStock = hasVariants
    ? product.variants!.some(v => v.stock > 0 && v.stock < (product.lowStockThreshold || 10))
    : product.stockQuantity < (product.lowStockThreshold || 10) && product.stockQuantity > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container */}
      <div className="relative bg-white border border-[#D4AF37]/10 overflow-hidden shadow-premium hover:shadow-premium-hover transition-all duration-700 hover:-translate-y-3 group/card rounded-sm flex flex-col h-full">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gold-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gold-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Badge - Featured/New */}
        {product.isNew && (
          <div className="absolute top-6 left-6 z-20 flex items-center space-x-2 px-3 py-1.5 bg-white border border-[#D4AF37]/20 text-[#D4AF37] text-[9px] font-bold tracking-[0.3em] uppercase shadow-sm">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>New Arrival</span>
          </div>
        )}

        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-50/50 border-b border-[#D4AF37]/5">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-100 animate-pulse" />
          )}

          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`w-full h-full object-contain p-12 transition-all duration-1000 ease-out ${isHovered ? 'scale-110 rotate-1' : 'scale-100'}`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <div className="w-32 h-32 border border-[#D4AF37]/10 flex items-center justify-center relative group-hover:border-[#D4AF37]/30 transition-colors duration-700">
                <span className="text-4xl font-serif text-gold-gradient">{product.name.charAt(0)}</span>
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[#D4AF37]" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-[#D4AF37]" />
              </div>
            </div>
          )}

          <div className={`absolute inset-0 bg-white/20 backdrop-blur-[2px] transition-all duration-500 flex items-center justify-center gap-4 ${isHovered ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
              <Link
                to={`/product/${product.sku}`}
                className="flex items-center justify-center w-14 h-14 bg-[#111] text-white hover:text-[#D4AF37] border border-[#111] transition-all duration-500 shadow-xl"
              >
                <Eye className="h-5 w-5" />
              </Link>

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`flex items-center justify-center w-14 h-14 transition-all duration-500 border shadow-xl ${isWishlisted ? 'bg-[#D4AF37] border-[#D4AF37] text-white' : 'bg-white border-[#D4AF37]/20 text-[#AA771C] hover:text-[#D4AF37] hover:border-[#D4AF37]'}`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted && 'fill-current'}`} />
              </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-10 flex-1 flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-[1px] w-4 bg-[#D4AF37]/40" />
            <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#AA771C]">{product.category}</p>
          </div>

          <Link to={`/product/${product.sku}`}>
            <h3 className="font-serif text-2xl tracking-tight text-slate-900 mb-2 group-hover/card:text-gold-gradient transition-all duration-500 line-clamp-1">{product.name}</h3>
          </Link>

          <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed tracking-wide h-8">{product.description}</p>

          <div className="mb-6">
            <ProductRating productId={product.id} size="sm" showCount />
          </div>

          <div className="mt-auto pt-6 border-t border-[#D4AF37]/5 flex items-end justify-between">
            {isPartner ? (
              <>
                <div className="flex flex-col">
                  {hasDiscount ? (
                    <>
                      <span className="text-[10px] font-bold text-slate-300 line-through mb-1 tracking-widest uppercase">
                        {hasVariants ? 'from ' : ''}{formatTHB(displayPrice)}
                      </span>
                      <div className="flex items-center space-x-2">
                        {hasVariants && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">from</span>}
                        <span className="text-3xl font-serif text-gold-gradient">{formatTHB(discountedPrice)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {hasVariants && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">from</span>}
                      <span className="text-3xl font-serif text-slate-900">{formatTHB(displayPrice)}</span>
                    </div>
                  )}
                </div>

                <Link
                  to={`/product/${product.sku}`}
                  className={`relative flex items-center justify-center w-14 h-14 overflow-hidden transition-all duration-500 ${allOutOfStock
                    ? 'bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed pointer-events-none'
                    : 'bg-[#111] text-white hover:text-[#D4AF37] group/btn border border-[#111] shadow-lg'
                    }`}
                >
                  <ShoppingCart className="relative z-10 h-5 w-5" />
                  {!allOutOfStock && (
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-gradient transition-all duration-500 ease-out group-hover/btn:w-full" />
                  )}
                </Link>
              </>
            ) : (
              <div className="w-full relative overflow-hidden">
                {/* Blurred price ghost */}
                <div className="flex items-end justify-between mb-3 select-none pointer-events-none" aria-hidden="true">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300 blur-[5px]">฿ — — —</span>
                    <span className="text-3xl font-serif text-slate-300 blur-[7px]">฿ ——</span>
                  </div>
                  <div className="w-14 h-14 bg-slate-100 blur-[4px]" />
                </div>

                {/* Lock overlay */}
                <div className="relative border border-[#D4AF37]/25 bg-gradient-to-r from-[#111] to-[#191919] px-4 py-3 flex items-center justify-between gap-2 overflow-hidden group/lock">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/8 to-transparent -translate-x-[150%] group-hover/lock:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="w-6 h-6 border border-[#D4AF37]/40 bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                      <Lock className="h-3 w-3 text-[#D4AF37]" />
                    </div>
                    <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-slate-300">Unlock Partner Pricing</span>
                  </div>
                  <Link
                    to="/contact"
                    className="relative z-10 text-[9px] font-bold tracking-[0.2em] uppercase text-[#D4AF37] hover:text-white transition-colors shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Apply →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${allOutOfStock ? 'bg-red-400' :
              lowStock ? 'bg-amber-400' :
                'bg-[#D4AF37]'
              }`} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
              {allOutOfStock ? 'OUT OF STOCK' :
                lowStock ? 'LOW STOCK' :
                  'IN STOCK'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
