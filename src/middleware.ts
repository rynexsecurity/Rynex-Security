import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyEdgeJWT } from './lib/auth-edge';

function isTrustedVercelPreviewHost(hostname: string): boolean {
  if (process.env.VERCEL_ENV !== 'preview') {
    return false;
  }

  const trustedHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) =>
      value
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .toLowerCase(),
    );

  return trustedHosts.includes(hostname);
}

function isPortalPath(pathname: string): boolean {
  return pathname === '/portal' || pathname.startsWith('/portal/');
}

async function getPortalSession(request: NextRequest) {
  const sessionCookie = request.cookies.get('portal_session')?.value;

  if (!sessionCookie) {
    return null;
  }

  return verifyEdgeJWT(sessionCookie);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const currentHost = hostname.split(':')[0].toLowerCase();

  const isProductionPortalHost =
    currentHost === 'portal.rynexsecurity.com' ||
    currentHost === 'portal.localhost';

  const isPreviewHost = isTrustedVercelPreviewHost(currentHost);

  /*
   * Production portal subdomain:
   *
   * portal.rynexsecurity.com/login
   * portal.rynexsecurity.com/dashboard
   *
   * These are internally rewritten to /portal/*
   */
  if (isProductionPortalHost) {
    let cleanPathname = pathname;

    if (isPortalPath(pathname)) {
      cleanPathname = pathname.slice('/portal'.length) || '/';
    }

    const decodedSession = await getPortalSession(request);
    const isLoginPage = cleanPathname === '/login';

    if (isLoginPage && decodedSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (!isLoginPage && !decodedSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const url = request.nextUrl.clone();
    url.pathname = `/portal${cleanPathname}`;

    return NextResponse.rewrite(url);
  }

  /*
   * Vercel Preview:
   *
   * Public website stays public:
   * /events
   * /blog
   * /about
   *
   * Portal remains available under:
   * /portal/login
   * /portal/dashboard
   */
  if (isPreviewHost && isPortalPath(pathname)) {
    const portalPath = pathname.slice('/portal'.length) || '/';
    const decodedSession = await getPortalSession(request);
    const isLoginPage = portalPath === '/login';

    if (isLoginPage && decodedSession) {
      return NextResponse.redirect(
        new URL('/portal/dashboard', request.url),
      );
    }

    if (!isLoginPage && !decodedSession) {
      return NextResponse.redirect(
        new URL('/portal/login', request.url),
      );
    }

    return NextResponse.next();
  }

  /*
   * Block /portal access on the normal production website domain.
   * This does not apply to trusted Vercel Preview deployments.
   */
  if (isPortalPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/not-found';

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};