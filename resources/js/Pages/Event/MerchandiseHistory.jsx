import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShoppingBag, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

export default function MerchandiseHistory({ orders }) {
    const statusBadge = (status) => {
        const map = {
            pending: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock, label: 'Menunggu' },
            approved: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle, label: 'Lunas' },
            rejected: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: 'Ditolak' },
        };
        const s = map[status] || map.pending;
        const Icon = s.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${s.bg}`}>
                <Icon className="h-3 w-3" /> {s.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-checkerboard flex flex-col items-center justify-center p-4">
            <Head title="Riwayat Pembelian Sponsor" />

            <div className="w-full max-w-2xl premium-card p-6 md:p-8 border border-[#8C6828]/30 relative overflow-hidden my-8">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon"></div>

                <div className="mb-6">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </button>
                </div>

                <div className="text-center mb-8">
                    <div className="h-12 w-12 bg-gold-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag className="h-6 w-6 text-gold-primary" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">
                        Riwayat <span className="text-gold-primary">Pembelian</span>
                    </h1>
                    <p className="text-xs text-text-muted mt-1">Semua pesanan produk sponsor Anda</p>
                </div>

                {orders.length === 0 ? (
                    <div className="p-8 bg-deep-black/40 border border-bronze-muted/20 rounded text-center">
                        <ShoppingBag className="h-10 w-10 text-text-muted/30 mx-auto mb-3" />
                        <p className="text-sm text-text-muted font-medium">Belum ada pembelian</p>
                        <p className="text-[10px] text-text-muted/60 mt-1">Anda belum membeli produk sponsor apapun.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <ScrollReveal key={order.id}>
                                <Link
                                    href={`/merchandise-orders/${order.id}`}
                                    className="flex items-center gap-4 p-4 bg-deep-black/50 border border-bronze-muted/15 rounded-lg hover:border-gold-primary/30 hover:bg-deep-black/70 transition-all group"
                                >
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-extrabold text-white">Pesanan #{order.id}</span>
                                            {statusBadge(order.status)}
                                        </div>
                                        <p className="text-[10px] text-text-muted">{order.event.name}</p>
                                        <div className="flex items-center gap-3 text-[10px] text-text-primary/70">
                                            <span>{order.school_name}</span>
                                            <span>&bull;</span>
                                            <span>{order.items_count} item</span>
                                            <span>&bull;</span>
                                            <span className="font-bold text-gold-light">Rp {order.total_price.toLocaleString('id-ID')}</span>
                                        </div>
                                        <p className="text-[9px] text-text-muted/60">{order.created_at}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-gold-light transition-all shrink-0" />
                                </Link>
                            </ScrollReveal>
                        ))}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Kembali
                    </button>
                </div>
            </div>
        </div>
    );
}
