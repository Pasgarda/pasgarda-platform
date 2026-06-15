import React, { useState, useEffect, useRef } from 'react';
import { useForm, usePage, Head, Link } from '@inertiajs/react';
import { Mail, Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw, LogIn, KeyRound } from 'lucide-react';
import ValidationError from '../../Components/ValidationError';
import ConfirmationModal from '../../Components/ConfirmationModal';

export default function Login() {
    const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [errorPopup, setErrorPopup] = useState({ show: false, message: '' });

    // Login Form State
    const loginForm = useForm({
        email: '',
        password: '',
        remember: true,
    });

    // Register Form State
    const registerForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [shake, setShake] = useState(0);
    const { errors: pageErrors } = usePage().props;
    const prevErrorCount = useRef(0);

    useEffect(() => {
        const loginErrCount = Object.keys(loginForm.errors).length;
        const registerErrCount = Object.keys(registerForm.errors).length;
        const total = loginErrCount + registerErrCount;
        if (total > 0 && total > prevErrorCount.current) {
            setShake((n) => n + 1);
        }
        prevErrorCount.current = total;
    }, [JSON.stringify(loginForm.errors), JSON.stringify(registerForm.errors)]);

    useEffect(() => {
        if (pageErrors.email || pageErrors.password) {
            const msg = pageErrors.email || pageErrors.password || 'Login gagal. Silakan coba lagi.';
            setErrorPopup({ show: true, message: msg });
        }
    }, []);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        loginForm.post('/login', {
            onSuccess: () => loginForm.reset('password'),
            onError: (errors) => {
                loginForm.reset('password');
                const msg = errors.email || errors.password || 'Login gagal. Silakan coba lagi.';
                setErrorPopup({ show: true, message: msg });
            },
        });
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        registerForm.post('/register', {
            onSuccess: () => registerForm.reset(),
            onError: (errors) => {
                registerForm.reset('password', 'password_confirmation');
                const msg = errors.name || errors.email || errors.password || 'Pendaftaran gagal. Silakan coba lagi.';
                setErrorPopup({ show: true, message: msg });
            },
        });
    };

    return (
        <>
            <div className="min-h-screen bg-checkerboard flex flex-col items-center justify-center p-4">
            <Head title={activeTab === 'login' ? 'Masuk' : 'Daftar'} />

            {/* Main Premium Card */}
            <div key={shake} className={`w-full max-w-md premium-card p-8 border border-[#8C6828]/30 relative overflow-hidden ${shake > 0 ? 'animate-shake' : ''}`}>
                {/* Decorative gold gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon"></div>

                {/* Back to Home Link */}
                <div className="absolute top-4 left-4">
                        <Link
                            href="/"
                            className="text-bronze-muted hover:text-white transition-all flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
                        >
                            <ArrowLeft className="h-3 w-3" /> Beranda
                        </Link>
                    </div>

                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest text-gold-cream border border-gold-primary/30 rounded-full bg-accent-maroon/20 uppercase mb-3">
                        LOMBA BARIS GARDA 55 VOL 20
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
                        Chequered <span className="text-gold-primary">Champions</span>
                    </h2>
                    <p className="text-sm text-text-muted mt-2">
                        Official Multi-Event Platform & Ticketing
                    </p>
                </div>

                {/* Tab: Masuk / Daftar */}
                <div className="flex bg-deep-black/60 rounded p-0.5 border border-bronze-muted/20 mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('login');
                                loginForm.clearErrors();
                            }}
                            className={`flex-1 py-2 rounded text-xs font-bold transition-all ${activeTab === 'login' ? 'bg-gold-primary/20 text-gold-light border border-gold-primary/30' : 'text-text-muted hover:text-white'}`}
                        >
                            Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('register');
                                registerForm.clearErrors();
                            }}
                            className={`flex-1 py-2 rounded text-xs font-bold transition-all ${activeTab === 'register' ? 'bg-gold-primary/20 text-gold-light border border-gold-primary/30' : 'text-text-muted hover:text-white'}`}
                        >
                            Daftar
                        </button>
                    </div>

                {/* VIEW: LOGIN */}
                {activeTab === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-5">
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
                                    name="email"
                                    id="login-email"
                                    autocomplete="username"
                                    value={loginForm.data.email}
                                    onChange={(e) => loginForm.setData('email', e.target.value)}
                                    placeholder="nama@email.com"
                                    className="block w-full pl-10 pr-3 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary placeholder-bronze-muted/50 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all text-sm"
                                />
                            </div>
                            <ValidationError message={loginForm.errors.email} />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-semibold text-gold-light uppercase tracking-wider">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-gold-primary hover:text-gold-bright transition-all font-medium"
                                >
                                    Lupa Password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    name="password"
                                    id="login-password"
                                    autocomplete="current-password"
                                    value={loginForm.data.password}
                                    onChange={(e) => loginForm.setData('password', e.target.value)}
                                    placeholder="••••••••"
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
                            <ValidationError message={loginForm.errors.password} />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember_me"
                                type="checkbox"
                                checked={loginForm.data.remember}
                                onChange={(e) => loginForm.setData('remember', e.target.checked)}
                                className="h-4 w-4 rounded border-bronze-muted/40 text-gold-primary focus:ring-gold-primary bg-deep-black/60"
                            />
                            <label htmlFor="remember_me" className="ml-2 block text-xs text-text-muted font-medium">
                                Ingat Saya
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loginForm.processing}
                            className="w-full py-3 px-4 bg-gradient-to-r from-accent-maroon to-accent-burgundy hover:from-accent-burgundy hover:to-accent-maroon text-white font-bold rounded text-sm tracking-wide shadow-lg border border-accent-burgundy/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-slow"
                        >
                            <span>Masuk</span>
                            <LogIn className="h-4 w-4 text-gold-light" />
                        </button>
                    </form>
                )}

                {/* VIEW: REGISTER */}
                {activeTab === 'register' && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gold-light uppercase tracking-wider mb-2">
                                Nama Lengkap
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                    <User className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    name="name"
                                    id="register-name"
                                    value={registerForm.data.name}
                                    onChange={(e) => registerForm.setData('name', e.target.value)}
                                    placeholder="Nama Lengkap"
                                    className="block w-full pl-10 pr-3 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary placeholder-bronze-muted/50 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all text-sm"
                                />
                            </div>
                            <ValidationError message={registerForm.errors.name} />
                        </div>

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
                                    name="email"
                                    id="register-email"
                                    autocomplete="username"
                                    value={registerForm.data.email}
                                    onChange={(e) => registerForm.setData('email', e.target.value)}
                                    placeholder="nama@email.com"
                                    className="block w-full pl-10 pr-3 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary placeholder-bronze-muted/50 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all text-sm"
                                />
                            </div>
                            <ValidationError message={registerForm.errors.email} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gold-light uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    name="password"
                                    id="register-password"
                                    autocomplete="new-password"
                                    value={registerForm.data.password}
                                    onChange={(e) => registerForm.setData('password', e.target.value)}
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
                            <ValidationError message={registerForm.errors.password} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gold-light uppercase tracking-wider mb-2">
                                Konfirmasi Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    name="password_confirmation"
                                    id="register-password-confirm"
                                    autocomplete="new-password"
                                    value={registerForm.data.password_confirmation}
                                    onChange={(e) => registerForm.setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi password"
                                    className="block w-full pl-10 pr-10 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary placeholder-bronze-muted/50 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-bronze-muted hover:text-white"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start my-2">
                            <input
                                id="agree_terms"
                                type="checkbox"
                                required
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="h-4 w-4 rounded border-bronze-muted/40 text-gold-primary focus:ring-gold-primary bg-deep-black/60 mt-0.5 cursor-pointer"
                            />
                            <label htmlFor="agree_terms" className="ml-2 block text-[11px] text-text-muted font-medium leading-relaxed cursor-pointer select-none">
                                Saya menyetujui{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowTermsModal(true)}
                                    className="text-gold-primary hover:text-gold-bright hover:underline font-bold"
                                >
                                    Syarat & Ketentuan
                                </button>{' '}
                                dan{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowTermsModal(true)}
                                    className="text-gold-primary hover:text-gold-bright hover:underline font-bold"
                                >
                                    Kebijakan Privasi
                                </button>{' '}
                                PASGARDA.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={registerForm.processing || !agreed}
                            className="w-full py-3 px-4 bg-gradient-to-r from-gold-primary to-gold-bright hover:from-gold-bright hover:to-gold-primary text-deep-black font-extrabold rounded text-sm tracking-wide shadow-lg border border-gold-light/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Daftar Akun</span>
                        </button>
                    </form>
                )}

                {/* Divider */}
                <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-bronze-muted/20"></div>
                    </div>
                    <span className="relative px-3 text-[11px] font-semibold text-text-muted bg-deep-black uppercase tracking-wider">
                        Atau Masuk Dengan
                    </span>
                </div>

                {/* Google Sign-in Button */}
                <a
                    href="/auth/google/redirect"
                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded text-sm border border-white/10 transition-all flex items-center justify-center gap-3 shadow"
                >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>Masuk dengan Google</span>
                </a>
            </div>

            {/* Terms & Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-[#0D0C0A] border border-gold-primary/30 rounded-lg overflow-hidden relative shadow-2xl flex flex-col max-h-[85vh]">
                        {/* Gold stripe */}
                        <div className="h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon shrink-0"></div>
                        
                        {/* Header */}
                        <div className="p-5 border-b border-bronze-muted/20 flex items-center justify-between shrink-0">
                            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                <KeyRound className="h-4 w-4 text-gold-primary" /> Syarat & Ketentuan Penggunaan
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="text-bronze-muted hover:text-white transition-all text-xs font-bold"
                            >
                                Tutup
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 overflow-y-auto text-xs text-text-primary/80 space-y-4 font-sans leading-relaxed flex-1">
                            <h4 className="font-bold text-white text-sm">Selamat Datang di Platform PASGARDA</h4>
                            <p>
                                Sebelum Anda melakukan pendaftaran akun, silakan baca dan pahami ketentuan berikut untuk kenyamanan dan keamanan bersama:
                            </p>
                            
                            <hr className="border-bronze-muted/20" />
                            
                            <h5 className="font-bold text-gold-light uppercase tracking-wider">1. Keamanan Akun & Kredensial</h5>
                            <p>
                                Anda bertanggung jawab penuh untuk menjaga kerahasiaan informasi akun Anda, termasuk password. Setiap aktivitas yang terjadi di bawah akun Anda dianggap sebagai aktivitas resmi Anda.
                            </p>
                            
                            <h5 className="font-bold text-gold-light uppercase tracking-wider">2. Ketentuan Anti-Kecurangan & Self-Voting</h5>
                            <p>
                                Platform PASGARDA melarang keras segala bentuk manipulasi suara atau kecurangan dalam voting. Pelatih kontingen dilarang keras memberikan suara (voting) untuk kontingennya sendiri demi menjamin sportivitas kompetisi. Sistem mendeteksi otomatis kesamaan nama pelatih dan akun pemberi vote.
                            </p>

                            <h5 className="font-bold text-gold-light uppercase tracking-wider">3. Ketentuan Pembelian Tiket</h5>
                            <p>
                                Setiap pembelian tiket online diproses melalui payment gateway Midtrans secara real-time. Tiket yang sudah dibeli bersifat non-refundable (tidak dapat diuangkan kembali) kecuali acara dibatalkan secara resmi oleh panitia.
                            </p>

                            <h5 className="font-bold text-gold-light uppercase tracking-wider">4. Kebijakan Data Pribadi</h5>
                            <p>
                                Kami menyimpan informasi nama, email, dan riwayat transaksi Anda secara aman di server kami hanya untuk kebutuhan verifikasi tiket masuk, pelacakan voting, dan rekapitulasi nilai kompetisi. Kami tidak akan membagikan data pribadi Anda kepada pihak ketiga tanpa persetujuan Anda.
                            </p>
                            
                            <p className="text-[10px] text-text-muted italic mt-4">
                                Dengan mengklik tombol "Setuju & Lanjutkan", Anda setuju untuk terikat oleh syarat dan ketentuan di atas.
                            </p>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-4 bg-deep-black/60 border-t border-bronze-muted/20 flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="px-4 py-2 border border-bronze-muted/30 hover:bg-white/5 text-bronze-muted rounded text-xs font-semibold transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAgreed(true);
                                    setShowTermsModal(false);
                                }}
                                className="px-5 py-2 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-extrabold rounded text-xs tracking-wide hover:brightness-110 transition-all shadow"
                            >
                                Setuju & Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                open={errorPopup.show}
                onClose={() => setErrorPopup({ show: false, message: '' })}
                onConfirm={() => setErrorPopup({ show: false, message: '' })}
                title="Autentikasi Gagal"
                message={errorPopup.message}
                confirmText="Coba Lagi"
                cancelText="Tutup"
                variant="danger"
            />
            </div>
        </>
    );
}
