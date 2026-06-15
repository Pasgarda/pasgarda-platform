import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { BarChart3, Flame, ShieldAlert, HelpCircle, Trophy, ArrowLeft, ExternalLink } from 'lucide-react';
import { getVotingBonusInfo } from '../../Utils/scoreUtils';
import ScrollReveal from '../../Components/ScrollReveal';

export default function LeaderboardFinal({ event, contingents, finalRoundScores = [] }) {
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('U16');

    const categoryContingents = contingents.filter((c) => c.category_type === activeCategoryFilter);

    const scoresList = useMemo(() => {
        return contingents.filter(c => c.score).map(c => ({
            contingent_id: c.id,
            pbb_score: c.score.pbb_score,
            danton_score: c.score.danton_score,
        }));
    }, [contingents]);

    const sortedByVotes = useMemo(() => {
        return [...contingents].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
    }, [contingents]);

    const categoryContingentsWithSelection = useMemo(() => {
        return categoryContingents.map(c => {
            const pbb = c.score?.pbb_score || 0;
            const danton = c.score?.danton_score || 0;
            const vafor = c.score?.vafor_score || 0;
            const penalties = c.score?.penalties_score || 0;
            const nilaiKontingen = c.score?.nilai_kontingen_bonus || 0;
            const selectionScore = pbb + danton + vafor + nilaiKontingen - penalties;
            return { ...c, selectionScore, _pbb: pbb, _danton: danton, _vafor: vafor, _penalties: penalties, _nilaiKontingen: nilaiKontingen };
        });
    }, [categoryContingents, contingents, scoresList, sortedByVotes]);

    const categorySortedBySelection = useMemo(() => {
        return [...categoryContingentsWithSelection].sort((a, b) => b.selectionScore - a.selectionScore);
    }, [categoryContingentsWithSelection]);

    const finalist1 = categorySortedBySelection[0];
    const finalist2 = categorySortedBySelection[1];

    const voteRanked = useMemo(() => {
        return [...categoryContingents].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
    }, [categoryContingents]);

    const voteTop8 = voteRanked.slice(0, 8);

    const selectionTop8 = categorySortedBySelection.slice(0, 8);

    const f1Rec = finalist1 ? finalRoundScores.find((fs) => fs.contingent_id === finalist1.id) : null;
    const f2Rec = finalist2 ? finalRoundScores.find((fs) => fs.contingent_id === finalist2.id) : null;
    const f1Total = f1Rec ? Math.round(parseInt(f1Rec.total_score)) : 0;
    const f2Total = f2Rec ? Math.round(parseInt(f2Rec.total_score)) : 0;
    const totalVersus = f1Total + f2Total;
    const barPct1 = totalVersus > 0 ? (f1Total / totalVersus) * 100 : 50;
    const barPct2 = totalVersus > 0 ? (f2Total / totalVersus) * 100 : 50;
    const bothScoresInput = finalist1 && finalist2 && f1Total > 0 && f2Total > 0;
    let winnerId = null;
    if (bothScoresInput) {
        if (f1Total > f2Total) winnerId = finalist1.id;
        else if (f2Total > f1Total) winnerId = finalist2.id;
        else {
            winnerId = (finalist1.score?.grand_total || 0) >= (finalist2.score?.grand_total || 0) ? finalist1.id : finalist2.id;
        }
    }

    const bothHaveScores = finalist1 && finalist2 && finalist1.score && finalist2.score;

    const renderRekapValue = (rec, key) => {
        if (!rec) return 0;
        const val = parseInt(rec[key]);
        if (key === 'penalties') return -Math.abs(val);
        return val;
    };

    const rekapRows = bothScoresInput ? [
        { label: 'PBB (3 Juri)', key: 'pbb_score', color: 'text-gold-bright' },
        { label: 'Danton (3 Juri)', key: 'danton_score', color: 'text-gold-light' },
        { label: 'Vafor (2 Juri)', key: 'vafor_score', color: 'text-sky-400' },
        { label: 'Penalti', key: 'penalties', color: 'text-accent-mahogany' },
    ] : [];

    const isFinalist = (cId) => cId === finalist1?.id || cId === finalist2?.id;

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="THE FINAL - Leaderboard" />
            <div className="max-w-6xl mx-auto space-y-8">
                <ScrollReveal>
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider mb-2">
                            <ArrowLeft className="h-4 w-4" /> Detail Event
                        </Link>
                        <h1 className="text-3xl font-extrabold text-white mt-1">
                            THE <span className="text-gold-primary">FINAL</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                        <a href={`/events/${event.slug}/leaderboard/vote`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Vote</a>
                        <a href={`/events/${event.slug}/leaderboard/supporter`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Best Supporter</a>
                        <a href={`/events/${event.slug}/leaderboard/instagram`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Instagram</a>
                        <a href={`/events/${event.slug}/leaderboard/rekap`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Rekap</a>
                        <a href={`/events/${event.slug}/leaderboard/final`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40">The Final</a>
                        <a href={`/events/${event.slug}/leaderboard/juara`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Juara</a>
                    </div>
                </div>
                </ScrollReveal>

                <div className="space-y-8">
                    <div className="flex gap-2 max-w-md mx-auto bg-deep-black/40 p-1 rounded border border-bronze-muted/10">
                        {['U16', 'U19'].map((cat) => (
                            <button key={cat} type="button" onClick={() => setActiveCategoryFilter(cat)}
                                className={`flex-1 py-1.5 text-center rounded text-xs font-bold transition-all uppercase ${
                                    activeCategoryFilter === cat ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white shadow font-black' : 'text-bronze-muted hover:text-white'
                                }`}>
                                {cat === 'U16' ? 'SMP' : 'SMA'}
                            </button>
                        ))}
                    </div>

                    {['U16', 'U19'].includes(activeCategoryFilter) ? (
                        <>
                            {/* ─── SECTION 1: VS MATCH ─── */}
                            {finalist1 && finalist2 && bothHaveScores ? (
                                <div className="space-y-6">
                                    <div className="p-4 bg-accent-maroon/10 border border-accent-maroon/30 rounded text-xs flex gap-3">
                                        <BarChart3 className="h-5 w-5 text-gold-primary shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-white mb-0.5">Finalis Ditentukan dari Nilai Seleksi</h4>
                                            <p className="text-text-primary/80 leading-relaxed">2 kontingen dengan Nilai Seleksi tertinggi di kategorinya berhak maju ke Babak Final. Nilai Seleksi = PBB + Danton + Vafor + Nilai Kontingen − Penalti.</p>
                                        </div>
                                    </div>

                                    <div className="premium-card p-6 border-gold-primary/20 space-y-6 bg-deep-black/40">
                                        <h3 className="text-center font-bold text-gold-cream text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
                                            <Flame className="h-4 w-4 text-gold-primary animate-pulse" />
                                            THE FINAL MATCH: {activeCategoryFilter === 'U16' ? 'SMP' : 'SMA'}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                            <ScrollReveal delay={0}>
                                            <div className={`p-5 rounded text-center relative transition-all duration-700 ${
                                                bothScoresInput && winnerId === finalist1.id
                                                    ? 'bg-gradient-to-br from-gold-primary/20 to-deep-black border-2 border-gold-primary shadow-lg shadow-gold-primary/20'
                                                    : 'bg-deep-black/60 border border-gold-primary/30'
                                            }`}>
                                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold-primary" />
                                                {bothScoresInput && winnerId === finalist1.id && (
                                                    <span className="absolute -top-3 -right-3 text-2xl animate-bounce">👑</span>
                                                )}
                                                <span className="text-[10px] font-bold text-gold-primary bg-gold-primary/10 px-2 py-0.5 rounded border border-gold-primary/20 uppercase">🏆 Nilai Seleksi #1</span>
                                                <h4 className="text-base font-black text-white mt-2">{finalist1.school_name}{finalist1.is_reguler ? ' *reguler' : ''}</h4>
                                                <p className="text-[10px] text-text-muted uppercase tracking-wider">{finalist1.region} • {finalist1.category_type}</p>
                                                <div className="mt-3 flex justify-center gap-6 text-xs">
                                                    <div>
                                                        <span className="text-text-muted block font-semibold">First Round Score</span>
                                                        <span className="font-extrabold text-white font-mono">{Math.round(finalist1.score?.grand_total || 0)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-text-muted block font-semibold">Final Score</span>
                                                        <span className="font-extrabold text-gold-bright font-mono text-lg">{f1Total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            </ScrollReveal>
                                            <ScrollReveal delay={100}>
                                            <div className={`p-5 rounded text-center relative transition-all duration-700 ${
                                                bothScoresInput && winnerId === finalist2.id
                                                    ? 'bg-gradient-to-br from-gold-primary/20 to-deep-black border-2 border-gold-primary shadow-lg shadow-gold-primary/20'
                                                    : 'bg-deep-black/60 border border-accent-mahogany/30'
                                            }`}>
                                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-mahogany" />
                                                {bothScoresInput && winnerId === finalist2.id && (
                                                    <span className="absolute -top-3 -right-3 text-2xl animate-bounce">👑</span>
                                                )}
                                                <span className="text-[10px] font-bold text-accent-mahogany bg-accent-mahogany/10 px-2 py-0.5 rounded border border-accent-mahogany/20 uppercase">🥈 Nilai Seleksi #2</span>
                                                <h4 className="text-base font-black text-white mt-2">{finalist2.school_name}{finalist2.is_reguler ? ' *reguler' : ''}</h4>
                                                <p className="text-[10px] text-text-muted uppercase tracking-wider">{finalist2.region} • {finalist2.category_type}</p>
                                                <div className="mt-3 flex justify-center gap-6 text-xs">
                                                    <div>
                                                        <span className="text-text-muted block font-semibold">First Round Score</span>
                                                        <span className="font-extrabold text-white font-mono">{Math.round(finalist2.score?.grand_total || 0)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-text-muted block font-semibold">Final Score</span>
                                                        <span className="font-extrabold text-gold-bright font-mono text-lg">{f2Total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            </ScrollReveal>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold text-text-muted">
                                                <span className="text-gold-light">{finalist1.school_name}: {f1Total}</span>
                                                <span className="text-gold-primary tracking-widest font-black text-sm relative">
                                                    VS
                                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-primary/20 to-transparent animate-pulse rounded" />
                                                </span>
                                                <span className="text-accent-mahogany">{finalist2.school_name}: {f2Total}</span>
                                            </div>
                                            <div className="w-full h-5 bg-deep-black rounded-full overflow-hidden flex border border-bronze-muted/20">
                                                <div className="bg-gradient-to-r from-accent-maroon via-gold-primary to-gold-bright transition-all duration-1000 ease-out" style={{ width: `${barPct1}%` }} />
                                                <div className="bg-gradient-to-r from-gold-bright to-accent-burgundy transition-all duration-1000 ease-out" style={{ width: `${barPct2}%` }} />
                                            </div>
                                            <p className="text-[9px] text-text-muted text-center italic mt-1">Progress bar menampilkan perbandingan skor juri babak final.</p>
                                        </div>

                                        <div className="p-4 bg-deep-black/60 rounded border border-bronze-muted/10 text-xs space-y-3">
                                            <h5 className="font-bold text-white text-[10px] uppercase tracking-wider flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5 text-gold-primary" /> Cara Penentuan Juara Final</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {[
                                                    { step: '01', title: 'PBB (3 Juri)', desc: 'Skor PBB diakumulasikan dari 3 juri secara live.' },
                                                    { step: '02', title: 'Danton (3 Juri)', desc: 'Skor Danton dari 3 juri penampilan final.' },
                                                    { step: '03', title: 'Vafor (2 Juri)', desc: 'Variasi + Formasi + Danton Vafor dari 2 juri.' },
                                                ].map(({ step, title, desc }) => (
                                                    <div key={step} className="p-3 bg-white/5 rounded border border-white/5">
                                                        <span className="text-[9px] font-black text-gold-primary block mb-1">Step {step}</span>
                                                        <span className="font-bold text-white block text-[10px]">{title}</span>
                                                        <span className="text-[10px] text-text-muted">{desc}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-text-muted italic">Skor final dan pemenang hanya akan diumumkan pada Closing Ceremony.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-deep-black/40 border border-bronze-muted/10 rounded">
                                    <ShieldAlert className="h-10 w-10 text-gold-primary mx-auto mb-2 opacity-50" />
                                    <h3 className="font-bold text-white text-xs uppercase animate-fade-in">Finalis Belum Terbentuk</h3>
                                    <p className="text-[11px] text-bronze-muted mt-1 leading-relaxed">Kategori ini memerlukan minimal 2 kontingen yang memiliki data nilai untuk maju ke THE FINAL. Finalis ditentukan dari Nilai Seleksi (PBB + Danton + Vafor + Nilai Kontingen − Penalti).</p>
                                </div>
                            )}

                            {/* ─── SECTIONS 2 & 3: BERSEBELAHAN ─── */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    {selectionTop8.length > 0 && (
                                        <div className="premium-card border-gold-primary/20 overflow-hidden bg-deep-black/40 h-full">
                                            <div className="px-4 py-3 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                                                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                                    <Trophy className="h-3.5 w-3.5 text-gold-primary" /> Daftar Nilai Seleksi Finalis (Top 8)
                                                </h3>
                                            </div>
                                            <div className="overflow-x-auto scroll-smooth">
                                                <table className="w-full text-left text-[10px]">
                                                    <thead>
                                                        <tr className="border-b border-bronze-muted/10 text-text-muted uppercase tracking-wider">
                                                            <th className="p-3 font-bold">Rank</th>
                                                            <th className="p-3 font-bold">Sekolah</th>
                                                            <th className="p-3 font-bold text-right">PBB</th>
                                                            <th className="p-3 font-bold text-right">Danton</th>
                                                            <th className="p-3 font-bold text-right">Vafor</th>
                                                            <th className="p-3 font-bold text-right">Penalti</th>
                                                            <th className="p-3 font-bold text-right">Nilai Kontingen</th>
                                                            <th className="p-3 font-bold text-right">Nilai Seleksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-bronze-muted/5">
                                                        {selectionTop8.map((c, idx) => (
                                                            <tr key={c.id} className={`hover:bg-white/[0.02] transition-colors ${isFinalist(c.id) ? 'bg-gold-primary/[0.03]' : ''}`}>
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className={`font-black font-mono ${idx < 2 ? 'text-gold-primary' : 'text-text-muted'}`}>
                                                                            {idx + 1}
                                                                        </span>
                                                                        {isFinalist(c.id) && (
                                                                            <span className="text-[8px] bg-gold-primary/20 text-gold-light px-1 rounded font-bold">⭐ FINALIS</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="font-bold text-white">{c.school_name}</span>
                                                                    {c.is_reguler && <span className="text-text-muted ml-1">*reguler</span>}
                                                                </td>
                                                                <td className="p-3 text-right font-mono text-gold-bright font-semibold">{Math.round(c._pbb)}</td>
                                                                <td className="p-3 text-right font-mono text-gold-light font-semibold">{Math.round(c._danton)}</td>
                                                                <td className="p-3 text-right font-mono text-sky-400 font-semibold">{Math.round(c._vafor)}</td>
                                                                <td className="p-3 text-right font-mono text-accent-mahogany font-semibold">-{Math.round(c._penalties)}</td>
                                                                <td className="p-3 text-right font-mono text-emerald-400 font-semibold">+{Math.round(c._nilaiKontingen)}</td>
                                                                <td className="p-3 text-right font-mono font-extrabold text-gold-light">{Math.round(c.selectionScore)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="px-4 py-2 border-t border-bronze-muted/5 text-[9px] text-text-muted">
                                                Nilai Seleksi = PBB + Danton + Vafor + Nilai Kontingen − Penalti. ⭐ = Finalis (2 besar lolos ke babak final).
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    {voteTop8.length > 0 && (
                                        <div className="premium-card border-gold-primary/20 overflow-hidden bg-deep-black/40 h-full">
                                            <div className="px-4 py-3 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                                                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                                    <BarChart3 className="h-3.5 w-3.5 text-gold-primary" /> Klasemen Best Kontingen (Vote Rank 1-8)
                                                </h3>
                                            </div>
                                            <div className="overflow-x-auto scroll-smooth">
                                                <table className="w-full text-left text-[10px]">
                                                    <thead>
                                                        <tr className="border-b border-bronze-muted/10 text-text-muted uppercase tracking-wider">
                                                            <th className="p-3 font-bold">Vote Rank</th>
                                                            <th className="p-3 font-bold">Sekolah</th>
                                                            <th className="p-3 font-bold text-center">Suara</th>
                                                            <th className="p-3 font-bold text-right">(PBB + Danton)</th>
                                                            <th className="p-3 font-bold text-right">Bonus %</th>
                                                            <th className="p-3 font-bold text-right">Bonus Poin</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-bronze-muted/5">
                                                        {voteTop8.map((c, idx) => {
                                                            const info = getVotingBonusInfo(c.id, contingents, scoresList, sortedByVotes);
                                                            const pbbDantSum = (c.score?.pbb_score || 0) + (c.score?.danton_score || 0);
                                                            return (
                                                                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                                                    <td className="p-3">
                                                                        <span className="font-black font-mono text-gold-primary">{info.rank}</span>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <span className="font-bold text-white">{c.school_name}</span>
                                                                        {c.is_reguler && <span className="text-text-muted ml-1">*reguler</span>}
                                                                    </td>
                                                                    <td className="p-3 text-center font-mono text-gold-bright font-bold">{c.votes_count || 0}</td>
                                                                    <td className="p-3 text-right font-mono text-gold-light font-semibold">{Math.round(pbbDantSum)}</td>
                                                                    <td className="p-3 text-right font-mono text-violet-400 font-semibold">{info.percentage.toFixed(1)}%</td>
                                                                    <td className="p-3 text-right font-mono text-violet-400 font-semibold">+{info.calculatedBonus.toFixed(2)}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="px-4 py-2 border-t border-bronze-muted/5 text-[9px] text-text-muted">
                                                Peringkat berdasarkan jumlah suara terbanyak. Bonus dihitung dari (PBB + Danton) Rank 1: 1%, Rank 2: 0.8%, Rank 3: 0.6%, Rank 4: 0.4%, Rank 5: 0.3%, Rank 6: 0.2%, Rank 7: 0.1%, Rank 8+: 0%.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ─── SECTION 4: REKAP NILAI THE FINAL ─── */}
                            {bothScoresInput && (
                                <ScrollReveal>
                                <div className="premium-card border-gold-primary/20 overflow-hidden bg-deep-black/40">
                                    <div className="px-4 py-3 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                                        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                            <Flame className="h-3.5 w-3.5 text-gold-primary" /> Rekap Nilai The Final
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto p-4 scroll-smooth">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-bronze-muted/10">
                                                    <th className="pb-2 font-bold text-text-muted uppercase tracking-wider text-[10px]">Komponen</th>
                                                    <th className="pb-2 text-center font-bold text-gold-light uppercase tracking-wider text-[10px]">
                                                        {finalist1.school_name}
                                                        <Link href={`/events/${event.slug}/leaderboard/final/juri/${finalist1.id}`}
                                                            className="inline-flex items-center gap-0.5 ml-2 text-[8px] text-gold-primary/70 hover:text-gold-light underline underline-offset-2">
                                                            Lihat Detail <ExternalLink className="h-2.5 w-2.5" />
                                                        </Link>
                                                    </th>
                                                    <th className="pb-2 text-center font-bold text-accent-mahogany uppercase tracking-wider text-[10px]">
                                                        {finalist2.school_name}
                                                        <Link href={`/events/${event.slug}/leaderboard/final/juri/${finalist2.id}`}
                                                            className="inline-flex items-center gap-0.5 ml-2 text-[8px] text-gold-primary/70 hover:text-gold-light underline underline-offset-2">
                                                            Lihat Detail <ExternalLink className="h-2.5 w-2.5" />
                                                        </Link>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-bronze-muted/5">
                                                {rekapRows.map(({ label, key, color }) => {
                                                    const v1 = renderRekapValue(f1Rec, key);
                                                    const v2 = renderRekapValue(f2Rec, key);
                                                    const maxVal = Math.max(Math.abs(v1), Math.abs(v2), 1);
                                                    const bar1 = (Math.abs(v1) / maxVal) * 100;
                                                    const bar2 = (Math.abs(v2) / maxVal) * 100;
                                                    return (
                                                        <tr key={key} className="hover:bg-white/[0.01]">
                                                            <td className="py-3 pr-4 font-semibold text-text-primary/80">{label}</td>
                                                            <td className="py-3 text-center">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <div className="w-16 h-2 bg-deep-black rounded-full overflow-hidden">
                                                                        <div className="h-full bg-gradient-to-r from-gold-primary to-gold-bright rounded-full transition-all" style={{ width: `${bar1}%` }} />
                                                                    </div>
                                                                    <span className={`font-mono font-bold w-12 text-right ${color} ${key === 'penalties' ? 'text-accent-mahogany' : ''}`}>
                                                                        {key === 'penalties' ? v1 : Math.round(v1)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 text-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`font-mono font-bold w-12 text-left ${color} ${key === 'penalties' ? 'text-accent-mahogany' : ''}`}>
                                                                        {key === 'penalties' ? v2 : Math.round(v2)}
                                                                    </span>
                                                                    <div className="w-16 h-2 bg-deep-black rounded-full overflow-hidden">
                                                                        <div className="h-full bg-gradient-to-r from-accent-burgundy to-accent-mahogany rounded-full transition-all" style={{ width: `${bar2}%` }} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t-2 border-gold-primary/30">
                                                    <td className="py-3 pr-4 font-extrabold text-white uppercase tracking-wider text-xs">TOTAL</td>
                                                    <td className="py-3 text-center">
                                                        <span className="font-black text-gold-primary font-mono text-sm">{f1Total}</span>
                                                    </td>
                                                    <td className="py-3 text-center relative">
                                                        <span className="font-black text-gold-primary font-mono text-sm">{f2Total}</span>
                                                        {winnerId && (
                                                            <span className="ml-2 text-[8px] bg-gold-primary/20 text-gold-light px-1.5 py-0.5 rounded font-bold animate-pulse inline-block">
                                                                ★ WINNER
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                                </ScrollReveal>
                            )}
                        </>
                    ) : (
                        <div className="premium-card p-6 border-gold-primary/20 text-center space-y-3 bg-deep-black/40">
                            <Trophy className="h-10 w-10 text-gold-primary mx-auto mb-2 opacity-75 animate-pulse" />
                            <h3 className="font-bold text-white text-xs uppercase">Tidak Ada Babak Final</h3>
                            <p className="text-[11px] text-bronze-muted mt-1 leading-relaxed max-w-md mx-auto">Kategori Purna tidak memiliki pertandingan Babak Final. Pemenang ditentukan langsung dari perolehan nilai pada Babak Rekap.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
