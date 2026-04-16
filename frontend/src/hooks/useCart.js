import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for managing shopping cart operations
 * Handles fetching, adding, updating, removing items and clearing cart
 */
export function useCart(token) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  /**
   * Fetch all cart items
   */
  const fetchCart = useCallback(async () => {
    if (!token) {
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      return { items: [], count: 0, total: 0 };
    }

    setLoading(true);
    setError(null);
    try {
      const [itemsRes, countRes, totalRes] = await Promise.all([
        axios.get('/api/cart', { headers }),
        axios.get('/api/cart/count', { headers }),
        axios.get('/api/cart/total', { headers }),
      ]);

      const items = itemsRes.data || [];
      const count = countRes.data || 0;
      const total = totalRes.data || 0;

      setCartItems(items);
      setCartCount(count);
      setCartTotal(total);

      return { items, count, total };
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      return { items: [], count: 0, total: 0 };
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  /**
   * Add product to cart
   */
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!token) {
        setError('Please login to add items to cart');
        return false;
      }

      setError(null);
      try {
        await axios.post('/api/cart', { productId, quantity }, { headers });
        return true;
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        return false;
      }
    },
    [token, headers]
  );

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback(
    async (productId, quantity) => {
      if (!token) {
        setError('Please login to update cart');
        return false;
      }

      setError(null);
      try {
        await axios.put(`/api/cart/${productId}`, { quantity }, { headers });
        return true;
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        return false;
      }
    },
    [token, headers]
  );

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback(
    async (productId) => {
      if (!token) {
        setError('Please login to remove items');
        return false;
      }

      setError(null);
      try {
        await axios.delete(`/api/cart/${productId}`, { headers });
        return true;
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        return false;
      }
    },
    [token, headers]
  );

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(async () => {
    if (!token) {
      setError('Please login to clear cart');
      return false;
    }

    setError(null);
    try {
      await axios.delete('/api/cart', { headers });
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return false;
    }
  }, [token, headers]);

  /**
   * Get current cart count
   */
  const getCartCount = useCallback(async () => {
    if (!token) {
      setCartCount(0);
      return 0;
    }

    try {
      const res = await axios.get('/api/cart/count', { headers });
      const count = res.data || 0;
      setCartCount(count);
      return count;
    } catch {
      return cartCount;
    }
  }, [token, headers, cartCount]);

  /**
   * Get current cart total
   */
  const getCartTotal = useCallback(async () => {
    if (!token) {
      setCartTotal(0);
      return 0;
    }

    try {
      const res = await axios.get('/api/cart/total', { headers });
      const total = res.data || 0;
      setCartTotal(total);
      return total;
    } catch {
      return cartTotal;
    }
  }, [token, headers, cartTotal]);

  return {
    cartItems,
    cartCount,
    cartTotal,
    loading,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartCount,
    getCartTotal,
  };
}
