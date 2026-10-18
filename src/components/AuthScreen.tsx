'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, User, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthScreenProps {
  onSuccess: (user: { id: string; email: string; name?: string }) => void;
  darkMode?: boolean;
}

export default function AuthScreen({ onSuccess, darkMode = true }: AuthScreenProps) {
  // Tabs: 'LOGIN' or 'REGISTER'
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  // Steps: 'FORM' or 'OTP'
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Modals & Social
  const [socialModal, setSocialModal] = useState<'NONE' | 'WHATSAPP' | 'GOOGLE' | 'FACEBOOK'>('NONE');
  const [waPhone, setWaPhone] = useState('');
  const [socialName, setSocialName] = useState('');
  const [socialEmail, setSocialEmail] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
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

  // Focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Handle Send OTP (both for Login & Register)
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
        body: JSON.stringify({ email: email.trim(), name: tab === 'REGISTER' ? name.trim() : undefined }),
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

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
        body: JSON.stringify({ email: email.trim(), code: codeToVerify, name: tab === 'REGISTER' ? name.trim() : undefined }),
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

  // Handle Social Login / Auto-Register
  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'whatsapp', payload?: { phone?: string; email?: string; name?: string }) => {
    setError(null);
    setSocialLoading(true);

    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          phone: payload?.phone,
          email: payload?.email,
          name: payload?.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Gagal masuk dengan ${provider}`);
      }

      setSocialModal('NONE');
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Gagal autentikasi sosial');
    } finally {
      setSocialLoading(false);
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
        'w-full max-w-md relative z-10 rounded-3xl border p-7 sm:p-9 shadow-2xl backdrop-blur-xl',
        darkMode ? 'bg-[#0f1420]/80 border-slate-800/80 shadow-black/60' : 'bg-white/95 border-slate-200 shadow-slate-200/50'
      )}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/25">
            FR
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Finra</h1>
            <p className={cn('text-xs font-mono', darkMode ? 'text-slate-400' : 'text-slate-500')}>
              Personal Financial AI
            </p>
          </div>
        </div>

        {/* Tab Switcher (Masuk vs Daftar) */}
        {step === 'FORM' && (
          <div className={cn('flex p-1 rounded-xl mb-6', darkMode ? 'bg-slate-900/80 border border-slate-800' : 'bg-slate-100')}>
            <button
              type="button"
              onClick={() => { setTab('LOGIN'); setError(null); }}
              className={cn(
                'flex-1 py-2 text-xs font-semibold rounded-lg transition-all',
                tab === 'LOGIN'
                  ? darkMode ? 'bg-slate-800 text-white shadow' : 'bg-white text-slate-900 shadow'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => { setTab('REGISTER'); setError(null); }}
              className={cn(
                'flex-1 py-2 text-xs font-semibold rounded-lg transition-all',
                tab === 'REGISTER'
                  ? darkMode ? 'bg-slate-800 text-white shadow' : 'bg-white text-slate-900 shadow'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Daftar Akun Baru
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* STEP 1: FORM (LOGIN / REGISTER) */}
        {step === 'FORM' && (
          <div>
            {/* Quick 1-Click Social Auto-Register Options */}
            <div className="space-y-2.5 mb-6">
              {/* WhatsApp Quick Register */}
              <button
                type="button"
                onClick={() => setSocialModal('WHATSAPP')}
                className={cn(
                  'w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-semibold border transition active:scale-[0.99]',
                  darkMode
                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800'
                )}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.159.579 4.178 1.594 5.91l-1.602 5.86 6.049-1.587c1.706.947 3.667 1.487 5.759 1.487 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>Lanjutkan dengan WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => setSocialModal('GOOGLE')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition active:scale-[0.99]',
                    darkMode ? 'bg-slate-900 border-slate-700/80 hover:bg-slate-850 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Google</span>
                </button>

                {/* Facebook Button */}
                <button
                  type="button"
                  onClick={() => setSocialModal('FACEBOOK')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition active:scale-[0.99]',
                    darkMode ? 'bg-slate-900 border-slate-700/80 hover:bg-slate-850 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-6">
              <div className={cn('w-full border-t', darkMode ? 'border-slate-800' : 'border-slate-200')} />
              <span className={cn('absolute px-3 text-[11px] font-medium uppercase tracking-wider', darkMode ? 'bg-[#0f1420] text-slate-500' : 'bg-white text-slate-400')}>
                atau dengan email
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSendOtp} className="space-y-4">
              {tab === 'REGISTER' && (
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className={cn('w-4 h-4 absolute left-3.5 top-3', darkMode ? 'text-slate-500' : 'text-slate-400')} />
                    <input
                      type="text"
                      placeholder="Nama Anda"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={cn(
                        'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition',
                        darkMode
                          ? 'bg-slate-900/60 border-slate-700/70 focus:border-emerald-500 text-slate-100 placeholder:text-slate-500'
                          : 'bg-slate-50 border-slate-200 focus:border-emerald-600 text-slate-900 placeholder:text-slate-400'
                      )}
                    />
                  </div>
                </div>
              )}

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
                    <span>Mengirim Kode OTP...</span>
                  </>
                ) : (
                  <>
                    <span>{tab === 'REGISTER' ? 'Daftar dengan Kode OTP' : 'Kirim Kode Verifikasi'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className={cn('mt-6 pt-5 border-t flex items-center justify-center gap-2 text-[11px]', darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400')}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verifikasi instan via Resend & data tersimpan di Neon Postgres</span>
            </div>
          </div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'OTP' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-1">Cek Email Anda</h2>
              <p className={cn('text-xs leading-relaxed', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                Kode verifikasi 6 digit telah dikirim ke <span className="font-semibold text-emerald-400">{email}</span>.
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
                  setStep('FORM');
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

      {/* WHATSAPP MODAL */}
      {socialModal === 'WHATSAPP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={cn(
            'w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative',
            darkMode ? 'bg-[#0f1420] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          )}>
            <button
              onClick={() => setSocialModal('NONE')}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base">Masuk via WhatsApp</h3>
            </div>
            <p className={cn('text-xs leading-relaxed mb-4', darkMode ? 'text-slate-400' : 'text-slate-500')}>
              Masukkan nomor WhatsApp Anda untuk auto-register & menghubungkan akun Finra Anda secara instan.
            </p>
            <form onSubmit={e => { e.preventDefault(); if (waPhone) handleSocialAuth('whatsapp', { phone: waPhone }); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="08123456789 atau 62812..."
                  value={waPhone}
                  onChange={e => setWaPhone(e.target.value)}
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono',
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={socialLoading || !waPhone}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition"
              >
                {socialLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Hubungkan & Masuk</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GOOGLE & FACEBOOK POPUP MODAL */}
      {(socialModal === 'GOOGLE' || socialModal === 'FACEBOOK') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={cn(
            'w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative',
            darkMode ? 'bg-[#0f1420] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          )}>
            <button
              onClick={() => setSocialModal('NONE')}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 mb-3">
              <h3 className="font-bold text-base">
                Lanjutkan dengan {socialModal === 'GOOGLE' ? 'Google' : 'Facebook'}
              </h3>
            </div>
            <p className={cn('text-xs leading-relaxed mb-4', darkMode ? 'text-slate-400' : 'text-slate-500')}>
              Auto-register akun Finra secara instan menggunakan profil {socialModal === 'GOOGLE' ? 'Google' : 'Facebook'} Anda.
            </p>

            <form onSubmit={e => {
              e.preventDefault();
              handleSocialAuth(socialModal === 'GOOGLE' ? 'google' : 'facebook', {
                email: socialEmail || undefined,
                name: socialName || undefined,
              });
            }} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1">Nama</label>
                <input
                  type="text"
                  placeholder={socialModal === 'GOOGLE' ? 'Nama Akun Google' : 'Nama Akun Facebook'}
                  value={socialName}
                  onChange={e => setSocialName(e.target.value)}
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none',
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder={socialModal === 'GOOGLE' ? 'user@gmail.com' : 'user@facebook.com'}
                  value={socialEmail}
                  onChange={e => setSocialEmail(e.target.value)}
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none',
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              </div>

              <button
                type="submit"
                disabled={socialLoading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition"
              >
                {socialLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Masuk Instan (1-Click)</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
