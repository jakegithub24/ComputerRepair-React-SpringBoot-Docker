import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await axios.get('/api/cart');
        setCartItems(res.data);
        const cartTotal = res.data.reduce((sum, item) => sum + item.subtotal, 0);
        setTotal(cartTotal);
      } catch (error) {
        toast.error('Failed to load cart');
        navigate('/cart');
      } finally {
        setCartLoading(false);
      }
    };
    fetchCart();
  }, [navigate]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!shippingAddress.trim()) {
      toast.error('Please enter shipping address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/orders', {
        shippingAddress: shippingAddress.trim()
      });

      toast.success('✅ Order placed successfully!');
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading checkout...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Checkout</h1>
        <p className="text-slate-500 dark:text-slate-400">Complete your order</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order form */}
        <div className="lg:col-span-2">
          <form onSubmit={handlePlaceOrder}>
            {/* Shipping address section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-6">
              <h2 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">Shipping Address</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Address
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter your full shipping address (street, city, postal code, country)"
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Order review */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-6">
              <h2 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">Order Review</h2>

              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{item.productName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Qty: {item.quantity} × £{item.productPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-white">£{item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Place order button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Placing Order...' : `Place Order - £${total.toFixed(2)}`}
            </button>

            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="w-full py-3 mt-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Back to Cart
            </button>
          </form>
        </div>

        {/* Order summary sidebar */}
        <div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sticky top-24">
            <h2 className="font-semibold text-lg text-slate-800 dark:text-white mb-6">Order Total</h2>

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

            <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
              <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-white">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                ✅ Free shipping on all orders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
