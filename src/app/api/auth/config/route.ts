import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  return NextResponse.json({
    hasGoogleAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    hasFacebookAuth: Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    googleClientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 10)}...` : null,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { googleClientId, googleClientSecret, facebookAppId, facebookAppSecret } = body;

    const envPath = path.resolve(process.cwd(), '.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const updateOrAppend = (key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
      process.env[key] = value;
    };

    if (googleClientId) updateOrAppend('GOOGLE_CLIENT_ID', googleClientId.trim());
    if (googleClientSecret) updateOrAppend('GOOGLE_CLIENT_SECRET', googleClientSecret.trim());
    if (facebookAppId) updateOrAppend('FACEBOOK_APP_ID', facebookAppId.trim());
    if (facebookAppSecret) updateOrAppend('FACEBOOK_APP_SECRET', facebookAppSecret.trim());

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Kredensial OAuth berhasil disimpan ke .env.local',
      hasGoogleAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  } catch (error: any) {
    console.error('[Save OAuth Config Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan kredensial' },
      { status: 500 }
    );
  }
}
