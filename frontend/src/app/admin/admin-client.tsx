'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import api from '@/services/api';
import { paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useKeyShortcuts } from '@/hooks/useKeyShortcuts';
import type { FileData, AdminStats, AdminUser, PaymentData } from '@/types/files';

type Tab = 'overview' | 'users' | 'files' | 'payments' | 'activity';

interface AdminClientProps {
  initialStats: AdminStats | null;
  initialUsers: AdminUser[];
  initialFiles: FileData[];
  initialPayments: PaymentData[];
}

export default function AdminClient({ initialStats, initialUsers, initialFiles, initialPayments }: AdminClientProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(initialStats);
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [payments, setPayments] = useState<PaymentData[]>(initialPayments);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState<'email' | 'type' | 'storage' | 'date'>('date');
  const [fileSearch, setFileSearch] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const fileSearchRef = useRef<HTMLInputElement>(null);

  useKeyShortcuts({
    'ctrl+f': () => {
      if (tab === 'users') searchRef.current?.focus();
      else if (tab === 'files') fileSearchRef.current?.focus();
    },
    Escape: () => { setUserSearch(''); setFileSearch(''); },
  });

  const loadAll = async () => {
    try {
      const [statsData, usersData, filesData, paymentsData] = await Promise.all([
        api.get('/admin/stats').then((r: { data: AdminStats }) => r.data),
        api.get('/admin/users').then((r: { data: AdminUser[] }) => r.data),
        api.get('/admin/files').then((r: { data: FileData[] }) => r.data),
        paymentService.getPendingPayments() as Promise<PaymentData[]>,
      ]);
      setStats(statsData);
      setUsers(usersData);
      setFiles(filesData);
      setPayments(paymentsData);
    } catch { toast.error('Failed to load admin data'); }
  };

  const handleUpdateUser = async (id: string, data: Record<string, unknown>) => {
    try { await api.put(`/admin/users/${id}`, data); loadAll(); toast.success('User updated'); }
    catch { toast.error('Failed to update user'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!deleteUserId) return;
    try { await api.delete(`/admin/users/${id}`); loadAll(); toast.success('User deleted'); setDeleteUserId(null); }
    catch { toast.error('Failed to delete user'); }
  };

  const handleConfirmPayment = async (paymentId: string, status: 'approved' | 'rejected') => {
    try { await paymentService.confirmPayment(paymentId, status); loadAll(); toast.success(`Payment ${status}`); }
    catch { toast.error('Failed to update payment'); }
  };

  const handleDeleteFile = async (fileId: string) => {
    try { await api.delete(`/files/${fileId}`); loadAll(); toast.success('File deleted'); setDeleteFileId(null); }
    catch { toast.error('Failed to delete file'); }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const storageBreakdown = useMemo(() => {
    return [...users]
      .filter((u: AdminUser) => u.userType !== 'ADMIN')
      .sort((a: AdminUser, b: AdminUser) => Number(b.storageUsed) - Number(a.storageUsed))
      .slice(0, 10);
  }, [users]);

  const recentFiles = useMemo(() => {
    return [...files]
      .sort((a: FileData, b: FileData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [files]);

  const filteredUsers = useMemo(() => {
    let result = users.filter((u: AdminUser) => u.email.toLowerCase().includes(userSearch.toLowerCase()));
    result.sort((a: AdminUser, b: AdminUser) => {
      if (userSort === 'email') return a.email.localeCompare(b.email);
      if (userSort === 'type') return a.userType.localeCompare(b.userType);
      if (userSort === 'storage') return Number(b.storageUsed) - Number(a.storageUsed);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [users, userSearch, userSort]);

  const filteredFiles = files.filter((f: FileData) => f.fileName.toLowerCase().includes(fileSearch.toLowerCase()));

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users', count: users.length },
    { key: 'files', label: 'Files', count: files.length },
    { key: 'payments', label: 'Payments', count: payments.length },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold">Admin Panel</h1>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="link" className="text-red-600" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t flex flex-col gap-2">
              <Button variant="link" className="text-red-600 justify-start px-0" onClick={handleLogout}>Logout</Button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <Button key={t.key} variant={tab === t.key ? 'default' : 'outline'} onClick={() => setTab(t.key)}>
              {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
            </Button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="scale-in"><CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-2xl md:text-3xl font-bold">{stats.totalFiles}</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Total Files</p>
              </CardContent></Card>
              <Card className="scale-in" style={{ animationDelay: '0.05s' }}><CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-2xl md:text-3xl font-bold">{formatSize(stats.totalStorage)}</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Total Storage</p>
              </CardContent></Card>
              <Card className="scale-in" style={{ animationDelay: '0.1s' }}><CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-2xl md:text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Total Users</p>
                <p className="text-xs text-gray-400">{stats.uploaders} uploaders / {stats.downloaders} downloaders</p>
              </CardContent></Card>
              <Card className="scale-in" style={{ animationDelay: '0.15s' }}><CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-2xl md:text-3xl font-bold">{stats.pendingPayments}</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Pending Payments</p>
              </CardContent></Card>
            </div>

            <Card className="fade-slide-in">
              <CardHeader><CardTitle>Top Users by Storage</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {storageBreakdown.map((u: AdminUser, i: number) => {
                    const maxStorage = Number(storageBreakdown[0]?.storageUsed || 1);
                    const pct = (Number(u.storageUsed) / maxStorage) * 100;
                    return (
                      <div key={u.id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                        <span className="text-sm w-40 truncate">{u.email}</span>
                        <Badge variant="outline" className="w-20 justify-center text-xs">{u.userType}</Badge>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-24 text-right">{formatSize(Number(u.storageUsed))}</span>
                      </div>
                    );
                  })}
                  {storageBreakdown.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No users with storage data.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Users ({users.length})</CardTitle>
                <div className="flex gap-2">
                  <Input ref={searchRef} placeholder="Search by email..." className="max-w-xs" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                  <select className="border rounded-md px-2 py-1.5 text-sm bg-white" value={userSort} onChange={(e) => setUserSort(e.target.value as 'email' | 'type' | 'storage' | 'date')}>
                    <option value="date">Newest</option>
                    <option value="email">Email</option>
                    <option value="type">Type</option>
                    <option value="storage">Storage</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Email</th>
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Plan</th>
                      <th className="pb-3 pr-4 font-medium">Storage</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium">Created</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u: AdminUser, i: number) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 row-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="py-3 pr-4 max-w-[200px] truncate">{u.email}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={u.userType === 'ADMIN' ? 'default' : u.userType === 'UPLOADER' ? 'secondary' : 'outline'}>
                            {u.userType}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">{u.planType}</td>
                        <td className="py-3 pr-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{
                                width: `${Number(u.storageLimit) > 0 ? Math.min(100, (Number(u.storageUsed) / Number(u.storageLimit)) * 100) : 0}%`
                              }} />
                            </div>
                            <span className="text-gray-500">{formatSize(Number(u.storageUsed))}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 text-xs ${u.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            {u.userType !== 'ADMIN' && (
                              <AlertDialog open={deleteUserId === u.id} onOpenChange={(open) => { if (!open) setDeleteUserId(null); }}>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" onClick={() => setDeleteUserId(u.id)}>Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete {u.email} and all their files.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'files' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Files ({files.length})</CardTitle>
                <Input ref={fileSearchRef} placeholder="Search files..." className="max-w-xs" value={fileSearch} onChange={(e) => setFileSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium">Uploader</th>
                      <th className="pb-3 pr-4 font-medium">Size</th>
                      <th className="pb-3 pr-4 font-medium">Downloads</th>
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Uploaded</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((f: FileData, i: number) => (
                      <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50 row-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="py-3 pr-4 max-w-[200px] truncate">{f.fileName}</td>
                        <td className="py-3 pr-4 text-gray-600">{f.user?.email || 'Unknown'}</td>
                        <td className="py-3 pr-4 text-gray-600">{formatSize(f.size)}</td>
                        <td className="py-3 pr-4 text-gray-600">{f.downloadCount}</td>
                        <td className="py-3 pr-4">
                          {f.isPermanent
                            ? <Badge variant="default" className="text-xs">Permanent</Badge>
                            : <Badge variant="outline" className="text-xs">Temp</Badge>
                          }
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{new Date(f.createdAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <AlertDialog open={deleteFileId === f.id} onOpenChange={(open) => { if (!open) setDeleteFileId(null); }}>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" onClick={() => setDeleteFileId(f.id)}>Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete File</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete &ldquo;{f.fileName}&rdquo;? This will also remove it from storage.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteFile(f.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'payments' && (
          <Card>
            <CardHeader><CardTitle>Pending Payments ({payments.length})</CardTitle></CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending payments</p>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment: PaymentData) => (
                    <Card key={payment.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{payment.user?.email || 'Unknown'}</p>
                            <div className="mt-1 text-sm text-gray-500 space-y-0.5">
                              <p>Plan: {payment.plan}</p>
                              <p>Amount: ${(payment.amount / 100).toFixed(2)}</p>
                              <p>Ref: {payment.stripeSubscriptionId}</p>
                              <p className="text-xs text-gray-400">{new Date(payment.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="space-x-2">
                            <Button onClick={() => handleConfirmPayment(payment.id, 'approved')} variant="default" size="sm">Approve</Button>
                            <Button onClick={() => handleConfirmPayment(payment.id, 'rejected')} variant="destructive" size="sm">Reject</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'activity' && (
          <Card>
            <CardHeader><CardTitle>Recent Uploads</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Time</th>
                      <th className="pb-3 pr-4 font-medium">File</th>
                      <th className="pb-3 pr-4 font-medium">Uploader</th>
                      <th className="pb-3 pr-4 font-medium">Size</th>
                      <th className="pb-3 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFiles.map((f: FileData, i: number) => (
                      <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50 row-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                          <span title={new Date(f.createdAt).toLocaleString()}>
                            {new Date(f.createdAt).toLocaleDateString()} {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 pr-4 max-w-[200px] truncate">{f.fileName}</td>
                        <td className="py-3 pr-4 text-gray-600">{f.user?.email || 'Unknown'}</td>
                        <td className="py-3 pr-4 text-gray-600">{formatSize(f.size)}</td>
                        <td className="py-3">
                          {f.isPermanent
                            ? <Badge variant="default" className="text-xs">Permanent</Badge>
                            : <Badge variant="outline" className="text-xs">Temporary</Badge>
                          }
                        </td>
                      </tr>
                    ))}
                    {recentFiles.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-500">No files uploaded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}