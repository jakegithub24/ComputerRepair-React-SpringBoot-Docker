import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import OrderForm from './OrderForm';
import EnquiryForm from './EnquiryForm';

function Dashboard() {
  const navigate = useNavigate();
  const { token, currentUser, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);

  const handle401 = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

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
      if (err.response?.status === 401) {
        handle401();
      } else {
        setError('Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, handle401]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function handleOrderSuccess() {
    setShowOrderForm(false);
    fetchData();
  }

  function handleEnquirySuccess() {
    setShowEnquiryForm(false);
    fetchData();
  }

  return (
    <main>
      <header>
        <h1>Dashboard</h1>
        {currentUser && <p>Welcome, {currentUser.username}</p>}
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section>
        <h2>Actions</h2>
        <button type="button" onClick={() => setShowOrderForm((v) => !v)}>
          {showOrderForm ? 'Cancel Order' : 'New Order'}
        </button>
        <button type="button" onClick={() => setShowEnquiryForm((v) => !v)}>
          {showEnquiryForm ? 'Cancel Enquiry' : 'New Enquiry'}
        </button>
      </section>

      {showOrderForm && (
        <section>
          <h2>Submit Order</h2>
          <OrderForm onSuccess={handleOrderSuccess} />
        </section>
      )}

      {showEnquiryForm && (
        <section>
          <h2>Submit Enquiry</h2>
          <EnquiryForm onSuccess={handleEnquirySuccess} />
        </section>
      )}

      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && (
        <>
          <section>
            <h2>My Orders</h2>
            {orders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Service Type</th>
                    <th>Device Description</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.serviceType}</td>
                      <td>{order.deviceDescription}</td>
                      <td>{order.status}</td>
                      <td>{order.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>My Enquiries</h2>
            {enquiries.length === 0 ? (
              <p>No enquiries yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td>{enquiry.id}</td>
                      <td>{enquiry.subject}</td>
                      <td>{enquiry.message}</td>
                      <td>{enquiry.status}</td>
                      <td>{enquiry.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default Dashboard;
