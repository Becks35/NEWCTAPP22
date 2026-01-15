
import React, { useState, useEffect } from 'react';
import { User, Payment, PaymentType, PaymentStatus, UserStatus, Notification } from '../../types';
import { storageService } from '../../services/storageService';
import { PAYMENT_TYPES } from '../../constants';

interface ManagerViewProps {
  user: User;
}

const ManagerView: React.FC<ManagerViewProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'Registrations' | 'Payments' | 'Messaging'>('Registrations');
  
  // Registration Approval State
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [jerseyNumberInput, setJerseyNumberInput] = useState('');
  const [tempPassInput, setTempPassInput] = useState('');

  // Messaging State
  const [targetUserId, setTargetUserId] = useState<string | 'ALL'>('ALL');
  const [message, setMessage] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(storageService.getUsers());
    setPayments(storageService.getPayments());
  };

  const pendingUsers = users.filter(u => u.status === UserStatus.PENDING);
  const activeClients = users.filter(u => u.status === UserStatus.APPROVED && u.role === 'CLIENT');
  const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING);

  const getOverallStats = () => {
    const totals: Record<string, number> = {};
    PAYMENT_TYPES.forEach(pt => {
      totals[pt] = payments
        .filter(p => p.type === pt && p.status === PaymentStatus.APPROVED)
        .reduce((sum, p) => sum + p.amount, 0);
    });
    return totals;
  };

  const handleApproveUser = () => {
    if (!approvingUserId || !jerseyNumberInput || !tempPassInput) return;

    const updatedUsers = users.map(u => {
      if (u.id === approvingUserId) {
        return {
          ...u,
          status: UserStatus.APPROVED,
          jerseyNumber: jerseyNumberInput,
          password: tempPassInput
        };
      }
      return u;
    });

    storageService.saveUsers(updatedUsers);
    setApprovingUserId(null);
    setJerseyNumberInput('');
    setTempPassInput('');
    refreshData();
  };

  const handleUpdatePayment = (paymentId: string, status: PaymentStatus) => {
    const updatedPayments = payments.map(p => p.id === paymentId ? { ...p, status } : p);
    storageService.savePayments(updatedPayments);
    refreshData();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;

    // Fix: Removed 'read' property as it is not present in the Notification interface
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      recipientId: targetUserId,
      message: message,
      date: new Date().toISOString()
    };

    const allNotifs = storageService.getNotifications();
    storageService.saveNotifications([...allNotifs, newNotif]);
    setMessage('');
    alert('Message sent successfully!');
  };

  const stats = getOverallStats();
  const grandTotal = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      {/* Global Totals */}
      <section className="bg-indigo-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 opacity-20 rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-2">Total Contribution Ecosystem</h2>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <h3 className="text-5xl font-black">₦{grandTotal.toLocaleString()}</h3>
            <span className="text-indigo-300 text-lg mb-1">collected across all categories</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            {PAYMENT_TYPES.map(pt => (
              <div key={pt} className="bg-indigo-800 bg-opacity-40 p-4 rounded-xl border border-indigo-700">
                <p className="text-indigo-300 text-xs font-medium mb-1">{pt}</p>
                <p className="text-xl font-bold">₦{stats[pt].toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <div className="flex border-b border-gray-200">
        {['Registrations', 'Payments', 'Messaging'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-4 text-sm font-bold transition-all ${
              activeTab === tab 
                ? 'border-b-4 border-indigo-600 text-indigo-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
            {tab === 'Registrations' && pendingUsers.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
            )}
            {tab === 'Payments' && pendingPayments.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingPayments.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        {activeTab === 'Registrations' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Pending Approvals</h3>
            {pendingUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-12 italic border-2 border-dashed rounded-lg">No pending registration requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingUsers.map(u => (
                  <div key={u.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
                    <div className="mb-4">
                      <p className="font-bold text-gray-800 text-lg">{u.name}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Applied: {new Date(u.registrationDate).toLocaleDateString()}</p>
                    </div>

                    {approvingUserId === u.id ? (
                      <div className="space-y-3 bg-white p-4 rounded-lg shadow-inner">
                        <input
                          type="text"
                          placeholder="Jersey Number (e.g. JSY-001)"
                          className="w-full text-sm px-3 py-2 border rounded outline-none uppercase"
                          value={jerseyNumberInput}
                          onChange={(e) => setJerseyNumberInput(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Temp Password"
                          className="w-full text-sm px-3 py-2 border rounded outline-none"
                          value={tempPassInput}
                          onChange={(e) => setTempPassInput(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleApproveUser}
                            className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded hover:bg-green-700"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => setApprovingUserId(null)}
                            className="flex-1 bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setApprovingUserId(u.id)}
                          className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2 rounded hover:bg-indigo-700"
                        >
                          Approve Registration
                        </button>
                        <button
                          className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2 rounded border border-red-100 hover:bg-red-100"
                          onClick={() => {
                            storageService.saveUsers(users.filter(usr => usr.id !== u.id));
                            refreshData();
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Payments' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Payment Review Queue</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Receipt</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.filter(p => p.status === PaymentStatus.PENDING).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">No payments pending review.</td>
                    </tr>
                  ) : (
                    payments.filter(p => p.status === PaymentStatus.PENDING).map(p => (
                      <tr key={p.id} className="text-sm">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">{p.clientName}</p>
                          <p className="text-[10px] text-gray-400">{new Date(p.date).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{p.type}</td>
                        <td className="px-6 py-4 font-black text-indigo-700">₦{p.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">View File</a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdatePayment(p.id, PaymentStatus.APPROVED)}
                              className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-green-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdatePayment(p.id, PaymentStatus.REJECTED)}
                              className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-12">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Master Contribution Ledger</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Client</th>
                      {PAYMENT_TYPES.map(pt => <th key={pt} className="px-6 py-4">{pt}</th>)}
                      <th className="px-6 py-4">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeClients.map(c => {
                      const cPayments = payments.filter(p => p.clientId === c.id && p.status === PaymentStatus.APPROVED);
                      let rowTotal = 0;
                      return (
                        <tr key={c.id} className="text-sm hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-800">{c.name}</p>
                            <p className="text-[10px] text-indigo-600 font-bold">{c.jerseyNumber}</p>
                          </td>
                          {PAYMENT_TYPES.map(pt => {
                            const typeTotal = cPayments.filter(p => p.type === pt).reduce((s, p) => s + p.amount, 0);
                            rowTotal += typeTotal;
                            return (
                              <td key={pt} className="px-6 py-4 text-gray-600 font-medium">
                                ₦{typeTotal.toLocaleString()}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 font-black text-indigo-700">₦{rowTotal.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Messaging' && (
          <div className="max-w-2xl mx-auto py-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Send Team Updates</h3>
            <form onSubmit={handleSendMessage} className="space-y-6 bg-gray-50 p-8 rounded-2xl border border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient</label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value as any)}
                >
                  <option value="ALL">All Clients (Broadcast)</option>
                  {activeClients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.jerseyNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Type your notification message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                Dispatch Notification
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerView;
