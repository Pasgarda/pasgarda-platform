import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Ticket, User, Mail, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle, Image } from 'lucide-react';

export default function OrderDetail({ event, order }) {
    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Detail Pesanan - Admin Panel" />

            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center gap-2">
                    <Link href={`/admin/events/${event.slug}/ots`}
                        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Link>
                </div>

                <div>
                    <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                        Detail Pesanan
                    </span>
                    <h1 className="text-2xl font-extrabold text-white mt-2">{order.order_id}</h1>
                    <p className="text-xs text-text-muted mt-1">{event.name}</p>
                </div>

                <div className="space-y-6">
                    {/* Status & Payment Info */}
                    <div className="premium-card p-6 border-bronze-muted/20">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gold-primary" /> Informasi Pembayaran
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Status</p>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                                    order.payment_status === 'paid'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : order.payment_status === 'failed'
                                            ? 'bg-rose-500/20 text-rose-400'
                                            : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                    {order.payment_status === 'paid' ? 'LUNAS' : order.payment_status === 'failed' ? 'DITOLAK' : 'PENDING'}
                                </span>
                            </div>
                            <div>
                                <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Metode</p>
                                <p className="text-white font-semibold">{order.payment_method?.startsWith?.('OTS') ? 'OTS (On The Spot)' : 'Transfer Manual'}</p>
                            </div>
                            <div>
                                <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Total</p>
                                <p className="text-gold-primary font-extrabold font-mono">Rp {order.total_price.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Tanggal</p>
                                <p className="text-white font-semibold">{order.created_at}</p>
                            </div>
                        </div>
                    </div>

                    {/* Buyer Info */}
                    <div className="premium-card p-6 border-bronze-muted/20">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <User className="h-4 w-4 text-gold-primary" /> Data Pembeli
                        </h2>
                        <div className="space-y-3 text-xs">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-text-muted" />
                                <span className="text-text-muted">Nama:</span>
                                <span className="text-white font-semibold">{order.user.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-text-muted" />
                                <span className="text-text-muted">Email:</span>
                                <span className="text-white font-semibold">{order.user.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tickets Summary */}
                    <div className="premium-card p-6 border-bronze-muted/20">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-gold-primary" /> Detail Tiket
                        </h2>
                        <div className="space-y-2">
                            {order.tickets_summary.map((tix, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-deep-black/40 rounded border border-white/5 text-xs">
                                    <span className="text-white font-semibold">{tix.package_name} <span className="text-text-muted">x{tix.quantity}</span></span>
                                    <span className="font-mono text-gold-light">Rp {(tix.price * tix.quantity).toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center p-3 bg-accent-maroon/10 rounded border border-gold-primary/20 text-xs font-extrabold">
                                <span className="text-white">Total</span>
                                <span className="font-mono text-gold-primary">Rp {order.total_price.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Proof */}
                    {order.payment_proof ? (
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Image className="h-4 w-4 text-gold-primary" /> Bukti Transfer
                            </h2>
                            <div className="flex justify-center">
                                <a href={`/storage/${order.payment_proof}`} target="_blank" rel="noopener noreferrer">
                                    <img src={`/storage/${order.payment_proof}`} alt="Bukti Transfer"
                                        className="max-w-full max-h-[500px] rounded border border-bronze-muted/20 object-contain hover:opacity-90 transition-all cursor-pointer"
                                    />
                                </a>
                            </div>
                            <p className="text-[10px] text-text-muted text-center mt-2">Klik gambar untuk memperbesar</p>
                        </div>
                    ) : null}

                    {/* Rejection Reason */}
                    {order.payment_status === 'failed' && order.rejected_reason && (
                        <div className="premium-card p-6 border-accent-mahogany/30 bg-accent-mahogany/5">
                            <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-accent-mahogany" /> Alasan Penolakan
                            </h2>
                            <p className="text-xs text-accent-mahogany p-3 bg-accent-mahogany/10 rounded border border-accent-mahogany/20">
                                {order.rejected_reason}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}