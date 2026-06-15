import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Award, FileText, CheckCircle2, ShieldAlert, AlertCircle, ArrowLeft, Trophy, User, MessageSquare, Search } from 'lucide-react';
import { migratePbbDetails } from '../../Utils/scoreUtils';

function sumObj(obj) {
    if (!obj) return 0;
    return Object.values(obj).reduce((s, v) => s + (parseInt(v) || 0), 0);
}

export default function MyScore({ event, contingent, score, pbbDetails, pbbItems = {}, pbbJuryScores = [], juryScores = null, allContingents = [], auth }) {
    const groupedJury = juryScores || {};

    const pbbMovementsList = useMemo(() => {
        return Object.values(pbbItems || {});
    }, [pbbItems]);


    const [searchQuery, setSearchQuery] = useState('');

    const filteredContingents = useMemo(() => {
        if (!searchQuery.trim()) return allContingents;
        const q = searchQuery.toLowerCase();
        return allContingents.filter(c =>
            c.school_name.toLowerCase().includes(q) ||
            c.region?.toLowerCase().includes(q) ||
            c.coach_name?.toLowerCase().includes(q)
        );
    }, [allContingents, searchQuery]);

    const waAdminNumber = '6282345678901';

    return (
        <div className="min-h-screen bg-checkerboard flex flex-col items-center justify-center p-4">
            <Head title="Private Scorecard" />

            <div className="w-full max-w-4xl premium-card p-6 md:p-8 border border-[#8C6828]/30 relative overflow-hidden my-8">
                {/* Decorative gold gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon"></div>

                {/* Back Button */}
                <div className="mb-6 flex justify-between items-center">
                    <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali Ke Event
                    </Link>
                    <span className="text-[10px] font-bold text-gold-cream border border-gold-primary/20 bg-accent-maroon/20 px-3 py-1 rounded-full uppercase">
                        Portal Perwakilan Kontingen (OTP Secured)
                    </span>
                </div>

                {contingent ? (
                    <div className="space-y-8">
                        {/* Contingent Header */}
                        <div className="text-center border-b border-bronze-muted/10 pb-6">
                            <div className="h-16 w-16 bg-accent-maroon/20 border border-gold-primary/30 rounded-full flex items-center justify-center text-xl font-extrabold text-gold-light mx-auto mb-3 uppercase">
                                {contingent.school_name.substring(0, 2)}
                            </div>
                            <h1 className="text-2xl font-extrabold text-white">
                                {contingent.school_name}
                                {contingent.is_reguler && (
                                    <span className="text-gold-cream text-sm ml-1.5 font-bold uppercase tracking-wider border border-gold-primary/20 bg-accent-maroon/20 px-2 py-0.5 rounded">
                                        *Reguler
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs text-text-muted mt-1.5 uppercase font-semibold tracking-wider">
                                Kategori {contingent.category_type} &bull; Wilayah {contingent.region}
                            </p>
                            <p className="text-[11px] text-bronze-muted mt-1 flex items-center justify-center gap-1">
                                <User className="h-3 w-3" /> Pelatih: {contingent.coach_name}
                            </p>
                        </div>

                        {score ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Left Side: Score Breakdown Card */}
                                <div className="space-y-6">
                                    <div className="premium-card p-6 border-gold-primary/30 text-center relative overflow-hidden bg-deep-black/60">
                                        <h3 className="text-xs font-bold text-gold-cream uppercase tracking-wider mb-2">
                                            Grand Total Nilai
                                        </h3>
                                        <span className="text-5xl font-black text-white font-mono block my-4">{Math.round(parseInt(score.grand_total))}</span>
                                        <span className="text-[10px] text-text-muted font-semibold block uppercase">
                                            Rekap
                                        </span>
                                    </div>

                                    <div className="premium-card p-4 border border-bronze-muted/10 bg-deep-black/40 space-y-3 text-xs">
                                        <h4 className="font-bold text-white uppercase tracking-wider border-b border-bronze-muted/10 pb-2 flex items-center gap-1">
                                            <FileText className="h-4 w-4 text-gold-primary" /> Rincian Nilai
                                        </h4>
                                        <div className="flex justify-between">
                                            <span className="text-text-primary/75">Jumlah Nilai PBB:</span>
                                            <span className="font-bold text-white font-mono">{Math.round(parseInt(score.pbb_score))}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-primary/75">Nilai Danton:</span>
                                            <span className="font-bold text-white font-mono">{Math.round(parseInt(score.danton_score))}</span>
                                        </div>

                                        {/* Per-juri breakdown (yang tidak bersifat audit tabel PBB) */}
                                        {(groupedJury?.pbb?.[1] || groupedJury?.pbb?.[2] || groupedJury?.pbb?.[3]) && (
                                            <div className="pt-2 border-t border-white/5">
                                                <div className="text-[10px] font-extrabold text-white uppercase tracking-wider mb-2">PBB + Danton per Juri</div>
                                                {[1, 2, 3].map((jNum) => {
                                                    const js = groupedJury?.pbb?.[jNum];
                                                    const pbbSum = js?.pbb_details ? Math.round(sumObj(js.pbb_details)) : 0;
                                                    const dantonSum = js?.danton_details ? Math.round(sumObj(js.danton_details)) : 0;
                                                    const total = pbbSum + dantonSum;
                                                    return (
                                                        <div key={jNum} className="flex justify-between text-xs mb-1">
                                                            <span className="text-text-muted">Juri {jNum}</span>
                                                            <span className="font-black text-white font-mono">{total}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {((groupedJury?.vafor?.[1]) || (groupedJury?.vafor?.[2])) && (
                                            <div className="pt-2 border-t border-white/5">
                                                <div className="text-[10px] font-extrabold text-white uppercase tracking-wider mb-2">Variasi & Formasi per Juri</div>
                                                {[1, 2].map((jNum) => {
                                                    const js = groupedJury?.vafor?.[jNum];
                                                    const variasSum = js?.variasi_details ? Math.round(sumObj(js.variasi_details)) : 0;
                                                    const formasiSum = js?.formasi_details ? Math.round(sumObj(js.formasi_details)) : 0;
                                                    const dantonVaforSum = js?.danton_vafor_details ? Math.round(sumObj(js.danton_vafor_details)) : 0;
                                                    const total = variasSum + formasiSum + dantonVaforSum;
                                                    return (
                                                        <div key={jNum} className="flex justify-between text-xs mb-1">
                                                            <span className="text-text-muted">Juri {jNum}</span>
                                                            <span className="font-black text-white font-mono">{total}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {((groupedJury?.makeup_kostum?.[1]) || (groupedJury?.makeup_kostum?.[2])) && (
                                            <div className="pt-2 border-t border-white/5">
                                                <div className="text-[10px] font-extrabold text-white uppercase tracking-wider mb-2">Kostum & Makeup per Juri</div>
                                                {[1, 2].map((jNum) => {
                                                    const js = groupedJury?.makeup_kostum?.[jNum];
                                                    const kostumSum = js?.kostum_details ? Math.round(sumObj(js.kostum_details)) : 0;
                                                    const makeupSum = js?.makeup_details ? Math.round(sumObj(js.makeup_details)) : 0;
                                                    const total = kostumSum + makeupSum;
                                                    return (
                                                        <div key={jNum} className="flex justify-between text-xs mb-1">
                                                            <span className="text-text-muted">Juri {jNum}</span>
                                                            <span className="font-black text-white font-mono">{total}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="flex justify-between">
                                            <span className="text-text-primary/75">Nilai Variasi & Formasi:</span>
                                            <span className="font-bold text-white font-mono">{Math.round(parseInt(score.vafor_score))}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-primary/75">Nilai Kostum:</span>
                                            <span className="font-bold text-white font-mono">{Math.round(parseInt(score.kostum_score))}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-primary/75">Nilai Makeup:</span>
                                            <span className="font-bold text-white font-mono">{Math.round(parseInt(score.makeup_score))}</span>
                                        </div>
                                        <div className="flex justify-between text-accent-mahogany font-semibold pt-1 border-t border-white/5">
                                            <span>Penalti Pengurangan:</span>
                                            <span className="font-mono">-{Math.round(parseInt(score.penalties_score))}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Poin 35: Score Visualization Diagram */}
                                <div className="md:col-span-3">
                                    <div className="premium-card p-4 border border-bronze-muted/10 bg-deep-black/40 mb-4">
                                        <h4 className="text-xs font-bold text-gold-light uppercase tracking-wider mb-3 flex items-center gap-1">
                                            <Award className="h-4 w-4 text-gold-primary" /> Diagram Skor Komponen
                                        </h4>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'PBB', score: parseInt(score.pbb_score), color: 'from-accent-maroon to-gold-primary' },
                                                { label: 'Danton', score: parseInt(score.danton_score), color: 'from-gold-primary to-gold-bright' },
                                                { label: 'Vafor', score: parseInt(score.vafor_score), color: 'from-gold-bright to-accent-maroon' },
                                            ].map(({ label, score, color }) => {
                                                const maxScore = Math.max(parseInt(score.pbb_score), parseInt(score.danton_score), parseInt(score.vafor_score), 1);
                                                const pct = (score / maxScore) * 100;
                                                return (
                                                    <div key={label}>
                                                        <div className="flex justify-between text-[10px] mb-1">
                                                            <span className="font-bold text-white">{label}</span>
                                                            <span className="font-mono text-gold-light font-bold">{Math.round(score)}</span>
                                                        </div>
                                                        <div className="w-full h-3 bg-deep-black rounded-full overflow-hidden border border-bronze-muted/10">
                                                            <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Audit Lembar Penilaian (dropdown + scroll) */}
                                <div className="md:col-span-3 space-y-4">
                                    <h3 className="text-sm font-bold text-gold-light uppercase tracking-wider border-b border-bronze-muted/20 pb-3 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-5 w-5 text-gold-primary" /> Audit Lembar Penilaian
                                    </h3>

                                    {/* Dropdown-style sections (no extra libraries) */}
                                    <div className="space-y-3">
                                        {/* PBB */}
                                        <details className="rounded-lg border border-bronze-muted/10 bg-deep-black/60 overflow-hidden" open>
                                            <summary className="cursor-pointer px-4 py-3 bg-accent-maroon/20 text-gold-light font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                                                <span>PBB + Danton (Audit Unsur) - {pbbMovementsList.length} unsur</span>
                                                <span className="text-gold-bright">▼</span>
                                            </summary>
                                            <div className="max-h-[360px] overflow-y-auto">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-bronze-muted/20 text-gold-light font-bold bg-black/10 sticky top-0">
                                                            <th className="p-3 w-12 text-center">No</th>
                                                            <th className="p-3">Unsur Gerakan</th>
                                                            <th className="p-3 text-center w-16">Juri 1</th>
                                                            <th className="p-3 text-center w-16">Juri 2</th>
                                                            <th className="p-3 text-center w-16">Juri 3</th>
                                                            <th className="p-3 text-center w-24 bg-gold-primary/10 text-gold-bright">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                                        {pbbMovementsList.map((movement, idx) => {
                                                            const getJuryScore = (jNum) => {
                                                                const js = groupedJury?.pbb?.[jNum];
                                                                const details = js?.pbb_details;
                                                                if (!details) return null;

                                                                const normalized = migratePbbDetails(details, pbbMovementsList);
                                                                const val = normalized[movement];
                                                                return (val !== undefined && val !== null && val !== '') ? parseInt(val) : null;
                                                            };

                                                            const scoreJ1 = getJuryScore(1);
                                                            const scoreJ2 = getJuryScore(2);
                                                            const scoreJ3 = getJuryScore(3);
                                                            const total = (scoreJ1 || 0) + (scoreJ2 || 0) + (scoreJ3 || 0);

                                                            return (
                                                                <tr key={idx} className="hover:bg-white/[0.02] transition-all">
                                                                    <td className="p-3 text-center text-text-muted font-bold font-mono">{idx + 1}</td>
                                                                    <td className="p-3 font-semibold text-white/90">{movement}</td>
                                                                    <td className="p-3 text-center font-mono font-medium">{scoreJ1 ?? '-'}</td>
                                                                    <td className="p-3 text-center font-mono font-medium">{scoreJ2 ?? '-'}</td>
                                                                    <td className="p-3 text-center font-mono font-medium">{scoreJ3 ?? '-'}</td>
                                                                    <td className="p-3 text-center font-mono font-bold bg-gold-primary/5 text-gold-primary">{total}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </details>

                                        {/* Vafor (Variasi + Formasi + Danton Vafor) */}
                                        <details className="rounded-lg border border-bronze-muted/10 bg-deep-black/60 overflow-hidden">
                                            <summary className="cursor-pointer px-4 py-3 bg-deep-black/40 text-gold-light font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                                                <span>Variasi + Formasi (Audit Unsur)</span>
                                                <span className="text-gold-bright">▼</span>
                                            </summary>
                                            <div className="max-h-[360px] overflow-y-auto px-4 py-3">
                                                {[1, 2].map((jNum) => {
                                                    const js = groupedJury?.vafor?.[jNum];
                                                    const varias = js?.variasi_details || {};
                                                    const formasi = js?.formasi_details || {};
                                                    const dantonVafor = js?.danton_vafor_details || {};
                                                    const keys = Array.from(new Set([...Object.keys(varias), ...Object.keys(formasi), ...Object.keys(dantonVafor)]));

                                                    if (keys.length === 0) return null;

                                                    return (
                                                        <div key={jNum} className="mb-4 last:mb-0">
                                                            <div className="text-xs font-extrabold uppercase tracking-wider text-white mb-2">Juri {jNum}</div>
                                                            <table className="w-full text-left border-collapse text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-bronze-muted/20 text-gold-light font-bold">
                                                                        <th className="p-2">Unsur</th>
                                                                        <th className="p-2 text-center">Variasi</th>
                                                                        <th className="p-2 text-center">Formasi</th>
                                                                        <th className="p-2 text-center">Danton Vafor</th>
                                                                        <th className="p-2 text-center bg-gold-primary/10 text-gold-bright">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                                                    {keys.map((k) => {
                                                                        const a = varias[k] ?? null;
                                                                        const b = formasi[k] ?? null;
                                                                        const c = dantonVafor[k] ?? null;
                                                                        const total = (parseInt(a) || 0) + (parseInt(b) || 0) + (parseInt(c) || 0);
                                                                        return (
                                                                            <tr key={k} className="hover:bg-white/[0.02] transition-all">
                                                                                <td className="p-2 font-semibold text-white/90">{k}</td>
                                                                                <td className="p-2 text-center font-mono">{a !== null ? parseInt(a) : '-'}</td>
                                                                                <td className="p-2 text-center font-mono">{b !== null ? parseInt(b) : '-'}</td>
                                                                                <td className="p-2 text-center font-mono">{c !== null ? parseInt(c) : '-'}</td>
                                                                                <td className="p-2 text-center font-mono font-bold bg-gold-primary/5 text-gold-primary">{total}</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </details>

                                        {/* Kostum & Makeup */}
                                        <details className="rounded-lg border border-bronze-muted/10 bg-deep-black/60 overflow-hidden">
                                            <summary className="cursor-pointer px-4 py-3 bg-deep-black/40 text-gold-light font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                                                <span>Kostum + Makeup (Audit Unsur)</span>
                                                <span className="text-gold-bright">▼</span>
                                            </summary>
                                            <div className="max-h-[360px] overflow-y-auto px-4 py-3">
                                                {[1, 2].map((jNum) => {
                                                    const js = groupedJury?.makeup_kostum?.[jNum];
                                                    const kostum = js?.kostum_details || {};
                                                    const makeup = js?.makeup_details || {};
                                                    const keys = Array.from(new Set([...Object.keys(kostum), ...Object.keys(makeup)]));

                                                    if (keys.length === 0) return null;

                                                    return (
                                                        <div key={jNum} className="mb-4 last:mb-0">
                                                            <div className="text-xs font-extrabold uppercase tracking-wider text-white mb-2">Juri {jNum}</div>
                                                            <table className="w-full text-left border-collapse text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-bronze-muted/20 text-gold-light font-bold">
                                                                        <th className="p-2">Unsur</th>
                                                                        <th className="p-2 text-center">Kostum</th>
                                                                        <th className="p-2 text-center">Makeup</th>
                                                                        <th className="p-2 text-center bg-gold-primary/10 text-gold-bright">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                                                    {keys.map((k) => {
                                                                        const a = kostum[k] ?? null;
                                                                        const b = makeup[k] ?? null;
                                                                        const total = (parseInt(a) || 0) + (parseInt(b) || 0);
                                                                        return (
                                                                            <tr key={k} className="hover:bg-white/[0.02] transition-all">
                                                                                <td className="p-2 font-semibold text-white/90">{k}</td>
                                                                                <td className="p-2 text-center font-mono">{a !== null ? parseInt(a) : '-'}</td>
                                                                                <td className="p-2 text-center font-mono">{b !== null ? parseInt(b) : '-'}</td>
                                                                                <td className="p-2 text-center font-mono font-bold bg-gold-primary/5 text-gold-primary">{total}</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-deep-black/40 border border-bronze-muted/10 rounded-lg">
                                <AlertCircle className="h-12 w-12 text-gold-primary mx-auto mb-3 opacity-60" />
                                <h3 className="font-bold text-white text-base">Lembar Nilai Masih Draf</h3>
                                <p className="text-xs text-text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
                                    Panitia/Juri recap room saat ini sedang menyusun dan menginput rekapitulasi penilaian kontingen Anda. 
                                    Detail skor akan langsung muncul di sini begitu panitia menyimpan data rekap.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="text-center py-8 bg-deep-black/40 border border-accent-mahogany/20 rounded-lg">
                            <ShieldAlert className="h-12 w-12 text-accent-mahogany mx-auto mb-3 opacity-60" />
                            <h3 className="font-bold text-white text-base">Akun Perwakilan Tidak Terhubung</h3>
                            <p className="text-xs text-text-muted mt-1.5 max-w-md mx-auto leading-relaxed">
                                Email Anda ({auth?.user?.email}) tidak terdaftar sebagai perwakilan/coach dari kontingen mana pun di event ini.
                            </p>
                        </div>

                        {/* WhatsApp Contact Information Card */}
                        <div className="premium-card p-5 border border-emerald-500/30 bg-emerald-950/20 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                            <div className="text-left space-y-1">
                                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Belum Terdaftar Sebagai Pelatih?
                                </h4>
                                <p className="text-[11px] text-text-muted leading-relaxed max-w-xl">
                                    Jika sekolah Anda terdaftar di bawah tetapi email atau nama pelatih belum sesuai, silakan hubungi kesekretariatan panitia via WhatsApp untuk mengaitkan akun Anda agar dapat mengakses Portal Pelatih.
                                </p>
                            </div>
                            <a 
                                href={`https://wa.me/${waAdminNumber}?text=Halo%20panitia%20PASGARDA%2C%20saya%20pelatih%20dari%20(mohon%20diisi%20nama%20kontingen)%20ingin%20meminta%20bantuan%20untuk%20menghubungkan%20email%20akun%20saya%20${encodeURIComponent(auth?.user?.email || '')}%20ke%20Portal%20Pelatih%20agar%20dapat%20mengaudit%20lembar%20nilai%20privat%20kontingen%20kami.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span>Hubungi WA Admin</span>
                            </a>
                        </div>

                        {/* List of Schools and Coach Assignments */}
                        <div className="premium-card p-6 border border-bronze-muted/20 bg-deep-black/60">
                            <div className="border-b border-bronze-muted/10 pb-4 mb-4">
                                <h3 className="text-sm font-bold text-gold-light uppercase tracking-wider">
                                    Daftar Sekolah & Hubungan Akun Pelatih
                                </h3>
                                <p className="text-[10px] text-text-muted mt-0.5">
                                    Berikut adalah daftar sekolah terdaftar dan email coach yang berhak melihat lembar nilai privat.
                                </p>
                                {/* Search */}
                                <div className="relative mt-3">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                                    <input type="text" value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari nama sekolah, region, atau coach..."
                                        className="w-full pl-8 pr-3 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-bronze-muted/10 text-[9px] uppercase tracking-wider text-text-muted">
                                            <th className="py-2.5 px-3">Nama Sekolah</th>
                                            <th className="py-2.5 px-3">Kategori</th>
                                            <th className="py-2.5 px-3">Nama Coach / Pelatih</th>
                                            <th className="py-2.5 px-3">Email Terdaftar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                        {filteredContingents.length === 0 && searchQuery.trim() ? (
                                            <tr>
                                                <td colSpan="4" className="py-8 text-center text-text-muted italic">
                                                    Tidak ada kontingen yang cocok dengan pencarian "{searchQuery}".
                                                </td>
                                            </tr>
                                        ) : filteredContingents.map((con) => {
                                            return (
                                                <tr key={con.id} className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="py-3 px-3 font-semibold text-white">
                                                        {con.school_name}
                                                    </td>
                                                    <td className="py-3 px-3 font-mono text-text-muted">
                                                        {con.category_type}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        {con.coach_name || '-'}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        {con.coach_email ? (
                                                            <span className="text-gold-light/95 font-medium">{con.coach_email}</span>
                                                        ) : (
                                                            <span className="text-accent-mahogany font-bold italic bg-accent-mahogany/10 px-2 py-0.5 rounded text-[10px]">
                                                                Belum Terdaftar
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {allContingents.length === 0 && !searchQuery.trim() && (
                                            <tr>
                                                <td colSpan="4" className="py-8 text-center text-text-muted italic">
                                                    Belum ada kontingen terdaftar untuk event ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
