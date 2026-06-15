import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { KeyRound, Plus, RefreshCw, ShieldOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ScoreTokens({ event, contingents, totalWithTokens, totalActiveTokens }) {
    const [generating, setGenerating] = useState(null);
    const [revoking, setRevoking] = useState(null);
    const [generatingAll, setGeneratingAll] = useState(false);

    const handleGenerate = async (contingentId) => {
        setGenerating(contingentId);
        try {
            await router.post(`/admin/events/${event.slug}/score-tokens/generate`, {
                contingent_id: contingentId,
            }, {
                preserveScroll: true,
            });
        } catch {
            // error handled by server
        } finally {
            setGenerating(null);
        }
    };

    const handleRevoke = async (tokenId) => {
        setRevoking(tokenId);
        try {
            await router.post(`/admin/events/${event.slug}/score-tokens/revoke/${tokenId}`, {}, {
                preserveScroll: true,
            });
        } catch {
            // error handled by server
        } finally {
            setRevoking(null);
        }
    };

    const handleGenerateAll = async () => {
        if (!confirm('Generate token untuk semua kontingen yang belum memiliki token aktif?')) return;
        setGeneratingAll(true);
        try {
            await router.post(`/admin/events/${event.slug}/score-tokens/generate-all`, {}, {
                preserveScroll: true,
            });
        } catch {
            // error handled by server
        } finally {
            setGeneratingAll(false);
        }
    };

    return (
        <div className="min-h-screen bg-deep-black">
            <Head title="Token Rekap - Admin" />

            <div className="max-w-6xl mx-auto p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-gold-primary" /> Token Rekap Nilai
                        </h1>
                        <p className="text-xs text-text-muted mt-0.5">{event.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.visit(`/admin/events/${event.slug}`)}
                            className="px-3 py-2 bg-white/5 border border-white/5 hover:border-gold-primary/30 rounded text-xs font-semibold text-text-primary hover:bg-white/[0.08] transition-all flex items-center gap-1.5"
                        >
                            &larr; Platform Control Room
                        </button>
                        <button
                            onClick={handleGenerateAll}
                            disabled={generatingAll}
                            className="px-3 py-2 bg-gold-primary/20 hover:bg-gold-primary/30 text-gold-light border border-gold-primary/20 rounded text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {generatingAll ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Generate Semua
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="premium-card px-4 py-3 border-bronze-muted/20 flex-1 text-center">
                        <p className="text-2xl font-black text-white">{totalWithTokens}</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Token Dibuat</p>
                    </div>
                    <div className="premium-card px-4 py-3 border-emerald-500/20 flex-1 text-center">
                        <p className="text-2xl font-black text-emerald-400">{totalActiveTokens}</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">Token Aktif</p>
                    </div>
                </div>

                <div className="premium-card border border-bronze-muted/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-bronze-muted/20 text-[9px] uppercase tracking-wider text-text-muted bg-deep-black/40">
                                    <th className="py-3 px-4 w-12">No</th>
                                    <th className="py-3 px-4">Kontingen</th>
                                    <th className="py-3 px-4 w-20">Kategori</th>
                                    <th className="py-3 px-4 w-20">Region</th>
                                    <th className="py-3 px-4">Token</th>
                                    <th className="py-3 px-4 w-16">Status</th>
                                    <th className="py-3 px-4 w-36">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                {contingents.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-text-muted italic">
                                            Belum ada kontingen terdaftar.
                                        </td>
                                    </tr>
                                ) : contingents.map((c, idx) => (
                                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-4 text-text-muted font-mono">{idx + 1}</td>
                                        <td className="py-3 px-4 font-semibold text-white">{c.school_name}</td>
                                        <td className="py-3 px-4 text-text-muted">{c.category_type}</td>
                                        <td className="py-3 px-4 text-text-muted">{c.region}</td>
                                        <td className="py-3 px-4">
                                            {c.token ? (
                                                <span className="font-mono font-bold text-gold-light tracking-wider">{c.token.token}</span>
                                            ) : (
                                                <span className="text-text-muted italic">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {c.token?.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                                                    <CheckCircle className="h-3 w-3" /> Aktif
                                                </span>
                                            ) : c.token ? (
                                                <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-bold">
                                                    <XCircle className="h-3 w-3" /> Nonaktif
                                                </span>
                                            ) : (
                                                <span className="text-text-muted italic">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-1.5">
                                                {!c.token?.is_active ? (
                                                    <button
                                                        onClick={() => handleGenerate(c.id)}
                                                        disabled={generating === c.id}
                                                        className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        {generating === c.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Plus className="h-3 w-3" />
                                                        )}
                                                        {c.token ? 'Regen' : 'Generate'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRevoke(c.token.id)}
                                                        disabled={revoking === c.token.id}
                                                        className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 rounded text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        {revoking === c.token.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <ShieldOff className="h-3 w-3" />
                                                        )}
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
