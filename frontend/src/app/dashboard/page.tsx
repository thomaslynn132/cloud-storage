'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { fileService } from '@/services/file.service';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Dashboard() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState({ used: 0, limit: 0, percentage: 0 });
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

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
    try {
      await fileService.deleteFile(fileId);
      loadData();
      setDeleteFileId(null);
    } catch (err) {
      console.error('Failed to delete file');
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
            <Button variant="link" asChild>
              <Link href="/upload">Upload</Link>
            </Button>
            <Button variant="link" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="link" className="text-red-600" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(storageInfo.percentage, 100)} className="w-full" />
            <p className="mt-2 text-sm text-gray-600">
              {(storageInfo.used / (1024 * 1024 * 1024)).toFixed(2)} GB / {(storageInfo.limit / (1024 * 1024 * 1024)).toFixed(0)} GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your Files</CardTitle>
              <Button asChild>
                <Link href="/upload">Upload New File</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                      <Button variant="link" asChild>
                        <Link href={`/file/${file.id}`}>Share</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="link" className="text-red-600">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this file? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(file.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
