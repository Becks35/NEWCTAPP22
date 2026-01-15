
import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../frontend/apiService';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.login(jerseyNumber, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-2xl border border-slate-100">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">Sign In</h2>
        <p className="text-slate-400 text-sm font-medium">Enter your credentials to access your dashboard.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-bold border border-rose-100 animate-pulse">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Member ID / Jersey #</label>
          <input
            type="text"
            required
            autoFocus
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 transition-all uppercase font-bold text-slate-700 placeholder:text-slate-300"
            placeholder="E.G. TEAM-01"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
          <input
            type="password"
            required
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold text-slate-700 placeholder:text-slate-300"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? 'Authenticating...' : 'Secure Login'}
        </button>
      </form>

      <div className="mt-10 text-center border-t border-slate-50 pt-8">
        <p className="text-sm text-slate-500 font-medium">
          New to the team?{' '}
          <button
            onClick={onNavigateToRegister}
            className="text-indigo-600 font-black hover:text-indigo-700 transition-colors"
          >
            Request Access
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
