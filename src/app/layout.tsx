import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'Finra — Catatan Keuangan Otomatis & Cerdas',
  description: 'Asisten keuangan otomatis berbasis AI untuk WhatsApp & Telegram. Ekstrak transaksi dari chat & foto struk secara instan.',
  keywords: 'catatan keuangan, finra, bot keuangan, whatsapp bot, AI keuangan, asisten finansial',
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
