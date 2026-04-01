import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';
import OrderForm from './OrderForm';
import EnquiryForm from './EnquiryForm';
import DeleteAccountModal from '../components/DeleteAccountModal';

const STATUS_COLORS = {
  Pending:       'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Completed:     'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Cancelled:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Open:          'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  Resolved:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Closed:        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

function StatusBadge({ status, animate }) {
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all duration-500 ${cls} ${animate ? 'ring-2 ring-offset-1 ring-blue-400 scale-110' : ''}`}>
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
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  // Track recently updated IDs for highlight animation
  const [updatedOrderIds, setUpdatedOrderIds] = useState(new Set());
  const [updatedEnquiryIds, setUpdatedEnquiryIds] = useState(new Set());

  const stompRef = useRef(null);

  const handle401 = useCallback(() => { logout(); navigate('/login'); }, [logout, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, enquiriesRes] = await Promise.all([
        axios.get('/api/orders', { headers }),
        axios.get('/api/enquiries', { headers }),
      ]);
      setOrders(ordersRes.data);
      setEnquiries(enquiriesRes.data);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, handle401]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // WebSocket: subscribe to real-time order/enquiry status updates
  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        stompRef.current = client;

        // Order status updated by admin
        client.subscribe('/user/queue/order-update', (msg) => {
          const updated = JSON.parse(msg.body);
          setOrders((prev) => {
            const exists = prev.find((o) => o.id === updated.id);
            if (exists) {
              return prev.map((o) => o.id === updated.id ? { ...o, status: updated.status } : o);
            }
            return [updated, ...prev]; // new order added
          });
          // Flash highlight
          setUpdatedOrderIds((prev) => new Set([...prev, updated.id]));
          setTimeout(() => setUpdatedOrderIds((prev) => {
            const next = new Set(prev); next.delete(updated.id); return next;
          }), 2000);
        });

        // Enquiry status updated by admin
        client.subscribe('/user/queue/enquiry-update', (msg) => {
          const updated = JSON.parse(msg.body);
          setEnquiries((prev) => {
            const exists = prev.find((e) => e.id === updated.id);
            if (exists) {
              return prev.map((e) => e.id === updated.id ? { ...e, status: updated.status } : e);
            }
            return [updated, ...prev];
          });
          setUpdatedEnquiryIds((prev) => new Set([...prev, updated.id]));
          setTimeout(() => setUpdatedEnquiryIds((prev) => {
            const next = new Set(prev); next.delete(updated.id); return next;
          }), 2000);
        });
      },
    });

    client.activate();
    return () => client.deactivate();
  }, [token]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      {showDeleteAccount && <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-2xl text-white shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {currentUser?.username}! 👋</h1>
              <p className="text-blue-100 mt-1 text-sm">Manage your orders and enquiries below.</p>
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
          <button
            type="button"
            onClick={() => { setShowOrderForm((v) => !v); setShowEnquiryForm(false); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              showOrderForm ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showOrderForm ? '✕ Cancel' : '+ New Order'}
          </button>
          <button
            type="button"
            onClick={() => { setShowEnquiryForm((v) => !v); setShowOrderForm(false); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              showEnquiryForm ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {showEnquiryForm ? '✕ Cancel' : '+ New Enquiry'}
          </button>
          <Link to="/chat" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
            💬 Chat with Admin
          </Link>
        </div>

        {showOrderForm && (
          <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Submit a New Order</h2>
            <OrderForm onSuccess={() => { setShowOrderForm(false); fetchData(); }} />
          </div>
        )}
        {showEnquiryForm && (
          <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Submit a New Enquiry</h2>
            <EnquiryForm onSuccess={() => { setShowEnquiryForm(false); fetchData(); }} />
          </div>
        )}

        {loading && <div className="text-center py-16 text-slate-400 dark:text-slate-500">Loading…</div>}
        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Orders */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-100 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">My Orders</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{orders.length} total</span>
              </div>
              {orders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="text-4xl mb-2">📦</div>
                  <p>No orders yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {orders.map((order) => (
                    <div key={order.id} className={`px-6 py-4 transition-colors duration-500 ${updatedOrderIds.has(order.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white text-sm">{order.deviceDescription}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">#{order.id} · {order.serviceType}</p>
                        </div>
                        <StatusBadge status={order.status} animate={updatedOrderIds.has(order.id)} />
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Enquiries */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-100 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">My Enquiries</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{enquiries.length} total</span>
              </div>
              {enquiries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No enquiries yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {enquiries.map((enq) => (
                    <div key={enq.id} className={`px-6 py-4 transition-colors duration-500 ${updatedEnquiryIds.has(enq.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white text-sm">{enq.subject}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">#{enq.id} · {enq.message}</p>
                        </div>
                        <StatusBadge status={enq.status} animate={updatedEnquiryIds.has(enq.id)} />
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(enq.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
