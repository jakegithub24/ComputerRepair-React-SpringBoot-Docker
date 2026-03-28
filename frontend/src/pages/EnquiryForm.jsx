import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await axios.post('/api/enquiries', fields, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err.response?.data?.message;
      if (err.response?.status === 400 && message) {
        setServerError(message);
      } else {
        setServerError('Failed to submit enquiry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={fields.subject}
          onChange={handleChange}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
        />
        {errors.subject && (
          <span id="subject-error" role="alert">
            {errors.subject}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={fields.message}
          onChange={handleChange}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <span id="message-error" role="alert">
            {errors.message}
          </span>
        )}
      </div>

      {serverError && <p role="alert">{serverError}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Enquiry'}
      </button>
    </form>
  );
}

export default EnquiryForm;
