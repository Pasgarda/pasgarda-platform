import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ShoppingBag, Package, CreditCard, User, Mail, Award, Sparkles, Check, ArrowLeft, AlertTriangle, ShieldAlert, ChevronDown, Phone } from 'lucide-react';
import axios from 'axios';

export default function MerchandiseBuy({ event, products, contingents, myOrders, auth }) {
    const maxPrice = event.max_merchandise_price || 1000000;

    const [quantities, setQuantities] = useState(
        products.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
    );
    const [buyerName, setBuyerName] = useState(auth?.user?.name || '');
    const [buyerEmail, setBuyerEmail] = useState(auth?.user?.email || '');
    const [buyerPhone, setBuyerPhone] = useState('');
    const [contingentId, setContingentId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successOrderMsg, setSuccessOrderMsg] = useState('');
    const [showLimitModal, setShowLimitModal] = useState(false);

    const handleQtyChange = (productId, value) => {
        const cleaned = value.replace(/^0+/, '');
        const parsed = parseInt(cleaned, 10);
        setQuantities({ ...quantities, [productId]: isNaN(parsed) ? 0 : Math.max(0, parsed) });
    };

    const totalSelected = Object.values(quantities).reduce((a, b) => a + b, 0);
    const totalPrice = products.reduce((sum, p) => sum + (p.price * (quantities[p.id] || 0)), 0);
    const totalPoints = products.reduce((sum, p) => sum + (p.points * (quantities[p.id] || 0)), 0);

    const groupedContingents = {};
    const order = { U12: 'SD', U16: 'SMP', U19: 'SMA', Purna: 'Purna' };
    contingents.forEach(c => {
        const label = order[c.category_type] || c.category_type;
        if (!groupedContingents[label]) groupedContingents[label] = [];
        groupedContingents[label].push(c);
    });

    const handleCheckout = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessOrderMsg('');

        if (totalSelected <= 0) {
            setErrorMsg('Pilih setidaknya 1 produk untuk melanjutkan.');
            return;
        }

        if (totalPrice > maxPrice) {
            setShowLimitModal(true);
            return;
        }

        if (!contingentId) {
            setErrorMsg('Pilih kontingen yang ingin didukung.');
            return;
        }

        setProcessing(true);

        try {
            const response = await axios.post(`/events/${event.slug}/merchandise/buy`, {
                contingent_id: contingentId,
                buyer_phone: buyerPhone,
                items: Object.entries(quantities)
                    .filter(([_, qty]) => qty > 0)
                    .map(([product_id, quantity]) => ({
                        product_id: Number(product_id),
                        quantity,
                    })),
            });

            if (response.data.redirect) {
                setSuccessOrderMsg('Pesanan berhasil dibuat! Mengalihkan ke halaman pembayaran...');
                setQuantities(products.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}));
                setTimeout(() => {
                    router.visit(response.data.redirect);
                }, 1500);
            }
        } catch (error) {
            setProcessing(false);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Gagal melakukan checkout.';
            setErrorMsg(msg);
        }
    };

    return (
        <>
        <div className="min-h-screen bg-checkerboard flex flex-col items-center justify-center p-4">
            <Head title="Beli Produk Sponsor" />

            <div className="w-full max-w-3xl premium-card p-6 md:p-8 border border-[#8C6828]/30 relative overflow-hidden my-8">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon"></div>

                <div className="mb-6">
                    <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali Ke Event
                    </Link>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
                        Beli <span className="text-gold-primary">Produk Sponsor</span>
                    </h1>
                    <p className="text-sm text-text-muted mt-2">
                        {event.name} &bull; Maksimal Rp {maxPrice.toLocaleString('id-ID')} per transaksi
                    </p>
                </div>

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

                {auth?.user?.role === 'coach' ? (
                    <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded text-center space-y-3">
                        <ShieldAlert className="h-10 w-10 text-rose-400 mx-auto" />
                        <h2 className="text-lg font-extrabold text-white">Akun Pelatih Tidak Dapat Membeli Produk</h2>
                        <p className="text-xs text-text-muted leading-relaxed max-w-md mx-auto">
                            Akun dengan peran Pelatih/Peserta terdaftar digunakan khusus untuk mengakses portal penilaian tim.
                        </p>
                        <div className="flex justify-center gap-2 pt-2">
                            <Link href={`/events/${event.slug}`}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded text-xs font-bold text-text-muted hover:text-white transition-all"
                            >
                                Kembali ke Event
                            </Link>
                        </div>
                    </div>
                ) : (
                <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    <div className="md:col-span-3 space-y-4">
                        <h3 className="text-xs font-bold text-gold-cream uppercase tracking-wider mb-2 border-l-2 border-gold-primary pl-2">
                            Pilih Produk Sponsor
                        </h3>

                        {event.sponsor_voting_status === 'stopped' ? (
                            <div className="p-6 bg-accent-mahogany/15 border border-accent-mahogany/30 rounded text-center space-y-3">
                                <ShieldAlert className="h-8 w-8 text-accent-mahogany mx-auto" />
                                <h4 className="font-bold text-white text-sm">Pembelian Ditutup</h4>
                                <p className="text-[11px] text-text-muted leading-relaxed">
                                    Layanan pembelian produk sponsor untuk sementara tidak tersedia.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-gradient-to-r from-gold-primary/15 to-accent-maroon/15 border border-gold-primary/40 rounded-xl shadow-lg shadow-gold-primary/10 flex items-start gap-3">
                                    <Sparkles className="h-5 w-5 shrink-0 mt-0.5 text-gold-primary" />
                                    <div>
                                        <p className="text-xs font-extrabold text-gold-light uppercase tracking-wider">Info Pembelian</p>
                                        <p className="text-xs text-gold-light/90 leading-relaxed mt-1.5 font-semibold">
                                            Maksimal <span className="text-white font-black">Rp {maxPrice.toLocaleString('id-ID')}</span> per transaksi. Setiap pembelian otomatis memberikan poin sponsor ke kontingen yang dipilih.
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    href="/merchandise-orders"
                                    className="block w-full py-3 px-4 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded-lg text-sm tracking-wider uppercase shadow-lg shadow-gold-primary/20 transition-all text-center"
                                >
                                    <ShoppingBag className="h-4 w-4 inline-block mr-2" />
                                    Riwayat Pembelian
                                </Link>

                                {products.map((p) => {
                                    const qty = quantities[p.id] || 0;
                                    return (
                                        <div key={p.id} className="premium-card p-4 border border-bronze-muted/20 bg-deep-black/40 hover:border-gold-primary/20 transition-all flex justify-between items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-white text-base">{p.name}</span>
                                                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                                                        Sponsor
                                                    </span>
                                                </div>
                                                <p className="text-xs text-text-primary/75 mt-1">
                                                    Rp {p.price.toLocaleString('id-ID')} &bull; {p.points} poin/pcs
                                                </p>
                                                <p className="text-[10px] text-gold-light/80 mt-1.5 flex items-center gap-1.5">
                                                    <Sparkles className="h-3 w-3" /> {p.points} Poin Sponsor per produk
                                                </p>
                                            </div>
                                            <div className="w-20 shrink-0">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={String(qty)}
                                                    onChange={(e) => handleQtyChange(p.id, e.target.value)}
                                                    className="block w-full text-center py-2 bg-deep-black/70 border border-bronze-muted/40 rounded text-gold-primary focus:outline-none focus:border-gold-primary font-bold"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {products.length === 0 && (
                                    <div className="p-6 bg-accent-mahogany/15 border border-accent-mahogany/30 rounded text-center">
                                        <p className="text-xs text-text-muted">Belum ada produk sponsor tersedia.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        {auth?.user ? (
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

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                            Nomor WhatsApp <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <input
                                                type="tel"
                                                required
                                                value={buyerPhone}
                                                onChange={(e) => setBuyerPhone(e.target.value)}
                                                placeholder="08xxxxxxxxxx"
                                                className="block w-full pl-9 pr-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                            />
                                        </div>
                                        <p className="text-[9px] text-text-muted mt-1">
                                            Nomor WA akan digunakan panitia untuk menghubungi jika ada kendala.
                                        </p>
                                    </div>

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
                                                {Object.entries(groupedContingents).map(([cat, items]) => (
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
                                            Poin sponsor akan otomatis diberikan ke kontingen ini.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-deep-black/60 border border-bronze-muted/20 rounded space-y-3">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-bronze-muted/10 pb-2">
                                        Ringkasan Pemesanan
                                    </h4>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-primary/80">Total Produk</span>
                                        <span className="font-semibold text-white">{totalSelected} pcs</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-primary/80">Total Poin Sponsor</span>
                                        <span className="font-semibold text-gold-light">{totalPoints} poin</span>
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
                                    <ShoppingBag className="h-4 w-4" />
                                    <span>{processing ? 'Memproses...' : 'Pesan Sekarang (QRIS)'}</span>
                                </button>
                            </>
                        ) : (
                            <div className="p-6 bg-accent-maroon/20 border border-accent-maroon/40 rounded text-center space-y-4">
                                <ShieldAlert className="h-8 w-8 text-gold-light mx-auto" />
                                <h4 className="font-bold text-white text-sm">Autentikasi Diperlukan</h4>
                                <p className="text-[11px] text-text-primary/80 leading-relaxed">
                                    Silakan masuk ke akun PASGARDA Anda untuk membeli produk sponsor.
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
                </form>
                )}
            </div>
        </div>

        {showLimitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLimitModal(false)}>
                <div className="relative bg-[#0f0f1a] border border-accent-maroon/50 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center" onClick={e => e.stopPropagation()}>
                    <ShieldAlert className="h-12 w-12 text-gold-light mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Batas Transaksi Tercapai</h3>
                    <p className="text-sm text-text-primary/80 leading-relaxed mb-6">
                        Maksimal <span className="text-gold-light font-semibold">Rp {maxPrice.toLocaleString('id-ID')}</span> dalam 1 kali transaksi.
                        Saat ini total belanja Anda sebesar{' '}
                        <span className="text-gold-light font-semibold">Rp {totalPrice.toLocaleString('id-ID')}</span>.
                    </p>
                    <button
                        onClick={() => setShowLimitModal(false)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded text-xs tracking-wider uppercase shadow-lg transition-all"
                    >
                        OK, Mengerti
                    </button>
                </div>
            </div>
        )}
    </>
);

}
