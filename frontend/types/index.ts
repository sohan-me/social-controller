export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  date_joined: string;
  full_name?: string;
  phone_number?: string;
  address?: string;
  profile_image?: string | null;
  profile_image_url?: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  role: 'admin' | 'user';
  username: string;
  id: number;
}

export type Platform = 'gmail' | 'whatsapp' | 'imo' | 'instagram';

export interface SubmissionPlatformStatus {
  id: number;
  platform: Platform;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AccountSubmission {
  id: number;
  phone_number: number;
  phone_number_display: string;
  platform: Platform;
  submitted_by?: number | null;
  submitted_by_username?: string | null;
  username_or_email: string;
  password?: string;
  screenshot: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  reviewed_by_username: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface PhoneNumber {
  id: number;
  number: string;
  url?: string | null;
  assigned_to?: number | null;
  assigned_to_username?: string | null;
  status?: 'available' | 'assigned' | 'used';
  created_at: string;
}

/** User-facing list entry: number + url + approved submissions per number */
export interface PhoneNumberListEntry {
  id: number;
  number: string;
  url: string | null;
  submissions: SubmissionPlatformStatus[];
}

export interface PhoneNumberWithSubmissions extends PhoneNumber {
  submissions: AccountSubmission[];
}

export interface AnalyticsDashboard {
  users: { total: number; active: number };
  phone_numbers: { total: number; assigned: number; used: number; available: number };
  submissions: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    created_today: number;
    approval_rate: number;
  };
  by_platform: { platform: string; count: number }[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminContact {
  id: number;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: number;
  user: number;
  username: string;
  balance_BDT: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: number;
  user: number;
  user_username: string;
  amount_BDT: string;
  transaction_type: 'credit' | 'debit';
  note: string;
  created_by: number | null;
  created_by_username: string | null;
  created_at: string;
}

export interface MyWalletResponse {
  wallet: Wallet;
  transactions: PaymentTransaction[];
}

export interface Proxy {
  id: number;
  host: string;
  port: number;
  username: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: number;
  user: number;
  user_username?: string;
  amount_BDT: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  reviewed_by: number | null;
  reviewed_by_username: string | null;
  reviewed_at: string | null;
  created_at: string;
}
