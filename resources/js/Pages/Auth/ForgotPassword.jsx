import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw, KeyRound, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [cooldown, setCooldown] = useState(false);
    const [cooldownSec, setCooldownSec] = useState(0);
    const timerRef = useRef(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startCooldown = () => {
        setCooldown(true);
        setCooldownSec(60);
        timerRef.current = setInterval(() => {
            setCooldownSec((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setCooldown(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const resetForm = useForm({
        email: '',
        code: '',
        password: '',
        password_confirmation: '',
    });

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) return;
        setError('');
        setSending(true);
        try {
            const res = await axios.post('/auth/forgot-password/send', { email });
            resetForm.setData('email', email);
            if (res.data?.otp) {
                resetForm.setData('code', res.data.otp);
            }
            setStep(2);
            startCooldown();
        } catch (err) {
            setError(err.response?.data?.errors?.email?.[0] || 'Gagal mengirim OTP. Silakan coba lagi.');
        } finally {
            setSending(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!resetForm.data.code || resetForm.data.code.length !== 6) {
            setError('Masukkan 6-digit kode OTP.');
            return;
        }
        setError('');
        setVerifying(true);
        try {
            await axios.post('/auth/forgot-password/verify-otp', {
                email: resetForm.data.email,
                code: resetForm.data.code,
            });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.errors?.code?.[0] || err.response?.data?.message || 'Kode OTP salah atau sudah kadaluarsa.');
        } finally {
            setVerifying(false);
        }
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        resetForm.post('/auth/forgot-password/reset', {
            onError: () => resetForm.reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-checkerboard flex flex-col items-center justify-center p-4">
            <Head title="Lupa Password" />

            <div className="w-full max-w-md premium-card p-8 border border-[#8C6828]/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon"></div>

                <div className="text-center mb-8">
                    <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest text-gold-cream border border-gold-primary/30 rounded-full bg-accent-maroon/20 uppercase mb-3">
                        LOMBA BARIS GARDA 55 VOL 20
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
                        Lupa <span className="text-gold-primary">Password</span>
                    </h2>
                    <p className="text-sm text-text-muted mt-2">
                        Reset password akun PASGARDA Anda
                    </p>
                </div>

                <div className="space-y-5">
                    <Link
                        href="/login"
                        className="text-bronze-muted hover:text-white transition-all flex items-center gap-1 text-xs font-semibold mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Login
                    </Link>

                    {/* Step 1: Kirim OTP */}
                    {step === 1 && (
                        <form onSubmit={handleSendOtp} className="space-y-5">
                            <p className="text-xs text-text-muted leading-relaxed">
                                Masukkan alamat email terdaftar Anda. Kami akan mengirimkan kode OTP untuk mereset password Anda.
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-gold-light uppercase tracking-wider mb-2">
                                    Alamat Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                        placeholder="nama@email.com"
                                        className="block w-full pl-10 pr-3 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary placeholder-bronze-muted/50 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all text-sm"
                                    />
                                </div>
                                {error && (
                                    <p className="text-accent-mahogany text-xs mt-1.5 font-medium">{error}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-3 px-4 bg-gradient-to-r from-accent-maroon to-accent-burgundy hover:from-accent-burgundy hover:to-accent-maroon text-white font-bold rounded text-sm tracking-wide shadow-lg border border-accent-burgundy/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{sending ? 'Mengirim...' : 'Kirim Kode OTP'}</span>
                                <RefreshCw className={`h-4 w-4 text-gold-light ${sending ? 'animate-spin' : ''}`} />
                            </button>
                        </form>
                    )}

                    {/* Step 2: Verifikasi OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div className="p-3 bg-accent-maroon/20 border border-accent-maroon/40 rounded text-xs text-text-primary/90 flex gap-2.5">
                                <ShieldCheck className="h-5 w-5 text-gold-light shrink-0" />
                                <div>
                                    <span className="font-semibold text-gold-light block">OTP Dikirim!</span>
                                    {resetForm.data.code ? (
                                        <>Kode OTP: <strong className="text-gold-bright text-base tracking-widest">{resetForm.data.code}</strong></>
                                    ) : (
                                        <>Periksa email <strong className="text-white">{resetForm.data.email}</strong> untuk menyalin 6-digit kode OTP.</>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gold-light uppercase tracking-wider mb-2">
                                    Kode OTP (6 Digit)
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    inputMode="numeric"
                                    value={resetForm.data.code}
                                    onChange={(e) => { resetForm.setData('code', e.target.value); setError(''); }}
                                    placeholder="******"
                                    className="block w-full text-center tracking-[0.5em] font-mono py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-lg text-gold-bright focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all"
                                />
                                {error && (
                                    <p className="text-accent-mahogany text-xs mt-1.5 font-medium text-center">{error}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={verifying}
                                className="w-full py-3 px-4 bg-gradient-to-r from-accent-maroon to-accent-burgundy hover:from-accent-burgundy hover:to-accent-maroon text-white font-bold rounded text-sm tracking-wide shadow-lg border border-accent-burgundy/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{verifying ? 'Memverifikasi...' : 'Verifikasi Kode OTP'}</span>
                                {verifying && <RefreshCw className="h-4 w-4 text-gold-light animate-spin" />}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    disabled={cooldown || sending}
                                    onClick={handleSendOtp}
                                    className="text-xs text-gold-light/70 hover:text-gold-bright disabled:opacity-50 disabled:hover:text-gold-light/70 transition-all font-medium"
                                >
                                    {cooldown ? `Kirim ulang dalam ${cooldownSec} detik` : 'Kirim Ulang OTP'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Reset Password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div className="p-3 bg-emerald-900/30 border border-emerald-500/30 rounded text-xs text-text-primary/90 flex gap-2.5">
                                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                                <div>
                                    <span className="font-semibold text-emerald-400 block">OTP Terverifikasi!</span>
                                    Silakan masukkan password baru Anda.
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gold-light uppercase tracking-wider mb-2">
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        value={resetForm.data.password}
                                        onChange={(e) => resetForm.setData('password', e.target.value)}
                                        placeholder="Minimal 8 karakter"
                                        className="block w-full pl-10 pr-10 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary placeholder-bronze-muted/50 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-bronze-muted hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {resetForm.errors.password && (
                                    <p className="text-accent-mahogany text-xs mt-1.5 font-medium">{resetForm.errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gold-light uppercase tracking-wider mb-2">
                                    Konfirmasi Password Baru
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        value={resetForm.data.password_confirmation}
                                        onChange={(e) => resetForm.setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi password baru"
                                        className="block w-full pl-10 pr-10 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary placeholder-bronze-muted/50 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-bronze-muted hover:text-white"
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={resetForm.processing}
                                className="w-full py-3 px-4 bg-gradient-to-r from-gold-primary to-gold-bright hover:from-gold-bright hover:to-gold-primary text-deep-black font-extrabold rounded text-sm tracking-wide shadow-lg border border-gold-light/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>Reset Password</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
