import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const [fields, setFields] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!fields.username.trim()) errs.username = 'Username is required.';
    if (!fields.password) errs.password = 'Password is required.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { data } = await axios.post('/api/auth/login', fields);
      const user = login(data.token);
      // Redirect admin to admin panel, users to dashboard
      if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setServerError('Invalid username or password.');
      } else {
        setServerError('Login failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Theme toggle */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggle}
            className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🔧</div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={fields.username}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
                placeholder="Enter your username"
              />
              {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={fields.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
                placeholder="Enter your password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            {serverError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Register
            </Link>
          </p>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
            <Link to="/" className="text-slate-400 dark:text-slate-500 hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
