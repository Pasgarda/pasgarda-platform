import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { ClipboardList, History, CheckCircle, XCircle, Image, X, DollarSign, Ticket, Users, BarChart3, Eye, EyeOff, Square, CheckSquare, ChevronDown, RotateCw, Clock } from 'lucide-react';
import StatusBadge from '../../Components/StatusBadge';
import ScrollReveal from '../../Components/ScrollReveal';
import axios from 'axios';

export default function Payments({ event, pendingApprovals = [], ticketHistory = { data: [], total: 0, last_page: 1, current_page: 1 }, stats = {}, approvalHistory = [], rejectionHistory = [], search: initialSearch = '' }) {

    const [rejectingOrder, setRejectingOrder] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectProcessing, setRejectProcessing] = useState(false);
    const [detailOrder, setDetailOrder] = useState(null);
    const [revealedHashes, setRevealedHashes] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [couponRedeemed, setCouponRedeemed] = useState({});
    const [claimingCoupon, setClaimingCoupon] = useState({});
    const [newTransaction, setNewTransaction] = useState(false);
    const initialPendingCount = useRef(pendingApprovals.length);
    const [pendingCount, setPendingCount] = useState(pendingApprovals.length);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            preserveScroll: true,
            onFinish: () => setIsRefreshing(false)
        });
    };
    const [waContacts, setWaContacts] = useState(event?.wa_contacts || []);
    const [waSaving, setWaSaving] = useState(false);
    const [notificationEmail, setNotificationEmail] = useState(event?.ticket_notification_email || '');
    const [notificationEmailSaving, setNotificationEmailSaving] = useState(false);

    const handleSaveWaContacts = async () => {
        setWaSaving(true);
        try {
            await axios.post(`/admin/events/${event.slug}/payments/contacts`, {
                wa_contacts: waContacts.filter(c => c.name && c.phone),
            });
            router.reload({ only: ['event'], preserveScroll: true });
        } catch (e) {
            alert('Gagal menyimpan kontak WA.');
        } finally {
            setWaSaving(false);
        }
    };

    const handleSaveNotificationEmail = async () => {
        setNotificationEmailSaving(true);
        try {
            await axios.post(`/admin/events/${event.slug}/payments/notification-email`, {
                email: notificationEmail,
            });
            router.reload({ only: ['event'], preserveScroll: true });
        } catch (e) {
            alert('Gagal menyimpan email notifikasi.');
        } finally {
            setNotificationEmailSaving(false);
        }
    };

    // Polling for new pending payments count
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`/admin/events/${event.slug}/payments/poll`);
                if (response.data && typeof response.data.pending_count === 'number') {
                    setPendingCount(response.data.pending_count);
                }
            } catch (err) {
                console.error("Error polling payments count:", err);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [event.slug]);

    // Update pendingCount when page props change (e.g. on manual refresh or approval/rejection)
    useEffect(() => {
        setPendingCount(pendingApprovals.length);
    }, [pendingApprovals.length]);

    // Show notification when pending count increases
    useEffect(() => {
        if (pendingCount > pendingApprovals.length) {
            setNewTransaction(true);
        }
    }, [pendingCount, pendingApprovals.length]);

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => {
            router.get(`/admin/events/${event.slug}/payments`, { search: value || undefined, page: undefined }, { preserveState: true, replace: true });
        }, 400));
    };

    const goToPage = (page) => {
        router.get(`/admin/events/${event.slug}/payments`, { page, search: searchTerm || undefined }, { preserveState: true, replace: true });
    };

    const toggleHash = (id) => {
        setRevealedHashes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleApprove = (orderId) => {
        if (!confirm('Apakah Anda yakin ingin menyetujui pembayaran untuk order ini? Tiket akan otomatis aktif.')) return;
        router.post(`/admin/events/${event.slug}/orders/${orderId}/approve`, {}, {
            preserveScroll: true
        });
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        if (!rejectionReason.trim()) {
            alert('Harap isi alasan penolakan.');
            return;
        }
        setRejectProcessing(true);
        router.post(`/admin/events/${event.slug}/orders/${rejectingOrder.id}/reject`, {
            reason: rejectionReason
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingOrder(null);
                setRejectionReason('');
                setRejectProcessing(false);
            },
            onError: () => {
                setRejectProcessing(false);
            }
        });
    };

    const infoCards = [
        { icon: Ticket, label: 'Pendapatan OTS', value: `Rp ${(stats.total_ots_revenue || 0).toLocaleString('id-ID')}`, color: 'from-amber-500 to-amber-600' },
        { icon: CheckCircle, label: 'Pendapatan Online', value: `Rp ${(stats.total_online_revenue || 0).toLocaleString('id-ID')}`, color: 'from-sky-500 to-sky-600' },
        { icon: DollarSign, label: 'Total Pendapatan', value: `Rp ${(stats.total_revenue || 0).toLocaleString('id-ID')}`, color: 'from-emerald-500 to-emerald-600' },
        { icon: CheckCircle, label: 'Tiket Online', value: stats.total_online || 0, color: 'from-sky-500 to-sky-600' },
        { icon: Ticket, label: 'Tiket OTS', value: stats.total_ots || 0, color: 'from-amber-500 to-amber-600' },
        { icon: BarChart3, label: 'Total Tiket', value: stats.total_tickets || 0, color: 'from-violet-500 to-violet-600' },
        { icon: Users, label: 'Pengunjung (Scan)', value: stats.checked_in || 0, color: 'from-rose-500 to-rose-600' },
    ];

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Pembayaran & Riwayat Tiket - Admin Panel" />

            {newTransaction && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
                    <div className="bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-sm">
                        <span className="text-sm font-semibold">Ada pembayaran baru</span>
                        <button
                            onClick={() => { setNewTransaction(false); handleManualRefresh(); }}
                            className="ml-auto px-3 py-1 bg-amber-500/30 hover:bg-amber-500/40 rounded-lg text-[10px] font-bold text-amber-300 transition-all"
                        >
                            Muat Ulang
                        </button>
                        <button onClick={() => setNewTransaction(false)} className="p-1 hover:bg-white/5 rounded transition-all">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <ScrollReveal>
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Panel Verifikasi & Riwayat
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            <span className="text-gold-primary">Pembayaran</span> &amp; Riwayat Tiket
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; {event.venue}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <a
                            href={`/admin/events/${event.slug}`}
                            className="px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white"
                        >
                            ← Dashboard Event
                        </a>
                        <a
                            href={`/admin/events/${event.slug}/payments/export`}
                            className="px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                        >
                            Download Excel
                        </a>
                    </div>
                </div>
                <div className="flex gap-1.5 mt-4 border-b border-bronze-muted/20 pb-4">
                    <a
                        href={`/admin/events/${event.slug}/ots`}
                        className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white"
                    >
                        Panel Tiket
                    </a>
                    <a
                        href={`/admin/events/${event.slug}/payments`}
                        className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40"
                    >
                        Pembayaran & Riwayat Tiket
                    </a>
                </div>
                </ScrollReveal>

                {/* WA Contact Editor */}
                <ScrollReveal>
                <details className="group bg-white/[0.02] border border-bronze-muted/20 rounded-lg overflow-hidden">
                    <summary className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all text-xs font-semibold text-text-muted">
                        <span>Atur Kontak WA untuk Notifikasi Penolakan</span>
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 py-3 border-t border-bronze-muted/10 space-y-3">
                        {waContacts.map((contact, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={contact.name}
                                onChange={(e) => {
                                    const next = [...waContacts];
                                    next[idx] = { ...next[idx], name: e.target.value };
                                    setWaContacts(next);
                                }}
                                placeholder="Nama"
                                className="w-28 px-2.5 py-1.5 bg-deep-black/60 border border-bronze-muted/20 rounded text-xs text-white placeholder:text-text-muted/40 focus:outline-none focus:border-gold-primary/40 transition-all"
                            />
                            <input
                                type="text"
                                value={contact.phone || ''}
                                onChange={(e) => {
                                    const next = [...waContacts];
                                    next[idx] = { ...next[idx], phone: e.target.value };
                                    setWaContacts(next);
                                }}
                                placeholder="628xxxxxxxxx"
                                className="flex-1 px-2.5 py-1.5 bg-deep-black/60 border border-bronze-muted/20 rounded text-xs text-white font-mono placeholder:text-text-muted/40 focus:outline-none focus:border-gold-primary/40 transition-all"
                            />
                            <button
                                onClick={() => setWaContacts(waContacts.filter((_, i) => i !== idx))}
                                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        ))}
                        <button
                            onClick={() => setWaContacts([...waContacts, { name: '', phone: '' }])}
                            className="text-[10px] font-bold text-gold-light hover:text-gold-bright transition-all flex items-center gap-1"
                        >
                            + Tambah Kontak
                        </button>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveWaContacts}
                                disabled={waSaving}
                                className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                                {waSaving ? 'Menyimpan...' : 'Simpan Kontak'}
                            </button>
                        </div>
                    </div>
                </details>
                </ScrollReveal>

                {/* Notification Email Editor */}
                <ScrollReveal>
                <details className="group bg-white/[0.02] border border-bronze-muted/20 rounded-lg overflow-hidden">
                    <summary className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all text-xs font-semibold text-text-muted">
                        <span>Email Pengirim Notifikasi Tiket</span>
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 py-3 border-t border-bronze-muted/10 space-y-3">
                        <input
                            type="email"
                            value={notificationEmail}
                            onChange={(e) => setNotificationEmail(e.target.value)}
                            placeholder="contoh@gmail.com"
                            className="w-full px-2.5 py-1.5 bg-deep-black/60 border border-bronze-muted/20 rounded text-xs text-white font-mono placeholder:text-text-muted/40 focus:outline-none focus:border-gold-primary/40 transition-all"
                        />
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveNotificationEmail}
                                disabled={notificationEmailSaving}
                                className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                                {notificationEmailSaving ? 'Menyimpan...' : 'Terapkan'}
                            </button>
                        </div>
                    </div>
                </details>
                </ScrollReveal>

                {/* Info Boxes */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {infoCards.map((card, i) => (
                        <ScrollReveal key={i}>
                        <div className="premium-card p-4 border-bronze-muted/20 text-center">
                            <div className={`inline-flex p-2 rounded-full bg-gradient-to-br ${card.color} mb-2`}>
                                <card.icon className="h-4 w-4 text-white" />
                            </div>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">{card.label}</p>
                            <p className="text-sm font-extrabold text-white">{card.value}</p>
                        </div>
                        </ScrollReveal>
                    ))}
                </div>

                {/* Package Breakdown */}
                {stats.package_breakdown?.length > 0 && (
                    <ScrollReveal>
                    <div className="premium-card p-5 border-bronze-muted/20">
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-gold-primary" /> Breakdown per Paket Tiket
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {stats.package_breakdown.map((pkg, i) => (
                                <div key={i} className="bg-white/[0.02] border border-bronze-muted/10 rounded p-3 text-center">
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{pkg.name}</p>
                                    <p className="text-lg font-extrabold text-white mt-1">{pkg.total_tickets} Tiket</p>
                                    <p className="text-[10px] font-mono text-gold-light">Rp {pkg.revenue.toLocaleString('id-ID')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    </ScrollReveal>
                )}

                {/* ===== PERSETUJUAN PEMBAYARAN ===== */}
                <ScrollReveal>
                <div className="premium-card p-6 border-bronze-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-gold-primary" /> Persetujuan Pembayaran
                            {pendingApprovals.length > 0 && (
                                <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                                    {pendingApprovals.length}
                                </span>
                            )}
                        </h2>

                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50 relative"
                        >
                            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span>Perbarui Data</span>
                            {pendingCount > pendingApprovals.length && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] text-white font-bold items-center justify-center">
                                        {pendingCount - pendingApprovals.length}
                                    </span>
                                </span>
                            )}
                        </button>
                    </div>

                    {pendingApprovals.length === 0 ? (
                        <div className="text-center py-12 text-bronze-muted text-xs animate-fade-in">
                            <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            Belum ada permohonan pembayaran yang perlu disetujui.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {pendingApprovals.map((order) => (
                                <div key={order.id} className="bg-white/[0.02] border border-bronze-muted/10 rounded p-3 hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-bold text-white truncate">{order.order_id}</p>
                                        <span className="text-[10px] font-mono text-gold-light shrink-0">Rp {parseFloat(order.total_price).toLocaleString('id-ID')}</span>
                                    </div>
                                    <p className="text-[10px] text-text-muted truncate mt-0.5">{order.user.name} — {order.user.email}</p>
                                    <button
                                        onClick={() => setDetailOrder(order)}
                                        className="mt-2 w-full text-[9px] py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded font-bold uppercase transition-all"
                                    >
                                        Detail & Verifikasi
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </ScrollReveal>

                {/* ===== RIWAYAT PERSETUJUAN & PENOLAKAN ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ScrollReveal>
                    <div className="premium-card border border-bronze-muted/10 overflow-hidden">
                        <div className="p-3 bg-emerald-500/5 border-b border-bronze-muted/10 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            <h2 className="font-bold text-white text-sm">Riwayat Persetujuan</h2>
                            <span className="ml-auto text-[10px] text-text-muted">{approvalHistory.length}</span>
                        </div>
                        {approvalHistory.length === 0 ? (
                            <div className="text-center py-6 text-bronze-muted text-[10px] italic">Belum ada persetujuan.</div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto scroll-smooth">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="sticky top-0 bg-[#0D0C0A]">
                                        <tr className="border-b border-bronze-muted/20 text-[9px] text-text-muted uppercase tracking-wider font-bold">
                                            <th className="p-2">Order</th>
                                            <th className="p-2">Pembeli</th>
                                            <th className="p-2 text-right">Harga</th>
                                            <th className="p-2 text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bronze-muted/10">
                                        {approvalHistory.map((a) => (
                                            <tr key={a.id} className="hover:bg-white/[0.01]">
                                                <td className="p-2 font-mono text-[10px] text-gold-light">{a.order_id}</td>
                                                <td className="p-2 text-white font-semibold">{a.buyer_name}</td>
                                                <td className="p-2 text-right font-mono text-[10px] text-emerald-400">Rp {a.total_price.toLocaleString('id-ID')}</td>
                                                <td className="p-2 text-right text-[10px] text-text-muted whitespace-nowrap">{a.approved_at}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    </ScrollReveal>

                    <ScrollReveal>
                    <div className="premium-card border border-bronze-muted/10 overflow-hidden">
                        <div className="p-3 bg-rose-500/5 border-b border-bronze-muted/10 flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-rose-400" />
                            <h2 className="font-bold text-white text-sm">Riwayat Penolakan</h2>
                            <span className="ml-auto text-[10px] text-text-muted">{rejectionHistory.length}</span>
                        </div>
                        {rejectionHistory.length === 0 ? (
                            <div className="text-center py-6 text-bronze-muted text-[10px] italic">Belum ada penolakan.</div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto scroll-smooth">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="sticky top-0 bg-[#0D0C0A]">
                                        <tr className="border-b border-bronze-muted/20 text-[9px] text-text-muted uppercase tracking-wider font-bold">
                                            <th className="p-2">Order</th>
                                            <th className="p-2">Pembeli</th>
                                            <th className="p-2">Alasan</th>
                                            <th className="p-2 text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bronze-muted/10">
                                        {rejectionHistory.map((r) => (
                                            <tr key={r.id} className="hover:bg-white/[0.01]">
                                                <td className="p-2 font-mono text-[10px] text-rose-300">{r.order_id}</td>
                                                <td className="p-2 text-white font-semibold">{r.buyer_name}</td>
                                                <td className="p-2 text-[10px] text-text-muted max-w-[160px] truncate" title={r.reason}>{r.reason}</td>
                                                <td className="p-2 text-right text-[10px] text-text-muted whitespace-nowrap">{r.rejected_at}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    </ScrollReveal>
                </div>

                {/* ===== RIWAYAT PEMBELIAN TIKET ===== */}
                <ScrollReveal>
                <div className="premium-card border border-bronze-muted/10 overflow-hidden">
                    <div className="p-4 bg-accent-maroon/5 border-b border-bronze-muted/10 flex items-center gap-2">
                        <History className="h-4 w-4 text-gold-primary" />
                        <h2 className="font-bold text-white text-sm">Riwayat Pembelian Tiket</h2>
                        <span className="text-[10px] text-text-muted">{ticketHistory?.total || 0} tiket</span>
                        <div className="ml-auto flex items-center gap-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Cari nama atau kode tiket..."
                                className="px-2.5 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-[10px] w-48"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto text-xs scroll-smooth max-h-96 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#0D0C0A] z-10">
                                <tr className="border-b border-bronze-muted/20 bg-deep-black/60 text-[10px] text-text-muted uppercase tracking-wider font-bold">
                                    <th className="p-3">Nama Pembeli</th>
                                    <th className="p-3">Sumber</th>
                                    <th className="p-3">Kode Tiket (QR Hash)</th>
                                    <th className="p-3 text-center">Sisa Hari</th>
                                    <th className="p-3 text-center">Vote</th>
                                    <th className="p-3 text-center">Kupon</th>
                                    <th className="p-3 text-center">Sharing</th>
                                    <th className="p-3">Vote Untuk</th>
                                    <th className="p-3">Supporter</th>
                                    <th className="p-3 text-center">Waktu</th>
                                    <th className="p-3 text-right">Harga</th>
                                    <th className="p-3 text-center">Bukti</th>
                                    <th className="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bronze-muted/10">
                                {ticketHistory.data.map((t) => (
                                    <tr key={t.id} className="hover:bg-white/[0.01]">
                                        <td className="p-3 font-semibold text-white">{t.buyer_name}</td>
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
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${t.days_remaining > 0 ? 'text-emerald-400' : 'text-text-muted'}`}>
                                                {t.days_remaining || 0} Hari
                                            </span>
                                        </td>
                                        <td className="p-3 text-center text-text-primary/70">{t.vote_tokens_remaining}</td>
                                        <td className="p-3 text-center">
                                            {t.sumber === 'Online' ? (() => {
                                                const remaining = t.coupon_tokens_remaining - (couponRedeemed[t.id] || 0);
                                                const total = t.coupon_tokens_remaining + (couponRedeemed[t.id] || 0);
                                                const claimed = (couponRedeemed[t.id] || 0);
                                                return (
                                                    <div className="flex items-center justify-center gap-1">
                                                        {Array.from({ length: total }, (_, i) => (
                                                            <button
                                                                key={i}
                                                                disabled={claimingCoupon[t.id]}
                                                                onClick={() => handleClaimCouponById(t.id, t.unique_qr_hash, remaining)}
                                                                className={`p-0.5 rounded transition-all ${
                                                                    i < claimed
                                                                        ? 'text-emerald-400 cursor-default'
                                                                        : remaining > 0
                                                                        ? 'text-bronze-muted hover:text-gold-light hover:bg-white/5 cursor-pointer'
                                                                        : 'text-bronze-muted/30 cursor-default'
                                                                }`}
                                                                title={i < claimed ? 'Sudah diklaim' : remaining > 0 ? 'Klik untuk klaim Kupon Produk' : ''}
                                                            >
                                                                {i < claimed ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })() : <span className="text-text-primary/70">{t.coupon_tokens_remaining ?? '-'}</span>}
                                        </td>
                                        <td className="p-3 text-center text-text-primary/70">{t.sharing_tokens_remaining ?? 0}</td>
                                        <td className="p-3 text-[10px] max-w-[120px] truncate" title={t.vote_for}>{t.vote_for}</td>
                                        <td className="p-3 text-[10px] max-w-[120px] truncate" title={t.supporter}>{t.supporter}</td>
                                        <td className="p-3 text-center text-text-muted text-[10px] whitespace-nowrap">{t.created_at}</td>
                                        <td className="p-3 text-right font-mono text-gold-light text-[10px]">Rp {t.total_price.toLocaleString('id-ID')}</td>
                                        <td className="p-3 text-center">
                                            {t.sumber === 'Online' && t.payment_proof ? (
                                                <button
                                                    onClick={() => window.open(`/storage/${t.payment_proof}`, '_blank')}
                                                    className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded text-[9px] font-bold transition-all"
                                                >
                                                    Lihat
                                                </button>
                                            ) : (
                                                <span className="text-text-muted/40 text-[10px]">—</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <a
                                                href={`/tickets/${t.unique_qr_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[9px] px-2 py-1 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded font-bold uppercase transition-all"
                                            >
                                                QR
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                {(!ticketHistory.data || ticketHistory.data.length === 0) && (
                                    <tr>
                                        <td colSpan={12} className="p-6 text-center text-bronze-muted italic animate-fade-in">Belum ada riwayat pembelian tiket.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {ticketHistory?.last_page > 1 && (
                        <div className="p-3 border-t border-bronze-muted/10 flex items-center justify-between text-[10px] text-text-muted">
                            <span>
                                Halaman {ticketHistory.current_page} dari {ticketHistory.last_page} ({ticketHistory.total} tiket)
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => goToPage(ticketHistory.current_page - 1)}
                                    disabled={ticketHistory.current_page === 1}
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-text-primary transition-all"
                                >
                                    ← Prev
                                </button>
                                {ticketHistory.links?.filter(l => !isNaN(l.label)).map((link) => (
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
                                    onClick={() => goToPage(ticketHistory.current_page + 1)}
                                    disabled={ticketHistory.current_page === ticketHistory.last_page}
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

            {/* Detail Persetujuan Pembayaran Modal */}
            {detailOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in" onClick={() => setDetailOrder(null)}>
                    <div className="bg-[#151310] border border-[#8C6828]/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scroll-smooth shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        {/* Header bar */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <ClipboardList className="h-4.5 w-4.5 text-gold-primary" /> 
                                    <span>Persetujuan Pembayaran</span>
                                </h3>
                                <p className="text-[10px] text-text-muted mt-1">Sistem Verifikasi Transaksi Pasgarda</p>
                            </div>
                            <button onClick={() => setDetailOrder(null)} className="p-1.5 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-all">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Order Info & Status Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                <div>
                                    <span className="text-[9px] font-bold tracking-widest text-gold-light uppercase">Order ID</span>
                                    <h4 className="text-base font-black text-white font-mono mt-0.5">{detailOrder.order_id}</h4>
                                    <p className="text-[10px] text-text-muted mt-0.5">Dipesan pada {detailOrder.created_at}</p>
                                </div>
                                <div className="sm:text-right shrink-0">
                                    <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase block mb-1">Status</span>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-extrabold uppercase">
                                        <Clock className="h-3 w-3 animate-pulse" /> Menunggu Verifikasi
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Info & Summary */}
                                <div className="space-y-4">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                                        <h5 className="text-[10px] font-bold tracking-wider text-text-muted uppercase border-b border-white/5 pb-1.5">Informasi Pembeli</h5>
                                        <div className="space-y-1 text-xs">
                                            <p className="text-text-muted">Nama: <strong className="text-white">{detailOrder.user.name}</strong></p>
                                            <p className="text-text-muted">Email: <span className="text-white font-mono">{detailOrder.user.email}</span></p>
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                                        <h5 className="text-[10px] font-bold tracking-wider text-text-muted uppercase border-b border-white/5 pb-1.5">Item Tiket</h5>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                            {detailOrder.tickets_summary.map((tix, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs bg-black/20 rounded-lg p-2.5 border border-white/5">
                                                    <span className="text-white font-semibold">{tix.package_name}</span>
                                                    <span className="font-mono text-gold-light font-bold bg-gold-primary/10 px-2 py-0.5 rounded border border-gold-primary/20">{tix.quantity} Pcs</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                                            <span className="text-xs text-text-muted">Total Pembayaran</span>
                                            <span className="text-base font-black text-gold-bright font-mono">Rp {parseFloat(detailOrder.total_price).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Proof Image Preview */}
                                <div className="space-y-3">
                                    <h5 className="text-[10px] font-bold tracking-wider text-text-muted uppercase">Bukti Transfer</h5>
                                    {detailOrder.payment_proof ? (
                                        <div className="group relative rounded-xl border border-white/10 overflow-hidden bg-black/50 aspect-[4/3] flex items-center justify-center">
                                            <img
                                                src={`/storage/${detailOrder.payment_proof}`}
                                                alt="Bukti Transfer"
                                                className="max-h-full max-w-full object-contain cursor-zoom-in group-hover:scale-[1.02] transition-all duration-300"
                                                onClick={() => window.open(`/storage/${detailOrder.payment_proof}`, '_blank')}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <span className="px-3 py-1.5 bg-black/60 border border-white/20 rounded-lg text-[10px] text-white font-bold flex items-center gap-1">
                                                    <Eye className="h-3 w-3" /> Klik untuk Perbesar
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-white/10 aspect-[4/3] flex flex-col items-center justify-center text-center p-6 text-text-muted bg-white/[0.01]">
                                            <Image className="h-8 w-8 opacity-20 mb-2" />
                                            <p className="text-xs">Belum mengunggah bukti pembayaran</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => { handleApprove(detailOrder.id); setDetailOrder(null); }}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                                >
                                    <CheckCircle className="h-4 w-4" /> Setujui Pembayaran
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setRejectingOrder(detailOrder); setDetailOrder(null); }}
                                    className="sm:w-36 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-extrabold uppercase transition-all flex items-center justify-center gap-1.5"
                                >
                                    <XCircle className="h-4 w-4" /> Tolak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tolak Pembayaran Modal */}
            {rejectingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setRejectingOrder(null)}>
                    <ScrollReveal>
                    <div className="bg-[#1A1814] border border-bronze-muted/20 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleRejectSubmit}>
                            <div className="flex items-center justify-between p-4 border-b border-bronze-muted/10">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-accent-mahogany" /> Tolak Pembayaran
                                </h3>
                                <button type="button" onClick={() => setRejectingOrder(null)} className="p-1 hover:bg-white/5 rounded text-text-muted hover:text-white transition-all">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="bg-deep-black/60 rounded p-3 text-xs space-y-1">
                                    <p><span className="text-text-muted">Order:</span> <strong className="text-white">{rejectingOrder.order_id}</strong></p>
                                    <p><span className="text-text-muted">Pembeli:</span> <strong className="text-white">{rejectingOrder.user.name}</strong></p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Alasan Penolakan <span className="text-accent-mahogany">*</span>
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Contoh: Bukti transfer tidak valid, nominal tidak sesuai, dll."
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs resize-none"
                                        rows={3}
                                        required
                                    />
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {[
                                            'Bukti transfer tidak jelas/tidak terbaca',
                                            'Nominal transfer tidak sesuai',
                                            'Nama pengirim tidak cocok',
                                            'Transfer melebihi batas waktu',
                                            'Data pemesan tidak lengkap',
                                        ].map((template) => (
                                            <button
                                                key={template}
                                                type="button"
                                                onClick={() => setRejectionReason(template)}
                                                className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-all border ${
                                                    rejectionReason === template
                                                        ? 'bg-accent-mahogany/20 border-accent-mahogany/40 text-accent-mahogany'
                                                        : 'bg-white/5 border-bronze-muted/20 text-text-muted hover:text-white'
                                                }`}
                                            >
                                                {template}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRejectingOrder(null)}
                                        className="flex-1 py-2 bg-white/5 border border-bronze-muted/20 text-text-muted hover:text-white rounded text-xs font-bold transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={rejectProcessing}
                                        className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded text-xs tracking-wider uppercase transition-all disabled:opacity-40"
                                    >
                                        {rejectProcessing ? 'Memproses...' : 'Ya, Tolak'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    </ScrollReveal>
                </div>
            )}

        </div>
    );
}
