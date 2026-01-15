
export enum UserRole {
  MANAGER = 'MANAGER',
  CLIENT = 'CLIENT'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PaymentType {
  CONTRIBUTION = 'Contribution',
  SAVING = 'Saving',
  DIAMOND_SAVING = 'Diamond Saving'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  jerseyNumber?: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  isFirstLogin: boolean;
  registrationDate: string;
  lastLogin?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  type: PaymentType;
  date: string;
  receiptUrl: string;
  status: PaymentStatus;
}

export interface Notification {
  id: string;
  recipientId: string | 'ALL';
  message: string;
  date: string;
}

export const PAYMENT_TYPES = Object.values(PaymentType);
