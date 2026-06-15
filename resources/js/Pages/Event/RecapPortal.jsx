import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Award, FileText, CheckCircle2, ShieldAlert, Download, ArrowLeft, User, KeyRound, AlertCircle } from 'lucide-react';

function sumObj(obj) {
    if (!obj) return 0;
    return Object.values(obj).reduce((s, v) => s + (parseInt(v) || 0), 0);
}

export default function RecapPortal({ event, verified, contingent, score, juryScores = {}, pbbItems = {}, verifiedToken, dantonItems = {}, variasiItems = {}, formasiItems = {}, dantonVaforItems = {}, kostumItems = {}, makeupItems = {} }) {
    const [token, setToken] = useState(verifiedToken || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const pbbEntries = useMemo(() => {
        return Object.entries(pbbItems || {});
    }, [pbbItems]);

    const dantonEntries = useMemo(() => {
        return Object.entries(dantonItems || {});
    }, [dantonItems]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await router.post(`/events/${event.slug}/rekap/verify`, { token }, {
                preserveScroll: true,
                onError: (errors) => {
                    setError(errors.token || 'Token tidak valid.');
                },
                onSuccess: () => {
                    // page reloads with new props
                }
            });
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = () => {
        window.open(`/events/${event.slug}/rekap/export?token=${encodeURIComponent(token)}`, '_blank');
    };

    const getDetailSum = (details) => {
        if (!details) return 0;
        return Object.values(details).reduce((s, v) => s + (parseInt(v) || 0), 0);
    };

    if (verified && contingent) {
        return (
            <div className="min-h-screen bg-checkerboard flex flex-col items-center p-4">
                <Head title={`Rekap Nilai - ${contingent.school_name}`} />

                <div className="w-full max-w-5xl premium-card p-6 md:p-8 border border-[#8C6828]/30 relative overflow-hidden my-8">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon"></div>

                    <div className="mb-6 flex justify-between items-center">
                        <button
                            onClick={() => router.visit(`/events/${event.slug}/rekap`)}
                            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                        >
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </button>
                        <span className="text-[10px] font-bold text-gold-cream border border-gold-primary/20 bg-accent-maroon/20 px-3 py-1 rounded-full uppercase">
                            Portal Rekap Nilai
                        </span>
                    </div>

                    <div className="space-y-8">
                        <div className="text-center border-b border-bronze-muted/10 pb-6">
                            <div className="h-16 w-16 bg-accent-maroon/20 border border-gold-primary/30 rounded-full flex items-center justify-center text-xl font-extrabold text-gold-light mx-auto mb-3 uppercase">
                                {contingent.school_name.substring(0, 2)}
                            </div>
                            <h1 className="text-2xl font-extrabold text-white">
                                {contingent.school_name}
                                {contingent.is_reguler && (
                                    <span className="text-gold-cream text-sm ml-1.5 font-bold uppercase tracking-wider border border-gold-primary/20 bg-accent-maroon/20 px-2 py-0.5 rounded">
                                        *Reguler
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs text-text-muted mt-1.5 uppercase font-semibold tracking-wider">
                                Kategori {contingent.category_type} &bull; Wilayah {contingent.region}
                            </p>
                            <p className="text-[11px] text-bronze-muted mt-1 flex items-center justify-center gap-1">
                                <User className="h-3 w-3" /> Pelatih: {contingent.coach_name}
                            </p>
                        </div>

                        {score ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="premium-card p-5 border-gold-primary/30 text-center relative overflow-hidden bg-deep-black/60">
                                        <h3 className="text-[10px] font-bold text-gold-cream uppercase tracking-wider mb-1">Grand Total</h3>
                                        <span className="text-4xl font-black text-white font-mono block">{Math.round(parseInt(score.grand_total))}</span>
                                    </div>
                                    <div className="premium-card p-5 border-bronze-muted/10 text-center bg-deep-black/40">
                                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">PBB</h3>
                                        <span className="text-2xl font-black text-white font-mono">{Math.round(parseInt(score.pbb_score))}</span>
                                    </div>
                                    <div className="premium-card p-5 border-bronze-muted/10 text-center bg-deep-black/40">
                                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">Danton</h3>
                                        <span className="text-2xl font-black text-white font-mono">{Math.round(parseInt(score.danton_score))}</span>
                                    </div>
                                    <div className="premium-card p-5 border-bronze-muted/10 text-center bg-deep-black/40">
                                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">Vafor</h3>
                                        <span className="text-2xl font-black text-white font-mono">{Math.round(parseInt(score.vafor_score))}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="premium-card p-4 border-bronze-muted/10 text-center bg-deep-black/40">
                                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">Kostum</h3>
                                        <span className="text-xl font-black text-white font-mono">{Math.round(parseInt(score.kostum_score))}</span>
                                    </div>
                                    <div className="premium-card p-4 border-bronze-muted/10 text-center bg-deep-black/40">
                                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">Makeup</h3>
                                        <span className="text-xl font-black text-white font-mono">{Math.round(parseInt(score.makeup_score))}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="premium-card p-4 border-red-500/20 text-center bg-red-950/20">
                                        <h3 className="text-[10px] font-bold text-red-300 uppercase tracking-wider mb-1">Pengurangan Kostum</h3>
                                        <span className="text-xl font-black text-red-400 font-mono">-{Math.round(parseInt(score.kostum_penalty))}</span>
                                    </div>
                                    <div className="premium-card p-4 border-red-500/20 text-center bg-red-950/20">
                                        <h3 className="text-[10px] font-bold text-red-300 uppercase tracking-wider mb-1">Penalti Global</h3>
                                        <span className="text-xl font-black text-red-400 font-mono">-{Math.round(parseInt(score.penalties_score))}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDownloadPdf}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-all flex items-center gap-1.5 mx-auto"
                                >
                                    <Download className="h-4 w-4" /> Download PDF
                                </button>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gold-light uppercase tracking-wider border-b border-bronze-muted/20 pb-3 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-5 w-5 text-gold-primary" /> Audit Lembar Penilaian per Juri
                                    </h3>

                                    <div className="space-y-4">
                                        <details className="rounded-lg border border-bronze-muted/10 bg-deep-black/60 overflow-hidden" open>
                                            <summary className="cursor-pointer px-4 py-3 bg-accent-maroon/20 text-gold-light font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                                                <span>PBB + Danton (Audit Unsur) — {pbbEntries.length + dantonEntries.length} unsur</span>
                                                <span className="text-gold-bright">▼</span>
                                            </summary>
                                            <div className="max-h-[400px] overflow-y-auto">
                                                {juryScores.pbb ? (
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="border-b border-bronze-muted/20 text-gold-light font-bold bg-black/10 sticky top-0">
                                                                <th className="p-3 w-12 text-center">No</th>
                                                                <th className="p-3">Unsur Gerakan</th>
                                                                <th className="p-3 text-center w-16">Juri 1</th>
                                                                <th className="p-3 text-center w-16">Juri 2</th>
                                                                <th className="p-3 text-center w-16">Juri 3</th>
                                                                <th className="p-3 text-center w-24 bg-gold-primary/10 text-gold-bright">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                                            {pbbEntries.map(([key, label], idx) => {
                                                                const getScore = (jNum) => {
                                                                    const js = juryScores.pbb?.[jNum];
                                                                    const details = js?.pbb_details;
                                                                    if (!details) return null;
                                                                    const val = details[key];
                                                                    return (val !== undefined && val !== null && val !== '') ? parseInt(val) : null;
                                                                };
                                                                const s1 = getScore(1), s2 = getScore(2), s3 = getScore(3);
                                                                const total = (s1 || 0) + (s2 || 0) + (s3 || 0);
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] transition-all">
                                                                        <td className="p-3 text-center text-text-muted font-bold font-mono">{idx + 1}</td>
                                                                        <td className="p-3 font-semibold text-white/90">{label}</td>
                                                                        <td className="p-3 text-center font-mono font-medium">{s1 ?? '-'}</td>
                                                                        <td className="p-3 text-center font-mono font-medium">{s2 ?? '-'}</td>
                                                                        <td className="p-3 text-center font-mono font-medium">{s3 ?? '-'}</td>
                                                                        <td className="p-3 text-center font-mono font-bold bg-gold-primary/5 text-gold-primary">{total}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            <tr className="bg-accent-maroon/10 border-t-2 border-gold-primary/30">
                                                                <td colSpan={6} className="p-2 text-[10px] font-extrabold text-gold-light uppercase tracking-wider">Danton (Komandan)</td>
                                                            </tr>
                                                            {dantonEntries.map(([key, label], idx) => {
                                                                const getScore = (jNum) => {
                                                                    const js = juryScores.pbb?.[jNum];
                                                                    const details = js?.danton_details;
                                                                    if (!details) return null;
                                                                    const val = details[key];
                                                                    return (val !== undefined && val !== null && val !== '') ? parseInt(val) : null;
                                                                };
                                                                const s1 = getScore(1), s2 = getScore(2), s3 = getScore(3);
                                                                const total = (s1 || 0) + (s2 || 0) + (s3 || 0);
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] transition-all">
                                                                        <td className="p-3 text-center text-text-muted font-bold font-mono">{idx + 1}</td>
                                                                        <td className="p-3 font-semibold text-white/90">{label}</td>
                                                                        <td className="p-3 text-center font-mono font-medium">{s1 ?? '-'}</td>
                                                                        <td className="p-3 text-center font-mono font-medium">{s2 ?? '-'}</td>
                                                                        <td className="p-3 text-center font-mono font-medium">{s3 ?? '-'}</td>
                                                                        <td className="p-3 text-center font-mono font-bold bg-gold-primary/5 text-gold-primary">{total}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <p className="text-xs text-text-muted italic text-center py-6">Belum ada data penilaian PBB + Danton.</p>
                                                )}
                                            </div>
                                        </details>

                                        <details className="rounded-lg border border-bronze-muted/10 bg-deep-black/60 overflow-hidden" open>
                                            <summary className="cursor-pointer px-4 py-3 bg-deep-black/40 text-gold-light font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                                                <span>Variasi + Formasi (Audit Unsur)</span>
                                                <span className="text-gold-bright">▼</span>
                                            </summary>
                                            <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                                                {juryScores.vafor ? (
                                                    [1, 2].map((jNum) => {
                                                        const js = juryScores.vafor?.[jNum];
                                                        const varias = js?.variasi_details || {};
                                                        const formasi = js?.formasi_details || {};
                                                        const dantonVafor = js?.danton_vafor_details || {};
                                                        const allKeys = Array.from(new Set([...Object.keys(variasiItems), ...Object.keys(formasiItems), ...Object.keys(dantonVaforItems)]));
                                                        if (allKeys.length === 0) return null;
                                                        return (
                                                            <div key={jNum}>
                                                                <div className="text-xs font-extrabold uppercase tracking-wider text-white mb-2">Juri {jNum}</div>
                                                                <table className="w-full text-left border-collapse text-xs">
                                                                    <thead>
                                                                        <tr className="border-b border-bronze-muted/20 text-gold-light font-bold">
                                                                            <th className="p-2">Unsur</th>
                                                                            <th className="p-2 text-center w-16">Variasi</th>
                                                                            <th className="p-2 text-center w-16">Formasi</th>
                                                                            <th className="p-2 text-center w-20">Danton Vafor</th>
                                                                            <th className="p-2 text-center w-20 bg-gold-primary/10 text-gold-bright">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                                                        {allKeys.map((k) => {
                                                                            const label = variasiItems[k] || formasiItems[k] || dantonVaforItems[k] || k;
                                                                            const a = varias[k] ?? null;
                                                                            const b = formasi[k] ?? null;
                                                                            const c = dantonVafor[k] ?? null;
                                                                            const total = (parseInt(a) || 0) + (parseInt(b) || 0) + (parseInt(c) || 0);
                                                                            return (
                                                                                <tr key={k} className="hover:bg-white/[0.02] transition-all">
                                                                                    <td className="p-2 font-semibold text-white/90">{label}</td>
                                                                                    <td className="p-2 text-center font-mono">{a !== null ? parseInt(a) : '-'}</td>
                                                                                    <td className="p-2 text-center font-mono">{b !== null ? parseInt(b) : '-'}</td>
                                                                                    <td className="p-2 text-center font-mono">{c !== null ? parseInt(c) : '-'}</td>
                                                                                    <td className="p-2 text-center font-mono font-bold bg-gold-primary/5 text-gold-primary">{total}</td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-xs text-text-muted italic text-center py-6">Belum ada data penilaian Variasi & Formasi.</p>
                                                )}
                                            </div>
                                        </details>

                                        <details className="rounded-lg border border-bronze-muted/10 bg-deep-black/60 overflow-hidden" open>
                                            <summary className="cursor-pointer px-4 py-3 bg-deep-black/40 text-gold-light font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                                                <span>Kostum + Makeup (Audit Unsur)</span>
                                                <span className="text-gold-bright">▼</span>
                                            </summary>
                                            <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                                                {juryScores.makeup_kostum ? (
                                                    [1, 2].map((jNum) => {
                                                        const js = juryScores.makeup_kostum?.[jNum];
                                                        const kostum = js?.kostum_details || {};
                                                        const makeup = js?.makeup_details || {};
                                                        const allKeys = Array.from(new Set([...Object.keys(kostumItems), ...Object.keys(makeupItems)]));
                                                        if (allKeys.length === 0) return null;
                                                        return (
                                                            <div key={jNum}>
                                                                <div className="text-xs font-extrabold uppercase tracking-wider text-white mb-2">Juri {jNum}</div>
                                                                <table className="w-full text-left border-collapse text-xs">
                                                                    <thead>
                                                                        <tr className="border-b border-bronze-muted/20 text-gold-light font-bold">
                                                                            <th className="p-2">Unsur</th>
                                                                            <th className="p-2 text-center w-16">Kostum</th>
                                                                            <th className="p-2 text-center w-16">Makeup</th>
                                                                            <th className="p-2 text-center w-20 bg-gold-primary/10 text-gold-bright">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                                                        {allKeys.map((k) => {
                                                                            const label = kostumItems[k] || makeupItems[k] || k;
                                                                            const a = kostum[k] ?? null;
                                                                            const b = makeup[k] ?? null;
                                                                            const total = (parseInt(a) || 0) + (parseInt(b) || 0);
                                                                            return (
                                                                                <tr key={k} className="hover:bg-white/[0.02] transition-all">
                                                                                    <td className="p-2 font-semibold text-white/90">{label}</td>
                                                                                    <td className="p-2 text-center font-mono">{a !== null ? parseInt(a) : '-'}</td>
                                                                                    <td className="p-2 text-center font-mono">{b !== null ? parseInt(b) : '-'}</td>
                                                                                    <td className="p-2 text-center font-mono font-bold bg-gold-primary/5 text-gold-primary">{total}</td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-xs text-text-muted italic text-center py-6">Belum ada data penilaian Kostum & Makeup.</p>
                                                )}
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 bg-deep-black/40 border border-bronze-muted/10 rounded-lg">
                                <AlertCircle className="h-12 w-12 text-gold-primary mx-auto mb-3 opacity-60" />
                                <h3 className="font-bold text-white text-base">Lembar Nilai Masih Draf</h3>
                                <p className="text-xs text-text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
                                    Panitia/juri sedang menyusun rekapitulasi penilaian. Detail skor akan muncul setelah data disimpan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-checkerboard flex flex-col items-center justify-center p-4">
            <Head title="Rekap Nilai - Masukkan Token" />

            <div className="w-full max-w-md premium-card p-6 md:p-8 border border-[#8C6828]/30 relative overflow-hidden my-8">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon"></div>

                <div className="mb-4 flex items-center justify-between">
                    <button
                        onClick={() => router.visit(`/events/${event.slug}`)}
                        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Event
                    </button>
                    <span className="text-[10px] font-bold text-gold-cream border border-gold-primary/20 bg-accent-maroon/20 px-3 py-1 rounded-full uppercase">
                        Portal Rekap
                    </span>
                </div>

                <div className="text-center mb-6">
                    <div className="h-16 w-16 bg-accent-maroon/20 border border-gold-primary/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="h-8 w-8 text-gold-primary" />
                    </div>
                    <h1 className="text-xl font-extrabold text-white">Portal Rekap Nilai</h1>
                    <p className="text-xs text-text-muted mt-1">
                        {event.name}
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                            Masukkan Token
                        </label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => { setToken(e.target.value.toUpperCase()); setError(''); }}
                            placeholder="Contoh: ABC12345"
                            className="w-full px-3 py-2.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary text-sm text-center font-mono font-bold tracking-widest focus:outline-none focus:border-gold-primary uppercase"
                            autoFocus
                            maxLength={20}
                        />
                        {error && (
                            <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token.trim()}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-accent-maroon to-gold-primary text-white font-bold text-sm rounded transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                        {loading ? (
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <KeyRound className="h-4 w-4" /> Lihat Nilai
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-bronze-muted/10">
                    <button
                        onClick={() => router.visit(`/events/${event.slug}`)}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Halaman Event
                    </button>
                </div>
            </div>
        </div>
    );
}
