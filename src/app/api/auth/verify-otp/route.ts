import { NextResponse } from 'next/server';
import { verifyAndConsumeOtp, getOrCreateUser } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email dan kode OTP wajib diisi' },
        { status: 400 }
      );
    }

    const normEmail = email.toLowerCase().trim();
    const isValid = await verifyAndConsumeOtp(normEmail, code);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Kode verifikasi salah atau telah kadaluarsa' },
        { status: 400 }
      );
    }

    // Get or create user profile
    const user = await getOrCreateUser(normEmail);

    // Create 30-day session token
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user,
    });

    // Set HTTP-only secure session cookie
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
    console.error('[Verify OTP API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
