import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Trophy, EyeOff, ArrowLeft } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

export default function LeaderboardRekap({ event, contingents, authContingentId }) {
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('U16');

    const sortedScoring = [...contingents].sort((a, b) => {
        const scoreA = a.score?.grand_total || 0;
        const scoreB = b.score?.grand_total || 0;
        return scoreB - scoreA;
    });

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Rekap - Leaderboard" />
            <div className="max-w-6xl mx-auto space-y-8">
                <ScrollReveal>
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider mb-2">
                            <ArrowLeft className="h-4 w-4" /> Detail Event
                        </Link>
                        <h1 className="text-3xl font-extrabold text-white mt-1">
                            Rekap <span className="text-gold-primary">Penilaian Juri</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                        <a href={`/events/${event.slug}/leaderboard/vote`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Vote</a>
                        <a href={`/events/${event.slug}/leaderboard/supporter`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Best Supporter</a>
                        <a href={`/events/${event.slug}/leaderboard/instagram`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Instagram</a>
                        <a href={`/events/${event.slug}/leaderboard/rekap`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40">Rekap</a>
                        <a href={`/events/${event.slug}/leaderboard/final`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">The Final</a>
                        <a href={`/events/${event.slug}/leaderboard/juara`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Juara</a>
                    </div>
                </div>
                </ScrollReveal>

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
                                    <p className="text-text-primary/80 leading-relaxed">Klasemen umum sedang ditutup. Anda hanya dapat melihat nilai rekap tim Anda sendiri.</p>
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
                })(                ) : (
                    <div className="space-y-6">
                        <ScrollReveal>
                        <div className="p-4 bg-gold-primary/10 border border-gold-primary/30 rounded text-xs flex gap-3">
                            <Trophy className="h-5 w-5 text-gold-primary shrink-0" />
                            <div>
                                <h4 className="font-bold text-white mb-0.5">Klasemen Resmi Penilaian Juri (Rekap)</h4>
                                <p className="text-text-primary/80 leading-relaxed">Daftar peringkat resmi dihitung dari akumulasi: PBB + Danton + Vafor + Kostum + Makeup + Nilai Kontingen - Penalti Juri.</p>
                            </div>
                        </div>
                        </ScrollReveal>

                        <div className="flex gap-2 max-w-md mx-auto bg-deep-black/40 p-1 rounded border border-bronze-muted/10 mb-6">
                            {['U12', 'U16', 'U19', 'Purna'].map((cat) => (
                                <button key={cat} type="button" onClick={() => setActiveCategoryFilter(cat)}
                                    className={`flex-1 py-1.5 text-center rounded text-xs font-bold transition-all uppercase ${
                                        activeCategoryFilter === cat ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white shadow font-black' : 'text-bronze-muted hover:text-white'
                                    }`}>
                                    {cat === 'U12' ? 'SD' : cat === 'U16' ? 'SMP' : cat === 'U19' ? 'SMA' : 'Purna'}
                                </button>
                            ))}
                        </div>

                        <ScrollReveal>
                        <div className="premium-card border-bronze-muted/10 overflow-hidden text-xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] w-16 text-center">Rank</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px]">Kontingen Sekolah</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-center">Kategori</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-center">Penalti</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-right">Grand Total Score</th>
                                        <th className="p-4 font-bold text-gold-light uppercase tracking-wider text-[10px] text-center">Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bronze-muted/10">
                                    {sortedScoring.filter(c => c.category_type === activeCategoryFilter).map((c, idx) => (
                                        <tr key={c.id} className="hover:bg-white/[0.01]">
                                            <td className="p-4 text-center">
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full font-black text-white/90 bg-white/5 text-xs">{idx + 1}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-bold text-white block">{c.school_name}{c.is_reguler ? ' *reguler' : ''}</span>
                                                <span className="text-[10px] text-text-muted uppercase font-medium">{c.region}</span>
                                            </td>
                                            <td className="p-4 text-center font-semibold text-text-primary/80">{c.category_type}</td>
                                            <td className="p-4 text-center font-mono text-accent-mahogany font-bold">{c.score ? `-${Math.round(parseInt(c.score.penalties_score))}` : '0'}</td>
                                            <td className="p-4 text-right font-extrabold text-gold-light text-sm font-mono">{c.score ? Math.round(parseInt(c.score.grand_total)) : '0'}</td>
                                            <td className="p-4 text-center">
                                                {c.score && (
                                                    <Link href={`/events/${event.slug}/leaderboard/rekap/juri/${c.id}`}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded text-[9px] font-bold transition-all"
                                                    >
                                                        Detail Juri
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </ScrollReveal>
                    </div>
                )}
            </div>
        </div>
    );
}
