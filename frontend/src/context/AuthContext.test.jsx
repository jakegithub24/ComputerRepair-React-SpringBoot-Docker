import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// A minimal JWT with payload { sub: 'alice', userId: 42, role: 'USER' }
// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"sub":"alice","userId":42,"role":"USER","iat":1700000000,"exp":1700086400}
// Signature: fake (not verified client-side)
function buildFakeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.fakesignature`;
}

const USER_TOKEN = buildFakeJwt({ sub: 'alice', userId: 42, role: 'USER' });
const ADMIN_TOKEN = buildFakeJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });

// Helper component that exposes AuthContext values via data-testid attributes
function AuthConsumer() {
  const { token, currentUser, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? 'null'}</span>
      <span data-testid="username">{currentUser?.username ?? 'null'}</span>
      <span data-testid="role">{currentUser?.role ?? 'null'}</span>
      <span data-testid="id">{currentUser?.id ?? 'null'}</span>
      <button onClick={() => login(USER_TOKEN)}>login-user</button>
      <button onClick={() => login(ADMIN_TOKEN)}>login-admin</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  test('initial state: token and currentUser are null', () => {
    renderWithAuth();
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('username').textContent).toBe('null');
    expect(screen.getByTestId('role').textContent).toBe('null');
  });

  test('login sets token and decodes currentUser from JWT', () => {
    renderWithAuth();
    act(() => {
      screen.getByText('login-user').click();
    });
    expect(screen.getByTestId('token').textContent).toBe(USER_TOKEN);
    expect(screen.getByTestId('username').textContent).toBe('alice');
    expect(screen.getByTestId('role').textContent).toBe('USER');
    expect(screen.getByTestId('id').textContent).toBe('42');
  });

  test('login with admin token sets role to ADMIN', () => {
    renderWithAuth();
    act(() => {
      screen.getByText('login-admin').click();
    });
    expect(screen.getByTestId('username').textContent).toBe('admin');
    expect(screen.getByTestId('role').textContent).toBe('ADMIN');
  });

  test('logout clears token and currentUser', () => {
    renderWithAuth();
    act(() => {
      screen.getByText('login-user').click();
    });
    expect(screen.getByTestId('token').textContent).toBe(USER_TOKEN);

    act(() => {
      screen.getByText('logout').click();
    });
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('username').textContent).toBe('null');
    expect(screen.getByTestId('role').textContent).toBe('null');
  });

  test('login → authenticated → logout → unauthenticated transition', () => {
    renderWithAuth();

    // Initially unauthenticated
    expect(screen.getByTestId('token').textContent).toBe('null');

    // Login → authenticated
    act(() => {
      screen.getByText('login-user').click();
    });
    expect(screen.getByTestId('token').textContent).not.toBe('null');
    expect(screen.getByTestId('username').textContent).toBe('alice');

    // Logout → unauthenticated
    act(() => {
      screen.getByText('logout').click();
    });
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('username').textContent).toBe('null');
  });
});
