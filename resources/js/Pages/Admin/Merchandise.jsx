import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ShoppingBag, CheckCircle, XCircle, Clock, TrendingUp, Package, Eye, Search, ChevronDown, Upload, Image, Filter, Plus, Pencil, Trash2, ArrowLeft, Download, CreditCard, MessageCircle, X, RotateCw } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';
import axios from 'axios';

export default function Merchandise({ event, products, pendingOrders, approvedOrders, rejectedOrders, leaderboard, allOrders, productRevenue }) {
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [proofModal, setProofModal] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [productModal, setProductModal] = useState(null);
    const [productForm, setProductForm] = useState({ name: '', price: '', points: '' });
    const [newTransaction, setNewTransaction] = useState(false);
    const [merchWaContacts, setMerchWaContacts] = useState(event?.merchandise_wa_contacts || []);
    const [merchWaSaving, setMerchWaSaving] = useState(false);
    const [merchNotificationEmail, setMerchNotificationEmail] = useState(event?.merchandise_notification_email || '');
    const [merchNotificationEmailSaving, setMerchNotificationEmailSaving] = useState(false);
    const initialPendingCount = useRef(pendingOrders.length);
    const [pendingCount, setPendingCount] = useState(pendingOrders.length);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            preserveScroll: true,
            onFinish: () => setIsRefreshing(false)
        });
    };

    // Polling for new pending orders count
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`/admin/events/${event.slug}/merchandise/poll`);
                if (response.data && typeof response.data.pending_count === 'number') {
                    setPendingCount(response.data.pending_count);
                }
            } catch (err) {
                console.error("Error polling merchandise count:", err);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [event.slug]);

    // Update pendingCount when page props change
    useEffect(() => {
        setPendingCount(pendingOrders.length);
    }, [pendingOrders.length]);

    // Show notification when pending count increases
    useEffect(() => {
        if (pendingCount > pendingOrders.length) {
            setNewTransaction(true);
        }
    }, [pendingCount, pendingOrders.length]);

    const totalPending = pendingOrders.length;
    const totalApproved = approvedOrders.length;
    const totalRevenue = approvedOrders.reduce((sum, o) => sum + o.total_price, 0);

    const handleApprove = async (orderId) => {
        if (!confirm('Setujui pesanan ini? Pastikan bukti pembayaran sudah sesuai.')) return;
        try {
            await axios.post(`/admin/events/${event.slug}/merchandise/${orderId}/approve`);
            router.reload();
        } catch (e) {
            alert('Gagal menyetujui pesanan.');
        }
    };

    const handleReject = async (orderId) => {
        if (!rejectReason.trim()) return;
        try {
            await axios.post(`/admin/events/${event.slug}/merchandise/${orderId}/reject`, { reason: rejectReason });
            setRejectModal(null);
            setRejectReason('');
            router.reload();
        } catch (e) {
            alert('Gagal menolak pesanan.');
        }
    };

    const handleSaveMerchWaContacts = async () => {
        setMerchWaSaving(true);
        try {
            await axios.post(`/admin/events/${event.slug}/merchandise/contacts`, {
                merchandise_wa_contacts: merchWaContacts.filter(c => c.name && c.number),
            });
            router.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan kontak WA.');
        } finally {
            setMerchWaSaving(false);
        }
    };

    const handleSaveMerchNotificationEmail = async () => {
        setMerchNotificationEmailSaving(true);
        try {
            await axios.post(`/admin/events/${event.slug}/merchandise/notification-email`, {
                email: merchNotificationEmail,
            });
            router.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan email notifikasi.');
        } finally {
            setMerchNotificationEmailSaving(false);
        }
    };

    const openProductModal = (product = null) => {
        if (product) {
            setProductForm({ name: product.name, price: String(product.price), points: String(product.points) });
            setProductModal(product);
        } else {
            setProductForm({ name: '', price: '', points: '' });
            setProductModal({ isNew: true });
        }
    };

    const handleProductSubmit = async () => {
        const payload = {
            name: productForm.name,
            price: Number(productForm.price),
            points: Number(productForm.points),
        };
        try {
            if (productModal.isNew) {
                await axios.post(`/admin/events/${event.slug}/merchandise/products`, payload);
            } else {
                await axios.put(`/admin/events/${event.slug}/merchandise/products/${productModal.id}`, payload);
            }
            setProductModal(null);
            router.reload();
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal menyimpan produk.');
        }
    };

    const handleProductDelete = async (product) => {
        if (!confirm(`Hapus produk "${product.name}"?`)) return;
        try {
            await axios.delete(`/admin/events/${event.slug}/merchandise/products/${product.id}`);
            router.reload();
        } catch (e) {
            alert('Gagal menghapus produk.');
        }
    };

    const filteredOrders = useMemo(() => {
        let data = [...(allOrders.data || [])];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(o =>
                o.buyer_name?.toLowerCase().includes(q) ||
                o.school_name?.toLowerCase().includes(q) ||
                o.items?.some(item => item.product_name?.toLowerCase().includes(q)) ||
                String(o.id).includes(q)
            );
        }
        if (sortBy === 'price_high') data.sort((a, b) => b.total_price - a.total_price);
        else if (sortBy === 'price_low') data.sort((a, b) => a.total_price - b.total_price);
        else if (sortBy === 'school') data.sort((a, b) => (a.school_name || '').localeCompare(b.school_name || ''));
        return data;
    }, [allOrders.data, searchQuery, sortBy]);

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Sponsor - Merchandise" />

            {newTransaction && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
                    <div className="bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-sm">
                        <span className="text-sm font-semibold">Ada transaksi baru</span>
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

            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Platform Control
                    </Link>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/15 pb-6 mb-8">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-white/5 px-2 py-0.5 border border-white/20 rounded-full uppercase">
                            Best Sponsor Merchandise
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            Kelola <span className="text-gold-primary">Pesanan Produk</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name}</p>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0 text-xs">
                        <div className="bg-white/5 p-3 rounded border border-white/10 text-center">
                            <span className="text-text-muted block font-semibold uppercase">Pending</span>
                            <span className="text-lg font-black text-amber-400">{totalPending}</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded border border-white/10 text-center">
                            <span className="text-text-muted block font-semibold uppercase">Disetujui</span>
                            <span className="text-lg font-black text-gold-bright">{totalApproved}</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded border border-white/10 text-center">
                            <span className="text-text-muted block font-semibold uppercase">Revenue</span>
                            <span className="text-lg font-black text-white">Rp {totalRevenue.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {/* WA Contact Editor */}
                <details className="group mb-8 bg-white/[0.02] border border-bronze-muted/20 rounded-lg overflow-hidden">
                    <summary className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all text-xs font-semibold text-text-muted">
                        <span>Kontak WA untuk Notifikasi Penolakan</span>
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 py-3 border-t border-bronze-muted/10 space-y-3">
                        {merchWaContacts.map((contact, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={contact.name}
                                onChange={(e) => {
                                    const next = [...merchWaContacts];
                                    next[idx] = { ...next[idx], name: e.target.value };
                                    setMerchWaContacts(next);
                                }}
                                placeholder="Nama"
                                className="w-28 px-2.5 py-1.5 bg-deep-black/60 border border-bronze-muted/20 rounded text-xs text-white placeholder:text-text-muted/40 focus:outline-none focus:border-gold-primary/40 transition-all"
                            />
                            <input
                                type="text"
                                value={contact.number}
                                onChange={(e) => {
                                    const next = [...merchWaContacts];
                                    next[idx] = { ...next[idx], number: e.target.value };
                                    setMerchWaContacts(next);
                                }}
                                placeholder="628xxxxxxxxx"
                                className="flex-1 px-2.5 py-1.5 bg-deep-black/60 border border-bronze-muted/20 rounded text-xs text-white font-mono placeholder:text-text-muted/40 focus:outline-none focus:border-gold-primary/40 transition-all"
                            />
                            <button
                                onClick={() => setMerchWaContacts(merchWaContacts.filter((_, i) => i !== idx))}
                                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        ))}
                        <button
                            onClick={() => setMerchWaContacts([...merchWaContacts, { name: '', number: '' }])}
                            className="text-[10px] font-bold text-gold-light hover:text-gold-bright transition-all flex items-center gap-1"
                        >
                            + Tambah Kontak
                        </button>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveMerchWaContacts}
                                disabled={merchWaSaving}
                                className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                                {merchWaSaving ? 'Menyimpan...' : 'Simpan Kontak'}
                            </button>
                        </div>
                    </div>
                </details>

                {/* Notification Email Editor */}
                <details className="group mb-8 bg-white/[0.02] border border-bronze-muted/20 rounded-lg overflow-hidden">
                    <summary className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all text-xs font-semibold text-text-muted">
                        <span>Email Pengirim Notifikasi Merchandise</span>
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 py-3 border-t border-bronze-muted/10 space-y-3">
                        <input
                            type="email"
                            value={merchNotificationEmail}
                            onChange={(e) => setMerchNotificationEmail(e.target.value)}
                            placeholder="contoh@gmail.com"
                            className="w-full px-2.5 py-1.5 bg-deep-black/60 border border-bronze-muted/20 rounded text-xs text-white font-mono placeholder:text-text-muted/40 focus:outline-none focus:border-gold-primary/40 transition-all"
                        />
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveMerchNotificationEmail}
                                disabled={merchNotificationEmailSaving}
                                className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                                {merchNotificationEmailSaving ? 'Menyimpan...' : 'Terapkan'}
                            </button>
                        </div>
                    </div>
                </details>

                {/* Limit Transaksi */}
                <ScrollReveal>
                    <div className="mb-8 bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-gold-primary" />
                                <div>
                                    <p className="text-sm font-bold text-white">Limit Transaksi</p>
                                    <p className="text-[10px] text-text-muted">Maksimal Rp {(event.max_merchandise_price || 1000000).toLocaleString('id-ID')} per transaksi</p>
                                </div>
                            </div>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const val = e.target.max_price.value.replace(/\D/g, '');
                                    if (!val) return;
                                    try {
                                        await axios.post(`/admin/events/${event.slug}/merchandise/update-max-price`, {
                                            max_merchandise_price: val
                                        });
                                        router.reload();
                                    } catch (err) {
                                        alert(err.response?.data?.errors?.max_merchandise_price?.[0] || 'Gagal update limit.');
                                    }
                                }}
                                className="flex items-center gap-2"
                            >
                                <input type="text" name="max_price"
                                    placeholder="Rp 1.000.000"
                                    className="w-32 px-2 py-1.5 bg-black/60 border border-white/20 rounded text-white text-[10px] focus:outline-none focus:border-gold-primary text-center"
                                />
                                <button type="submit" className="px-3 py-1.5 bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded text-[10px] font-bold hover:bg-gold-primary/30 transition-all">
                                    Simpan
                                </button>
                            </form>
                        </div>
                    </div>
                </ScrollReveal>

                {/* QRIS Upload */}
                <ScrollReveal>
                    <div className="mb-8 bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Image className="h-5 w-5 text-gold-primary" />
                                <div>
                                    <p className="text-sm font-bold text-white">QRIS Pembayaran</p>
                                    <p className="text-[10px] text-text-muted">{event.qris_image ? 'QRIS sudah diupload' : 'Belum ada QRIS'}</p>
                                </div>
                            </div>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const file = e.target.qris_image.files[0];
                                    if (!file) return alert('Pilih file terlebih dahulu.');
                                    const formData = new FormData();
                                    formData.append('qris_image', file);
                                    try {
                                        await axios.post(`/admin/events/${event.slug}/merchandise/qris-upload`, formData, {
                                            headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' },
                                        });
                                        router.reload();
                                    } catch (err) {
                                        alert(err.response?.data?.message || err.response?.data?.errors?.qris_image?.[0] || 'Gagal upload QRIS.');
                                    }
                                }}
                                className="flex items-center gap-2"
                            >
                                <input type="file" name="qris_image" accept="image/*" required
                                    className="text-[10px] text-text-muted file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gold-primary/20 file:text-gold-light hover:file:bg-gold-primary/30"
                                />
                                <button type="submit" className="px-3 py-1.5 bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded text-[10px] font-bold hover:bg-gold-primary/30 transition-all">
                                    Upload
                                </button>
                            </form>
                        </div>
                        {event.qris_image && (
                            <div className="mt-3 flex items-center gap-3">
                                <a href={`/storage/${event.qris_image}`} target="_blank" rel="noopener noreferrer">
                                    <img src={`/storage/${event.qris_image}`} alt="QRIS" className="w-48 h-48 object-contain rounded border border-white/10 hover:border-gold-primary/50 transition-all" />
                                </a>
                                <span className="text-[10px] text-text-muted">Klik untuk perbesar</span>
                            </div>
                        )}
                    </div>
                </ScrollReveal>

                {/* Products */}
                <ScrollReveal>
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Package className="h-4.5 w-4.5 text-gold-primary" /> Produk Tersedia
                            </h2>
                            <button onClick={() => openProductModal(null)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded text-[10px] font-bold hover:bg-gold-primary/30 transition-all"
                            >
                                <Plus className="h-3 w-3" /> Tambah Produk
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {products.map(p => (
                                <div key={p.id} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center transition-all duration-300 hover:border-gold-primary/30 hover:-translate-y-0.5 relative group">
                                    <p className="font-bold text-sm text-white">{p.name}</p>
                                    <p className="text-lg font-black text-gold-bright mt-1">Rp {p.price.toLocaleString('id-ID')}</p>
                                    <p className="text-[10px] text-gold-light font-semibold">{p.points} poin/pcs</p>
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openProductModal(p)}
                                            className="p-1 bg-white/10 hover:bg-white/20 rounded text-text-muted hover:text-white transition-all"
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </button>
                                        <button onClick={() => handleProductDelete(p)}
                                            className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 hover:text-red-300 transition-all"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>

                {/* Pending Orders */}
                <ScrollReveal>
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-amber-400" />
                                <h2 className="text-base font-bold text-white">
                                    Antrian Persetujuan <span className="text-amber-400">({totalPending})</span>
                                </h2>
                            </div>

                            <button
                                onClick={handleManualRefresh}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50 relative self-start sm:self-auto"
                            >
                                <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span>Perbarui Data</span>
                                {pendingCount > pendingOrders.length && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] text-white font-bold items-center justify-center">
                                            {pendingCount - pendingOrders.length}
                                        </span>
                                    </span>
                                )}
                            </button>
                        </div>
                        {pendingOrders.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-lg p-10 text-center">
                                <Clock className="h-10 w-10 text-text-muted/30 mx-auto mb-3" />
                                <p className="text-sm text-text-muted italic">Tidak ada pesanan tertunda.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {pendingOrders.map(o => (
                                    <div key={o.id} className="bg-white/5 border border-white/10 rounded-lg p-5 hover:border-amber-400/30 transition-all duration-300">
                                        {/* Header: Code + Date */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <span className="text-xs font-mono font-bold text-gold-light tracking-wide">{o.code}</span>
                                                <p className="text-[10px] text-text-muted mt-0.5">Dipesan pada {o.created_at}</p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-full text-[9px] font-bold whitespace-nowrap">
                                                <Clock className="h-3 w-3" /> Menunggu Verifikasi
                                            </span>
                                        </div>

                                        {/* Buyer Info */}
                                        <div className="bg-black/30 rounded-lg p-3 mb-3">
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Pembeli</p>
                                            <p className="text-sm font-bold text-white">{o.user.name}</p>
                                            {o.user.email && (
                                                <p className="text-[11px] text-text-muted">{o.user.email}</p>
                                            )}
                                        </div>

                                        {/* Contingent + Total */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Kontingen</p>
                                                <p className="text-xs font-semibold text-white">{o.contingent.school_name}</p>
                                                <span className="text-[9px] text-text-muted">{o.contingent.category_type}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Total</p>
                                                <p className="text-base font-black text-gold-bright font-mono">Rp {o.total_price.toLocaleString('id-ID')}</p>
                                                <span className="text-[9px] text-gold-light font-bold">{o.total_points} Poin</span>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="mb-3">
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1.5">Tiket Yang Dipesan</p>
                                            <div className="space-y-1">
                                                {o.items.map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-black/20 rounded px-3 py-1.5">
                                                        <span className="text-xs font-medium text-white">{item.product_name}</span>
                                                        <span className="text-[11px] text-text-muted font-mono">{item.quantity} Pcs</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Payment Proof */}
                                        <div className="mb-4">
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1.5">Bukti Transfer</p>
                                            {o.payment_proof ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/40">
                                                        <img
                                                            src={`/storage/${o.payment_proof}`}
                                                            alt="Bukti"
                                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => setProofModal(o)}
                                                        />
                                                    </div>
                                                    <button onClick={() => setProofModal(o)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" /> Lihat Bukti Transfer
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                                                    <XCircle className="h-3.5 w-3.5" /> Belum upload bukti pembayaran
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApprove(o.id)}
                                                disabled={!o.payment_proof}
                                                className="flex-1 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/25 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <CheckCircle className="h-4 w-4" /> Setujui Pembayaran
                                            </button>
                                            <button onClick={() => setRejectModal(o)}
                                                className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/25 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <XCircle className="h-4 w-4" /> Tolak
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollReveal>

                {/* Riwayat Persetujuan & Penolakan */}
                <ScrollReveal>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                            <div className="p-4 bg-white/[0.03] border-b border-white/10">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> Riwayat Persetujuan
                                </h3>
                            </div>
                            <div className="overflow-y-auto text-xs" style={{ maxHeight: '300px' }}>
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-[#0D0C0A] z-10 border-b border-white/10">
                                        <tr className="text-text-muted font-bold uppercase text-[10px]">
                                            <th className="p-2">Pembeli</th>
                                            <th className="p-2">Kontingen</th>
                                            <th className="p-2 text-right">Poin</th>
                                            <th className="p-2 text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {approvedOrders.map(o => (
                                            <tr key={o.id} className="hover:bg-white/[0.02]">
                                                <td className="p-2 font-semibold text-white">{o.user.name}</td>
                                                <td className="p-2 text-text-primary/80">{o.contingent.school_name}</td>
                                                <td className="p-2 text-right font-bold text-gold-light">{o.total_points}</td>
                                                <td className="p-2 text-right text-text-muted text-[10px]">{o.approved_at}</td>
                                            </tr>
                                        ))}
                                        {approvedOrders.length === 0 && (
                                            <tr><td colSpan={4} className="p-4 text-center text-text-muted italic">Belum ada.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                            <div className="p-4 bg-white/[0.03] border-b border-white/10">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <XCircle className="h-4.5 w-4.5 text-red-400" /> Riwayat Penolakan
                                </h3>
                            </div>
                            <div className="overflow-y-auto text-xs" style={{ maxHeight: '300px' }}>
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-[#0D0C0A] z-10 border-b border-white/10">
                                        <tr className="text-text-muted font-bold uppercase text-[10px]">
                                            <th className="p-2">Pembeli</th>
                                            <th className="p-2">Kontingen</th>
                                            <th className="p-2">Alasan</th>
                                            <th className="p-2 text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {rejectedOrders.map(o => (
                                            <tr key={o.id} className="hover:bg-white/[0.02]">
                                                <td className="p-2 font-semibold text-white">{o.user.name}</td>
                                                <td className="p-2 text-text-primary/80">{o.contingent.school_name}</td>
                                                <td className="p-2 text-red-300/80 max-w-[120px] truncate">{o.rejection_reason}</td>
                                                <td className="p-2 text-right text-text-muted text-[10px]">{o.rejected_at}</td>
                                            </tr>
                                        ))}
                                        {rejectedOrders.length === 0 && (
                                            <tr><td colSpan={4} className="p-4 text-center text-text-muted italic">Belum ada.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Leaderboard */}
                <ScrollReveal>
                    <div className="mb-8">
                        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                            <TrendingUp className="h-4.5 w-4.5 text-gold-primary" /> Sponsor Terbaik — Per Kategori
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {['U12', 'U16', 'U19', 'Purna'].map(cat => {
                                const label = { U12: 'SD', U16: 'SMP', U19: 'SMA', Purna: 'Purna' }[cat];
                                const items = leaderboard[cat] || [];
                                return (
                                    <div key={cat} className="bg-white/5 border border-white/20 rounded-lg">
                                        <div className="p-3 bg-white/[0.03] border-b border-white/10">
                                            <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-gold-primary" /> {label}
                                            </h3>
                                        </div>
                                        <div className="overflow-y-auto text-xs" style={{ maxHeight: '320px' }}>
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-[#0D0C0A] z-10 border-b border-white/10 text-[9px] text-text-muted uppercase tracking-wider font-bold">
                                                    <tr>
                                                        <th className="p-2 w-8 text-center">#</th>
                                                        <th className="p-2">Sekolah</th>
                                                        <th className="p-2 text-right">Poin</th>
                                                        <th className="p-2 text-right">Order</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {items.map((s, i) => (
                                                        <tr key={i} className="hover:bg-white/[0.02]">
                                                            <td className={`p-2 text-center font-bold text-[10px] ${i === 0 ? 'text-gold-bright' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-text-muted'}`}>
                                                                {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                                                            </td>
                                                            <td className="p-2 font-semibold text-white text-[10px]">{s.school_name}</td>
                                                            <td className="p-2 text-right font-bold text-gold-light">{s.total_points}</td>
                                                            <td className="p-2 text-right text-text-muted">{s.total_orders}</td>
                                                        </tr>
                                                    ))}
                                                    {items.length === 0 && (
                                                        <tr><td colSpan={4} className="p-6 text-center text-text-muted italic">Belum ada data.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ScrollReveal>

                {/* Product Revenue */}
                <ScrollReveal>
                    <div className="mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                            <div className="p-4 bg-white/[0.03] border-b border-white/10">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <TrendingUp className="h-4.5 w-4.5 text-gold-primary" /> Pemasukan Produk
                                </h3>
                            </div>
                            <div className="overflow-x-auto text-xs">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#0D0C0A] border-b border-white/10">
                                        <tr className="text-text-muted font-bold uppercase text-[10px]">
                                            <th className="p-3">Produk</th>
                                            <th className="p-3 text-right">Harga</th>
                                            <th className="p-3 text-right">Poin/pcs</th>
                                            <th className="p-3 text-right">Terjual</th>
                                            <th className="p-3 text-right">Pemasukan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {productRevenue.map((pr, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02]">
                                                <td className="p-3 font-semibold text-white">{pr.name}</td>
                                                <td className="p-3 text-right text-text-primary">Rp {pr.price.toLocaleString('id-ID')}</td>
                                                <td className="p-3 text-right text-gold-light">{pr.points}</td>
                                                <td className="p-3 text-right text-white">{pr.total_sold}</td>
                                                <td className="p-3 text-right font-extrabold text-white font-mono">Rp {pr.total_revenue.toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))}
                                        {productRevenue.length === 0 && (
                                            <tr><td colSpan={5} className="p-6 text-center text-text-muted italic">Belum ada data penjualan.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* All Orders with Search & Sort */}
                <ScrollReveal>
                    <div className="mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                            <div className="p-4 bg-white/[0.03] border-b border-white/10">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        <ShoppingBag className="h-4.5 w-4.5 text-gold-primary" /> Semua Transaksi
                                    </h3>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <a href={`/admin/events/${event.slug}/merchandise/export`}
                                            className="flex items-center gap-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold transition-all"
                                        >
                                            <Download className="h-3 w-3" /> Download Excel
                                        </a>
                                        <div className="relative flex-1 sm:flex-none">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="Cari pembeli, sekolah, produk..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full sm:w-64 pl-9 pr-3 py-2 bg-black/60 border border-white/20 rounded text-white focus:outline-none focus:border-gold-primary text-xs"
                                            />
                                        </div>
                                        <select
                                            value={sortBy}
                                            onChange={e => setSortBy(e.target.value)}
                                            className="px-3 py-2 bg-black/60 border border-white/20 rounded text-white focus:outline-none focus:border-gold-primary text-xs appearance-none cursor-pointer"
                                        >
                                            <option value="latest" className="bg-black">Terbaru</option>
                                            <option value="price_high" className="bg-black">Harga Tertinggi</option>
                                            <option value="price_low" className="bg-black">Harga Terendah</option>
                                            <option value="school" className="bg-black">Sekolah A-Z</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto text-xs">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#0D0C0A] border-b border-white/10">
                                        <tr className="text-text-muted font-bold uppercase text-[10px]">
                                            <th className="p-3">#</th>
                                            <th className="p-3">Pembeli</th>
                                            <th className="p-3">WA</th>
                                            <th className="p-3">Sekolah</th>
                                            <th className="p-3">Item</th>
                                            <th className="p-3 text-right">Total</th>
                                            <th className="p-3 text-right">Poin</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredOrders.map((o, idx) => (
                                            <tr key={o.id} className="hover:bg-white/[0.01]">
                                                <td className="p-3 text-text-muted font-mono">#{o.id}</td>
                                                <td className="p-3 font-semibold text-white">{o.buyer_name}</td>
                                                <td className="p-3">
                                                    {o.buyer_phone ? (
                                                        <a href={`https://wa.me/${o.buyer_phone.replace(/[^0-9]/g, '')}`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold underline"
                                                        >
                                                            {o.buyer_phone}
                                                        </a>
                                                    ) : <span className="text-text-muted/50">-</span>}
                                                </td>
                                                <td className="p-3 text-text-primary/80">
                                                    {o.school_name}
                                                    <span className="text-[9px] text-text-muted block">{o.category_type}</span>
                                                </td>
                                                <td className="p-3">
                                                    {o.items?.map((item, i) => (
                                                        <span key={i} className="text-[10px] text-text-muted block">
                                                            {item.product_name} ×{item.quantity}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td className="p-3 text-right font-extrabold text-white font-mono">Rp {o.total_price.toLocaleString('id-ID')}</td>
                                                <td className="p-3 text-right font-bold text-gold-light">{o.total_points}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                                                        o.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : o.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                        {o.status === 'approved' ? <CheckCircle className="h-2.5 w-2.5" />
                                                            : o.status === 'rejected' ? <XCircle className="h-2.5 w-2.5" />
                                                            : <Clock className="h-2.5 w-2.5" />}
                                                        {o.status}
                                                    </span>
                                                    {o.payment_proof && (
                                                        <button onClick={() => setProofModal(o)}
                                                            className="ml-1 text-[8px] text-gold-light underline hover:no-underline"
                                                        >
                                                            bukti
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right text-text-muted text-[10px] whitespace-nowrap">{o.created_at}</td>
                                            </tr>
                                        ))}
                                            {filteredOrders.length === 0 && (
                                                <tr><td colSpan={9} className="p-6 text-center text-text-muted italic">
                                                {searchQuery ? 'Tidak ditemukan.' : 'Belum ada transaksi.'}
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {allOrders.last_page > 1 && (
                                <div className="p-3 border-t border-white/10 flex items-center justify-center gap-1 text-xs">
                                    <button
                                        onClick={() => router.get(`/admin/events/${event.slug}/merchandise`, { page: 1 }, { preserveState: true })}
                                        disabled={allOrders.current_page === 1}
                                        className="px-2 py-1 rounded font-bold bg-white/5 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        &laquo;
                                    </button>
                                    <button
                                        onClick={() => router.get(`/admin/events/${event.slug}/merchandise`, { page: allOrders.current_page - 1 }, { preserveState: true })}
                                        disabled={allOrders.current_page === 1}
                                        className="px-2 py-1 rounded font-bold bg-white/5 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        &lsaquo;
                                    </button>
                                    {(() => {
                                        const pages = [];
                                        const total = allOrders.last_page;
                                        const current = allOrders.current_page;
                                        let start = Math.max(1, current - 2);
                                        let end = Math.min(total, current + 2);
                                        if (end - start < 4) {
                                            if (start === 1) end = Math.min(total, start + 4);
                                            else start = Math.max(1, end - 4);
                                        }
                                        for (let i = start; i <= end; i++) {
                                            pages.push(i);
                                        }
                                        return pages.map(page => (
                                            <button
                                                key={page}
                                                onClick={() => router.get(`/admin/events/${event.slug}/merchandise`, { page }, { preserveState: true })}
                                                className={`px-2.5 py-1 rounded font-bold ${page === allOrders.current_page ? 'bg-gold-primary text-black' : 'bg-white/5 text-text-muted hover:text-white'}`}
                                            >
                                                {page}
                                            </button>
                                        ));
                                    })()}
                                    <button
                                        onClick={() => router.get(`/admin/events/${event.slug}/merchandise`, { page: allOrders.current_page + 1 }, { preserveState: true })}
                                        disabled={allOrders.current_page === allOrders.last_page}
                                        className="px-2 py-1 rounded font-bold bg-white/5 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        &rsaquo;
                                    </button>
                                    <button
                                        onClick={() => router.get(`/admin/events/${event.slug}/merchandise`, { page: allOrders.last_page }, { preserveState: true })}
                                        disabled={allOrders.current_page === allOrders.last_page}
                                        className="px-2 py-1 rounded font-bold bg-white/5 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        &raquo;
                                    </button>
                                    <span className="ml-2 text-text-muted">
                                        {allOrders.current_page} / {allOrders.last_page}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollReveal>

            </div>

            {/* Proof Modal */}
            {proofModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setProofModal(null)}>
                    <div className="premium-card max-w-lg w-full p-6 border border-gold-primary/30" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-extrabold text-white">Bukti Pembayaran</h4>
                                {proofModal.code && (
                                    <p className="text-[10px] text-text-muted font-mono mt-0.5">{proofModal.code}</p>
                                )}
                            </div>
                            <span className="text-[10px] text-text-muted">{proofModal.user?.name || ''}</span>
                        </div>
                        {proofModal.payment_proof ? (
                            <div className="bg-black/30 rounded-lg p-2">
                                <img src={`/storage/${proofModal.payment_proof}`} alt="Bukti Pembayaran" className="w-full rounded-lg max-h-[400px] object-contain" />
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-black/30 rounded-lg">
                                <Upload className="h-10 w-10 text-text-muted/40 mx-auto mb-3" />
                                <p className="text-xs text-text-muted">Belum ada bukti pembayaran.</p>
                            </div>
                        )}
                        <div className="mt-4 flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
                            <div>
                                <p className="text-[9px] text-text-muted uppercase tracking-wider">Total Pembayaran</p>
                                <p className="text-lg font-black text-gold-bright font-mono">Rp {proofModal.total_price?.toLocaleString('id-ID')}</p>
                            </div>
                            {proofModal.user?.email && (
                                <div className="text-right">
                                    <p className="text-[9px] text-text-muted uppercase tracking-wider">Email</p>
                                    <p className="text-[11px] text-white font-medium">{proofModal.user.email}</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setProofModal(null)}
                            className="mt-4 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
                    <div className="premium-card max-w-sm w-full p-6 border border-red-500/30" onClick={e => e.stopPropagation()}>
                        <h4 className="text-sm font-extrabold text-white mb-2">Tolak Pesanan</h4>
                        <p className="text-xs text-text-primary/80 mb-3">Pembeli: <strong className="text-white">{rejectModal.user?.name}</strong></p>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Alasan penolakan..."
                            className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded text-white text-xs focus:outline-none focus:border-red-400 mb-4"
                            rows={3}
                        />
                        {rejectModal.payment_proof && (
                            <div className="mb-4">
                                <p className="text-[10px] text-text-muted mb-2">Bukti pembayaran:</p>
                                <img src={`/storage/${rejectModal.payment_proof}`} alt="Bukti" className="w-full max-h-32 object-cover rounded" />
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                className="flex-1 py-2 bg-white/5 border border-white/10 rounded text-xs font-bold text-text-muted hover:text-white transition-all"
                            >
                                Batal
                            </button>
                            <button onClick={() => handleReject(rejectModal.id)}
                                disabled={!rejectReason.trim()}
                                className="flex-1 py-2 bg-red-500/20 border border-red-500/30 rounded text-xs font-bold text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-40"
                            >
                                Tolak
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {productModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setProductModal(null)}>
                    <div className="premium-card max-w-sm w-full p-6 border border-gold-primary/30" onClick={e => e.stopPropagation()}>
                        <h4 className="text-sm font-extrabold text-white mb-4">
                            {productModal.isNew ? 'Tambah Produk' : 'Edit Produk'}
                        </h4>
                        <div className="space-y-3">
                            <input
                                value={productForm.name}
                                onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Nama produk"
                                className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded text-white text-xs focus:outline-none focus:border-gold-primary"
                            />
                            <input
                                value={productForm.price}
                                onChange={e => setProductForm(f => ({ ...f, price: e.target.value.replace(/\D/g, '') }))}
                                placeholder="Harga (Rp)"
                                type="text"
                                inputMode="numeric"
                                className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded text-white text-xs focus:outline-none focus:border-gold-primary"
                            />
                            <input
                                value={productForm.points}
                                onChange={e => setProductForm(f => ({ ...f, points: e.target.value.replace(/\D/g, '') }))}
                                placeholder="Poin per pcs"
                                type="text"
                                inputMode="numeric"
                                className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded text-white text-xs focus:outline-none focus:border-gold-primary"
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setProductModal(null)}
                                className="flex-1 py-2 bg-white/5 border border-white/10 rounded text-xs font-bold text-text-muted hover:text-white transition-all"
                            >
                                Batal
                            </button>
                            <button onClick={handleProductSubmit}
                                disabled={!productForm.name || !productForm.price || !productForm.points}
                                className="flex-1 py-2 bg-gold-primary/20 border border-gold-primary/30 rounded text-xs font-bold text-gold-light hover:bg-gold-primary/30 transition-all disabled:opacity-40"
                            >
                                {productModal.isNew ? 'Simpan' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
