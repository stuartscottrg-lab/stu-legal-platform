import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/auth/callback',
  '/login',
  '/pricing',
  '/api/health',
  '/api/auth',
  '/api/stripe/webhook',
  '/api/firms',
  '/api/connectors/google/callback',
  '/api/connectors/microsoft/callback',
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

  // Always allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check for a Supabase session cookie
  if (!hasSession(req)) {
    if (isApi(pathname)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signIn = req.nextUrl.clone();
    signIn.pathname = '/sign-in';
    signIn.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
