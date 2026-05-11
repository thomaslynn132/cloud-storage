import { cookies } from 'next/headers';
import { decryptToken } from './crypto';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getDecryptedToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const encrypted = cookieStore.get('accessToken')?.value;
  if (!encrypted) return null;
  try {
    return await decryptToken(encrypted);
  } catch {
    return null;
  }
}

export async function apiServerGet(path: string) {
  const token = await getDecryptedToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiServerGetPublic(path: string) {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiServerPost(path: string, body: unknown) {
  const token = await getDecryptedToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}