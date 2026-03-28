import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      login(data.token);
      navigate('/dashboard');
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
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={fields.username}
            onChange={handleChange}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
          {errors.username && (
            <span id="username-error" role="alert">
              {errors.username}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={fields.password}
            onChange={handleChange}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <span id="password-error" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        {serverError && <p role="alert">{serverError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}

export default LoginForm;
