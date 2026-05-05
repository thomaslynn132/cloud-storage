import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '@/services/auth.service';
import { fileService } from '@/services/file.service';

export default function FileDetail() {
  const router = useRouter();
  const { id } = router.query;
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
      
      // Countdown before allowing download
      let count = 5;
      const timer = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(timer);
        }
      }, 1000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify ad');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!fileInfo) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-semibold mb-4">{fileInfo.fileName}</h2>
        
        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <p>Size: {(fileInfo.size / (1024 * 1024)).toFixed(2)} MB</p>
          <p>Downloads: {fileInfo.downloadCount}</p>
        </div>

        {!adViewed ? (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                Please view the advertisement below to unlock download
              </p>
            </div>
            
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-8 text-center mb-4">
              <p className="text-gray-500">Advertisement Space</p>
              <p className="text-xs text-gray-400 mt-2">In production, ad network code goes here</p>
            </div>

            <button
              onClick={handleVerifyAd}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              I've Viewed the Ad - Get Download Link
            </button>
          </>
        ) : (
          <div className="text-center space-y-4">
            {countdown > 0 ? (
              <p className="text-gray-600">Your download will start in {countdown} seconds...</p>
            ) : (
              <>
                <p className="text-green-600 font-medium">Download ready!</p>
                <a
                  href={downloadUrl}
                  download
                  className="inline-block py-2 px-6 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Download Now
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
