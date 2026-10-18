'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthScreenProps {
  onSuccess: (user: { id: string; email: string; name?: string }) => void;
  darkMode?: boolean;
}

export default function AuthScreen({ onSuccess, darkMode = true }: AuthScreenProps) {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus first OTP input when step changes
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Masukkan alamat email yang valid');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim kode verifikasi');
      }

      setStep('OTP');
      setCountdown(60);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan, silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Box Input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Handle paste multiple digits
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      if (digits.length === 6) {
        submitOtp(newOtp.join(''));
      }
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when 6th digit filled
    if (value && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        submitOtp(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Submit OTP Verification
  const submitOtp = async (codeToVerify: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: codeToVerify }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Kode verifikasi salah atau telah kadaluarsa');
      }

      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Verifikasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-200',
      darkMode ? 'bg-[#080b11] text-slate-100' : 'bg-slate-50 text-slate-900'
    )}>
      {/* Decorative background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className={cn(
        'w-full max-w-md relative z-10 rounded-2xl border p-7 sm:p-9 shadow-2xl backdrop-blur-xl',
        darkMode ? 'bg-[#0f1420]/80 border-slate-800/80 shadow-black/50' : 'bg-white/90 border-slate-200 shadow-slate-200/50'
      )}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/20">
            FR
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Finra</h1>
            <p className={cn('text-xs font-mono', darkMode ? 'text-slate-400' : 'text-slate-500')}>
              Secure Financial Assistant
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* STEP 1: EMAIL INPUT */}
        {step === 'EMAIL' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-1">Masuk ke Finra</h2>
              <p className={cn('text-xs leading-relaxed', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                Masukkan email Anda. Kami akan mengirimkan kode verifikasi 6 digit untuk masuk tanpa password.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className={cn('w-4 h-4 absolute left-3.5 top-3', darkMode ? 'text-slate-500' : 'text-slate-400')} />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition',
                      darkMode
                        ? 'bg-slate-900/60 border-slate-700/70 focus:border-emerald-500 text-slate-100 placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-200 focus:border-emerald-600 text-slate-900 placeholder:text-slate-400'
                    )}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition',
                  'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white shadow-lg shadow-emerald-500/25',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                )}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengirim Kode...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Kode Verifikasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className={cn('mt-6 pt-5 border-t flex items-center justify-center gap-2 text-[11px]', darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400')}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Akses terenkripsi & data tersimpan di Neon Postgres</span>
            </div>
          </div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'OTP' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-1">Cek Email Anda</h2>
              <p className={cn('text-xs leading-relaxed', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                Kami telah mengirim kode 6 digit ke <span className="font-semibold text-emerald-400">{email}</span>.
              </p>
            </div>

            {/* Quick Dev-Mode helper if active */}
            {devOtp && (
              <div
                onClick={() => {
                  const digits = devOtp.split('');
                  setOtp(digits);
                  submitOtp(devOtp);
                }}
                className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-amber-400/20 px-1.5 py-0.5 rounded text-[11px]">{devOtp}</span>
                  <span>(Dev Mode OTP - Klik untuk auto-isi)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div className="flex justify-between gap-2 mb-6">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className={cn(
                    'w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border outline-none transition',
                    digit ? 'border-emerald-500 shadow-md shadow-emerald-500/10' : '',
                    darkMode
                      ? 'bg-slate-900 border-slate-700 focus:border-emerald-400 text-slate-100'
                      : 'bg-slate-50 border-slate-200 focus:border-emerald-600 text-slate-900'
                  )}
                />
              ))}
            </div>

            <button
              onClick={() => submitOtp(otp.join(''))}
              disabled={loading || otp.join('').length < 6}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition',
                'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white shadow-lg shadow-emerald-500/25',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
              )}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verifikasi & Masuk</span>
                </>
              )}
            </button>

            {/* Resend & Back controls */}
            <div className="mt-5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('EMAIL');
                  setOtp(['', '', '', '', '', '']);
                }}
                className={cn('hover:underline transition', darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}
              >
                Ganti Email
              </button>

              <button
                type="button"
                disabled={countdown > 0 || loading}
                onClick={() => handleSendOtp()}
                className={cn(
                  'font-medium transition',
                  countdown > 0 ? 'opacity-40 cursor-not-allowed' : 'text-emerald-400 hover:underline'
                )}
              >
                {countdown > 0 ? `Kirim ulang (${countdown}s)` : 'Kirim Ulang Kode'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
