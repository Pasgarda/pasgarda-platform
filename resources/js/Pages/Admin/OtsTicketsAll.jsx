import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Search, ArrowLeft, QrCode, X, Eye, EyeOff, Download, Ticket, DollarSign, Users, Package } from 'lucide-react';
import axios from 'axios';
import StatusBadge from '../../Components/StatusBadge';
import ScrollReveal from '../../Components/ScrollReveal';

export default function OtsTicketsAll({ event, tickets, search: initialSearch, stats, flash }) {
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

    const [historyModal, setHistoryModal] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchHistory = async (qrHash, buyerName) => {
        setHistoryModal(buyerName);
        setHistoryData(null);
        setHistoryLoading(true);
        try {
            const res = await axios.post('/api/tickets/scan', { qr_hash: qrHash });
            setHistoryData(res.data);
        } catch (e) {
            setHistoryData({ success: false, message: 'Gagal memuat riwayat.' });
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        const t = setTimeout(() => {
            router.get(`/admin/events/${event.slug}/platform/tickets`, { search: value || undefined }, { preserveState: true, replace: true });
        }, 400);
        setSearchTimeout(t);
    };

    const goToPage = (page) => {
        router.get(`/admin/events/${event.slug}/platform/tickets`, { page, search: searchTerm || undefined }, { preserveState: true, replace: true });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    };

    const formatRp = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

    const pct = (val, total) => total > 0 ? ((val / total) * 100).toFixed(1) : 0;

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Semua Tiket" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Semua Tiket
                        </span>
                        <h1 className="text-2xl font-extrabold text-white mt-2">
                            Semua <span className="text-gold-primary">Tiket</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; {event.venue}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={`/admin/events/${event.slug}`}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-bronze-muted/20 rounded text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard Event
                        </a>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <ScrollReveal>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Tiket */}
                        <div className="premium-card p-4 border-bronze-muted/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Ticket className="h-4 w-4 text-gold-primary" />
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Tiket</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center mb-2">
                                <div>
                                    <p className="text-lg font-extrabold text-gold-light">{stats.total_ots.toLocaleString()}</p>
                                    <p className="text-[9px] text-text-muted">OTS</p>
                                </div>
                                <div>
                                    <p className="text-lg font-extrabold text-emerald-400">{stats.total_online.toLocaleString()}</p>
                                    <p className="text-[9px] text-text-muted">Online</p>
                                </div>
                                <div>
                                    <p className="text-lg font-extrabold text-white">{stats.total_all.toLocaleString()}</p>
                                    <p className="text-[9px] text-text-muted">Total</p>
                                </div>
                            </div>
                            <div className="w-full bg-deep-black/60 rounded-full h-1.5 overflow-hidden">
                                <div className="flex h-full">
                                    <div className="bg-gold-primary h-full transition-all" style={{ width: pct(stats.total_ots, stats.total_all) + '%' }} />
                                    <div className="bg-emerald-400 h-full transition-all" style={{ width: pct(stats.total_online, stats.total_all) + '%' }} />
                                </div>
                            </div>
                            <div className="flex justify-between text-[8px] text-text-muted mt-1">
                                <span>OTS {pct(stats.total_ots, stats.total_all)}%</span>
                                <span>Online {pct(stats.total_online, stats.total_all)}%</span>
                            </div>
                        </div>

                        {/* Revenue */}
                        <div className="premium-card p-4 border-bronze-muted/20">
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="h-4 w-4 text-emerald-400" />
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Pendapatan</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center mb-2">
                                <div>
                                    <p className="text-sm font-extrabold text-gold-light">{formatRp(stats.revenue_ots)}</p>
                                    <p className="text-[9px] text-text-muted">OTS</p>
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-emerald-400">{formatRp(stats.revenue_online)}</p>
                                    <p className="text-[9px] text-text-muted">Online</p>
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-white">{formatRp(stats.revenue_total)}</p>
                                    <p className="text-[9px] text-text-muted">Total</p>
                                </div>
                            </div>
                            <div className="w-full bg-deep-black/60 rounded-full h-1.5 overflow-hidden">
                                <div className="flex h-full">
                                    <div className="bg-gold-primary h-full transition-all" style={{ width: pct(stats.revenue_ots, stats.revenue_total) + '%' }} />
                                    <div className="bg-emerald-400 h-full transition-all" style={{ width: pct(stats.revenue_online, stats.revenue_total) + '%' }} />
                                </div>
                            </div>
                            <div className="flex justify-between text-[8px] text-text-muted mt-1">
                                <span>OTS {pct(stats.revenue_ots, stats.revenue_total)}%</span>
                                <span>Online {pct(stats.revenue_online, stats.revenue_total)}%</span>
                            </div>
                        </div>

                        {/* Kunjungan */}
                        <div className="premium-card p-4 border-bronze-muted/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Users className="h-4 w-4 text-sky-400" />
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Kunjungan</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-center mb-2">
                                <div>
                                    <p className="text-lg font-extrabold text-emerald-400">{stats.checked_in.toLocaleString()}</p>
                                    <p className="text-[9px] text-text-muted">Telah Berkunjung</p>
                                </div>
                                <div>
                                    <p className="text-lg font-extrabold text-amber-400">{stats.not_checked_in.toLocaleString()}</p>
                                    <p className="text-[9px] text-text-muted">Belum Berkunjung</p>
                                </div>
                            </div>
                            <div className="w-full bg-deep-black/60 rounded-full h-1.5 overflow-hidden">
                                <div className="flex h-full">
                                    <div className="bg-emerald-400 h-full transition-all" style={{ width: pct(stats.checked_in, stats.checked_in + stats.not_checked_in) + '%' }} />
                                    <div className="bg-amber-400 h-full transition-all" style={{ width: pct(stats.not_checked_in, stats.checked_in + stats.not_checked_in) + '%' }} />
                                </div>
                            </div>
                            <div className="flex justify-between text-[8px] text-text-muted mt-1">
                                <span>{pct(stats.checked_in, stats.checked_in + stats.not_checked_in)}% sudah</span>
                                <span>{pct(stats.not_checked_in, stats.checked_in + stats.not_checked_in)}% belum</span>
                            </div>
                        </div>

                        {/* Package Breakdown */}
                        <div className="premium-card p-4 border-bronze-muted/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="h-4 w-4 text-purple-400" />
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Per Paket</span>
                            </div>
                            <div className="space-y-1.5">
                                {stats.package_breakdown?.map((pkg, i) => (
                                    <div key={i} className="flex items-center justify-between text-[10px]">
                                        <span className="text-text-primary/80">{pkg.name}</span>
                                        <div className="flex gap-2">
                                            <span className="text-gold-light font-semibold">{pkg.ots} OTS</span>
                                            <span className="text-emerald-400 font-semibold">{pkg.online} Online</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    </ScrollReveal>
                )}

                {/* Flash Status */}
                {flash?.status && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400">
                        {flash.status}
                    </div>
                )}

                {/* Export + Search + Demo */}
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
                    <a
                        href={`/admin/events/${event.slug}/ots/export`}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                        <Download className="h-3.5 w-3.5" /> Export Excel
                    </a>
                    {!stats?.has_checked_in_data && (
                        <button
                            type="button"
                            onClick={() => router.post(`/admin/events/${event.slug}/ots/seed-demo`)}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
                        >
                            Isi Data Demo
                        </button>
                    )}
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
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Paket</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Sisa Hari</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Vote</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Kupon</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Check-In</th>
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
                                        <td className="p-3 text-center text-text-primary/70">{t.coupon_tokens_remaining}</td>
                                        <td className="p-3 text-center">
                                            <span className={`text-[10px] font-semibold ${t.check_in_status ? 'text-emerald-400' : 'text-text-muted'}`}>
                                                {t.check_in_status ? '✓' : '-'}
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
                                            <button
                                                onClick={() => fetchHistory(t.unique_qr_hash, t.buyer_name)}
                                                className="px-2 py-1 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded font-semibold text-[10px] transition-all"
                                            >
                                                QR
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.data.length === 0 && (
                                    <tr>
                                        <td colSpan={11} className="p-8 text-center text-bronze-muted italic animate-fade-in">
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

            {/* QR + Riwayat Modal */}
            {historyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in" onClick={() => setHistoryModal(null)}>
                    <ScrollReveal>
                    <div className="bg-[#1A1814] border border-bronze-muted/20 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto scroll-smooth" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-bronze-muted/10">
                            <div className="flex items-center gap-2">
                                <QrCode className="h-4 w-4 text-gold-primary" />
                                <h3 className="text-sm font-bold text-white">{historyModal}</h3>
                            </div>
                            <button onClick={() => setHistoryModal(null)} className="p-1 hover:bg-white/5 rounded text-text-muted hover:text-white transition-all">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {historyLoading ? (
                                <p className="text-xs text-text-muted text-center py-4">Memuat riwayat...</p>
                            ) : historyData?.success ? (
                                <>
                                    <div className="flex justify-center">
                                        <div className="p-2 bg-white rounded-lg inline-block">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/tickets/' + (historyData.qr_hash || ''))}`}
                                                alt="QR"
                                                className="h-40 w-40 object-contain"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-deep-black/40 rounded p-3 space-y-1 text-[11px] text-text-primary/80">
                                        <p>Paket: <strong className="text-gold-light">{historyData.package_name}</strong></p>
                                        <p>Sisa Hari: <strong className="text-white">{historyData.days_remaining}</strong></p>
                                        <p>Vote Tokens: <strong className="text-white">{historyData.vote_tokens}</strong></p>
                                        <p>Kupon Doorprize: <strong className="text-white">{historyData.coupon_tokens}</strong></p>
                                    </div>

                                    {historyData.vote_history && Object.keys(historyData.vote_history).length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Riwayat Vote</p>
                                            {Object.entries(historyData.vote_history).map(([day, logs]) => (
                                                <div key={day} className="bg-deep-black/40 rounded p-2 mb-1.5 text-[10px]">
                                                    <p className="font-semibold text-white mb-1 text-[11px]">{day}</p>
                                                    {logs.map((log, i) => (
                                                        <p key={i} className="text-text-primary/80 ml-1">
                                                            {log.time} → {log.contingent_name}: <strong className="text-white">{log.votes} vote</strong>
                                                        </p>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {historyData.supporter_history?.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Riwayat Supporter</p>
                                            {historyData.supporter_history.map((s, i) => (
                                                <div key={i} className="bg-deep-black/40 rounded p-2 mb-1 text-[10px]">
                                                    {s.date} {s.time} → <strong className="text-gold-light">{s.contingent_name}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!historyData.vote_history && !historyData.supporter_history?.length && (
                                        <p className="text-[10px] text-text-muted text-center italic animate-fade-in">Belum ada aktivitas vote atau supporter.</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-accent-mahogany text-center py-4">{historyData?.message || 'Gagal memuat data.'}</p>
                            )}
                        </div>
                    </div>
                    </ScrollReveal>
                </div>
            )}
        </div>
    );
}
