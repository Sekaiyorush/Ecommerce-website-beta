import { useEffect } from 'react';
import { useCart, getItemPrice } from '@/context/CartContext';
import { formatTHB } from '@/lib/formatPrice';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function CartSidebar() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, cartSubtotal, discountAmount, cartTotal } = useCart();
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-slate-200 z-50 shadow-2xl flex flex-col font-sans">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-serif text-slate-900 leading-none">Your Cart</h2>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mt-2">{items.length} items for acquisition</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 border border-transparent hover:border-slate-200 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 border border-[#D4AF37]/20 flex items-center justify-center mb-6 relative">
                <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-[#D4AF37]" />
                <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-[#D4AF37]" />
                <ShoppingBag className="h-8 w-8 text-[#D4AF37]/30" />
              </div>
              <p className="text-xs font-bold tracking-[0.2em] text-slate-900 uppercase">Cart is Empty</p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">No premium compounds selected</p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-8 px-8 py-3 bg-[#111] text-white text-[10px] font-bold tracking-[0.2em] uppercase border border-[#111] hover:text-[#D4AF37] transition-colors"
              >
                Return to Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedVariant?.sku || 'base'}`}
                  className="flex items-center gap-4 p-4 border border-slate-100 bg-slate-50/50 relative"
                >
                  <div className="w-16 h-16 border border-slate-200 flex items-center justify-center flex-shrink-0 bg-white">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter">
                      {item.product.name.substring(0, 3)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 uppercase truncate">{item.product.name}</p>
                    {item.selectedVariant && (
                      <p className="text-[10px] font-bold text-[#AA771C] uppercase mt-0.5">{item.selectedVariant.label}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">{formatTHB(getItemPrice(item))}</p>
                  </div>

                  <div className="flex items-center border border-slate-200 bg-white">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.sku)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors border-r border-slate-200"
                    >
                      <Minus className="h-3 w-3 text-slate-400" />
                    </button>
                    <span className="w-8 text-center text-[10px] font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.sku)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors border-l border-slate-200"
                    >
                      <Plus className="h-3 w-3 text-slate-400" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id, item.selectedVariant?.sku)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-100 p-6 space-y-6 bg-white relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/30 to-[#D4AF37]/0" />
            
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                <span>Subtotal</span>
                <span className="text-slate-900">{formatTHB(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                  <span>Partner Discount</span>
                  <span>-{formatTHB(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                <span>Logistics</span>
                <span className="text-slate-400 italic">TBD</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <span className="text-xs font-bold tracking-[0.2em] text-slate-900 uppercase">Total Acquisition</span>
                <span className="text-xl font-serif text-[#AA771C]">{formatTHB(cartTotal)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              onClick={() => setIsOpen(false)}
              className="w-full h-14 bg-[#111] text-white text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center relative group overflow-hidden border border-[#111]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_3s_infinite]" />
              <span className="relative z-10 flex items-center gap-3 group-hover:text-[#D4AF37]">
                Initialize Checkout
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#D4AF37] transition-all duration-500 group-hover:w-full" />
            </Link>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-[10px] font-bold tracking-widest text-slate-400 hover:text-slate-900 uppercase transition-colors"
            >
              Continue Research
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
