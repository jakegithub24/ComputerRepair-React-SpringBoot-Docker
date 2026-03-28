import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ username, email, password }) {
  const errors = {};
  if (!username.trim()) errors.username = 'Username is required.';
  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  } else if (!PASSWORD_REGEX.test(password)) {
    errors.password = 'Min 8 chars with uppercase, lowercase, digit, and special character.';
  }
  return errors;
}

function RegisterForm() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [fields, setFields] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await axios.post('/api/auth/register', fields);
      navigate('/login');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 409) {
        setErrors({ username: 'Username already taken.' });
      } else if (status === 400 && message) {
        setServerError(message);
      } else {
        setServerError('Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
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
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Create Account</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Join TechFix today</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
              <input id="username" name="username" type="text" value={fields.username} onChange={handleChange} className={inputClass} placeholder="Choose a username" />
              {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input id="email" name="email" type="email" value={fields.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input id="password" name="password" type="password" value={fields.password} onChange={handleChange} className={inputClass} placeholder="Create a strong password" />
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
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Login</Link>
          </p>
          <p className="text-center text-sm mt-2">
            <Link to="/" className="text-slate-400 dark:text-slate-500 hover:underline">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
