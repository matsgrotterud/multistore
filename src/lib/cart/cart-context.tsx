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
  lineId: string;
  productId: string;
  variantId?: string;
  slug: string;
  categorySlug?: string | null;
  title: string;
  variantTitle?: string;
  optionSummary?: string;
  sku?: string | null;
  externalVariantId?: string | null;
  price: number;
  currency: string;
  imageUrl: string;
  imageAlt: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  quantity: number;
}

export type CartItemInput = Omit<CartItem, "lineId" | "quantity">;

interface CartContextValue {
  storeSlug: string;
  /** `/s/[slug]` for preview stores, "" for live. Prefix for in-store links. */
  basePath: string;
  /** Build an in-store href that preserves tenant context in preview mode. */
  href: (path?: string) => string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  currency: string;
  isDrawerOpen: boolean;
  isHydrated: boolean;
  addItem: (item: CartItemInput, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineIdFor(productId: string, variantId?: string): string {
  return `${productId}:${variantId ?? "default"}`;
}

function hydrateCartItems(rawItems: unknown): CartItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .filter((entry): entry is Partial<CartItem> => Boolean(entry) && typeof entry === "object")
    .filter((entry) => typeof entry.productId === "string" && typeof entry.title === "string")
    .map((entry) => ({
      lineId: typeof entry.lineId === "string" ? entry.lineId : lineIdFor(entry.productId!, entry.variantId),
      productId: entry.productId!,
      variantId: entry.variantId,
      slug: entry.slug ?? "",
      categorySlug: typeof entry.categorySlug === "string" ? entry.categorySlug : null,
      title: entry.title!,
      variantTitle: entry.variantTitle,
      optionSummary: entry.optionSummary,
      sku: entry.sku,
      externalVariantId: entry.externalVariantId,
      price: typeof entry.price === "number" ? entry.price : 0,
      currency: entry.currency ?? "USD",
      imageUrl: entry.imageUrl ?? "/api/placeholder?label=Product",
      imageAlt: entry.imageAlt ?? entry.title!,
      shippingDaysMin: typeof entry.shippingDaysMin === "number" ? entry.shippingDaysMin : 7,
      shippingDaysMax: typeof entry.shippingDaysMax === "number" ? entry.shippingDaysMax : 18,
      quantity:
        typeof entry.quantity === "number" && Number.isFinite(entry.quantity)
          ? Math.max(1, Math.min(entry.quantity, 99))
          : 1,
    }));
}

export function CartProvider({
  storeSlug,
  currency,
  basePath = "",
  children,
}: {
  storeSlug: string;
  currency: string;
  /** `/s/[slug]` for preview stores, "" for live (clean URLs). */
  basePath?: string;
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
        setItems(hydrateCartItems(JSON.parse(raw)));
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
    (item: CartItemInput, quantity = 1) => {
      const lineId = lineIdFor(item.productId, item.variantId);
      setItems((current) => {
        const existing = current.find((entry) => entry.lineId === lineId);
        if (existing) {
          return current.map((entry) =>
            entry.lineId === lineId
              ? { ...entry, quantity: Math.min(entry.quantity + quantity, 99) }
              : entry
          );
        }
        return [...current, { ...item, lineId, quantity: Math.min(quantity, 99) }];
      });
      setIsDrawerOpen(true);
    },
    []
  );

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((entry) => entry.lineId !== lineId && entry.productId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((entry) => entry.lineId !== lineId && entry.productId !== lineId)
        : current.map((entry) =>
            entry.lineId === lineId || entry.productId === lineId
              ? { ...entry, quantity: Math.min(quantity, 99) }
              : entry
          )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const href = useCallback(
    (path = "/") => {
      if (!path || path === "/") return basePath || "/";
      const clean = path.startsWith("/") ? path : `/${path}`;
      return `${basePath}${clean}`;
    },
    [basePath]
  );

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce(
      (sum, entry) => sum + entry.price * entry.quantity,
      0
    );
    const itemCount = items.reduce((sum, entry) => sum + entry.quantity, 0);
    return {
      storeSlug,
      basePath,
      href,
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
    basePath,
    href,
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
