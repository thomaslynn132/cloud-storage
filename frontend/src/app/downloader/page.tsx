import { apiServerGet } from '@/lib/api-server';
import DownloaderClient from './downloader-client';
import type { FileData } from '@/types/files';

export default async function DownloaderPage() {
  let files: FileData[] = [];
  let downloads: any[] = [];

  try {
    const [filesData, downloadsData] = await Promise.all([
      apiServerGet('/files/browse') as Promise<FileData[]>,
      apiServerGet('/users/downloads') as Promise<any[]>,
    ]);
    files = filesData;
    downloads = downloadsData;
  } catch {
    // fallback — client will re-fetch on mount
  }

  return <DownloaderClient initialFiles={files} initialDownloads={downloads} />;
}