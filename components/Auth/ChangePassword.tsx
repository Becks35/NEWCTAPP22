
import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../frontend/apiService';

interface ChangePasswordProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ user, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) return setError('Password too short.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const updated = await api.updatePassword(user.id, password);
      onSuccess(updated);
    } catch (err) {
      setError('Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md border-t-4 border-indigo-600">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Secure Your Account</h2>
      <p className="text-gray-600 mb-6 text-sm">Please update your temporary password to continue.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-600 text-xs font-bold">{error}</div>}
        
        <input
          type="password"
          placeholder="New Password"
          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Set New Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
