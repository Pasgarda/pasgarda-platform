import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Star, ToggleLeft, ToggleRight, Trash2, Search, ArrowLeft, User } from 'lucide-react';
import axios from 'axios';
import ConfirmationModal from '../../Components/ConfirmationModal';

export default function AdminTestimonials({ event, testimonials, auth }) {
    const [search, setSearch] = useState('');
    const [toggleTarget, setToggleTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [loading, setLoading] = useState(false);

    const testimonialsList = Array.isArray(testimonials) ? testimonials : (testimonials?.data || []);

    const filtered = testimonialsList.filter((t) =>
        t.user_name.toLowerCase().includes(search.toLowerCase()) ||
        t.message.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggleStatus = (id) => setToggleTarget(id);

    const confirmToggle = () => {
        if (!toggleTarget) return;
        setLoading(true);
        router.post(`/admin/testimonials/${toggleTarget}/toggle`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setToggleTarget(null);
                setLoading(false);
            },
            onError: () => {
                alert('Gagal mengubah status.');
                setToggleTarget(null);
                setLoading(false);
            },
        });
    };

    const handleDestroy = (id) => setDeleteTarget(id);

    const confirmDestroy = () => {
        if (!deleteTarget) return;
        setLoading(true);
        router.delete(`/admin/testimonials/${deleteTarget}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setLoading(false);
            },
            onError: () => {
                alert('Gagal menghapus testimoni.');
                setDeleteTarget(null);
                setLoading(false);
            },
        });
    };

    const statusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            enabled: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            disabled: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${styles[status] || styles.pending}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Moderasi Testimoni" />
            <div className="max-w-5xl mx-auto space-y-8">
                <a href={`/admin/events/${event.slug}`} className="inline-flex items-center gap-1.5 text-xs text-bronze-muted hover:text-gold-light transition-all">
                    <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Dashboard
                </a>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-white">Moderasi Testimoni</h1>
                        <p className="text-xs text-text-muted mt-1">Kelola testimoni pengguna ({testimonials?.total || testimonialsList.length} total)</p>
                    </div>
                    <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-bronze-muted" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari testimoni..."
                            className="w-full md:w-64 pl-9 pr-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-xs text-text-primary focus:outline-none focus:border-gold-primary"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {filtered.map((t) => (
                        <div key={t.id} className="premium-card p-5 border border-bronze-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                {t.user_avatar ? (
                                    <img src={`/storage/${t.user_avatar}`} alt="" className="h-9 w-9 rounded-full object-cover shrink-0 border border-bronze-muted/20" />
                                ) : (
                                    <div className="h-9 w-9 rounded-full bg-accent-maroon/30 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-bronze-muted" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-white text-sm">{t.user_name}</span>
                                        {statusBadge(t.status)}
                                    </div>
                                    <div className="flex items-center gap-0.5 mt-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} className={`h-3 w-3 ${s <= t.rating ? 'fill-gold-primary text-gold-primary' : 'text-bronze-muted/30'}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-text-primary/80 mt-2 break-words">{t.message}</p>
                                    <p className="text-[9px] text-text-muted mt-2">{t.created_at}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleToggleStatus(t.id)}
                                    className={`p-2 rounded text-xs border transition-all ${
                                        t.status === 'enabled'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                            : 'bg-white/5 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                    }`}
                                    title={t.status === 'enabled' ? 'Nonaktifkan' : 'Aktifkan'}
                                >
                                    {t.status === 'enabled' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                </button>
                                <button
                                    onClick={() => handleDestroy(t.id)}
                                    className="p-2 rounded text-xs border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                    title="Hapus"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-xs text-bronze-muted italic text-center py-12">
                            {search ? 'Tidak ada testimoni yang cocok dengan pencarian.' : 'Belum ada testimoni dari pengguna.'}
                        </p>
                    )}
                </div>
            </div>

            <ConfirmationModal
                open={!!toggleTarget}
                onClose={() => { if (!loading) setToggleTarget(null); }}
                onConfirm={confirmToggle}
                title="Ubah Status Testimoni"
                message="Apakah Anda yakin ingin mengubah status tampilan testimoni ini?"
                confirmText="Ya, Ubah"
                loading={loading}
            />
            <ConfirmationModal
                open={!!deleteTarget}
                onClose={() => { if (!loading) setDeleteTarget(null); }}
                onConfirm={confirmDestroy}
                variant="danger"
                title="Hapus Testimoni"
                message="Hapus testimoni ini? Tindakan ini permanen."
                confirmText="Ya, Hapus"
                loading={loading}
            />
        </div>
    );
}