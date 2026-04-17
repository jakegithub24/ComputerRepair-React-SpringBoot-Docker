import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './Dashboard';
import { AuthContext } from '../context/AuthContext';

jest.mock('axios');
jest.mock('../hooks/useOrderUpdates', () => ({ useOrderUpdates: jest.fn() }));
jest.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifyOrderStatusUpdate: jest.fn(),
    notifyOrderCreated: jest.fn(),
  }),
}));

const mockOrders = [
  { id: 1, totalPrice: 299.99, status: 'Pending', shippingAddress: '1 Test St', createdAt: '2024-01-10T00:00:00Z' },
  { id: 2, totalPrice: 149.50, status: 'Dispatched', shippingAddress: '2 Test Ave', createdAt: '2024-01-11T00:00:00Z' },
];

function renderDashboard() {
  return render(
    <AuthContext.Provider value={{ token: 'test-token', currentUser: { username: 'testuser' }, logout: jest.fn() }}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockOrders });
  });

  afterEach(() => jest.clearAllMocks());

  it('fetches and displays orders', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
    });
  });

  it('displays order total price', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('£299.99')).toBeInTheDocument();
      expect(screen.getByText('£149.50')).toBeInTheDocument();
    });
  });

  it('displays order status badges', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Dispatched')).toBeInTheDocument();
    });
  });

  it('shows empty state when no orders', async () => {
    axios.get.mockResolvedValue({ data: [] });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/No orders yet/i)).toBeInTheDocument();
    });
  });

  it('renders My Orders section heading', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my orders/i })).toBeInTheDocument();
    });
  });

  it('renders welcome message with username', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, testuser/i)).toBeInTheDocument();
    });
  });
});
