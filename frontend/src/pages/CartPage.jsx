import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotifications } from '../hooks/useNotifications';

function CartPage() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/cart');
      setItems(res.data);
      
      // Calculate total
      const cartTotal = res.data.reduce((sum, item) => sum + item.subtotal, 0);
      setTotal(cartTotal);
    } catch (error) {
      if (error.response?.status !== 401) {
        notifications.notifyError('Failed to load cart', 'Cart Error');
      }
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await axios.put(`/api/cart/${productId}`, { quantity: newQuantity });
      await fetchCart();
      notifications.notifySuccess('Quantity updated');
    } catch (error) {
      notifications.notifyError(error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (productId, productName) => {
    try {
      await axios.delete(`/api/cart/${productId}`);
      await fetchCart();
      notifications.notifyCartRemoved(productName);
    } catch (error) {
      notifications.notifyError('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Clear entire cart?')) {
      try {
        await axios.delete('/api/cart');
        setItems([]);
        setTotal(0);
        notifications.notifySuccess('Cart cleared');
      } catch (error) {
        notifications.notifyError('Failed to clear cart');
      }
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Shopping Cart</h1>
        <p className="text-slate-500 dark:text-slate-400">Review your items before checkout.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Your cart is empty</p>
          <button
            onClick={() => navigate('/catalogue')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-lg text-slate-800 dark:text-white">
                  Items ({items.length})
                </h2>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.map((item) => (
                  <div key={item.productId} className="p-6 flex gap-4">
                    {/* Product image */}
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.imageBase64 ? (
                        <img
                          src={`data:image/jpeg;base64,${item.imageBase64}`}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}
                    </div>

                    {/* Product details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 dark:text-white mb-1">{item.productName}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{item.productId}</p>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="w-12 text-center px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                          +
                        </button>
                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
                          £{item.productPrice.toFixed(2)} each
                        </span>
                      </div>
                    </div>

                    {/* Price and remove */}
                    <div className="flex flex-col items-end">
                      <div className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                        £{item.subtotal.toFixed(2)}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.productId, item.productName)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={handleClearCart}
                  className="text-sm text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-semibold"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sticky top-24">
              <h2 className="font-semibold text-lg text-slate-800 dark:text-white mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Tax</span>
                  <span>£0.00</span>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-600 pt-6 mb-6">
                <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-white">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors mb-3"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate('/catalogue')}
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
