import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptToken } from './lib/crypto';

const publicPaths = ['/', '/login', '/register', '/pricing'];
const fileDetailPattern = /^\/file\/[^/]+$/;

function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function clearAuth(response: NextResponse) {
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');
  response.cookies.delete('user');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.includes(pathname) || fileDetailPattern.test(pathname);
  if (isPublic) return NextResponse.next();

  const encryptedToken = request.cookies.get('accessToken')?.value;
  if (!encryptedToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Decrypt the token
  let token: string;
  try {
    token = await decryptToken(encryptedToken);
  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url));
    clearAuth(res);
    return res;
  }

  const payload = decodeJWTPayload(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    clearAuth(res);
    return res;
  }

  // Check expiration
  const exp = payload.exp as number | undefined;
  if (exp && Date.now() >= exp * 1000) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    clearAuth(res);
    return res;
  }

  const userType = payload.userType as string;

  if (pathname.startsWith('/dashboard') && userType !== 'UPLOADER') {
    const target = userType === 'ADMIN' ? '/admin' : '/downloader';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/downloader') && userType !== 'DOWNLOADER') {
    const target = userType === 'ADMIN' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/admin') && userType !== 'ADMIN') {
    const target = userType === 'DOWNLOADER' ? '/downloader' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/upload') && userType !== 'UPLOADER') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth/logout).*)',
  ],
};