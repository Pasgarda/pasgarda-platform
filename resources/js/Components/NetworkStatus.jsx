import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function NetworkStatus() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isDismissing, setIsDismissing] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);
    const wasOfflineRef = useRef(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
            setIsDismissing(false);
            wasOfflineRef.current = true;
        };

        const handleOnline = () => {
            // Show "reconnected" message briefly before dismissing
            if (wasOfflineRef.current) {
                setShowReconnected(true);
                setTimeout(() => {
                    setIsDismissing(true);
                    setTimeout(() => {
                        setIsOffline(false);
                        setShowReconnected(false);
                        setIsDismissing(false);
                        wasOfflineRef.current = false;
                    }, 300);
                }, 2000);
            } else {
                setIsOffline(false);
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline && !showReconnected) return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-[250] px-4 pb-4 pointer-events-none ${isDismissing ? 'animate-slide-down' : 'animate-slide-up'}`}>
            <div className={`max-w-sm mx-auto rounded-xl shadow-2xl border pointer-events-auto ${
                showReconnected
                    ? 'bg-emerald-900/95 border-emerald-500/30'
                    : 'bg-red-900/95 border-red-500/30'
            } backdrop-blur-md`}>
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className={`p-1.5 rounded-lg ${
                        showReconnected ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}>
                        {showReconnected ? (
                            <Wifi className="h-4 w-4 text-emerald-400" />
                        ) : (
                            <WifiOff className="h-4 w-4 text-red-400 animate-pulse" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${showReconnected ? 'text-emerald-100' : 'text-red-100'}`}>
                            {showReconnected ? 'Terhubung Kembali' : 'Koneksi Terputus'}
                        </p>
                        <p className={`text-[10px] ${showReconnected ? 'text-emerald-300/70' : 'text-red-300/70'} leading-snug`}>
                            {showReconnected
                                ? 'Koneksi internet Anda sudah kembali.'
                                : 'Periksa koneksi internet Anda dan coba lagi.'
                            }
                        </p>
                    </div>
                    {!showReconnected && (
                        <button
                            onClick={() => window.location.reload()}
                            className="shrink-0 px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white hover:bg-white/20 transition-all"
                        >
                            Coba Lagi
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
