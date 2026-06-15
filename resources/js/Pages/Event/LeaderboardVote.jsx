import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Trophy, RefreshCw, Star } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

const CATEGORY_LABELS = { U12: 'SD', U16: 'SMP', U19: 'SMA', Purna: 'Purna' };
const CATEGORY_ORDER = ['U12', 'U16', 'U19', 'Purna'];
const BONUS_TIERS = [
  { rank: 1, bonus: '+1.0%' },
  { rank: 2, bonus: '+0.8%' },
  { rank: 3, bonus: '+0.6%' },
  { rank: 4, bonus: '+0.4%' },
  { rank: 5, bonus: '+0.3%' },
  { rank: 6, bonus: '+0.2%' },
  { rank: 7, bonus: '+0.1%' },
];
const TOP_N = 7;

export default function LeaderboardVote({ event, contingents }) {
    const voteStopped = event.voting_status === 'stopped';
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

    const [rankChanges, setRankChanges] = useState({});
    const prevVoteRanksRef = useRef({});
    const getVoteRanks = useCallback((list) => {
        const sorted = [...list].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
        const ranks = {};
        let prevVotes = null;
        let currentRank = 0;
        sorted.forEach((c, idx) => {
            if (c.votes_count !== prevVotes) {
                currentRank = idx + 1;
                prevVotes = c.votes_count;
            }
            ranks[c.id] = currentRank;
        });
        return ranks;
    }, []);

    const [flashVoteIds, setFlashVoteIds] = useState({});
    const [confettiIds, setConfettiIds] = useState({});
    const [newContingentIds, setNewContingentIds] = useState({});
    const [changeSummary, setChangeSummary] = useState('');
    const prevVoteCountsRef = useRef({});
    const prevContingentIdsRef = useRef({});

    useEffect(() => {
        const currentRanks = getVoteRanks(contingents);
        const prev = prevVoteRanksRef.current;
        const hasPrevData = Object.keys(prev).length > 0;
        const changes = {};

        if (hasPrevData) {
            for (const id of Object.keys(currentRanks)) {
                const oldRank = prev[id];
                const newRank = currentRanks[id];
                if (oldRank !== undefined && oldRank !== newRank) {
                    changes[id] = newRank < oldRank ? 'up' : 'down';
                }
            }
            if (Object.keys(changes).length > 0) {
                setRankChanges(changes);
                setTimeout(() => setRankChanges({}), 3000);
            }

            const newFlashIds = {};
            const newConfettiIds = {};
            for (const c of contingents) {
                const oldCount = prevVoteCountsRef.current[c.id];
                if (oldCount !== undefined && oldCount !== c.votes_count) {
                    newFlashIds[c.id] = true;
                    newConfettiIds[c.id] = true;
                }
            }
            if (Object.keys(newFlashIds).length > 0) {
                setFlashVoteIds(newFlashIds);
                setConfettiIds(newConfettiIds);
                setTimeout(() => { setFlashVoteIds({}); setConfettiIds({}); }, 1500);
            }

            const newIds = {};
            const currentIdSet = new Set(contingents.map(c => c.id));
            for (const id of currentIdSet) {
                if (!prevContingentIdsRef.current[id]) {
                    newIds[id] = true;
                }
            }
            if (Object.keys(newIds).length > 0) {
                setNewContingentIds(newIds);
                setTimeout(() => setNewContingentIds({}), 5000);
            }

            const rankChangeCount = Object.keys(changes).length;
            const voteChangeCount = Object.keys(newFlashIds).length;
            const newCount = Object.keys(newIds).length;
            const summaryParts = [];
            if (rankChangeCount > 0) summaryParts.push(`${rankChangeCount} perubahan ranking`);
            if (voteChangeCount > 0) summaryParts.push(`${voteChangeCount} suara baru`);
            if (newCount > 0) summaryParts.push(`${newCount} kontingen baru`);
            if (summaryParts.length > 0) {
                setChangeSummary(summaryParts.join(', '));
                setTimeout(() => setChangeSummary(''), 4000);
            }
        }
        prevVoteRanksRef.current = currentRanks;
        prevVoteCountsRef.current = Object.fromEntries(contingents.map(c => [c.id, c.votes_count]));
        prevContingentIdsRef.current = Object.fromEntries(contingents.map(c => [c.id, true]));
    }, [contingents]);

    const sortedVoting = [...contingents].sort((a, b) => b.votes_count - a.votes_count);

    const denseRanksByCategory = {};
    for (const cat of CATEGORY_ORDER) {
        const catItems = sortedVoting.filter(c => c.category_type === cat);
        const ranks = {};
        let prevVotes = null;
        let currentRank = 0;
        catItems.forEach((c, idx) => {
            if (c.votes_count !== prevVotes) {
                currentRank = idx + 1;
                prevVotes = c.votes_count;
            }
            ranks[c.id] = currentRank;
        });
        denseRanksByCategory[cat] = ranks;
    }

    const groupedByCategory = {};
    for (const cat of CATEGORY_ORDER) {
        groupedByCategory[cat] = sortedVoting
            .filter(c => c.category_type === cat && c.votes_count > 0)
            .slice(0, TOP_N);
    }

    const categoryHasMore = {};
    const categoryTotalCounts = {};
    for (const cat of CATEGORY_ORDER) {
        categoryTotalCounts[cat] = sortedVoting.filter(c => c.category_type === cat).length;
        const withVotes = sortedVoting.filter(c => c.category_type === cat && c.votes_count > 0).length;
        categoryHasMore[cat] = withVotes > TOP_N;
    }

    const groupedByCategoryGroups = {};
    for (const cat of CATEGORY_ORDER) {
        const items = groupedByCategory[cat];
        const groups = [];
        for (const c of items) {
            if (groups.length === 0 || c.votes_count !== groups[groups.length - 1][0].votes_count) {
                groups.push([c]);
            } else {
                groups[groups.length - 1].push(c);
            }
        }
        groupedByCategoryGroups[cat] = groups;
    }

    const zeroScoreContingents = sortedVoting.filter(c => c.votes_count === 0);
    const zeroByCategory = {};
    for (const cat of CATEGORY_ORDER) {
        const items = zeroScoreContingents.filter(c => c.category_type === cat);
        if (items.length > 0) zeroByCategory[cat] = items;
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
            <Head title="Favorite Contingent Vote - Leaderboard" />
            <div className={`${stageMode ? 'max-w-7xl' : 'max-w-6xl'} mx-auto h-screen flex flex-col`}>
                <ScrollReveal>
                <div className="flex items-center justify-between border-b border-bronze-muted/20 pb-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href={`/events/${event.slug}`} className="text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider">
                            <ArrowLeft className="h-4 w-4 inline" /> Event
                        </Link>
                        <h1 className="text-lg font-extrabold text-white">
                            Vote <span className="text-gold-primary">Kontingen</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {!stageMode && (
                            <>
                                <a href={`/events/${event.slug}/leaderboard/vote`} className="px-2 py-1 rounded text-[10px] font-bold transition-all border bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40">Vote</a>
                                <a href={`/events/${event.slug}/leaderboard/supporter`} className="px-2 py-1 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Supporter</a>
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

                {voteStopped && (
                    <div className="mt-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded text-[11px] text-red-300 font-semibold shrink-0 flex items-center gap-2">
                        <span className="text-lg">🏁</span>
                        <span>Voting telah ditutup oleh panitia. Hasil akhir sudah ditetapkan. Bersiap untuk pengumuman pemenang.</span>
                    </div>
                )}

                {/* CTA banner */}
                <div className="mt-2 p-2.5 bg-gradient-to-r from-accent-maroon/10 to-accent-burgundy/10 border border-accent-maroon/30 rounded shrink-0 flex items-center gap-3">
                    <Star className="h-5 w-5 text-gold-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white font-bold">Ayo Dukung Kontingen Favorit!</p>
                        <p className="text-[10px] text-text-muted/80">Setiap pembelian tiket memberi kamu hak suara untuk memilih kontingen favoritmu.</p>
                    </div>
                    <Link href={`/events/${event.slug}/vote`}
                        className="px-3 py-1.5 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-extrabold text-[10px] rounded uppercase hover:brightness-110 transition-all shrink-0"
                    >
                        Vote Sekarang
                    </Link>
                </div>

                {/* Bonus info card */}
                <div className="mt-2 p-2 bg-emerald-500/5 border border-emerald-500/15 rounded text-[10px] text-text-primary/80 shrink-0 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-gold-primary shrink-0" />
                    <span>
                        <strong className="text-white">Bonus The Final:</strong> Rank 1-7 per kategori mendapat bonus persentase dari PBB + Danton untuk seleksi masuk The Final.
                    </span>
                    <div className="flex gap-1.5 ml-auto shrink-0">
                        {BONUS_TIERS.map(t => (
                            <span key={t.rank} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-emerald-400 font-bold">
                                #{t.rank} {t.bonus}
                            </span>
                        ))}
                    </div>
                </div>

                {changeSummary && (
                    <div className="mt-1 p-1.5 bg-gold-primary/10 border border-gold-primary/30 text-gold-light text-[10px] font-bold rounded flex items-center gap-1 animate-fade-in shrink-0">
                        <span>📊</span><span>{changeSummary}</span>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto mt-2 min-h-0 space-y-2 scroll-smooth">
                    <div className="grid grid-cols-2 gap-2" style={{ gridTemplateRows: '1fr 1fr' }}>
                    {CATEGORY_ORDER.map((cat, idx) => {
                        const items = groupedByCategory[cat];
                        const label = CATEGORY_LABELS[cat] || cat;
                        const hasMore = categoryHasMore[cat];
                        const denseRanks = denseRanksByCategory[cat] || {};
                        if (items.length === 0) {
                            const totalInCat = categoryTotalCounts[cat] || 0;
                            const msg = totalInCat > 0 ? 'semua kontingen belum mendapat suara' : 'belum ada kontingen';
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
                                                <th className="px-2 py-1.5 font-bold text-gold-light uppercase tracking-wider text-[9px] text-center">Suara</th>
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
                                                    const change = rankChanges[c.id];
                                                    const changeClass = change === 'up' ? 'rank-up-anim' : change === 'down' ? 'rank-down-anim' : '';
                                                    const arrowClass = change === 'up' ? 'text-emerald-400' : change === 'down' ? 'text-red-400' : '';
                                                    return (
                                                    <tr key={c.id} className={`${changeClass} ${isTieGroup ? 'bg-gold-primary/5' : ''} border-b border-bronze-muted/5 hover:bg-white/[0.01] transition-colors`}>
                                                        {isFirstInGroup ? (
                                                            <td className="px-2 py-1.5 text-center relative align-middle" rowSpan={group.length}>
                                                                {isTieGroup && (
                                                                    <span className="absolute left-0 top-0 bottom-0 w-3 border-l border-t border-b border-white/20 rounded-l-sm" />
                                                                )}
                                                                <span className={`inline-flex min-w-5 w-5 h-5 px-0.5 items-center justify-center rounded-full font-black text-[10px] ${getRankBadge(denseRank - 1)}`}>
                                                                    {denseRank}
                                                                </span>
                                                                {change && isFirstInGroup && (
                                                                    <span className={`text-[10px] font-black ml-0.5 ${arrowClass} ${change === 'up' ? 'arrow-up-anim' : 'arrow-down-anim'}`}>
                                                                        {change === 'up' ? '↑' : '↓'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        ) : null}
                                                        <td className="px-2 py-1.5">
                                                            <span className="font-bold text-white block leading-tight">
                                                                {c.school_name}
                                                                {change && !isFirstInGroup && (
                                                                    <span className={`text-[9px] font-black ml-1 ${arrowClass} ${change === 'up' ? 'arrow-up-anim' : 'arrow-down-anim'}`}>
                                                                        {change === 'up' ? '↑' : '↓'}
                                                                    </span>
                                                                )}
                                                                {newContingentIds[c.id] && <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-0.5 py-0 rounded border border-emerald-500/30 uppercase ml-1">NEW</span>}
                                                            </span>
                                                            <span className="text-[9px] text-text-muted">{c.region}</span>
                                                        </td>
                                                        <td className="px-2 py-1.5 text-center relative">
                                                            {confettiIds[c.id] && <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] sparkle-confetti">✨</span>}
                                                            <span className={`font-extrabold text-white font-mono ${flashVoteIds[c.id] ? 'vote-flash-anim' : ''}`}>
                                                                {c.votes_count}
                                                            </span>
                                                        </td>
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
                        <Link href={`/events/${event.slug}/leaderboard/vote/full`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/30 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                            Lihat Semua Kontingen &rarr;
                        </Link>
                    </div>

                    {zeroScoreContingents.length > 0 && (
                        <details className="border border-gold-primary/15 rounded bg-gold-primary/[0.04]">
                            <summary className="px-3 py-2 text-[11px] font-bold text-gold-light cursor-pointer hover:text-gold-bright transition-colors select-none flex items-center gap-1.5 list-none">
                                <span>📭</span> {zeroScoreContingents.length} kontingen belum mendapat suara
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
