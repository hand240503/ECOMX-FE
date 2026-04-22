import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  CART_STORAGE_KEY,
  cartSubtotal,
  clearCartStorage,
  loadCartLines,
  mergeCartLine,
  type CartLine,
  type CartLineInput,
  removeCartLine,
  saveCartLines,
  setLineQuantity,
  totalQuantityInCart
} from '../../lib/cartStorage';

export type CartContextValue = {
  lines: CartLine[];
  totalQuantity: number;
  subtotal: number;
  addItem: (item: CartLineInput) => void;
  setQuantity: (productId: number, unitId: number, quantity: number) => void;
  removeItem: (productId: number, unitId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadCartLines());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CART_STORAGE_KEY) return;
      setLines(loadCartLines());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addItem = useCallback(
    (item: CartLineInput) => {
      setLines((prev) => {
        const next = mergeCartLine(prev, item);
        saveCartLines(next);
        return next;
      });
    },
    []
  );

  const setQuantity = useCallback((productId: number, unitId: number, quantity: number) => {
    setLines((prev) => {
      const next = setLineQuantity(prev, productId, unitId, quantity);
      saveCartLines(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: number, unitId: number) => {
    setLines((prev) => {
      const next = removeCartLine(prev, productId, unitId);
      saveCartLines(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    clearCartStorage();
    setLines([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      totalQuantity: totalQuantityInCart(lines),
      subtotal: cartSubtotal(lines),
      addItem,
      setQuantity,
      removeItem,
      clear
    }),
    [lines, addItem, setQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
