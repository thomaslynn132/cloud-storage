'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { fileService } from '@/services/file.service';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Upload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isPermanent, setIsPermanent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);
    setError('');

    try {
      const hash = await calculateFileHash(file);
      setProgress(20);

      const initResponse = await api.post('/upload/init', {
        fileName: file.name,
        fileSize: file.size,
        fileHash: hash,
        isPermanent,
      });

      setProgress(30);

      const { uploadUrl, fileId, isDuplicate, storageKey } = initResponse.data;

      if (!isDuplicate) {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = 30 + (e.loaded / e.total) * 50;
            setProgress(percent);
          }
        };

        await new Promise((resolve, reject) => {
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', 'application/octet-stream');
          xhr.onload = resolve;
          xhr.onerror = reject;
          xhr.send(file);
        });

        setProgress(85);

        await api.post('/upload/complete', {
          uploadId: initResponse.data.uploadId,
          storageKey,
        });
      }

      setProgress(100);
      setResult({ fileId, isDuplicate });
      toast.success('File uploaded successfully');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Upload failed';
      setError(msg);
      toast.error(msg);
      setUploading(false);
    }
  };

  const calculateFileHash = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const hash = Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        resolve(hash);
      };
      reader.readAsArrayBuffer(file.slice(0, 1024));
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">FileHost</h1>
          <Button variant="link" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-8">
        <h2 className="text-2xl font-semibold mb-6">Upload File</h2>

        {result ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-medium text-green-800">Upload Successful!</h3>
              {result.isDuplicate && (
                <p className="text-green-600 mt-2">File already exists - using existing copy (no duplicate storage)</p>
              )}
              <div className="mt-4 space-x-4">
                <Button variant="link" onClick={() => router.push(`/file/${result.fileId}`)}>
                  View File
                </Button>
                <Button variant="link" onClick={() => { setResult(null); setFile(null); setProgress(0); }}>
                  Upload Another
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : file
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />
                <div className="text-gray-500">
                  {file ? (
                    <>
                      <p className="text-lg font-medium text-green-700">{file.name}</p>
                      <p className="text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB selected</p>
                      <p className="text-xs mt-1 text-gray-400">Click or drop another to change</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg">Drag & drop your file here</p>
                      <p className="text-sm mt-1">or click to browse</p>
                    </>
                  )}
                </div>
              </div>

              {file && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="permanent"
                      checked={isPermanent}
                      onCheckedChange={(checked) => setIsPermanent(checked as boolean)}
                    />
                    <Label htmlFor="permanent">Store permanently (Paid users only)</Label>
                  </div>

                  {uploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Uploading...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
