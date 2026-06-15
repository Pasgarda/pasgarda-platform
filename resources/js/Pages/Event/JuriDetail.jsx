import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Trophy, User } from 'lucide-react';

const JURY_TYPE_LABELS = { pbb: 'PBB', vafor: 'Vafor', makeup_kostum: 'Makeup & Kostum' };
const JURY_TYPE_ORDER = ['pbb', 'vafor', 'makeup_kostum'];

const DETAIL_CATEGORIES = {
    pbb: [
        { key: 'pbb_details', label: 'Gerakan PBB', color: 'text-gold-bright' },
        { key: 'danton_details', label: 'Danton', color: 'text-gold-light' },
    ],
    vafor: [
        { key: 'variasi_details', label: 'Variasi', color: 'text-sky-400' },
        { key: 'formasi_details', label: 'Formasi', color: 'text-emerald-400' },
        { key: 'danton_vafor_details', label: 'Danton Vafor', color: 'text-violet-400' },
    ],
    makeup_kostum: [
        { key: 'kostum_details', label: 'Kostum', color: 'text-amber-400' },
        { key: 'makeup_details', label: 'Makeup', color: 'text-rose-400' },
    ],
};

const SCORE_FIELD_MAP = {
    pbb: { label: 'PBB + Danton', field: 'pbb_score' },
    vafor: { label: 'Vafor', field: 'vafor_score' },
    makeup_kostum: { label: 'Kostum + Makeup', field: 'kostum_score' },
};

function sumDetails(details) {
    if (!details) return 0;
    return Object.values(details).reduce((s, v) => s + (parseInt(v) || 0), 0);
}

export default function JuriDetail({ event, contingent, juryScores, juryMembers, rubrics }) {
    const score = contingent.score;
    const rekapScores = juryScores?.rekap || {};

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-4 font-sans">
            <Head title={`Detail Juri - ${contingent.school_name}`} />
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-bronze-muted/20">
                    <Link href={`/events/${event.slug}/leaderboard/rekap`}
                        className="text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4 inline" /> Rekap
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-extrabold text-white truncate">
                            {contingent.school_name}
                        </h1>
                        <p className="text-[11px] text-text-muted">
                            {contingent.region} — {contingent.category_type}
                        </p>
                    </div>
                </div>

                {/* Summary Card */}
                {score && (
                    <div className="premium-card border-bronze-muted/10 overflow-hidden">
                        <div className="px-4 py-2 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Trophy className="h-3.5 w-3.5 text-gold-primary" /> Ringkasan Total
                            </h3>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 p-4">
                            {[
                                { label: 'PBB', value: score.pbb_score, color: 'text-gold-bright' },
                                { label: 'Danton', value: score.danton_score, color: 'text-gold-light' },
                                { label: 'Vafor', value: score.vafor_score, color: 'text-sky-400' },
                                { label: 'Kostum', value: score.kostum_score, color: 'text-amber-400' },
                                { label: 'Makeup', value: score.makeup_score, color: 'text-rose-400' },
                                { label: 'Penalti', value: `-${score.penalties_score}`, color: 'text-accent-mahogany' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="p-2 bg-black/60 rounded border border-white/5 text-center">
                                    <span className="text-text-muted block text-[9px] uppercase font-bold">{label}</span>
                                    <span className={`font-black text-sm font-mono ${color}`}>
                                        {typeof value === 'number' ? Math.round(value) : value}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 pb-4 text-center">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Grand Total </span>
                            <span className="text-xl font-extrabold text-gold-primary font-mono">{Math.round(score.grand_total)}</span>
                        </div>
                    </div>
                )}

                {/* No data state */}
                {Object.keys(rekapScores).length === 0 && (
                    <div className="premium-card p-12 border-accent-maroon/30 text-center">
                        <p className="text-text-muted text-sm">Belum ada data penilaian juri untuk kontingen ini.</p>
                    </div>
                )}

                {/* Per-Juri Cards */}
                {JURY_TYPE_ORDER.map(juryType => {
                    const typeScores = rekapScores[juryType];
                    const members = juryMembers[juryType] || {};
                    const details = DETAIL_CATEGORIES[juryType];
                    if (!typeScores || Object.keys(typeScores).length === 0) return null;

                    return (
                        <div key={juryType} className="space-y-3">
                            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                {JURY_TYPE_LABELS[juryType] || juryType}
                            </h3>
                            {Object.entries(typeScores).map(([juryNum, js]) => {
                                const juror = members[juryNum];
                                const jurorName = juror?.name || `Juri ${juryNum}`;
                                return (
                                    <div key={juryNum} className="premium-card border-bronze-muted/10 overflow-hidden">
                                        <div className="px-4 py-2 bg-deep-black/60 border-b border-bronze-muted/10 flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-gold-primary" /> {jurorName}
                                            </h4>
                                            <span className="text-[10px] font-bold text-gold-bright font-mono">
                                                Total: {Math.round(js.total_score || 0)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                            {details.map(({ key, label, color }) => {
                                                const detailData = js[key];
                                                if (!detailData || Object.keys(detailData).length === 0) return null;
                                                const subTotal = sumDetails(detailData);
                                                return (
                                                    <div key={key}>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
                                                            <span className={`text-[10px] font-bold font-mono ${color}`}>{Math.round(subTotal)}</span>
                                                        </div>
                                                        <table className="w-full text-left border-collapse text-[10px]">
                                                            <tbody className="divide-y divide-bronze-muted/5">
                                                                {Object.entries(detailData).map(([itemName, itemScore]) => (
                                                                    <tr key={itemName} className="hover:bg-white/[0.01]">
                                                                        <td className="py-0.5 pr-2 text-text-primary/80">{itemName}</td>
                                                                        <td className="py-0.5 text-right font-mono text-white font-semibold">{parseInt(itemScore).toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}