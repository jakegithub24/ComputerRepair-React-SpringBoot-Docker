import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

function EnquiryForm({ onSuccess }) {
  const { token } = useAuth();
  const [fields, setFields] = useState({ subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!fields.subject.trim()) errs.subject = 'Subject is required.';
    if (!fields.message.trim()) errs.message = 'Message is required.';
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
      await axios.post('/api/enquiries', fields, { headers: { Authorization: `Bearer ${token}` } });
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err.response?.data?.message;
      setServerError(message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="subject" className={labelClass}>Subject</label>
        <input id="subject" name="subject" type="text" value={fields.subject} onChange={handleChange} className={inputClass} placeholder="What's your enquiry about?" />
        {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>Message</label>
        <textarea id="message" name="message" value={fields.message} onChange={handleChange} rows={4} className={inputClass} placeholder="Describe your question or concern…" />
        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
      </div>

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
        </div>
      )}

      <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-sm transition-colors">
        {submitting ? 'Submitting…' : 'Submit Enquiry'}
      </button>
    </form>
  );
}

export default EnquiryForm;
