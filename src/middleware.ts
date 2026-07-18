import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect routes starting with /portal
  if (pathname.startsWith('/portal')) {
    const sessionCookie = request.cookies.get('portal_session')?.value;
    const isLoginPage = pathname === '/portal/login';
    const isChangePasswordPage = pathname === '/portal/change-password';

    // Verify session
    let decodedSession = null;
    if (sessionCookie) {
      decodedSession = await verifyJWT(sessionCookie);
    }

    // 1. If on login page and already logged in, redirect to dashboard
    if (isLoginPage && decodedSession) {
      return NextResponse.redirect(new URL('/portal/dashboard', request.url));
    }

    // 2. If not logged in and not on login page, redirect to login
    if (!isLoginPage && !decodedSession) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }

    // 3. If logged in and must change password, redirect to change-password
    if (
      decodedSession &&
      decodedSession.mustChangePassword &&
      !isChangePasswordPage &&
      !isLoginPage
    ) {
      return NextResponse.redirect(new URL('/portal/change-password', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*'],
};
