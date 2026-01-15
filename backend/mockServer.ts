
import { User, Payment, Notification, UserRole, UserStatus, PaymentStatus } from '../types';

const STORAGE_KEYS = {
  USERS: 'hub_users',
  PAYMENTS: 'hub_payments',
  NOTIFICATIONS: 'hub_notifications',
  SETTINGS: 'hub_settings'
};

const INITIAL_MANAGER: User = {
  id: 'mgr-001',
  name: 'Admin Manager',
  email: 'admin@contributionteam.com',
  jerseyNumber: 'ADMIN',
  password: 'admin',
  role: UserRole.MANAGER,
  status: UserStatus.APPROVED,
  isFirstLogin: false,
  registrationDate: new Date().toISOString()
};

const DEFAULT_SETTINGS = {
  automatedRemindersEnabled: true
};

const db = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([INITIAL_MANAGER]));
      return [INITIAL_MANAGER];
    }
    return JSON.parse(data);
  },
  saveUsers: (users: User[]) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)),
  getPayments: (): Payment[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]'),
  savePayments: (payments: Payment[]) => localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments)),
  getNotifs: (): Notification[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]'),
  saveNotifs: (notifs: Notification[]) => localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs)),
  getSettings: () => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: any) => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
};

export const mockServer = {
  login: async (jersey: string, pass: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = db.getUsers();
        const user = users.find(u => u.jerseyNumber?.toUpperCase() === jersey.toUpperCase());
        if (!user) return reject('User not found.');
        if (user.password !== pass) return reject('Incorrect password.');
        if (user.status === UserStatus.PENDING) return reject('Account pending manager approval.');
        if (user.status === UserStatus.REJECTED) return reject('This account has been deactivated by an Admin.');
        
        // Update last login
        const updated = users.map(u => u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u);
        db.saveUsers(updated);
        
        resolve({ ...user, lastLogin: new Date().toISOString() });
      }, 600);
    });
  },

  register: async (name: string, email: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = db.getUsers();
        const newUser: User = {
          id: `u-${Date.now()}`,
          name, 
          email,
          role: UserRole.CLIENT,
          status: UserStatus.PENDING,
          isFirstLogin: true,
          registrationDate: new Date().toISOString()
        };
        db.saveUsers([...users, newUser]);
        resolve();
      }, 500);
    });
  },

  updatePassword: async (userId: string, newPass: string): Promise<User> => {
    return new Promise((resolve) => {
      const users = db.getUsers();
      const updated = users.map(u => u.id === userId ? { ...u, password: newPass, isFirstLogin: false } : u);
      db.saveUsers(updated);
      resolve(updated.find(u => u.id === userId)!);
    });
  },

  // Admin Privileges
  deleteUser: async (userId: string) => {
    const users = db.getUsers();
    db.saveUsers(users.filter(u => u.id !== userId));
    // Also cleanup payments
    const payments = db.getPayments();
    db.savePayments(payments.filter(p => p.clientId !== userId));
  },

  resetUserPassword: async (userId: string, newPass: string) => {
    const users = db.getUsers();
    db.saveUsers(users.map(u => u.id === userId ? { ...u, password: newPass, isFirstLogin: true } : u));
  },

  approveUser: async (userId: string, jersey: string, pass: string) => {
    const users = db.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, status: UserStatus.APPROVED, jerseyNumber: jersey, password: pass } : u);
    db.saveUsers(updated);
    await mockServer.sendNotification(userId, `Approved! ID: ${jersey}. Login and update password.`);
  },

  rejectUser: async (userId: string) => {
    const users = db.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, status: UserStatus.REJECTED } : u);
    db.saveUsers(updated);
  },

  submitPayment: async (payment: Omit<Payment, 'id' | 'status' | 'date'>) => {
    const payments = db.getPayments();
    const newPayment: Payment = {
      ...payment,
      id: `p-${Date.now()}`,
      status: PaymentStatus.PENDING,
      date: new Date().toISOString()
    };
    db.savePayments([...payments, newPayment]);
  },

  updatePaymentStatus: async (paymentId: string, status: PaymentStatus) => {
    const payments = db.getPayments();
    db.savePayments(payments.map(p => p.id === paymentId ? { ...p, status } : p));
  },

  sendNotification: async (recipientId: string, message: string) => {
    const notifs = db.getNotifs();
    const n: Notification = { id: `n-${Date.now()}`, recipientId, message, date: new Date().toISOString() };
    db.saveNotifs([...notifs, n]);
  },

  updateSettings: async (settings: any) => {
    db.saveSettings(settings);
  },

  getAllData: async () => ({
    users: db.getUsers(),
    payments: db.getPayments(),
    notifications: db.getNotifs(),
    settings: db.getSettings()
  })
};
