'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { fileService } from '@/services/file.service';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function UploaderDashboard() {
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState({ used: 0, limit: 0, percentage: 0 });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'downloads'>('date');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) { router.push('/login'); return; }
    if (currentUser.userType === 'DOWNLOADER') { router.push('/downloader'); return; }
    if (currentUser.userType === 'ADMIN') { router.push('/admin'); return; }
    setUser(currentUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filesData, storageData, profileData] = await Promise.all([
        fileService.getFiles(),
        api.get('/users/storage').then((r: any) => r.data),
        api.get('/users/profile').then((r: any) => r.data),
      ]);
      setFiles(filesData);
      setStorageInfo(storageData);
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (fileId: string) => {
    const url = `${window.location.origin}/file/${fileId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(fileId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (fileId: string) => {
    try {
      await fileService.deleteFile(fileId);
      setSelected((prev) => { const s = new Set(prev); s.delete(fileId); return s; });
      loadData();
    } catch (err) {
      console.error('Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selected) {
      try { await fileService.deleteFile(id); } catch (e) { /* skip */ }
    }
    setSelected(new Set());
    loadData();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === sortedFiles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedFiles.map((f) => f.id)));
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const filteredFiles = files.filter((f) =>
    f.fileName.toLowerCase().includes(search.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'name') return a.fileName.localeCompare(b.fileName);
    if (sortBy === 'downloads') return b.downloadCount - a.downloadCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalDownloads = files.reduce((sum: number, f: any) => sum + f.downloadCount, 0);
  const expiringSoon = files.filter((f: any) =>
    f.expiryDate && !f.isPermanent &&
    new Date(f.expiryDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
    new Date(f.expiryDate) > new Date()
  );

  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0) return 'Expired';
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Tomorrow';
    return date.toLocaleDateString();
  };

  const getExt = (name: string) => {
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(i + 1).toUpperCase() : '?';
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Uploader Panel</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <Button variant="link" asChild><Link href="/upload">Upload</Link></Button>
            <Button variant="link" asChild><Link href="/pricing">Pricing</Link></Button>
            <Button variant="link" className="text-red-600" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{files.length}</p>
            <p className="text-sm text-gray-500">Total Files</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{formatSize(storageInfo.used)}</p>
            <p className="text-sm text-gray-500">Storage Used</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{totalDownloads}</p>
            <p className="text-sm text-gray-500">Total Downloads</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{expiringSoon.length}</p>
            <p className="text-sm text-gray-500">Expiring Soon</p>
          </CardContent></Card>
        </div>

        {/* Storage Bar */}
        <Card className="mb-8">
          <CardHeader><CardTitle>Storage Usage</CardTitle></CardHeader>
          <CardContent>
            <Progress value={Math.min(storageInfo.percentage, 100)} className="w-full" />
            <p className="mt-2 text-sm text-gray-600">
              {formatSize(storageInfo.used)} / {formatSize(Number(storageInfo.limit))}
              <span className="ml-2 text-xs text-gray-400">({storageInfo.percentage}% used)</span>
              {profile?.planType === 'FREE' && (
                <span className="ml-3 text-xs text-blue-600">
                  <Link href="/pricing" className="hover:underline">Upgrade for more space</Link>
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>My Files ({sortedFiles.length})</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search files..."
                  className="max-w-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="border rounded-md px-2 py-1.5 text-sm bg-white"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="date">Newest</option>
                  <option value="name">Name</option>
                  <option value="downloads">Downloads</option>
                </select>
                <Button asChild><Link href="/upload">+ Upload</Link></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sortedFiles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {search ? 'No files match your search.' : 'No files yet. Upload your first file!'}
              </p>
            ) : (
              <>
                {selected.size > 0 && (
                  <div className="mb-4 flex items-center gap-2 text-sm">
                    <span className="text-gray-600">{selected.size} selected</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Delete Selected</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {selected.size} files?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBulkDelete}>Delete All</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-3 pr-2 w-8">
                          <input
                            type="checkbox"
                            className="accent-blue-600"
                            checked={selected.size === sortedFiles.length && sortedFiles.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="pb-3 pr-4 font-medium">Name</th>
                        <th className="pb-3 pr-4 font-medium">Size</th>
                        <th className="pb-3 pr-4 font-medium">Downloads</th>
                        <th className="pb-3 pr-4 font-medium">Expires</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFiles.map((file: any) => (
                        <tr key={file.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 pr-2">
                            <input
                              type="checkbox"
                              className="accent-blue-600"
                              checked={selected.has(file.id)}
                              onChange={() => toggleSelect(file.id)}
                            />
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-600">
                                {getExt(file.fileName)}
                              </span>
                              <span className="truncate max-w-[200px]">{file.fileName}</span>
                              {file.isPermanent && (
                                <span className="text-xs text-green-600 bg-green-50 rounded px-1.5 py-0.5">Permanent</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-gray-600">{formatSize(file.size)}</td>
                          <td className="py-3 pr-4 text-gray-600">{file.downloadCount}</td>
                          <td className="py-3 pr-4">
                            {file.isPermanent ? (
                              <span className="text-green-600">Never</span>
                            ) : file.expiryDate ? (
                              <span className={new Date(file.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-600'}>
                                {formatDate(file.expiryDate)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleCopyLink(file.id)}
                              >
                                {copiedId === file.id ? 'Copied!' : 'Copy Link'}
                              </Button>
                              <Button variant="link" size="sm" asChild>
                                <Link href={`/file/${file.id}`}>Share</Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="link" size="sm" className="text-red-600">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete File</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {file.fileName}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(file.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
