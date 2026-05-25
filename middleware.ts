import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/auth/callback',
  '/auth/set-password',
  '/login',
  '/api/health',
  '/api/auth',
  '/api/firms',
  '/api/connectors/google/callback',
  '/api/connectors/microsoft/callback',
  // /pricing redirects to /sign-in — no need to expose it
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function isApi(pathname: string) {
  return pathname.startsWith('/api/');
}

function hasSession(req: NextRequest): boolean {
  // Supabase stores the session in a cookie named sb-<project-ref>-auth-token
  // We check for any cookie that looks like a Supabase session
  for (const [name] of req.cookies) {
    if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
      return true;
    }
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Root redirect → assistant
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/assistant';
    return NextResponse.redirect(url);
  }

  // Auth bypassed — let everything through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
