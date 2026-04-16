import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart from server
  const fetchCart = useCallback(async () => {
    if (!token) {
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [itemsRes, countRes, totalRes] = await Promise.all([
        axios.get('/api/cart', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/cart/count', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/cart/total', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setCartItems(itemsRes.data || []);
      setCartCount(countRes.data || 0);
      setCartTotal(totalRes.data || 0);
    } catch (err) {
      setError(err.message);
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch on mount and token change
  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token, fetchCart]);

  // Add item to cart
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!token) {
        setError('Please login to add items to cart');
        return false;
      }

      setError(null);
      try {
        await axios.post(
          '/api/cart',
          { productId, quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchCart();
        return true;
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        return false;
      }
    },
    [token, fetchCart]
  );

  // Update quantity
  const updateQuantity = useCallback(
    async (productId, quantity) => {
      if (!token) {
        setError('Please login to update cart');
        return false;
      }

      setError(null);
      try {
        await axios.put(
          `/api/cart/${productId}`,
          { quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchCart();
        return true;
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        return false;
      }
    },
    [token, fetchCart]
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (productId) => {
      if (!token) {
        setError('Please login to remove from cart');
        return false;
      }

      setError(null);
      try {
        await axios.delete(`/api/cart/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchCart();
        return true;
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        return false;
      }
    },
    [token, fetchCart]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!token) {
      setError('Please login to clear cart');
      return false;
    }

    setError(null);
    try {
      await axios.delete('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return false;
    }
  }, [token]);

  // Refresh cart count
  const refreshCount = useCallback(async () => {
    if (!token) return;

    try {
      const res = await axios.get('/api/cart/count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartCount(res.data || 0);
    } catch {
      // Silently fail
    }
  }, [token]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        refreshCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

export default CartContext;
