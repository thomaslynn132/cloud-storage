import api from './api';

export const fileService = {
  async uploadFile(file: File, isPermanent: boolean = false) {
    const hash = await calculateFileHash(file);
    
    const initResponse = await api.post('/upload/init', {
      fileName: file.name,
      fileSize: file.size,
      fileHash: hash,
      isPermanent,
    });

    const { uploadUrl, fileId, isDuplicate } = initResponse.data;

    if (!isDuplicate) {
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      await api.post('/upload/complete', {
        uploadId: initResponse.data.uploadId,
        storageKey: initResponse.data.storageKey,
      });
    }

    return { fileId, isDuplicate };
  },

  async getFiles() {
    const { data } = await api.get('/files');
    return data;
  },

  async deleteFile(fileId: string) {
    const { data } = await api.delete(`/files/${fileId}`);
    return data;
  },

  async getFileInfo(fileId: string) {
    const { data } = await api.get(`/files/${fileId}`);
    return data;
  },

  async getDownloadUrl(fileId: string, token: string) {
    const { data } = await api.get(`/files/${fileId}/download?token=${token}`);
    return data;
  },

  async verifyAd(fileId: string) {
    const { data } = await api.post(`/files/${fileId}/verify-ad`);
    return data;
  },
};

function calculateFileHash(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const hash = Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      resolve(hash);
    };
    reader.readAsArrayBuffer(file.slice(0, 1024)); // Simple hash of first 1KB
  });
}
