import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useInventoryUpdates } from '../hooks/useInventoryUpdates';
import AdminChatPanel from './AdminChatPanel';
import AdminCatalogue from './AdminCatalogue';

const ORDER_STATUSES = ['Pending', 'Dispatched', 'Delivered', 'Cancelled'];
const ENQUIRY_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const STATUS_COLORS = {
  Pending:       'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  Dispatched:    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Delivered:     'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Cancelled:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Open:          'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Resolved:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Closed:        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function Pagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-700">
      <button
        type="button"
        onClick={onPrev}
        disabled={page === 0}
        className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        ← Prev
      </button>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Page {page + 1} of {Math.max(totalPages, 1)}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages - 1}
        className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

function AdminPanel() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const notifications = useNotifications();
  const [activeTab, setActiveTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  const [deletedUsers, setDeletedUsers] = useState([]);
  const [deletedUsersPage, setDeletedUsersPage] = useState(0);
  const [deletedUsersTotalPages, setDeletedUsersTotalPages] = useState(0);
  const [deletedUsersLoading, setDeletedUsersLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesPage, setEnquiriesPage] = useState(0);
  const [enquiriesTotalPages, setEnquiriesTotalPages] = useState(0);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiriesError, setEnquiriesError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const stompRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };

  const handle401 = useCallback(() => { navigate('/login'); }, [navigate]);

  const fetchUsers = useCallback(async (page = 0) => {
    setUsersLoading(true); setUsersError('');
    try {
      const res = await axios.get(`/api/admin/users?page=${page}&size=20`, { headers });
      setUsers(res.data.content); setUsersTotalPages(res.data.totalPages);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setUsersError('Failed to load users.');
    } finally { setUsersLoading(false); }
  }, [token, handle401]);

  const fetchDeletedUsers = useCallback(async (page = 0) => {
    setDeletedUsersLoading(true);
    try {
      const res = await axios.get(`/api/admin/users/deleted?page=${page}&size=20`, { headers });
      setDeletedUsers(res.data.content); setDeletedUsersTotalPages(res.data.totalPages);
    } catch { /* ignore */ } finally { setDeletedUsersLoading(false); }
  }, [token]);

  const fetchOrders = useCallback(async (page = 0) => {
    setOrdersLoading(true); setOrdersError('');
    try {
      const res = await axios.get(`/api/admin/orders?page=${page}&size=20`, { headers });
      setOrders(res.data.content); setOrdersTotalPages(res.data.totalPages);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setOrdersError('Failed to load orders.');
    } finally { setOrdersLoading(false); }
  }, [token, handle401]);

  const fetchEnquiries = useCallback(async (page = 0) => {
    setEnquiriesLoading(true); setEnquiriesError('');
    try {
      const res = await axios.get(`/api/admin/enquiries?page=${page}&size=20`, { headers });
      setEnquiries(res.data.content); setEnquiriesTotalPages(res.data.totalPages);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setEnquiriesError('Failed to load enquiries.');
    } finally { setEnquiriesLoading(false); }
  }, [token, handle401]);

  useEffect(() => { fetchUsers(usersPage); }, [usersPage]);
  useEffect(() => { fetchDeletedUsers(deletedUsersPage); }, [deletedUsersPage]);
  useEffect(() => { fetchOrders(ordersPage); }, [ordersPage]);
  useEffect(() => { fetchEnquiries(enquiriesPage); }, [enquiriesPage]);

  // Inventory updates WebSocket hook
  const handleInventoryChanged = useCallback((update) => {
    notifications.notifyInventoryUpdate(update.productName, update.stock);
  }, [notifications]);

  const handleProductAdded = useCallback((product) => {
    notifications.notifyProductAdded(product.name, product.category);
  }, [notifications]);

  const handleProductRemoved = useCallback((update) => {
    notifications.notifyProductRemoved(update.productName);
  }, [notifications]);

  useInventoryUpdates({
    token,
    onInventoryChanged: handleInventoryChanged,
    onProductAdded: handleProductAdded,
    onProductRemoved: handleProductRemoved,
  });

  // Real-time WebSocket updates for users/orders/enquiries
  useEffect(() => {
    if (!token) return;
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        stompRef.current = client;

        // New user registered
        client.subscribe('/topic/admin/users/new', (msg) => {
          const newUser = JSON.parse(msg.body);
          setUsers((prev) => prev.find((u) => u.id === newUser.id) ? prev : [newUser, ...prev]);
          notifications.notifySuccess(`New user registered: ${newUser.username}`, '👤');
        });

        // User soft-deleted (moved to deleted list)
        client.subscribe('/topic/admin/users/deleted', (msg) => {
          const deletedId = JSON.parse(msg.body);
          setUsers((prev) => prev.filter((u) => u.id !== deletedId));
          fetchDeletedUsers(0);
          notifications.notifyInfo(`🗑️ User #${deletedId} deleted their account`);
        });

        // User permanently deleted
        client.subscribe('/topic/admin/users/removed', (msg) => {
          const removedId = JSON.parse(msg.body);
          setDeletedUsers((prev) => prev.filter((u) => u.id !== removedId));
          notifications.notifyInfo(`🗑️ User #${removedId} permanently removed`);
        });

        // Order created or status updated
        client.subscribe('/topic/admin/orders', (msg) => {
          const updated = JSON.parse(msg.body);
          setOrders((prev) => {
            const exists = prev.find((o) => o.id === updated.id);
            if (exists) {
              return prev.map((o) => o.id === updated.id ? { ...o, status: updated.status } : o);
            }
            notifications.notifyOrderCreated(updated.id, `📦 New order #${updated.id}`);
            return [updated, ...prev];
          });
        });

        // Enquiry created or status updated
        client.subscribe('/topic/admin/enquiries', (msg) => {
          const updated = JSON.parse(msg.body);
          setEnquiries((prev) => {
            const exists = prev.find((e) => e.id === updated.id);
            if (exists) return prev.map((e) => e.id === updated.id ? { ...e, status: updated.status } : e);
            notifications.notifyInfo(`💬 New enquiry: ${updated.subject}`);
            return [updated, ...prev];
          });
        });
      },
    });
    client.activate();
    return () => client.deactivate();
  }, [token, notifications]);

  async function handleDeleteUser(id, hardDelete) {
    try {
      if (hardDelete) {
        await axios.delete(`/api/admin/users/${id}`, { headers });
        toast.success('User permanently deleted.');
      } else {
        await axios.patch(`/api/admin/users/${id}/deactivate`, {}, { headers });
        toast.success('User deactivated.');
      }
      setDeleteConfirm(null);
      fetchUsers(usersPage);
      fetchDeletedUsers(deletedUsersPage);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else toast.error(hardDelete ? 'Failed to delete user.' : 'Failed to deactivate user.');
    }
  }
  async function handleOrderStatusChange(id, status) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    try {
      await axios.patch(`/api/admin/orders/${id}/status`, { status }, { headers });
      toast.success(`📦 Order #${id} → ${status}`);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else { toast.error('Failed to update order status.'); fetchOrders(ordersPage); }
    }
  }

  async function handleEnquiryStatusChange(id, status) {
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
    try {
      await axios.patch(`/api/admin/enquiries/${id}/status`, { status }, { headers });
      toast.success(`💬 Enquiry #${id} → ${status}`);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else { toast.error('Failed to update enquiry status.'); fetchEnquiries(enquiriesPage); }
    }
  }

  const tabs = [
    { id: 'users',     label: '👥 Users' },
    { id: 'orders',    label: '📦 Orders' },
    { id: 'enquiries', label: '💬 Enquiries' },
    { id: 'catalogue', label: '🛒 Catalogue' },
    { id: 'chat',      label: '🗨️ Chat' },
  ];

  const selectClass = "px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-2xl text-white shadow">
          <h1 className="text-2xl font-bold">Admin Panel 🛠️</h1>
          <p className="text-amber-100 mt-1 text-sm">Manage users, orders, and enquiries.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {deleteConfirm.hardDelete ? 'Permanently Delete User?' : 'Deactivate User?'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                {deleteConfirm.hardDelete
                  ? <>This will <strong className="text-red-600 dark:text-red-400">permanently remove</strong> <strong className="text-slate-700 dark:text-slate-200">{deleteConfirm.username}</strong> and all their data. This cannot be undone.</>
                  : <>This will deactivate <strong className="text-slate-700 dark:text-slate-200">{deleteConfirm.username}</strong>. Their data will be kept. You can permanently delete later.</>
                }
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteUser(deleteConfirm.id, deleteConfirm.hardDelete)}
                  className={`flex-1 py-2 text-white font-semibold rounded-lg text-sm transition-colors ${
                    deleteConfirm.hardDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {deleteConfirm.hardDelete ? 'Permanently Delete' : 'Deactivate'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Active Users */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-100 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Users</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{users.length} shown</span>30 + 35 + 40 + 55 + 185 + 205 = Kinda 5,50,00 worth laptops are there...
              </div>
              {usersError && <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">{usersError}</div>}
              {usersLoading ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">Loading…</div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">No active users.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Username</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Registered</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-3 text-slate-400 dark:text-slate-500">#{user.id}</td>
                          <td className="px-6 py-3 font-medium text-slate-800 dark:text-white">{user.username}</td>
                          <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{user.email}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-400 dark:text-slate-500 text-xs">{formatDate(user.createdAt)}</td>
                          <td className="px-6 py-3">
                            {user.role !== 'ADMIN' && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ ...user, hardDelete: false })}
                                className="px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                              >
                                Deactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={usersPage} totalPages={usersTotalPages} onPrev={() => setUsersPage((p) => p - 1)} onNext={() => setUsersPage((p) => p + 1)} />
            </div>

            {/* Deleted Users */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-red-100 dark:border-red-900/40">
              <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Deleted Users</h2>
                  {deletedUsers.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold">
                      {deletedUsers.length}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">Awaiting permanent deletion</span>
              </div>
              {deletedUsersLoading ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">Loading…</div>
              ) : deletedUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="text-3xl mb-2">✅</div>
                  <p>No deleted users.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-red-50 dark:bg-red-900/20 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Original Username</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Registered</th>
                        <th className="px-6 py-3">Deleted At</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 dark:divide-red-900/20">
                      {deletedUsers.map((user) => {
                        // Strip the "deleted_<id>_" prefix to show original username
                        const originalUsername = user.username.replace(/^deleted_\d+_/, '');
                        return (
                          <tr key={user.id} className="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                            <td className="px-6 py-3 text-slate-400 dark:text-slate-500">#{user.id}</td>
                            <td className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300 line-through opacity-60">{originalUsername}</td>
                            <td className="px-6 py-3">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-slate-400 dark:text-slate-500 text-xs">{formatDate(user.createdAt)}</td>
                            <td className="px-6 py-3 text-red-400 dark:text-red-500 text-xs">{formatDate(user.deletedAt)}</td>
                            <td className="px-6 py-3">
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ ...user, username: originalUsername, hardDelete: true })}
                                className="px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                Permanently Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={deletedUsersPage} totalPages={deletedUsersTotalPages} onPrev={() => setDeletedUsersPage((p) => p - 1)} onNext={() => setDeletedUsersPage((p) => p + 1)} />
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">All Orders</h2>
            </div>
            {ordersError && <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">{ordersError}</div>}
            {ordersLoading ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">Loading…</div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <div className="text-4xl mb-2">📦</div>
                <p>No orders yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Total Price</th>
                      <th className="px-6 py-3">Shipping Address</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-3 text-slate-400 dark:text-slate-500">#{order.id}</td>
                        <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{order.username}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-semibold">£{order.totalPrice?.toFixed(2) || '0.00'}</span>
                        </td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate text-xs">{order.shippingAddress}</td>
                        <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-6 py-3 text-slate-400 dark:text-slate-500 text-xs">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                            aria-label={`Update status for order ${order.id}`}
                            className={selectClass}
                          >
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={ordersPage} totalPages={ordersTotalPages} onPrev={() => setOrdersPage((p) => p - 1)} onNext={() => setOrdersPage((p) => p + 1)} />
          </div>
        )}

        {/* Enquiries Tab */}
        {activeTab === 'enquiries' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">All Enquiries</h2>
            </div>
            {enquiriesError && <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">{enquiriesError}</div>}
            {enquiriesLoading ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">Loading…</div>
            ) : enquiries.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <div className="text-4xl mb-2">💬</div>
                <p>No enquiries yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Subject</th>
                      <th className="px-6 py-3">Message</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {enquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-3 text-slate-400 dark:text-slate-500">#{enq.id}</td>
                        <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{enq.username}</td>
                        <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200 max-w-[140px] truncate">{enq.subject}</td>
                        <td className="px-6 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{enq.message}</td>
                        <td className="px-6 py-3"><StatusBadge status={enq.status} /></td>
                        <td className="px-6 py-3 text-slate-400 dark:text-slate-500 text-xs">{formatDate(enq.createdAt)}</td>
                        <td className="px-6 py-3">
                          <select
                            value={enq.status}
                            onChange={(e) => handleEnquiryStatusChange(enq.id, e.target.value)}
                            aria-label={`Update status for enquiry ${enq.id}`}
                            className={selectClass}
                          >
                            {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={enquiriesPage} totalPages={enquiriesTotalPages} onPrev={() => setEnquiriesPage((p) => p - 1)} onNext={() => setEnquiriesPage((p) => p + 1)} />
          </div>
        )}

        {/* Catalogue Tab */}
        {activeTab === 'catalogue' && <AdminCatalogue />}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-280px)]">
            <AdminChatPanel />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
