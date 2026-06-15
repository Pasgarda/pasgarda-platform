import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Gift, Ticket, Calendar, MapPin, ArrowLeft, Star, Receipt, Download, Clock, X, Pencil, Check } from 'lucide-react';
import StatusBadge from '../../Components/StatusBadge';
import ScrollReveal from '../../Components/ScrollReveal';

function groupByPackage(tickets) {
  const map = {};
  tickets.forEach((t) => {
    if (!map[t.package_name]) map[t.package_name] = [];
    map[t.package_name].push(t);
  });
  return map;
}

function groupByOrder(tickets) {
  const map = {};
  tickets.forEach((t) => {
    if (!map[t.order_id]) map[t.order_id] = [];
    map[t.order_id].push(t);
  });
  return map;
}

export default function MyTickets({ groupedTickets, contingentsByEvent, activeEvent, auth, allOrders, testimonial }) {

    const [testiRating, setTestiRating] = useState(testimonial?.rating || 0);
    const [testiHover, setTestiHover] = useState(0);
    const [testiMessage, setTestiMessage] = useState(testimonial?.message || '');
    const [testiSubmitting, setTestiSubmitting] = useState(false);
    const [testiError, setTestiError] = useState('');
    const [testiSaved, setTestiSaved] = useState(false);
    const [editingTesti, setEditingTesti] = useState(!testimonial);

    const [enlargedQr, setEnlargedQr] = useState(null);
    const [clipboardMsg, setClipboardMsg] = useState('');

    const copyToClipboard = async (text, single = false) => {
        try {
            await navigator.clipboard.writeText(text);
            setClipboardMsg(single ? 'Link tiket telah tersalin ke papan klip' : 'Semua tiket telah tersalin ke papan klip');
        } catch {
            setClipboardMsg('Gagal menyalin ke papan klip');
        }
        setTimeout(() => setClipboardMsg(''), 2000);
    };

    const copySingleTicket = (t) => {
        const url = `${window.location.origin}/tickets/${t.unique_qr_hash}`;
        copyToClipboard(url, true);
    };

    const downloadAllQr = (allTicketsArray, eventName) => {
        const printWin = window.open('', '_blank');
        if (!printWin) return;
        printWin.document.write(`<!DOCTYPE html><html><head><title>QR Tiket - ${eventName}</title>
<style>
@page { margin: 10mm; }
body { font-family: sans-serif; margin: 0; padding: 20px; }
h1 { font-size: 18px; text-align: center; margin-bottom: 20px; color: #333; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; page-break-inside: avoid; }
.card img { width: 100%; max-width: 120px; height: auto; margin: 0 auto; display: block; }
.card .label { font-size: 9px; color: #555; margin-top: 4px; word-break: break-all; }
.card .status { font-size: 8px; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 2px; }
@media print { .no-print { display: none; } }
</style></head><body>
<div class="no-print" style="text-align:center;margin-bottom:16px">
<button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer">Cetak / Simpan PDF</button>
</div>
<h1>QR Tiket - ${eventName}</h1>
<div class="grid">`);
        allTicketsArray.forEach((t) => {
            const origin = window.location.origin;
            const qrUrl = origin + '/tickets/' + t.unique_qr_hash;
            const statusBadge = t.check_in_status
                ? '<span class="status" style="background:#d1fae5;color:#065f46">CHECKED-IN</span>'
                : '<span class="status" style="background:#fef3c7;color:#92400e">AKTIF</span>';
            printWin.document.write(
                '<div class="card">'
                + '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(qrUrl) + '" alt="QR" crossorigin="anonymous" />'
                + '<div class="label"><strong>' + (t.buyer_name || '-') + '</strong></div>'
                + '<div class="label" style="font-size:7px">' + t.unique_qr_hash + '</div>'
                + '<div class="label">' + t.package_name + ' | ' + t.days_remaining + ' hari' + (t.days_remaining <= 0 ? ' (habis)' : '') + ' | ' + t.vote_tokens_remaining + ' suara</div>'
                + statusBadge
                + '</div>'
            );
        });
        printWin.document.write('</div></body></html>');
        printWin.document.close();
    };

    const readError = (e) => {
        if (e.response?.data?.errors) {
            const firstField = Object.values(e.response.data.errors)[0];
            return Array.isArray(firstField) ? firstField[0] : firstField;
        }
        return e.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
    };


    const handleTestiSubmit = async (e) => {
        e.preventDefault();
        setTestiError('');
        if (testiRating === 0) {
            setTestiError('Pilih rating terlebih dahulu.');
            return;
        }
        setTestiSubmitting(true);
        try {
            if (testimonial) {
                await axios.put(`/testimonials/${testimonial.id}`, { rating: testiRating, message: testiMessage });
            } else {
                await axios.post('/testimonials', { rating: testiRating, message: testiMessage });
            }
            setTestiSaved(true);
        } catch (err) {
            setTestiError(readError(err));
        } finally {
            setTestiSubmitting(false);
        }
    };

    const hasTickets = groupedTickets && groupedTickets.length > 0;
    const hasOrders = allOrders && allOrders.length > 0;

    if (!hasTickets && !hasOrders) {
        return (
            <div className="min-h-screen bg-checkerboard flex flex-col items-center justify-center p-4">
                <Head title="Tiket Saya" />
                <div className="text-center max-w-sm premium-card p-8 border border-bronze-muted/20 animate-fade-in">
                    <Ticket className="h-16 w-16 text-gold-primary mx-auto mb-4" />
                    <h1 className="text-2xl font-extrabold text-white mb-2">Belum Ada Tiket</h1>
                    <p className="text-xs text-text-muted mb-8">Kamu belum memiliki tiket aktif. Yuk beli tiket sekarang!</p>
                    <div className="flex flex-col gap-3">
                        {activeEvent ? (
                            <Link href={`/events/${activeEvent.slug}/tickets`}
                                className="px-6 py-3 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-extrabold rounded text-xs tracking-wider uppercase hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                            >
                                <span>Beli Tiket Sekarang</span>
                            </Link>
                        ) : (
                            <Link href="/"
                                className="px-6 py-3 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-extrabold rounded text-xs tracking-wider uppercase hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                            >
                                <span>Lihat Event Aktif</span>
                            </Link>
                        )}
                        <Link href="/" className="text-xs text-bronze-muted hover:text-white transition-all mt-2">
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-checkerboard">
            <Head title="Tiket Saya" />



            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <ScrollReveal>
                    <div className="mb-8 flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider">
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </Link>
                        {activeEvent && (
                            <Link href={`/events/${activeEvent.slug}/tickets`}
                                className="px-3 py-1.5 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-extrabold rounded text-[10px] tracking-wider uppercase hover:brightness-110 transition-all flex items-center gap-1.5"
                            >
                                + Beli Tiket Lagi
                            </Link>
                        )}
                    </div>

                    <h1 className="text-3xl font-extrabold text-white mb-2">
                        Tiket <span className="text-gold-primary">Saya</span>
                    </h1>
                    <p className="text-sm text-text-muted mb-4">Semua tiket online yang sudah kamu beli.</p>

                    {/* Ticket Summary */}
                    {hasTickets && (() => {
                        const allTickets = groupedTickets.flatMap(g => g.tickets);
                        const total = allTickets.length;
                        const aktif = allTickets.filter(t => !t.check_in_status && t.days_remaining > 0).length;
                        const checkedIn = allTickets.filter(t => t.check_in_status).length;
                        const totalSuara = allTickets.reduce((s, t) => s + (t.vote_tokens_remaining || 0), 0);
                        const rejected = allOrders
                            .filter(o => o.payment_status === 'failed')
                            .reduce((sum, o) => sum + o.tickets_summary.reduce((s, t) => s + t.quantity, 0), 0);
                        const expired = allTickets.filter(t => t.days_remaining <= 0 && !t.check_in_status).length;
                        return (
                            <div className="flex flex-wrap gap-3 mb-6 text-xs">
                                <span className="px-3 py-1.5 bg-deep-black/60 border border-bronze-muted/20 rounded font-semibold text-text-primary">
                                    Total Tiket: <strong className="text-white">{total}</strong>
                                </span>
                                <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded font-semibold text-emerald-400">
                                    Aktif: <strong className="text-white">{aktif}</strong>
                                </span>
                                <span className="px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded font-semibold text-sky-400">
                                    Check-In: <strong className="text-white">{checkedIn}</strong>
                                </span>
                                <span className="px-3 py-1.5 bg-gold-primary/10 border border-gold-primary/20 rounded font-semibold text-gold-light">
                                    Suara: <strong className="text-white">{totalSuara}</strong>
                                </span>
                                {expired > 0 && (
                                    <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded font-semibold text-rose-300">
                                        Kadaluarsa: <strong className="text-white">{expired}</strong>
                                    </span>
                                )}
                                {rejected > 0 && (
                                    <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded font-semibold text-rose-300">
                                        Ditolak: <strong className="text-white">{rejected}</strong>
                                    </span>
                                )}
                            </div>
                        );
                    })()}
                </ScrollReveal>

                {/* ===== ORDER LIST (COMPACT) ===== */}
                {hasOrders && (
                    <div className="mb-10 space-y-4">
                        <h2 className="text-lg font-extrabold text-white flex items-center gap-2 border-l-4 border-gold-primary pl-3">
                            <Receipt className="h-5 w-5 text-gold-primary" />
                            <span>Riwayat Pesanan</span>
                        </h2>

                        <div className="space-y-3">
                            {allOrders.map((order) => {
                                const statusConfig = {
                                    paid: { label: 'Lunas', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: '✅' },
                                    failed: { label: 'Ditolak', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', icon: '❌' },
                                    pending: order.payment_proof
                                        ? { label: 'Menunggu Verifikasi', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30', icon: '⏳' }
                                        : { label: 'Belum Bayar', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', icon: '💳' },
                                };
                                const status = statusConfig[order.payment_status] || statusConfig.pending;

                                return (
                                    <Link key={order.id} href={`/orders/${order.id}`}
                                        className={`block premium-card p-4 border ${status.border} hover:border-gold-primary/40 transition-all group`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono font-bold text-white">{order.order_id}</span>
                                                    <StatusBadge status={order.payment_status} label={status.label === 'Menunggu Verifikasi' ? 'Menunggu' : status.label} />
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-text-muted">
                                                    {order.tickets_summary.map((tix, i) => (
                                                        <span key={i}>{tix.package_name} ×{tix.quantity}</span>
                                                    ))}
                                                </div>
                                                <span className="text-[9px] text-text-muted mt-0.5 block">{order.created_at} • {order.event_name}</span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-sm font-black text-white font-mono block">Rp {parseFloat(order.total_price).toLocaleString('id-ID')}</span>
                                                <span className="text-[10px] text-text-muted">{order.total_tickets} tiket</span>
                                            </div>
                                            <span className="text-text-muted group-hover:text-gold-light transition-all text-xs shrink-0">→</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}


                {/* ===== TESTIMONIAL SECTION (INLINE) ===== */}
                <ScrollReveal>
                <div className="mb-10">
                    <div className="premium-card p-6 border border-bronze-muted/20 bg-gradient-to-r from-[#2A1A0A]/40 to-deep-black/60">
                        <div className="flex items-center gap-2 mb-1">
                            <Star className="h-5 w-5 text-gold-primary fill-gold-primary" />
                            <h2 className="text-base font-bold text-white">Bagikan Pengalaman Menonton Anda</h2>
                        </div>
                        <p className="text-xs text-text-muted mb-6">
                            {testimonial
                                ? 'Testimoni Anda saat ini. Edit atau perbarui di bawah.'
                                : 'Berikan rating dan kesan Anda menonton LOMBA BARIS GARDA 55. Testimoni terpilih akan ditampilkan di beranda.'}
                        </p>

                        {testimonial && !editingTesti && (
                            <div className="relative mb-4 p-4 bg-white/5 rounded border border-bronze-muted/10 text-xs">
                                <button type="button" onClick={() => { setEditingTesti(true); setTestiRating(testimonial.rating); setTestiMessage(testimonial.message); }}
                                    className="absolute top-2 right-2 px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border border-bronze-muted/30 text-bronze-muted hover:bg-white/5 hover:text-white flex items-center gap-1.5"
                                >
                                    <Pencil className="h-3 w-3" /> Edit
                                </button>
                                <div className="flex items-center gap-2 pr-20">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`h-4 w-4 ${s <= testimonial.rating ? 'fill-gold-primary text-gold-primary' : 'text-bronze-muted/30'}`} />
                                    ))}
                                    <StatusBadge status={testimonial.status} label={testimonial.status === 'enabled' ? 'Ditampilkan' : testimonial.status === 'disabled' ? 'Ditolak' : 'Menunggu'} />
                                </div>
                                <p className="text-text-primary/80 mt-1 italic pr-20">&ldquo;{testimonial.message}&rdquo;</p>
                            </div>
                        )}

                        {(!testimonial || editingTesti) && (
                            <form onSubmit={handleTestiSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button key={star} type="button"
                                                onClick={() => setTestiRating(star)}
                                                onMouseEnter={() => setTestiHover(star)}
                                                onMouseLeave={() => setTestiHover(0)}
                                                className="p-1 transition-all"
                                            >
                                                <Star className={`h-7 w-7 ${
                                                    (testiHover || testiRating) >= star
                                                        ? 'fill-gold-primary text-gold-primary'
                                                        : 'text-bronze-muted/40'
                                                } transition-all`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Pesan</label>
                                    <textarea value={testiMessage} onChange={(e) => setTestiMessage(e.target.value)}
                                        rows={3} maxLength={2000} required
                                        className="block w-full px-4 py-3 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-sm resize-none"
                                        placeholder="Tulis pengalaman Anda..."
                                    />
                                    <p className="text-[9px] text-text-muted mt-1 text-right">{testiMessage.length}/2000</p>
                                </div>

                                {testiError && (
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs">
                                        <p className="font-semibold">{testiError}</p>
                                    </div>
                                )}

                                <button type="submit" disabled={testiSubmitting}
                                    className="w-full py-2.5 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-bold rounded text-xs uppercase tracking-wider transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {testiSubmitting ? (
                                        <><Clock className="h-4 w-4" /> Menyimpan...</>
                                    ) : (
                                        <><Star className="h-4 w-4 fill-current" />
                                        <span>{testimonial ? 'Perbarui Testimoni' : 'Kirim Testimoni'}</span></>
                                    )}
                                </button>

                                {testiSaved && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setTestiSaved(false)}>
                                        <div className="premium-card max-w-sm w-full p-6 border border-emerald-500/30" onClick={(e) => e.stopPropagation()}>
                                            <h4 className="text-sm font-extrabold text-white mb-2 flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-400" /> Testimoni Tersimpan
                                            </h4>
                                            <p className="text-xs text-text-primary/80 mb-4">Testimoni Anda telah berhasil disimpan dan akan ditinjau oleh admin.</p>
                                            <button onClick={() => { setTestiSaved(false); setTimeout(() => window.location.reload(), 50); }}
                                                className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold rounded text-xs transition-all border border-emerald-500/30"
                                            >
                                                Tutup
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </div>
                </ScrollReveal>

                {/* ===== PAID TICKETS SECTION ===== */}
                {groupedTickets.map((group) => {
                    const orderGroups = groupByOrder(group.tickets);
                    const orderIds = Object.keys(orderGroups).sort((a, b) => b - a);

                    return (
                        <div key={group.event.id} className="mb-10">
                            {/* Event Header */}
                            <div className="flex items-start gap-3 mb-4 border-l-4 border-gold-primary pl-3">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-extrabold text-white">{group.event.name}</h2>
                                    <p className="text-[11px] text-text-muted flex items-center gap-3 mt-0.5">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {group.event.date_start} - {group.event.date_end}</span>
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {group.event.venue}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => {
                                        const allTickets = group.tickets;
                                        downloadAllQr(allTickets, group.event.name);
                                    }}
                                        className="px-2.5 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/30 rounded text-[10px] font-bold transition-all flex items-center gap-1"
                                        title="Download semua QR sebagai PDF"
                                    >
                                        <Download className="h-3 w-3" /> QR PDF
                                    </button>
                                </div>
                            </div>

                            {/* Order Groups */}
                            {orderIds.map((orderId) => {
                                const orderTickets = [...orderGroups[orderId]].sort((a, b) => a.id - b.id);
                                const packageGroups = groupByPackage(orderTickets);
                                const packageKeys = Object.keys(packageGroups);

                                return (
                                    <div key={orderId} className="mb-6 last:mb-0">
                                        {/* Order Separator */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-px flex-1 bg-gradient-to-r from-gold-primary/30 to-transparent" />
                                            <div className="flex items-center gap-2 px-3 py-1 bg-deep-black/80 border border-bronze-muted/20 rounded-full">
                                                <Receipt className="h-3 w-3 text-gold-primary" />
                                                <span className="text-[10px] font-bold text-white tracking-wider">Pesanan #{orderId}</span>
                                                <span className="text-[9px] text-text-muted">{orderTickets[0].order_created_at}</span>
                                                <span className="text-[10px] text-text-muted">• {orderTickets.length} tiket</span>
                                            </div>
                                            <div className="h-px flex-1 bg-gradient-to-l from-gold-primary/30 to-transparent" />
                                        </div>

                                        {/* Package Groups for this Order */}
                                        {packageKeys.map((pkgName) => {
                                            const tickets = packageGroups[pkgName];
                                            const totalVotes = tickets.reduce((s, t) => s + t.vote_tokens_remaining, 0);
                                            const totalDays = tickets.reduce((s, t) => s + t.days_remaining, 0);
                                            const totalCoupons = tickets.reduce((s, t) => s + t.coupon_tokens_remaining, 0);
                                            const totalSharing = tickets.reduce((s, t) => s + t.sharing_tokens_remaining, 0);

                                            return (
                                                <div key={pkgName} className="premium-card border border-bronze-muted/20 mb-3 last:mb-0 overflow-hidden">
                                                    {/* Package Header */}
                                                    <div className="p-4 bg-gradient-to-r from-[#2A1A0A]/30 to-deep-black/60 border-b border-bronze-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-accent-maroon/20 border border-accent-maroon/40 rounded-lg">
                                                                <Ticket className="h-5 w-5 text-gold-primary" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-extrabold text-white text-base">
                                                                    {pkgName}
                                                                    <span className="ml-2 px-2 py-0.5 bg-gold-primary/10 text-gold-light border border-gold-primary/20 rounded text-[11px] font-bold">
                                                                        ×{tickets.length}
                                                                    </span>
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                                                                <Star className="h-3 w-3" /> {totalVotes} Suara Tersisa
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">
                                                                <Calendar className="h-3 w-3" /> {totalDays} Hari Tersisa
                                                            </span>
                                                            {totalSharing > 0 && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">
                                                                    <Gift className="h-3 w-3" /> {totalSharing} Sharing Tersisa
                                                                </span>
                                                            )}
                                                            {totalCoupons > 0 && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                                                                    <Ticket className="h-3 w-3" /> {totalCoupons} Kupon Tersisa
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Ticket List */}
                                                    <div className="divide-y divide-bronze-muted/10">
                                                        {tickets.map((t, idx) => {
                                                            const qrUrl = `${window.location.origin}/tickets/${t.unique_qr_hash}`;
                                                            return (
                                                                <ScrollReveal key={t.id} delay={idx * 80} className={`flex items-center gap-3 p-3 hover:bg-white/[0.01] transition-colors relative ${(t.days_remaining <= 0 || t.check_in_status) ? 'opacity-50' : ''}`}>
                                                                    {/* Expired / Checked-In overlay */}
                                                                    {(t.days_remaining <= 0 || t.check_in_status) && (
                                                                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                                                            <span className={`text-2xl font-extrabold uppercase tracking-[0.3em] -rotate-12 ${t.days_remaining <= 0 ? 'text-rose-500/40' : 'text-sky-500/40'}`}>
                                                                                {t.days_remaining <= 0 ? 'EXPIRED' : 'TELAH CHECK-IN'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {/* Number */}
                                                                    <span className={`text-[10px] text-text-muted font-mono w-6 shrink-0 text-right ${(t.days_remaining <= 0 || t.check_in_status) ? 'pointer-events-none' : ''}`}>#{idx + 1}</span>

                                                                    {/* QR Code (small, clickable) */}
                                                                    <button type="button"
                                                                        onClick={() => !(t.days_remaining <= 0 || t.check_in_status) && setEnlargedQr(qrUrl)}
                                                                        className={`shrink-0 bg-white p-0.5 rounded border transition-all ${(t.days_remaining <= 0 || t.check_in_status) ? 'opacity-30 blur-[2px] pointer-events-none border-bronze-muted/20' : 'border-bronze-muted/20 hover:border-gold-primary/50'}`}
                                                                    >
                                                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrUrl)}`}
                                                                            alt="QR" className="h-10 w-10 object-contain"
                                                                        />
                                                                    </button>

                                                                    {/* Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="text-xs font-semibold text-white block truncate">{t.buyer_name}</span>
                                                                        <span className="text-[9px] font-mono text-text-muted block truncate">{t.unique_qr_hash}</span>
                                                                        <StatusBadge status={t.check_in_status ? 'sudah' : 'belum'} label={t.check_in_status ? 'Sudah Check-In' : 'Belum Check-In'} />
                                                                    </div>

                                                                    {/* Remaining stats */}
                                                                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold">
                                                                        {t.vote_tokens_remaining > 0 && (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                                                                                <Star className="h-3 w-3" /> {t.vote_tokens_remaining} Suara Tersisa
                                                                            </span>
                                                                        )}
                                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                                                                            t.days_remaining > 0
                                                                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                                                                : 'bg-white/5 text-text-muted border border-white/10'
                                                                        }`}>
                                                                            <Calendar className="h-3 w-3" /> {t.days_remaining} Hari{t.days_remaining <= 0 ? ' — Habis' : ' Tersisa'}
                                                                        </span>
                                                                        {t.sharing_tokens_remaining > 0 && (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">
                                                                                <Gift className="h-3 w-3" /> {t.sharing_tokens_remaining} Sharing Tersisa
                                                                            </span>
                                                                        )}
                                                                        {t.checked_in_at && (
                                                                            <span title={t.checked_in_at}><Clock className="h-3 w-3 inline" /></span>
                                                                        )}
                                                                    </div>

                                                                    {/* Detail link */}
                                                                    <Link href={`/tickets/${t.unique_qr_hash}`}
                                                                        className="text-[10px] text-text-muted hover:text-gold-light transition-all shrink-0"
                                                                    >
                                                                        Detail →
                                                                    </Link>
                                                                    <button type="button"
                                                                        onClick={() => copySingleTicket(t)}
                                                                        className="text-[10px] text-text-muted hover:text-gold-light transition-all shrink-0 ml-2"
                                                                        title="Salin link tiket"
                                                                    >
                                                                        Salin
                                                                    </button>
                                                                    <button type="button"
                                                                        onClick={() => downloadAllQr([t], group.event.name)}
                                                                        className="text-[10px] text-text-muted hover:text-gold-light transition-all shrink-0 ml-2"
                                                                        title="Download QR tiket ini"
                                                                    >
                                                                        QR
                                                                    </button>
                                                                </ScrollReveal>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Group-level info */}
                                                    <div className="p-3 bg-white/[0.02] border-t border-bronze-muted/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-text-muted">
                                                        <span>
                                                            Klik QR untuk tampilan besar. Tunjukkan QR ke <strong className="text-white">operator di gate</strong> untuk check-in.
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {totalVotes > 0 && (
                                                                <span className="text-gold-light font-semibold">
                                                                    Total {totalVotes} suara
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* ===== ENLARGED QR MODAL ===== */}
            {enlargedQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setEnlargedQr(null)}>
                    <div className="relative max-w-sm w-full flex flex-col items-center">
                        <button type="button" onClick={() => setEnlargedQr(null)}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-gold-light transition-all flex items-center gap-1 text-xs uppercase font-extrabold tracking-wider bg-black/40 rounded"
                        >
                            <X className="h-4 w-4" /> Tutup
                        </button>
                        <div className="bg-white p-4 rounded-xl" onClick={(e) => e.stopPropagation()}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(enlargedQr)}`}
                                alt="QR Code" className="h-64 w-64 object-contain"
                            />
                        </div>
                        <p className="text-xs text-text-muted mt-4 text-center">Tunjukkan QR ini ke operator gate untuk check-in</p>
                    </div>
                </div>
            )}


            {/* ===== CLIPBOARD TOAST ===== */}
            {clipboardMsg && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-deep-black/90 border border-bronze-muted/30 rounded-lg shadow-2xl text-sm text-text-primary font-semibold backdrop-blur-sm animate-fade-in">
                    {clipboardMsg}
                </div>
            )}
        </div>
    );
}
