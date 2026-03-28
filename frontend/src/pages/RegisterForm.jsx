import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

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
    errors.password =
      'Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character.';
  }
  return errors;
}

function RegisterForm() {
  const navigate = useNavigate();
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

  return (
    <main>
      <h1>Create an Account</h1>
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
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={fields.email}
            onChange={handleChange}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <span id="email-error" role="alert">
              {errors.email}
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
          {submitting ? 'Registering…' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}

export default RegisterForm;
