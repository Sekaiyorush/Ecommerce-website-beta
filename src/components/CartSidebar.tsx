import { useEffect } from 'react';
import { useCart, getItemPrice } from '@/context/CartContext';
import { formatTHB } from '@/lib/formatPrice';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export function CartSidebar() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, cartSubtotal, discountAmount, cartTotal } = useCart();
  const location = useLocation();
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 transition-all duration-700"
        onClick={() => setIsOpen(false)}
      />

      <div ref={trapRef} role="dialog" aria-label="Shopping cart" className="fixed right-0 top-0 h-full w-full max-w-lg bg-background z-[60] shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col font-sans animate-reveal border-l border-gold-300/10">
        <div className="flex items-center justify-between p-10 border-b border-border">
          <div>
            <h2 className="text-3xl font-serif text-foreground leading-none tracking-tight">Your Selection</h2>
            <p className="text-[10px] font-bold tracking-[0.4em] text-gold-600 uppercase mt-4">{items.length} units for acquisition</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close cart"
            className="w-12 h-12 flex items-center justify-center border border-border hover:border-gold-500 hover:text-gold-600 transition-all duration-500 rounded-full"
          >
            <X className="h-5 w-5 opacity-40 hover:opacity-100" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-24 h-24 border border-gold-300/20 flex items-center justify-center mb-8 relative">
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-gold-500" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-gold-500" />
                <ShoppingBag className="h-10 w-10 text-gold-500/20" />
              </div>
              <p className="text-sm font-bold tracking-[0.3em] text-foreground uppercase">Cart is Empty</p>
              <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-[0.2em] font-light max-w-[200px] leading-relaxed">No premium formulations currently staged for acquisition</p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-12 btn-premium text-[10px] px-12"
              >
                Return to Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedVariant?.sku || 'base'}`}
                  className="flex items-center gap-6 p-6 border border-border bg-muted/30 relative group hover:bg-background hover:border-gold-300/30 hover:shadow-premium transition-all duration-700"
                >
                  <div className="w-20 h-20 border border-border flex items-center justify-center flex-shrink-0 bg-background p-4 group-hover:border-gold-300/50 transition-colors duration-700">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} loading="lazy" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-gold-600 font-serif text-xl">
                        {item.product.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-foreground uppercase tracking-widest truncate">{item.product.name}</p>
                    {item.selectedVariant && (
                      <div className="flex items-center mt-1">
                        <div className="h-[1px] w-3 bg-gold-500/50 mr-2" />
                        <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest">{item.selectedVariant.label}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">{formatTHB(getItemPrice(item))}</p>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center border border-border bg-background rounded-sm overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.sku)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gold-500/5 hover:text-gold-600 transition-all border-r border-border disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-10 text-center text-[11px] font-bold font-serif">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.sku)}
                        aria-label={`Increase quantity of ${item.product.name}`}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gold-500/5 hover:text-gold-600 transition-all border-l border-border disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={item.quantity >= (item.selectedVariant?.stock ?? item.product.stockQuantity ?? 0)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedVariant?.sku)}
                      className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground hover:text-red-500 uppercase transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-10 space-y-8 bg-background relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gold-gradient opacity-20" />
            
            <div className="space-y-4">
              <div className="flex justify-between text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                <span>Subtotal</span>
                <span className="text-foreground">{formatTHB(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[11px] font-bold tracking-[0.2em] text-emerald-600 uppercase">
                  <span>Partner Privilege (Applied)</span>
                  <span>-{formatTHB(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                <span>Validated Logistics</span>
                <span className="text-muted-foreground font-light italic">Calculated at Checkout</span>
              </div>
              <div className="flex justify-between pt-8 border-t border-border items-baseline">
                <span className="text-xs font-bold tracking-[0.3em] text-foreground uppercase">Total Acquisition</span>
                <span className="text-4xl font-serif text-gold-gradient">{formatTHB(cartTotal)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              onClick={() => setIsOpen(false)}
              className="w-full h-20 bg-[#111] text-white text-[11px] font-bold tracking-[0.4em] uppercase flex items-center justify-center relative group overflow-hidden border border-[#111] shadow-2xl active:scale-[0.98] transition-transform"
            >
              <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity duration-1000" />
              <span className="relative z-10 flex items-center gap-4 group-hover:text-gold-300 transition-colors">
                INITIALIZE CHECKOUT
                <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-gradient transition-all duration-700 ease-out group-hover:w-full" />
            </Link>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-[10px] font-bold tracking-[0.3em] text-muted-foreground hover:text-gold-600 uppercase transition-all duration-500 text-center"
            >
              CONTINUE EXPLORATION
            </button>
          </div>
        )}
      </div>
    </>
  );
}
