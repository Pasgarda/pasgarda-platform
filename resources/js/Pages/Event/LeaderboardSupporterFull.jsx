import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Trophy, ArrowLeft, RefreshCw, Flame } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

const CATEGORY_LABELS = { U12: 'SD', U16: 'SMP', U19: 'SMA', Purna: 'Purna' };
const CATEGORY_ORDER = ['U12', 'U16', 'U19', 'Purna'];

export default function LeaderboardSupporterFull({ event, contingents }) {
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

    const groupedByCategory = {};
    const denseRanksByCategory = {};
    const groupedByCategoryGroups = {};
    for (const cat of CATEGORY_ORDER) {
        const catItems = sortedSupporter.filter(c => c.category_type === cat);
        groupedByCategory[cat] = catItems;
        const withSupport = catItems.filter(c => c.supporter_days > 0);
        const ranks = {};
        let prevScore = null;
        let currentRank = 0;
        withSupport.forEach((c, idx) => {
            if (c.supporter_days !== prevScore) {
                currentRank = idx + 1;
                prevScore = c.supporter_days;
            }
            ranks[c.id] = currentRank;
        });
        denseRanksByCategory[cat] = ranks;
        const groups = [];
        for (const c of withSupport) {
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

    const [rankChanges, setRankChanges] = useState({});
    const prevRanksRef = useRef({});
    const getRanks = useCallback((list) => {
        const sorted = [...list].sort((a, b) => (b.supporter_days || 0) - (a.supporter_days || 0));
        const ranks = {};
        let prevScore = null;
        let currentRank = 0;
        sorted.forEach((c, idx) => {
            if (c.supporter_days !== prevScore) {
                currentRank = idx + 1;
                prevScore = c.supporter_days;
            }
            ranks[c.id] = currentRank;
        });
        return ranks;
    }, []);

    const [flashIds, setFlashIds] = useState({});
    const [newContingentIds, setNewContingentIds] = useState({});
    const [changeSummary, setChangeSummary] = useState('');
    const prevCountsRef = useRef({});
    const prevContingentIdsRef = useRef({});

    useEffect(() => {
        const currentRanks = getRanks(contingents);
        const prev = prevRanksRef.current;
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
            for (const c of contingents) {
                const oldCount = prevCountsRef.current[c.id];
                if (oldCount !== undefined && oldCount !== c.supporter_days) {
                    newFlashIds[c.id] = true;
                }
            }
            if (Object.keys(newFlashIds).length > 0) {
                setFlashIds(newFlashIds);
                setTimeout(() => setFlashIds({}), 1500);
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
            const scoreChangeCount = Object.keys(newFlashIds).length;
            const newCount = Object.keys(newIds).length;
            const summaryParts = [];
            if (rankChangeCount > 0) summaryParts.push(`${rankChangeCount} perubahan ranking`);
            if (scoreChangeCount > 0) summaryParts.push(`${scoreChangeCount} skor baru`);
            if (newCount > 0) summaryParts.push(`${newCount} kontingen baru`);
            if (summaryParts.length > 0) {
                setChangeSummary(summaryParts.join(', '));
                setTimeout(() => setChangeSummary(''), 4000);
            }
        }
        prevRanksRef.current = currentRanks;
        prevCountsRef.current = Object.fromEntries(contingents.map(c => [c.id, c.supporter_days]));
        prevContingentIdsRef.current = Object.fromEntries(contingents.map(c => [c.id, true]));
    }, [contingents]);

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-4 font-sans">
            <Head title="Best Supporter - Full Leaderboard" />
            <div className="max-w-6xl mx-auto space-y-6">
                <ScrollReveal>
                <div className="flex items-center justify-between gap-3 border-b border-bronze-muted/20 pb-3">
                    <div className="flex items-center gap-3">
                        <Link href={`/events/${event.slug}/leaderboard/supporter`} className="text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider">
                            <ArrowLeft className="h-4 w-4 inline" /> Kembali
                        </Link>
                        <h1 className="text-xl font-extrabold text-white">
                            Best <span className="text-gold-primary">Supporter</span>
                            <span className="text-text-muted text-sm font-medium ml-2">Full Ranking</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-1.5">
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

                {changeSummary && (
                    <div className="p-2 bg-gold-primary/10 border border-gold-primary/30 text-gold-light text-[11px] font-bold rounded flex items-center gap-2 animate-fade-in">
                        <span>📊</span><span>{changeSummary}</span>
                    </div>
                )}

                {CATEGORY_ORDER.map(cat => {
                    const items = groupedByCategory[cat];
                    const label = CATEGORY_LABELS[cat] || cat;
                    const itemsWithSupport = items.filter(c => c.supporter_days > 0);
                    const itemsWithoutSupport = items.filter(c => c.supporter_days === 0);
                    if (items.length === 0) return null;
                    return (
                        <div key={cat} id={cat} className="premium-card border-bronze-muted/10 overflow-hidden">
                            <div className="px-4 py-2 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <Trophy className="h-3.5 w-3.5 text-gold-primary" /> {label}
                                    <span className="text-text-muted text-[10px] font-medium ml-2">{items.length} kontingen</span>
                                </h3>
                            </div>
                            {itemsWithSupport.length > 0 && (
                            <div className="overflow-x-auto scroll-smooth">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-bronze-muted/10 bg-deep-black/40">
                                            <th className="px-3 py-2 font-bold text-gold-light uppercase tracking-wider text-[10px] w-12 text-center">Rank</th>
                                            <th className="px-3 py-2 font-bold text-gold-light uppercase tracking-wider text-[10px]">Kontingen Sekolah</th>
                                            <th className="px-3 py-2 font-bold text-gold-light uppercase tracking-wider text-[10px] text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bronze-muted/5">
                                        {groupedByCategoryGroups[cat].map((group, gIdx) => {
                                            const isLastGroup = gIdx === groupedByCategoryGroups[cat].length - 1;
                                            const isTieGroup = group.length > 1;
                                            const denseRank = denseRanksByCategory[cat][group[0].id];
                                            return (
                                            <React.Fragment key={group[0].id}>
                                            {group.map((c, itemIdx) => {
                                                const isFirstInGroup = itemIdx === 0;
                                                const change = rankChanges[c.id];
                                                const changeClass = change === 'up' ? 'rank-up-anim' : change === 'down' ? 'rank-down-anim' : '';
                                                const arrowClass = change === 'up' ? 'arrow-up-anim' : change === 'down' ? 'arrow-down-anim' : '';
                                                return (
                                                <ScrollReveal key={c.id} delay={itemIdx * 80}>
                                                <tr className={`${changeClass} ${isTieGroup ? 'bg-gold-primary/5' : ''} hover:bg-white/[0.01] transition-colors`}>
                                                    {isFirstInGroup ? (
                                                        <td className="px-3 py-2 text-center relative align-middle" rowSpan={group.length}>
                                                            {isTieGroup && (
                                                                <span className="absolute left-0 top-0 bottom-0 w-3 border-l border-t border-b border-white/20 rounded-l-sm" />
                                                            )}
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className={`inline-flex min-w-6 w-6 h-6 px-0.5 items-center justify-center rounded-full font-black text-xs ${getRankBadge(denseRank - 1)}`}>
                                                                    {denseRank}
                                                                </span>
                                                                {change && isFirstInGroup && (
                                                                    <span className={`text-sm font-black ${arrowClass} ${change === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                        {change === 'up' ? '↑' : '↓'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    ) : null}
                                                    <td className="px-3 py-2">
                                                        <span className="font-bold text-white">{c.school_name}</span>
                                                        {change && !isFirstInGroup && (
                                                            <span className={`text-[10px] font-black ml-1 ${arrowClass} ${change === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {change === 'up' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                        {newContingentIds[c.id] && <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/30 uppercase ml-1">NEW</span>}
                                                        <span className="text-[10px] text-text-muted ml-2">{c.region}</span>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <span className={`font-extrabold text-gold-bright font-mono text-sm ${flashIds[c.id] ? 'vote-flash-anim' : ''}`}>
                                                            {c.supporter_days} Dukungan
                                                        </span>
                                                    </td>
                                                </tr>
                                                </ScrollReveal>
                                                );
                                            })}
                                            {!isLastGroup && (
                                                <tr className="border-0">
                                                    <td colSpan={3} className="px-3 py-0">
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
                            )}
                            {itemsWithoutSupport.length > 0 && (
                                <details className="border-t border-gold-primary/15 bg-gold-primary/[0.04]">
                                    <summary className="px-3 py-1.5 text-[10px] font-bold text-gold-light cursor-pointer hover:text-gold-bright transition-colors select-none flex items-center gap-1">
                                        <span>▶</span> {itemsWithoutSupport.length} kontingen belum mendapat dukungan
                                    </summary>
                                    <div className="overflow-x-auto scroll-smooth">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <tbody className="divide-y divide-bronze-muted/5">
                                                {itemsWithoutSupport.map((c, i) => (
                                                    <ScrollReveal key={c.id} delay={i * 80}>
                                                    <tr className="opacity-40 hover:bg-white/[0.01] transition-colors">
                                                        <td className="px-3 py-1.5 text-center">
                                                            <span className="inline-flex min-w-6 w-6 h-6 px-0.5 items-center justify-center rounded-full font-black text-xs bg-white/5 text-text-muted">─</span>
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <span className="font-bold text-text-muted">{c.school_name}</span>
                                                            <span className="text-[10px] text-text-muted ml-2">{c.region}</span>
                                                        </td>
                                                        <td className="px-3 py-1.5 text-right">
                                                            <span className="font-mono text-text-muted text-sm">0 Dukungan</span>
                                                        </td>
                                                    </tr>
                                                    </ScrollReveal>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
