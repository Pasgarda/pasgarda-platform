import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Ticket, User, Mail, ShieldAlert, Award, Sparkles, Check, ArrowLeft, AlertTriangle, Gift, Store, ChevronDown, X } from 'lucide-react';
import axios from 'axios';

const MAX_TICKETS = 15;

export default function Tickets({ event, packages, maxLimit, auth, isSoldOut, onlineLimit, onlineSold, otsPackages = [], contingents = [] }) {
    const [quantities, setQuantities] = useState(
        packages.reduce((acc, pkg) => ({ ...acc, [pkg.id]: 0 }), {})
    );
    const [buyerName, setBuyerName] = useState(auth.user?.name || '');
    const [buyerEmail, setBuyerEmail] = useState(auth.user?.email || '');
    const [contingentId, setContingentId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successOrderMsg, setSuccessOrderMsg] = useState('');
    const [showLimitModal, setShowLimitModal] = useState(false);

    const handleQtyChange = (packageId, value) => {
        const cleaned = value.replace(/^0+/, '');
        const parsed = parseInt(cleaned, 10);
        const validQty = isNaN(parsed) ? 0 : Math.max(0, parsed);
        const newQuantities = { ...quantities, [packageId]: validQty };
        const newTotal = Object.values(newQuantities).reduce((a, b) => a + b, 0);
        if (newTotal > MAX_TICKETS) {
            setShowLimitModal(true);
            return;
        }
        setQuantities(newQuantities);
    };

    useEffect(() => {
        if (showLimitModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showLimitModal]);

    const totalSelected = Object.values(quantities).reduce((a, b) => a + b, 0);
    const totalPrice = packages.reduce((sum, pkg) => sum + (pkg.price * (quantities[pkg.id] || 0)), 0);

    const handleCheckout = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessOrderMsg('');

        if (totalSelected <= 0) {
            setErrorMsg('Pilih setidaknya 1 tiket untuk melanjutkan.');
            return;
        }

        if (totalSelected > MAX_TICKETS) {
            setShowLimitModal(true);
            return;
        }

        if (!contingentId) {
            setErrorMsg('Pilih kontingen/school yang ingin didukung.');
            return;
        }

        setProcessing(true);

        try {
            const response = await axios.post(`/events/${event.slug}/tickets/checkout`, {
                quantities,
                buyer_name: buyerName,
                buyer_email: buyerEmail,
                contingent_id: contingentId,
            });

            if (response.data.success) {
                setSuccessOrderMsg(response.data.message + ' Mengalihkan ke halaman pembayaran...');
                setQuantities(packages.reduce((acc, pkg) => ({ ...acc, [pkg.id]: 0 }), {}));
                setTimeout(() => {
                    router.visit(`/orders/${response.data.db_order_id}`);
                }, 1500);
            }
        } catch (error) {
            setProcessing(false);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Gagal melakukan checkout.';
            setErrorMsg(msg);
        }
    };

    return (
        <div className="min-h-screen bg-checkerboard flex flex-col items-center justify-center p-4">
            <Head title="Beli Tiket" />

            <div className="w-full max-w-3xl premium-card p-6 md:p-8 border border-[#8C6828]/30 relative overflow-hidden my-8">
                {/* Decorative gold gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon"></div>

                {/* Back Button */}
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali Ke Event
                    </Link>
                    {auth.user && (
                        <Link
                            href="/my-tickets"
                            className="inline-flex items-center gap-1.5 text-xs text-gold-light hover:text-gold-bright transition-all font-semibold uppercase tracking-wider bg-gold-primary/10 px-3 py-1.5 rounded border border-gold-primary/20"
                        >
                            <Ticket className="h-4 w-4" /> Lihat Tiket Saya
                        </Link>
                    )}
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
                        Pesan <span className="text-gold-primary">Tiket Masuk</span>
                    </h1>
                    <p className="text-sm text-text-muted mt-2">
                        {event.name} &bull; Maksimal {MAX_TICKETS} tiket per pembelian
                    </p>
                </div>

                {/* Status Messages */}
                {errorMsg && (
                    <div className="mb-6 p-4 bg-accent-mahogany/15 border border-accent-mahogany/30 text-accent-mahogany text-xs font-semibold rounded flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {successOrderMsg && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded flex items-center gap-2">
                        <Check className="h-5 w-5 shrink-0" />
                        <span>{successOrderMsg}</span>
                    </div>
                )}

                {/* Ticket Sale Closed */}
                {event.ticket_sale_status === 'closed' ? (
                    <div className="p-8 bg-accent-mahogany/10 border border-accent-mahogany/30 rounded text-center space-y-3">
                        <AlertTriangle className="h-10 w-10 text-accent-mahogany mx-auto" />
                        <h2 className="text-lg font-extrabold text-white">Pembelian Tiket Ditutup</h2>
                        <p className="text-xs text-text-muted leading-relaxed max-w-md mx-auto">
                            Maaf, pembelian tiket untuk acara ini sedang ditutup oleh penyelenggara.
                            Silakan hubungi panitia untuk informasi lebih lanjut.
                        </p>
                        <Link href={`/events/${event.slug}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold mt-4 px-4 py-2 bg-gold-primary/20 text-gold-light border border-gold-primary/30 rounded hover:bg-gold-primary/30 transition-all"
                        >
                            ← Kembali ke Halaman Event
                        </Link>
                    </div>
                ) : auth.user?.role === 'coach' ? (
                    <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded text-center space-y-3">
                        <ShieldAlert className="h-10 w-10 text-rose-400 mx-auto" />
                        <h2 className="text-lg font-extrabold text-white">Akun Pelatih Tidak Dapat Membeli Tiket</h2>
                        <p className="text-xs text-text-muted leading-relaxed max-w-md mx-auto">
                            Akun dengan peran Pelatih/Peserta terdaftar digunakan khusus untuk mengakses portal penilaian tim.
                            Jika Anda memerlukan bantuan, silakan hubungi panitia.
                        </p>
                        <div className="flex justify-center gap-2 pt-2">
                            <Link
                                href={`/events/${event.slug}`}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded text-xs font-bold text-text-muted hover:text-white transition-all"
                            >
                                Kembali ke Event
                            </Link>
                            <Link
                                href={`/events/${event.slug}/myscore`}
                                className="px-4 py-2 bg-gold-primary/10 border border-gold-primary/30 rounded text-xs font-bold text-gold-primary hover:brightness-110 transition-all"
                            >
                                Buka Portal Pelatih
                            </Link>
                        </div>
                    </div>
                ) : (
                <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Packages Selector */}
                    <div className="md:col-span-3 space-y-4">
                        <h3 className="text-xs font-bold text-gold-cream uppercase tracking-wider mb-2 border-l-2 border-gold-primary pl-2">
                            Pilih Kategori Tiket
                        </h3>

                        {isSoldOut ? (
                            <div className="p-6 bg-accent-mahogany/15 border border-accent-mahogany/30 rounded text-center space-y-3">
                                <ShieldAlert className="h-8 w-8 text-accent-mahogany mx-auto" />
                                <h4 className="font-bold text-white text-sm">Tiket Online Habis!</h4>
                                <p className="text-[11px] text-text-muted leading-relaxed">
                                    Kuota {onlineLimit} tiket online sudah terpenuhi. Silakan datang ke lokasi untuk membeli tiket OTS (On The Spot).
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded flex items-start gap-2">
                                    <Gift className="h-4 w-4 shrink-0 mt-0.5 text-sky-400" />
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Info Tiket Online</p>
                                        <p className="text-[10px] text-sky-200/80 leading-relaxed">
                                            Tiket online terbatas {onlineLimit} pembelian. Tersedia {Math.max(0, onlineLimit - onlineSold)} tiket lagi.
                                        </p>
                                        <p className="text-[10px] text-sky-200/80 leading-relaxed">
                                            Setiap pembelian tiket online mengalokasikan <span className="font-bold text-white">+1 dukungan Supporter Terfavorit</span> dan <span className="font-bold text-white">+1 untuk Kontingen Terbaik</span> ke kontingen yang dipilih.
                                        </p>
                                        <p className="text-[10px] text-sky-200/80 leading-relaxed">
                                            Pemenang <span className="font-bold text-white">Supporter Terbaik</span> ditentukan dari total data <span className="font-bold text-white">pembelian tiket online terbanyak</span>. Tiket OTS tidak memberikan alokasi dukungan supporter.
                                        </p>
                                    </div>
                                </div>

                                {packages.map((pkg) => {
                                    return (
                                        <div key={pkg.id} className="premium-card p-4 border border-bronze-muted/20 bg-deep-black/40 hover:border-gold-primary/20 transition-all flex justify-between items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-white text-base">{pkg.name}</span>
                                                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">
                                                        Online
                                                    </span>
                                                </div>
                                                <p className="text-xs text-text-primary/75 mt-1">
                                                    Rp {parseFloat(pkg.price).toLocaleString('id-ID')}
                                                </p>
                                                <p className="text-[10px] text-gold-light/80 mt-1.5 flex items-center gap-1.5">
                                                    <Sparkles className="h-3 w-3" /> {pkg.vote_allowance} Vote Kontingen &bull; {pkg.validity_days} Hari Tiket Masuk &bull; {pkg.validity_days} Dukungan Supporter &bull; {pkg.coupon_allowance} Kupon Produk
                                                </p>
                                            </div>
                                            <div className="w-20 shrink-0">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    disabled={isSoldOut}
                                                    value={quantities[pkg.id] ?? 0}
                                                    onChange={(e) => handleQtyChange(pkg.id, e.target.value)}
                                                    className="block w-full text-center py-2 bg-deep-black/70 border border-bronze-muted/40 rounded text-gold-primary focus:outline-none focus:border-gold-primary font-bold disabled:opacity-40"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {/* OTS Info Card — reordered: Platinum > Gold > Silver */}
                        {otsPackages.length > 0 && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded space-y-2">
                                <div className="flex items-start gap-2">
                                    <Store className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Tiket di Lokasi (OTS)</p>
                                        <p className="text-[10px] text-amber-200/80 leading-relaxed mt-1">
                                            Paket berikut hanya bisa dibeli di lokasi acara (On The Spot):
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            <div className="text-[10px] text-amber-200/80">
                                                • <span className="font-bold text-white">Silver</span> — Rp 25.000 &bull; 1 Hari &bull; 1 Vote &bull; 1 Kupon Doorprize
                                            </div>
                                            {[...otsPackages].filter((op) => op.name !== 'Silver').sort((a, b) => a.price - b.price).map((op, i) => (
                                                <div key={i} className="text-[10px] text-amber-200/80">
                                                    • <span className="font-bold text-white">{op.name}</span> — Rp {parseFloat(op.price).toLocaleString('id-ID')} &bull; {op.validity_days} Hari &bull; {op.vote_allowance} Vote &bull; {op.coupon_allowance} Kupon Doorprize
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Buyer Information & Summary */}
                    <div className="md:col-span-2 space-y-6">
                        {auth.user ? (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gold-cream uppercase tracking-wider mb-2 border-l-2 border-gold-primary pl-2">
                                        Informasi Pembeli
                                    </h3>

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                            Nama Lengkap
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={buyerName}
                                                onChange={(e) => setBuyerName(e.target.value)}
                                                placeholder="Nama Lengkap"
                                                className="block w-full pl-9 pr-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                            Alamat Email
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={buyerEmail}
                                                onChange={(e) => setBuyerEmail(e.target.value)}
                                                placeholder="nama@email.com"
                                                className="block w-full pl-9 pr-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Contingent Dropdown */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                            Pilih Kontingen yang Didukung
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                                <Award className="h-4 w-4" />
                                            </div>
                                            <select
                                                required
                                                value={contingentId}
                                                onChange={(e) => setContingentId(e.target.value)}
                                                className="block w-full pl-9 pr-8 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs appearance-none"
                                            >
                                                <option value="">— Pilih Kontingen —</option>
                                                {Object.entries(
                                                    contingents.reduce((acc, c) => {
                                                        const cat = c.category_type === 'U12' ? 'SD' : c.category_type === 'U16' ? 'SMP' : c.category_type === 'U19' ? 'SMA' : c.category_type;
                                                        (acc[cat] = acc[cat] || []).push(c);
                                                        return acc;
                                                    }, {})
                                                ).map(([cat, items]) => (
                                                    <optgroup key={cat} label={cat}>
                                                        {items.map((c) => (
                                                            <option key={c.id} value={c.id}>{c.school_name}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-bronze-muted">
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-text-muted mt-1">
                                            Hak suara & dukungan supporter akan otomatis diberikan ke kontingen ini.
                                        </p>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="p-4 bg-deep-black/60 border border-bronze-muted/20 rounded space-y-3">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-bronze-muted/10 pb-2">
                                        Ringkasan Pemesanan
                                    </h4>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-primary/80">Total Tiket</span>
                                        <span className="font-semibold text-white">{totalSelected} Tiket</span>
                                    </div>
                                    <div className="flex justify-between text-xs border-b border-bronze-muted/10 pb-2">
                                        <span className="text-text-primary/80">Metode Bayar</span>
                                        <span className="font-semibold text-gold-light">QRIS</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-1">
                                        <span className="font-bold text-gold-cream">Total Bayar</span>
                                        <span className="font-extrabold text-white">Rp {totalPrice.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">PENTING</p>
                                            <p className="text-[10px] text-amber-200/80 leading-relaxed mt-1">
                                                Pembayaran dilakukan via QRIS. Setelah menekan tombol 'Pesan Sekarang', Anda akan diarahkan ke halaman pembayaran untuk scan QRIS dan unggah bukti pembayaran.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || totalSelected === 0}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded text-xs tracking-wider uppercase shadow-lg border border-gold-light/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Ticket className="h-4 w-4" />
                                    <span>{processing ? 'Memproses...' : 'Pesan Sekarang (QRIS)'}</span>
                                </button>
                            </>
                        ) : (
                            <div className="p-6 bg-accent-maroon/20 border border-accent-maroon/40 rounded text-center space-y-4">
                                <ShieldAlert className="h-8 w-8 text-gold-light mx-auto" />
                                <h4 className="font-bold text-white text-sm">Autentikasi Diperlukan</h4>
                                <p className="text-[11px] text-text-primary/80 leading-relaxed">
                                    Silakan masuk ke akun PASGARDA Anda atau mendaftar terlebih dahulu untuk melakukan pembelian tiket masuk secara online.
                                </p>
                                <Link
                                    href="/login"
                                    className="inline-block w-full py-3 px-4 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-extrabold rounded text-xs tracking-wider uppercase text-center hover:brightness-110 transition-all shadow"
                                >
                                    Masuk / Daftar Akun
                                </Link>
                            </div>
                        )}
                    </div>
                </form>)}
            </div>

            {/* Limit Modal */}
            {showLimitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowLimitModal(false)}>
                    <div className="premium-card max-w-sm w-full p-6 border border-amber-500/40 text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <AlertTriangle className="h-7 w-7 text-amber-400" />
                        </div>
                        <h3 className="text-base font-extrabold text-white mb-2">Batas Pembelian</h3>
                        <p className="text-sm text-text-muted leading-relaxed mb-1">
                            Maksimal <span className="font-bold text-gold-light">{MAX_TICKETS} tiket</span> dalam 1 kali pembelian.
                        </p>
                        <p className="text-xs text-text-muted mb-6">
                            Kurangi jumlah tiket yang dipilih untuk melanjutkan.
                        </p>
                        <button
                            onClick={() => setShowLimitModal(false)}
                            className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-300 transition-all flex items-center justify-center gap-2"
                        >
                            <X className="h-4 w-4" /> Mengerti
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
