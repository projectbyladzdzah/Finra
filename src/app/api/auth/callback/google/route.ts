import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    console.error('[Google OAuth Error]:', error);
    return NextResponse.redirect(new URL('/?auth_error=Otorisasi+Google+dibatalkan', req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?auth_error=Kredensial+Google+belum+dikonfigurasi', req.url));
  }

  try {
    // 1. Exchange authorization code with Google OAuth token endpoint
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[Google Token Exchange Error]:', tokenData);
      return NextResponse.redirect(new URL('/?auth_error=Gagal+menukar+kode+Google', req.url));
    }

    // 2. Fetch authenticated user profile from Google UserInfo endpoint
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email) {
      console.error('[Google Profile Fetch Error]:', profile);
      return NextResponse.redirect(new URL('/?auth_error=Gagal+mengambil+profil+Google', req.url));
    }

    // 3. Register or get user in Neon PostgreSQL
    const user = await getOrCreateUser(profile.email, profile.name || profile.given_name);

    // 4. Issue session token & cookie
    const sessionToken = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.set({
      name: 'finra_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('[Google Callback Exception]:', err);
    return NextResponse.redirect(new URL('/?auth_error=Terjadi+kesalahan+saat+login+Google', req.url));
  }
}
