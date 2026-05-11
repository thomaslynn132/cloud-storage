'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileTypeIcon } from '@/components/file-type-icon';
import { useKeyShortcuts } from '@/hooks/useKeyShortcuts';
import type { FileData } from '@/types/files';

interface DownloaderClientProps {
  initialFiles: FileData[];
  initialDownloads: any[];
}

export default function DownloaderClient({ initialFiles, initialDownloads }: DownloaderClientProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [downloads, setDownloads] = useState(initialDownloads);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'browse' | 'history'>('browse');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date' | 'downloads'>('date');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  useKeyShortcuts({
    'ctrl+f': () => searchRef.current?.focus(),
    Escape: () => setSearch(''),
  });

  const getExt = (name: string) => {
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(i + 1).toLowerCase() : '';
  };

  const fileTypes = useMemo(() => {
    const types = new Set<string>();
    files.forEach((f: FileData) => {
      const ext = getExt(f.fileName);
      if (ext) types.add(ext);
    });
    return ['all', ...Array.from(types).sort()];
  }, [files]);

  const trending = useMemo(() => {
    return [...files].sort((a: FileData, b: FileData) => b.downloadCount - a.downloadCount).slice(0, 5);
  }, [files]);

  const filteredFiles = useMemo(() => {
    let result = files.filter((f: FileData) =>
      f.fileName.toLowerCase().includes(search.toLowerCase())
    );
    if (typeFilter !== 'all') {
      result = result.filter((f: FileData) => getExt(f.fileName) === typeFilter);
    }
    result.sort((a: FileData, b: FileData) => {
      if (sortBy === 'name') return a.fileName.localeCompare(b.fileName);
      if (sortBy === 'size') return b.size - a.size;
      if (sortBy === 'downloads') return b.downloadCount - a.downloadCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [files, search, typeFilter, sortBy]);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const totalDownloads = files.reduce((s: number, f: FileData) => s + f.downloadCount, 0);
  const myDownloads = downloads.filter((d: any) => d.downloaded).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold">Downloader Panel</h1>
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
              <Button variant="link" asChild><Link href="/pricing">Pricing</Link></Button>
              <Button variant="link" className="text-red-600" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t flex flex-col gap-2">
              <Button variant="link" asChild className="justify-start px-0"><Link href="/pricing">Pricing</Link></Button>
              <Button variant="link" className="text-red-600 justify-start px-0" onClick={handleLogout}>Logout</Button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
          <Card className="scale-in"><CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-xl md:text-2xl font-bold">{files.length}</p>
            <p className="text-xs md:text-sm text-gray-500">Available Files</p>
          </CardContent></Card>
          <Card className="scale-in" style={{ animationDelay: '0.05s' }}><CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-xl md:text-2xl font-bold">{totalDownloads}</p>
            <p className="text-xs md:text-sm text-gray-500">Total Downloads</p>
          </CardContent></Card>
          <Card className="scale-in" style={{ animationDelay: '0.1s' }}><CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-xl md:text-2xl font-bold">{myDownloads}</p>
            <p className="text-xs md:text-sm text-gray-500">My Downloads</p>
          </CardContent></Card>
          <Card className="scale-in" style={{ animationDelay: '0.15s' }}><CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-xl md:text-2xl font-bold">{downloads.length}</p>
            <p className="text-xs md:text-sm text-gray-500">Ad Views</p>
          </CardContent></Card>
        </div>

        {trending.length > 0 && tab === 'browse' && (
          <Card className="mb-8 fade-slide-in">
            <CardHeader><CardTitle>Trending Files</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {trending.map((file: FileData, i: number) => (
                  <Card key={file.id} className="min-w-[200px] flex-shrink-0 hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-indigo-600">#{i + 1}</span>
                        <FileTypeIcon fileName={file.fileName} />
                      </div>
                      <p className="font-medium text-sm truncate">{file.fileName}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatSize(file.size)}</p>
                      <p className="text-xs text-gray-500">{file.downloadCount} downloads</p>
                      <Button asChild size="sm" className="w-full mt-3"><Link href={`/file/${file.id}`}>Download</Link></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 mb-6">
          <Button variant={tab === 'browse' ? 'default' : 'outline'} onClick={() => setTab('browse')}>Browse Files</Button>
          <Button variant={tab === 'history' ? 'default' : 'outline'} onClick={() => setTab('history')}>Download History</Button>
        </div>

        {tab === 'browse' ? (
          <>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
                  <select className="border rounded-md px-2 py-1.5 text-sm bg-white" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    {fileTypes.map((t) => (
                      <option key={t} value={t}>{t === 'all' ? 'All Types' : t.toUpperCase()}</option>
                    ))}
                  </select>
                  <select className="border rounded-md px-2 py-1.5 text-sm bg-white" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date' | 'downloads')}>
                    <option value="date">Newest</option>
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                    <option value="downloads">Most Downloaded</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {filteredFiles.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-300 mb-3">
                  <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 001.5 3.09M9 21h6m-6 0a2 2 0 01-2-2v-4a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2m-6 0h6m-3-4h.01M21 15a4 4 0 01-1.5 3.09M7 10a5 5 0 1110 0" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">{search || typeFilter !== 'all' ? 'No files match your filters.' : 'No files available yet.'}</p>
                <p className="text-gray-400 text-sm mt-1">{search || typeFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Check back later for new uploads.'}</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredFiles.map((file: FileData) => (
                  <Card key={file.id} className="hover:shadow-md transition-shadow flex flex-col fade-slide-in">
                    <CardContent className="pt-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileTypeIcon fileName={file.fileName} />
                      </div>
                      <h3 className="font-medium truncate text-sm">{file.fileName}</h3>
                      <div className="mt-2 text-xs text-gray-500 space-y-0.5 flex-1">
                        <p>Size: {formatSize(file.size)}</p>
                        <p>Downloads: {file.downloadCount}</p>
                        <p>Uploaded: {new Date(file.createdAt).toLocaleDateString()}</p>
                        <p className="truncate">By: {file.user?.email}</p>
                      </div>
                      <Button asChild className="w-full mt-4"><Link href={`/file/${file.id}`}>Download</Link></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardHeader><CardTitle>My Download History ({downloads.length})</CardTitle></CardHeader>
            <CardContent>
              {downloads.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-300 mb-3">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No downloads yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Browse files and download one to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-3 pr-4 font-medium">File</th>
                        <th className="pb-3 pr-4 font-medium">Size</th>
                        <th className="pb-3 pr-4 font-medium">Date</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downloads.map((d: any, i: number) => (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50 row-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                          <td className="py-3 pr-4 max-w-[200px] truncate">{d.file?.fileName || 'Unknown'}</td>
                          <td className="py-3 pr-4 text-gray-600">{d.file ? formatSize(d.file.size) : '-'}</td>
                          <td className="py-3 pr-4 text-gray-600">{new Date(d.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              d.downloaded ? 'bg-green-100 text-green-700' : d.adShown ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {d.downloaded ? 'Downloaded' : d.adShown ? 'Ad Viewed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}