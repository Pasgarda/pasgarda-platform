import React, { useState, useRef, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Shield, Plus, Trash2, Edit, X, Save, ArrowLeft, Image as ImageIcon, Search } from 'lucide-react';
import ConfirmationModal from '../../Components/ConfirmationModal';
import StatusBadge from '../../Components/StatusBadge';
import ScrollReveal from '../../Components/ScrollReveal';

export default function Contingents({ event, contingents, coachUsers = [] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const fileInputRef = useRef(null);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const CATEGORIES = [
        { value: 'all', label: 'Semua' },
        { value: 'U12', label: 'SD (U-12)' },
        { value: 'U16', label: 'SMP (U-16)' },
        { value: 'U19', label: 'SMA (U-19)' },
        { value: 'Purna', label: 'Purna' },
    ];

    const CATEGORY_LABELS = { U12: 'SD (U-12)', U16: 'SMP (U-16)', U19: 'SMA (U-19)', Purna: 'Purna' };

    const filteredContingents = useMemo(() => {
        if (!searchQuery.trim()) return contingents;
        const q = searchQuery.toLowerCase();
        return contingents.filter((c) => 
            c.school_name?.toLowerCase().includes(q) ||
            c.region?.toLowerCase().includes(q) ||
            c.coach_name?.toLowerCase().includes(q)
        );
    }, [contingents, searchQuery]);

    const grouped = useMemo(() => {
        const groups = { U12: [], U16: [], U19: [], Purna: [] };
        filteredContingents.forEach((c) => {
            if (groups[c.category_type]) groups[c.category_type].push(c);
        });
        return groups;
    }, [filteredContingents]);

    const visibleContingents = useMemo(() => {
        if (selectedCategory === 'all') return filteredContingents;
        return filteredContingents.filter((c) => c.category_type === selectedCategory);
    }, [filteredContingents, selectedCategory]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        school_name: '',
        region: '',
        category_type: 'U16',
        is_reguler: false,
        status: 'pending',
        coach_name: '',
        coach_phone: '',
        coach_email: '',
        sort_order: 0,
        coach_user_id: '',
        description: '',
        logo: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleCoachUserChange = (userId) => {
        setData('coach_user_id', userId);
        if (userId) {
            const coach = coachUsers.find((u) => u.id === parseInt(userId, 10));
            if (coach) {
                setData('coach_name', coach.name);
                setData('coach_email', coach.email);
            }
        }
    };

    const handleEditClick = (item) => {
        clearErrors();
        setData({
            school_name: item.school_name,
            region: item.region,
            category_type: item.category_type,
            is_reguler: item.is_reguler,
            status: item.status,
            coach_name: item.coach_name || '',
            coach_phone: item.coach_phone || '',
            coach_email: item.coach_email || '',
            sort_order: item.sort_order ?? 0,
            coach_user_id: item.coach_user_id ?? '',
            description: item.description || '',
            logo: null,
        });
        setLogoPreview(item.logo_path);
        setEditId(item.id);
        setIsEditing(true);
    };

    const handleCancel = () => {
        reset();
        clearErrors();
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsEditing(false);
        setEditId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Inertia form submission
        if (isEditing) {
            // Use POST with URL parameter for Laravel file upload compatibility
            post(`/admin/events/${event.slug}/contingents/${editId}/update`, {
                onSuccess: () => {
                    handleCancel();
                    alert('Sekolah Kontingen berhasil diperbarui!');
                }
            });
        } else {
            post(`/admin/events/${event.slug}/contingents`, {
                onSuccess: () => {
                    handleCancel();
                    alert('Sekolah Kontingen berhasil ditambahkan!');
                }
            });
        }
    };

    const handleDelete = (id) => setDeleteTarget(id);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/events/${event.slug}/contingents/${deleteTarget}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Kelola Sekolah Kontingen" />
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <ScrollReveal><div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Super Admin Room
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
                            <Shield className="h-7 w-7 text-gold-primary" /> Kelola <span className="text-gold-primary">Daftar Sekolah</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">Pendaftaran kontingen sekolah, kategori lomba (SD, SMP, SMA, Purna), nama pelatih, status verifikasi, dan logo kontingen.</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <a
                            href="/admin/dashboard"
                            className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" /> Dashboard Admin
                        </a>
                    </div>
                </div></ScrollReveal>

                {/* Form & List Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Form Input */}
                    <div className="lg:col-span-4">
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3 flex items-center gap-1.5">
                                {isEditing ? <Edit className="h-4.5 w-4.5 text-gold-primary" /> : <Plus className="h-4.5 w-4.5 text-gold-primary" />}
                                <span>{isEditing ? 'Edit Kontingen' : 'Tambah Kontingen Baru'}</span>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Nama Sekolah / Kontingen
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.school_name}
                                        onChange={(e) => setData('school_name', e.target.value)}
                                        placeholder="Contoh: SMA Negeri 5 Samarinda"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-semibold"
                                    />
                                    {errors.school_name && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.school_name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                            Asal Daerah (Kota)
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.region}
                                            onChange={(e) => setData('region', e.target.value)}
                                            placeholder="Samarinda"
                                            className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        />
                                        {errors.region && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.region}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                            Kategori Lomba
                                        </label>
                                        <select
                                            value={data.category_type}
                                            onChange={(e) => setData('category_type', e.target.value)}
                                            className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        >
                                            <option value="U12">SD (U-12)</option>
                                            <option value="U16">SMP (U-16)</option>
                                            <option value="U19">SMA (U-19)</option>
                                            <option value="Purna">Purna / Senior</option>
                                        </select>
                                        {errors.category_type && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.category_type}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                            Nama Pelatih
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.coach_name}
                                            onChange={(e) => setData('coach_name', e.target.value)}
                                            placeholder="Nama Pelatih"
                                            className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        />
                                        {errors.coach_name && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.coach_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                            Telepon Pelatih
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.coach_phone}
                                            onChange={(e) => setData('coach_phone', e.target.value)}
                                            placeholder="0812xxxxxxxx"
                                            className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        />
                                        {errors.coach_phone && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.coach_phone}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Pilih Akun Coach <span className="text-text-muted/50 font-normal">(yang sudah terdaftar)</span>
                                    </label>
                                    <select
                                        value={data.coach_user_id ? String(data.coach_user_id) : ""}
                                        onChange={(e) => handleCoachUserChange(e.target.value)}
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    >
                                        <option value="">— Ketik manual jika belum ada —</option>
                                        {coachUsers.map((u) => (
                                            <option key={u.id} value={String(u.id)}>
                                                {u.name} ({u.email})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.coach_user_id && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.coach_user_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Email Pelatih <span className="text-text-muted/50 font-normal">(untuk login portal pelatih)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={data.coach_email}
                                        onChange={(e) => setData('coach_email', e.target.value)}
                                        placeholder="pelatih@contoh.com"
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                    {errors.coach_email && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.coach_email}</p>}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                            Status Verifikasi
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-semibold"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="verified">Verified (Terverifikasi)</option>
                                        </select>
                                        {errors.status && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.status}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                            Nomor Urut
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={data.sort_order}
                                            onChange={(e) => setData('sort_order', parseInt(e.target.value, 10) || 0)}
                                            className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-semibold"
                                        />
                                        {errors.sort_order && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.sort_order}</p>}
                                    </div>

                                    <div className="flex items-center justify-center pt-5">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={data.is_reguler}
                                                onChange={(e) => setData('is_reguler', e.target.checked)}
                                                className="h-4 w-4 rounded border-bronze-muted/40 text-gold-primary focus:ring-gold-primary bg-deep-black/60"
                                            />
                                            <span className="text-xs text-text-primary font-semibold">Tipe Reguler</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Logo Sekolah (Unggah)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white/5 border border-bronze-muted/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                            {logoPreview ? (
                                                <img src={logoPreview.startsWith('blob:') ? logoPreview : logoPreview} alt="Logo" className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-5 w-5 text-bronze-muted" />
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="block w-full text-xs text-text-muted file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white/5 file:text-white file:cursor-pointer hover:file:bg-white/10"
                                        />
                                    </div>
                                    {errors.logo && <p className="text-accent-mahogany text-[10px] mt-1 font-medium">{errors.logo}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Deskripsi Singkat (Opsional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Deskripsi sekolah..."
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs resize-none"
                                    />
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
                                        <Save className="h-3.5 w-3.5" /> {isEditing ? 'Simpan' : 'Tambah'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Data List */}
                    <ScrollReveal className="lg:col-span-8">
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 border-b border-bronze-muted/10 pb-3 gap-3">
                                <h2 className="text-base font-bold text-white">
                                    Daftar Sekolah Terdaftar ({filteredContingents.length} Kontingen)
                                </h2>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                                    {/* Search Bar */}
                                    <div className="relative flex-1 sm:flex-none sm:w-60">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Cari sekolah, asal kota, pelatih..."
                                            className="w-full pl-8 pr-3 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        />
                                    </div>

                                    {/* Category Filter Tabs */}
                                    <div className="flex flex-wrap gap-1">
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.value}
                                                onClick={() => setSelectedCategory(cat.value)}
                                                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                    selectedCategory === cat.value
                                                        ? 'bg-gold-primary text-deep-black'
                                                        : 'bg-white/5 text-text-muted border border-bronze-muted/20 hover:text-white'
                                                }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto scroll-smooth">
                                {selectedCategory === 'all' ? (
                                    /* Grouped view with category separators */
                                    Object.entries(grouped).map(([catKey, catItems]) => {
                                        if (catItems.length === 0) return null;
                                        return (
                                            <div key={catKey} className="mb-6 last:mb-0">
                                                <div className="sticky top-0 z-10 bg-[#161412] py-2 border-b border-gold-primary/20 mb-2 flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-gold-primary/10 text-gold-light border border-gold-primary/20 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        Kategori {CATEGORY_LABELS[catKey]}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted font-medium">{catItems.length} sekolah</span>
                                                </div>
                                                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                                                    <thead>
                                                        <tr className="border-b border-bronze-muted/20 bg-accent-maroon/10">
                                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider w-12 text-center">#</th>
                                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Sekolah</th>
                                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Pelatih</th>
                                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Email Pelatih</th>
                                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Status</th>
                                                            <th className="p-3 font-bold text-gold-light uppercase tracking-wider text-center w-20">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-bronze-muted/10">
                                                        {catItems.map((item) => (
                                                            <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                                                <td className="p-3 text-center font-mono text-text-muted text-[11px]">
                                                                    {item.sort_order || '-'}
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="h-9 w-9 bg-white/5 border border-bronze-muted/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                                            {item.logo_path ? (
                                                                                <img src={item.logo_path} alt="" className="h-full w-full object-cover" />
                                                                            ) : (
                                                                                <Shield className="h-4 w-4 text-bronze-muted" />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-bold text-white block text-[13px]">{item.school_name}</span>
                                                                            <span className="text-[10px] text-text-muted block mt-0.5">{item.region} {item.is_reguler ? '(Reguler)' : ''}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-text-primary font-semibold block">{item.coach_name}</span>
                                                                    <span className="text-[10px] text-text-muted block mt-0.5">{item.coach_phone}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-[10px] text-text-muted font-mono">{item.coach_email}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <StatusBadge status={item.status} label={item.status === 'verified' ? 'Terverifikasi' : 'Pending'} />
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <div className="flex justify-center gap-1.5">
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
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })
                                ) : (
                                    /* Single category view */
                                    <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-bronze-muted/20 bg-accent-maroon/10">
                                                <th className="p-3 font-bold text-gold-light uppercase tracking-wider w-12 text-center">#</th>
                                                <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Sekolah</th>
                                                <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Kategori</th>
                                                <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Pelatih</th>
                                                <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Email Pelatih</th>
                                                <th className="p-3 font-bold text-gold-light uppercase tracking-wider">Status</th>
                                                <th className="p-3 font-bold text-gold-light uppercase tracking-wider text-center w-20">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bronze-muted/10">
                                            {visibleContingents.map((item) => (
                                                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="p-3 text-center font-mono text-text-muted text-[11px]">
                                                        {item.sort_order || '-'}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-9 w-9 bg-white/5 border border-bronze-muted/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                                {item.logo_path ? (
                                                                    <img src={item.logo_path} alt="" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <Shield className="h-4 w-4 text-bronze-muted" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-white block text-[13px]">{item.school_name}</span>
                                                                <span className="text-[10px] text-text-muted block mt-0.5">{item.region} {item.is_reguler ? '(Reguler)' : ''}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-medium">
                                                        <span className="px-1.5 py-0.5 bg-white/5 border border-bronze-muted/10 rounded">
                                                            {item.category_type}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="text-text-primary font-semibold block">{item.coach_name}</span>
                                                        <span className="text-[10px] text-text-muted block mt-0.5">{item.coach_phone}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="text-[10px] text-text-muted font-mono">{item.coach_email}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <StatusBadge status={item.status} label={item.status === 'verified' ? 'Terverifikasi' : 'Pending'} />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex justify-center gap-1.5">
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
                                                    </td>
                                                </tr>
                                            ))}
                                            {visibleContingents.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="p-8 text-center text-xs text-bronze-muted italic animate-fade-in">
                                                        Belum ada sekolah kontingen ditambahkan.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>

                </div>

            </div>

            <ScrollReveal><ConfirmationModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                variant="danger"
                title="Hapus Kontingen"
                message="Apakah Anda yakin ingin menghapus kontingen ini? Semua data nilai juri, vote, dan pesanan merch terkait kontingen ini akan ikut terhapus!"
                confirmText="Ya, Hapus"
            /></ScrollReveal>
        </div>
    );
}
