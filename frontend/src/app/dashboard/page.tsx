import { apiServerGet } from '@/lib/api-server';
import DashboardClient from './dashboard-client';
import type { FileData, StorageInfo, UserProfile } from '@/types/files';

export default async function DashboardPage() {
  let files: FileData[] = [];
  let storage: StorageInfo = { used: 0, limit: 0, percentage: 0 };
  let profile: UserProfile | null = null;

  try {
    const [filesData, storageData, profileData] = await Promise.all([
      apiServerGet('/files') as Promise<FileData[]>,
      apiServerGet('/users/storage') as Promise<StorageInfo>,
      apiServerGet('/users/profile') as Promise<UserProfile>,
    ]);
    files = filesData;
    storage = storageData;
    profile = profileData;
  } catch {
    // Fallback — client will show data on re-fetch
  }

  return <DashboardClient initialFiles={files} initialStorage={storage} initialProfile={profile} />;
}