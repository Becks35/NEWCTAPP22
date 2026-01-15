
import React, { useState, useEffect } from 'react';
import { User, Payment, PaymentType, PaymentStatus, Notification } from '../../types';
import { storageService } from '../../services/storageService';
import { PAYMENT_TYPES } from '../../constants';

interface ClientViewProps {
  user: User;
}

const ClientView: React.FC<ClientViewProps> = ({ user }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<PaymentType>(PaymentType.CONTRIBUTION);
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const refreshData = () => {
    const allPayments = storageService.getPayments();
    const myPayments = allPayments.filter(p => p.clientId === user.id);
    setPayments(myPayments);

    const allNotifs = storageService.getNotifications();
    const myNotifs = allNotifs.filter(n => n.recipientId === user.id || n.recipientId === 'ALL');
    setNotifications(myNotifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const getTotals = () => {
    const totals: Record<string, number> = {};
    PAYMENT_TYPES.forEach(pt => {
      totals[pt] = payments
        .filter(p => p.type === pt && p.status === PaymentStatus.APPROVED)
        .reduce((sum, p) => sum + p.amount, 0);
    });
    const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);
    return { totals, grandTotal };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !file) return;

    setIsUploading(true);
    setUploadMessage({ text: '', type: '' });

    // Simulate file read/upload
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        clientId: user.id,
        clientName: user.name,
        amount: parseFloat(amount),
        type: type,
        date: new Date().toISOString(),
        receiptUrl: base64String,
        status: PaymentStatus.PENDING
      };

      const allPayments = storageService.getPayments();
      storageService.savePayments([...allPayments, newPayment]);

      setUploadMessage({ text: 'Payment receipt uploaded successfully! Waiting for approval.', type: 'success' });
      setAmount('');
      setFile(null);
      setIsUploading(false);
      refreshData();
    };
    reader.readAsDataURL(file);
  };

  const { totals, grandTotal } = getTotals();

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <section>
        <div className="flex justify-between items-end mb-4">
           <h2 className="text-2xl font-bold text-gray-800">My Dashboard</h2>
           <span className="text-sm text-gray-500">Jersey: <span className="font-bold text-indigo-600">{user.jerseyNumber}</span></span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-md lg:col-span-1">
            <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Grand Total</p>
            <h3 className="text-3xl font-extrabold mt-1">₦{grandTotal.toLocaleString()}</h3>
          </div>
          
          {PAYMENT_TYPES.map((pt) => (
            <div key={pt} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{pt}</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">₦{totals[pt].toLocaleString()}</h3>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload Receipt
            </h3>
            
            {uploadMessage.text && (
              <div className={`p-3 mb-4 rounded-md text-sm ${uploadMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {uploadMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-indigo-500 outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-indigo-500 outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value as PaymentType)}
                >
                  {PAYMENT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Image/PDF</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  required
                  onChange={handleFileUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Submit Payment'}
              </button>
            </form>
          </div>
        </div>

        {/* Notifications & History */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Recent Notifications</h3>
              <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1 rounded-full">{notifications.length}</span>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-gray-500 text-center italic">No notifications yet.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <p className="text-gray-800 text-sm leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block uppercase tracking-tighter">
                      {new Date(n.date).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">Payment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs font-bold uppercase">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-center">Receipt</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No payment history found.</td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id} className="text-sm hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(p.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">{p.type}</td>
                        <td className="px-6 py-4 font-bold">₦{p.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">View</a>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            p.status === PaymentStatus.APPROVED ? 'bg-green-100 text-green-700' : 
                            p.status === PaymentStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ClientView;
