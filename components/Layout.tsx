
import React from 'react';
import { User } from '../types';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3 cursor-default select-none">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <span className="text-sm font-black">CT</span>
              </div>
              <div className="hidden xs:block">
                <span className="text-lg font-black text-slate-800 tracking-tight">CONTRIBUTION TEAM</span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-6">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-black text-slate-800 leading-none">{user.name}</p>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">
                    {user.jerseyNumber || user.role}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-slate-200 active:scale-95"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 text-center">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} CONTRIBUTION TEAM. Secure Payment Infrastructure.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
