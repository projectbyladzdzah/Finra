import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'FinBot AI — Catatan Keuangan Otomatis',
  description: 'Aplikasi catatan keuangan otomatis berbasis AI untuk Telegram & WhatsApp. Ekstrak transaksi dari teks & foto struk secara instan.',
  keywords: 'catatan keuangan, finbot, bot keuangan, telegram, whatsapp, AI keuangan',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
