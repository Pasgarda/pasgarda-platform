import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { EyeOff, Trophy, Award, ArrowLeft, Info } from 'lucide-react';
import { calculateChampions } from '../../Utils/champions';
import ScrollReveal from '../../Components/ScrollReveal';

export default function LeaderboardJuara({ event, contingents, finalRoundScores = [] }) {
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('U16');

    if (event.leaderboard_status === 'draft') {
        return (
            <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
                <Head title="Daftar Juara - Leaderboard" />
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                        <div>
                            <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider mb-2">
                                <ArrowLeft className="h-4 w-4" /> Detail Event
                            </Link>
                            <h1 className="text-3xl font-extrabold text-white mt-1">Daftar <span className="text-gold-primary">Juara</span></h1>
                            <p className="text-xs text-text-muted mt-1">{event.name}</p>
                        </div>
                    </div>
                    <div className="premium-card p-12 border border-accent-maroon/30 text-center space-y-4 max-w-xl mx-auto my-12 bg-deep-black/60">
                        <EyeOff className="h-16 w-16 text-accent-mahogany mx-auto opacity-75 animate-pulse" />
                        <h3 className="text-xl font-extrabold text-white tracking-tight">Daftar Juara Ditutup</h3>
                        <p className="text-xs text-text-primary/80 leading-relaxed max-w-sm mx-auto">Hasil akan langsung dipublikasikan secara instan pada saat Closing Ceremony.</p>
                    </div>
                </div>
            </div>
        );
    }

    const { brackets, awards } = calculateChampions(activeCategoryFilter, contingents, null, finalRoundScores);

    const championBracket = brackets.find(b => b.name === 'Juara Umum Garda');
    const finalistBrackets = brackets.filter(b => b.isFinal);
    const regularBrackets = brackets.filter(b => b.name !== 'Juara Umum Garda' && !b.isFinal);

    const isFinalRound = activeCategoryFilter === 'U16' || activeCategoryFilter === 'U19';

    const formulaInfo = {
        U12: {
            title: 'Juara Umum SD',
            formula: 'Nilai Seleksi = PBB + Danton + Vafor + Nilai Kontingen − Penalti',
            desc: 'Juara Umum ditentukan oleh Nilai Seleksi tertinggi di babak penyisihan. Tidak ada babak final untuk kategori SD.',
        },
        U16: {
            title: 'Juara Grand Final SMP',
            formula: 'Skor Final = PBB + Danton + Vafor − Penalti (penampilan baru)',
            desc: '2 finalis dengan Nilai Seleksi tertinggi (PBB+Danton+Vafor+Nilai Kontingen−Penalti) dari babak penyisihan bertanding di babak Grand Final. Juara ditentukan oleh Skor Final tertinggi.',
        },
        U19: {
            title: 'Juara Grand Final SMA',
            formula: 'Skor Final = PBB + Danton + Vafor − Penalti (penampilan baru)',
            desc: '2 finalis dengan Nilai Seleksi tertinggi (PBB+Danton+Vafor+Nilai Kontingen−Penalti) dari babak penyisihan bertanding di babak Grand Final. Juara ditentukan oleh Skor Final tertinggi.',
        },
        Purna: {
            title: 'Kategori Purna',
            formula: 'Juara Peringkat = PBB + Danton + Vafor − Penalti',
            desc: 'Kategori Purna tidak mengikuti babak Grand Final. Seluruh kontingen dinilai berdasarkan Juara Peringkat dari babak penyisihan.',
        },
    }[activeCategoryFilter];

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Daftar Juara - Leaderboard" />
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider mb-2">
                            <ArrowLeft className="h-4 w-4" /> Detail Event
                        </Link>
                        <h1 className="text-3xl font-extrabold text-white mt-1">Daftar <span className="text-gold-primary">Juara</span></h1>
                        <p className="text-xs text-text-muted mt-1">{event.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                        <a href={`/events/${event.slug}/leaderboard/vote`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Vote</a>
                        <a href={`/events/${event.slug}/leaderboard/supporter`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Best Supporter</a>
                        <a href={`/events/${event.slug}/leaderboard/instagram`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Instagram</a>
                        <a href={`/events/${event.slug}/leaderboard/rekap`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Rekap</a>
                        <a href={`/events/${event.slug}/leaderboard/final`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">The Final</a>
                        <a href={`/events/${event.slug}/leaderboard/juara`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40">Juara</a>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex gap-2 max-w-md mx-auto bg-deep-black/40 p-1 rounded border border-bronze-muted/10">
                        {['U12', 'U16', 'U19', 'Purna'].map((cat) => (
                            <button key={cat} type="button" onClick={() => setActiveCategoryFilter(cat)}
                                className={`flex-1 py-1.5 text-center rounded text-xs font-bold transition-all uppercase ${
                                    activeCategoryFilter === cat ? 'bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black shadow font-extrabold' : 'text-bronze-muted hover:text-white'
                                }`}>
                                {cat === 'U12' ? 'SD' : cat === 'U16' ? 'SMP' : cat === 'U19' ? 'SMA' : 'Purna'}
                            </button>
                        ))}
                    </div>

                    {championBracket && championBracket.team && (
                        <ScrollReveal>
                        <div className="premium-card border border-gold-primary/30 overflow-hidden">
                            <div className="bg-gradient-to-r from-gold-primary/10 via-gold-bright/5 to-transparent p-6 border-b border-gold-primary/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <Trophy className="h-8 w-8 text-gold-primary" />
                                    <div>
                                        <h2 className="text-xl font-black text-white tracking-tight">Juara Umum Garda</h2>
                                        <p className="text-[10px] text-gold-cream/60 uppercase tracking-widest">{formulaInfo.title}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-extrabold text-white">{championBracket.team.school_name}</h3>
                                        <p className="text-sm text-text-muted">{championBracket.team.region}</p>
                                        {championBracket.team.coach_name && (
                                            <p className="text-xs text-gold-cream/70">Pelatih: <span className="text-white font-semibold">{championBracket.team.coach_name}</span></p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-text-muted uppercase tracking-wider">Nilai {isFinalRound ? 'Final' : 'Seleksi'}</div>
                                        <div className="text-4xl font-black text-gold-bright">{Math.round(championBracket.championScore ?? championBracket.team.finalTotal)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="bg-deep-black/40 rounded p-3 border border-bronze-muted/10">
                                        <div className="text-[9px] text-text-muted uppercase tracking-wider">PBB</div>
                                        <div className="text-lg font-bold text-white font-mono">{Math.round(championBracket.team.finalPbb ?? championBracket.team.pbb)}</div>
                                    </div>
                                    <div className="bg-deep-black/40 rounded p-3 border border-bronze-muted/10">
                                        <div className="text-[9px] text-text-muted uppercase tracking-wider">Danton</div>
                                        <div className="text-lg font-bold text-white font-mono">{Math.round(championBracket.team.finalDanton ?? championBracket.team.danton)}</div>
                                    </div>
                                    <div className="bg-deep-black/40 rounded p-3 border border-bronze-muted/10">
                                        <div className="text-[9px] text-text-muted uppercase tracking-wider">Vafor</div>
                                        <div className="text-lg font-bold text-white font-mono">{Math.round(championBracket.team.finalVafor ?? championBracket.team.vafor)}</div>
                                    </div>
                                    <div className="bg-deep-black/40 rounded p-3 border border-emerald-500/20">
                                        <div className="text-[9px] text-emerald-400 uppercase tracking-wider">Voting Bonus</div>
                                        <div className="text-lg font-bold text-emerald-400 font-mono">+{Math.round(championBracket.team.finalObj?.voting_bonus ?? championBracket.team.nilaiKontingenBonus)}</div>
                                    </div>
                                    <div className="bg-deep-black/40 rounded p-3 border border-accent-mahogany/20">
                                        <div className="text-[9px] text-accent-mahogany uppercase tracking-wider">Penalti</div>
                                        <div className="text-lg font-bold text-accent-mahogany font-mono">-{Math.round(championBracket.team.finalPenalties ?? championBracket.team.penalties)}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 p-3 rounded bg-white/5 border border-bronze-muted/10 text-[11px] leading-relaxed">
                                    <Info className="h-4 w-4 text-gold-primary mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-bold text-gold-light">{formulaInfo.formula}</span>
                                        <p className="text-text-muted mt-0.5">{formulaInfo.desc}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </ScrollReveal>
                    )}

                    {finalistBrackets.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {finalistBrackets.map((item, idx) => {
                                const isChampion = idx === 0;
                                const team = item.team;
                                if (!team) return null;
                                return (
                                    <div key={idx} className={`premium-card border overflow-hidden ${isChampion ? 'border-gold-primary/30' : 'border-bronze-muted/20'}`}>
                                        <div className={`p-4 border-b ${isChampion ? 'bg-gradient-to-r from-gold-primary/10 to-transparent border-gold-primary/20' : 'bg-white/5 border-bronze-muted/10'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {isChampion && <Trophy className="h-5 w-5 text-gold-primary" />}
                                                <h3 className={`font-bold text-sm ${isChampion ? 'text-white' : 'text-gold-cream'}`}>
                                                    {isChampion ? 'Juara Grand Final 1 (Juara Umum Garda)' : 'Juara Grand Final 2'}
                                                </h3>
                                            </div>
                                            <h4 className="text-lg font-extrabold text-white">{team.school_name}</h4>
                                            <p className="text-xs text-text-muted">{team.region}</p>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] text-text-muted uppercase tracking-wider">Skor Final</span>
                                                <span className="text-2xl font-black text-gold-bright">{Math.round(team.finalTotal)}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-deep-black/40 rounded p-2 border border-bronze-muted/10">
                                                    <div className="text-[8px] text-text-muted uppercase tracking-wider">PBB</div>
                                                    <div className="text-sm font-bold text-white font-mono">{Math.round(team.finalPbb)}</div>
                                                </div>
                                                <div className="bg-deep-black/40 rounded p-2 border border-bronze-muted/10">
                                                    <div className="text-[8px] text-text-muted uppercase tracking-wider">Danton</div>
                                                    <div className="text-sm font-bold text-white font-mono">{Math.round(team.finalDanton)}</div>
                                                </div>
                                                <div className="bg-deep-black/40 rounded p-2 border border-bronze-muted/10">
                                                    <div className="text-[8px] text-text-muted uppercase tracking-wider">Vafor</div>
                                                    <div className="text-sm font-bold text-white font-mono">{Math.round(team.finalVafor)}</div>
                                                </div>
                                                <div className="bg-deep-black/40 rounded p-2 border border-emerald-500/20">
                                                    <div className="text-[8px] text-emerald-400 uppercase tracking-wider">Voting</div>
                                                    <div className="text-sm font-bold text-emerald-400 font-mono">+{Math.round(team.finalObj?.voting_bonus || 0)}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-accent-mahogany">Penalti: -{Math.round(team.finalPenalties)}</span>
                                                <span className="text-text-muted">Nilai Seleksi: {Math.round(team.selectionScore)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!championBracket && !isFinalRound && (
                        <div className="premium-card border border-bronze-muted/20 p-6 text-center animate-fade-in">
                            <p className="text-sm text-text-muted">Tidak ada Juara Umum untuk kategori {activeCategoryFilter === 'Purna' ? 'Purna' : activeCategoryFilter}. Semua kontingen bersaing di Juara Peringkat.</p>
                        </div>
                    )}

                    <ScrollReveal>
                    <div className="premium-card overflow-hidden border border-gold-primary/20">
                        <div className="p-4 bg-gold-primary/5 border-b border-gold-primary/20 flex justify-between items-center">
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                <Trophy className="h-4.5 w-4.5 text-gold-primary" /> Papan Juara Peringkat ({activeCategoryFilter === 'U12' ? 'SD' : activeCategoryFilter === 'U16' ? 'SMP' : activeCategoryFilter === 'U19' ? 'SMA' : 'Purna'})
                            </h3>
                            <span className="text-[9px] font-mono text-gold-cream/70 uppercase">Juara Peringkat = PBB + Danton + Vafor − Penalti</span>
                        </div>
                        <div className="overflow-x-auto text-xs scroll-smooth">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-bronze-muted/20 bg-deep-black/60 text-[9px] uppercase tracking-wider text-text-muted">
                                        <th className="p-3">Bracket</th>
                                        <th className="p-3">Sekolah</th>
                                        <th className="p-3 text-center">Total</th>
                                        <th className="p-3 text-center">PBB</th>
                                        <th className="p-3 text-center">Danton</th>
                                        <th className="p-3 text-center">Vafor</th>
                                        <th className="p-3 text-center">Penalti</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                    {regularBrackets.map((item, idx) => {
                                        const hasTeam = !!item.team;
                                        return (
                                            <tr key={idx} className="hover:bg-white/[0.01]">
                                                <td className="p-3 font-bold text-gold-cream whitespace-nowrap">{item.name}</td>
                                                <td className="p-3">
                                                    {hasTeam ? (() => {
                                                        const showKejurnasBadge = Array.isArray(item.kejurnasIds) && item.team && item.kejurnasIds.includes(item.team.id);
                                                        return (
                                                            <div className="space-y-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="font-semibold text-white">{item.team.school_name}{item.team.is_reguler ? ' *reguler' : ''}</span>
                                                                    {showKejurnasBadge && (
                                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black tracking-wide uppercase">🎟️ Tiket Kejurnas</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col text-[10px]">
                                                                    <span className="text-text-muted">{item.team.region}</span>
                                                                    {showKejurnasBadge && <span className="text-emerald-400 font-medium italic mt-0.5">Berhak mengikuti Kejuaraan Nasional FORBASI</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })() : (
                                                        <span className="text-text-muted italic animate-fade-in">Belum ditentukan</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center font-extrabold text-gold-bright text-sm font-mono">
                                                    {hasTeam ? Math.round(item.team.juaraScore) : '-'}
                                                </td>
                                                <td className="p-3 text-center font-mono text-text-muted">
                                                    {hasTeam ? Math.round(item.team.pbb) : '-'}
                                                </td>
                                                <td className="p-3 text-center font-mono text-text-muted">
                                                    {hasTeam ? Math.round(item.team.danton) : '-'}
                                                </td>
                                                <td className="p-3 text-center font-mono text-text-muted">
                                                    {hasTeam ? Math.round(item.team.vafor) : '-'}
                                                </td>
                                                <td className="p-3 text-center font-mono text-accent-mahogany font-bold">
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

                    <ScrollReveal>
                    <div className="premium-card overflow-hidden border border-bronze-muted/20">
                        <div className="p-4 bg-white/5 border-b border-bronze-muted/10">
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                <Award className="h-4.5 w-4.5 text-gold-primary" /> Penghargaan Kategori
                            </h3>
                        </div>
                        <div className="overflow-x-auto text-xs scroll-smooth">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-bronze-muted/20 bg-deep-black/60 text-[9px] uppercase tracking-wider text-text-muted">
                                        <th className="p-3">Penghargaan</th>
                                        <th className="p-3">Kontingen</th>
                                        <th className="p-3">Penerima</th>
                                        <th className="p-3 text-right">Skor</th>
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
                                                <td className="p-3 font-semibold text-white">{award.name}</td>
                                                <td className="p-3">
                                                    {hasTeam ? <span className="font-bold text-gold-light">{award.team.school_name}{award.team.is_reguler ? ' *reguler' : ''}</span> : <span className="text-text-muted italic">-</span>}
                                                </td>
                                                <td className="p-3 text-text-muted">
                                                    {hasTeam ? (award.isCoach ? <span className="text-white font-medium">{award.team.coach_name}</span> : 'Tim Pasukan') : '-'}
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
                    </ScrollReveal>
                </div>
            </div>
        </div>
    );
}
