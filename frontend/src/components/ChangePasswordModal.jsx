import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

function ChangePasswordModal({ onClose }) {
  const { token } = useAuth();
  const [fields, setFields] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!fields.currentPassword) errs.currentPassword = 'Current password is required.';
    if (!fields.newPassword) {
      errs.newPassword = 'New password is required.';
    } else if (!PASSWORD_REGEX.test(fields.newPassword)) {
      errs.newPassword = 'Min 8 chars with uppercase, lowercase, digit, and special character.';
    }
    if (!fields.confirmPassword) {
      errs.confirmPassword = 'Please confirm your new password.';
    } else if (fields.newPassword !== fields.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
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
      await axios.post(
        '/api/auth/change-password',
        { currentPassword: fields.currentPassword, newPassword: fields.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401) {
        setServerError('Current password is incorrect.');
      } else if (status === 400 && message) {
        setServerError(message);
      } else {
        setServerError('Failed to change password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
        {success ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Password Changed</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Your password has been updated successfully.</p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Change Password 🔑</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className={labelClass}>Current Password</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={fields.currentPassword}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter current password"
                />
                {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>}
              </div>

              <div>
                <label htmlFor="newPassword" className={labelClass}>New Password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={fields.newPassword}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter new password"
                />
                {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelClass}>Confirm New Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={fields.confirmPassword}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Repeat new password"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              {serverError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  {submitting ? 'Saving…' : 'Save Password'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ChangePasswordModal;
