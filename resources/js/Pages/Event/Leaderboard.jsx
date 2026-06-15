import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Award, BarChart3, Star, Heart, Flame, ShieldAlert, Check, HelpCircle, ArrowLeft, Trophy, ShoppingBag, EyeOff, RefreshCw, Search } from 'lucide-react';
import axios from 'axios';
import { calculateChampions } from '../../Utils/champions';
import ScrollReveal from '../../Components/ScrollReveal';

export default function Leaderboard({ event, contingents, userVoteTokens, finalRoundScores = [], auth, authContingentId = null, authRole = null }) {
    const [activeSection, setActiveSection] = useState('voting'); // voting, supporter, instagram, scoring, final
    const [votingProgress, setVotingProgress] = useState(false);
    const [voteError, setVoteError] = useState('');
    const [voteSuccess, setVoteSuccess] = useState('');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('U16');
    const [autoReload, setAutoReload] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const autoReloadRef = useRef(null);

    // Force category filter to U12, U16 or U19 when final round section is opened
    useEffect(() => {
        if (activeSection === 'final' && !['U12', 'U16', 'U19'].includes(activeCategoryFilter)) {
            setActiveCategoryFilter('U16');
        }
    }, [activeSection]);

    useEffect(() => {
        if (autoReload) {
            autoReloadRef.current = setInterval(() => {
                router.reload({ only: ['contingents', 'userVoteTokens', 'finalRoundScores'] });
            }, 10000);
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
    }, [autoReload]);

    const handleVote = async (contingentId) => {
        setVoteError('');
        setVoteSuccess('');
        setVotingProgress(true);

        try {
            const response = await axios.post(`/events/${event.slug}/vote`, {
                contingent_id: contingentId,
            });

            if (response.data.success) {
                setVoteSuccess(response.data.message);
                // Reload Inertia props to update votes count
                router.reload();
            }
        } catch (error) {
            const msg = error.response?.data?.error || 'Gagal mengirimkan vote.';
            setVoteError(msg);
        } finally {
            setVotingProgress(false);
        }
    };

    // 1. Sort Voting Rank (Favorite School)
    const sortedVoting = [...contingents].sort((a, b) => b.votes_count - a.votes_count);
    const filteredVoting = sortedVoting.filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return c.school_name?.toLowerCase().includes(q) || c.region?.toLowerCase().includes(q);
    });
    
    // 2. Sort Best Supporter Rank (Validity Days Sum)
    const sortedSupporter = [...contingents].sort((a, b) => b.supporter_days - a.supporter_days);

    // 3. Sort Instagram Likes (Manual panitia entries)
    const sortedInstagram = [...contingents].sort((a, b) => (b.reels_likes + b.posts_likes) - (a.reels_likes + a.posts_likes));

    // 4. Sort Tournament Scores (PBB + Danton + Vafor + Bonus - Penalty)
    const sortedScoring = [...contingents].sort((a, b) => {
        const scoreA = a.score?.grand_total || 0;
        const scoreB = b.score?.grand_total || 0;
        return scoreB - scoreA;
    });

    const getRankBonusLabel = (index) => {
        const bonuses = ['+1.0%', '+0.8%', '+0.6%', '+0.4%', '+0.3%', '+0.2%', '+0.1%'];
        return bonuses[index] || '0.0%';
    };

    // Sort contingents by total votes count to determine their vote rank (1st to last)
    const sortedByVotes = [...contingents].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
    const activeSortedByVotes = sortedByVotes.filter(c => c.category_type === activeCategoryFilter);

    // Get vote rank percentage and bonus calculation
    const getVotingBonusInfo = (contingentId) => {
        const contingent = contingents.find((c) => c.id === contingentId);
        if (!contingent) return { rank: 8, percentage: 0, calculatedBonus: 0 };
        
        const catVotesList = [...contingents]
            .filter((c) => c.category_type === contingent.category_type)
            .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));

        const index = catVotesList.findIndex((c) => c.id === contingentId);
        const rank = index + 1;
        const bonuses = {
            1: 0.01,
            2: 0.008,
            3: 0.006,
            4: 0.004,
            5: 0.003,
            6: 0.002,
            7: 0.001
        };
        const hasVotes = (contingent.votes_count || 0) > 0;
        const percentage = hasVotes ? (bonuses[rank] || 0) : 0;
        
        // Fetch PBB + Danton from first round score
        const pbbDantonSum = contingent.score ? (parseInt(contingent.score.pbb_score) + parseInt(contingent.score.danton_score)) : 0;
        const calculatedBonus = Math.round(pbbDantonSum * percentage);

        return { rank, percentage: percentage * 100, calculatedBonus };
    };

    // Resolve top 2 finalists based on votes count (Klasemen Best Kontingen)
    const categoryContingents = contingents.filter((c) => c.category_type === activeCategoryFilter);
    const sortedCategoryContingents = [...categoryContingents].sort((a, b) => {
        return (b.votes_count || 0) - (a.votes_count || 0);
    });

    const finalist1 = sortedCategoryContingents[0];
    const finalist2 = sortedCategoryContingents[1];

    // Final round totals for finalists
    const f1Rec = finalist1 ? finalRoundScores.find((fs) => fs.contingent_id === finalist1.id) : null;
    const f2Rec = finalist2 ? finalRoundScores.find((fs) => fs.contingent_id === finalist2.id) : null;

    const f1Total = f1Rec ? Math.round(parseInt(f1Rec.total_score)) : 0;
    const f2Total = f2Rec ? Math.round(parseInt(f2Rec.total_score)) : 0;

    // Calculate versus progress bar percentages
    const totalVersus = f1Total + f2Total;
    const barPct1 = totalVersus > 0 ? (f1Total / totalVersus) * 100 : 50;
    const barPct2 = totalVersus > 0 ? (f2Total / totalVersus) * 100 : 50;

    const bothScoresInput = finalist1 && finalist2 && f1Total > 0 && f2Total > 0;
    let winnerId = null;
    if (bothScoresInput) {
        if (f1Total > f2Total) {
            winnerId = finalist1.id;
        } else if (f2Total > f1Total) {
            winnerId = finalist2.id;
        } else {
            const frA = finalist1.score?.grand_total || 0;
            const frB = finalist2.score?.grand_total || 0;
            winnerId = frA >= frB ? finalist1.id : finalist2.id;
        }
    }

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Live Leaderboards" />

            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <Link
                            href={`/events/${event.slug}`}
                            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider mb-2"
                        >
                            <ArrowLeft className="h-4 w-4" /> Detail Event
                        </Link>
                        <h1 className="text-3xl font-extrabold text-white mt-1">
                            Live <span className="text-gold-primary">Papan Peringkat</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; GARDA 55 VOL 20</p>
                    </div>

                    {/* Section Toggles */}
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                        <button
                            onClick={() => setActiveSection('voting')}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                activeSection === 'voting'
                                    ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40'
                                    : 'bg-white/5 text-bronze-muted border-transparent hover:text-white'
                            }`}
                        >
                            Favorite Contingent (Vote)
                        </button>
                        <button
                            onClick={() => setActiveSection('supporter')}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                activeSection === 'supporter'
                                    ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40'
                                    : 'bg-white/5 text-bronze-muted border-transparent hover:text-white'
                            }`}
                        >
                            Best Supporter
                        </button>
                        <button
                            onClick={() => setActiveSection('instagram')}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                activeSection === 'instagram'
                                    ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40'
                                    : 'bg-white/5 text-bronze-muted border-transparent hover:text-white'
                            }`}
                        >
                            Instagram Likes
                        </button>
                        <button
                            onClick={() => setActiveSection('scoring')}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                activeSection === 'scoring'
                                    ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40'
                                    : 'bg-white/5 text-bronze-muted border-transparent hover:text-white'
                            }`}
                        >
                            Rekap
                        </button>
                        <button
                            onClick={() => setActiveSection('final')}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                activeSection === 'final'
                                    ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40'
                                    : 'bg-white/5 text-bronze-muted border-transparent hover:text-white'
                            }`}
                        >
                            THE FINAL
                        </button>
                        <button
                            onClick={() => setActiveSection('champions')}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                activeSection === 'champions'
                                    ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40'
                                    : 'bg-white/5 text-bronze-muted border-transparent hover:text-white'
                            }`}
                        >
                            Daftar Juara
                        </button>
                    </div>
                </div>

                {/* Status Messages */}
                {voteError && (
                    <div className="p-4 bg-accent-mahogany/15 border border-accent-mahogany/30 text-accent-mahogany text-xs font-semibold rounded flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        <span>{voteError}</span>
                    </div>
                )}

                {voteSuccess && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded flex items-center gap-2">
                        <Check className="h-5 w-5 shrink-0" />
                        <span>{voteSuccess}</span>
                    </div>
                )}

                {/* Section 1: Favorite Contingent (Voting Board) */}
                {activeSection === 'voting' && (
                    <div className="space-y-6">
                        <ScrollReveal>
                        <div className="p-5 bg-gradient-to-r from-[#2A1A0A] to-deep-black border border-gold-primary/30 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-white font-bold text-base flex items-center gap-2">
                                    <Star className="h-5 w-5 text-gold-primary" /> Vote Kontingen Terfavorit
                                </h3>
                                <p className="text-xs text-text-muted">
                                    Peringkat 1-7 voting kontingen mendapatkan nilai bonus persentase kontingen (+1.0% s.d +0.1%) pada turnamen.
                                </p>
                            </div>
                            
                            {auth.user ? (
                                <div className="text-xs shrink-0 bg-white/5 p-3 rounded border border-white/5 flex items-center gap-3">
                                    <div>
                                        <span className="text-text-muted block font-semibold uppercase">Token Voting Anda</span>
                                        <span className="text-lg font-black text-gold-bright">{userVoteTokens} Token</span>
                                    </div>
                                    {userVoteTokens > 0 ? (
                                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded font-bold uppercase">Ready</span>
                                    ) : (
                                        <Link href={`/events/${event.slug}/tickets`} className="px-2.5 py-1 bg-gold-primary text-deep-black text-[10px] rounded font-bold hover:brightness-110">Beli Tiket</Link>
                                    )}
                                </div>
                            ) : (
                                <Link href="/login" className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded font-semibold text-xs transition-all">
                                    Login untuk Vote &rarr;
                                </Link>
                            )}
                        </div>
                        </ScrollReveal>

                        {/* Search bar + Auto-reload toggle */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Cari sekolah atau kontingen..."
                                    className="w-full bg-deep-black/60 border border-bronze-muted/20 rounded pl-8 pr-3 py-2 text-xs text-white placeholder:text-text-muted/50 focus:outline-none focus:border-gold-primary/40 transition-colors"
                                />
                            </div>
                            <button
                                onClick={() => setAutoReload(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded text-[10px] font-bold uppercase transition-all ${
                                    autoReload
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-white/5 text-text-muted border border-white/5 hover:border-white/20'
                                }`}
                                title={autoReload ? 'Auto-reload aktif (10 detik)' : 'Aktifkan auto-reload'}
                            >
                                <RefreshCw className={`h-3 w-3 ${autoReload ? 'animate-spin' : ''}`} />
                                Auto
                            </button>
                        </div>

                        <div className="premium-card border-bronze-muted/10 overflow-hidden text-xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] w-16 text-center">Rank</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px]">Kontingen Sekolah</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-center">Bonus PBB + Danton</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-center">Total Suara</th>
                                        {auth.user && userVoteTokens > 0 && (
                                            <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-right">Aksi</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bronze-muted/10">
                                    {filteredVoting.map((c, idx) => {
                                        const isTop3 = idx < 3;
                                        return (
                                            <ScrollReveal key={c.id} delay={idx * 80}>
                                            <tr className={`${searchQuery ? 'highlight-gold-pulse' : ''} hover:bg-white/[0.01] transition-colors`}>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-black text-xs ${
                                                        idx === 0 ? 'bg-gold-primary text-deep-black' :
                                                        idx === 1 ? 'bg-slate-300 text-deep-black' :
                                                        idx === 2 ? 'bg-[#CD7F32] text-white' :
                                                        'bg-white/5 text-text-primary'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-extrabold text-sm text-white block">{c.school_name}{c.is_reguler ? ' *reguler' : ''}</span>
                                                    <span className="text-[10px] text-text-muted uppercase font-medium">{c.region} &bull; {c.category_type}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        idx < 7 
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                            : 'bg-white/5 text-text-muted border border-white/5'
                                                    }`}>
                                                        {getRankBonusLabel(idx)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center font-extrabold text-white text-sm font-mono">
                                                    {c.votes_count} Suara
                                                </td>
                                                {auth.user && userVoteTokens > 0 && (
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => handleVote(c.id)}
                                                            disabled={votingProgress}
                                                            className="px-3 py-1 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold text-[10px] rounded uppercase transition-all shadow disabled:opacity-50"
                                                        >
                                                            Vote
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                            </ScrollReveal>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section 2: Best Supporter (Ticket Validity Days Sum) */}
                {activeSection === 'supporter' && (
                    <div className="space-y-6">
                        <ScrollReveal>
                        <div className="p-4 bg-accent-maroon/10 border border-accent-maroon/30 rounded text-xs flex gap-3">
                            <Flame className="h-5 w-5 text-gold-primary shrink-0" />
                            <div>
                                <h4 className="font-bold text-white mb-0.5">Penghargaan Best Supporter</h4>
                                <p className="text-text-primary/80 leading-relaxed">
                                    Dihitung secara dinamis dari akumulasi total durasi masa berlaku tiket yang melakukan voting untuk kontingen sekolah: 
                                    Tiket Silver/Gold bernilai +1 Hari Durasi, Tiket Platinum bernilai +2 Hari Durasi.
                                </p>
                            </div>
                        </div>
                        </ScrollReveal>

                        <div className="premium-card border-bronze-muted/10 overflow-hidden text-xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] w-16 text-center">Rank</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px]">Kontingen Sekolah</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-right">Akumulasi Supporter Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bronze-muted/10">
                                    {sortedSupporter.map((c, idx) => (
                                        <ScrollReveal key={c.id} delay={idx * 80}>
                                        <tr className="hover:bg-white/[0.01]">
                                            <td className="p-4 text-center font-bold text-white">{idx + 1}</td>
                                            <td className="p-4">
                                                <span className="font-bold text-white block">{c.school_name}{c.is_reguler ? ' *reguler' : ''}</span>
                                                <span className="text-[10px] text-text-muted uppercase font-medium">{c.region} &bull; {c.category_type}</span>
                                            </td>
                                            <td className="p-4 text-right font-extrabold text-gold-bright text-sm font-mono">
                                                {c.supporter_days} Hari
                                            </td>
                                        </tr>
                                        </ScrollReveal>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section 3: Instagram Likes (Manual Entry) */}
                {activeSection === 'instagram' && (
                    <div className="space-y-6">
                        <ScrollReveal>
                        <div className="p-4 bg-white/5 border border-white/10 rounded text-xs flex gap-3">
                            <Heart className="h-5 w-5 text-gold-primary shrink-0" />
                            <div>
                                <h4 className="font-bold text-white mb-0.5">Penghargaan Kreator & Peserta Terfavorit Sosmed</h4>
                                <p className="text-text-primary/80 leading-relaxed">
                                    Dihitung berdasarkan rekapitulasi data likes Instagram Reels & Posts yang diinput secara manual oleh panitia.
                                </p>
                            </div>
                        </div>
                        </ScrollReveal>

                        <div className="premium-card border-bronze-muted/10 overflow-hidden text-xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] w-16 text-center">Rank</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px]">Kontingen Sekolah</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-center">Likes Reels</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-center">Likes Posts</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-right">Total Likes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bronze-muted/10">
                                    {sortedInstagram.map((c, idx) => (
                                        <ScrollReveal key={c.id} delay={idx * 80}>
                                        <tr className="hover:bg-white/[0.01]">
                                            <td className="p-4 text-center font-bold text-white">{idx + 1}</td>
                                            <td className="p-4">
                                                <span className="font-bold text-white block">{c.school_name}{c.is_reguler ? ' *reguler' : ''}</span>
                                                <span className="text-[10px] text-text-muted uppercase font-medium">{c.region} &bull; {c.category_type}</span>
                                            </td>
                                            <td className="p-4 text-center font-semibold text-text-primary/85 font-mono">
                                                {c.reels_likes} Likes
                                            </td>
                                            <td className="p-4 text-center font-semibold text-text-primary/85 font-mono">
                                                {c.posts_likes} Likes
                                            </td>
                                            <td className="p-4 text-right font-extrabold text-gold-bright text-sm font-mono">
                                                {(c.reels_likes + c.posts_likes).toLocaleString('id-ID')} Likes
                                            </td>
                                        </tr>
                                        </ScrollReveal>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section 4: Rekap (Official Scores) */}
                {activeSection === 'scoring' && (
                    <div className="space-y-6">
                        {event.leaderboard_status === 'draft' && !authContingentId ? (
                            <ScrollReveal>
                            <div className="premium-card p-12 border border-accent-maroon/30 text-center space-y-4 max-w-xl mx-auto my-12 bg-deep-black/60">
                                <EyeOff className="h-16 w-16 text-accent-mahogany mx-auto opacity-75 animate-pulse" />
                                <h3 className="text-xl font-extrabold text-white tracking-tight">Klasemen Juri Ditutup</h3>
                                <p className="text-xs text-text-primary/80 leading-relaxed max-w-sm mx-auto">
                                    TOMBOLA: Peringkat resmi penilaian juri (PBB, Danton, Vafor, dll) saat ini masih ditutup oleh panitia recap room. 
                                    Hasil klasemen akhir akan langsung dipublikasikan secara instan pada saat Closing Ceremony.
                                </p>
                            </div>
                            </ScrollReveal>
                        ) : event.leaderboard_status === 'draft' && authContingentId ? (() => {
                            const myContingent = contingents.find(c => c.id === authContingentId);
                            const myScore = myContingent?.score;
                            return (
                                <div className="space-y-4">
                                    <ScrollReveal>
                                    <div className="p-4 bg-accent-maroon/10 border border-accent-maroon/30 rounded text-xs flex gap-3">
                                        <EyeOff className="h-5 w-5 text-gold-primary shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-white mb-0.5">Mode Akses Pelatih / Coach</h4>
                                            <p className="text-text-primary/80 leading-relaxed">
                                                Klasemen umum sedang ditutup. Anda hanya dapat melihat nilai rekap tim Anda sendiri.
                                            </p>
                                        </div>
                                    </div>
                                    </ScrollReveal>
                                    {myContingent && (
                                        <div className="premium-card border-gold-primary/20 overflow-hidden bg-deep-black/40">
                                            <div className="p-4 bg-gold-primary/5 border-b border-gold-primary/20">
                                                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                                                    <Trophy className="h-4 w-4 text-gold-primary" /> Nilai Rekap Tim Saya: {myContingent.school_name}
                                                </h3>
                                            </div>
                                            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
                                                {[
                                                    { label: 'PBB', value: myScore ? Math.round(myScore.pbb_score) : '-', color: 'text-gold-bright' },
                                                    { label: 'Danton', value: myScore ? Math.round(myScore.danton_score) : '-', color: 'text-gold-light' },
                                                    { label: 'Vafor', value: myScore ? Math.round(myScore.vafor_score) : '-', color: 'text-gold-light' },
                                                    { label: 'Grand Total', value: myScore ? Math.round(myScore.grand_total) : '-', color: 'text-gold-primary' },
                                                ].map(({ label, value, color }) => (
                                                    <div key={label} className="p-4 bg-deep-black/60 rounded border border-bronze-muted/10">
                                                        <span className="text-text-muted block font-semibold uppercase text-[9px] mb-1">{label}</span>
                                                        <span className={`font-black text-2xl font-mono ${color}`}>{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {myScore && (
                                                <div className="px-6 pb-6 text-[10px] text-text-muted flex gap-4 flex-wrap">
                                                    <span>Kostum: <strong className="text-white">{Math.round(myScore.kostum_score)}</strong></span>
                                                    <span>Makeup: <strong className="text-white">{Math.round(myScore.makeup_score)}</strong></span>
                                                    <span>Penalti: <strong className="text-accent-mahogany">-{Math.round(myScore.penalties_score)}</strong></span>
                                                    <span>Bonus Voting: <strong className="text-emerald-400">+{Math.round(myScore.nilai_kontingen_bonus)}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })(                        ) : (
                            <div className="space-y-6">
                                <ScrollReveal>
                                <div className="p-4 bg-gold-primary/10 border border-gold-primary/30 rounded text-xs flex gap-3">
                                    <Trophy className="h-5 w-5 text-gold-primary shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-white mb-0.5">Klasemen Resmi Penilaian Juri (Rekap)</h4>
                                        <p className="text-text-primary/80 leading-relaxed">
                                            Daftar peringkat resmi dihitung dari akumulasi: PBB + Danton + Vafor + Kostum + Makeup - Penalti Juri.
                                        </p>
                                    </div>
                                </div>
                                </ScrollReveal>

                                {/* Category Selector for Rekap */}
                                <div className="flex gap-2 max-w-md mx-auto bg-deep-black/40 p-1 rounded border border-bronze-muted/10 mb-6">
                                    {['U12', 'U16', 'U19', 'Purna'].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setActiveCategoryFilter(cat)}
                                            className={`flex-1 py-1.5 text-center rounded text-xs font-bold transition-all uppercase ${
                                                activeCategoryFilter === cat
                                                    ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white shadow font-black'
                                                    : 'text-bronze-muted hover:text-white'
                                            }`}
                                        >
                                            {cat === 'U12' ? 'SD' : cat === 'U16' ? 'SMP' : cat === 'U19' ? 'SMA' : 'Purna'}
                                        </button>
                                    ))}
                                </div>

                                <div className="premium-card border-bronze-muted/10 overflow-hidden text-xs">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                                <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] w-16 text-center">Rank</th>
                                                <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px]">Kontingen Sekolah</th>
                                                <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-center">Kategori</th>
                                                <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-center">Penalti</th>
                                                <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-right">Grand Total Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bronze-muted/10">
                                            {sortedScoring
                                                .filter(c => c.category_type === activeCategoryFilter)
                                                .map((c, idx) => (
                                                <ScrollReveal key={c.id} delay={idx * 80}>
                                                <tr className="hover:bg-white/[0.01]">
                                                    <td className="p-4 text-center">
                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full font-black text-white/90 bg-white/5 text-xs">
                                                            {idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-bold text-white block">{c.school_name}{c.is_reguler ? ' *reguler' : ''}</span>
                                                        <span className="text-[10px] text-text-muted uppercase font-medium">{c.region}</span>
                                                    </td>
                                                    <td className="p-4 text-center font-semibold text-text-primary/80">
                                                        {c.category_type}
                                                    </td>
                                                     <td className="p-4 text-center font-mono text-accent-mahogany font-bold">
                                                          {c.score ? `-${Math.round(parseInt(c.score.penalties_score))}` : '0'}
                                                      </td>
                                                      <td className="p-4 text-right font-extrabold text-gold-light text-sm font-mono">
                                                          {c.score ? Math.round(parseInt(c.score.grand_total)) : '0'}
                                                      </td>
                                                </tr>
                                                </ScrollReveal>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {activeSection === 'final' && (
                    <div className="space-y-8">
                        {/* Category Selector for the Finalists */}
                        <div className="flex gap-2 max-w-md mx-auto bg-deep-black/40 p-1 rounded border border-bronze-muted/10">
                            {['U12', 'U16', 'U19'].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategoryFilter(cat)}
                                    className={`flex-1 py-1.5 text-center rounded text-xs font-bold transition-all uppercase ${
                                        activeCategoryFilter === cat
                                            ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white shadow font-black'
                                            : 'text-bronze-muted hover:text-white'
                                    }`}
                                >
                                    {cat === 'U12' ? 'SD' : cat === 'U16' ? 'SMP' : cat === 'U19' ? 'SMA' : ''}
                                </button>
                            ))}
                        </div>

                        {/* Non-confidential: Top 2 finalists from Vote Rank with vote progress bars */}
                        {['U12', 'U16', 'U19'].includes(activeCategoryFilter) ? (
                            finalist1 && finalist2 ? (
                                <div className="space-y-6">
                                    {/* Finalist cards based on vote rank */}
                                    <ScrollReveal>
                                    <div className="p-4 bg-accent-maroon/10 border border-accent-maroon/30 rounded text-xs flex gap-3">
                                        <BarChart3 className="h-5 w-5 text-gold-primary shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-white mb-0.5">Finalis Ditentukan dari Rank Voting</h4>
                                            <p className="text-text-primary/80 leading-relaxed">
                                                2 kontingen dengan suara terbanyak di kategorinya berhak maju ke Babak Final.
                                                Di babak final, penilaian dilakukan secara langsung oleh 3 juri PBB + 2 juri Vafor.
                                            </p>
                                        </div>
                                    </div>
                                    </ScrollReveal>

                                    <div className="premium-card p-6 border-gold-primary/20 space-y-6 bg-deep-black/40">
                                        <h3 className="text-center font-bold text-gold-cream text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
                                            <Flame className="h-4 w-4 text-gold-primary animate-pulse" />
                                            THE FINAL MATCH: {activeCategoryFilter === 'U12' ? 'SD' : activeCategoryFilter === 'U16' ? 'SMP' : 'SMA'}
                                        </h3>

                                        {/* Finalist Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                            <div className="p-5 bg-deep-black/60 rounded border border-gold-primary/30 text-center relative">
                                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold-primary" />
                                                <span className="text-[10px] font-bold text-gold-primary bg-gold-primary/10 px-2 py-0.5 rounded border border-gold-primary/20 uppercase">🏆 Rank #1 Vote</span>
                                                <h4 className="text-base font-black text-white mt-2">{finalist1.school_name}{finalist1.is_reguler ? ' *reguler' : ''}</h4>
                                                <p className="text-[10px] text-text-muted uppercase tracking-wider">{finalist1.region} • {finalist1.category_type}</p>
                                                <div className="mt-3 text-xs">
                                                    <span className="text-text-muted block font-semibold">Total Suara</span>
                                                    <span className="font-black text-gold-bright font-mono text-2xl">{finalist1.votes_count || 0}</span>
                                                </div>
                                            </div>

                                            <div className="p-5 bg-deep-black/60 rounded border border-accent-mahogany/30 text-center relative">
                                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-mahogany" />
                                                <span className="text-[10px] font-bold text-accent-mahogany bg-accent-mahogany/10 px-2 py-0.5 rounded border border-accent-mahogany/20 uppercase">🥈 Rank #2 Vote</span>
                                                <h4 className="text-base font-black text-white mt-2">{finalist2.school_name}{finalist2.is_reguler ? ' *reguler' : ''}</h4>
                                                <p className="text-[10px] text-text-muted uppercase tracking-wider">{finalist2.region} • {finalist2.category_type}</p>
                                                <div className="mt-3 text-xs">
                                                    <span className="text-text-muted block font-semibold">Total Suara</span>
                                                    <span className="font-black text-gold-bright font-mono text-2xl">{finalist2.votes_count || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vote Progress Bar (public, not jury scores) */}
                                        {(() => {
                                            const v1 = finalist1.votes_count || 0;
                                            const v2 = finalist2.votes_count || 0;
                                            const vTotal = v1 + v2;
                                            const vPct1 = vTotal > 0 ? (v1 / vTotal) * 100 : 50;
                                            const vPct2 = vTotal > 0 ? (v2 / vTotal) * 100 : 50;
                                            return (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-bold text-text-muted">
                                                        <span>{Math.round(vPct1)}% Suara</span>
                                                        <span className="text-gold-primary tracking-widest font-black">VS</span>
                                                        <span>{Math.round(vPct2)}% Suara</span>
                                                    </div>
                                                    <div className="w-full h-4 bg-deep-black rounded-full overflow-hidden flex border border-bronze-muted/20">
                                                        <div className="bg-gradient-to-r from-accent-maroon to-gold-primary transition-all duration-500" style={{ width: `${vPct1}%` }} />
                                                        <div className="bg-gradient-to-r from-gold-primary to-accent-burgundy transition-all duration-500" style={{ width: `${vPct2}%` }} />
                                                    </div>
                                                    <p className="text-[9px] text-text-muted text-center italic mt-1">Progress bar menampilkan proporsi suara publik. Skor juri final bersifat rahasia.</p>
                                                </div>
                                            );
                                        })()}

                                        {/* How The Final Works */}
                                        <div className="p-4 bg-deep-black/60 rounded border border-bronze-muted/10 text-xs space-y-3">
                                            <h5 className="font-bold text-white text-[10px] uppercase tracking-wider flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5 text-gold-primary" /> Cara Penentuan Juara Final</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {[
                                                    { step: '01', title: 'PBB (3 Juri)', desc: 'Skor PBB diakumulasikan dari 3 juri secara live.' },
                                                    { step: '02', title: 'Vafor (2 Juri)', desc: 'Variasi + Formasi + Danton Vafor dari 2 juri.' },
                                                    { step: '03', title: 'Bonus Voting', desc: 'Kontingen dengan rank vote lebih tinggi mendapat bonus poin.' },
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
                                    <h3 className="font-bold text-white text-xs uppercase">Finalis Belum Terbentuk</h3>
                                    <p className="text-[11px] text-bronze-muted mt-1 leading-relaxed">
                                        Kategori ini memerlukan minimal 2 kontingen yang memiliki suara vote untuk maju ke THE FINAL.
                                    </p>
                                </div>
                            )
                        ) : (
                            <div className="premium-card p-6 border-gold-primary/20 text-center space-y-3 bg-deep-black/40">
                                <Trophy className="h-10 w-10 text-gold-primary mx-auto mb-2 opacity-75 animate-pulse" />
                                <h3 className="font-bold text-white text-xs uppercase">Tidak Ada Babak Final</h3>
                                <p className="text-[11px] text-bronze-muted mt-1 leading-relaxed max-w-md mx-auto">
                                    Kategori {activeCategoryFilter === 'Purna' ? 'Purna' : ''} tidak memiliki pertandingan Babak Final.
                                    Pemenang ditentukan langsung dari perolehan nilai pada Babak Rekap.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Section 6: Daftar Juara */}
                {activeSection === 'champions' && (() => {
                    if (event.leaderboard_status === 'draft') {
                        return (
                            <div className="premium-card p-12 border border-accent-maroon/30 text-center space-y-4 max-w-xl mx-auto my-12 bg-deep-black/60">
                                <EyeOff className="h-16 w-16 text-accent-mahogany mx-auto opacity-75 animate-pulse" />
                                <h3 className="text-xl font-extrabold text-white tracking-tight">Daftar Juara Ditutup</h3>
                                <p className="text-xs text-text-primary/80 leading-relaxed max-w-sm mx-auto">
                                    TOMBOLA: Daftar juara resmi masih ditutup oleh panitia.
                                    Hasil akan langsung dipublikasikan secara instan pada saat Closing Ceremony.
                                </p>
                            </div>
                        );
                    }
                    const { brackets, awards } = calculateChampions(activeCategoryFilter, contingents, null, finalRoundScores);
                    return (
                        <div className="space-y-8 animate-fadeIn">
                            {/* Category Selector */}
                            <div className="flex gap-2 max-w-md mx-auto bg-deep-black/40 p-1 rounded border border-bronze-muted/10">
                                {['U12', 'U16', 'U19', 'Purna'].map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setActiveCategoryFilter(cat)}
                                        className={`flex-1 py-1.5 text-center rounded text-xs font-bold transition-all uppercase ${
                                            activeCategoryFilter === cat
                                                ? 'bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black shadow font-extrabold'
                                                : 'text-bronze-muted hover:text-white'
                                        }`}
                                    >
                                        {cat === 'U12' ? 'SD' : cat === 'U16' ? 'SMP' : cat === 'U19' ? 'SMA' : 'Purna'}
                                    </button>
                                ))}
                            </div>

                            {/* Brackets Standings */}
                            <div className="premium-card overflow-hidden border border-gold-primary/20">
                                <div className="p-4 bg-gold-primary/5 border-b border-gold-primary/20 flex justify-between items-center">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        <Trophy className="h-4.5 w-4.5 text-gold-primary" /> Daftar Juara Umum & Bracket Kategori ({activeCategoryFilter === 'U12' ? 'SD' : activeCategoryFilter === 'U16' ? 'SMP' : activeCategoryFilter === 'U19' ? 'SMA' : 'Purna'})
                                    </h3>
                                    <span className="text-[9px] font-mono text-gold-cream/70 uppercase">Hasil Resmi GARDA 55</span>
                                </div>
                                <div className="overflow-x-auto text-xs scroll-smooth">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-bronze-muted/20 bg-deep-black/60 text-[9px] uppercase tracking-wider text-text-muted">
                                                <th className="p-3">Bracket Juara</th>
                                                <th className="p-3">Kontingen Sekolah</th>
                                                <th className="p-3 text-center">Total Score</th>
                                                <th className="p-3 text-center">PBB</th>
                                                <th className="p-3 text-center">Danton</th>
                                                <th className="p-3 text-center">Vafor</th>
                                                <th className="p-3 text-center">Kostum</th>
                                                <th className="p-3 text-center">Makeup</th>
                                                <th className="p-3 text-center">Penalti</th>
                                                <th className="p-3 text-right">Bonus (Voting)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                            {brackets.map((item, idx) => {
                                                const hasTeam = !!item.team;
                                                const isFinalRound = item.isFinal;
                                                const totalScore = hasTeam ? (isFinalRound ? Math.round(item.team.finalTotal) : Math.round(item.team.firstRoundTotal)) : '-';
                                                
                                                return (
                                                    <tr key={idx} className="hover:bg-white/[0.01]">
                                                        <td className="p-3 font-bold text-gold-cream">{item.name}</td>
                                                        <td className="p-3">
                                                            {hasTeam ? (() => {
                                                const showKejurnasBadge = Array.isArray(item.kejurnasIds) && item.team && item.kejurnasIds.includes(item.team.id);
                                                                return (
                                                                    <div className="space-y-1">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="font-semibold text-white">
                                                                                {item.team.school_name}{item.team.is_reguler ? ' *reguler' : ''}
                                                                            </span>
                                            {showKejurnasBadge && (
                                                                                 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black tracking-wide uppercase">
                                                                                     🎟️ Tiket Kejurnas
                                                                                 </span>
                                                                             )}
                                                                        </div>
                                                                        <div className="flex flex-col text-[10px]">
                                                                            <span className="text-text-muted">{item.team.region}</span>
                                                                            {showKejurnasBadge && (
                                                                                <span className="text-emerald-400 font-medium italic mt-0.5">
                                                                                    Berhak mengikuti Kejuaraan Nasional FORBASI
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })() : (
                                                                <span className="text-text-muted italic">Belum ditentukan</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center font-extrabold text-gold-bright text-sm font-mono">
                                                            {totalScore}
                                                        </td>
                                                        <td className="p-3 text-center font-mono text-text-muted">
                                                            {hasTeam ? (isFinalRound ? Math.round(item.team.finalPbb) : Math.round(item.team.pbb)) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center font-mono text-text-muted">
                                                            {hasTeam ? (isFinalRound ? Math.round(item.team.finalDanton) : Math.round(item.team.danton)) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center font-mono text-text-muted">
                                                            {hasTeam ? (isFinalRound ? Math.round(item.team.finalVafor) : Math.round(item.team.vafor)) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center font-mono text-text-muted">
                                                            {hasTeam ? (isFinalRound ? '-' : Math.round(item.team.kostum)) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center font-mono text-text-muted">
                                                            {hasTeam ? (isFinalRound ? '-' : Math.round(item.team.makeup)) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center font-mono text-accent-mahogany font-bold">
                                                            {hasTeam ? (isFinalRound ? (item.team.finalPenalties > 0 ? `-${Math.round(item.team.finalPenalties)}` : '0') : (item.team.penalties > 0 ? `-${Math.round(item.team.penalties)}` : '0')) : '-'}
                                                        </td>
                                                        <td className="p-3 text-right font-mono text-emerald-400 font-semibold">
                                                            {hasTeam ? (isFinalRound ? `+${Math.round(item.team.finalObj?.voting_bonus || 0)}` : '0') : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Best Category Awards */}
                            <div className="premium-card overflow-hidden border border-bronze-muted/20">
                                <div className="p-4 bg-white/5 border-b border-bronze-muted/10">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        <Award className="h-4.5 w-4.5 text-gold-primary" /> Daftar Penghargaan Kategori Terbaik
                                    </h3>
                                </div>
                                <div className="overflow-x-auto text-xs scroll-smooth">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-bronze-muted/20 bg-deep-black/60 text-[9px] uppercase tracking-wider text-text-muted">
                                                <th className="p-3">Penghargaan</th>
                                                <th className="p-3">Pemenang Kontingen</th>
                                                <th className="p-3">Penerima (Pelatih/Tim)</th>
                                                <th className="p-3 text-right">Skor / Nilai Indikator</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                            {awards.map((award, idx) => {
                                                const hasTeam = !!award.team;
                                                let metricLabel = award.metricLabel || 'Poin';
                                                if (!award.metricLabel) {
                                                    if (award.name.includes('PBB')) metricLabel = 'Skor PBB';
                                                    if (award.name.includes('Vafor')) metricLabel = 'Skor Vafor';
                                                    if (award.name.includes('Danton')) metricLabel = 'Skor Danton';
                                                    if (award.name.includes('Pelatih')) metricLabel = 'Skor Utama';
                                                    if (award.name.includes('Kostum')) metricLabel = 'Skor Kostum';
                                                    if (award.name.includes('Make Up')) metricLabel = 'Skor Makeup';
                                                }

                                                return (
                                                    <tr key={idx} className="hover:bg-white/[0.01]">
                                                        <td className="p-3 font-semibold text-white">{award.name}</td>
                                                        <td className="p-3">
                                                            {hasTeam ? (
                                                                <span className="font-bold text-gold-light">
                                                                    {award.team.school_name}{award.team.is_reguler ? ' *reguler' : ''}
                                                                </span>
                                                            ) : (
                                                                <span className="text-text-muted italic">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-text-muted">
                                                            {hasTeam ? (
                                                                award.isCoach ? (
                                                                    <span className="text-white font-medium">{award.team.coach_name}</span>
                                                                ) : (
                                                                    'Tim Pasukan'
                                                                )
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right font-extrabold text-gold-bright font-mono">
                                                            {hasTeam ? `${Math.round(award.val)} ${metricLabel}` : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
