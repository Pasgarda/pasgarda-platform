import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Flame, ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

const CATEGORY_LABELS = { U12: 'SD', U16: 'SMP', U19: 'SMA', Purna: 'Purna' };
const CATEGORY_ORDER = ['U12', 'U16', 'U19', 'Purna'];
const TOP_N = 7;

export default function LeaderboardSupporter({ event, contingents }) {
    const supporterStopped = event.supporter_status === 'stopped';
    const [autoReload, setAutoReload] = useState(false);
    const [stageMode, setStageMode] = useState(false);
    const autoReloadRef = useRef(null);

    useEffect(() => {
        if (autoReload) {
            const interval = stageMode ? 15000 : 10000;
            autoReloadRef.current = setInterval(() => {
                router.reload({ only: ['contingents'] });
            }, interval);
        } else {
            if (autoReloadRef.current) {
                clearInterval(autoReloadRef.current);
                autoReloadRef.current = null;
            }
        }
        return () => {
            if (autoReloadRef.current) {
                clearInterval(autoReloadRef.current);
            }
        };
    }, [autoReload, stageMode]);

    const sortedSupporter = [...contingents].sort((a, b) => b.supporter_days - a.supporter_days);

    // Dense ranks per category
    const denseRanksByCategory = {};
    for (const cat of CATEGORY_ORDER) {
        const catItems = sortedSupporter.filter(c => c.category_type === cat);
        const ranks = {};
        let prevScore = null;
        let currentRank = 0;
        catItems.forEach((c, idx) => {
            if (c.supporter_days !== prevScore) {
                currentRank = idx + 1;
                prevScore = c.supporter_days;
            }
            ranks[c.id] = currentRank;
        });
        denseRanksByCategory[cat] = ranks;
    }

    const groupedByCategory = {};
    for (const cat of CATEGORY_ORDER) {
        groupedByCategory[cat] = sortedSupporter
            .filter(c => c.category_type === cat && c.supporter_days > 0)
            .slice(0, TOP_N);
    }

    const categoryHasMore = {};
    const categoryTotalCounts = {};
    for (const cat of CATEGORY_ORDER) {
        categoryTotalCounts[cat] = sortedSupporter.filter(c => c.category_type === cat).length;
        const withSupport = sortedSupporter.filter(c => c.category_type === cat && c.supporter_days > 0).length;
        categoryHasMore[cat] = withSupport > TOP_N;
    }

    const zeroScoreContingents = sortedSupporter.filter(c => c.supporter_days === 0);
    const zeroByCategory = {};
    for (const cat of CATEGORY_ORDER) {
        const items = zeroScoreContingents.filter(c => c.category_type === cat);
        if (items.length > 0) zeroByCategory[cat] = items;
    }

    const groupedByCategoryGroups = {};
    for (const cat of CATEGORY_ORDER) {
        const items = groupedByCategory[cat];
        const groups = [];
        for (const c of items) {
            if (groups.length === 0 || c.supporter_days !== groups[groups.length - 1][0].supporter_days) {
                groups.push([c]);
            } else {
                groups[groups.length - 1].push(c);
            }
        }
        groupedByCategoryGroups[cat] = groups;
    }

    const getRankBadge = (idx) => {
        if (idx === 0) return 'bg-gold-primary text-deep-black';
        if (idx === 1) return 'bg-slate-300 text-deep-black';
        if (idx === 2) return 'bg-[#CD7F32] text-white';
        return 'bg-white/5 text-text-primary';
    };

    const stageRootClass = stageMode
        ? 'min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-3 font-sans text-[13px] leading-relaxed overflow-hidden'
        : 'min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-3 font-sans overflow-hidden';

    return (
        <div className={stageRootClass}>
            <Head title="Best Supporter - Leaderboard" />
            <div className={`${stageMode ? 'max-w-7xl' : 'max-w-6xl'} mx-auto h-screen flex flex-col`}>
                {/* Top bar */}
                <ScrollReveal>
                <div className="flex items-center justify-between border-b border-bronze-muted/20 pb-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href={`/events/${event.slug}`} className="text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider">
                            <ArrowLeft className="h-4 w-4 inline" /> Event
                        </Link>
                        <h1 className="text-lg font-extrabold text-white">
                            Best <span className="text-gold-primary">Supporter</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {!stageMode && (
                            <>
                                <a href={`/events/${event.slug}/leaderboard/vote`} className="px-2 py-1 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Vote</a>
                                <a href={`/events/${event.slug}/leaderboard/supporter`} className="px-2 py-1 rounded text-[10px] font-bold transition-all border bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40">Supporter</a>
                                <a href={`/events/${event.slug}/leaderboard/instagram`} className="px-2 py-1 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">IG</a>
                                <a href={`/events/${event.slug}/leaderboard/rekap`} className="px-2 py-1 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Rekap</a>
                                <a href={`/events/${event.slug}/leaderboard/final`} className="px-2 py-1 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Final</a>
                                <a href={`/events/${event.slug}/leaderboard/juara`} className="px-2 py-1 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Juara</a>
                            </>
                        )}
                        <button
                            onClick={() => setAutoReload(prev => !prev)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                autoReload
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-white/5 text-text-muted border border-white/5 hover:border-white/20'
                            }`}
                        >
                            <RefreshCw className={`h-3 w-3 ${autoReload ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setStageMode(prev => !prev)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                stageMode
                                    ? 'bg-gold-primary/20 text-gold-primary border border-gold-primary/30'
                                    : 'bg-white/5 text-text-muted border border-white/5 hover:border-white/20'
                            }`}
                        >
                            🎬
                        </button>
                    </div>
                </div>
                </ScrollReveal>

                {/* Supporter stopped banner */}
                {supporterStopped && (
                    <div className="mt-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded text-[11px] text-red-300 font-semibold shrink-0 flex items-center gap-2">
                        <span className="text-lg">🏁</span>
                        <span>Pendaftaran supporter telah ditutup oleh panitia. Hasil akhir sudah ditetapkan.</span>
                    </div>
                )}

                {/* Info card */}
                <div className="mt-2 p-2.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded shrink-0 flex items-center gap-3">
                    <Flame className="h-5 w-5 text-gold-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white font-bold">Best Supporter — Cara Mendukung!</p>
                        <p className="text-[10px] text-text-muted/80">Beli tiket masuk &rarr; scan QR di gate &rarr; pilih kontingen yang didukung. Setiap scan tiket = <strong className="text-white">+1 hari dukungan</strong> untuk kontingen pilihanmu. Semakin banyak supporter, semakin besar peluang menang!</p>
                    </div>
                </div>

                {/* Per-category panels */}
                <div className="flex-1 overflow-y-auto mt-2 min-h-0 space-y-2 scroll-smooth">
                    <div className="grid grid-cols-2 gap-2" style={{ gridTemplateRows: '1fr 1fr' }}>
                    {CATEGORY_ORDER.map((cat, idx) => {
                        const items = groupedByCategory[cat];
                        const label = CATEGORY_LABELS[cat] || cat;
                        const hasMore = categoryHasMore[cat];
                        const denseRanks = denseRanksByCategory[cat] || {};
                        if (items.length === 0) {
                            const totalInCat = categoryTotalCounts[cat] || 0;
                            const msg = totalInCat > 0 ? 'semua kontingen belum mendapat dukungan' : 'belum ada kontingen';
                            return (
                                <ScrollReveal key={cat} delay={idx * 80}>
                                <div className="premium-card border-bronze-muted/10 p-3 flex items-center justify-center bg-deep-black/30">
                                    <span className="text-[10px] text-text-muted">{label} — {msg}</span>
                                </div>
                                </ScrollReveal>
                            );
                        }
                        return (
                            <ScrollReveal key={cat} delay={idx * 80}>
                            <div className="premium-card border-bronze-muted/10 overflow-hidden flex flex-col">
                                <div className="px-2.5 py-1.5 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10 shrink-0">
                                    <h3 className="text-[11px] font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <Trophy className="h-3 w-3 text-gold-primary" /> {label}
                                    </h3>
                                </div>
                                <div className="overflow-y-auto flex-1 scroll-smooth">
                                    <table className="w-full text-left border-collapse text-[11px]">
                                        <thead>
                                            <tr className="border-b border-bronze-muted/10 bg-deep-black/40">
                                                <th className="px-2 py-1.5 font-bold text-gold-light uppercase tracking-wider text-[9px] w-10 text-center">#</th>
                                                <th className="px-2 py-1.5 font-bold text-gold-light uppercase tracking-wider text-[9px]">Sekolah</th>
                                                <th className="px-2 py-1.5 font-bold text-gold-light uppercase tracking-wider text-[9px] text-right">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedByCategoryGroups[cat].map((group, gIdx) => {
                                                const isLastGroup = gIdx === groupedByCategoryGroups[cat].length - 1;
                                                const isTieGroup = group.length > 1;
                                                const denseRank = denseRanks[group[0].id];
                                                return (
                                                <React.Fragment key={group[0].id}>
                                                {group.map((c, itemIdx) => {
                                                    const isFirstInGroup = itemIdx === 0;
                                                    return (
                                                    <tr key={c.id} className={`${isTieGroup ? 'bg-gold-primary/5' : ''} border-b border-bronze-muted/5 hover:bg-white/[0.01] transition-colors`}>
                                                        {isFirstInGroup ? (
                                                            <td className="px-2 py-1.5 text-center relative align-middle" rowSpan={group.length}>
                                                                {isTieGroup && (
                                                                    <span className="absolute left-0 top-0 bottom-0 w-3 border-l border-t border-b border-white/20 rounded-l-sm" />
                                                                )}
                                                                <span className={`inline-flex min-w-5 w-5 h-5 px-0.5 items-center justify-center rounded-full font-black text-[10px] ${getRankBadge(denseRank - 1)}`}>
                                                                    {denseRank}
                                                                </span>
                                                            </td>
                                                        ) : null}
                                                        <td className="px-2 py-1.5">
                                                            <span className="font-bold text-white block leading-tight">{c.school_name}</span>
                                                            <span className="text-[9px] text-text-muted">{c.region}</span>
                                                        </td>
                                                        <td className="px-2 py-1.5 text-right font-extrabold text-gold-bright font-mono">{c.supporter_days} Dukungan</td>
                                                    </tr>
                                                    );
                                                })}
                                                {!isLastGroup && (
                                                    <tr className="border-0">
                                                        <td colSpan={3} className="px-2 py-0">
                                                            <div className="flex items-center gap-1.5 justify-center">
                                                                <div className="flex-1 h-px bg-emerald-500/20" />
                                                                <span className="text-[8px] font-black text-emerald-400 bg-deep-black px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">VS</span>
                                                                <div className="flex-1 h-px bg-emerald-500/20" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            </ScrollReveal>
                        );
                    })}
                    </div>

                    <div className="flex justify-center mt-1">
                        <Link href={`/events/${event.slug}/leaderboard/supporter/full`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/30 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                            Lihat Semua Kontingen &rarr;
                        </Link>
                    </div>

                    {zeroScoreContingents.length > 0 && (
                        <details className="border border-gold-primary/15 rounded bg-gold-primary/[0.04]">
                            <summary className="px-3 py-2 text-[11px] font-bold text-gold-light cursor-pointer hover:text-gold-bright transition-colors select-none flex items-center gap-1.5 list-none">
                                <span>📭</span> {zeroScoreContingents.length} kontingen belum mendapat dukungan
                            </summary>
                            <div className="divide-y divide-bronze-muted/5">
                                {Object.entries(zeroByCategory).map(([cat, catItems]) => (
                                    <div key={cat}>
                                        <div className="px-3 py-1 text-[9px] font-bold text-text-muted uppercase tracking-wider bg-deep-black/40">{CATEGORY_LABELS[cat] || cat}</div>
                                        {catItems.map(c => (
                                            <div key={c.id} className="px-3 py-1.5 flex items-center gap-3 opacity-50">
                                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full font-black text-[8px] bg-white/5 text-text-muted shrink-0">─</span>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-text-muted text-[10px]">{c.school_name}</span>
                                                    <span className="text-[8px] text-text-muted ml-1.5">{c.region}</span>
                                                </div>
                                                <span className="font-mono text-text-muted text-[10px] shrink-0">0</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            </div>
        </div>
    );
}
