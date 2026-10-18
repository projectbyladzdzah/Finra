import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/?auth_error=Otorisasi+Facebook+dibatalkan', req.url));
  }

  const appId = process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_CLIENT_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback/facebook`;

  if (!appId || !appSecret) {
    return NextResponse.redirect(new URL('/?auth_error=Kredensial+Facebook+belum+dikonfigurasi', req.url));
  }

  try {
    // 1. Exchange authorization code with Facebook Graph API
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Facebook Token Error]:', tokenData);
      return NextResponse.redirect(new URL('/?auth_error=Gagal+menukar+kode+Facebook', req.url));
    }

    // 2. Fetch user profile from Facebook Graph API
    const profileUrl = new URL('https://graph.facebook.com/me');
    profileUrl.searchParams.set('fields', 'id,name,email');
    profileUrl.searchParams.set('access_token', tokenData.access_token);

    const profileRes = await fetch(profileUrl.toString());
    const profile = await profileRes.json();

    if (!profileRes.ok || !profile.id) {
      console.error('[Facebook Profile Error]:', profile);
      return NextResponse.redirect(new URL('/?auth_error=Gagal+mengambil+profil+Facebook', req.url));
    }

    const email = profile.email || `${profile.id}@facebook.finra.id`;
    const name = profile.name || 'Pengguna Facebook';

    // 3. Save / register in Neon Postgres
    const user = await getOrCreateUser(email, name);

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
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[Facebook Callback Exception]:', err);
    return NextResponse.redirect(new URL('/?auth_error=Terjadi+kesalahan+saat+login+Facebook', req.url));
  }
}
