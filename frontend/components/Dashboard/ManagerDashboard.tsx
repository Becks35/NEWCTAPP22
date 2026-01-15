
import React, { useState, useEffect } from 'react';
import { User, Payment, PaymentStatus, UserStatus, PAYMENT_TYPES, UserRole } from '../../../types';
import { api } from '../../apiService';

interface ManagerDashboardProps {
  onImpersonateClient?: (client: User) => void;
}

const ApprovalForm: React.FC<{ user: User, onProcessed: () => void }> = ({ user, onProcessed }) => {
  const [jersey, setJersey] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!jersey || !pass) return alert('Please enter both a Jersey Number and Password');
    setLoading(true);
    await api.approveClient(user.id, jersey, pass);
    setLoading(false);
    onProcessed();
  };

  const handleReject = async () => {
    if (!window.confirm(`Are you sure you want to reject and delete ${user.name}'s registration?`)) return;
    setLoading(true);
    await api.rejectClient(user.id);
    setLoading(false);
    onProcessed();
  };

  return (
    <div className="p-6 rounded-2xl border-2 border-slate-50 hover:border-indigo-100 transition-all bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-lg font-bold text-slate-800 leading-none mb-1">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md uppercase">Pending</span>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assign Jersey #</label>
            <input 
              type="text" 
              placeholder="e.g. TEAM-01" 
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg outline-none uppercase font-bold focus:ring-2 focus:ring-indigo-500 transition-all" 
              value={jersey}
              onChange={e => setJersey(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assign Temp Password</label>
            <input 
              type="text" 
              placeholder="e.g. Pass123" 
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all" 
              value={pass}
              onChange={e => setPass(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          disabled={loading}
          className="flex-grow bg-indigo-600 text-white text-xs font-black py-3 rounded-xl hover:bg-indigo-700 shadow-lg disabled:opacity-50 transition-all active:scale-95"
          onClick={handleApprove}
        >
          {loading ? 'Processing...' : 'Approve Access'}
        </button>
        <button 
          disabled={loading}
          className="px-4 bg-white text-red-500 border border-red-100 text-xs font-bold py-3 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
          onClick={handleReject}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onImpersonateClient }) => {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'approvals' | 'payments' | 'ledger' | 'team' | 'messaging' | 'settings'>('approvals');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'ALL'>(PaymentStatus.PENDING);
  const [msgForm, setMsgForm] = useState({ msg: '', target: 'ALL' });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => setData(await api.getManagerDashboard());
  useEffect(() => { load(); }, []);

  const handleToggleReminders = async () => {
    setIsUpdatingSettings(true);
    const newSettings = { ...data.settings, automatedRemindersEnabled: !data.settings.automatedRemindersEnabled };
    await api.updateSettings(newSettings);
    await load();
    setIsUpdatingSettings(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this client from the database?')) return;
    await api.deleteUser(userId);
    await load();
  };

  const handleResetUserPass = async (userId: string) => {
    const newPass = prompt('Enter a new temporary password for this user:');
    if (newPass) {
      await api.adminResetPassword(userId, newPass);
      alert('Password reset. User must change it upon next login.');
      await load();
    }
  };

  if (!data) return <div className="p-10 text-center text-slate-400 font-bold">Loading secure data...</div>;

  const totals = PAYMENT_TYPES.reduce((acc, pt) => {
    acc[pt] = data.allPayments.filter((p: Payment) => p.type === pt && p.status === 'APPROVED').reduce((s: number, p: Payment) => s + p.amount, 0);
    return acc;
  }, {} as any);

  const filteredPayments = data.allPayments.filter((p: Payment) => 
    paymentFilter === 'ALL' ? true : p.status === paymentFilter
  ).sort((a: Payment, b: Payment) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredUsers = data.allUsers.filter((u: User) => {
    const s = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(s) || (u.jerseyNumber && u.jerseyNumber.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Global Organization Liquidity</p>
          <h1 className="text-5xl font-black mb-6">₦{Object.values(totals).reduce((a: any, b: any) => a + b, 0).toLocaleString()}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PAYMENT_TYPES.map(pt => (
              <div key={pt} className="bg-white bg-opacity-5 p-4 rounded-2xl border border-white border-opacity-10">
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">{pt}</p>
                <p className="text-xl font-bold">₦{totals[pt].toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </section>

      <nav className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {['approvals', 'payments', 'ledger', 'team', 'messaging', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            {t}
            {t === 'approvals' && data.pendingUsers.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[8px]">{data.pendingUsers.length}</span>}
            {t === 'payments' && data.pendingPayments.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-indigo-500 text-white rounded-full text-[8px]">{data.pendingPayments.length}</span>}
          </button>
        ))}
      </nav>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
        {tab === 'approvals' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800">Registration Requests</h2>
            {data.pendingUsers.length === 0 ? (
              <div className="py-20 text-center text-slate-400 italic">All pending requests have been processed.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {data.pendingUsers.map((u: User) => (
                  <ApprovalForm key={u.id} user={u} onProcessed={load} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-800">Payment Management</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {[
                  { label: 'Pending', value: PaymentStatus.PENDING, color: 'text-yellow-600' },
                  { label: 'Approved', value: PaymentStatus.APPROVED, color: 'text-green-600' },
                  { label: 'Rejected', value: PaymentStatus.REJECTED, color: 'text-red-600' },
                  { label: 'All', value: 'ALL', color: 'text-slate-600' }
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setPaymentFilter(f.value as any)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      paymentFilter === f.value 
                        ? 'bg-white shadow-sm ' + f.color
                        : 'text-slate-400 hover:text-slate-500'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="pb-4 px-4">Client</th>
                    <th className="pb-4 px-4">Amount</th>
                    <th className="pb-4 px-4">Type</th>
                    <th className="pb-4 px-4 text-center">Receipt</th>
                    <th className="pb-4 px-4 text-center">Status</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 italic">
                        No payments found matching the selected status.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p: Payment) => (
                      <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-700">{p.clientName}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(p.date).toLocaleDateString()}</p>
                        </td>
                        <td className="py-4 px-4 font-black text-indigo-600">₦{p.amount.toFixed(2)}</td>
                        <td className="py-4 px-4 text-xs font-bold text-slate-500">{p.type}</td>
                        <td className="py-4 px-4 text-center">
                          <a href={p.receiptUrl} target="_blank" className="text-indigo-400 hover:text-indigo-600 font-bold text-xs underline">View</a>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${
                            p.status === PaymentStatus.APPROVED ? 'bg-green-100 text-green-700' : 
                            p.status === PaymentStatus.REJECTED ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-1">
                          {p.status === PaymentStatus.PENDING ? (
                            <>
                              <button className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-lg hover:bg-green-100 transition-colors" onClick={async () => { await api.processPayment(p.id, PaymentStatus.APPROVED); load(); }}>Approve</button>
                              <button className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-lg hover:bg-red-100 transition-colors" onClick={async () => { await api.processPayment(p.id, PaymentStatus.REJECTED); load(); }}>Reject</button>
                            </>
                          ) : (
                            <button className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase rounded-lg hover:bg-slate-100 transition-colors" onClick={async () => { await api.processPayment(p.id, PaymentStatus.PENDING); load(); }}>Reset</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'ledger' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-black text-slate-800">Master Ledger</h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Active Team Members: {data.activeClients.length}</p>
             </div>
             <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                      <tr>
                        <th className="p-4">Identity</th>
                        {PAYMENT_TYPES.map(pt => <th key={pt} className="p-4">{pt}</th>)}
                        <th className="p-4">Balance</th>
                        <th className="p-4 text-right">Preview</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y">
                      {data.activeClients.map((c: User) => {
                        const cp = data.allPayments.filter((p: Payment) => p.clientId === c.id && p.status === 'APPROVED');
                        let total = 0;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4"><p className="font-bold text-slate-700">{c.name}</p><p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">{c.jerseyNumber}</p></td>
                            {PAYMENT_TYPES.map(pt => {
                              const s = cp.filter((p: Payment) => p.type === pt).reduce((a: number, b: Payment) => a + b.amount, 0);
                              total += s;
                              return <td key={pt} className="p-4 text-slate-500 font-medium">₦{s.toLocaleString()}</td>;
                            })}
                            <td className="p-4 font-black text-indigo-700">₦{total.toLocaleString()}</td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => onImpersonateClient?.(c)}
                                className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                              >
                                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {tab === 'team' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-800">Team Management</h2>
              <div className="relative w-full md:w-64">
                <input 
                  type="text" 
                  placeholder="Search name or ID..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-700 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                  <tr>
                    <th className="p-4">Name & Email</th>
                    <th className="p-4">ID / Jersey</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 italic">No team members found matching your search.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u: User) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4">
                          <p className="font-bold text-slate-700">{u.name} {u.role === UserRole.MANAGER && <span className="ml-1 text-[8px] bg-black text-white px-1 py-0.5 rounded">ADMIN</span>}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </td>
                        <td className="p-4 text-xs font-black text-indigo-600">{u.jerseyNumber || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            u.status === UserStatus.APPROVED ? 'bg-green-100 text-green-700' : 
                            u.status === UserStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4 text-[10px] text-slate-400 font-bold">{new Date(u.registrationDate).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-1">
                          {u.role !== UserRole.MANAGER && (
                            <>
                              <button 
                                onClick={() => handleResetUserPass(u.id)}
                                className="px-2 py-1 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded hover:bg-indigo-600 hover:text-white transition-all"
                              >
                                Reset Pass
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-2 py-1 bg-red-50 text-red-600 text-[8px] font-black uppercase rounded hover:bg-red-600 hover:text-white transition-all"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'messaging' && (
          <div className="max-w-xl mx-auto space-y-6 py-10">
            <h2 className="text-2xl font-black text-slate-800 text-center">Dispatch Communication</h2>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
               <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Recipient Group</label>
                    <select className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-indigo-500" value={msgForm.target} onChange={e => setMsgForm({...msgForm, target: e.target.value})}>
                       <option value="ALL">Broadast to All Members</option>
                       {data.activeClients.map((c: User) => <option key={c.id} value={c.id}>{c.name} ({c.jerseyNumber})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Message Content</label>
                    <textarea rows={4} className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium" placeholder="Alert team members about deadlines or updates..." value={msgForm.msg} onChange={e => setMsgForm({...msgForm, msg: e.target.value})} />
                  </div>
                  <button className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-900 shadow-xl transition-all" onClick={async () => { await api.broadcast(msgForm.target, msgForm.msg); setMsgForm({...msgForm, msg: ''}); alert('Dispatched!'); load(); }}>Send Team Notification</button>
               </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-8 py-10">
            <div>
              <h2 className="text-2xl font-black text-slate-800">System Settings</h2>
              <p className="text-sm text-slate-500">Configure global behaviors for all team members.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
              <div className="pr-4">
                <p className="font-bold text-slate-800">Automated Payment Reminders</p>
                <p className="text-xs text-slate-500 mt-1">When enabled, clients see a countdown from the 13th of the previous month to the 12th of the current month.</p>
              </div>
              <button 
                onClick={handleToggleReminders}
                disabled={isUpdatingSettings}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  data.settings.automatedRemindersEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    data.settings.automatedRemindersEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
               <div className="flex items-start">
                  <div className="bg-indigo-200 p-2 rounded-lg mr-4">
                    <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-800 uppercase tracking-tight">Technical Note</p>
                    <p className="text-xs text-indigo-700 mt-1">The countdown logic is locked to the 12th of every month as the primary contribution deadline.</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
