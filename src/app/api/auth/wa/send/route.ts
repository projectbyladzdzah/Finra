import { NextResponse } from 'next/server';
import { saveWaVerification } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      return NextResponse.json({ success: false, error: 'Nomor WhatsApp tidak valid (minimal 9 digit)' }, { status: 400 });
    }

    // Standardize 08... to 628... for Fonnte API
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    // Generate 6-digit OTP and UUID magic link token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to Neon DB / Memory
    await saveWaVerification(cleanPhone, otpCode, token, expiresAt);

    // Prepare magic link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${appUrl}/api/auth/wa-verify?token=${token}`;

    const waMessage = `🔐 *Kode Verifikasi Masuk Finra*\n\n` +
      `Kode OTP Anda: *${otpCode}*\n\n` +
      `Atau klik tautan ini untuk langsung masuk & registrasi otomatis:\n` +
      `${magicLink}\n\n` +
      `_Tautan dan kode berlaku selama 10 menit._ ✨`;

    const fonnteToken = process.env.FONNTE_TOKEN;
    let sentToWhatsapp = false;

    if (fonnteToken) {
      try {
        const formData = new URLSearchParams();
        formData.append('target', formattedPhone);
        formData.append('message', waMessage);
        formData.append('countryCode', '62');

        const fonnteRes = await fetch('https://api.fonnte.com/send_message', {
          method: 'POST',
          headers: { Authorization: fonnteToken },
          body: formData,
        });
        const fonnteData = await fonnteRes.json().catch(() => ({}));
        sentToWhatsapp = Boolean(fonnteData.status);
      } catch (err) {
        console.warn('[Fonnte Send Error]:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Kode OTP dan tautan masuk telah dikirimkan ke WhatsApp Anda',
      phone: cleanPhone,
      sentToWhatsapp,
      magicLink,
      devOtp: otpCode,
    });
  } catch (error: any) {
    console.error('[Send WA Verification Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengirim verifikasi WhatsApp' },
      { status: 500 }
    );
  }
}
