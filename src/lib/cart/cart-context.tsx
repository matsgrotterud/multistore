"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Local cart state, persisted per store in localStorage. Prices shown in the
 * cart are display values; the checkout server action re-reads authoritative
 * prices from the database before "charging".
 */

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  imageAlt: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  quantity: number;
}

interface CartContextValue {
  storeSlug: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  currency: string;
  isDrawerOpen: boolean;
  isHydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  storeSlug,
  currency,
  children,
}: {
  storeSlug: string;
  currency: string;
  children: ReactNode;
}) {
  const storageKey = `msdf_cart_${storeSlug}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* corrupted cart -> start fresh */
    }
    setIsHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* storage full/unavailable: cart stays in memory */
    }
  }, [items, isHydrated, storageKey]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((entry) => entry.productId === item.productId);
        if (existing) {
          return current.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, quantity: Math.min(entry.quantity + quantity, 99) }
              : entry
          );
        }
        return [...current, { ...item, quantity }];
      });
      setIsDrawerOpen(true);
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((entry) => entry.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((entry) => entry.productId !== productId)
        : current.map((entry) =>
            entry.productId === productId
              ? { ...entry, quantity: Math.min(quantity, 99) }
              : entry
          )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce(
      (sum, entry) => sum + entry.price * entry.quantity,
      0
    );
    const itemCount = items.reduce((sum, entry) => sum + entry.quantity, 0);
    return {
      storeSlug,
      items,
      itemCount,
      subtotal,
      currency,
      isDrawerOpen,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openDrawer,
      closeDrawer,
    };
  }, [
    storeSlug,
    items,
    currency,
    isDrawerOpen,
    isHydrated,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openDrawer,
    closeDrawer,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

/** Flat-rate shipping estimate; mirrors the server-side checkout logic. */
export function estimateShippingCost(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= 50 ? 0 : 5.95;
}
