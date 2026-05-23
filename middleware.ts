import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing(.*)',
  '/api/health(.*)',
  '/api/auth(.*)',
  '/api/stripe/webhook(.*)',
  '/api/firms(.*)',
  '/api/connectors/google/callback(.*)',
  '/api/connectors/microsoft/callback(.*)',
]);

const isApiRoute = createRouteMatcher(['/api/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      // API routes get 401, page routes redirect to sign-in
      if (isApiRoute(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Use x-forwarded-host so Railway's internal localhost:8080 doesn't leak
      const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'stu.ink';
      const proto = req.headers.get('x-forwarded-proto') ?? 'https';
      const reqPath = new URL(req.url).pathname + new URL(req.url).search;
      const publicOrigin = `${proto}://${host}`;
      // Use Clerk's hosted sign-in (accounts.stu.ink) — avoids embedded component issues
      const signInUrl = new URL('https://accounts.stu.ink/sign-in');
      signInUrl.searchParams.set('redirect_url', `${publicOrigin}${reqPath}`);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
