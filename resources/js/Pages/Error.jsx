import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ShieldX, SearchX, TimerReset, Zap, ServerCrash, Wrench, Home, RefreshCw, ArrowLeft } from 'lucide-react';
import Footer from '../Components/Footer';

const ERROR_MAP = {
    403: {
        icon: ShieldX,
        title: 'Akses Ditolak',
        message: 'Anda tidak memiliki izin untuk mengakses halaman ini. Pastikan Anda sudah login dengan akun yang benar.',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
    },
    404: {
        icon: SearchX,
        title: 'Halaman Tidak Ditemukan',
        message: 'Halaman yang Anda cari tidak ditemukan atau telah dipindahkan. Periksa kembali URL yang Anda masukkan.',
        color: 'text-gold-primary',
        bgColor: 'bg-gold-primary/10',
        borderColor: 'border-gold-primary/20',
    },
    419: {
        icon: TimerReset,
        title: 'Sesi Kedaluwarsa',
        message: 'Sesi Anda telah berakhir karena tidak aktif terlalu lama. Silakan muat ulang halaman untuk melanjutkan.',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
    },
    429: {
        icon: Zap,
        title: 'Terlalu Banyak Permintaan',
        message: 'Anda terlalu sering melakukan permintaan. Mohon tunggu beberapa saat sebelum mencoba lagi.',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
    },
    500: {
        icon: ServerCrash,
        title: 'Kesalahan Server',
        message: 'Terjadi kesalahan internal pada server. Tim kami sedang menangani masalah ini. Silakan coba lagi nanti.',
        color: 'text-accent-mahogany',
        bgColor: 'bg-accent-mahogany/10',
        borderColor: 'border-accent-mahogany/20',
    },
    503: {
        icon: Wrench,
        title: 'Sedang Maintenance',
        message: 'Platform sedang dalam pemeliharaan untuk meningkatkan pengalaman Anda. Silakan kembali beberapa saat lagi.',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
    },
};

export default function Error({ status }) {
    const code = status || 404;
    const config = ERROR_MAP[code] || ERROR_MAP[404];
    const Icon = config.icon;

    return (
        <div className="min-h-screen bg-deep-black text-text-primary font-sans relative overflow-hidden flex flex-col">
            <Head title={`${code} — ${config.title}`} />

            {/* Background decorations */}
            <div className="absolute inset-0 bg-checkerboard opacity-[0.03] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-deep-black via-dark-brown/20 to-deep-black pointer-events-none" />

            {/* Subtle radial glow behind icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold-primary/[0.03] blur-3xl pointer-events-none" />

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
                <div className="w-full max-w-md text-center animate-fade-in">
                    {/* Floating icon */}
                    <div className="animate-error-float mb-6">
                        <div className={`inline-flex p-5 rounded-2xl ${config.bgColor} border ${config.borderColor} shadow-lg`}>
                            <Icon className={`h-10 w-10 sm:h-12 sm:w-12 ${config.color}`} strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Status code with glow */}
                    <h1 className="font-display text-7xl sm:text-8xl md:text-9xl font-extrabold text-gold-primary/30 animate-error-glow leading-none mb-2 select-none">
                        {code}
                    </h1>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-3 tracking-tight">
                        {config.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-text-primary/60 leading-relaxed mb-8 max-w-sm mx-auto px-2">
                        {config.message}
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4">
                        <Link
                            href="/"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-bold rounded-lg text-sm tracking-wide hover:brightness-110 transition-all shadow-lg"
                        >
                            <Home className="h-4 w-4" />
                            Kembali ke Beranda
                        </Link>

                        {code === 419 ? (
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-lg text-sm hover:bg-white/10 transition-all"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Muat Ulang
                            </button>
                        ) : (
                            <button
                                onClick={() => window.history.back()}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-lg text-sm hover:bg-white/10 transition-all"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Halaman Sebelumnya
                            </button>
                        )}
                    </div>

                    {/* Decorative line */}
                    <div className="mt-10 flex items-center justify-center gap-3">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-bronze-muted/30" />
                        <img src="/images/pasgarda.png" alt="PASGARDA" className="h-6 w-auto opacity-30" />
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-bronze-muted/30" />
                    </div>
                    <p className="mt-3 text-[10px] text-bronze-muted/50 uppercase tracking-widest font-bold">
                        PASGARDA Platform
                    </p>
                </div>
            </div>

            {/* Footer */}
            <Footer className="mt-0" />
        </div>
    );
}
