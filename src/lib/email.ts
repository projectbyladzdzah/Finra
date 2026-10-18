import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY || '';
  return key ? new Resend(key) : null;
}

export async function sendOtpEmail(email: string, otpCode: string): Promise<{ success: boolean; devMode?: boolean; error?: string }> {
  const resend = getResend();
  // If no Resend API key is configured yet, print to console for dev testing
  if (!resend) {
    console.log('\n======================================================');
    console.log(`🔑 [FINRA AUTH - DEV MODE OTP]`);
    console.log(`   To: ${email}`);
    console.log(`   Code: ${otpCode}`);
    console.log(`   Expires in: 10 minutes`);
    console.log('======================================================\n');
    return { success: true, devMode: true };
  }

  try {
    const fromAddress = process.env.RESEND_FROM || 'Finra <onboarding@resend.dev>';
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `Kode Verifikasi Masuk Finra: ${otpCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Kode Verifikasi Finra</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 40px 20px; margin: 0;">
          <div style="max-width: 480px; margin: 0 auto; background: #131926; border-radius: 16px; border: 1px solid #1e293b; padding: 36px 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #6366f1); display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; text-align: center; line-height: 40px;">FR</div>
              <span style="font-size: 20px; font-weight: 700; color: #f8fafc; margin-left: 12px; letter-spacing: -0.5px;">Finra</span>
            </div>
            
            <h2 style="font-size: 22px; font-weight: 600; color: #f8fafc; margin: 0 0 8px 0;">Kode Verifikasi Masuk</h2>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px 0;">Gunakan kode 6 digit di bawah ini untuk masuk ke akun Finra Anda. Kode ini berlaku selama 10 menit.</p>
            
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #34d399;">${otpCode}</span>
            </div>
            
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">Jika Anda tidak meminta kode ini, Anda dapat mengabaikan email ini dengan aman.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Resend Error]:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Send OTP Exception]:', err);
    return { success: false, error: err.message || 'Gagal mengirim email' };
  }
}
