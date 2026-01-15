
import { mockServer } from '../backend/mockServer';
import { User, Payment, PaymentStatus } from '../types';

export const api = {
  login: mockServer.login,
  register: mockServer.register,
  updatePassword: mockServer.updatePassword,
  submitPayment: mockServer.submitPayment,
  
  // Data fetchers
  getClientDashboard: async (clientId: string) => {
    const data = await mockServer.getAllData();
    return {
      payments: data.payments.filter(p => p.clientId === clientId),
      notifications: data.notifications.filter(n => n.recipientId === clientId || n.recipientId === 'ALL'),
      settings: data.settings
    };
  },

  getManagerDashboard: async () => {
    const data = await mockServer.getAllData();
    return {
      pendingUsers: data.users.filter(u => u.status === 'PENDING'),
      allUsers: data.users,
      activeClients: data.users.filter(u => u.status === 'APPROVED' && u.role === 'CLIENT'),
      pendingPayments: data.payments.filter(p => p.status === 'PENDING'),
      allPayments: data.payments,
      settings: data.settings
    };
  },

  approveClient: mockServer.approveUser,
  rejectClient: mockServer.rejectUser,
  deleteUser: mockServer.deleteUser,
  adminResetPassword: mockServer.resetUserPassword,
  processPayment: mockServer.updatePaymentStatus,
  broadcast: mockServer.sendNotification,
  updateSettings: mockServer.updateSettings
};
