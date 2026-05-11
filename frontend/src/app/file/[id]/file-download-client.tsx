'use client';

import { useState } from 'react';
import { fileService } from '@/services/file.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileDownloadClientProps {
  fileInfo: any;
}

export default function FileDownloadClient({ fileInfo }: FileDownloadClientProps) {
  const [adViewed, setAdViewed] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyAd = async () => {
    setLoading(true);
    try {
      const { adToken, downloadUrl } = await fileService.verifyAd(fileInfo.id);
      setAdViewed(true);
      setDownloadUrl(downloadUrl);
      let count = 5;
      const timer = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) clearInterval(timer);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify ad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle>{fileInfo.fileName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <p>Size: {(fileInfo.size / (1024 * 1024)).toFixed(2)} MB</p>
          <p>Downloads: {fileInfo.downloadCount}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!adViewed ? (
          <>
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                Please view the advertisement below to unlock download
              </AlertDescription>
            </Alert>

            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-8 text-center mb-4">
              <p className="text-gray-500">Advertisement Space</p>
            </div>

            <Button onClick={handleVerifyAd} disabled={loading} className="w-full">
              {loading ? 'Verifying...' : "I've Viewed the Ad - Get Download Link"}
            </Button>
          </>
        ) : (
          <div className="text-center space-y-4">
            {countdown > 0 ? (
              <p className="text-gray-600">Your download will start in {countdown} seconds...</p>
            ) : (
              <>
                <p className="text-green-600 font-medium">Download ready!</p>
                <Button asChild>
                  <a href={downloadUrl} download>Download Now</a>
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}