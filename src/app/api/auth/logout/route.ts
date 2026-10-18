import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Berhasil keluar' });
  response.cookies.set({
    name: 'finra_session',
    value: '',
    path: '/',
    maxAge: 0,
  });
  return response;
}
