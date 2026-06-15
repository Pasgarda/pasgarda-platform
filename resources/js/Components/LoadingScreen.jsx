import React from 'react';

export default function LoadingScreen({ visible, message = 'Memproses...' }) {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-deep-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-2 border-bronze-muted/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-gold-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                <p className="text-xs font-bold text-gold-light uppercase tracking-widest animate-pulse">{message}</p>
            </div>
        </div>
    );
}
