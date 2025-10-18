// Save this as: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the session from cookies
  const session = request.cookies.get('sb-access-token');
  
  // Define protected routes
  const protectedPaths = [
    '/pages/SecretPages',
    '/secret-page-1'
  ];
  
  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // If it's a protected path and no session, redirect to auth
  if (isProtectedPath && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }
  
  // If user is on auth page but has a session, redirect to dashboard
  if (request.nextUrl.pathname === '/auth' && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/secret-page-1';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/pages/SecretPages/:path*',
    '/secret-page-1',
    '/auth'
  ],
};