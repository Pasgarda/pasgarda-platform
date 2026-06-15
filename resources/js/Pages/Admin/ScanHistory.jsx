import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Search, ArrowLeft, Eye, EyeOff, Scan } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

export default function ScanHistory({ event, tickets, search: initialSearch }) {
    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [searchTimeout, setSearchTimeout] = useState(null);

    const [revealedHashes, setRevealedHashes] = useState(new Set());
    const toggleHash = (id) => {
        setRevealedHashes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        const t = setTimeout(() => {
            router.get(`/admin/events/${event.slug}/tickets/scan-history`, { search: value || undefined }, { preserveState: true, replace: true });
        }, 400);
        setSearchTimeout(t);
    };

    const goToPage = (page) => {
        router.get(`/admin/events/${event.slug}/tickets/scan-history`, { page, search: searchTerm || undefined }, { preserveState: true, replace: true });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Riwayat Scan Tiket" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Riwayat Scan Tiket
                        </span>
                        <h1 className="text-2xl font-extrabold text-white mt-2">
                            Riwayat <span className="text-gold-primary">Scan Tiket</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; {event.venue}</p>
                    </div>
                    <a
                        href={`/admin/events/${event.slug}/ots`}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-bronze-muted/20 rounded text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Panel OTS
                    </a>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Cari nama pembeli atau kode tiket..."
                            className="w-full pl-8 pr-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                        />
                    </div>
                    <span className="text-[10px] text-text-muted">{tickets.total} tiket ditemukan</span>
                </div>

                {/* Table */}
                <ScrollReveal>
                    <div className="premium-card overflow-hidden border border-bronze-muted/10">
                    <div className="overflow-x-auto scroll-smooth">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Nama Pembeli</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Kode Tiket</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Sumber</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Paket Tiket</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Sisa Hari</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Vote</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Doorprize</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Produk</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Vote Untuk</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-right">Waktu</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bronze-muted/10">
                                {tickets.data.map((t) => (
                                    <tr key={t.id} className="hover:bg-white/[0.01]">
                                        <td className="p-3 font-semibold text-white">{t.buyer_name}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-[10px] text-gold-light">
                                                    {revealedHashes.has(t.id) ? t.unique_qr_hash : t.unique_qr_hash.slice(0, 10) + '...'}
                                                </span>
                                                <button onClick={() => toggleHash(t.id)} className="p-0.5 text-text-muted hover:text-white transition-all shrink-0">
                                                    {revealedHashes.has(t.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                t.sumber === 'OTS'
                                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                            }`}>
                                                {t.sumber}
                                            </span>
                                            {t.sumber === 'OTS' && t.ots_payment_type && (
                                                <span className="ml-1 px-1 py-0.5 bg-gold-primary/10 text-gold-primary font-bold rounded text-[8px] uppercase leading-tight">
                                                    {t.ots_payment_type === 'qris' ? 'QRIS' : 'Tunai'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-text-primary/70">{t.ticket_package?.name || '-'}</td>
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${t.days_remaining > 0 ? 'text-emerald-400' : 'text-text-muted'}`}>
                                                {t.days_remaining || 0}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center text-text-primary/70">{t.vote_tokens_remaining}</td>
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${t.sumber === 'OTS' && t.coupon_tokens_remaining > 0 ? 'text-white' : 'text-text-muted'}`}>
                                                {t.sumber === 'OTS' ? t.coupon_tokens_remaining : '-'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${t.sumber !== 'OTS' && t.coupon_tokens_remaining > 0 ? 'text-white' : 'text-text-muted'}`}>
                                                {t.sumber !== 'OTS' ? t.coupon_tokens_remaining : '-'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-[10px]">
                                            {t.vote_history?.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {t.vote_history.map((day, i) => (
                                                        <div key={i}>
                                                            <span className="text-text-muted text-[9px]">{day.day}:</span>
                                                            {day.logs.map((log, j) => (
                                                                <span key={j} className="block text-text-primary/80">
                                                                    {log.time} → {log.contingent_name} ({log.votes}x)
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-text-muted italic">-</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right text-text-muted text-[10px] whitespace-nowrap">
                                            {formatDate(t.created_at)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <a
                                                href={`/admin/events/${event.slug}/ots`}
                                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/10 rounded font-semibold text-[10px] transition-all inline-flex items-center gap-1"
                                            >
                                                <Scan className="h-3 w-3" /> Scan Tiket
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.data.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="p-8 text-center text-bronze-muted italic">
                                            {initialSearch ? 'Tidak ada tiket yang cocok dengan pencarian.' : 'Belum ada tiket yang diterbitkan.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tickets.last_page > 1 && (
                        <div className="p-3 border-t border-bronze-muted/10 flex items-center justify-between text-[10px] text-text-muted">
                            <span>
                                Halaman {tickets.current_page} dari {tickets.last_page} ({tickets.total} tiket)
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => goToPage(tickets.current_page - 1)}
                                    disabled={tickets.current_page === 1}
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-text-primary transition-all"
                                >
                                    ← Prev
                                </button>
                                {tickets.links?.filter(l => !isNaN(l.label)).map((link) => (
                                    <button
                                        key={link.label}
                                        onClick={() => goToPage(link.label)}
                                        className={`px-2 py-1 rounded transition-all ${
                                            link.active
                                                ? 'bg-gold-primary/20 text-gold-light border border-gold-primary/30'
                                                : 'bg-white/5 hover:bg-white/10 text-text-primary'
                                        }`}
                                    >
                                        {link.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => goToPage(tickets.current_page + 1)}
                                    disabled={tickets.current_page === tickets.last_page}
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-text-primary transition-all"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                        )}
                    </div>
                </ScrollReveal>
            </div>


        </div>
    );
}
