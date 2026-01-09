
export type TransactionType = 'income' | 'expense' | 'savings' | 'investment' | 'lend';
export type AccountType = 'Cash' | 'Bank' | 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Credit Card' | 'Loan' | 'Lend';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  account: AccountType;
  date: string;
  time: string;
  note: string;
  timestamp: number;
  userId: string; // Internal unique ID of the user
}

export interface UserProfile {
  id: string; // Internal UUID
  loginId: string; // User's chosen ID/Username
  name: string; // Display name
  password: string; // User's password
  mobile: string; // Mobile number
  currency: string;
  theme: 'light' | 'dark';
  dashboardTheme?: string; // New: Selected background scene for dashboard
  accountNumbers: Partial<Record<AccountType, string>>;
  createdAt: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  savings?: number;
  investment?: number;
  lend?: number;
  [key: string]: string | number | undefined;
}
