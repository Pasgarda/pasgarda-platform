import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { BarChart2, Star } from 'lucide-react';
import { categoryLabels } from '../../Utils/scoreUtils';
import ScrollReveal from '../../Components/ScrollReveal';

export default function ScoreDaftarNilai({ event, contingents = [], scores = [], finalRoundScores = [] }) {
    const [activeCategory, setActiveCategory] = useState('U16');

    const categories = ['U12', 'U16', 'U19', 'Purna'];

    const filteredScores = scores
        .filter((s) => s.contingent?.category_type === activeCategory)
        .sort((a, b) => parseInt(b.grand_total) - parseInt(a.grand_total));

    const filteredFinal = (() => {
        const top2Ids = scores
            .filter(s => s.contingent?.category_type === activeCategory)
            .sort((a, b) => parseInt(b.grand_total) - parseInt(a.grand_total))
            .slice(0, 2)
            .map(s => s.contingent_id);

        return finalRoundScores
            .filter((fs) => fs.contingent?.category_type === activeCategory
                && top2Ids.includes(fs.contingent_id))
            .sort((a, b) => parseInt(b.total_score) - parseInt(a.total_score));
    })();

    const catLabel = (cat) => {
        if (cat === 'U12') return 'SD';
        if (cat === 'U16') return 'SMP';
        if (cat === 'U19') return 'SMA';
        return 'Purna';
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Daftar Nilai" />

            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Daftar Nilai
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            Rekapitulasi <span className="text-gold-primary">Skor</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">
                            {event.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <a
                            href={`/admin/events/${event.slug}`}
                            className="px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white"
                        >
                            ← Dashboard Event
                        </a>
                        <a
                            href={`/admin/events/${event.slug}/scores/rekap`}
                            className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white"
                        >
                            Rekap
                        </a>
                        <a
                            href={`/admin/events/${event.slug}/scores/final`}
                            className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white"
                        >
                            THE FINAL
                        </a>
                        <span className="px-3.5 py-1.5 rounded text-xs font-bold bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border border-accent-burgundy/40">
                            Daftar Nilai
                        </span>
                        <a
                            href={`/admin/events/${event.slug}/scores/daftar-juara`}
                            className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white"
                        >
                            Daftar Juara
                        </a>
                    </div>
                </div>

                {/* Category Selector */}
                <div className="flex gap-2 max-w-md mx-auto bg-deep-black/40 p-1 rounded border border-bronze-muted/10">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`flex-1 py-1.5 text-center rounded text-xs font-bold transition-all uppercase ${
                                activeCategory === cat
                                    ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white shadow'
                                    : 'text-bronze-muted hover:text-white'
                            }`}
                        >
                            {catLabel(cat)}
                        </button>
                    ))}
                </div>

                {/* Rekap Scores Table */}
                <ScrollReveal>
                <div className="premium-card overflow-hidden border border-bronze-muted/10">
                    <div className="p-4 bg-accent-maroon/5 border-b border-bronze-muted/10">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <BarChart2 className="h-4.5 w-4.5 text-gold-primary" /> Hasil Rekapitulasi Babak Rekap (Kumulatif & Juri Breakdown)
                        </h3>
                    </div>
                    <div className="overflow-x-auto text-xs scroll-smooth">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Kontingen</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Kategori</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">PBB (Sum)</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Danton (Sum)</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Vafor (Sum)</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Kostum (Sum)</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Peng.Kos</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Makeup (Sum)</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Penalti Global</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-right">Grand Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                {filteredScores.length > 0 ? (
                                    filteredScores.map((s) => (
                                        <tr key={s.id} className="hover:bg-white/[0.01]">
                                            <td className="p-3 font-semibold text-white">
                                                {s.contingent?.school_name}{s.contingent?.is_reguler ? ' *reguler' : ''}
                                            </td>
                                            <td className="p-3 text-text-muted font-bold">{s.contingent?.category_type}</td>
                                            <td className="p-3 text-center font-mono">{parseInt(s.pbb_score)}</td>
                                            <td className="p-3 text-center font-mono">{parseInt(s.danton_score)}</td>
                                            <td className="p-3 text-center font-mono">{parseInt(s.vafor_score)}</td>
                                            <td className="p-3 text-center font-mono">{parseInt(s.kostum_score)}</td>
                                            <td className="p-3 text-center font-mono text-amber-400">{(parseInt(s.kostum_penalty) || 0) > 0 ? parseInt(s.kostum_penalty) : '-'}</td>
                                            <td className="p-3 text-center font-mono">{parseInt(s.makeup_score)}</td>
                                            <td className="p-3 text-center font-mono text-accent-mahogany font-bold">-{parseInt(s.penalties_score)}</td>
                                            <td className="p-3 text-right font-extrabold text-gold-bright font-mono">{parseInt(s.grand_total)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="p-6 text-center text-bronze-muted italic animate-fade-in">
                                            Belum ada skor Rekap yang diinput untuk kategori ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </ScrollReveal>

                {/* Final Round Scores Table */}
                <ScrollReveal>
                <div className="premium-card overflow-hidden border border-gold-primary/20">
                    <div className="p-4 bg-gold-primary/5 border-b border-gold-primary/20">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Star className="h-4.5 w-4.5 text-gold-primary" /> Hasil Rekapitulasi THE FINAL
                        </h3>
                    </div>
                    <div className="overflow-x-auto text-xs scroll-smooth">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Kontingen</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Kategori</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">PBB (Sum 3 Juri)</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Danton (Sum 3 Juri)</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Vafor (Sum 2 Juri)</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Voting Bonus</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Penalti</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-right">Total Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                {filteredFinal.length > 0 ? (
                                    filteredFinal.map((fs) => (
                                        <tr key={fs.id} className="hover:bg-white/[0.01]">
                                            <td className="p-3 font-semibold text-white">
                                                {fs.contingent?.school_name}{fs.contingent?.is_reguler ? ' *reguler' : ''}
                                            </td>
                                            <td className="p-3 text-text-muted font-bold">{fs.contingent?.category_type}</td>
                                            <td className="p-3 text-center font-mono">{parseInt(fs.pbb_score)}</td>
                                            <td className="p-3 text-center font-mono">{parseInt(fs.danton_score)}</td>
                                            <td className="p-3 text-center font-mono">{parseInt(fs.vafor_score)}</td>
                                            <td className="p-3 text-center font-mono text-gold-primary font-bold">
                                                +{parseInt(fs.voting_bonus)}
                                            </td>
                                            <td className="p-3 text-center font-mono text-accent-mahogany font-bold">
                                                -{parseInt(fs.penalties)}
                                            </td>
                                            <td className="p-3 text-right font-extrabold text-gold-bright font-mono">
                                                {parseInt(fs.total_score)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-bronze-muted italic animate-fade-in">
                                            Belum ada skor final yang diinput untuk kategori ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </ScrollReveal>

            </div>
        </div>
    );
}
