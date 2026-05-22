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
      // Always use HTTPS — Railway terminates SSL at the edge so req.url may be http://
      const reqUrl = new URL(req.url);
      reqUrl.protocol = 'https:';
      const signInUrl = new URL('/sign-in', reqUrl.origin);
      signInUrl.searchParams.set('redirect_url', reqUrl.toString());
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
