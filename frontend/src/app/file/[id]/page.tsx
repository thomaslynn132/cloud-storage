'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { fileService } from '@/services/file.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function FileDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adViewed, setAdViewed] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!id) return;
    loadFileInfo();
  }, [id]);

  const loadFileInfo = async () => {
    try {
      const data = await fileService.getFileInfo(id as string);
      setFileInfo(data);
    } catch (err) {
      alert('File not found or expired');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAd = async () => {
    try {
      const { adToken, downloadUrl } = await fileService.verifyAd(id as string);
      setAdViewed(true);
      setDownloadUrl(downloadUrl);
      
      let count = 5;
      const timer = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) clearInterval(timer);
      }, 1000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify ad');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!fileInfo) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>{fileInfo.fileName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>Size: {(fileInfo.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p>Downloads: {fileInfo.downloadCount}</p>
          </div>

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

              <Button
                onClick={handleVerifyAd}
                className="w-full"
              >
                I've Viewed the Ad - Get Download Link
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
                    <a href={downloadUrl} download>
                      Download Now
                    </a>
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
