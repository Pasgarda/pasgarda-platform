import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, History, Ticket, CreditCard, Image, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

export default function OrdersList({ event, orders }) {
    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Riwayat Transaksi Manual - Admin Panel" />

            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center gap-2">
                    <Link href={`/admin/events/${event.slug}/ots`}
                        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Link>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Admin
                        </span>
                        <h1 className="text-2xl font-extrabold text-white mt-2 flex items-center gap-2">
                            <History className="h-5 w-5 text-gold-primary" /> Riwayat Transaksi Manual
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; {orders.length} transaksi</p>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12 text-bronze-muted text-sm">
                        Belum ada riwayat transaksi manual.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="premium-card p-5 border-bronze-muted/20">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-white">{order.order_id}</p>
                                        <p className="text-[10px] text-text-muted">{order.user.name} &bull; {order.user.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                            order.payment_status === 'paid'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-rose-500/20 text-rose-400'
                                        }`}>
                                            {order.payment_status === 'paid' ? 'LUNAS' : 'DITOLAK'}
                                        </span>
                                        <span className="text-[10px] font-mono text-gold-light">Rp {order.total_price.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                                    <div>
                                        <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold mb-1">Tiket</p>
                                        {order.tickets_summary.map((tix, i) => (
                                            <p key={i} className="text-white font-semibold">{tix.package_name} x{tix.quantity}</p>
                                        ))}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold mb-1">Tanggal</p>
                                        <p className="text-white">{order.updated_at}</p>
                                    </div>
                                </div>

                                {order.payment_proof ? (
                                    <div className="flex items-center gap-3 p-3 bg-deep-black/40 rounded border border-white/5">
                                        <img src={`/storage/${order.payment_proof}`} alt="Bukti"
                                            className="h-14 w-18 object-cover rounded border border-bronze-muted/10 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-semibold text-white">Bukti Transfer</p>
                                            <p className="text-[9px] text-text-muted truncate">{order.payment_proof}</p>
                                        </div>
                                        <a href={`/storage/${order.payment_proof}`} target="_blank" rel="noopener noreferrer"
                                            className="shrink-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-white hover:bg-white/10 transition-all flex items-center gap-1"
                                        >
                                            <ExternalLink className="h-3 w-3" /> Buka
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-text-muted italic p-3 bg-deep-black/20 rounded border border-white/5">
                                        Tidak ada bukti transfer
                                    </div>
                                )}

                                {order.payment_status === 'failed' && order.rejected_reason && (
                                    <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] text-rose-400">
                                        <span className="font-bold">Alasan ditolak:</span> {order.rejected_reason}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}