import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SERVICE_TYPES = ['BUY', 'SELL', 'UPGRADE', 'REPAIR'];

const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

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
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await axios.post('/api/orders', fields, { headers: { Authorization: `Bearer ${token}` } });
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err.response?.data?.message;
      setServerError(message || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="serviceType" className={labelClass}>Service Type</label>
        <select id="serviceType" name="serviceType" value={fields.serviceType} onChange={handleChange} className={inputClass}>
          {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.serviceType && <p className="mt-1 text-xs text-red-500">{errors.serviceType}</p>}
      </div>

      <div>
        <label htmlFor="deviceDescription" className={labelClass}>Device Description</label>
        <input id="deviceDescription" name="deviceDescription" type="text" value={fields.deviceDescription} onChange={handleChange} className={inputClass} placeholder="e.g. Dell XPS 15 with cracked screen" />
        {errors.deviceDescription && <p className="mt-1 text-xs text-red-500">{errors.deviceDescription}</p>}
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea id="notes" name="notes" value={fields.notes} onChange={handleChange} rows={3} className={inputClass} placeholder="Any additional details…" />
      </div>

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
        </div>
      )}

      <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition-colors">
        {submitting ? 'Submitting…' : 'Submit Order'}
      </button>
    </form>
  );
}

export default OrderForm;
