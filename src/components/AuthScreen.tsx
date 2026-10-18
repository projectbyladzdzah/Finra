'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, RefreshCw, AlertCircle, ShieldCheck, User, Phone, X, ExternalLink, KeyRound, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthScreenProps {
  onSuccess: (user: { id: string; email: string; name?: string }) => void;
  darkMode?: boolean;
}

export default function AuthScreen({ onSuccess, darkMode = true }: AuthScreenProps) {
  // Tabs: 'LOGIN' or 'REGISTER'
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  // Steps: 'FORM' or 'EMAIL_OTP'
  const [step, setStep] = useState<'FORM' | 'EMAIL_OTP'>('FORM');

  // Modals
  const [showWaModal, setShowWaModal] = useState(false);
  const [showGoogleSetupModal, setShowGoogleSetupModal] = useState(false);
  const [showFbSetupModal, setShowFbSetupModal] = useState(false);

  // Form inputs for Email OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // WhatsApp Flow States
  const [waPhone, setWaPhone] = useState('');
  const [waStep, setWaStep] = useState<'INPUT' | 'VERIFY'>('INPUT');
  const [waOtp, setWaOtp] = useState(['', '', '', '', '', '']);
  const [waMagicLink, setWaMagicLink] = useState<string | null>(null);
  const [waDevOtp, setWaDevOtp] = useState<string | null>(null);
  const [waCountdown, setWaCountdown] = useState(0);

  // OAuth Config Form (if user wants to paste credentials directly)
  const [inputGoogleClientId, setInputGoogleClientId] = useState('');
  const [inputGoogleClientSecret, setInputGoogleClientSecret] = useState('');
  const [savingOAuth, setSavingOAuth] = useState(false);
  const [oauthSaveSuccess, setOauthSaveSuccess] = useState<string | null>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const waInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check URL query parameters for auth notifications/errors on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const notice = params.get('auth_notice');
      const err = params.get('auth_error');

      if (err) {
        setError(decodeURIComponent(err));
      }
      if (notice === 'google_credentials_needed') {
        setShowGoogleSetupModal(true);
      } else if (notice === 'facebook_credentials_needed') {
        setShowFbSetupModal(true);
      }
    }
  }, []);

  // Timer countdowns
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (waCountdown <= 0) return;
    const timer = setInterval(() => setWaCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [waCountdown]);

  useEffect(() => {
    if (step === 'EMAIL_OTP') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  useEffect(() => {
    if (waStep === 'VERIFY') {
      setTimeout(() => waInputRefs.current[0]?.focus(), 100);
    }
  }, [waStep]);

  // 1. REAL GOOGLE OAUTH REDIRECT HANDLER (Navigates directly to accounts.google.com)
  const handleGoogleLogin = async () => {
    setError(null);
    setSocialLoading(true);
    // Real OAuth 2.0 flow: Browser navigates to /api/auth/signin/google
    // If GOOGLE_CLIENT_ID is set in .env.local, it redirects straight to official accounts.google.com!
    window.location.href = '/api/auth/signin/google';
  };

  // 2. REAL FACEBOOK OAUTH REDIRECT HANDLER (Navigates directly to facebook.com)
  const handleFacebookLogin = async () => {
    setError(null);
    setSocialLoading(true);
    window.location.href = '/api/auth/signin/facebook';
  };

  // 3. SAVE GOOGLE OAUTH CREDENTIALS DIRECTLY
  const handleSaveGoogleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOAuth(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleClientId: inputGoogleClientId.trim(),
          googleClientSecret: inputGoogleClientSecret.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan kredensial');
      }

      setOauthSaveSuccess('Kredensial tersimpan! Mengalihkan ke halaman resmi Google...');
      setTimeout(() => {
        window.location.href = '/api/auth/signin/google';
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan kredensial');
    } finally {
      setSavingOAuth(false);
    }
  };

  // 4. EMAIL OTP HANDLERS
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

      setStep('EMAIL_OTP');
      setCountdown(60);
      if (data.devOtp) setDevOtp(data.devOtp);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan, silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

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

  // 5. WHATSAPP SEND & VERIFY HANDLERS
  const handleSendWaOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const clean = waPhone.replace(/\D/g, '');
    if (clean.length < 9) {
      setError('Masukkan nomor WhatsApp yang valid (minimal 9 digit)');
      return;
    }

    setSocialLoading(true);
    try {
      const res = await fetch('/api/auth/wa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim verifikasi WhatsApp');
      }

      setWaStep('VERIFY');
      setWaCountdown(60);
      setWaMagicLink(data.magicLink || null);
      setWaDevOtp(data.devOtp || null);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim verifikasi WhatsApp');
    } finally {
      setSocialLoading(false);
    }
  };

  const submitWaOtp = async (codeToVerify: string) => {
    setError(null);
    setSocialLoading(true);

    try {
      const res = await fetch('/api/auth/wa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone, code: codeToVerify }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Kode verifikasi WhatsApp salah atau telah kadaluarsa');
      }

      setShowWaModal(false);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Verifikasi WhatsApp gagal');
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-200',
      darkMode ? 'bg-[#080b11] text-slate-100' : 'bg-slate-50 text-slate-900'
    )}>
      {/* Decorative background ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className={cn(
        'w-full max-w-md relative z-10 rounded-3xl border p-7 sm:p-9 shadow-2xl backdrop-blur-xl',
        darkMode ? 'bg-[#0f1420]/85 border-slate-800/80 shadow-black/60' : 'bg-white/95 border-slate-200 shadow-slate-200/50'
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
            {/* Real Social Authentication Buttons */}
            <div className="space-y-2.5 mb-6">
              {/* REAL GOOGLE OAUTH BUTTON: Navigates straight to Google OAuth page */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={socialLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold border transition active:scale-[0.99] group',
                  darkMode
                    ? 'bg-slate-900/90 border-slate-700/80 hover:bg-slate-800 text-slate-200 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300'
                )}
              >
                {socialLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                )}
                <span>Lanjutkan dengan Google (accounts.google.com)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* REAL FACEBOOK OAUTH BUTTON */}
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={socialLoading}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium border transition active:scale-[0.99]',
                    darkMode ? 'bg-slate-900 border-slate-700/80 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <svg className="w-3.5 h-3.5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>

                {/* WhatsApp Button (Opens WA OTP & Magic Link Dialog) */}
                <button
                  type="button"
                  onClick={() => { setShowWaModal(true); setError(null); setWaStep('INPUT'); }}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium border transition active:scale-[0.99]',
                    darkMode
                      ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800'
                  )}
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.159.579 4.178 1.594 5.91l-1.602 5.86 6.049-1.587c1.706.947 3.667 1.487 5.759 1.487 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>WhatsApp OTP</span>
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
                  'disabled:opacity-50 disabled:cursor-not-allowed'
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
              <span>Verifikasi resmi Resend & data tersimpan di Neon Postgres</span>
            </div>
          </div>
        )}

        {/* STEP 2: EMAIL OTP VERIFICATION */}
        {step === 'EMAIL_OTP' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-1">Cek Email Anda</h2>
              <p className={cn('text-xs leading-relaxed', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                Kode verifikasi 6 digit telah dikirim ke <span className="font-semibold text-emerald-400">{email}</span>.
              </p>
            </div>

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

            <div className="flex justify-between gap-2 mb-6">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newOtp = [...otp];
                    if (val.length > 1) {
                      val.slice(0, 6).split('').forEach((d, i) => { newOtp[i] = d; });
                      setOtp(newOtp);
                      if (val.length === 6) submitOtp(newOtp.join(''));
                      return;
                    }
                    newOtp[idx] = val;
                    setOtp(newOtp);
                    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
                    if (val && idx === 5 && newOtp.join('').length === 6) submitOtp(newOtp.join(''));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
                  }}
                  className={cn(
                    'w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border outline-none transition',
                    digit ? 'border-emerald-500 shadow-md shadow-emerald-500/10' : '',
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              ))}
            </div>

            <button
              onClick={() => submitOtp(otp.join(''))}
              disabled={loading || otp.join('').length < 6}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verifikasi & Masuk</span>}
            </button>

            <div className="mt-5 flex items-center justify-between text-xs">
              <button onClick={() => setStep('FORM')} className="text-slate-400 hover:underline">Ganti Email</button>
              <button disabled={countdown > 0} onClick={() => handleSendOtp()} className={cn(countdown > 0 ? 'text-slate-500' : 'text-emerald-400 hover:underline')}>
                {countdown > 0 ? `Kirim ulang (${countdown}s)` : 'Kirim Ulang Kode'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* GOOGLE OAUTH CONFIGURATION MODAL (Shown when Client ID is needed)           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showGoogleSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className={cn(
            'w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl relative',
            darkMode ? 'bg-[#0f1420] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          )}>
            <button
              onClick={() => setShowGoogleSetupModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-white p-2 shadow flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base">Hubungkan ke Halaman Resmi Google</h3>
                <p className={cn('text-xs', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                  accounts.google.com OAuth 2.0 Integration
                </p>
              </div>
            </div>

            <p className={cn('text-xs leading-relaxed mb-4', darkMode ? 'text-slate-300' : 'text-slate-600')}>
              Sistem telah siap mengarahkan peramban Anda langsung ke <strong>accounts.google.com</strong> untuk memilih akun Google Anda. Agar Google mengizinkan aplikasi lokal (localhost:3000) berkomunikasi secara resmi, Anda cukup memasukkan <strong>OAuth Client ID</strong> dari Google Cloud Console.
            </p>

            {/* Quick 3-step guide */}
            <div className={cn('p-3.5 rounded-2xl mb-4 text-xs space-y-2 border', darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200')}>
              <div className="font-semibold flex items-center gap-1.5 text-emerald-400">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Langkah Cepat Mendapatkan Google Client ID:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                <li>Buka <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-mono">Google Cloud Console &rarr; Credentials</a></li>
                <li>Buat <strong>OAuth Client ID</strong> &rarr; Application type: <strong>Web application</strong></li>
                <li>Tambahkan Authorized redirect URI:
                  <div className="mt-1 p-2 rounded-lg bg-black/40 font-mono text-[11px] text-emerald-300 border border-slate-700/60 select-all">
                    http://localhost:3000/api/auth/callback/google
                  </div>
                </li>
              </ol>
            </div>

            {/* Direct Input Form to save credentials into .env.local */}
            <form onSubmit={handleSaveGoogleCredentials} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Google Client ID</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 123456789-abc.apps.googleusercontent.com"
                  value={inputGoogleClientId}
                  onChange={e => setInputGoogleClientId(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none',
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Google Client Secret</label>
                <input
                  type="password"
                  required
                  placeholder="GOCSPX-..."
                  value={inputGoogleClientSecret}
                  onChange={e => setInputGoogleClientSecret(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none',
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              </div>

              {oauthSaveSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{oauthSaveSuccess}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleSetupModal(false)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-xs font-medium border transition',
                    darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  )}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={savingOAuth || !inputGoogleClientId || !inputGoogleClientSecret}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-[0.99] disabled:opacity-50"
                >
                  {savingOAuth ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span>Simpan & Buka Halaman Google</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* FACEBOOK OAUTH CONFIGURATION MODAL                                         */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showFbSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className={cn(
            'w-full max-w-md rounded-3xl border p-6 shadow-2xl relative',
            darkMode ? 'bg-[#0f1420] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          )}>
            <button
              onClick={() => setShowFbSetupModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#1877F2] p-2 text-white shadow flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base">Hubungkan OAuth Facebook Resmi</h3>
                <p className={cn('text-xs', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                  developers.facebook.com Integration
                </p>
              </div>
            </div>

            <p className={cn('text-xs leading-relaxed mb-4', darkMode ? 'text-slate-300' : 'text-slate-600')}>
              Untuk login Facebook resmi, tambahkan <strong>FACEBOOK_APP_ID</strong> & <strong>FACEBOOK_APP_SECRET</strong> di file <code>.env.local</code> Anda dari <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">Meta for Developers</a>.
            </p>

            <button
              onClick={() => setShowFbSetupModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* WHATSAPP OTP & INSTANT MAGIC REGISTRATION LINK DIALOG                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showWaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className={cn(
            'w-full max-w-sm rounded-3xl border p-6 shadow-2xl relative',
            darkMode ? 'bg-[#0f1420] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          )}>
            <button
              onClick={() => setShowWaModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Masuk via WhatsApp</h3>
                <p className={cn('text-[11px]', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                  {waStep === 'INPUT' ? 'Kirim OTP & Tautan Registrasi' : 'Verifikasi Kode WhatsApp'}
                </p>
              </div>
            </div>

            {waStep === 'INPUT' && (
              <form onSubmit={handleSendWaOtp} className="space-y-4">
                <p className={cn('text-xs leading-relaxed', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                  Masukkan nomor WhatsApp Anda. Finra akan mengirimkan <strong>kode OTP</strong> dan <strong>tautan ajaib (magic link)</strong> yang langsung membuka & meregistrasi akun Anda saat diklik di chat WhatsApp.
                </p>

                <div>
                  <label className="block text-xs font-medium mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
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
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
                >
                  {socialLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengirim ke WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim OTP & Link ke WhatsApp</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {waStep === 'VERIFY' && (
              <div className="space-y-4">
                <p className={cn('text-xs leading-relaxed', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                  Pesan telah dikirim ke WhatsApp <span className="font-semibold text-emerald-400">{waPhone}</span>.
                </p>

                {/* Instant 1-Click Magic Link Feature */}
                {waMagicLink && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    <div className="font-semibold mb-1 flex items-center gap-1.5">
                      <span>⚡ Tautan Registrasi Langsung (Magic Link)</span>
                    </div>
                    <p className="text-[11px] text-emerald-300/80 mb-2">
                      Di WhatsApp, Anda cukup mengklik tautan berikut untuk langsung masuk & registrasi otomatis tanpa perlu mengetik kode:
                    </p>
                    <a
                      href={waMagicLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-medium text-xs hover:bg-emerald-600 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Tautan Registrasi Otomatis</span>
                    </a>
                  </div>
                )}

                {/* 6 Digit OTP input */}
                <div>
                  <label className="block text-xs font-medium mb-1.5">Atau masukkan 6 digit kode OTP:</label>
                  {waDevOtp && (
                    <div
                      onClick={() => {
                        const digits = waDevOtp.split('');
                        setWaOtp(digits);
                        submitWaOtp(waDevOtp);
                      }}
                      className="mb-3 text-[11px] font-mono text-amber-400 cursor-pointer hover:underline"
                    >
                      Kode OTP: <strong>{waDevOtp}</strong> (Klik untuk isi otomatis)
                    </div>
                  )}

                  <div className="flex justify-between gap-1.5">
                    {waOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { waInputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          const newOtp = [...waOtp];
                          if (val.length > 1) {
                            val.slice(0, 6).split('').forEach((d, i) => { newOtp[i] = d; });
                            setWaOtp(newOtp);
                            if (val.length === 6) submitWaOtp(newOtp.join(''));
                            return;
                          }
                          newOtp[idx] = val;
                          setWaOtp(newOtp);
                          if (val && idx < 5) waInputRefs.current[idx + 1]?.focus();
                          if (val && idx === 5 && newOtp.join('').length === 6) submitWaOtp(newOtp.join(''));
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && !waOtp[idx] && idx > 0) waInputRefs.current[idx - 1]?.focus();
                        }}
                        className={cn(
                          'w-11 h-12 text-center text-lg font-bold font-mono rounded-xl border outline-none',
                          digit ? 'border-emerald-500' : '',
                          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                        )}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => submitWaOtp(waOtp.join(''))}
                  disabled={socialLoading || waOtp.join('').length < 6}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {socialLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Verifikasi OTP</span>}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button onClick={() => setWaStep('INPUT')} className="text-slate-400 hover:underline">Ganti Nomor</button>
                  <button disabled={waCountdown > 0} onClick={() => handleSendWaOtp()} className={cn(waCountdown > 0 ? 'text-slate-500' : 'text-emerald-400 hover:underline')}>
                    {waCountdown > 0 ? `Kirim ulang (${waCountdown}s)` : 'Kirim Ulang'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
