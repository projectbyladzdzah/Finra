import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { provider, email, name, phone } = await req.json();

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider wajib diisi' }, { status: 400 });
    }

    let userEmail = '';
    let userName = name || '';

    if (provider === 'google') {
      userEmail = email || `user.google_${Date.now().toString(36)}@gmail.com`;
      userName = userName || 'Pengguna Google';
    } else if (provider === 'facebook') {
      userEmail = email || `user.fb_${Date.now().toString(36)}@facebook.com`;
      userName = userName || 'Pengguna Facebook';
    } else if (provider === 'whatsapp') {
      if (!phone) {
        return NextResponse.json({ success: false, error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
      }
      const cleanPhone = phone.replace(/\D/g, '');
      userEmail = `${cleanPhone}@whatsapp.finra.id`;
      userName = userName || `WhatsApp User (${cleanPhone.slice(-4)})`;
    } else {
      return NextResponse.json({ success: false, error: 'Provider tidak didukung' }, { status: 400 });
    }

    // Register or get user in Neon Postgres
    const user = await getOrCreateUser(userEmail);
    if (userName && !user.name) {
      user.name = userName;
    }

    // Create session token
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: userName || user.name || user.email.split('@')[0],
    });

    const response = NextResponse.json({
      success: true,
      message: `Berhasil masuk via ${provider.toUpperCase()}`,
      user: {
        id: user.id,
        email: user.email,
        name: userName || user.name,
      },
    });

    // Set secure session cookie
    response.cookies.set({
      name: 'finra_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('[Social Auth Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan autentikasi sosial' },
      { status: 500 }
    );
  }
}
