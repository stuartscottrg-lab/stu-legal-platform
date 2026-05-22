import { NextRequest, NextResponse } from 'next/server';


import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'offline_access',
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Calendars.Read',
  'https://graph.microsoft.com/User.Read',
].join(' ');

export async function GET(req: NextRequest) {
  
  

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'MICROSOFT_CLIENT_ID not configured' }, { status: 501 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get('host')}`;
  const redirectUri = `${baseUrl}/api/connectors/microsoft/callback`;
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state,
    response_mode: 'query',
  });

  const response = NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
  );

  response.cookies.set('oauth_state_microsoft', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
