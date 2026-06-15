import React from 'react';
import { Head } from '@inertiajs/react';
import { Download, FileSpreadsheet, ArrowLeft } from 'lucide-react';

export default function DataExport({ event, auth }) {
    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Platform Control Room - Export" />
            <div className="max-w-3xl mx-auto pt-8 space-y-8">
                <a href={`/admin/events/${event.slug}`} className="inline-flex items-center gap-1.5 text-xs text-bronze-muted hover:text-gold-light transition-all">
                    <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Dashboard
                </a>

                <div className="premium-card p-8 border border-bronze-muted/20 text-center">
                    <FileSpreadsheet className="h-16 w-16 text-gold-primary mx-auto mb-4" />
                    <h1 className="text-2xl font-extrabold text-white mb-2">Platform Control Room</h1>
                    <p className="text-xs text-text-muted mb-8">Ekspor seluruh data platform PASGARDA ke dalam satu file Excel (.xlsx) dengan 11 sheet.</p>

                    <a
                        href={`/admin/events/${event.slug}/export`}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-bold rounded text-sm tracking-wide hover:brightness-110 transition-all"
                    >
                        <Download className="h-5 w-5" />
                        <span>Download Excel (.xlsx)</span>
                    </a>

                    <div className="mt-8 text-left">
                        <h3 className="text-sm font-bold text-white mb-4 border-b border-bronze-muted/10 pb-2">11 Sheet termasuk:</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                            {['Ringkasan Keuangan', 'Pesanan', 'Tiket Terbit', 'Kontingen & Nilai', 'Final Round', 'Daftar Juara', 'Vote Log', 'Supporter Log', 'Merchandise', 'Sosmed Likes', 'Users'].map((sheet) => (
                                <div key={sheet} className="flex items-center gap-2 p-2 bg-white/5 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5 text-gold-primary shrink-0" />
                                    <span>{sheet}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}