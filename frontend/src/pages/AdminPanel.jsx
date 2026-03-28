import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ORDER_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const ENQUIRY_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

function AdminPanel() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('users');

  // Users state
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Enquiries state
  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesPage, setEnquiriesPage] = useState(0);
  const [enquiriesTotalPages, setEnquiriesTotalPages] = useState(0);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiriesError, setEnquiriesError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const handle401 = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // Fetch users
  const fetchUsers = useCallback(async (page = 0) => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const res = await axios.get(`/api/admin/users?page=${page}&size=20`, { headers });
      setUsers(res.data.content);
      setUsersTotalPages(res.data.totalPages);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setUsersError('Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, [token, handle401]);

  // Fetch orders
  const fetchOrders = useCallback(async (page = 0) => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await axios.get(`/api/admin/orders?page=${page}&size=20`, { headers });
      setOrders(res.data.content);
      setOrdersTotalPages(res.data.totalPages);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setOrdersError('Failed to load orders.');
    } finally {
      setOrdersLoading(false);
    }
  }, [token, handle401]);

  // Fetch enquiries
  const fetchEnquiries = useCallback(async (page = 0) => {
    setEnquiriesLoading(true);
    setEnquiriesError('');
    try {
      const res = await axios.get(`/api/admin/enquiries?page=${page}&size=20`, { headers });
      setEnquiries(res.data.content);
      setEnquiriesTotalPages(res.data.totalPages);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setEnquiriesError('Failed to load enquiries.');
    } finally {
      setEnquiriesLoading(false);
    }
  }, [token, handle401]);

  useEffect(() => { fetchUsers(usersPage); }, [usersPage]);
  useEffect(() => { fetchOrders(ordersPage); }, [ordersPage]);
  useEffect(() => { fetchEnquiries(enquiriesPage); }, [enquiriesPage]);

  // Delete user
  async function handleDeleteUser(id) {
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers });
      fetchUsers(usersPage);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setUsersError('Failed to delete user.');
    }
  }

  // Update order status
  async function handleOrderStatusChange(id, status) {
    try {
      await axios.patch(`/api/admin/orders/${id}/status`, { status }, { headers });
      fetchOrders(ordersPage);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setOrdersError('Failed to update order status.');
    }
  }

  // Update enquiry status
  async function handleEnquiryStatusChange(id, status) {
    try {
      await axios.patch(`/api/admin/enquiries/${id}/status`, { status }, { headers });
      fetchEnquiries(enquiriesPage);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else setEnquiriesError('Failed to update enquiry status.');
    }
  }

  return (
    <main>
      <h1>Admin Panel</h1>

      <nav>
        <button type="button" onClick={() => setActiveTab('users')} aria-pressed={activeTab === 'users'}>
          Users
        </button>
        <button type="button" onClick={() => setActiveTab('orders')} aria-pressed={activeTab === 'orders'}>
          Orders
        </button>
        <button type="button" onClick={() => setActiveTab('enquiries')} aria-pressed={activeTab === 'enquiries'}>
          Enquiries
        </button>
      </nav>

      {activeTab === 'users' && (
        <section aria-label="Users">
          <h2>Users</h2>
          {usersError && <p role="alert">{usersError}</p>}
          {usersLoading ? (
            <p>Loading…</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.createdAt}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          aria-label={`Delete user ${user.username}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <button
                  type="button"
                  onClick={() => setUsersPage((p) => p - 1)}
                  disabled={usersPage === 0}
                >
                  Prev
                </button>
                <span> Page {usersPage + 1} of {usersTotalPages} </span>
                <button
                  type="button"
                  onClick={() => setUsersPage((p) => p + 1)}
                  disabled={usersPage >= usersTotalPages - 1}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === 'orders' && (
        <section aria-label="Orders">
          <h2>Orders</h2>
          {ordersError && <p role="alert">{ordersError}</p>}
          {ordersLoading ? (
            <p>Loading…</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Service Type</th>
                    <th>Device Description</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.username}</td>
                      <td>{order.serviceType}</td>
                      <td>{order.deviceDescription}</td>
                      <td>{order.status}</td>
                      <td>{order.createdAt}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          aria-label={`Update status for order ${order.id}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <button
                  type="button"
                  onClick={() => setOrdersPage((p) => p - 1)}
                  disabled={ordersPage === 0}
                >
                  Prev
                </button>
                <span> Page {ordersPage + 1} of {ordersTotalPages} </span>
                <button
                  type="button"
                  onClick={() => setOrdersPage((p) => p + 1)}
                  disabled={ordersPage >= ordersTotalPages - 1}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === 'enquiries' && (
        <section aria-label="Enquiries">
          <h2>Enquiries</h2>
          {enquiriesError && <p role="alert">{enquiriesError}</p>}
          {enquiriesLoading ? (
            <p>Loading…</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td>{enquiry.id}</td>
                      <td>{enquiry.username}</td>
                      <td>{enquiry.subject}</td>
                      <td>{enquiry.message}</td>
                      <td>{enquiry.status}</td>
                      <td>{enquiry.createdAt}</td>
                      <td>
                        <select
                          value={enquiry.status}
                          onChange={(e) => handleEnquiryStatusChange(enquiry.id, e.target.value)}
                          aria-label={`Update status for enquiry ${enquiry.id}`}
                        >
                          {ENQUIRY_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <button
                  type="button"
                  onClick={() => setEnquiriesPage((p) => p - 1)}
                  disabled={enquiriesPage === 0}
                >
                  Prev
                </button>
                <span> Page {enquiriesPage + 1} of {enquiriesTotalPages} </span>
                <button
                  type="button"
                  onClick={() => setEnquiriesPage((p) => p + 1)}
                  disabled={enquiriesPage >= enquiriesTotalPages - 1}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

export default AdminPanel;
