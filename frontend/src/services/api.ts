import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { decryptToken } from '@/lib/crypto';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: AxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const encrypted = localStorage.getItem('accessToken');
    if (encrypted) {
      try {
        const token = await decryptToken(encrypted);
        config.headers!.Authorization = `Bearer ${token}`;
      } catch {
        // fallback: try reading as plaintext (legacy)
        config.headers!.Authorization = `Bearer ${encrypted}`;
      }
    }
  }
  return config as any;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const encryptedRefresh = localStorage.getItem('refreshToken');
      if (encryptedRefresh) {
        try {
          const refreshToken = await decryptToken(encryptedRefresh);
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          // Store newly encrypted tokens
          const { encryptToken } = await import('@/lib/crypto');
          const [encAccess, encRefresh] = await Promise.all([
            encryptToken(data.accessToken),
            encryptToken(data.refreshToken),
          ]);
          localStorage.setItem('accessToken', encAccess);
          localStorage.setItem('refreshToken', encRefresh);
          document.cookie = `accessToken=${encodeURIComponent(encAccess)}; path=/; SameSite=Lax`;
          document.cookie = `refreshToken=${encodeURIComponent(encRefresh)}; path=/; SameSite=Lax`;

          error.config!.headers!.Authorization = `Bearer ${data.accessToken}`;
          return axios(error.config!);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;