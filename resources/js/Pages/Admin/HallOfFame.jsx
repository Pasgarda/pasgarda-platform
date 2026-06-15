import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Award, Plus, Trash2, Edit, X, Save, ArrowLeft } from 'lucide-react';
import ConfirmationModal from '../../Components/ConfirmationModal';
import ScrollReveal from '../../Components/ScrollReveal';

export default function HallOfFame({ hallOfFames }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        year: '',
        event_name: '',
        champion: '',
        runner_up: '',
        best_commander: '',
        favorite: '',
    });

    const handleEditClick = (item) => {
        clearErrors();
        setData({
            year: item.year,
            event_name: item.event_name,
            champion: item.champion,
            runner_up: item.runner_up,
            best_commander: item.best_commander,
            favorite: item.favorite,
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
            put(`/admin/hall-of-fame/${editId}`, {
                onSuccess: () => {
                    handleCancel();
                    alert('Hall of Fame berhasil diperbarui!');
                }
            });
        } else {
            post('/admin/hall-of-fame', {
                onSuccess: () => {
                    reset();
                    alert('Hall of Fame berhasil ditambahkan!');
                }
            });
        }
    };

    const handleDelete = (id) => setDeleteTarget(id);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        destroy(`/admin/hall-of-fame/${deleteTarget}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Kelola Hall of Fame" />
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header */}
                <ScrollReveal>
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Super Admin Room
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
                            <Award className="h-7 w-7 text-gold-primary" /> Kelola <span className="text-gold-primary">Hall of Fame</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">Mengelola daftar pemenang historis (Hall of Fame) yang dimuat di halaman beranda.</p>
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
                                <span>{isEditing ? 'Edit Hall of Fame' : 'Tambah Pemenang'}</span>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Tahun Acara
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={data.year}
                                        onChange={(e) => setData('year', e.target.value)}
                                        placeholder="Contoh: 2025"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    {errors.year && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.year}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Nama Event
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.event_name}
                                        onChange={(e) => setData('event_name', e.target.value)}
                                        placeholder="Contoh: LPBB PASGARDA VOL.19"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    {errors.event_name && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.event_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Juara Umum
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.champion}
                                        onChange={(e) => setData('champion', e.target.value)}
                                        placeholder="Nama Kontingen / Sekolah"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    {errors.champion && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.champion}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Runner Up
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.runner_up}
                                        onChange={(e) => setData('runner_up', e.target.value)}
                                        placeholder="Nama Kontingen / Sekolah"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    {errors.runner_up && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.runner_up}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Pelatih / Danton Terbaik
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.best_commander}
                                        onChange={(e) => setData('best_commander', e.target.value)}
                                        placeholder="Nama Pelatih / Danton"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    {errors.best_commander && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.best_commander}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Kontingen Terfavorit
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.favorite}
                                        onChange={(e) => setData('favorite', e.target.value)}
                                        placeholder="Nama Kontingen / Sekolah"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    {errors.favorite && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.favorite}</p>}
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
                        <div className="premium-card p-6 border-bronze-muted/20 overflow-hidden">
                            <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3">
                                Daftar Juara Historis / Hall of Fame
                            </h2>

                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto scroll-smooth pr-1">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-bronze-muted/20 bg-accent-maroon/10">
                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Tahun / Event</th>
                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Juara</th>
                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Runner Up</th>
                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Best Danton/Coach</th>
                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Terfavorit</th>
                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bronze-muted/10">
                                        {hallOfFames.map((item, i) => (
                                            <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="p-3">
                                                    <ScrollReveal delay={i * 80}>
                                                        <span className="font-bold text-white block">{item.year}</span>
                                                        <span className="text-[10px] text-text-muted block mt-0.5">{item.event_name}</span>
                                                    </ScrollReveal>
                                                </td>
                                                <td className="p-3 font-semibold text-white"><ScrollReveal delay={i * 80}>{item.champion}</ScrollReveal></td>
                                                <td className="p-3 text-text-primary/80"><ScrollReveal delay={i * 80}>{item.runner_up}</ScrollReveal></td>
                                                <td className="p-3 text-text-primary/80"><ScrollReveal delay={i * 80}>{item.best_commander}</ScrollReveal></td>
                                                <td className="p-3 text-gold-light/95"><ScrollReveal delay={i * 80}>{item.favorite}</ScrollReveal></td>
                                                <td className="p-3 text-center">
                                                    <ScrollReveal delay={i * 80}>
                                                        <div className="flex justify-center gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditClick(item)}
                                                                className="p-1 bg-white/5 border border-white/10 hover:border-gold-primary/30 rounded text-gold-light hover:bg-gold-primary/10 transition-all"
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-1 bg-white/5 border border-white/10 hover:border-accent-mahogany/30 rounded text-accent-mahogany hover:bg-accent-mahogany/10 transition-all"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </ScrollReveal>
                                                </td>
                                            </tr>
                                        ))}
                                        {hallOfFames.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-xs text-bronze-muted italic animate-fade-in">
                                                    Belum ada data ditambahkan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
                title="Hapus Hall of Fame"
                message="Apakah Anda yakin ingin menghapus data Hall of Fame ini?"
                confirmText="Ya, Hapus"
            />
        </div>
    );
}
