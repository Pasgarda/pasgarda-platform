import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Mail, Edit, Send, Info, Users, ArrowLeft } from 'lucide-react';
import ConfirmationModal from '../../Components/ConfirmationModal';
import ScrollReveal from '../../Components/ScrollReveal';

export default function EmailBroadcast({ event, visitorCount, coachCount, allUsersCount = 0 }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        message_body: '',
        target_type: 'all', // all, coach, or all_users
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowConfirm(true);
    };

    const confirmSend = () => {
        post(`/admin/events/${event.slug}/broadcast`, {
            onSuccess: () => {
                reset();
                setShowConfirm(false);
            },
            onError: () => setShowConfirm(false),
        });
    };

    const targetCount = data.target_type === 'all' ? (visitorCount + coachCount) : data.target_type === 'all_users' ? allUsersCount : coachCount;

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Email Broadcast" />

            <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Announcement Broadcast Engine
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            Broadcast <span className="text-gold-primary">Email Massal</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; GARDA 55 VOL 20</p>
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

                <div className="grid grid-cols-1 gap-6">
                    {/* Information Bar */}
                    <div className="p-4 bg-accent-maroon/15 border border-accent-maroon/30 rounded flex gap-3 text-xs leading-relaxed">
                        <Info className="h-5 w-5 text-gold-primary shrink-0" />
                        <div>
                            <span className="font-bold text-white block mb-0.5">Mailing List Target Broadcast</span>
                            {data.target_type === 'all' ? (
                                <span>Pesan email massal ini akan dikirimkan ke seluruh email unik pembeli tiket online/OTS terdaftar yang pembayarannya berstatus <strong className="text-emerald-400">paid</strong> dan seluruh akun dengan role <strong className="text-gold-light">Pelatih (Coach)</strong>.</span>
                            ) : data.target_type === 'all_users' ? (
                                <span>Pesan email massal ini akan dikirimkan ke <strong className="text-emerald-400">seluruh pengguna terdaftar</strong> di platform PASGARDA yang memiliki alamat email.</span>
                            ) : (
                                <span>Pesan email massal ini akan dikirimkan secara khusus hanya kepada akun yang terdaftar dengan role <strong className="text-gold-light">Pelatih (Coach)</strong> di platform.</span>
                            )}
                        </div>
                    </div>

                    {/* Broadcast Form */}
                    <ScrollReveal>
                        <div className="premium-card p-6 border-bronze-muted/20">
                        <div className="flex items-center justify-between border-b border-bronze-muted/10 pb-3 mb-5">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <Edit className="h-4.5 w-4.5 text-gold-primary" /> Susun Pesan Pengumuman
                            </h2>
                            <span className="text-[10px] font-bold text-gold-cream bg-white/5 border border-white/10 px-2.5 py-1 rounded flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" /> Target: {targetCount} Penerima
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                    Target Penerima Email
                                </label>
                                <select
                                    value={data.target_type}
                                    onChange={(e) => setData('target_type', e.target.value)}
                                    className="block w-full px-3 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-semibold"
                                >
                                    <option value="all">Semua Penerima (Pengunjung & Pelatih)</option>
                                    <option value="all_users">Semua Pengguna Terdaftar ({allUsersCount})</option>
                                    <option value="coach">Hanya Pelatih (Coach)</option>
                                </select>
                                {errors.target_type && <p className="text-accent-mahogany text-[10px] mt-1">{errors.target_type}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                    Subjek Email
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    placeholder="Contoh: Pengumuman Terkait Finalis LOMBA BARIS GARDA 55 VOL 20"
                                    className="block w-full px-3 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-semibold"
                                />
                                {errors.subject && <p className="text-accent-mahogany text-[10px] mt-1">{errors.subject}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                    Isi Pesan Email
                                </label>
                                <textarea
                                    required
                                    rows={8}
                                    value={data.message_body}
                                    onChange={(e) => setData('message_body', e.target.value)}
                                    placeholder="Tuliskan detail pengumuman resmi di sini..."
                                    className="block w-full px-3 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-medium"
                                />
                                {errors.message_body && <p className="text-accent-mahogany text-[10px] mt-1">{errors.message_body}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing || targetCount === 0}
                                className="w-full py-3 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded text-xs tracking-wider uppercase shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="h-4 w-4" />
                                <span>Kirim Broadcast Email</span>
                            </button>
                        </form>
                    </div>
                    </ScrollReveal>
                </div>
            </div>

            <ConfirmationModal
                open={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmSend}
                title="Konfirmasi Broadcast"
                message={`Apakah Anda yakin ingin mengirim email broadcast ini ke ${targetCount} penerima?`}
                confirmText="Ya, Kirim"
                loading={processing}
            />
        </div>
    );
}
