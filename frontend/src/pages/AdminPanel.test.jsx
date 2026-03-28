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
    { id: 10, username: 'alice', serviceType: 'REPAIR', deviceDescription: 'Broken laptop', status: 'Pending', createdAt: '2024-01-10T00:00:00Z' },
    { id: 11, username: 'bob', serviceType: 'BUY', deviceDescription: 'Gaming PC', status: 'In Progress', createdAt: '2024-01-11T00:00:00Z' },
  ],
  totalPages: 1,
};

const mockEnquiriesPage = {
  content: [
    { id: 20, username: 'alice', subject: 'Warranty question', message: 'Is there a warranty?', status: 'Open', createdAt: '2024-01-12T00:00:00Z' },
    { id: 21, username: 'bob', subject: 'Pricing inquiry', message: 'How much does it cost?', status: 'Resolved', createdAt: '2024-01-13T00:00:00Z' },
  ],
  totalPages: 1,
};

function setupAxiosMocks() {
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/api/admin/users')) return Promise.resolve({ data: mockUsersPage });
    if (url.startsWith('/api/admin/orders')) return Promise.resolve({ data: mockOrdersPage });
    if (url.startsWith('/api/admin/enquiries')) return Promise.resolve({ data: mockEnquiriesPage });
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

    it('renders delete buttons for each user', async () => {
      renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete user alice/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete user bob/i })).toBeInTheDocument();
      });
    });

    it('calls DELETE endpoint and refreshes list on delete', async () => {
      axios.delete.mockResolvedValue({});
      renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete user alice/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /delete user alice/i }));

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith('/api/admin/users/1', expect.any(Object));
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
        expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
      });
    });
  });

  describe('Orders tab', () => {
    it('renders orders list with service type and status', async () => {
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^orders$/i }));

      await waitFor(() => {
        expect(screen.getByText('REPAIR')).toBeInTheDocument();
        expect(screen.getByText('BUY')).toBeInTheDocument();
        expect(screen.getByText('Broken laptop')).toBeInTheDocument();
        expect(screen.getByText('Gaming PC')).toBeInTheDocument();
      });
    });

    it('renders status update selects for each order', async () => {
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^orders$/i }));

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /update status for order 10/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /update status for order 11/i })).toBeInTheDocument();
      });
    });

    it('calls PATCH endpoint when order status is changed', async () => {
      axios.patch.mockResolvedValue({});
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^orders$/i }));

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /update status for order 10/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByRole('combobox', { name: /update status for order 10/i }), {
        target: { value: 'Completed' },
      });

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          '/api/admin/orders/10/status',
          { status: 'Completed' },
          expect.any(Object)
        );
      });
    });
  });

  describe('Enquiries tab', () => {
    it('renders enquiries list with subject and status', async () => {
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^enquiries$/i }));

      await waitFor(() => {
        expect(screen.getByText('Warranty question')).toBeInTheDocument();
        expect(screen.getByText('Pricing inquiry')).toBeInTheDocument();
        expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Resolved').length).toBeGreaterThan(0);
      });
    });

    it('renders status update selects for each enquiry', async () => {
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^enquiries$/i }));

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /update status for enquiry 20/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /update status for enquiry 21/i })).toBeInTheDocument();
      });
    });

    it('calls PATCH endpoint when enquiry status is changed', async () => {
      axios.patch.mockResolvedValue({});
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^enquiries$/i }));

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /update status for enquiry 20/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByRole('combobox', { name: /update status for enquiry 20/i }), {
        target: { value: 'Closed' },
      });

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          '/api/admin/enquiries/20/status',
          { status: 'Closed' },
          expect.any(Object)
        );
      });
    });
  });

  describe('Tab navigation', () => {
    it('shows Users section by default', async () => {
      renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^users$/i })).toBeInTheDocument();
      });
    });

    it('switches to Orders section on tab click', async () => {
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^orders$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^orders$/i })).toBeInTheDocument();
      });
    });

    it('switches to Enquiries section on tab click', async () => {
      renderAdminPanel();

      fireEvent.click(screen.getByRole('button', { name: /^enquiries$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^enquiries$/i })).toBeInTheDocument();
      });
    });
  });
});
