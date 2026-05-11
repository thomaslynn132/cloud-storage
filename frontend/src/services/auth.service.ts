import api from './api';
import { encryptToken, decryptToken } from '@/lib/crypto';

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

function getLocal(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function setLocal(key: string, value: string) {
  if (typeof window !== 'undefined') localStorage.setItem(key, value);
}

function removeLocal(key: string) {
  if (typeof window !== 'undefined') localStorage.removeItem(key);
}

export const authService = {
  async register(email: string, password: string, userType: string = 'UPLOADER') {
    const { data } = await api.post('/auth/register', { email, password, userType });
    await this.setTokens(data.accessToken, data.refreshToken, data.user);
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    await this.setTokens(data.accessToken, data.refreshToken, data.user);
    return data;
  },

  async refreshToken(refreshToken: string) {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  async fetchProfile() {
    const { data } = await api.get('/users/profile');
    return data;
  },

  logout() {
    removeLocal('accessToken');
    removeLocal('refreshToken');
    removeLocal('user');
    removeCookie('accessToken');
    removeCookie('refreshToken');
    removeCookie('user');
  },

  getCurrentUser() {
    const user = getLocal('user');
    return user ? JSON.parse(user) : null;
  },

  async getAccessToken(): Promise<string | null> {
    const encrypted = getLocal('accessToken');
    if (!encrypted) return null;
    try {
      return await decryptToken(encrypted);
    } catch {
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string, user: any) {
    const [encAccess, encRefresh] = await Promise.all([
      encryptToken(accessToken),
      encryptToken(refreshToken),
    ]);
    setLocal('accessToken', encAccess);
    setLocal('refreshToken', encRefresh);
    setLocal('user', JSON.stringify(user));
    setCookie('accessToken', encAccess);
    setCookie('refreshToken', encRefresh);
    setCookie('user', JSON.stringify(user));
  },
};