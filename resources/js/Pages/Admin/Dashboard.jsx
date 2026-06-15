import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { LayoutDashboard, Award, Ticket, ShoppingBag, BarChart3, Eye, EyeOff, Save, Users, Mail, ClipboardCheck, Download, Star, Activity, Newspaper, Calendar, Shield, Heart, ThumbsUp, FileText, Server, KeyRound } from 'lucide-react';
import AdminUserNav from '../../Components/Admin/AdminUserNav';
import axios from 'axios';
import StatusBadge from '../../Components/StatusBadge';
import ScrollReveal from '../../Components/ScrollReveal';

export default function Dashboard({ event, stats, contingentsCount, recentOrders, auth, activeAdmins, rolePermissions = {}, finalTabStatus: initialFinalTabStatus }) {
    const userRole = auth?.user?.role;
    const canAccess = (module) => !!(rolePermissions[userRole]?.[module]);
    const [leaderboardStatus, setLeaderboardStatus] = useState(event.leaderboard_status);
    const [ticketLimit, setTicketLimit] = useState(event.max_tickets_per_user);
    const [onlineTicketLimit, setOnlineTicketLimit] = useState(event.online_ticket_limit ?? 700);
    const [updating, setUpdating] = useState(false);
    const [votingDay1Status, setVotingDay1Status] = useState(event.voting_day_1_status || 'active');
    const [votingDay2Status, setVotingDay2Status] = useState(event.voting_day_2_status || 'active');
    const [supporterStatus, setSupporterStatus] = useState(event.supporter_status);
    const [sponsorVotingStatus, setSponsorVotingStatus] = useState(event.sponsor_voting_status ?? 'active');
    const [ticketSaleStatus, setTicketSaleStatus] = useState(event.ticket_sale_status ?? 'open');
    const [gateStatus, setGateStatus] = useState(event.gate_status ?? 'open');
    const [gateSchedules, setGateSchedules] = useState(Array.isArray(event.gate_schedules) ? event.gate_schedules.map(s => ({
        open_at: s.open_at ? s.open_at.substring(0, 16) : '',
        close_at: s.close_at ? s.close_at.substring(0, 16) : ''
    })) : []);
    const [finalTabStatus, setFinalTabStatus] = useState(initialFinalTabStatus ?? 'show');
    const [configModal, setConfigModal] = useState(null); // { type: 'success'|'error', message: '...' }

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            await axios.post(`/admin/events/${event.slug}/settings/update`, {
                leaderboard_status: leaderboardStatus,
                max_tickets_per_user: ticketLimit,
                online_ticket_limit: onlineTicketLimit,
                ticket_sale_status: ticketSaleStatus,
                gate_status: gateStatus,
                gate_schedules: gateStatus === 'auto' ? gateSchedules : [],
            });
            setConfigModal({ type: 'success', message: 'Konfigurasi platform berhasil diperbarui!' });
            setTimeout(() => router.reload(), 2000);
        } catch (error) {
            const msg = error.response?.data?.errors?.online_ticket_limit?.[0]
                || error.response?.data?.message
                || 'Gagal memperbarui konfigurasi.';
            setConfigModal({ type: 'error', message: msg });
        } finally {
            setUpdating(false);
        }
    };



    const toggleVotingDay1 = async (status) => {
        try {
            await axios.post(`/admin/events/${event.slug}/toggle-voting-day1`, { status });
            setVotingDay1Status(status);
        } catch (error) {
            alert('Gagal mengubah status voting Hari ke-1.');
        }
    };

    const toggleVotingDay2 = async (status) => {
        try {
            await axios.post(`/admin/events/${event.slug}/toggle-voting-day2`, { status });
            setVotingDay2Status(status);
        } catch (error) {
            alert('Gagal mengubah status voting Hari ke-2.');
        }
    };

    const toggleSupporter = async (status) => {
        try {
            await axios.post(`/admin/events/${event.slug}/toggle-supporter`, { supporter_status: status });
            setSupporterStatus(status);
        } catch (error) {
            alert('Gagal mengubah status dukungan sponsor.');
        }
    };

    const toggleSponsorVoting = async (status) => {
        try {
            await axios.post(`/admin/events/${event.slug}/toggle-sponsor-voting`, { sponsor_voting_status: status });
            setSponsorVotingStatus(status);
        } catch (error) {
            alert('Gagal mengubah status sponsor voting.');
        }
    };

    const toggleFinalTab = async (status) => {
        try {
            await axios.post(`/admin/events/${event.slug}/toggle-final-tab`, { status });
            setFinalTabStatus(status);
        } catch (error) {
            alert('Gagal mengubah status tab The Final.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Admin Dashboard" />

            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header */}
                <ScrollReveal><div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Super Admin / Committee Room
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            Platform <span className="text-gold-primary">Control Room</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; GARDA 55 VOL 20</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <a
                            href={`/`}
                            className="px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white"
                        >
                            ← Beranda
                        </a>
                        <AdminUserNav />
                    </div>
                </div></ScrollReveal>

                {/* Analytical Stats Grid */}
                {canAccess('dashboard_stats') && (
                <ScrollReveal><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="premium-card p-5 border border-bronze-muted/10 text-center">
                        <ShoppingBag className="h-5 w-5 text-gold-primary mx-auto mb-2" />
                        <span className="text-2xl font-black text-white block">Rp {stats.total_revenue.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Total Pendapatan</span>
                    </div>

                    <div className="premium-card p-5 border border-bronze-muted/10 text-center">
                        <Ticket className="h-5 w-5 text-gold-primary mx-auto mb-2" />
                        <span className="text-2xl font-black text-white block">{stats.total_tickets_sold} Pcs</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Tiket Terjual</span>
                    </div>

                    <div className="premium-card p-5 border border-bronze-muted/10 text-center">
                        <Users className="h-5 w-5 text-gold-primary mx-auto mb-2" />
                        <span className="text-2xl font-black text-white block">{contingentsCount} Tim</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Kontingen Terdaftar</span>
                    </div>

                    <div className="premium-card p-5 border border-bronze-muted/10 text-center">
                        <BarChart3 className="h-5 w-5 text-gold-primary mx-auto mb-2" />
                        <span className="text-2xl font-black text-white block">{stats.total_votes_cast} Vote</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Suara Diterima</span>
                    </div>
                </div></ScrollReveal>
                )}

                {/* Main Operations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Quick Access Menu */}
                    <ScrollReveal><div className="space-y-6">
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3 flex items-center gap-1.5">
                                <LayoutDashboard className="h-4.5 w-4.5 text-gold-primary" /> Modul Operasional
                            </h2>

                            <div className="grid grid-cols-1 gap-2.5">
                                {canAccess('scoring_input') && (
                                    <a
                                        href={`/admin/events/${event.slug}/scores/rekap`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Input Penilaian Juri</span>
                                        <Award className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('tickets') && (
                                    <a
                                        href={`/admin/events/${event.slug}/ots`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Kelola Tiket</span>
                                        <Ticket className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('all_tickets') && (
                                    <a
                                        href={`/admin/events/${event.slug}/platform/tickets`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Data Semua Tiket</span>
                                        <Ticket className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('merchandise') && (
                                    <a
                                        href={`/admin/events/${event.slug}/merchandise`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Logger Penjualan Merch</span>
                                        <ShoppingBag className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('social_media') && (
                                    <a
                                        href={`/admin/events/${event.slug}/social-media`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Kelola Likes Sosmed</span>
                                        <BarChart3 className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('broadcast') && (
                                    <a
                                        href={`/admin/events/${event.slug}/broadcast`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Kirim Broadcast Email</span>
                                        <Mail className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('export') && (
                                    <a
                                        href={`/admin/events/${event.slug}/export`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Platform Control Room (Export)</span>
                                        <Download className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('recap') && (
                                    <a
                                        href={`/admin/events/${event.slug}/recap`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Rekapan Data Acara</span>
                                        <FileText className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('score_tokens') && (
                                    <a
                                        href={`/admin/events/${event.slug}/score-tokens`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Generate Token Rekap</span>
                                        <KeyRound className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('control_room') && (
                                    <a
                                        href={`/admin/events/${event.slug}/control-room`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Platform Control Room</span>
                                        <Server className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('users') && (
                                    <a
                                        href="/admin/users"
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Manajemen User & Role</span>
                                        <Users className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('users') && (
                                    <a
                                        href={`/admin/events/${event.slug}/role-config`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Konfigurasi Role</span>
                                        <Shield className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('content') && (
                                    <a
                                        href={`/admin/events/${event.slug}/content`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Kelola Konten Acara</span>
                                        <FileText className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                                {canAccess('contingents') && (
                                    <a
                                        href={`/admin/events/${event.slug}/contingents`}
                                        className="p-3 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded flex justify-between items-center text-xs text-text-primary hover:bg-white/[0.08] transition-all font-semibold"
                                    >
                                        <span>Kelola Daftar Sekolah</span>
                                        <Shield className="h-4 w-4 text-gold-primary" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div></ScrollReveal>

                    {canAccess('event_settings') && (
                    <ScrollReveal><div className="space-y-6">
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3 flex items-center gap-1.5">
                                <ClipboardCheck className="h-4.5 w-4.5 text-gold-primary" /> Konfigurasi Acara
                            </h2>

                            <form onSubmit={handleUpdateSettings} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Status Rilis Klasemen Juri dan Daftar Juara
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setLeaderboardStatus('draft')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                leaderboardStatus === 'draft'
                                                    ? 'bg-accent-maroon border-accent-burgundy text-white'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <EyeOff className="h-3.5 w-3.5" />
                                            <span>Draft (Sembunyikan)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLeaderboardStatus('published')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                leaderboardStatus === 'published'
                                                    ? 'bg-gradient-to-r from-gold-primary to-gold-bright border-gold-light/20 text-deep-black'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>Published (Rilis)</span>
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-text-muted mt-1">
                                        Jika draf, nilai juri (Rekap) dan Daftar Juara disembunyikan bagi penonton umum. Pelatih tetap bisa melihat nilai tim sendiri.
                                    </p>

                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Batas Maksimal Pembelian Tiket
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={ticketLimit}
                                        onChange={(e) => setTicketLimit(parseInt(e.target.value) || 15)}
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-semibold text-center"
                                    />
                                    <p className="text-[9px] text-text-muted mt-1">
                                        Membatasi jumlah tiket masuk (Silver/Gold/Platinum) yang dapat dipesan per akun (default: 15 tiket).
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Batas Tiket Online
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={10000}
                                        value={onlineTicketLimit}
                                        onChange={(e) => setOnlineTicketLimit(parseInt(e.target.value) || 700)}
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-semibold text-center"
                                    />
                                    <p className="text-[9px] text-text-muted mt-1">
                                        Batas jumlah pembelian tiket online (default: 700). Setelah mencapai batas ini, tombol pembelian akan menampilkan "Tiket Online Habis".
                                    </p>
                                </div>

                                <div className="border-t border-bronze-muted/10 pt-4">
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Kuota Tiket Sekarang</p>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[11px] mb-1">
                                                <span className="text-text-primary">Tiket Online</span>
                                                <span className="text-white font-bold">{stats.total_online_tickets} / {onlineTicketLimit || 700}</span>
                                            </div>
                                            <div className="w-full bg-deep-black/60 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-500 to-sky-400"
                                                    style={{ width: `${Math.min(100, ((stats.total_online_tickets || 0) / (onlineTicketLimit || 700)) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[9px] text-text-muted mt-1">
                                                {Math.max(0, (onlineTicketLimit || 700) - (stats.total_online_tickets || 0))} tiket online tersisa
                                            </p>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-text-primary">Tiket OTS</span>
                                            <span className="text-white font-bold">{stats.total_ots_tickets}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] border-t border-bronze-muted/10 pt-2">
                                            <span className="text-text-primary font-semibold">Total Semua Tiket</span>
                                            <span className="text-gold-light font-extrabold">{stats.total_tickets_sold}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Status Pembelian Tiket
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTicketSaleStatus('open')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                ticketSaleStatus === 'open'
                                                    ? 'bg-gradient-to-r from-gold-primary to-gold-bright border-gold-light/20 text-deep-black'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>Buka</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTicketSaleStatus('closed')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                ticketSaleStatus === 'closed'
                                                    ? 'bg-accent-maroon border-accent-burgundy text-white'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <EyeOff className="h-3.5 w-3.5" />
                                            <span>Tutup</span>
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-text-muted mt-1">
                                        Jika tutup, tombol "Beli Tiket" di halaman event akan disembunyikan dari pengunjung.
                                    </p>
                                </div>

                                <div className="border-t border-bronze-muted/10 pt-4">
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Status Scan Gate (Akses Masuk)
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setGateStatus('open')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                gateStatus === 'open'
                                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 border-emerald-400/20 text-deep-black'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>Buka</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGateStatus('auto')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                gateStatus === 'auto'
                                                    ? 'bg-gradient-to-r from-sky-500 to-sky-400 border-sky-400/20 text-deep-black'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>Otomatis</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGateStatus('closed')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                gateStatus === 'closed'
                                                    ? 'bg-accent-maroon border-accent-burgundy text-white'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <EyeOff className="h-3.5 w-3.5" />
                                            <span>Tutup</span>
                                        </button>
                                    </div>
                                    
                                    {gateStatus === 'auto' && (
                                        <div className="space-y-3">
                                            {gateSchedules.map((schedule, index) => (
                                                <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-deep-black/40 border border-sky-500/20 rounded relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setGateSchedules(gateSchedules.filter((_, i) => i !== index))}
                                                        className="absolute -top-2 -right-2 bg-accent-maroon text-white w-5 h-5 rounded-full text-[10px] font-bold shadow hover:bg-red-600 flex items-center justify-center"
                                                    >
                                                        &times;
                                                    </button>
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                                                            Buka Gate (Jadwal {index + 1})
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            value={schedule.open_at}
                                                            onChange={(e) => {
                                                                const newSchedules = [...gateSchedules];
                                                                newSchedules[index].open_at = e.target.value;
                                                                setGateSchedules(newSchedules);
                                                            }}
                                                            className="block w-full px-2 py-1.5 bg-deep-black border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-sky-400 text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-accent-maroon uppercase tracking-wider mb-1">
                                                            Tutup Gate (Jadwal {index + 1})
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            value={schedule.close_at}
                                                            onChange={(e) => {
                                                                const newSchedules = [...gateSchedules];
                                                                newSchedules[index].close_at = e.target.value;
                                                                setGateSchedules(newSchedules);
                                                            }}
                                                            className="block w-full px-2 py-1.5 bg-deep-black border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-accent-maroon text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setGateSchedules([...gateSchedules, { open_at: '', close_at: '' }])}
                                                className="w-full py-2 border border-dashed border-sky-500/40 text-sky-400 rounded text-[10px] font-bold hover:bg-sky-500/10 transition-all"
                                            >
                                                + Tambah Jadwal Buka/Tutup Gate
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-[9px] text-text-muted mt-2">
                                        Mengontrol izin check-in tiket melalui aplikasi scanner. Jika "Otomatis", check-in hanya bisa dilakukan pada rentang waktu yang ditentukan.
                                    </p>
                                </div>

                                <div className="border-t border-bronze-muted/10 pt-4">
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                                        Voting Per Hari
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-deep-black/40 border border-bronze-muted/10 rounded space-y-2">
                                            <p className="text-[10px] font-bold text-white">Hari ke-1 (SMP & Purna)</p>
                                            <div className="flex gap-1.5">
                                                <button type="button" onClick={() => toggleVotingDay1('active')}
                                                    className={`flex-1 py-1.5 px-2 border rounded text-[9px] font-bold transition-all ${
                                                        votingDay1Status === 'active'
                                                            ? 'bg-gradient-to-r from-gold-primary to-gold-bright border-gold-light/20 text-deep-black'
                                                            : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                                    }`}
                                                >Hidupkan</button>
                                                <button type="button" onClick={() => toggleVotingDay1('stopped')}
                                                    className={`flex-1 py-1.5 px-2 border rounded text-[9px] font-bold transition-all ${
                                                        votingDay1Status === 'stopped'
                                                            ? 'bg-accent-maroon border-accent-burgundy text-white'
                                                            : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                                    }`}
                                                >Hentikan</button>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-deep-black/40 border border-bronze-muted/10 rounded space-y-2">
                                            <p className="text-[10px] font-bold text-white">Hari ke-2 (SD & SMA)</p>
                                            <div className="flex gap-1.5">
                                                <button type="button" onClick={() => toggleVotingDay2('active')}
                                                    className={`flex-1 py-1.5 px-2 border rounded text-[9px] font-bold transition-all ${
                                                        votingDay2Status === 'active'
                                                            ? 'bg-gradient-to-r from-gold-primary to-gold-bright border-gold-light/20 text-deep-black'
                                                            : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                                    }`}
                                                >Hidupkan</button>
                                                <button type="button" onClick={() => toggleVotingDay2('stopped')}
                                                    className={`flex-1 py-1.5 px-2 border rounded text-[9px] font-bold transition-all ${
                                                        votingDay2Status === 'stopped'
                                                            ? 'bg-accent-maroon border-accent-burgundy text-white'
                                                            : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                                    }`}
                                                >Hentikan</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-bronze-muted/10 pt-4">
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Tampilkan Tab The Final (PASGARDA Quickcount)
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleFinalTab('show')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                finalTabStatus === 'show'
                                                    ? 'bg-gradient-to-r from-gold-primary to-gold-bright border-gold-light/20 text-deep-black'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>Tampilkan</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleFinalTab('hidden')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                finalTabStatus === 'hidden'
                                                    ? 'bg-accent-maroon border-accent-burgundy text-white'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <EyeOff className="h-3.5 w-3.5" />
                                            <span>Sembunyikan</span>
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-text-muted mt-1">
                                        Jika disembunyikan, tab The Final tidak muncul di PASGARDA Quickcount untuk semua kategori. Tab Daftar Juara tetap bisa diatur sendiri di status rilis leaderboard.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Status Dukungan Sponsor
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleSupporter('active')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                supporterStatus === 'active'
                                                    ? 'bg-gradient-to-r from-gold-primary to-gold-bright border-gold-light/20 text-deep-black'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <Heart className="h-3.5 w-3.5" />
                                            <span>Hidupkan</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleSupporter('stopped')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                supporterStatus === 'stopped'
                                                    ? 'bg-accent-maroon border-accent-burgundy text-white'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <EyeOff className="h-3.5 w-3.5" />
                                            <span>Hentikan</span>
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-text-muted mt-1">
                                        Jika dihentikan, halaman dukungan sponsor publik akan menampilkan pesan bahwa dukungan sudah ditutup.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Status Sponsor Voting (Beli Produk)
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleSponsorVoting('active')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                sponsorVotingStatus === 'active'
                                                    ? 'bg-gradient-to-r from-gold-primary to-gold-bright border-gold-light/20 text-deep-black'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <ThumbsUp className="h-3.5 w-3.5" />
                                            <span>Hidupkan</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleSponsorVoting('stopped')}
                                            className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                sponsorVotingStatus === 'stopped'
                                                    ? 'bg-accent-maroon border-accent-burgundy text-white'
                                                    : 'bg-deep-black/60 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            <EyeOff className="h-3.5 w-3.5" />
                                            <span>Hentikan</span>
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-text-muted mt-1">
                                        Jika dihentikan, halaman pembelian produk sponsor akan menampilkan pesan bahwa layanan ditutup.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded text-xs border border-white/10 uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>Simpan Konfigurasi</span>
                                </button>
                            </form>
                        </div>
                    </div></ScrollReveal>
                    )}

                    {/* Recent Orders Log Table */}
                    <ScrollReveal><div className="space-y-6">
                        <div className="premium-card p-6 border-bronze-muted/20 min-h-[300px]">
                            <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3 flex items-center gap-1.5">
                                <Ticket className="h-4.5 w-4.5 text-gold-primary" /> Pesanan Terakhir
                            </h2>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto scroll-smooth pr-1">
                                {recentOrders.map((ord) => (
                                    <div key={ord.id} className="p-3 bg-deep-black/50 border border-bronze-muted/10 rounded flex justify-between items-center text-xs">
                                        <div>
                                            <span className="font-semibold text-white block">{ord.midtrans_transaction_id}</span>
                                            <span className="text-[10px] text-text-muted font-medium block mt-0.5">
                                                User: {ord.user?.name} &bull; {ord.payment_method || 'Online'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-white font-mono block">Rp {parseFloat(ord.total_price).toLocaleString('id-ID')}</span>
                                            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase mt-1 ${
                                                ord.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {ord.payment_status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {recentOrders.length === 0 && (
                                    <p className="text-xs text-bronze-muted italic text-center py-12 animate-fade-in">Belum ada pesanan masuk.</p>
                                )}
                            </div>
                        </div>
                    </div></ScrollReveal>

                <ScrollReveal><div className="premium-card p-6 border border-bronze-muted/20">
                    <h2 className="text-base font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3 flex items-center gap-1.5">
                        <Activity className="h-4.5 w-4.5 text-gold-primary" /> Petugas Aktif (5 menit terakhir)
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {activeAdmins && activeAdmins.length > 0 ? activeAdmins.map((admin) => (
                            <div key={admin.id} className="flex items-center gap-2 p-2.5 bg-white/5 border border-bronze-muted/10 rounded">
                                <div className="relative">
                                    {admin.avatar ? (
                                        <img src={`/storage/${admin.avatar}`} alt="" className="h-7 w-7 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-7 w-7 rounded-full bg-accent-maroon/30 flex items-center justify-center">
                                            <Users className="h-3 w-3 text-bronze-muted" />
                                        </div>
                                    )}
                                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-deep-black"></span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-white">{admin.name}</p>
                                    <p className="text-[9px] text-text-muted uppercase tracking-wider">{admin.role.replace('_', ' ')}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs text-bronze-muted italic py-2">Tidak ada petugas yang aktif saat ini.</p>
                        )}
                    </div>
                </div></ScrollReveal>
                </div>
            </div>

            {/* Config Result Modal */}
            {configModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfigModal(null)}>
                    <div className="premium-card max-w-sm w-full p-6 border border-gold-primary/30" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-sm font-extrabold text-white mb-2">
                            {configModal.type === 'error' ? 'Gagal' : 'Berhasil'}
                        </h4>
                        <p className="text-xs text-text-primary/80 mb-4">{configModal.message}</p>
                        <button onClick={() => setConfigModal(null)}
                            className="w-full py-2 bg-gold-primary/20 hover:bg-gold-primary/30 text-gold-light border border-gold-primary/20 rounded text-xs font-bold transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
