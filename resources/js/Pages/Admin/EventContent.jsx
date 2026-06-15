import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Save, ArrowLeft, Plus, Trash2, Edit, X, Link as LinkIcon, Trophy, Users, Calendar, Newspaper, Award, Star, ToggleLeft, ToggleRight, Search, User, FileText, Image } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';
import ConfirmationModal from '../../Components/ConfirmationModal';

export default function EventContent({ event, contents, schedules, news, hallOfFames, testimonials, errors: pageErrors }) {
    const [mainTab, setMainTab] = useState('general');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (success) {
            const t = setTimeout(() => setSuccess(false), 3000);
            return () => clearTimeout(t);
        }
    }, [success]);

    const mainTabs = [
        { key: 'general', label: 'Konten Umum', icon: FileText },
        { key: 'schedule', label: 'Jadwal & Linimasa', icon: Calendar },
        { key: 'news', label: 'Berita & Pengumuman', icon: Newspaper },
        { key: 'hall_of_fame', label: 'Hall of Fame', icon: Award },
        { key: 'testimonials', label: 'Moderasi Testimoni', icon: Star },
    ];

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] font-sans">
            <Head title="Kelola Konten Acara - Admin" />

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6 mb-6">
                    <div className="flex items-center gap-3">
                        <a href={`/admin/events/${event.slug}`} className="text-bronze-muted hover:text-gold-light transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <div>
                            <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                                Konten Manager Room
                            </span>
                            <h1 className="text-2xl font-extrabold text-white mt-1">Kelola Konten Acara</h1>
                            <p className="text-xs text-text-muted mt-0.5">{event.name}</p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <a
                            href={`/admin/events/${event.slug}`}
                            className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" /> Dashboard Admin
                        </a>
                    </div>
                </div>

                {/* Main Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-bronze-muted/10 pb-2 overflow-x-auto">
                    {mainTabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setMainTab(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t text-xs font-bold transition-all whitespace-nowrap ${
                                    mainTab === tab.key
                                        ? 'bg-accent-maroon/30 text-gold-light border-b-2 border-gold-primary'
                                        : 'text-bronze-muted hover:text-white'
                                }`}
                            >
                                <Icon className="h-4 w-4" /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tabs contents */}
                <ScrollReveal>
                    {mainTab === 'general' && (
                        <GeneralContentEditor event={event} contents={contents} success={success} setSuccess={setSuccess} />
                    )}
                    {mainTab === 'schedule' && (
                        <ScheduleEditor event={event} schedules={schedules} />
                    )}
                    {mainTab === 'news' && (
                        <NewsEditor event={event} news={news} />
                    )}
                    {mainTab === 'hall_of_fame' && (
                        <HallOfFameEditor event={event} hallOfFames={hallOfFames} />
                    )}
                    {mainTab === 'testimonials' && (
                        <TestimonialEditor event={event} testimonials={testimonials} />
                    )}
                </ScrollReveal>
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// GENERAL CONTENT EDITOR SUB-COMPONENT
// -------------------------------------------------------------
function GeneralContentEditor({ event, contents, success, setSuccess }) {
    const [activeSubTab, setActiveSubTab] = useState('judges');

    const judgesInitial = contents.judges || [];
    const banthalPrizeInitial = contents.banthal_prize || [];
    const usefulLinksInitial = contents.useful_links || [];
    const homeSliderInitial = (contents.home_slider || []).map(url => ({ url, file: null }));
    const eventSliderInitial = (contents.event_slider || []).map(url => ({ url, file: null }));
    const sponsorsInitial = (contents.sponsors || []).map(url => ({ url, file: null }));

    const [judges, setJudges] = useState(judgesInitial);
    const [usefulLinks, setUsefulLinks] = useState(usefulLinksInitial);
    const [banthalPrize, setBanthalPrize] = useState(banthalPrizeInitial);
    const [homeSlider, setHomeSlider] = useState(homeSliderInitial);
    const [eventSlider, setEventSlider] = useState(eventSliderInitial);
    const [sponsors, setSponsors] = useState(sponsorsInitial);

    const [saving, setSaving] = useState(false);

    const subTabs = [
        { key: 'judges', label: 'Dewan Juri', icon: Users },
        { key: 'banthal_prize', label: 'Banthal & Hadiah', icon: Trophy },
        { key: 'useful_links', label: 'Link Penting', icon: LinkIcon },
        { key: 'sliders', label: 'Background Slider', icon: Image },
        { key: 'sponsors', label: 'Sponsor', icon: Award },
    ];

    const handleSave = () => {
        setSaving(true);
        router.post(`/admin/events/${event.slug}/content`, {
            judges: judges.length > 0 ? judges : null,
            banthal_prize: banthalPrize.length > 0 ? banthalPrize : null,
            useful_links: usefulLinks.length > 0 ? usefulLinks : null,
            home_slider: homeSlider.length > 0 ? homeSlider : null,
            event_slider: eventSlider.length > 0 ? eventSlider : null,
            sponsors: sponsors.length > 0 ? sponsors : null,
        }, {
            preserveState: true,
            onSuccess: () => { setSaving(false); setSuccess(true); },
            onError: () => setSaving(false),
        });
    };

    return (
        <div className="space-y-6">
            {success && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded text-sm text-emerald-200 font-medium animate-fade-in">
                    Konten umum acara berhasil diperbarui!
                </div>
            )}

            <div className="flex gap-2 border-b border-bronze-muted/10 pb-1.5 overflow-x-auto">
                {subTabs.map(subTab => {
                    const Icon = subTab.icon;
                    return (
                        <button
                            key={subTab.key}
                            onClick={() => setActiveSubTab(subTab.key)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-semibold transition-all whitespace-nowrap ${
                                activeSubTab === subTab.key
                                    ? 'bg-gold-primary/10 text-gold-light border border-gold-primary/30'
                                    : 'text-bronze-muted hover:text-text-primary'
                            }`}
                        >
                            <Icon className="h-3 w-3" /> {subTab.label}
                        </button>
                    );
                })}
            </div>

            <div className="premium-card p-6 border-bronze-muted/20">
                {activeSubTab === 'judges' && (
                    <JudgesEditor items={judges} onChange={setJudges} />
                )}
                {activeSubTab === 'banthal_prize' && (
                    <BanthalPrizeEditor items={banthalPrize} onChange={setBanthalPrize} />
                )}
                {activeSubTab === 'useful_links' && (
                    <LinksEditor items={usefulLinks} onChange={setUsefulLinks} />
                )}
                {activeSubTab === 'sliders' && (
                    <SliderEditor
                        homeSlider={homeSlider}
                        eventSlider={eventSlider}
                        onHomeSliderChange={setHomeSlider}
                        onEventSliderChange={setEventSlider}
                    />
                )}
                {activeSubTab === 'sponsors' && (
                    <SponsorsEditor
                        sponsors={sponsors}
                        onSponsorsChange={setSponsors}
                    />
                )}

                <div className="mt-8 flex justify-end border-t border-bronze-muted/10 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-extrabold rounded text-xs hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Konten Umum'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SponsorsEditor({ sponsors, onSponsorsChange }) {
    const handleAddFiles = (files) => {
        if (!files || files.length === 0) return;
        const newItems = Array.from(files).map(file => ({
            url: '',
            file: file
        }));
        onSponsorsChange([...sponsors, ...newItems]);
    };

    const handleRemoveItem = (index) => {
        onSponsorsChange(sponsors.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bronze-muted/10 pb-3">
                <div>
                    <h3 className="text-sm font-bold text-white">Logo Sponsor</h3>
                    <p className="text-xs text-text-muted mt-0.5">Kelola logo sponsor yang ditampilkan di footer seluruh halaman.</p>
                </div>
                <div>
                    <label className="cursor-pointer px-3 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 border border-gold-primary/30 text-gold-light rounded text-xs font-bold transition-all flex items-center gap-1.5 animate-pulse-slow">
                        <Plus className="h-3.5 w-3.5" /> Tambah Logo Sponsor
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleAddFiles(e.target.files)}
                        />
                    </label>
                </div>
            </div>

            {sponsors.length === 0 && (
                <p className="text-xs text-bronze-muted italic p-6 bg-deep-black/30 rounded border border-bronze-muted/10 text-center">
                    Belum ada logo sponsor. Silakan tambah logo di atas.
                </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {sponsors.map((item, idx) => {
                    const previewUrl = item.file ? URL.createObjectURL(item.file) : item.url;
                    return (
                        <div key={idx} className="relative group rounded overflow-hidden border border-bronze-muted/20 bg-deep-black/60 aspect-video flex items-center justify-center p-2">
                            <img src={previewUrl} alt="" className="max-h-full max-w-full object-contain" />
                            {item.file && (
                                <span className="absolute top-1 left-1 px-1 py-0.5 bg-gold-primary text-deep-black text-[8px] font-bold rounded uppercase">
                                    Baru
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold text-xs transition-opacity"
                            >
                                <Trash2 className="h-4.5 w-4.5 mr-1" /> Hapus
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function JudgesEditor({ items, onChange }) {
    const add = () => onChange([...items, { name: '', role: '', image_url: '' }]);
    const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
    const update = (i, field, val) => {
        const next = [...items];
        next[i] = { ...next[i], [field]: val };
        onChange(next);
    };

    const handleFileChange = (i, file) => {
        if (!file) return;
        const next = [...items];
        next[i] = { ...next[i], image_file: file };
        onChange(next);
    };

    const removeFile = (i) => {
        const next = [...items];
        next[i] = { ...next[i], image_url: '', image_file: null };
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">Daftar dewan juri yang akan ditampilkan di halaman event.</p>
                <button onClick={add} className="text-xs font-bold text-gold-light hover:text-gold-bright flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Tambah Juri
                </button>
            </div>
            {items.length === 0 && (
                <p className="text-sm text-text-muted italic p-4 bg-deep-black/40 rounded border border-bronze-muted/10">Belum ada juri. Klik "Tambah Juri" untuk memulai.</p>
            )}
            {items.map((item, i) => {
                let previewUrl = '';
                if (item.image_file) {
                    previewUrl = URL.createObjectURL(item.image_file);
                } else if (item.image_url) {
                    previewUrl = item.image_url;
                }

                return (
                    <div key={i} className="p-3 bg-deep-black/30 border border-bronze-muted/10 rounded flex gap-4 items-center">
                        <div className="relative h-12 w-12 shrink-0 rounded bg-deep-black/60 border border-bronze-muted/40 flex items-center justify-center overflow-hidden">
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        className="absolute inset-0 bg-black/75 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-red-400 text-[9px] font-bold"
                                    >
                                        Hapus
                                    </button>
                                </>
                            ) : (
                                <span className="text-[8px] text-text-muted font-bold text-center leading-tight">No Photo</span>
                            )}
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[8px] font-bold text-text-muted uppercase tracking-wider mb-1">Nama Juri</label>
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => update(i, 'name', e.target.value)}
                                    placeholder="Nama Juri"
                                    className="w-full bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-gold-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-bold text-text-muted uppercase tracking-wider mb-1">Peran / Jabatan</label>
                                <input
                                    type="text"
                                    value={item.role}
                                    onChange={(e) => update(i, 'role', e.target.value)}
                                    placeholder="Peran (Ketua Juri, dsb.)"
                                    className="w-full bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-gold-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-bold text-text-muted uppercase tracking-wider mb-1">Unggah Foto</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(i, e.target.files[0])}
                                    className="w-full bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-1 text-xs text-text-primary focus:outline-none focus:border-gold-primary file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-gold-primary file:text-deep-black hover:file:bg-gold-bright file:cursor-pointer"
                                />
                            </div>
                        </div>
                        <button onClick={() => remove(i)} className="p-1.5 text-accent-mahogany hover:text-red-400 transition-colors shrink-0">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function BanthalPrizeEditor({ items, onChange }) {
    const add = () => onChange([...items, { type: 'category', label: '', items: [{ title: '', description: '' }] }]);
    const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
    const update = (i, field, val) => {
        const next = [...items];
        next[i] = { ...next[i], [field]: val };
        onChange(next);
    };
    const addSubItem = (i) => {
        const next = [...items];
        next[i] = { ...next[i], items: [...(next[i].items || []), { title: '', description: '' }] };
        onChange(next);
    };
    const removeSubItem = (i, si) => {
        const next = [...items];
        next[i] = { ...next[i], items: next[i].items.filter((_, idx) => idx !== si) };
        onChange(next);
    };
    const updateSubItem = (i, si, field, val) => {
        const next = [...items];
        next[i] = { ...next[i], items: next[i].items.map((siItem, idx) => idx === si ? { ...siItem, [field]: val } : siItem) };
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">Daftar piala (banthal) dan hadiah per kategori.</p>
                <button onClick={add} className="text-xs font-bold text-gold-light hover:text-gold-bright flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Tambah Kategori
                </button>
            </div>
            {items.length === 0 && (
                <p className="text-sm text-text-muted italic p-4 bg-deep-black/40 rounded border border-bronze-muted/10">Belum ada data. Klik "Tambah Kategori" untuk memulai.</p>
            )}
            {items.map((cat, i) => (
                <div key={i} className="p-3 bg-deep-black/30 border border-bronze-muted/10 rounded">
                    <div className="flex gap-2 mb-3">
                        <select
                            value={cat.type}
                            onChange={(e) => update(i, 'type', e.target.value)}
                            className="bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-gold-primary"
                        >
                            <option value="category">Kategori Lomba</option>
                            <option value="title">Judul Seksi</option>
                        </select>
                        <input
                            type="text"
                            value={cat.label}
                            onChange={(e) => update(i, 'label', e.target.value)}
                            placeholder="Label (contoh: Juara Umum U-16 SMP)"
                            className="flex-1 bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-gold-primary"
                        />
                        <button onClick={() => remove(i)} className="p-1.5 text-accent-mahogany hover:text-red-400 transition-colors shrink-0">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="space-y-2 pl-4 border-l border-bronze-muted/20">
                        {(cat.items || []).map((sub, si) => (
                            <div key={si} className="flex gap-2 items-start">
                                <input
                                    type="text"
                                    value={sub.title}
                                    onChange={(e) => updateSubItem(i, si, 'title', e.target.value)}
                                    placeholder="Judul hadiah"
                                    className="flex-1 bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-gold-primary"
                                
                                />
                                <input
                                    type="text"
                                    value={sub.description}
                                    onChange={(e) => updateSubItem(i, si, 'description', e.target.value)}
                                    placeholder="Deskripsi (opsional)"
                                    className="flex-1 bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-gold-primary"
                                />
                                <button onClick={() => removeSubItem(i, si)} className="p-1 text-accent-mahogany hover:text-red-400 shrink-0">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        <button onClick={() => addSubItem(i)} className="text-[10px] font-bold text-gold-light hover:text-gold-bright flex items-center gap-1 mt-1">
                            <Plus className="h-3 w-3" /> Tambah Hadiah
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function LinksEditor({ items, onChange }) {
    const add = () => onChange([...items, { label: '', url: '' }]);
    const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
    const update = (i, field, val) => {
        const next = [...items];
        next[i] = { ...next[i], [field]: val };
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">Link-link penting yang muncul di halaman event.</p>
                <button onClick={add} className="text-xs font-bold text-gold-light hover:text-gold-bright flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Tambah Link
                </button>
            </div>
            {items.length === 0 && (
                <p className="text-sm text-text-muted italic p-4 bg-deep-black/40 rounded border border-bronze-muted/10">Belum ada link. Klik "Tambah Link" untuk memulai.</p>
            )}
            {items.map((item, i) => (
                <div key={i} className="p-3 bg-deep-black/30 border border-bronze-muted/10 rounded flex gap-3 items-start">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                            type="text"
                            value={item.label}
                            onChange={(e) => update(i, 'label', e.target.value)}
                            placeholder="Label (contoh: Panduan Peserta)"
                            className="w-full bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-gold-primary"
                        />
                        <input
                            type="url"
                            value={item.url}
                            onChange={(e) => update(i, 'url', e.target.value)}
                            placeholder="URL"
                            className="w-full bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-gold-primary"
                        />
                    </div>
                    <button onClick={() => remove(i)} className="p-1.5 text-accent-mahogany hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

// -------------------------------------------------------------
// EVENT SCHEDULE EDITOR SUB-COMPONENT
// -------------------------------------------------------------
function ScheduleEditor({ event, schedules }) {
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Input */}
                <div className="lg:col-span-5">
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

                {/* Data List */}
                <div className="lg:col-span-7">
                    <div className="premium-card p-6 border-bronze-muted/20">
                        <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3">
                            Linimasa Terdaftar ({schedules.length} Hari)
                        </h2>

                        <div className="space-y-6 max-h-[600px] overflow-y-auto scroll-smooth pr-1">
                            {schedules.map((item, i) => (
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
                            ))}
                            {schedules.length === 0 && (
                                <p className="text-xs text-bronze-muted italic text-center py-20">Belum ada jadwal hari ditambahkan.</p>
                            )}
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

// -------------------------------------------------------------
// NEWS & ANNOUNCEMENT EDITOR SUB-COMPONENT
// -------------------------------------------------------------
function NewsEditor({ event, news }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [currentCoverUrl, setCurrentCoverUrl] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        title: '',
        category: 'Announcement',
        summary: '',
        content: '',
        date: '',
        image_file: null,
        remove_cover: false,
    });

    const handleEditClick = (item) => {
        clearErrors();
        setData({
            title: item.title,
            category: item.category,
            summary: item.summary,
            content: item.content || '',
            date: item.date,
            image_file: null,
            remove_cover: false,
        });
        setCurrentCoverUrl(item.image_url);
        setEditId(item.id);
        setIsEditing(true);
    };

    const handleCancel = () => {
        reset();
        clearErrors();
        setCurrentCoverUrl(null);
        setIsEditing(false);
        setEditId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            // Spoofing PUT request using router.post for multipart/form-data upload compatibility in Laravel
            router.post(`/admin/events/${event.slug}/news/${editId}`, {
                _method: 'PUT',
                title: data.title,
                category: data.category,
                summary: data.summary,
                content: data.content,
                date: data.date,
                image_file: data.image_file,
                remove_cover: data.remove_cover,
            }, {
                onSuccess: () => {
                    handleCancel();
                    alert('Berita berhasil diperbarui!');
                }
            });
        } else {
            post(`/admin/events/${event.slug}/news`, {
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
        destroy(`/admin/events/${event.slug}/news/${deleteTarget}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <div className="space-y-8">
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
                                    rows={3}
                                    value={data.summary}
                                    onChange={(e) => setData('summary', e.target.value)}
                                    placeholder="Ringkasan isi berita..."
                                    className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs resize-none mb-3"
                                />
                                {errors.summary && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.summary}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                    Konten (Isi Berita)
                                </label>
                                <textarea
                                    rows={10}
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    placeholder="Tulis isi berita lengkap di sini..."
                                    className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs resize-none mb-3 font-mono"
                                />
                                {errors.content && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.content}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                    Gambar Cover (Opsional)
                                </label>
                                
                                {isEditing && currentCoverUrl && !data.remove_cover && (
                                    <div className="mb-2 relative rounded overflow-hidden border border-bronze-muted/20 bg-deep-black/60 p-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <img src={currentCoverUrl} alt="Current cover" className="h-10 w-16 object-cover rounded" />
                                            <span className="text-[10px] text-text-muted">Cover Saat Ini</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setData('remove_cover', true)}
                                            className="px-2 py-1 text-[9px] bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/35 rounded font-bold transition-all"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                )}

                                {data.image_file && (
                                    <div className="mb-2 relative rounded overflow-hidden border border-bronze-muted/20 bg-deep-black/60 p-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <img src={URL.createObjectURL(data.image_file)} alt="New cover preview" className="h-10 w-16 object-cover rounded shrink-0" />
                                            <span className="text-[10px] text-gold-light font-medium truncate ml-2">Preview Cover Baru</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setData('image_file', null)}
                                            className="px-2 py-1 text-[9px] bg-white/10 hover:bg-white/20 text-bronze-muted hover:text-white rounded font-bold transition-all shrink-0"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    key={data.image_file ? 'has-file' : 'no-file'}
                                    onChange={(e) => {
                                        setData(prev => ({
                                            ...prev,
                                            image_file: e.target.files[0],
                                            remove_cover: false
                                        }));
                                    }}
                                    className="block w-full bg-deep-black/60 border border-bronze-muted/40 rounded px-3 py-1 text-xs text-text-primary focus:outline-none focus:border-gold-primary file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-gold-primary file:text-deep-black hover:file:bg-gold-bright file:cursor-pointer"
                                />
                                {errors.image_file && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.image_file}</p>}
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
                            {news.map((item) => (
                                <div key={item.id} className="p-4 bg-deep-black/50 border border-bronze-muted/10 rounded flex justify-between items-start gap-4">
                                    <div className="flex gap-4 items-start flex-1 min-w-0">
                                        {item.image_url && (
                                            <div className="h-16 w-24 shrink-0 rounded overflow-hidden border border-bronze-muted/20 bg-deep-black/60">
                                                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                                            </div>
                                        )}
                                        <div className="space-y-2 flex-1 min-w-0">
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
                                            <h3 className="font-bold text-white text-sm leading-snug truncate">{item.title}</h3>
                                            <p className="text-xs text-text-primary/70 leading-relaxed line-clamp-2">{item.summary}</p>
                                        </div>
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
                            ))}
                            {news.length === 0 && (
                                <p className="text-xs text-bronze-muted italic text-center py-20">Belum ada berita ditambahkan.</p>
                            )}
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

// -------------------------------------------------------------
// HALL OF FAME EDITOR SUB-COMPONENT
// -------------------------------------------------------------
function HallOfFameEditor({ event, hallOfFames }) {
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
            put(`/admin/events/${event.slug}/hall-of-fame/${editId}`, {
                onSuccess: () => {
                    handleCancel();
                    alert('Hall of Fame berhasil diperbarui!');
                }
            });
        } else {
            post(`/admin/events/${event.slug}/hall-of-fame`, {
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
        destroy(`/admin/events/${event.slug}/hall-of-fame/${deleteTarget}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <div className="space-y-8">
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
                                        <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Best Danton</th>
                                        <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Terfavorit</th>
                                        <th className="p-3 font-bold text-gold-light uppercase tracking-wider text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bronze-muted/10">
                                    {hallOfFames.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="p-3">
                                                <span className="font-bold text-white block">{item.year}</span>
                                                <span className="text-[10px] text-text-muted block mt-0.5">{item.event_name}</span>
                                            </td>
                                            <td className="p-3 font-semibold text-white">{item.champion}</td>
                                            <td className="p-3 text-text-primary/80">{item.runner_up}</td>
                                            <td className="p-3 text-text-primary/80">{item.best_commander}</td>
                                            <td className="p-3 text-gold-light/95">{item.favorite}</td>
                                            <td className="p-3 text-center">
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
                                            </td>
                                        </tr>
                                    ))}
                                    {hallOfFames.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-xs text-bronze-muted italic">
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

// -------------------------------------------------------------
// TESTIMONIALS MODERATION SUB-COMPONENT
// -------------------------------------------------------------
function TestimonialEditor({ event, testimonials }) {
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
        router.post(`/admin/events/${event.slug}/testimonials/${toggleTarget}/toggle`, {}, {
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
        router.delete(`/admin/events/${event.slug}/testimonials/${deleteTarget}`, {
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bronze-muted/10 pb-4">
                <div>
                    <h2 className="text-base font-bold text-white">Moderasi Testimoni Pengguna</h2>
                    <p className="text-xs text-text-muted mt-0.5">Kelola testimoni yang dikirimkan oleh pengunjung ({testimonialsList.length} total)</p>
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
                    <div key={t.id} className="premium-card p-5 border border-bronze-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-deep-black/40">
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
                                <p className="text-xs text-text-primary/80 mt-2 break-words leading-relaxed">{t.message}</p>
                                <p className="text-[9px] text-text-muted mt-2 font-mono">{t.created_at}</p>
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

function SliderEditor({ homeSlider, eventSlider, onHomeSliderChange, onEventSliderChange }) {
    const handleAddFiles = (type, files) => {
        if (!files || files.length === 0) return;
        const newItems = Array.from(files).map(file => ({
            url: '',
            file: file
        }));
        
        if (type === 'home') {
            onHomeSliderChange([...homeSlider, ...newItems]);
        } else {
            onEventSliderChange([...eventSlider, ...newItems]);
        }
    };

    const handleRemoveItem = (type, index) => {
        if (type === 'home') {
            onHomeSliderChange(homeSlider.filter((_, i) => i !== index));
        } else {
            onEventSliderChange(eventSlider.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-8">
            {/* Home Slider Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bronze-muted/10 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-white">Slider Latar Beranda</h3>
                        <p className="text-xs text-text-muted mt-0.5">Maksimum background slider pada halaman depan (Beranda utama).</p>
                    </div>
                    <div>
                        <label className="cursor-pointer px-3 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 border border-gold-primary/30 text-gold-light rounded text-xs font-bold transition-all flex items-center gap-1.5">
                            <Plus className="h-3.5 w-3.5" /> Tambah Foto Beranda
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleAddFiles('home', e.target.files)}
                            />
                        </label>
                    </div>
                </div>

                {homeSlider.length === 0 && (
                    <p className="text-xs text-bronze-muted italic p-6 bg-deep-black/30 rounded border border-bronze-muted/10 text-center">
                        Belum ada foto beranda. Silakan tambah foto di atas.
                    </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {homeSlider.map((item, idx) => {
                        const previewUrl = item.file ? URL.createObjectURL(item.file) : item.url;
                        return (
                            <div key={idx} className="relative group rounded overflow-hidden border border-bronze-muted/20 bg-deep-black/60 aspect-video">
                                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                                {item.file && (
                                    <span className="absolute top-1 left-1 px-1 py-0.5 bg-gold-primary text-deep-black text-[8px] font-bold rounded uppercase">
                                        Baru
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem('home', idx)}
                                    className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold text-xs transition-opacity"
                                >
                                    <Trash2 className="h-4.5 w-4.5 mr-1" /> Hapus
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event Slider Section */}
            <div className="space-y-4 pt-4 border-t border-bronze-muted/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bronze-muted/10 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-white">Slider Latar Halaman Event</h3>
                        <p className="text-xs text-text-muted mt-0.5">Background slider untuk detail header event LOMBA BARIS GARDA 55 VOL 20.</p>
                    </div>
                    <div>
                        <label className="cursor-pointer px-3 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 border border-gold-primary/30 text-gold-light rounded text-xs font-bold transition-all flex items-center gap-1.5">
                            <Plus className="h-3.5 w-3.5" /> Tambah Foto Event
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleAddFiles('event', e.target.files)}
                            />
                        </label>
                    </div>
                </div>

                {eventSlider.length === 0 && (
                    <p className="text-xs text-bronze-muted italic p-6 bg-deep-black/30 rounded border border-bronze-muted/10 text-center">
                        Belum ada foto event. Silakan tambah foto di atas.
                    </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {eventSlider.map((item, idx) => {
                        const previewUrl = item.file ? URL.createObjectURL(item.file) : item.url;
                        return (
                            <div key={idx} className="relative group rounded overflow-hidden border border-bronze-muted/20 bg-deep-black/60 aspect-video">
                                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                                {item.file && (
                                    <span className="absolute top-1 left-1 px-1 py-0.5 bg-gold-primary text-deep-black text-[8px] font-bold rounded uppercase">
                                        Baru
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem('event', idx)}
                                    className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold text-xs transition-opacity"
                                >
                                    <Trash2 className="h-4.5 w-4.5 mr-1" /> Hapus
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
