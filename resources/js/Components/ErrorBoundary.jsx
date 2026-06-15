import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, showDetails: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env?.DEV;

            return (
                <div className="min-h-screen bg-deep-black text-text-primary font-sans relative overflow-hidden flex items-center justify-center">
                    {/* Background decorations */}
                    <div className="absolute inset-0 bg-checkerboard opacity-[0.03] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-deep-black via-dark-brown/20 to-deep-black pointer-events-none" />
                    
                    {/* Radial glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent-mahogany/[0.05] blur-3xl pointer-events-none" />

                    <div className="relative z-10 w-full max-w-md mx-auto px-5 py-12 animate-fade-in">
                        <div className="premium-card border border-accent-mahogany/20 p-6 sm:p-8 relative overflow-hidden">
                            {/* Top accent bar */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-accent-mahogany to-accent-maroon" />

                            {/* Icon with spin animation */}
                            <div className="text-center mb-6">
                                <div className="inline-flex p-4 rounded-2xl bg-accent-mahogany/10 border border-accent-mahogany/20 mb-4">
                                    <div className="relative">
                                        <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-accent-mahogany" strokeWidth={1.5} />
                                        {/* Spinning ring behind icon */}
                                        <div className="absolute inset-[-6px] rounded-full border border-accent-mahogany/20 border-t-accent-mahogany/60 animate-spin-slow" />
                                    </div>
                                </div>

                                <h2 className="text-lg sm:text-xl font-extrabold text-white mb-2 tracking-tight">
                                    Terjadi Kesalahan
                                </h2>
                                <p className="text-xs sm:text-sm text-text-primary/60 leading-relaxed max-w-xs mx-auto">
                                    Halaman ini mengalami masalah yang tidak terduga. Silakan muat ulang atau kembali ke beranda.
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-bold rounded-lg text-xs tracking-wide hover:brightness-110 transition-all"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Muat Ulang
                                </button>
                                <a
                                    href="/"
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-lg text-xs hover:bg-white/10 transition-all"
                                >
                                    <Home className="h-3.5 w-3.5" />
                                    Ke Beranda
                                </a>
                            </div>

                            {/* Technical details (dev mode collapsible) */}
                            {isDev && this.state.error && (
                                <div className="border-t border-bronze-muted/10 pt-3 mt-3">
                                    <button
                                        onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                                        className="w-full flex items-center justify-between gap-2 text-[10px] text-bronze-muted/60 hover:text-bronze-muted transition-all uppercase tracking-wider font-bold"
                                    >
                                        <span>Detail Teknis</span>
                                        {this.state.showDetails ? (
                                            <ChevronUp className="h-3 w-3" />
                                        ) : (
                                            <ChevronDown className="h-3 w-3" />
                                        )}
                                    </button>
                                    {this.state.showDetails && (
                                        <div className="mt-2 p-3 bg-deep-black/60 border border-bronze-muted/10 rounded-lg overflow-auto max-h-48 animate-fade-in">
                                            <p className="text-[10px] text-red-400/80 font-mono break-all leading-relaxed">
                                                {this.state.error.message}
                                            </p>
                                            {this.state.error.stack && (
                                                <pre className="mt-2 text-[9px] text-bronze-muted/40 font-mono break-all whitespace-pre-wrap leading-relaxed">
                                                    {this.state.error.stack}
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Branding */}
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <div className="h-px w-10 bg-gradient-to-r from-transparent to-bronze-muted/20" />
                            <img src="/images/pasgarda.png" alt="PASGARDA" className="h-5 w-auto opacity-20" />
                            <div className="h-px w-10 bg-gradient-to-l from-transparent to-bronze-muted/20" />
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
