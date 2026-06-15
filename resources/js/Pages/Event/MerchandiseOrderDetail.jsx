import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, ShieldAlert, Upload, X, MessageCircle, ShoppingBag, Star, CreditCard, Image, RefreshCw, History } from 'lucide-react';
import axios from 'axios';
import ScrollReveal from '../../Components/ScrollReveal';

const STEPS = [
    { key: 'order', label: 'Pesan' },
    { key: 'pay', label: 'Bayar' },
    { key: 'verify', label: 'Verifikasi' },
    { key: 'done', label: 'Lunas' },
];

function getActiveStep(order) {
    if (order.status === 'approved') return 3;
    if (order.status === 'rejected') return 2;
    if (order.payment_proof) return 2;
    return 1;
}

export default function MerchandiseOrderDetail({ order }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [statusToast, setStatusToast] = useState('');
    const [pollCountdown, setPollCountdown] = useState(10);
    const [deadline, setDeadline] = useState('');
    const prevStatusRef = useRef(order.status);

    const activeStep = getActiveStep(order);
    const isApproved = order.status === 'approved';
    const isRejected = order.status === 'rejected';
    const isWaiting = order.status === 'pending' && !!order.payment_proof;
    const isDraft = order.status === 'pending' && !order.payment_proof;

    // Countdown timer for payment deadline
    useEffect(() => {
        if (!order.expires_at) return;
        const expiresAt = new Date(order.expires_at).getTime();

        const tick = () => {
            const now = Date.now();
            const diff = expiresAt - now;
            if (diff <= 0) {
                setDeadline('Kedaluwarsa');
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setDeadline(`${h}j ${m}m ${s}d`);
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [order.expires_at]);

    useEffect(() => {
        if (prevStatusRef.current !== order.status) {
            if (order.status === 'approved') {
                setStatusToast('Pembayaran berhasil diverifikasi! Poin sponsor sudah aktif.');
            } else if (order.status === 'rejected') {
                setStatusToast('Pembayaran ditolak oleh admin. Lihat alasan di bawah.');
            }
            prevStatusRef.current = order.status;
            setTimeout(() => setStatusToast(''), 6000);
        }
    }, [order.status]);

    useEffect(() => {
        if (!isWaiting) return;

        setPollCountdown(10);
        const countdownTimer = setInterval(() => {
            setPollCountdown((prev) => (prev <= 1 ? 10 : prev - 1));
        }, 1000);

        const pollTimer = setInterval(() => {
            router.reload({ only: ['order'], preserveState: true, preserveScroll: true });
        }, 10000);

        return () => {
            clearInterval(countdownTimer);
            clearInterval(pollTimer);
        };
    }, [isWaiting]);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 3 * 1024 * 1024) {
            setUploadError('File maksimal 3MB.');
            return;
        }
        setFile(f);
        setUploadError('');
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadError('Pilih file bukti transfer terlebih dahulu.');
            return;
        }
        setUploadError('');
        setUploadSuccess('');
        setUploading(true);

        const formData = new FormData();
        formData.append('payment_proof', file);

        try {
            await axios.post(`/merchandise-orders/${order.id}/upload-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadSuccess('Bukti pembayaran berhasil diunggah!');
            setFile(null);
            setTimeout(() => router.reload(), 1000);
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Gagal mengunggah bukti transfer.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-checkerboard flex flex-col items-center justify-center p-4">
            <Head title={`Pesanan #${order.id}`} />

            <div className="w-full max-w-2xl premium-card p-6 md:p-8 border border-[#8C6828]/30 relative overflow-hidden my-8">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    isApproved ? 'from-emerald-500 via-emerald-400 to-emerald-500'
                    : isRejected ? 'from-rose-500 via-rose-400 to-rose-500'
                    : 'from-accent-maroon via-gold-primary to-accent-maroon'
                }`} />

                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href={`/events/${order.event.slug}/merchandise`}
                        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="h-4 w-4" /> Produk Sponsor
                    </Link>
                    <span className="text-[10px] font-mono text-text-muted">#{order.id}</span>
                </div>

                <ScrollReveal>
                <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-bronze-muted/20" />
                    <div
                        className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-gold-primary to-gold-bright transition-all duration-700"
                        style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
                    />
                    {STEPS.map((step, idx) => (
                        <div key={step.key} className="flex flex-col items-center z-10 relative">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                                idx <= activeStep
                                    ? idx === activeStep && isRejected
                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                        : 'bg-gradient-to-br from-gold-primary to-gold-bright text-deep-black shadow-lg shadow-gold-primary/30'
                                    : 'bg-deep-black border border-bronze-muted/30 text-text-muted'
                            }`}>
                                {idx < activeStep ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : idx === activeStep && isRejected ? (
                                    <ShieldAlert className="h-4 w-4" />
                                ) : (
                                    <span>{idx + 1}</span>
                                )}
                            </div>
                            <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider ${
                                idx <= activeStep ? 'text-gold-light' : 'text-text-muted'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
                </ScrollReveal>

                {isDraft && deadline && (
                    <div className={`mb-8 p-5 rounded-xl text-sm font-bold text-center border-2 ${
                        deadline === 'Kedaluwarsa'
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-500/10'
                            : 'bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-lg shadow-amber-500/10'
                    }`}>
                        {deadline === 'Kedaluwarsa' ? (
                            <div className="flex items-start gap-3 justify-center">
                                <Clock className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
                                <div>
                                    <p className="text-sm text-white font-black uppercase tracking-wider">Waktu Habis</p>
                                    <p className="text-xs text-rose-300/80 mt-1">Batas waktu pembayaran telah habis. Pesanan dibatalkan secara otomatis.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                                    <Clock className="h-5 w-5 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-extrabold uppercase tracking-wider text-sm">Batas Waktu Pembayaran</p>
                                    <p className="text-xs text-amber-300/80 mt-0.5">
                                        Selesaikan pembayaran sebelum{' '}
                                        <span className="text-white font-black text-base tracking-widest bg-amber-950/40 px-2 py-0.5 rounded inline-block mt-1">{deadline}</span>
                                    </p>
                                    <p className="text-[10px] text-amber-400/60 mt-2">Jika melewati batas, pesanan akan dibatalkan secara otomatis.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isApproved && (
                    <ScrollReveal>
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                            <div className="h-16 w-16 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-extrabold text-white">Pembayaran Lunas</h2>
                            <p className="text-xs text-emerald-400 font-semibold mt-1">Pesanan berhasil diverifikasi oleh admin</p>
                        </div>

                        <div className="premium-card p-5 border border-emerald-500/20 bg-emerald-950/10 space-y-4">
                            <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-3">
                                <ShoppingBag className="h-4 w-4 text-emerald-400" />
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Struk Transaksi</h3>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Order ID</span>
                                    <span className="font-mono font-bold text-white">#{order.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Tanggal Pemesanan</span>
                                    <span className="text-white font-semibold">{order.created_at}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Kontingen</span>
                                    <span className="text-white font-semibold">{order.school_name}</span>
                                </div>
                                <div className="border-t border-white/5 pt-2 space-y-1.5">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span className="text-text-primary/80">{item.product_name} <span className="text-text-muted">×{item.quantity}</span></span>
                                            <span className="font-mono text-white">Rp {item.total_price.toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-emerald-500/20 pt-2 flex justify-between font-extrabold">
                                    <span className="text-emerald-300">Total Dibayar</span>
                                    <span className="font-mono text-emerald-400">Rp {order.total_price.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-text-muted">Poin Sponsor</span>
                                    <span className="font-mono text-gold-light font-bold">{order.total_points} poin</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-gold-primary/10 to-gold-bright/5 border border-gold-primary/30 rounded space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 bg-gold-primary/20 rounded-full flex items-center justify-center shrink-0">
                                    <Star className="h-5 w-5 text-gold-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-white">
                                        Poin sponsor telah otomatis diberikan!
                                    </h3>
                                    <p className="text-[11px] text-text-muted mt-0.5">
                                        Sebanyak <strong className="text-gold-light">{order.total_points} poin sponsor</strong> telah ditambahkan ke kontingen <strong className="text-white">{order.school_name}</strong>.
                                    </p>
                                    <p className="text-[10px] text-text-muted mt-3 leading-relaxed">
                                        Cukup tunjukkan halaman riwayat ini saat mengambil produk sponsor di <strong className="text-white">booth merchandise</strong> pada hari H.
                                    </p>
                                    {order.event?.merchandise_wa_contacts?.length > 0 && (
                                        <div className="pt-3 mt-3 border-t border-gold-primary/20 space-y-2">
                                            <p className="text-[9px] text-text-muted font-semibold uppercase tracking-wider">Ada kendala? Hubungi:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {order.event.merchandise_wa_contacts.map((contact, idx) => (
                                                <a key={idx}
                                                    href={`https://wa.me/${(contact.number || '').replace(/[^0-9]/g, '')}?text=Halo%20panitia%20PASGARDA%2C%20saya%20ingin%20menanyakan%20pengambilan%20produk%20sponsor%20saya%20untuk%20Pesanan%20%23${order.id}.`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="flex-1 min-w-[100px] px-3 py-2 bg-gold-primary/20 hover:bg-gold-primary/30 text-gold-light border border-gold-primary/30 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                                                >
                                                    <MessageCircle className="h-3 w-3" /> {contact.name}
                                                </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Link
                                href={`/events/${order.event.slug}/merchandise`}
                                className="block w-full py-2.5 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded text-xs tracking-wider uppercase text-center transition-all"
                            >
                                Beli Produk Sponsor Lagi →
                            </Link>
                        </div>
                    </div>
                    </ScrollReveal>
                )}

                {isRejected && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                            <div className="h-16 w-16 bg-rose-500/20 border-2 border-rose-500/40 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ShieldAlert className="h-8 w-8 text-rose-400" />
                            </div>
                            <h2 className="text-xl font-extrabold text-white">Pembayaran Ditolak</h2>
                            <p className="text-xs text-rose-400 font-semibold mt-1">Admin menolak bukti transfer Anda</p>
                        </div>

                        {order.rejection_reason && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded space-y-2">
                                <p className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Alasan Penolakan:</p>
                                <p className="text-xs text-rose-200">{order.rejection_reason}</p>
                            </div>
                        )}

                        {order.payment_proof && (
                            <button onClick={() => setPreviewImage(`/storage/${order.payment_proof}`)}
                                className="w-full py-2 bg-white/5 border border-white/10 rounded text-xs font-semibold text-text-muted hover:text-white transition-all"
                            >
                                Lihat Bukti yang Ditolak
                            </button>
                        )}

                        {order.event?.merchandise_wa_contacts?.length > 0 ? (
                        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded space-y-3">
                            <p className="text-xs text-text-muted">Silakan hubungi panitia jika Anda merasa ini adalah kesalahan:</p>
                            <div className="flex flex-wrap gap-2">
                                {order.event.merchandise_wa_contacts.map((contact, idx) => (
                                <a key={idx} href={`https://wa.me/${(contact.number || '').replace(/[^0-9]/g, '')}?text=Halo%20panitia%20PASGARDA%2C%20saya%20ingin%20mengonfirmasi%20bukti%20transfer%20saya%20yang%20ditolak%20untuk%20Pesanan%20Produk%20Sponsor%20%23${order.id}.`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex-1 min-w-[120px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                                >
                                    <MessageCircle className="h-3 w-3" /> {contact.name}
                                </a>
                                ))}
                            </div>
                        </div>
                        ) : null}

                        <p className="text-[10px] text-text-muted text-center">Silakan buat pesanan baru dengan bukti transfer yang valid.</p>
                    </div>
                )}

                {isWaiting && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                            <div className="h-16 w-16 bg-sky-500/20 border-2 border-sky-500/40 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Clock className="h-8 w-8 text-sky-400 animate-pulse" />
                            </div>
                            <h2 className="text-xl font-extrabold text-white">Menunggu Verifikasi</h2>
                            <p className="text-xs text-sky-400 font-semibold mt-1">Bukti transfer telah diunggah, admin sedang memverifikasi</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => setPreviewImage(`/storage/${order.payment_proof}`)}
                                className="flex-1 py-2 bg-white/5 border border-white/10 rounded text-xs font-semibold text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                            >
                                Lihat Bukti Transfer
                            </button>
                            <label className="flex-1 cursor-pointer py-2 border border-bronze-muted/30 text-bronze-muted rounded text-xs font-semibold hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-1">
                                <Upload className="h-3 w-3" /> Ubah Bukti
                                <input type="file" accept="image/*" className="hidden"
                                    onChange={async (e) => {
                                        const f = e.target.files[0];
                                        if (!f) return;
                                        setUploading(true);
                                        const formData = new FormData();
                                        formData.append('payment_proof', f);
                                        try {
                                            await axios.post(`/merchandise-orders/${order.id}/upload-proof`, formData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            router.reload();
                                        } catch (err) {
                                            alert(err.response?.data?.message || 'Gagal mengubah bukti transfer.');
                                        } finally {
                                            setUploading(false);
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded text-xs text-sky-300 space-y-1">
                            <p className="font-semibold text-white">Mohon bersabar</p>
                            <p>Proses verifikasi biasanya membutuhkan waktu 5–30 menit pada jam operasional. Halaman ini akan otomatis berubah setelah admin mengkonfirmasi pembayaran Anda.</p>
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-sky-500/10">
                                <RefreshCw className="h-3 w-3 text-sky-400 animate-spin" style={{ animationDuration: '3s' }} />
                                <span className="text-[10px] text-sky-400 font-semibold">Auto-refresh aktif — mengecek ulang dalam {pollCountdown}s</span>
                            </div>
                        </div>
                    </div>
                )}

                {isDraft && (
                    <ScrollReveal>
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                            <div className="h-16 w-16 bg-amber-500/20 border-2 border-amber-500/40 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CreditCard className="h-8 w-8 text-amber-400" />
                            </div>
                            <h2 className="text-xl font-extrabold text-white">Lakukan Pembayaran QRIS</h2>
                            <p className="text-xs text-amber-400 font-semibold mt-1">Scan QRIS di bawah lalu unggah bukti pembayaran</p>
                        </div>

                        <div className="flex flex-col items-center p-6 bg-white rounded-xl border border-amber-500/20">
                            {order.qris_image ? (
                                <img
                                    src={`/storage/${order.qris_image}`}
                                    alt="QRIS"
                                    className="w-64 h-auto object-contain"
                                />
                            ) : (
                                <div className="p-8 text-center">
                                    <Image className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-xs text-gray-500 font-medium">QRIS belum tersedia</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Hubungi panitia untuk info pembayaran.</p>
                                </div>
                            )}
                            <p className="text-xs text-gray-600 mt-3 font-semibold text-center">
                                Scan QRIS ini dengan aplikasi pembayaran Anda
                            </p>
                        </div>

                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded text-xs space-y-2">
                            <p className="font-bold text-white text-sm mb-2">Instruksi Pembayaran</p>
                            <p>Total Bayar: <strong className="text-gold-light font-mono text-sm">Rp {order.total_price.toLocaleString('id-ID')}</strong></p>
                            <p className="text-[10px] text-text-muted mt-2 italic border-t border-amber-500/10 pt-2">
                                Setelah membayar, unggah screenshot bukti pembayaran QRIS di bawah untuk diverifikasi admin.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Unggah Bukti Pembayaran QRIS (JPG/PNG/WEBP, Max 3MB)</label>
                            <input type="file" accept="image/*"
                                onChange={(e) => { setFile(e.target.files[0]); setUploadError(''); }}
                                className="block w-full text-xs text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-[11px] file:font-extrabold file:bg-white/5 file:text-white hover:file:bg-white/10 file:transition-all"
                            />
                            {uploadError && <p className="text-rose-400 text-[10px] font-semibold">{uploadError}</p>}
                            {uploadSuccess && <p className="text-emerald-400 text-[10px] font-semibold">{uploadSuccess}</p>}

                            <button onClick={handleUpload} disabled={uploading || !file}
                                className="w-full py-2.5 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <Upload className="h-3.5 w-3.5" />
                                {uploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran QRIS'}
                            </button>
                        </div>
                    </div>
                    </ScrollReveal>
                )}

                <ScrollReveal>
                <div className="mt-8 pt-6 border-t border-bronze-muted/20 space-y-4">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Detail Pesanan</h4>
                    <div className="bg-deep-black/40 rounded p-4 border border-white/5 space-y-2 text-xs">
                        {order.event && (
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-text-muted">Event</span>
                                <span className="text-white font-semibold text-right">
                                    {order.event.name}<br />
                                    <span className="text-[10px] text-text-muted font-normal">{order.event.date_start} - {order.event.date_end} &bull; {order.event.venue}</span>
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-text-muted">Kontingen</span>
                            <span className="text-white font-semibold">{order.school_name}</span>
                        </div>
                        <div className="border-t border-white/5 pt-2 space-y-1">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between">
                                    <span className="text-text-primary/80">{item.product_name} <span className="text-text-muted">×{item.quantity}</span></span>
                                    <span className="font-mono text-white">Rp {item.total_price.toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-white/5 pt-2 flex justify-between font-extrabold">
                            <span className="text-gold-cream">Total</span>
                            <span className="font-mono text-gold-primary">Rp {order.total_price.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">Poin Sponsor</span>
                            <span className="font-mono text-gold-light font-bold">{order.total_points} poin</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-text-muted pt-1">
                            <span>Dipesan pada</span>
                            <span>{order.created_at}</span>
                        </div>
                    </div>
                </div>
                </ScrollReveal>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-bronze-muted/10 pt-4">
                    <Link href="/merchandise-orders" className="inline-flex items-center gap-1.5 text-xs text-gold-light hover:text-gold-bright border border-gold-primary/30 hover:border-gold-primary/50 bg-gold-primary/5 hover:bg-gold-primary/10 px-4 py-2 rounded-lg transition-all font-bold uppercase tracking-wider">
                        <History className="h-3.5 w-3.5" /> Riwayat Pembelian Produk
                    </Link>
                    <Link href={`/events/${order.event.slug}/merchandise`} className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold">
                        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Produk Sponsor
                    </Link>
                </div>
            </div>

            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-3xl w-full flex flex-col items-center">
                        <button onClick={() => setPreviewImage(null)}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-gold-light transition-all flex items-center gap-1 text-xs uppercase font-extrabold tracking-wider bg-black/40 rounded"
                        >
                            <X className="h-4 w-4" /> Tutup
                        </button>
                        <img src={previewImage} alt="Bukti Transfer"
                            className="max-h-[80vh] w-auto object-contain rounded border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {statusToast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl text-sm font-bold backdrop-blur-sm animate-fade-in max-w-md text-center ${
                    statusToast.includes('berhasil')
                        ? 'bg-emerald-500/90 text-white border border-emerald-400/30'
                        : 'bg-rose-500/90 text-white border border-rose-400/30'
                }`}>
                    {statusToast}
                </div>
            )}
        </div>
    );
}
