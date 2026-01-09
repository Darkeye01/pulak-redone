
import { UserProfile } from './types';

export const EXPENSE_CATEGORIES = [
  { name: 'Food', color: '#f87171' },
  { name: 'Transport', color: '#60a5fa' },
  { name: 'Rent', color: '#fbbf24' },
  { name: 'Shopping', color: '#c084fc' },
  { name: 'Education', color: '#2dd4bf' },
  { name: 'Health', color: '#f472b6' },
  { name: 'Entertainment', color: '#818cf8' },
  { name: 'Others', color: '#94a3b8' },
];

export const INCOME_CATEGORIES = [
  { name: 'Salary', color: '#4ade80' },
  { name: 'Freelance', color: '#22c55e' },
  { name: 'Investment Returns', color: '#16a34a' },
  { name: 'Bonus', color: '#15803d' },
  { name: 'Others', color: '#166534' },
];

export const SAVINGS_CATEGORIES = [
  { name: 'Emergency Fund', color: '#ec4899' },
  { name: 'Travel Fund', color: '#d946ef' },
  { name: 'Specific Goal', color: '#a855f7' },
  { name: 'Retirement', color: '#8b5cf6' },
];

export const INVESTMENT_CATEGORIES = [
  { name: 'Stocks', color: '#f59e0b' },
  { name: 'Crypto', color: '#fbbf24' },
  { name: 'Mutual Funds', color: '#d97706' },
  { name: 'Real Estate', color: '#b45309' },
];

export const LEND_CATEGORIES = [
  { name: 'Family', color: '#06b6d4' },
  { name: 'Friends', color: '#0891b2' },
  { name: 'Business', color: '#0e7490' },
  { name: 'Others', color: '#155e75' },
];

export const ACCOUNTS = [
  { name: 'Cash', color: '#475569' },
  { name: 'Bank', color: '#2563eb' },
  { name: 'bKash', color: '#e2136e' },
  { name: 'Nagad', color: '#f57c00' },
  { name: 'Rocket', color: '#8e24aa' },
  { name: 'Upay', color: '#ffcc00' },
  { name: 'Credit Card', color: '#1e293b' },
  { name: 'Loan', color: '#9d174d' },
  { name: 'Lend', color: '#06b6d4' },
] as const;

export const DASHBOARD_THEMES = [
  { id: 'default', name: 'Minimal', class: 'bg-slate-50 dark:bg-slate-900', secondary: 'bg-white dark:bg-slate-800' },
  { id: 'cosmic', name: 'Cosmic', class: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900', secondary: 'bg-white/10 backdrop-blur-xl border-white/20 text-white' },
  { id: 'sunset', name: 'Sunset', class: 'bg-gradient-to-br from-orange-500 via-rose-500 to-indigo-700', secondary: 'bg-white/20 backdrop-blur-xl border-white/30 text-white' },
  { id: 'emerald', name: 'Emerald', class: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-slate-900', secondary: 'bg-white/10 backdrop-blur-xl border-white/20 text-white' },
  { id: 'midnight', name: 'Midnight', class: 'bg-gradient-to-br from-slate-900 to-black', secondary: 'bg-slate-800/40 backdrop-blur-xl border-slate-700/50 text-white' },
];

export const CURRENCY_SYMBOL = '৳';

export const DEFAULT_USER: UserProfile = {
  id: '',
  loginId: '',
  name: 'Guest',
  password: '',
  mobile: '',
  currency: 'BDT',
  theme: 'light',
  dashboardTheme: 'default',
  accountNumbers: {},
  createdAt: 0,
};
