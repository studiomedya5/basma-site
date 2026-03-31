import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export const cartItemKey = (item) => `${item.name}||${item.size}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("basma_cart") || "[]"); }
    catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("basma_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product) => {
    const k = cartItemKey(product);
    setItems(prev => {
      const exists = prev.find(i => cartItemKey(i) === k);
      if (exists) return prev.map(i => cartItemKey(i) === k ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeItem = (k) => setItems(prev => prev.filter(i => cartItemKey(i) !== k));

  const updateQty = (k, delta) => setItems(prev =>
    prev.map(i => cartItemKey(i) === k ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
  );

  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
