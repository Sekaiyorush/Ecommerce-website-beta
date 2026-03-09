import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import type { Product, ProductVariant } from '@/data/products';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
}

/** Get the effective unit price for a cart item */
export function getItemPrice(item: CartItem): number {
  return item.selectedVariant?.price ?? item.product.price;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantityToAdd?: number) => void;
  removeFromCart: (productId: string, variantSku?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  refreshCartPrices: (products: Product[]) => void;
  clearCart: () => void;
  toggleCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  cartCount: number;
  cartSubtotal: number;
  discountAmount: number;
  cartTotal: number;
}

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  sku: z.string(),
}).passthrough();

const cartItemSchema = z.object({
  product: productSchema,
  quantity: z.number().int().positive(),
  selectedVariant: z.object({
    sku: z.string(),
    price: z.number(),
  }).passthrough().optional(),
});

const cartItemsSchema = z.array(cartItemSchema);

const CartContext = createContext<CartContextType | undefined>(undefined);

function matchesItem(item: CartItem, productId: string, variantSku?: string): boolean {
  if (item.product.id !== productId) return false;
  if (variantSku) return item.selectedVariant?.sku === variantSku;
  return !item.selectedVariant;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isPartner } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const previousUserId = useRef(user?.id);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cart on mount or user change
  useEffect(() => {
    const key = user?.id ? `goldentier_cart_${user.id}` : 'goldentier_cart_guest';
    const stored = localStorage.getItem(key);

    // Logout detection: If previous user existed and now there's none
    if (previousUserId.current && !user?.id) {
      setItems([]);
      localStorage.removeItem('goldentier_cart_guest');
      setIsLoaded(true);
      previousUserId.current = user?.id;
      return;
    }
    previousUserId.current = user?.id;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const result = cartItemsSchema.safeParse(parsed);
        if (result.success) {
          setItems(result.data as unknown as CartItem[]);
        } else {
          console.error('Invalid cart data in storage:', result.error);
          setItems([]);
        }
      } catch {
        setItems([]);
      }
    } else {
      setItems([]);
    }
    setIsLoaded(true);
  }, [user?.id]);

  // Persist cart to localStorage with 500ms debounce
  useEffect(() => {
    if (!isLoaded) return;
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      const key = user?.id ? `goldentier_cart_${user.id}` : 'goldentier_cart_guest';
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch {
        // Storage full or unavailable — ignore
      }
    }, 500);
    return () => {
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [items, user?.id, isLoaded]);

  const addToCart = useCallback((product: Product, variant?: ProductVariant, quantityToAdd: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => matchesItem(item, product.id, variant?.sku));
      const stockLimit = variant?.stock ?? product.stockQuantity ?? 0;
      if (existing) {
        return prev.map((item) => {
          if (matchesItem(item, product.id, variant?.sku)) {
            const newQuantity = Math.min(item.quantity + quantityToAdd, stockLimit);
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
      }
      return [...prev, { product, quantity: Math.min(quantityToAdd, stockLimit), selectedVariant: variant }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variantSku?: string) => {
    setItems((prev) => prev.filter((item) => !matchesItem(item, productId, variantSku)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantSku?: string) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => !matchesItem(item, productId, variantSku)));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (matchesItem(item, productId, variantSku)) {
          const stockLimit = item.selectedVariant?.stock ?? item.product.stockQuantity ?? 0;
          return { ...item, quantity: Math.min(quantity, stockLimit) };
        }
        return item;
      })
    );
  }, []);

  const refreshCartPrices = useCallback((products: Product[]) => {
    setItems((prevItems) => {
      let changed = false;
      const newItems = prevItems.map((item) => {
        const currentProduct = products.find(p => p.id === item.product.id);
        if (!currentProduct) return item; // Can't update if product missing

        let newPrice = item.product.price;
        let newVariantPrice = item.selectedVariant?.price;

        if (item.selectedVariant) {
           const currentVariant = currentProduct.variants?.find(v => v.sku === item.selectedVariant!.sku);
           if (currentVariant && currentVariant.price !== newVariantPrice) {
               newVariantPrice = currentVariant.price;
               changed = true;
           }
        } else if (currentProduct.price !== newPrice) {
           newPrice = currentProduct.price;
           changed = true;
        }

        if (changed) {
            return {
                ...item,
                product: { ...item.product, price: newPrice },
                selectedVariant: item.selectedVariant ? { ...item.selectedVariant, price: newVariantPrice! } : undefined
            };
        }
        return item;
      });
      return changed ? newItems : prevItems;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const toggleCart = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const cartSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0),
    [items]
  );

  const discountAmount = useMemo(
    () => (isPartner && user?.discountRate ? cartSubtotal * (user.discountRate / 100) : 0),
    [cartSubtotal, isPartner, user?.discountRate]
  );

  const cartTotal = useMemo(
    () => cartSubtotal - discountAmount,
    [cartSubtotal, discountAmount]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        refreshCartPrices,
        clearCart,
        toggleCart,
        isOpen,
        setIsOpen,
        cartCount,
        cartSubtotal,
        discountAmount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
