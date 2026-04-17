import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import AdminPanel from './AdminPanel';
import AuthContext from '../context/AuthContext';

vi.mock('axios');

const mockToken = 'admin-token';

const mockUsersPage = {
  content: [
    { id: 1, username: 'alice', email: 'alice@example.com', role: 'USER', createdAt: '2024-01-01T00:00:00Z' },
    { id: 2, username: 'bob', email: 'bob@example.com', role: 'USER', createdAt: '2024-01-02T00:00:00Z' },
  ],
  totalPages: 2,
};

const mockOrdersPage = {
  content: [
    { id: 10, username: 'alice', totalPrice: 299.99, shippingAddress: '1 Test St', status: 'Pending', createdAt: '2024-01-10T00:00:00Z' },
    { id: 11, username: 'bob', totalPrice: 149.50, shippingAddress: '2 Test Ave', status: 'Dispatched', createdAt: '2024-01-11T00:00:00Z' },
  ],
  totalPages: 1,
};

function setupAxiosMocks() {
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/api/admin/users')) return Promise.resolve({ data: mockUsersPage });
    if (url.startsWith('/api/admin/orders')) return Promise.resolve({ data: mockOrdersPage });
    return Promise.reject(new Error('Unknown URL'));
  });
}

function renderAdminPanel(authOverrides = {}) {
  const authValue = {
    token: mockToken,
    currentUser: { id: 0, username: 'admin', role: 'ADMIN' },
    logout: vi.fn(),
    login: vi.fn(),
    ...authOverrides,
  };

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <AdminPanel />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAxiosMocks();
  });

  describe('Users tab', () => {
    it('renders user list with username and email', async () => {
      renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
        expect(screen.getByText('bob')).toBeInTheDocument();
        expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      });
    });

    it('shows pagination controls', async () => {
      renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('disables Prev button on first page', async () => {
      renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /← prev/i })).toBeDisabled();
      });
    });
  });

  describe('Orders tab', () => {
    it('renders orders list with username and total price', async () => {
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^📦 orders$/i }));

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
        expect(screen.getByText('bob')).toBeInTheDocument();
        expect(screen.getByText('£299.99')).toBeInTheDocument();
        expect(screen.getByText('£149.50')).toBeInTheDocument();
      });
    });

    it('renders status update selects for each order', async () => {
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^📦 orders$/i }));

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /update status for order 10/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /update status for order 11/i })).toBeInTheDocument();
      });
    });

    it('calls PATCH endpoint when order status is changed', async () => {
      axios.patch.mockResolvedValue({});
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^📦 orders$/i }));

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /update status for order 10/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByRole('combobox', { name: /update status for order 10/i }), {
        target: { value: 'Delivered' },
      });

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          '/api/admin/orders/10/status',
          { status: 'Delivered' },
          expect.any(Object)
        );
      });
    });
  });

  describe('Tab navigation', () => {
    it('shows Users section by default', async () => {
      renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /active users/i })).toBeInTheDocument();
      });
    });

    it('switches to Orders section on tab click', async () => {
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^📦 orders$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /all orders/i })).toBeInTheDocument();
      });
    });
  });
});
