import { apiServerGetPublic } from '@/lib/api-server';
import { notFound } from 'next/navigation';
import FileDownloadClient from './file-download-client';

export default async function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let fileInfo: any;
  try {
    fileInfo = await apiServerGetPublic(`/files/${id}`);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <FileDownloadClient fileInfo={fileInfo} />
    </div>
  );
}