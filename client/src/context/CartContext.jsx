import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: '0.00' });
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    try {
      const data = await api.get('/cart');
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    const data = await api.post('/cart', { productId, quantity });
    setCart(data);
  };

  const updateQuantity = async (productId, quantity) => {
    const data = await api.put(`/cart/${productId}`, { quantity });
    setCart(data);
  };

  const removeFromCart = async (productId) => {
    const data = await api.delete(`/cart/${productId}`);
    setCart(data);
  };

  const clearCart = async () => {
    const data = await api.delete('/cart');
    setCart(data);
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, refreshCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
