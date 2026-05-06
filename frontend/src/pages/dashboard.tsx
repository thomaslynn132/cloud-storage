import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { fileService } from '@/services/file.service';
import api from '@/services/api';

export default function Dashboard() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState({ used: 0, limit: 0, percentage: 0 });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filesData, storageData] = await Promise.all([
        fileService.getFiles(),
        api.get('/users/storage').then((r: any) => r.data),
      ]);
      setFiles(filesData);
      setStorageInfo(storageData);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      await fileService.deleteFile(fileId);
      loadData();
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">FileHost</h1>
          <div className="space-x-4">
            <Link href="/upload" className="text-blue-600 hover:underline">Upload</Link>
            <Link href="/pricing" className="text-blue-600 hover:underline">Pricing</Link>
            <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Storage Usage</h2>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {(storageInfo.used / (1024 * 1024 * 1024)).toFixed(2)} GB / {(storageInfo.limit / (1024 * 1024 * 1024)).toFixed(0)} GB
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Files</h2>
            <Link href="/upload" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Upload New File
            </Link>
          </div>

          {files.length === 0 ? (
            <p className="text-gray-500">No files yet. Upload your first file!</p>
          ) : (
            <div className="space-y-4">
              {files.map((file: any) => (
                <div key={file.id} className="border p-4 rounded flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{file.fileName}</h3>
                    <p className="text-sm text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.downloadCount} downloads
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Link href={`/file/${file.id}`} className="text-blue-600 hover:underline">
                      Share
                    </Link>
                    <button onClick={() => handleDelete(file.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
