import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Trophy, Award, Info, ArrowUp, RefreshCw } from 'lucide-react';
import { calculateChampions } from '../Utils/champions';
import ScrollReveal from './ScrollReveal';

const TABS = [
    { key: 'kontingen', label: 'Kontingen Terbaik' },
    { key: 'peserta', label: 'Peserta Terfavorit' },
    { key: 'kreator', label: 'Kreator Terfavorit' },
    { key: 'supporter', label: 'Supporter Terbaik' },
    { key: 'sponsor', label: 'Sponsor Terbaik' },
    { key: 'final', label: 'The Final' },
    { key: 'juara', label: 'Daftar Juara' },
];

const CATEGORIES = ['U12', 'U16', 'U19', 'Purna'];
const CATEGORY_LABELS = { U12: 'SD', U16: 'SMP', U19: 'SMA', Purna: 'Purna' };
const CYCLE_INTERVAL = 5000;

export default function LiveLeaderboard({ eventSlug, leaderboardStatus = 'draft', finalTabStatus = 'show' }) {
    const [teams, setTeams] = useState([]);
    const [activeTab, setActiveTab] = useState('kontingen');
    const [activeCategory, setActiveCategory] = useState('U12');
    const [mounted, setMounted] = useState(false);
    const [totalInput, setTotalInput] = useState(0);
    const [isCycling, setIsCycling] = useState(true);
    const [progress, setProgress] = useState(0);
    const [pendingUpdates, setPendingUpdates] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [justRefreshed, setJustRefreshed] = useState(false);
    const intervalRef = useRef(null);
    const cycleRef = useRef(null);
    const lastSyncRef = useRef(null);

    const visibleTabs = useMemo(() => {
        const noFinalCategories = ['U12', 'Purna'];
        let visible = TABS;
        if (leaderboardStatus === 'draft') {
            visible = visible.filter(t => t.key !== 'juara');
        }
        if (finalTabStatus === 'hidden') {
            visible = visible.filter(t => t.key !== 'final');
        } else if (noFinalCategories.includes(activeCategory)) {
            visible = visible.filter(t => t.key !== 'final');
        }
        return visible;
    }, [leaderboardStatus, activeCategory, finalTabStatus]);
    const progressRef = useRef(null);
    const prevTeamsRef = useRef([]);

    const getTimeAgo = (isoString) => {
        if (!isoString) return null;
        const diff = Date.now() - new Date(isoString).getTime();
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60) return 'baru saja';
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m lalu`;
    };

    const computeActivity = (current, prev) => {
        if (!prev) return null;
        const delta = {
            votes: current.votes - prev.votes,
            supporters: current.supporters - prev.supporters,
            merch: current.merch - prev.merch,
            reels_likes: (current.reels_likes || 0) - (prev.reels_likes || 0),
            posts_likes: (current.posts_likes || 0) - (prev.posts_likes || 0),
        };
        const hasChange = Object.values(delta).some(d => d > 0);
        if (!hasChange) return null;
        const totalDelta = Object.values(delta).reduce((a, b) => a + b, 0);
        return {
            delta: totalDelta,
            timeAgo: getTimeAgo(current.last_activity_at),
        };
    };

    const fetchData = useCallback(async (isManual = false) => {
        try {
            const res = await axios.get(`/api/events/${eventSlug}/live-counts`);
            const rawTeams = res.data;
            const prev = prevTeamsRef.current;
            const enriched = rawTeams.map(t => ({ ...t, recentActivity: computeActivity(t, prev.find(p => p.id === t.id)) }));
            setTeams(enriched);

            // Count new updates since last manual refresh
            if (lastSyncRef.current) {
                let newCount = 0;
                rawTeams.forEach(t => {
                    const sync = lastSyncRef.current.find(p => p.id === t.id);
                    if (sync && (
                        t.votes > sync.votes ||
                        t.supporters > sync.supporters ||
                        t.merch > sync.merch ||
                        (t.reels_likes || 0) > (sync.reels_likes || 0) ||
                        (t.posts_likes || 0) > (sync.posts_likes || 0)
                    )) newCount++;
                });
                if (newCount > 0) setPendingUpdates(prev => prev + newCount);
            } else {
                // Initialize baseline on first fetch
                lastSyncRef.current = rawTeams;
            }

            prevTeamsRef.current = rawTeams;

            if (isManual) {
                lastSyncRef.current = rawTeams;
                setPendingUpdates(0);
                setIsRefreshing(false);
                setJustRefreshed(true);
                setTimeout(() => setJustRefreshed(false), 1000);
            }

            const scored = rawTeams.filter(t => t.score_total > 0 || t.votes > 0).length;
            setTotalInput(prevMax => Math.max(prevMax, scored));
            if (!mounted) setMounted(true);
        } catch (e) {
            if (isManual) setIsRefreshing(false);
        }
    }, [eventSlug, mounted]);

    useEffect(() => {
        fetchData();
        intervalRef.current = setInterval(() => fetchData(), 10000);
        return () => clearInterval(intervalRef.current);
    }, [fetchData]);

    const handleManualRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchData(true);
    }, [fetchData]);

    const handleTabChange = useCallback((key) => {
        setActiveTab(key);
        setIsCycling(false);
        clearInterval(cycleRef.current);
        clearInterval(progressRef.current);
        setProgress(0);
    }, []);

    useEffect(() => {
        const noFinalCategories = ['U12', 'Purna'];
        const hiddenTabs = [];
        if (leaderboardStatus === 'draft') hiddenTabs.push('juara');
        if (finalTabStatus === 'hidden') {
            hiddenTabs.push('final');
        } else if (noFinalCategories.includes(activeCategory)) {
            hiddenTabs.push('final');
        }
        if (hiddenTabs.includes(activeTab)) {
            setActiveTab('kontingen');
        }
    }, [leaderboardStatus, activeCategory, activeTab, finalTabStatus]);

    useEffect(() => {
        if (!isCycling) return;
        const tick = () => {
            setActiveTab(prev => {
                const idx = visibleTabs.findIndex(t => t.key === prev);
                return visibleTabs[(idx + 1) % visibleTabs.length].key;
            });
            setProgress(0);
        };
        const prog = () => {
            setProgress(p => Math.min(p + 100 / (CYCLE_INTERVAL / 100), 100));
        };
        cycleRef.current = setInterval(tick, CYCLE_INTERVAL);
        progressRef.current = setInterval(prog, 100);
        return () => {
            clearInterval(cycleRef.current);
            clearInterval(progressRef.current);
        };
    }, [isCycling]);

    const filtered = teams.filter(t => t.category_type === activeCategory);

    const championsData = useMemo(() => {
        if (!teams.length) return null;
        const allFinalRounds = teams.flatMap(t => t.final_round_scores || []);
            const enriched = teams.map(t => ({
                ...t,
                id: t.id,
                school_name: t.school_name,
                region: t.region,
                category_type: t.category_type,
                logo_path: t.logo_path,
                is_reguler: t.is_reguler,
                coach_name: t.coach_name || '',
            score: {
                pbb_score: t.score_pbb,
                danton_score: t.score_danton,
                vafor_score: t.score_vafor,
                variasi_score: t.score_variasi,
                formasi_score: t.score_formasi,
                danton_vafor_score: t.score_danton_vafor,
                kostum_score: t.score_kostum,
                kostum_penalty: t.kostum_penalty,
                makeup_score: t.score_makeup,
                penalties_score: t.score_penalty,
                nilai_kontingen_bonus: t.nilai_kontingen_bonus,
                grand_total: t.score_total,
            },
            votes_count: t.votes,
            supporter_days: t.supporters,
            merch_qty: t.merch,
            vote_last_at: t.vote_last_at,
            merch_last_at: t.merch_last_at,
            supporter_last_at: t.supporter_last_at,
            reels_likes: t.reels_likes,
            posts_likes: t.posts_likes,
            social_updated_at: t.social_updated_at,
        }));
        return { enriched, allFinalRounds };
    }, [teams]);

    const getSorted = () => {
        const list = [...filtered];
        switch (activeTab) {
            case 'kontingen':
                return list.sort((a, b) => b.votes - a.votes);
            case 'peserta':
                return list.sort((a, b) => (b.posts_likes || 0) - (a.posts_likes || 0));
            case 'kreator':
                return list.sort((a, b) => (b.reels_likes || 0) - (a.reels_likes || 0));
            case 'supporter':
                return list.sort((a, b) => b.supporters - a.supporters);
            case 'sponsor':
                return list.sort((a, b) => b.merch - a.merch);
            case 'final':
                return list.sort((a, b) => b.final_score - a.final_score).slice(0, 2);
            case 'juara':
                return list.sort((a, b) => b.score_total - a.score_total).slice(0, 3);
            default:
                return list;
        }
    };

    const sorted = getSorted();

    const showFinalRank = activeTab !== 'final' || (sorted.length === 2 && sorted[0].final_score > 0 && sorted[1].final_score > 0);

    const maxValue = sorted.length > 0
        ? Math.max(...sorted.map(t => {
            switch (activeTab) {
                case 'kontingen': return t.votes;
                case 'peserta': return t.posts_likes || 0;
                case 'kreator': return t.reels_likes || 0;
                case 'supporter': return t.supporters;
                case 'sponsor': return t.merch;
                case 'final': return t.final_score;
                case 'juara': return t.score_total;
                default: return 0;
            }
        }), 1)
        : 1;

    const getValue = (t) => {
        switch (activeTab) {
            case 'kontingen': return t.votes;
            case 'peserta': return t.posts_likes || 0;
            case 'kreator': return t.reels_likes || 0;
            case 'supporter': return t.supporters;
            case 'sponsor': return t.merch;
            case 'final': return t.final_score;
            case 'juara': return t.score_total;
            default: return 0;
        }
    };

    const formatValue = (v, tab) => {
        if (tab === 'kontingen') return v + ' Suara';
        if (tab === 'final') return v.toFixed(1) + ' Pts';
        if (tab === 'peserta' || tab === 'kreator') return v + ' Likes';
        if (tab === 'sponsor') return v + ' Poin';
        return v + ' Suara';
    };

    const { brackets, awards } = useMemo(() => {
        if (!championsData || activeTab !== 'juara') return { brackets: [], awards: [] };
        const result = calculateChampions(activeCategory, championsData.enriched, null, championsData.allFinalRounds);
        return result;
    }, [championsData, activeCategory, activeTab]);

    const championBracket = brackets.find(b => b.name === 'Juara Umum Garda');
    const finalistBrackets = brackets.filter(b => b.isFinal);
    const regularBrackets = brackets.filter(b => b.name !== 'Juara Umum Garda' && !b.isFinal);

    const isFinalRound = activeCategory === 'U16' || activeCategory === 'U19';

    return (
        <div id="leaderboard-section" className="w-full scroll-mt-20">
            <ScrollReveal>
                <div className="card p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-row justify-between items-center gap-2 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="live-badge shrink-0">PASGARDA Quickcount</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className={`relative p-1.5 rounded transition-all duration-300 disabled:opacity-50 ${
                                justRefreshed
                                    ? 'text-emerald-400 scale-110'
                                    : 'text-text-muted hover:text-gold-light hover:bg-white/5'
                            }`}
                            title="Refresh data"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {justRefreshed && (
                                <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30" />
                            )}
                            {pendingUpdates > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full px-1 shadow-lg">
                                    {pendingUpdates > 99 ? '99+' : pendingUpdates}
                                </span>
                            )}
                        </button>
                        <span className="stat-badge shrink-0 text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                            LIVE
                        </span>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-1 sm:gap-2 mb-4 overflow-x-auto scroll-smooth">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`text-label px-2.5 sm:px-3 py-1.5 transition-all border-b-2 whitespace-nowrap ${
                                activeCategory === cat
                                    ? 'text-[var(--color-gold-light)] border-[var(--color-gold-primary)]'
                                    : 'text-[rgba(242,237,214,0.4)] border-transparent hover:text-[var(--color-text-primary)]'
                            }`}
                        >
                            {CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                </div>

                {/* Auto-cycle progress bar */}
                {isCycling && (
                    <div className="h-[2px] bg-[rgba(200,147,10,0.15)] rounded-full mb-1 overflow-hidden">
                        <div className="h-full bg-gold-primary/60 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }} />
                    </div>
                )}

                {/* Main Tab Navigation */}
                <div className="flex gap-1 sm:gap-2 mb-4 overflow-x-auto scroll-smooth">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`text-label px-2 sm:px-3 py-1.5 transition-all border-b-2 whitespace-nowrap ${
                                activeTab === tab.key
                                    ? 'text-[var(--color-gold-light)] border-[var(--color-gold-primary)]'
                                    : 'text-[rgba(242,237,214,0.4)] border-transparent hover:text-[var(--color-text-primary)]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Leaderboard Content */}
                {activeTab !== 'juara' ? (
                    <div className="space-y-3">
                        {sorted.length === 0 && (
                            <div className="text-center py-16 text-[var(--color-text-muted)] text-sm animate-fade-in">
                                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-label">{activeTab === 'final' ? 'Belum ditentukan finalisnya' : 'Belum ada data untuk kategori ini'}</p>
                            </div>
                        )}
                        {sorted.map((team, i) => {
                            const value = getValue(team);
                            const barWidth = mounted ? (value / maxValue) * 100 : 0;
                            const isTop3 = i < 3;
                            const rankColors = ['#C8930A', '#94a3b8', '#cd7f32'];
                            const rankColor = isTop3 ? rankColors[i] : 'var(--color-text-muted)';
                            const rowClass = i === 0 ? 'rank-1' : '';

                            return (
                                <div key={team.id} className={`${rowClass} card p-3 sm:p-5`}>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                                        {(activeTab !== 'final' || showFinalRank) && (
                                            <span
                                                className="font-data font-black text-sm min-w-[26px] sm:min-w-[32px]"
                                                style={{ color: rankColor }}
                                            >
                                                {activeTab === 'juara' && isTop3 ? (
                                                    ['🥇', '🥈', '🥉'][i]
                                                ) : (
                                                    `#${i + 1}`
                                                )}
                                            </span>
                                        )}
                                        {activeTab === 'final' && i < 2 && (
                                            <span className="stat-badge text-[10px] py-0.5 px-2">
                                                Finalis
                                            </span>
                                        )}
                                        <span className="text-[11px] font-medium text-[rgba(242,237,214,0.4)] tracking-wider uppercase bg-[rgba(92,26,26,0.15)] px-2 py-0.5 rounded border border-[rgba(200,147,10,0.1)]">
                                            {team.region}
                                        </span>
                                        <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] flex-1 truncate min-w-0 flex items-center gap-2">
                                            {team.logo_path && (
                                                <img src={team.logo_path} alt="" className="h-6 w-6 rounded-full object-cover border border-white/10 shrink-0 hidden sm:inline-block" />
                                            )}
                                            {team.school_name}
                                        </span>
                                        {team.recentActivity && (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                                <ArrowUp className="h-3 w-3 text-emerald-400" />
                                                +{team.recentActivity.delta}
                                                {team.recentActivity.timeAgo && (
                                                    <span className="text-emerald-400/60 font-normal hidden sm:inline">· {team.recentActivity.timeAgo}</span>
                                                )}
                                            </span>
                                        )}
                                        <span className="font-data text-[11px] sm:text-sm font-bold w-full sm:w-auto text-right sm:text-left" style={{ color: rankColor !== 'var(--color-text-muted)' ? rankColor : 'var(--color-gold-light)' }}>
                                            {formatValue(value, activeTab)}
                                        </span>
                                    </div>
                                    <div className="h-[6px] rounded-[3px] bg-[rgba(28,28,28,0.5)] overflow-hidden">
                                        <div
                                            className="vote-bar-fill h-full rounded-[3px]"
                                            style={{
                                                width: `${barWidth}%`,
                                                transition: mounted ? 'width 1s ease-out' : 'none',
                                            }}
                                        />
                                    </div>
                                    {(activeTab === 'kontingen') && (
                                        <div className="flex gap-4 mt-2 text-[11px] text-[var(--color-text-muted)]">
                                            <span>Suara: {team.votes}</span>
                                            <span>Dukung: {team.supporters}</span>
                                        </div>
                                    )}
                                    {(activeTab === 'juara') && (
                                        <div className="flex gap-4 mt-2 text-[11px] text-[var(--color-text-muted)]">
                                            <span>PBB: {team.score_pbb.toFixed(1)}</span>
                                            <span>Danton: {team.score_danton.toFixed(1)}</span>
                                            <span>Vafor: {team.score_vafor.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* Champion Card */}
                        <ScrollReveal>
                        {championBracket && championBracket.team && (
                            <div className="premium-card border border-gold-primary/30 overflow-hidden">
                                <div className="bg-gradient-to-r from-gold-primary/10 via-gold-bright/5 to-transparent p-4 border-b border-gold-primary/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Trophy className="h-6 w-6 text-gold-primary" />
                                        <h3 className="font-bold text-white text-sm">Juara Umum Garda</h3>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {championBracket.team.logo_path && (
                                                <img src={championBracket.team.logo_path} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-gold-primary/30" />
                                            )}
                                            <div>
                                                <h4 className="text-lg font-extrabold text-white">{championBracket.team.school_name}</h4>
                                                <p className="text-xs text-text-muted">{championBracket.team.region}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] text-text-muted uppercase tracking-wider">Nilai</div>
                                            <div className="text-2xl font-black text-gold-bright">{Math.round(championBracket.championScore)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                                    {[{label:'PBB', v: isFinalRound ? championBracket.team.finalPbb : championBracket.team.pbb},
                                      {label:'Danton', v: isFinalRound ? championBracket.team.finalDanton : championBracket.team.danton},
                                      {label:'Vafor', v: isFinalRound ? championBracket.team.finalVafor : championBracket.team.vafor},
                                      {label:'Kostum', v: championBracket.team.kostumNet},
                                      {label:'Makeup', v: championBracket.team.makeup},
                                      {label:'Penalti', v: championBracket.team.penalties},
                                    ].map(d => (
                                        <div key={d.label} className={`bg-deep-black/40 rounded p-2 border text-center ${d.label === 'Penalti' ? 'border-red-500/20' : 'border-bronze-muted/10'}`}>
                                            <div className="text-[9px] text-text-muted uppercase tracking-wider">{d.label}</div>
                                            <div className={`text-base font-bold font-mono ${d.label === 'Penalti' ? 'text-red-400' : 'text-white'}`}>{d.label === 'Penalti' ? `-${Math.round(d.v)}` : Math.round(d.v)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        </ScrollReveal>

                        {/* Finalist Brackets */}
                        {finalistBrackets.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {finalistBrackets.map((item, idx) => {
                                    const team = item.team;
                                    if (!team) return null;
                                    return (
                                        <div key={idx} className={`premium-card border overflow-hidden ${idx === 0 ? 'border-gold-primary/30' : 'border-bronze-muted/20'}`}>
                                            <div className={`p-3 border-b ${idx === 0 ? 'bg-gradient-to-r from-gold-primary/10 to-transparent border-gold-primary/20' : 'bg-white/5 border-bronze-muted/10'}`}>
                                                <h4 className="font-bold text-sm text-white">{idx === 0 ? 'Juara Grand Final 1' : 'Juara Grand Final 2'}</h4>
                                                <div className="flex items-center gap-2">
                                                    {team.logo_path && (
                                                        <img src={team.logo_path} alt="" className="h-8 w-8 rounded-full object-cover border border-white/10" />
                                                    )}
                                                    <p className="font-extrabold text-white">{team.school_name}</p>
                                                </div>
                                            </div>
                                            <div className="p-3 space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[9px] text-text-muted uppercase">Skor Final</span>
                                                    <span className="text-xl font-black text-gold-bright">{Math.round(team.finalTotal)}</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1 text-[10px]">
                                                    <div className="bg-deep-black/40 rounded p-1.5 text-center">
                                                        <div className="text-[8px] text-text-muted">PBB</div>
                                                        <div className="font-bold font-mono">{Math.round(team.finalPbb)}</div>
                                                    </div>
                                                    <div className="bg-deep-black/40 rounded p-1.5 text-center">
                                                        <div className="text-[8px] text-text-muted">Danton</div>
                                                        <div className="font-bold font-mono">{Math.round(team.finalDanton)}</div>
                                                    </div>
                                                    <div className="bg-deep-black/40 rounded p-1.5 text-center">
                                                        <div className="text-[8px] text-text-muted">Vafor</div>
                                                        <div className="font-bold font-mono">{Math.round(team.finalVafor)}</div>
                                                    </div>
                                                    <div className="bg-deep-black/40 rounded p-1.5 text-center border border-red-500/20">
                                                        <div className="text-[8px] text-red-400">Penalti</div>
                                                        <div className="font-bold text-red-400 font-mono">-{Math.round(team.finalPenalties)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Bracket Ranking Table */}
                        <ScrollReveal>
                            <div className="premium-card overflow-hidden border border-gold-primary/20">
                            <div className="p-3 bg-gold-primary/5 border-b border-gold-primary/20">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-gold-primary" /> Papan Juara Peringkat ({CATEGORY_LABELS[activeCategory]})
                                </h3>
                            </div>
                            <div className="overflow-x-auto text-xs scroll-smooth">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-bronze-muted/20 bg-deep-black/60 text-[9px] uppercase tracking-wider text-text-muted">
                                            <th className="p-2">Bracket</th>
                                            <th className="p-2">Sekolah</th>
                                            <th className="p-2 text-center">Total</th>
                                            <th className="p-2 text-center">PBB</th>
                                            <th className="p-2 text-center">Danton</th>
                                            <th className="p-2 text-center">Vafor</th>
                                            <th className="p-2 text-center">Pinalti</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                        {regularBrackets.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-6 text-center text-text-muted italic animate-fade-in">Belum ada data juara untuk kategori ini.</td>
                                            </tr>
                                        )}
                                        {regularBrackets.map((item, idx) => {
                                            const hasTeam = !!item.team;
                                            return (
                                                <tr key={idx} className="hover:bg-white/[0.01]">
                                                    <td className="p-2 font-bold text-gold-cream whitespace-nowrap">{item.name}</td>
                                                    <td className="p-2">
                                                        {hasTeam ? (
                                                            <div className="flex items-center gap-2">
                                                                {item.team.logo_path && (
                                                                    <img src={item.team.logo_path} alt="" className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0" />
                                                                )}
                                                                <div>
                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                        <span className="font-semibold text-white text-[11px]">{item.team.school_name}</span>
                                                                        {Array.isArray(item.kejurnasIds) && item.kejurnasIds.includes(item.team.id) && (
                                                                            <span className="px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black tracking-wide">🎟️ Tiket Kejurnas</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[10px] text-text-muted">{item.team.region}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-text-muted italic">Belum ditentukan</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-center font-extrabold text-gold-bright text-sm font-mono">
                                                        {hasTeam ? Math.round(item.team.juaraScore) : '-'}
                                                    </td>
                                                    <td className="p-2 text-center font-mono text-text-muted">
                                                        {hasTeam ? Math.round(item.team.pbb) : '-'}
                                                    </td>
                                                    <td className="p-2 text-center font-mono text-text-muted">
                                                        {hasTeam ? Math.round(item.team.danton) : '-'}
                                                    </td>
                                                    <td className="p-2 text-center font-mono text-text-muted">
                                                        {hasTeam ? Math.round(item.team.vafor) : '-'}
                                                    </td>
                                                    <td className="p-2 text-center font-mono text-accent-mahogany font-bold">
                                                        {hasTeam ? (item.team.penalties > 0 ? `-${Math.round(item.team.penalties)}` : '0') : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            </div>
                        </ScrollReveal>

                        {/* Awards Table */}
                        <ScrollReveal>
                            <div className="premium-card overflow-hidden border border-bronze-muted/20">
                            <div className="p-3 bg-white/5 border-b border-bronze-muted/10">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <Award className="h-4 w-4 text-gold-primary" /> Penghargaan Kategori
                                </h3>
                            </div>
                            <div className="overflow-x-auto text-xs scroll-smooth">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-bronze-muted/20 bg-deep-black/60 text-[9px] uppercase tracking-wider text-text-muted">
                                            <th className="p-2">Penghargaan</th>
                                            <th className="p-2">Kontingen</th>
                                            <th className="p-2">Penerima</th>
                                            <th className="p-2 text-right">Skor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                        {awards.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-6 text-center text-text-muted italic animate-fade-in">Belum ada penghargaan untuk kategori ini.</td>
                                            </tr>
                                        ) : awards.map((award, idx) => {
                                            const hasTeam = !!award.team;
                                            let metricLabel = award.metricLabel || 'Poin';
                                            if (!award.metricLabel) {
                                                if (award.name.includes('PBB')) metricLabel = 'Skor PBB';
                                                if (award.name.includes('Variasi dan Formasi')) metricLabel = 'Skor Vafor';
                                                if (award.name.includes('Danton')) metricLabel = 'Skor Danton';
                                                if (award.name.includes('Pelatih')) metricLabel = 'Skor Utama';
                                                if (award.name.includes('Kostum')) metricLabel = 'Skor Kostum';
                                                if (award.name.includes('Make Up')) metricLabel = 'Skor Makeup';
                                            }
                                            return (
                                                <tr key={idx} className="hover:bg-white/[0.01]">
                                                    <td className="p-2 font-semibold text-white">{award.name}</td>
                                                    <td className="p-2">
                                                        {hasTeam ? (
                                                            <div className="flex items-center gap-2">
                                                                {award.team.logo_path && (
                                                                    <img src={award.team.logo_path} alt="" className="h-6 w-6 rounded-full object-cover border border-white/10 shrink-0" />
                                                                )}
                                                                <span className="font-bold text-gold-light text-[11px]">{award.team.school_name}</span>
                                                            </div>
                                                        ) : <span className="text-text-muted italic">-</span>}
                                                    </td>
                                                    <td className="p-2 text-text-muted">
                                                        {hasTeam ? (award.isCoach ? <span className="text-white font-medium">{award.team.coach_name}</span> : 'Tim Pasukan') : '-'}
                                                    </td>
                                                    <td className="p-2 text-right font-extrabold text-gold-bright font-mono">
                                                        {hasTeam ? `${Math.round(award.val)} ${metricLabel}` : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            </div>
                        </ScrollReveal>
                    </div>
                )}
                </div>
            </ScrollReveal>
        </div>
    );
}
