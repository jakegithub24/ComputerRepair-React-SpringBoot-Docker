import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SERVICE_TYPES = ['BUY', 'SELL', 'UPGRADE', 'REPAIR'];

function OrderForm({ onSuccess }) {
  const { token } = useAuth();
  const [fields, setFields] = useState({ serviceType: 'BUY', deviceDescription: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!fields.serviceType) errs.serviceType = 'Service type is required.';
    if (!fields.deviceDescription.trim()) errs.deviceDescription = 'Device description is required.';
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
      await axios.post('/api/orders', fields, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err.response?.data?.message;
      if (err.response?.status === 400 && message) {
        setServerError(message);
      } else {
        setServerError('Failed to submit order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="serviceType">Service Type</label>
        <select
          id="serviceType"
          name="serviceType"
          value={fields.serviceType}
          onChange={handleChange}
          aria-describedby={errors.serviceType ? 'serviceType-error' : undefined}
        >
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.serviceType && (
          <span id="serviceType-error" role="alert">
            {errors.serviceType}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="deviceDescription">Device Description</label>
        <input
          id="deviceDescription"
          name="deviceDescription"
          type="text"
          value={fields.deviceDescription}
          onChange={handleChange}
          aria-describedby={errors.deviceDescription ? 'deviceDescription-error' : undefined}
        />
        {errors.deviceDescription && (
          <span id="deviceDescription-error" role="alert">
            {errors.deviceDescription}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          name="notes"
          value={fields.notes}
          onChange={handleChange}
        />
      </div>

      {serverError && <p role="alert">{serverError}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Order'}
      </button>
    </form>
  );
}

export default OrderForm;
