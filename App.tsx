
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChangePassword from './components/Auth/ChangePassword';
import { ClientDashboard } from './frontend/components/Dashboard/ClientDashboard';
import { ManagerDashboard } from './frontend/components/Dashboard/ManagerDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('hub_session');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('hub_session');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('hub_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    setImpersonatedUser(null);
    localStorage.removeItem('hub_session');
    setView('LOGIN');
  };

  const handleImpersonate = (client: User) => {
    setImpersonatedUser(client);
  };

  const handleStopImpersonating = () => {
    setImpersonatedUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // PUBLIC VIEWS (Landing Page / Sign In)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl mb-4">
            <span className="text-2xl font-black">CT</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">CONTRIBUTION TEAM</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium uppercase tracking-widest">Secure Management Portal</p>
        </div>

        <div className="mt-2">
          {view === 'LOGIN' ? (
            <Login onLoginSuccess={handleLogin} onNavigateToRegister={() => setView('REGISTER')} />
          ) : (
            <Register onRegisterSuccess={() => setView('LOGIN')} onNavigateToLogin={() => setView('LOGIN')} />
          )}
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-400 font-bold uppercase tracking-tighter">
          &copy; {new Date().getFullYear()} Contribution Team. All rights reserved.
        </p>
      </div>
    );
  }

  // PRIVATE VIEWS (Dashboard)
  const activeUser = impersonatedUser || user;

  return (
    <Layout user={user} onLogout={handleLogout}>
      {activeUser.isFirstLogin && activeUser.role === UserRole.CLIENT && !impersonatedUser ? (
        <ChangePassword user={activeUser} onSuccess={handleLogin} />
      ) : impersonatedUser ? (
        <ClientDashboard 
          user={impersonatedUser} 
          isManagerPreview={true} 
          onBackToManager={handleStopImpersonating} 
        />
      ) : user.role === UserRole.MANAGER ? (
        <ManagerDashboard onImpersonateClient={handleImpersonate} />
      ) : (
        <ClientDashboard user={user} />
      )}
    </Layout>
  );
};

export default App;
