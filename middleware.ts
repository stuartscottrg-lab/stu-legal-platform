import { createServerClient } from '@supabase/ssr';
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

function isPublic(req: NextRequest) {
  const { pathname } = req.nextUrl;
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function isApi(req: NextRequest) {
  return req.nextUrl.pathname.startsWith('/api/');
}

export async function middleware(req: NextRequest) {
  // Skip auth check for public paths early — avoids unnecessary network calls
  if (isPublic(req)) {
    return NextResponse.next({ request: req });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, fail open with a clear 500 rather than a cryptic crash
  if (!supabaseUrl || !supabaseKey) {
    console.error('Middleware: missing Supabase env vars');
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 },
    );
  }

  let res = NextResponse.next({ request: req });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (isApi(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const signIn = req.nextUrl.clone();
      signIn.pathname = '/sign-in';
      signIn.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(signIn);
    }
  } catch (err) {
    console.error('Middleware auth error:', err);
    // On auth failure, redirect to sign-in rather than crashing
    if (isApi(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signIn = req.nextUrl.clone();
    signIn.pathname = '/sign-in';
    signIn.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
