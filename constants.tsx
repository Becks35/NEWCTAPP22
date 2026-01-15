
import { PaymentType, UserRole, UserStatus } from './types';

export const PAYMENT_TYPES = [
  PaymentType.CONTRIBUTION,
  PaymentType.SAVING,
  PaymentType.DIAMOND_SAVING
];

export const INITIAL_MANAGER = {
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
