import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Heart, Edit, Crown, Medal, Clock, Info } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

const CAT_LABELS = { U12: 'SD', U16: 'SMP', U19: 'SMA', Purna: 'Purna' };
const CAT_ORDER = ['U12', 'U16', 'U19'];

const MedalIcon = ({ rank }) => {
    if (rank === 0) return <Crown className="h-4 w-4 text-yellow-400" />;
    if (rank === 1) return <Medal className="h-4 w-4 text-gray-300" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
};

const rankLabel = (rank) => {
    if (rank === 0) return '1st';
    if (rank === 1) return '2nd';
    if (rank === 2) return '3rd';
    return '';
};

const formatTime = (dt) => {
    if (!dt) return '-';
    const d = new Date(dt);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

function TableCard({ title, icon, iconColor, items, likesKey, emptyMsg }) {
    return (
        <ScrollReveal>
            <div className="premium-card overflow-hidden border border-gold-primary/20 h-full">
                <div className={`p-3 bg-gradient-to-r ${iconColor}/10 to-transparent border-b border-gold-primary/20 flex items-center justify-between`}>
                    <h3 className="font-bold text-white text-xs flex items-center gap-2">
                        {icon} {title}
                    </h3>
                    {items.length > 10 && (
                        <span className="text-[9px] text-text-muted font-mono">{items.length} kontingen</span>
                    )}
                </div>
                <div className="divide-y divide-bronze-muted/10 overflow-y-auto max-h-[400px]">
                    {items.map((c, i) => {
                        const likes = c.social_media_like?.[likesKey] || 0;
                        const updated = c.social_media_like?.updated_at;
                        return (
                            <div key={c.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.01]">
                                <div className="w-6 text-center">
                                    {i < 3 ? <MedalIcon rank={i} /> : <span className="text-[10px] font-bold text-text-muted">#{i + 1}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{c.school_name}</p>
                                    <p className="text-[9px] text-text-muted truncate">{c.region}</p>
                                    {updated && <p className="text-[8px] text-text-muted/60 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{formatTime(updated)}</p>}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-gold-bright font-mono">{likes.toLocaleString('id-ID')}</p>
                                    <p className="text-[8px] text-text-muted uppercase">Likes</p>
                                </div>
                            </div>
                        );
                    })}
                    {items.length === 0 && (
                        <div className="p-4 text-center text-text-muted text-xs italic animate-fade-in">{emptyMsg}</div>
                    )}
                </div>
            </div>
        </ScrollReveal>
    );
}

export default function SocialMedia({ event, contingents }) {
    const [selectedContingent, setSelectedContingent] = useState(null);

    const { data, setData, post, processing, reset } = useForm({
        contingent_id: '',
        likes_count_reels: 0,
        likes_count_posts: 0,
    });

    const handleSelectContingent = (c) => {
        setSelectedContingent(c);
        setData({
            contingent_id: c.id,
            likes_count_reels: c.social_media_like?.likes_count_reels || 0,
            likes_count_posts: c.social_media_like?.likes_count_posts || 0,
        });
    };

    const byCategory = useMemo(() => {
        const result = {};
        for (const cat of CAT_ORDER) {
            const catList = contingents.filter(c => c.category_type === cat);
            result[cat] = {
                kreator: [...catList].sort((a, b) => (b.social_media_like?.likes_count_reels || 0) - (a.social_media_like?.likes_count_reels || 0)),
                peserta: [...catList].sort((a, b) => (b.social_media_like?.likes_count_posts || 0) - (a.social_media_like?.likes_count_posts || 0)),
            };
        }
        return result;
    }, [contingents]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/admin/events/${event.slug}/social-media`, {
            onSuccess: () => {
                setSelectedContingent(null);
                reset();
                alert('Likes Instagram berhasil diperbarui!');
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Instagram Likes Manager" />

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Kreator Terbaik & Peserta Terfavorit Updater
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            Kelola Likes <span className="text-gold-primary">Instagram</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; Input Manual Likes Panitia</p>
                    </div>
                </div>

                {/* Per-Category Tables */}
                {CAT_ORDER.map(cat => {
                    const data = byCategory[cat];
                    if (!data || (!data.kreator.length && !data.peserta.length)) return null;
                    return (
                        <div key={cat}>
                            <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
                                <span className="text-gold-primary">Kategori {CAT_LABELS[cat]}</span>
                                <span className="text-[10px] text-text-muted font-normal">({data.kreator.length} kontingen)</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TableCard
                                    title="Kreator Terfavorit"
                                    icon={<Crown className="h-4 w-4 text-yellow-400" />}
                                    iconColor="from-purple-600"
                                    items={data.kreator}
                                    likesKey="likes_count_reels"
                                    emptyMsg="Belum ada data likes reels."
                                />
                                <TableCard
                                    title="Peserta Terfavorit"
                                    icon={<Heart className="h-4 w-4 text-pink-400" />}
                                    iconColor="from-pink-600"
                                    items={data.peserta}
                                    likesKey="likes_count_posts"
                                    emptyMsg="Belum ada data likes posts."
                                />
                            </div>
                        </div>
                    );
                })}

                {/* Edit Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* All contingents table */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="premium-card overflow-hidden border border-bronze-muted/10">
                            <div className="p-4 bg-accent-maroon/5 border-b border-bronze-muted/10">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <Info className="h-4 w-4 text-gold-primary" /> Daftar Likes Media Sosial Kontingen
                                </h3>
                            </div>
                            <div className="overflow-x-auto scroll-smooth text-xs">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                            <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Sekolah / Kontingen</th>
                                            <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Kategori</th>
                                            <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Likes Reels</th>
                                            <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Likes Posts</th>
                                            <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Total Likes</th>
                                            <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Update</th>
                                            <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bronze-muted/10 text-white/95">
                                        {contingents.map((c) => {
                                            const reels = c.social_media_like?.likes_count_reels || 0;
                                            const posts = c.social_media_like?.likes_count_posts || 0;
                                            const total = reels + posts;
                                            const updated = c.social_media_like?.updated_at;
                                            return (
                                                <tr key={c.id} className="hover:bg-white/[0.01]">
                                                    <td className="p-3">
                                                        <span className="font-semibold text-white block">{c.school_name}</span>
                                                        <span className="text-[10px] text-text-muted uppercase font-medium">{c.region}</span>
                                                    </td>
                                                    <td className="p-3 text-center text-[10px] text-text-muted">{CAT_LABELS[c.category_type] || c.category_type}</td>
                                                    <td className="p-3 text-center font-mono text-purple-300">{reels.toLocaleString('id-ID')}</td>
                                                    <td className="p-3 text-center font-mono text-pink-300">{posts.toLocaleString('id-ID')}</td>
                                                    <td className="p-3 text-center font-extrabold text-gold-light font-mono">{total.toLocaleString('id-ID')}</td>
                                                    <td className="p-3 text-center text-[10px] text-text-muted font-mono">
                                                        {updated ? formatTime(updated) : '-'}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button onClick={() => handleSelectContingent(c)}
                                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded font-semibold text-[10px] flex items-center gap-1 ml-auto">
                                                            <Edit className="h-3 w-3 text-gold-primary" />
                                                            Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form Card */}
                    <div>
                        <div className="premium-card p-6 border-gold-primary/30 min-h-[300px] flex flex-col justify-center">
                            {selectedContingent ? (
                                <div className="space-y-4">
                                    <div className="border-b border-bronze-muted/10 pb-3">
                                        <span className="text-[9px] font-bold text-gold-light uppercase tracking-wider">Perbarui Nilai Likes</span>
                                        <h3 className="font-extrabold text-white text-base mt-1">{selectedContingent.school_name}</h3>
                                        <p className="text-xs text-text-muted mt-0.5">{CAT_LABELS[selectedContingent.category_type]} - {selectedContingent.region}</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                                Likes Instagram Reels
                                            </label>
                                            <input type="text" inputMode="numeric" required
                                                value={data.likes_count_reels}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setData('likes_count_reels', val ? parseInt(val) : 0);
                                                }}
                                                className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                                Likes Instagram Posts
                                            </label>
                                            <input type="text" inputMode="numeric" required
                                                value={data.likes_count_posts}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setData('likes_count_posts', val ? parseInt(val) : 0);
                                                }}
                                                className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-semibold"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button type="button" onClick={() => setSelectedContingent(null)}
                                                className="flex-1 py-2 px-3 bg-deep-black border border-bronze-muted/30 rounded text-xs text-text-muted hover:text-white transition-all font-semibold">
                                                Batal
                                            </button>
                                            <button type="submit" disabled={processing}
                                                className="flex-1 py-2 px-3 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-extrabold rounded text-xs tracking-wider uppercase transition-all shadow hover:brightness-110">
                                                Simpan Likes
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="text-center text-bronze-muted space-y-2">
                                    <Heart className="h-12 w-12 mx-auto opacity-30 animate-pulse text-accent-maroon" />
                                    <p className="text-xs font-medium">Pilih kontingen di tabel untuk memperbarui likes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tie-breaking info */}
                <div className="premium-card overflow-hidden border border-bronze-muted/20">
                    <div className="p-4 bg-white/5 border-b border-bronze-muted/10">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Info className="h-4 w-4 text-gold-primary" /> Aturan Tie-Breaking
                        </h3>
                    </div>
                    <div className="p-4">
                        <p className="text-xs text-text-muted leading-relaxed">
                            <span className="text-gold-light font-bold">Kreator Terfavorit & Peserta Terfavorit:</span> Apabila terdapat nilai likes yang sama,
                            pemenang ditentukan dari <span className="text-white font-semibold">riwayat tercepat mencapai nilai tertinggi</span>.
                        </p>
                        <p className="text-[10px] text-text-muted/60 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Kolom <span className="text-white/80 font-mono">"Update Terakhir"</span> sebagai referensi tie-breaking.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
