import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import Dashboard from './Dashboard';
import AuthContext from '../context/AuthContext';

vi.mock('axios');

const mockToken = 'test-token';
const mockCurrentUser = { id: 1, username: 'testuser', role: 'USER' };

const mockOrders = [
  {
    id: 1,
    serviceType: 'REPAIR',
    deviceDescription: 'Laptop with broken screen',
    status: 'Pending',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    serviceType: 'BUY',
    deviceDescription: 'Gaming PC',
    status: 'In Progress',
    createdAt: '2024-01-16T11:00:00Z',
  },
];

const mockEnquiries = [
  {
    id: 1,
    subject: 'Warranty question',
    message: 'Does the repair come with a warranty?',
    status: 'Open',
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 2,
    subject: 'Pricing inquiry',
    message: 'How much does an upgrade cost?',
    status: 'In Progress',
    createdAt: '2024-01-17T12:00:00Z',
  },
];

function renderDashboard(authOverrides = {}) {
  const authValue = {
    token: mockToken,
    currentUser: mockCurrentUser,
    logout: vi.fn(),
    login: vi.fn(),
    ...authOverrides,
  };

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <Dashboard />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays orders with correct fields', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/orders') return Promise.resolve({ data: mockOrders });
      if (url === '/api/enquiries') return Promise.resolve({ data: mockEnquiries });
      return Promise.reject(new Error('Unknown URL'));
    });

    renderDashboard();

    await waitFor(() => {
      // Order IDs (both orders and enquiries have IDs 1 and 2)
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });

    // Service types
    expect(screen.getByText('REPAIR')).toBeInTheDocument();
    expect(screen.getByText('BUY')).toBeInTheDocument();

    // Device descriptions
    expect(screen.getByText('Laptop with broken screen')).toBeInTheDocument();
    expect(screen.getByText('Gaming PC')).toBeInTheDocument();

    // Statuses
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);

    // Timestamps
    expect(screen.getByText('2024-01-15T10:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('2024-01-16T11:00:00Z')).toBeInTheDocument();
  });

  it('fetches and displays enquiries with correct fields', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/orders') return Promise.resolve({ data: mockOrders });
      if (url === '/api/enquiries') return Promise.resolve({ data: mockEnquiries });
      return Promise.reject(new Error('Unknown URL'));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Warranty question')).toBeInTheDocument();
    });

    // Subjects
    expect(screen.getByText('Pricing inquiry')).toBeInTheDocument();

    // Messages
    expect(screen.getByText('Does the repair come with a warranty?')).toBeInTheDocument();
    expect(screen.getByText('How much does an upgrade cost?')).toBeInTheDocument();

    // Statuses
    expect(screen.getByText('Open')).toBeInTheDocument();

    // Timestamps
    expect(screen.getByText('2024-01-15T09:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('2024-01-17T12:00:00Z')).toBeInTheDocument();
  });

  it('shows empty state when no orders or enquiries', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/orders') return Promise.resolve({ data: [] });
      if (url === '/api/enquiries') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('Unknown URL'));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No orders yet.')).toBeInTheDocument();
      expect(screen.getByText('No enquiries yet.')).toBeInTheDocument();
    });
  });

  it('calls logout and redirects to /login on 401 response', async () => {
    const logoutMock = vi.fn();
    const error = { response: { status: 401 } };
    axios.get.mockRejectedValue(error);

    renderDashboard({ logout: logoutMock });

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
    });
  });

  it('renders orders and enquiries section headings', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/orders') return Promise.resolve({ data: [] });
      if (url === '/api/enquiries') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('Unknown URL'));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my orders/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /my enquiries/i })).toBeInTheDocument();
    });
  });

  it('renders logout button', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/orders') return Promise.resolve({ data: [] });
      if (url === '/api/enquiries') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('Unknown URL'));
    });

    renderDashboard();

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});
