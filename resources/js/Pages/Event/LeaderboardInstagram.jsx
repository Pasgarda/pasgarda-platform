import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Heart, ArrowLeft } from 'lucide-react';

export default function LeaderboardInstagram({ event, contingents }) {
    const sortedInstagram = [...contingents].sort((a, b) => (b.reels_likes + b.posts_likes) - (a.reels_likes + a.posts_likes));

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Instagram Likes - Leaderboard" />
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider mb-2">
                            <ArrowLeft className="h-4 w-4" /> Detail Event
                        </Link>
                        <h1 className="text-3xl font-extrabold text-white mt-1">
                            Instagram <span className="text-gold-primary">Likes</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                        <a href={`/events/${event.slug}/leaderboard/vote`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Vote</a>
                        <a href={`/events/${event.slug}/leaderboard/supporter`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Best Supporter</a>
                        <a href={`/events/${event.slug}/leaderboard/instagram`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40">Instagram</a>
                        <a href={`/events/${event.slug}/leaderboard/rekap`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Rekap</a>
                        <a href={`/events/${event.slug}/leaderboard/final`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">The Final</a>
                        <a href={`/events/${event.slug}/leaderboard/juara`} className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">Juara</a>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-white/5 border border-white/10 rounded text-xs flex gap-3">
                        <Heart className="h-5 w-5 text-gold-primary shrink-0" />
                        <div>
                            <h4 className="font-bold text-white mb-0.5">Penghargaan Kreator & Peserta Terfavorit Sosmed</h4>
                            <p className="text-text-primary/80 leading-relaxed">Dihitung berdasarkan rekapitulasi data likes Instagram Reels & Posts yang diinput secara manual oleh panitia.</p>
                        </div>
                    </div>

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
                                    <tr key={c.id} className="hover:bg-white/[0.01]">
                                        <td className="p-4 text-center font-bold text-white">{idx + 1}</td>
                                        <td className="p-4">
                                            <span className="font-bold text-white block">{c.school_name}{c.is_reguler ? ' *reguler' : ''}</span>
                                            <span className="text-[10px] text-text-muted uppercase font-medium">{c.region} &bull; {c.category_type}</span>
                                        </td>
                                        <td className="p-4 text-center font-semibold text-text-primary/85 font-mono">{c.reels_likes} Likes</td>
                                        <td className="p-4 text-center font-semibold text-text-primary/85 font-mono">{c.posts_likes} Likes</td>
                                        <td className="p-4 text-right font-extrabold text-gold-bright text-sm font-mono">{(c.reels_likes + c.posts_likes).toLocaleString('id-ID')} Likes</td>
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
