import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useOrderUpdates } from '../hooks/useOrderUpdates';
import { useNotifications } from '../hooks/useNotifications';
import DeleteAccountModal from '../components/DeleteAccountModal';

const ORDER_STATUS_COLORS = {
  Pending:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  Dispatched: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Delivered:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Cancelled:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

function StatusBadge({ status, animate }) {
  const cls = ORDER_STATUS_COLORS[status];
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all duration-500 ${cls || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'} ${animate ? 'ring-2 ring-offset-1 ring-blue-400 scale-110' : ''}`}>
      {status}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function Dashboard() {
  const navigate = useNavigate();
  const { token, currentUser, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [updatedOrderIds, setUpdatedOrderIds] = useState(new Set());
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const notifications = useNotifications();

  const handle401 = useCallback(() => { logout(); navigate('/login'); }, [logout, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/orders', { headers });
      setOrders(res.data);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, handle401]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOrderUpdated = useCallback((order) => {
    setOrders((prev) => {
      const exists = prev.find((o) => o.id === order.id);
      if (exists) return prev.map((o) => o.id === order.id ? { ...o, ...order } : o);
      return [order, ...prev];
    });
    notifications.notifyOrderStatusUpdate(order.id, order.status);
    setUpdatedOrderIds((prev) => new Set([...prev, order.id]));
    setTimeout(() => setUpdatedOrderIds((prev) => {
      const next = new Set(prev); next.delete(order.id); return next;
    }), 2000);
  }, [notifications]);

  const handleOrderCreated = useCallback((order) => {
    notifications.notifyOrderCreated(order.id);
  }, [notifications]);

  const handleStatusChange = useCallback((update) => {
    setOrders((prev) => prev.map((o) => o.id === update.orderId ? { ...o, status: update.status } : o));
    notifications.notifyOrderStatusUpdate(update.orderId, update.status);
    setUpdatedOrderIds((prev) => new Set([...prev, update.orderId]));
    setTimeout(() => setUpdatedOrderIds((prev) => {
      const next = new Set(prev); next.delete(update.orderId); return next;
    }), 2000);
  }, [notifications]);

  useOrderUpdates({ token, onOrderUpdated: handleOrderUpdated, onOrderCreated: handleOrderCreated, onStatusChange: handleStatusChange });

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      {showDeleteAccount && <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome banner */}
        <div className="mb-8 p-6 bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-2xl text-white shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {currentUser?.username}! 👋</h1>
              <p className="text-blue-100 mt-1 text-sm">Track your orders in real-time.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteAccount(true)}
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-200 border border-red-300/50 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link to="/catalogue" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            🛒 Continue Shopping
          </Link>
          <Link to="/cart" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
            🛍️ View Cart
          </Link>
          <Link to="/chat" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
            💬 Chat with Support
          </Link>
        </div>

        {loading && <div className="text-center py-16 text-slate-400 dark:text-slate-500">Loading…</div>}
        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        {!loading && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">My Orders</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">{orders.length} total</span>
            </div>
            {orders.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <div className="text-4xl mb-2">📦</div>
                <p>No orders yet. Start shopping!</p>
                <Link to="/catalogue" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  Browse products →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {orders.map((order) => (
                  <div key={order.id}>
                    <div
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      className={`px-6 py-4 transition-colors duration-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${updatedOrderIds.has(order.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white text-sm">Order #{order.id}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">£{order.totalPrice?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <StatusBadge status={order.status} animate={updatedOrderIds.has(order.id)} />
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{formatDate(order.createdAt)}</p>
                    </div>
                    {expandedOrderId === order.id && (
                      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-sm">
                        <p className="text-slate-600 dark:text-slate-400 mb-1"><strong>Shipping Address:</strong></p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 whitespace-pre-wrap">{order.shippingAddress}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
