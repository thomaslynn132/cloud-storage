import { apiServerGet } from '@/lib/api-server';
import AdminClient from './admin-client';
import type { FileData, AdminStats, AdminUser, PaymentData } from '@/types/files';

export default async function AdminPage() {
  let stats: AdminStats | null = null;
  let users: AdminUser[] = [];
  let files: FileData[] = [];
  let payments: PaymentData[] = [];

  try {
    const [statsData, usersData, filesData] = await Promise.all([
      apiServerGet('/admin/stats') as Promise<AdminStats>,
      apiServerGet('/admin/users') as Promise<AdminUser[]>,
      apiServerGet('/admin/files') as Promise<FileData[]>,
    ]);
    stats = statsData;
    users = usersData;
    files = filesData;
    // Try to fetch payments — endpoint may not exist for server-side
    try {
      payments = await apiServerGet('/admin/payments') as PaymentData[];
    } catch {
      payments = [];
    }
  } catch {
    // fallback — client will re-fetch
  }

  return <AdminClient initialStats={stats} initialUsers={users} initialFiles={files} initialPayments={payments} />;
}