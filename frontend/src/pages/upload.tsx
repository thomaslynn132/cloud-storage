import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { authService } from '@/services/auth.service';
import { fileService } from '@/services/file.service';
import { api } from '@/services/api';

export default function Upload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isPermanent, setIsPermanent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

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
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
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
          <a href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-8">
        <h2 className="text-2xl font-semibold mb-6">Upload File</h2>

        {result ? (
          <div className="bg-green-50 border border-green-200 rounded p-6 text-center">
            <h3 className="text-lg font-medium text-green-800">Upload Successful!</h3>
            {result.isDuplicate && (
              <p className="text-green-600 mt-2">File already exists - using existing copy (no duplicate storage)</p>
            )}
            <div className="mt-4 space-x-4">
              <a href={`/file/${result.fileId}`} className="text-blue-600 hover:underline">
                View File
              </a>
              <button onClick={() => { setResult(null); setFile(null); setProgress(0); }} className="text-blue-600 hover:underline">
                Upload Another
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="fileInput"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                <div className="text-gray-500">
                  <p className="text-lg">Drag & drop your file here</p>
                  <p>or click to browse</p>
                </div>
              </label>
            </div>

            {file && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="rounded"
                  />
                  <span>Store permanently (Paid users only)</span>
                </label>

                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
