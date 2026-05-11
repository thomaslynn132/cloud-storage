export interface FileData {
  id: string;
  fileName: string;
  size: number;
  downloadCount: number;
  createdAt: string;
  expiryDate: string | null;
  isPermanent: boolean;
  user?: { email: string; id: string };
  mimeType?: string;
}

export interface StorageInfo {
  used: number;
  limit: number;
  percentage: number;
}

export interface UserProfile {
  id: string;
  email: string;
  userType: 'ADMIN' | 'UPLOADER' | 'DOWNLOADER';
  planType: string;
  storageUsed: number;
  storageLimit: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalFiles: number;
  totalStorage: number;
  totalUsers: number;
  uploaders: number;
  downloaders: number;
  pendingPayments: number;
}

export interface PaymentData {
  id: string;
  amount: number;
  plan: string;
  stripeSubscriptionId: string;
  createdAt: string;
  user?: { email: string };
  status?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  userType: 'ADMIN' | 'UPLOADER' | 'DOWNLOADER';
  planType: string;
  storageUsed: number;
  storageLimit: number;
  isActive: boolean;
  createdAt: string;
}
