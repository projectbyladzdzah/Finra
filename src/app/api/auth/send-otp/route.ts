import { NextResponse } from 'next/server';
import { saveOtp } from '@/lib/db';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email wajib diisi' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Format email tidak valid' }, { status: 400 });
    }

    const normEmail = email.toLowerCase().trim();

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to Neon DB / Cache
    await saveOtp(normEmail, otpCode, expiresAt);

    // Send email via Resend or log to console
    const result = await sendOtpEmail(normEmail, otpCode);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Gagal mengirim kode verifikasi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kode verifikasi telah dikirim ke email Anda',
      devMode: result.devMode,
      // For developer convenience when RESEND_API_KEY is not yet added in env
      devOtp: result.devMode ? otpCode : undefined,
    });
  } catch (error: any) {
    console.error('[Send OTP API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
