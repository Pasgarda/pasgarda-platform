import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Newspaper, Plus, Trash2, Edit, X, Save, ArrowLeft } from 'lucide-react';
import ConfirmationModal from '../../Components/ConfirmationModal';
import StatusBadge from '../../Components/StatusBadge';
import ScrollReveal from '../../Components/ScrollReveal';

export default function News({ news }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        title: '',
        category: 'Announcement',
        summary: '',
        date: '',
    });

    const handleEditClick = (item) => {
        clearErrors();
        setData({
            title: item.title,
            category: item.category,
            summary: item.summary,
            date: item.date,
        });
        setEditId(item.id);
        setIsEditing(true);
    };

    const handleCancel = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setEditId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/admin/news/${editId}`, {
                onSuccess: () => {
                    handleCancel();
                    alert('Berita berhasil diperbarui!');
                }
            });
        } else {
            post('/admin/news', {
                onSuccess: () => {
                    reset();
                    alert('Berita berhasil ditambahkan!');
                }
            });
        }
    };

    const handleDelete = (id) => setDeleteTarget(id);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        destroy(`/admin/news/${deleteTarget}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Kelola Berita & Pengumuman" />
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header */}
                <ScrollReveal>
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Super Admin Room
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
                            <Newspaper className="h-7 w-7 text-gold-primary" /> Kelola <span className="text-gold-primary">Berita & Pengumuman</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">Mengelola publikasi berita, pengumuman, dan berita pencapaian di beranda.</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <a
                            href="/admin/dashboard"
                            className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" /> Dashboard Admin
                        </a>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Form & List Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Form Input */}
                    <div className="lg:col-span-1">
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3 flex items-center gap-1.5">
                                {isEditing ? <Edit className="h-4.5 w-4.5 text-gold-primary" /> : <Plus className="h-4.5 w-4.5 text-gold-primary" />}
                                <span>{isEditing ? 'Edit Berita' : 'Tambah Berita Baru'}</span>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Judul Berita
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Judul Berita"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    {errors.title && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Kategori
                                    </label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    >
                                        <option value="Announcement">Announcement (Pengumuman)</option>
                                        <option value="Competition">Competition (Kompetisi)</option>
                                        <option value="Achievement">Achievement (Pencapaian)</option>
                                    </select>
                                    {errors.category && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.category}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Tanggal Tampil
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        placeholder="Contoh: 01 Jun 2026"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    {errors.date && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.date}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Ringkasan (Summary)
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={data.summary}
                                        onChange={(e) => setData('summary', e.target.value)}
                                        placeholder="Ringkasan isi berita..."
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs resize-none"
                                    />
                                    {errors.summary && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.summary}</p>}
                                </div>

                                <div className="flex gap-2">
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="flex-1 py-2 border border-bronze-muted/30 text-bronze-muted rounded text-xs font-bold hover:text-white transition-all flex items-center justify-center gap-1"
                                        >
                                            <X className="h-3.5 w-3.5" /> Batal
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 py-2 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-extrabold rounded text-xs tracking-wide hover:brightness-110 transition-all flex items-center justify-center gap-1"
                                    >
                                        <Save className="h-3.5 w-3.5" /> {isEditing ? 'Simpan' : 'Tambah'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Data List */}
                    <div className="lg:col-span-2">
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3">
                                Daftar Berita & Pengumuman ({news.length})
                            </h2>

                            <div className="space-y-4 max-h-[600px] overflow-y-auto scroll-smooth pr-1">
                                {news.map((item, i) => (
                                    <ScrollReveal delay={i * 80}>
                                        <div key={item.id} className="p-4 bg-deep-black/50 border border-bronze-muted/10 rounded flex justify-between items-start gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                                    item.category === 'Announcement' ? 'bg-accent-mahogany/25 text-accent-mahogany border border-accent-mahogany/30' :
                                                    item.category === 'Competition' ? 'bg-gold-primary/25 text-gold-light border border-gold-primary/30' :
                                                    'bg-accent-maroon/25 text-white/90 border border-accent-maroon/30'
                                                }`}>
                                                    {item.category}
                                                </span>
                                                <span className="text-[10px] text-text-muted font-medium">{item.date}</span>
                                            </div>
                                            <h3 className="font-bold text-white text-sm leading-snug">{item.title}</h3>
                                            <p className="text-xs text-text-primary/70 leading-relaxed">{item.summary}</p>
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleEditClick(item)}
                                                className="p-1.5 bg-white/5 border border-white/10 hover:border-gold-primary/30 rounded text-gold-light hover:bg-gold-primary/10 transition-all"
                                                title="Edit"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 bg-white/5 border border-white/10 hover:border-accent-mahogany/30 rounded text-accent-mahogany hover:bg-accent-mahogany/10 transition-all"
                                                title="Hapus"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    </ScrollReveal>
                                ))}
                                {news.length === 0 && (
                                    <p className="text-xs text-bronze-muted italic text-center py-20 animate-fade-in">Belum ada berita ditambahkan.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <ConfirmationModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                variant="danger"
                title="Hapus Berita"
                message="Apakah Anda yakin ingin menghapus berita ini?"
                confirmText="Ya, Hapus"
            />
        </div>
    );
}
