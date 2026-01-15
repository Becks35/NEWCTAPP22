
import React, { useState, useEffect } from 'react';
import { User, Payment, PaymentType, PaymentStatus, Notification, PAYMENT_TYPES } from '../../../types';
import { api } from '../../apiService';
import { CountdownTimer } from './CountdownTimer';

interface ClientDashboardProps {
  user: User;
  isManagerPreview?: boolean;
  onBackToManager?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  user, 
  isManagerPreview = false, 
  onBackToManager 
}) => {
  const [data, setData] = useState<{ payments: Payment[], notifications: Notification[], settings?: any }>({ payments: [], notifications: [] });
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<PaymentType>(PaymentType.CONTRIBUTION);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<PaymentStatus | 'ALL'>('ALL');

  const loadData = async () => {
    const res = await api.getClientDashboard(user.id);
    setData(res);
  };

  useEffect(() => { loadData(); }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isManagerPreview) return;
    if (!amount || !file) return;
    setLoading(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      await api.submitPayment({
        clientId: user.id,
        clientName: user.name,
        amount: parseFloat(amount),
        type,
        receiptUrl: reader.result as string
      });
      setAmount('');
      setFile(null);
      setLoading(false);
      loadData();
    };
    reader.readAsDataURL(file);
  };

  const totals = PAYMENT_TYPES.reduce((acc, pt) => {
    acc[pt] = data.payments
      .filter(p => p.type === pt && p.status === PaymentStatus.APPROVED)
      .reduce((sum, p) => sum + p.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  const filteredHistory = data.payments
    .filter(p => historyFilter === 'ALL' || p.status === historyFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const remindersEnabled = data.settings?.automatedRemindersEnabled ?? true;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {isManagerPreview && (
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r-xl flex justify-between items-center shadow-sm sticky top-20 z-40">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <div>
              <p className="text-amber-800 font-bold text-sm uppercase tracking-tight">Manager Preview Mode</p>
              <p className="text-amber-700 text-xs">Viewing dashboard for <span className="font-bold">{user.name}</span>. Actions are restricted.</p>
            </div>
          </div>
          <button 
            onClick={onBackToManager}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
          >
            Return to Admin
          </button>
        </div>
      )}

      {remindersEnabled && <CountdownTimer />}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Hello, {user.name}</h1>
          <p className="text-slate-500">Member ID: <span className="font-mono font-bold text-indigo-600">{user.jerseyNumber}</span></p>
        </div>
        <div className="bg-indigo-50 px-6 py-4 rounded-2xl text-left md:text-right w-full md:w-auto">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Approved Grand Total</p>
          <p className="text-3xl font-black text-indigo-700">₦{grandTotal.toLocaleString()}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PAYMENT_TYPES.map(pt => (
          <div key={pt} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{pt}</p>
            <p className="text-xl font-bold text-slate-700">₦{totals[pt].toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4">
          <div className={`bg-white p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-24 ${isManagerPreview ? 'opacity-75' : ''}`}>
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </span>
              New Contribution
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Amount (₦)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  disabled={isManagerPreview}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold disabled:cursor-not-allowed" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Type</label>
                <select 
                  disabled={isManagerPreview}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium disabled:cursor-not-allowed" 
                  value={type} 
                  onChange={e => setType(e.target.value as PaymentType)}
                >
                  {PAYMENT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Receipt File</label>
                <input 
                  type="file" 
                  required 
                  disabled={isManagerPreview}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 font-bold disabled:opacity-50" 
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                />
              </div>
              <button 
                disabled={loading || isManagerPreview} 
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-xl ${
                  isManagerPreview 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-800 text-white hover:bg-slate-900'
                }`}
              >
                {isManagerPreview ? 'Disabled in Preview' : loading ? 'Processing...' : 'Upload Receipt'}
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-8">
          {/* Notifications Panel */}
          <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <h3 className="font-bold mb-4 flex items-center relative z-10 text-lg">
              <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Team Notifications
            </h3>
            <div className="space-y-3 relative z-10 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {data.notifications.length === 0 ? (
                <p className="text-indigo-300 text-sm italic py-4">No notifications available.</p>
              ) : (
                data.notifications.map(n => (
                  <div key={n.id} className="bg-white bg-opacity-10 p-4 rounded-2xl border border-white border-opacity-10 backdrop-blur-sm">
                    <p className="text-sm font-medium">{n.message}</p>
                    <p className="text-[10px] text-indigo-300 mt-2 uppercase font-black tracking-widest">{new Date(n.date).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Submission Ledger</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Full history of your payment requests</p>
                </div>
                
                <div className="flex bg-slate-50 p-1 rounded-xl">
                  {['ALL', PaymentStatus.PENDING, PaymentStatus.APPROVED, PaymentStatus.REJECTED].map((status) => (
                    <button
                      key={status}
                      onClick={() => setHistoryFilter(status as any)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                        historyFilter === status 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <tr>
                     <th className="px-8 py-4">Date & Time</th>
                     <th className="px-8 py-4">Category</th>
                     <th className="px-8 py-4">Amount</th>
                     <th className="px-8 py-4">Status</th>
                     <th className="px-8 py-4 text-right">Receipt</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {filteredHistory.length === 0 ? (
                     <tr>
                       <td colSpan={5} className="py-24 text-center">
                         <div className="flex flex-col items-center">
                           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                           </div>
                           <p className="text-slate-400 font-bold text-sm">No payment records found.</p>
                         </div>
                       </td>
                     </tr>
                   ) : (
                     filteredHistory.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                         <td className="px-8 py-5">
                            <p className="font-bold text-slate-700 text-sm">{new Date(p.date).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-tight">{p.type}</span>
                         </td>
                         <td className="px-8 py-5">
                            <p className="text-sm font-black text-slate-800">₦{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                         </td>
                         <td className="px-8 py-5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              p.status === PaymentStatus.APPROVED ? 'bg-green-100 text-green-700' : 
                              p.status === PaymentStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {p.status}
                            </span>
                         </td>
                         <td className="px-8 py-5 text-right">
                            <a 
                              href={p.receiptUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 text-[10px] font-black uppercase rounded-lg transition-all"
                            >
                              View
                            </a>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};
