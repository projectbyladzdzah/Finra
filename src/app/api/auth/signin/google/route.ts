import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId) {
    // If GOOGLE_CLIENT_ID is not configured yet, redirect with friendly notification
    return NextResponse.redirect(
      new URL('/?auth_notice=google_credentials_needed', req.url)
    );
  }

  // Construct official Google OAuth 2.0 Authorization URL
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account'); // Forces Google account chooser screen!

  // Directly redirect browser to real accounts.google.com
  return NextResponse.redirect(googleAuthUrl.toString());
}
