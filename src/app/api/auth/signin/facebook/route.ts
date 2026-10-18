import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const appId = process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback/facebook`;

  if (!appId) {
    return NextResponse.redirect(
      new URL('/?auth_notice=facebook_credentials_needed', req.url)
    );
  }

  // Official Facebook OAuth dialog URL
  const fbAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  fbAuthUrl.searchParams.set('client_id', appId);
  fbAuthUrl.searchParams.set('redirect_uri', redirectUri);
  fbAuthUrl.searchParams.set('scope', 'email,public_profile');
  fbAuthUrl.searchParams.set('response_type', 'code');

  // Directly redirect browser to real facebook.com
  return NextResponse.redirect(fbAuthUrl.toString());
}
