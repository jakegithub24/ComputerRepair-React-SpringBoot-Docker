import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ChangePasswordModal from './ChangePasswordModal';
import axios from 'axios';

// Map routes to human-readable breadcrumb labels
const ROUTE_LABELS = {
  '/':          'Home',
  '/dashboard': 'Dashboard',
  '/admin':     'Admin Panel',
  '/chat':      'Chat',
  '/login':     'Login',
  '/register':  'Register',
};

function Navbar() {
  const { currentUser, logout, token } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread count every 15s when logged in
  useEffect(() => {
    if (!currentUser || !token) { setUnreadCount(0); return; }
    const fetchUnread = async () => {
      try {
        const endpoint = currentUser.role === 'ADMIN' ? '/api/chat/admin/sessions' : '/api/chat/sessions';
        const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        const field = currentUser.role === 'ADMIN' ? 'unreadAdmin' : 'unreadUser';
        const total = res.data.reduce((sum, s) => sum + (s[field] || 0), 0);
        setUnreadCount(total);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [currentUser, token]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function handleBack() {
    navigate(-1);
  }

  // Build breadcrumb: Home > Current Page
  const currentLabel = ROUTE_LABELS[location.pathname] ?? 'Page';
  const isHome = location.pathname === '/';

  // Nav links based on auth state
  const navLinks = currentUser
    ? currentUser.role === 'ADMIN'
      ? [
          { to: '/admin', label: '🛠️ Admin' },
        ]
      : [
          { to: '/dashboard', label: '📊 Dashboard' },
          { to: '/chat',      label: '💬 Chat', unread: unreadCount },
        ]
    : [
        { to: '/login',    label: 'Login' },
        { to: '/register', label: 'Register' },
      ];

  return (
    <>
      <nav className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          {/* Main bar */}
          <div className="flex items-center justify-between h-14">

            {/* Left: back button + logo */}
            <div className="flex items-center gap-2">
              {!isHome && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Go back"
                  title="Go back"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <Link to="/" className="flex items-center gap-2 group">
                <span className="text-xl">🔧</span>
                <span className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  TechFix
                </span>
              </Link>
            </div>

            {/* Center: desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                  {link.unread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                      {link.unread > 99 ? '99+' : link.unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Right: user info + actions */}
            <div className="flex items-center gap-2">
              {/* User badge */}
              {currentUser && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-xs text-slate-500 dark:text-slate-400">👤</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{currentUser.username}</span>
                  {currentUser.role === 'ADMIN' && (
                    <span className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded font-semibold">
                      ADMIN
                    </span>
                  )}
                </div>
              )}

              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={toggle}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {dark ? '☀️' : '🌙'}
              </button>

              {/* Auth actions */}
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowChangePwd(true)}
                    className="hidden sm:block px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    🔑 Password
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Breadcrumb bar */}
          {!isHome && (
            <div className="flex items-center gap-1.5 pb-2 text-xs text-slate-400 dark:text-slate-500">
              <Link to="/" className="hover:text-blue-500 transition-colors">Home</Link>
              <span>›</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">{currentLabel}</span>
            </div>
          )}
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
            {currentUser && (
              <div className="flex items-center gap-2 px-2 py-2 mb-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">👤 {currentUser.username}</span>
                {currentUser.role === 'ADMIN' && (
                  <span className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded font-semibold">ADMIN</span>
                )}
              </div>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{link.label}</span>
                {link.unread > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {link.unread > 99 ? '99+' : link.unread}
                  </span>
                )}
              </Link>
            ))}
            {currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => { setShowChangePwd(true); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  🔑 Change Password
                </button>
                <button
                  type="button"
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
            {!currentUser && (
              <div className="flex gap-2 pt-1">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">Register</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </>
  );
}

export default Navbar;
