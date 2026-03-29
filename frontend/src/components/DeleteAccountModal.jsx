import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function DeleteAccountModal({ onClose }) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await axios.delete('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      navigate('/');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Delete Account</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Your account will be deactivated. You won't be able to log in again with these credentials.
            Your orders and enquiries will remain on record.
          </p>
        </div>

        <label className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-red-600"
          />
          <span className="text-sm text-red-700 dark:text-red-300">
            I understand this action cannot be undone and my account will be permanently deactivated.
          </span>
        </label>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/40 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete My Account'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountModal;
