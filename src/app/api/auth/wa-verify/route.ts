import { NextResponse } from 'next/server';
import { verifyAndConsumeWaToken, verifyAndConsumeWaOtp, getOrCreateUser } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

// 1. GET: Magic Link Click from WhatsApp -> Instant Auto-Registration & Login
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/?auth_error=Tautan+tidak+valid', req.url));
    }

    const { valid, phone } = await verifyAndConsumeWaToken(token);
    if (!valid || !phone) {
      return NextResponse.redirect(new URL('/?auth_error=Tautan+telah+kadaluarsa+atau+sudah+digunakan', req.url));
    }

    const userEmail = `${phone}@whatsapp.finra.id`;
    const userName = `WhatsApp User (${phone.slice(-4)})`;
    const user = await getOrCreateUser(userEmail, userName);

    const sessionToken = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name || userName,
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
  } catch (error) {
    console.error('[WA Magic Link Verify Error]:', error);
    return NextResponse.redirect(new URL('/?auth_error=Terjadi+kesalahan+sistem', req.url));
  }
}

// 2. POST: 6-digit OTP Verification from Web Form
export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'Nomor WhatsApp dan kode OTP wajib diisi' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const isValid = await verifyAndConsumeWaOtp(cleanPhone, code);

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Kode verifikasi salah atau telah kadaluarsa' }, { status: 400 });
    }

    const userEmail = `${cleanPhone}@whatsapp.finra.id`;
    const userName = `WhatsApp User (${cleanPhone.slice(-4)})`;
    const user = await getOrCreateUser(userEmail, userName);

    const sessionToken = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name || userName,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Berhasil masuk via WhatsApp',
      user,
    });

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
  } catch (error: any) {
    console.error('[WA OTP Verify Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
