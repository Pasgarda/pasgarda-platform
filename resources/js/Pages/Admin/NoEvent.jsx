import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CalendarX } from 'lucide-react';

export default function NoEvent({ message }) {
    return (
        <div className="min-h-screen bg-checkerboard flex items-center justify-center p-4">
            <Head title="No Event" />
            <div className="w-full max-w-md premium-card p-8 border border-[#8C6828]/30 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon"></div>
                <CalendarX className="h-16 w-16 text-gold-primary mx-auto mb-4 opacity-60" />
                <h2 className="text-xl font-bold text-white mb-2">Event Tidak Ditemukan</h2>
                <p className="text-sm text-text-muted leading-relaxed">{message}</p>
                <Link href="/" className="inline-block mt-6 px-4 py-2 bg-accent-maroon hover:bg-accent-burgundy text-white text-xs font-bold rounded transition-all">
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}