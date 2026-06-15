import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Calendar, Plus, Trash2, Edit, X, Save, ArrowLeft } from 'lucide-react';
import ConfirmationModal from '../../Components/ConfirmationModal';
import ScrollReveal from '../../Components/ScrollReveal';

export default function EventSchedule({ event, schedules }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [categoriesString, setCategoriesString] = useState('');
    const [timelineItems, setTimelineItems] = useState([{ time: '', activity: '' }]);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        day_type: 'day_1',
        date_string: '',
        categories: [],
        timeline: [],
    });

    const addTimelineRow = () => {
        setTimelineItems([...timelineItems, { time: '', activity: '' }]);
    };

    const removeTimelineRow = (index) => {
        if (timelineItems.length === 1) return;
        setTimelineItems(timelineItems.filter((_, i) => i !== index));
    };

    const handleTimelineChange = (index, field, value) => {
        const updated = [...timelineItems];
        updated[index][field] = value;
        setTimelineItems(updated);
    };

    const handleEditClick = (item) => {
        clearErrors();
        setData({
            day_type: item.day_type,
            date_string: item.date_string,
            categories: item.categories,
            timeline: item.timeline,
        });
        setCategoriesString(item.categories.join(', '));
        setTimelineItems(item.timeline && item.timeline.length > 0 ? item.timeline : [{ time: '', activity: '' }]);
        setEditId(item.id);
        setIsEditing(true);
    };

    const handleCancel = () => {
        reset();
        clearErrors();
        setCategoriesString('');
        setTimelineItems([{ time: '', activity: '' }]);
        setIsEditing(false);
        setEditId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const cats = categoriesString
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const payload = {
            day_type: data.day_type,
            date_string: data.date_string,
            categories: cats,
            timeline: timelineItems,
        };

        if (isEditing) {
            // Put request using Inertia
            router.put(`/admin/events/${event.slug}/schedule/${editId}`, payload, {
                onSuccess: () => {
                    handleCancel();
                    alert('Jadwal berhasil diperbarui!');
                }
            });
        } else {
            router.post(`/admin/events/${event.slug}/schedule`, payload, {
                onSuccess: () => {
                    handleCancel();
                    alert('Jadwal berhasil ditambahkan!');
                }
            });
        }
    };

    const handleDelete = (id) => setDeleteTarget(id);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        destroy(`/admin/events/${event.slug}/schedule/${deleteTarget}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Kelola Jadwal Acara" />
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header */}
                <ScrollReveal>
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Super Admin Room
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
                            <Calendar className="h-7 w-7 text-gold-primary" /> Kelola <span className="text-gold-primary">Jadwal Acara</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">Mengelola matriks linimasa (schedule timeline) dan kategori lomba per hari untuk event: {event.name}.</p>
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Form Input */}
                    <ScrollReveal className="lg:col-span-5">
                        <div>
                            <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3 flex items-center gap-1.5">
                                {isEditing ? <Edit className="h-4.5 w-4.5 text-gold-primary" /> : <Plus className="h-4.5 w-4.5 text-gold-primary" />}
                                <span>{isEditing ? 'Edit Jadwal Acara' : 'Tambah Jadwal Hari Baru'}</span>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                            Tipe Hari (Key)
                                        </label>
                                        <select
                                            value={data.day_type}
                                            onChange={(e) => setData('day_type', e.target.value)}
                                            className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        >
                                            <option value="day_1">day_1 (Hari ke-1)</option>
                                            <option value="day_2">day_2 (Hari ke-2)</option>
                                            <option value="day_3">day_3 (Hari ke-3)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                            Format Tanggal
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.date_string}
                                            onChange={(e) => setData('date_string', e.target.value)}
                                            placeholder="Contoh: Sabtu, 20 Juni 2026"
                                            className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Kategori (Dipisah Koma)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={categoriesString}
                                        onChange={(e) => setCategoriesString(e.target.value)}
                                        placeholder="Contoh: U-16 (SMP), Purna / Senior"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    <p className="text-[9px] text-text-muted mt-1">Pisahkan tiap kategori lomba dengan tanda koma.</p>
                                </div>

                                {/* Dynamic Timeline Rows */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center border-t border-bronze-muted/10 pt-3">
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                            Linimasa Acara (Timeline)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addTimelineRow}
                                            className="px-2 py-1 bg-gold-primary/10 border border-gold-primary/30 text-gold-light hover:bg-gold-primary/20 rounded text-[9px] font-bold transition-all"
                                        >
                                            + Baris Acara
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-[250px] overflow-y-auto scroll-smooth pr-1">
                                        {timelineItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    required
                                                    value={item.time}
                                                    onChange={(e) => handleTimelineChange(idx, 'time', e.target.value)}
                                                    placeholder="Waktu (07:30 - 08:00)"
                                                    className="w-1/3 px-2 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-[11px] font-mono"
                                                />
                                                <input
                                                    type="text"
                                                    required
                                                    value={item.activity}
                                                    onChange={(e) => handleTimelineChange(idx, 'activity', e.target.value)}
                                                    placeholder="Aktivitas"
                                                    className="w-2/3 px-2 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-[11px]"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={timelineItems.length === 1}
                                                    onClick={() => removeTimelineRow(idx)}
                                                    className="p-1.5 bg-white/5 hover:bg-accent-mahogany/10 text-bronze-muted hover:text-accent-mahogany rounded border border-transparent disabled:opacity-30 disabled:hover:text-bronze-muted transition-all"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 border-t border-bronze-muted/10 pt-4">
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
                                        <Save className="h-3.5 w-3.5" /> {isEditing ? 'Simpan Jadwal' : 'Tambah Jadwal'}
                                    </button>
                                </div>
                            </form>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Data List */}
                    <div className="lg:col-span-7">
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3">
                                Linimasa Terdaftar ({schedules.length} Hari)
                            </h2>

                            <div className="space-y-6 max-h-[600px] overflow-y-auto scroll-smooth pr-1">
                                {schedules.map((item, i) => (
                                    <ScrollReveal delay={i * 80}>
                                        <div key={item.id} className="p-5 bg-deep-black/50 border border-bronze-muted/10 rounded space-y-4">
                                        <div className="flex justify-between items-start border-b border-bronze-muted/10 pb-3">
                                            <div>
                                                <span className="text-[10px] font-mono font-bold text-gold-light bg-gold-primary/10 border border-gold-primary/20 px-2 py-0.5 rounded uppercase">
                                                    {item.day_type}
                                                </span>
                                                <h3 className="font-extrabold text-white text-sm mt-1">{item.date_string}</h3>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {item.categories.map((c, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 bg-white/5 border border-bronze-muted/10 rounded text-[9px] text-text-primary/90 font-medium">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
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

                                        <div className="relative border-l border-bronze-muted/20 ml-2 space-y-3.5 pl-4">
                                            {item.timeline && item.timeline.map((t, idx) => (
                                                <div key={idx} className="relative">
                                                    <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-gold-primary"></div>
                                                    <div className="flex gap-3 text-xs">
                                                        <span className="font-mono font-bold text-gold-light shrink-0">{t.time}</span>
                                                        <span className="text-text-primary/80">{t.activity}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    </ScrollReveal>
                                ))}
                                {schedules.length === 0 && (
                                    <p className="text-xs text-bronze-muted italic text-center py-20 animate-fade-in">Belum ada jadwal hari ditambahkan.</p>
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
                title="Hapus Jadwal"
                message="Apakah Anda yakin ingin menghapus data Jadwal ini?"
                confirmText="Ya, Hapus"
            />
        </div>
    );
}
