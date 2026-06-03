import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // Custom handling for protected API routes to return JSON instead of redirecting
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && pathname !== '/api/health') {
      if (!req.nextauth.token) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.next();
  },
  {
    secret: env.NEXTAUTH_SECRET,
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;

        // Allow public API routes to bypass authentication checks
        if (pathname.startsWith('/api/auth') || pathname === '/api/health') {
          return true;
        }

        // Allow all other API routes to proceed to the middleware function
        // so we can return a clean JSON 401 response instead of a redirect
        if (pathname.startsWith('/api/')) {
          return true;
        }

        // Secure all matching frontend pages (dashboard, settings, apps, notifications, etc.)
        // next-auth/middleware will auto-redirect to /login if token is falsy
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/notifications/:path*',
    '/app/:path*',
    '/api/:path*',
  ],
};
