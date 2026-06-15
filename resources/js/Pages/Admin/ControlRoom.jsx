import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Shield, Download, RotateCcw, ArrowLeft, Key, Server, Database, AlertTriangle, Trash2 } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

export default function ControlRoom({ event, needsPin, rolePermissions, stats, errors }) {
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [pinVerifying, setPinVerifying] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [resettingItem, setResettingItem] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [resetDone, setResetDone] = useState(false);

    const handleVerifyPin = (e) => {
        e.preventDefault();
        setPinError(false);
        setPinVerifying(true);

        router.post(`/admin/events/${event.slug}/control-room/verify-pin`, { pin }, {
            onError: (errors) => {
                const msg = errors?.pin?.[0] || errors?.pin || 'PIN salah. Coba lagi.';
                setPinError(msg);
                setPinVerifying(false);
            },
        });
    };

    const handleDownload = () => {
        setDownloading(true);
        const a = document.createElement('a');
        a.href = `/admin/events/${event.slug}/control-room/download`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => setDownloading(false), 2000);
    };

    const handleReset = () => {
        setResetting(true);
        router.post(`/admin/events/${event.slug}/control-room/reset`, {}, {
            onSuccess: () => {
                setShowResetConfirm(false);
                setResetDone(true);
                setResetting(false);
                router.reload({ only: ['stats'] });
            },
            onError: () => {
                setResetting(false);
            },
        });
    };

    const handleResetItem = (type) => {
        setResettingItem(type);
        router.post(`/admin/events/${event.slug}/control-room/reset-item`, { type }, {
            onSuccess: () => {
                setResettingItem(null);
                router.reload({ only: ['stats'] });
            },
            onError: () => {
                setResettingItem(null);
            },
        });
    };

    if (needsPin) {
        return (
            <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans flex items-center justify-center">
                <Head title="Platform Control Room" />
                <form onSubmit={handleVerifyPin} className="max-w-md w-full">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                        <a
                            href={`/admin/events/${event.slug}`}
                            className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Dashboard Event
                        </a>
                        <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/30">
                            <Server className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-white mb-1">Platform Control Room</h1>
                        <p className="text-xs text-text-muted mb-6">Masukkan PIN untuk mengakses panel kontrol platform</p>

                        <div className="flex justify-center mb-4">
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={pin}
                                onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                                className="w-48 text-center text-2xl tracking-[0.5em] px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white font-mono focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary/30 transition-all placeholder:text-text-muted/30"
                                placeholder="••••••"
                                autoFocus
                            />
                        </div>
                        {pinError && (
                            <p className="text-red-400 text-xs mb-3">{typeof pinError === 'string' ? pinError : 'PIN salah. Coba lagi.'}</p>
                        )}
                        <button
                            type="submit"
                            disabled={pinVerifying || pin.length < 4}
                            className="w-full px-6 py-2.5 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-black font-extrabold rounded-lg text-xs tracking-wider uppercase shadow transition-all disabled:opacity-50"
                        >
                            {pinVerifying ? 'Memverifikasi...' : 'Verifikasi PIN'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    const statCards = [
        { label: 'Kontingen', value: stats.contingents, color: 'from-blue-600 to-blue-800', skipReset: true },
        { label: 'Nilai Masuk', value: stats.scores, color: 'from-emerald-600 to-emerald-800', resetType: 'scores' },
        { label: 'Skor Juri', value: stats.jury_scores, color: 'from-teal-600 to-teal-800' },
        { label: 'Vote Masuk', value: `Rp ${(stats.votes * 5000).toLocaleString('id-ID')}`, sub: `${stats.votes} vote`, color: 'from-purple-600 to-purple-800', resetType: 'votes' },
        { label: 'Supporters', value: stats.supporters, color: 'from-pink-600 to-pink-800', resetType: 'supporters' },
        { label: 'Likes Sosmed', value: stats.likes, color: 'from-rose-600 to-rose-800', resetType: 'likes' },
        { label: 'Orders', value: stats.orders, color: 'from-amber-600 to-amber-800', resetType: 'orders' },
        { label: 'Check-In', value: `${stats.checked_in}/${stats.orders}`, color: 'from-orange-600 to-orange-800' },
        { label: 'Visitor', value: stats.visitors.toLocaleString('id-ID'), color: 'from-cyan-600 to-cyan-800', resetType: 'visitors' },
    ];

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Platform Control Room" />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/15 pb-6 mb-8">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-red-300 bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded-full uppercase">
                            Super Admin Only
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
                            <Server className="h-7 w-7 text-red-400" /> Platform <span className="text-gold-primary">Control Room</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">Panel kontrol platform — {event.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <a
                            href={`/admin/events/${event.slug}`}
                            className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-text-muted border-white/10 hover:text-white flex items-center gap-1"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard Event
                        </a>
                    </div>
                </div>

                {resetDone && (
                    <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl p-6 mb-8 text-center">
                        <h2 className="text-lg font-bold text-emerald-300 mb-1">✓ Reset Berhasil!</h2>
                        <p className="text-sm text-emerald-200/70">Semua data operasional acara telah dihapus. Master data (event, kontingen, user) tetap aman.</p>
                    </div>
                )}

                {/* Stats Grid */}
                <ScrollReveal>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                        {statCards.map((s, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                <div className={`w-8 h-8 bg-gradient-to-br ${s.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                                    <Database className="h-4 w-4 text-white" />
                                </div>
                                <div className="text-lg font-extrabold text-white">{s.value}</div>
                                <div className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">{s.label}</div>
                                {s.sub && <div className="text-[9px] text-text-muted/60">{s.sub}</div>}
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Individual Reset */}
                <ScrollReveal>
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-red-400" /> Reset Per-Item
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {statCards.filter(s => s.resetType).map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleResetItem(s.resetType)}
                                    disabled={resettingItem === s.resetType}
                                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 rounded-lg text-[11px] text-text-muted hover:text-red-300 font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <RotateCcw className={`h-3 w-3 ${resettingItem === s.resetType ? 'animate-spin' : ''}`} />
                                    Reset {s.label}
                                </button>
                            ))}
                            <button
                                onClick={() => handleResetItem('activity')}
                                disabled={resettingItem === 'activity'}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 rounded-lg text-[11px] text-text-muted hover:text-red-300 font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <RotateCcw className={`h-3 w-3 ${resettingItem === 'activity' ? 'animate-spin' : ''}`} />
                                Reset Activity Log
                            </button>
                            <button
                                onClick={() => handleResetItem('merchandise')}
                                disabled={resettingItem === 'merchandise'}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 rounded-lg text-[11px] text-text-muted hover:text-red-300 font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <RotateCcw className={`h-3 w-3 ${resettingItem === 'merchandise' ? 'animate-spin' : ''}`} />
                                Reset Merchandise
                            </button>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Actions */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <ScrollReveal>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
                                    <Download className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white">Download Database</h3>
                                    <p className="text-xs text-text-muted mt-1">Unduh snapshot lengkap database (.sql) termasuk semua data saat ini.</p>
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        {downloading ? 'Mendownload...' : 'Download Backup SQL'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="bg-white/5 border border-red-500/20 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-900/20">
                                    <RotateCcw className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white">Restart All Operational Data</h3>
                                    <p className="text-xs text-text-muted mt-1">Reset nilai, vote, supporters, likes, orders, tiket, merchandise, visitor, testimonial, dan konten ke 0. Master data (event, kontingen, user, role config) tetap aman.</p>
                                    {!showResetConfirm ? (
                                        <button
                                            onClick={() => setShowResetConfirm(true)}
                                            className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs tracking-wider transition-all flex items-center gap-2"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" /> Reset Data Operasional
                                        </button>
                                    ) : (
                                        <div className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
                                            <div className="flex items-start gap-2 mb-3">
                                                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-red-200 font-medium">Konfirmasi: Semua data operasional akan dihapus permanen. Tindakan ini <strong>tidak bisa dibatalkan</strong>. Pastikan sudah download backup.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleReset}
                                                    disabled={resetting}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs tracking-wider transition-all disabled:opacity-50"
                                                >
                                                    {resetting ? 'Mereset...' : 'Ya, Reset Sekarang'}
                                                </button>
                                                <button
                                                    onClick={() => setShowResetConfirm(false)}
                                                    disabled={resetting}
                                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-text-muted font-bold rounded-lg text-xs tracking-wider transition-all disabled:opacity-50"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Role Permissions Info */}
                {rolePermissions && (
                    <ScrollReveal>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="h-5 w-5 text-gold-primary" />
                                <h3 className="font-bold text-white">Module Access</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {Object.entries(rolePermissions).map(([role, modules]) => (
                                    Object.entries(modules).map(([mod, can]) => (
                                        <div key={`${role}-${mod}`} className="flex items-center gap-2 text-[11px]">
                                            <div className={`w-2 h-2 rounded-full ${can ? 'bg-emerald-500' : 'bg-red-500/50'}`} />
                                            <span className="text-text-muted">{role}:</span>
                                            <span className="text-white/80">{mod}</span>
                                        </div>
                                    ))
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                )}
            </div>
        </div>
    );
}
