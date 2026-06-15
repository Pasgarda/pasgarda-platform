import { useState, useMemo, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Trophy, RefreshCw, BarChart2, Star, ShieldAlert, ChevronDown, ChevronUp, Flame, Download } from 'lucide-react';
import { getVotingBonusInfo, getCategoryTotal, categoryLabels, juryMembers as defaultJury } from '../../Utils/scoreUtils';
import ScoreGrid from '../../Components/ScoreGrid';

export default function ScoreFinal({
    event,
    contingents = [],
    scores = [],
    finalRoundScores = [],
    pbbItems: pbbItemsProp = {},
    pbbU12Items: pbbU12ItemsProp = {},
    dantonItems: dantonItemsProp = {},
    variasiItems: variasiItemsProp = {},
    formasiItems: formasiItemsProp = {},
    dantonVaforItems: dantonVaforItemsProp = {},
    juryMembers: juryMembersProp = {},
}) {
    const jm = useMemo(() => {
        if (juryMembersProp && Object.keys(juryMembersProp).length > 0) return juryMembersProp;
        return defaultJury;
    }, [juryMembersProp]);

    const saved = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('finalState')) : null;
    const [cat, setCat] = useState(saved?.cat || 'U16');
    const [expandedFinalist, setExpandedFinalist] = useState(saved?.expandedFinalist || null);
    const [selectedJuryIdx, setSelectedJuryIdx] = useState(saved?.selectedJuryIdx || 0);
    const [formData, setFormData] = useState({});
    const [saveCount, setSaveCount] = useState(0);
    const [loadKey, setLoadKey] = useState(0);
    const stateRef = useRef({ cat, expandedFinalist, selectedJuryIdx });
    stateRef.current = { cat, expandedFinalist, selectedJuryIdx };

    useEffect(() => {
        sessionStorage.removeItem('finalState');
    }, []);

    const hasFinalRound = cat === 'U16' || cat === 'U19';

    const juryTabs = [
        { type: 'pbb', num: 1, label: 'Juri 1 PBB', parts: ['pbb', 'danton'] },
        { type: 'pbb', num: 2, label: 'Juri 2 PBB', parts: ['pbb', 'danton'] },
        { type: 'pbb', num: 3, label: 'Juri 3 PBB', parts: ['pbb', 'danton'] },
        { type: 'vafor', num: 1, label: 'Juri 1 Vafor', parts: ['variasi', 'formasi', 'danton_vafor'] },
        { type: 'vafor', num: 2, label: 'Juri 2 Vafor', parts: ['variasi', 'formasi', 'danton_vafor'] },
        { type: 'penalty', num: null, label: 'Penalti', parts: ['penalties'] },
    ];

    const { auth } = usePage().props;
    const user = auth?.user;
    const isAdmin = ['super_admin', 'admin'].includes(user?.role);
    const userJuryNum = user?.jury_number;
    const isFullOperator = user?.role === 'operator_nilai' && userJuryNum === null;

    const filteredJuryTabs = useMemo(() => {
        if (isAdmin || isFullOperator) return juryTabs;
        const filtered = juryTabs.filter(tab => tab.num === userJuryNum);
        const penaltyTab = juryTabs.find(tab => tab.type === 'penalty');
        if (penaltyTab && !filtered.some(t => t.type === 'penalty')) {
            return [...filtered, penaltyTab];
        }
        return filtered;
    }, [isAdmin, isFullOperator, userJuryNum, juryTabs]);

    const activeJury = filteredJuryTabs[selectedJuryIdx] || filteredJuryTabs[0];
    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    useEffect(() => {
        if (filteredJuryTabs.length > 0 && selectedJuryIdx >= filteredJuryTabs.length) {
            setSelectedJuryIdx(0);
        }
    }, [filteredJuryTabs, selectedJuryIdx]);

    const isInputDisabled = useMemo(() => {
        if (isAdmin || isFullOperator) return false;
        if (activeJury.type === 'penalty') return false; // non-admin/operators with jury numbers can edit penalties
        
        // Match jury number
        if (userJuryNum !== activeJury.num) return true;

        // Match allowed tab for the jury number in final round
        if (userJuryNum === 3 && activeJury.type !== 'pbb') return true;

        return false;
    }, [isAdmin, isFullOperator, userJuryNum, activeJury]);

    const penaltyItems = useMemo(() => ({ penalties: 'Penalti' }), []);

    const sectionItems = {
        pbb: cat === 'U12' && Object.keys(pbbU12ItemsProp).length > 0 ? pbbU12ItemsProp : pbbItemsProp,
        danton: dantonItemsProp,
        variasi: variasiItemsProp,
        formasi: formasiItemsProp,
        danton_vafor: dantonVaforItemsProp,
        penalties: penaltyItems,
    };

    const sectionLabels = {
        pbb: 'Materi PBB',
        danton: 'Materi Danton',
        variasi: 'Variasi (Vafor)',
        formasi: 'Formasi (Vafor)',
        danton_vafor: 'Danton Vafor',
        penalties: 'Penalti',
    };

    const sectionSubmitKeys = {
        pbb: 'pbb_details',
        danton: 'danton_details',
        variasi: 'variasi_details',
        formasi: 'formasi_details',
        danton_vafor: 'danton_vafor_details',
        penalties: 'penalties',
    };

    const catContingents = useMemo(() =>
        contingents.filter(c => c.category_type === cat),
    [contingents, cat]);

    const sortedByVotes = useMemo(() =>
        [...contingents].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0)),
    [contingents]);

    const scoresList = useMemo(() =>
        contingents.filter(c => c.score).map(c => ({
            contingent_id: c.id,
            pbb_score: c.score.pbb_score,
            danton_score: c.score.danton_score,
        })),
    [contingents]);

    const catContingentsWithSelection = useMemo(() =>
        catContingents.map(c => {
            const pbb = c.score ? (parseInt(c.score.pbb_score) || 0) : 0;
            const danton = c.score ? (parseInt(c.score.danton_score) || 0) : 0;
            const vafor = c.score ? (parseInt(c.score.vafor_score) || 0) : 0;
            const p = c.score ? (parseInt(c.score.penalties_score) || 0) : 0;
            const info = getVotingBonusInfo(c.id, contingents, scoresList, sortedByVotes);
            const bonus = info.calculatedBonus || 0;
            return { ...c, selectionScore: pbb + danton + vafor + bonus - p, _pbb: pbb, _danton: danton, _vafor: vafor, _penalties: p, _nilaiKontingen: bonus };
        }),
    [catContingents, contingents, scoresList, sortedByVotes]);

    const sortedBySelection = useMemo(() =>
        [...catContingentsWithSelection].sort((a, b) => b.selectionScore - a.selectionScore),
    [catContingentsWithSelection]);

    const selectionTop8 = sortedBySelection.slice(0, 8);
    const finalist1 = sortedBySelection[0];
    const finalist2 = sortedBySelection[1];

    const f1Rec = finalist1 ? finalRoundScores.find(fs => fs.contingent_id === finalist1.id) : null;
    const f2Rec = finalist2 ? finalRoundScores.find(fs => fs.contingent_id === finalist2.id) : null;

    const isFinalist = (cId) => cId === finalist1?.id || cId === finalist2?.id;

    const loadExisting = () => {
        if (!expandedFinalist || !activeJury) {
            setFormData({});
            return;
        }
        const rec = finalRoundScores.find(fs => fs.contingent_id === expandedFinalist);
        const juryNum = activeJury.num;
        const loaded = {};
        for (const sec of activeJury.parts) {
            const submitKey = sectionSubmitKeys[sec];
            if (sec === 'penalties') {
                loaded[sec] = rec?.penalties ? { penalties: String(rec.penalties) } : {};
            } else {
                const dbKey = `juri_${juryNum}_${submitKey}`;
                const raw = rec?.[dbKey];
                loaded[sec] = (raw && typeof raw === 'object') ? { ...raw } : {};
            }
        }
        setFormData(loaded);
    };

    useEffect(() => {
        loadExisting();
    }, [expandedFinalist, selectedJuryIdx, loadKey]);

    const buildPayload = (data) => {
        const payload = {
            contingent_id: parseInt(expandedFinalist),
            jury_type: activeJury.type,
            jury_number: activeJury.num,
        };
        for (const sec of activeJury.parts) {
            const submitKey = sectionSubmitKeys[sec];
            const raw = data[sec] || {};
            if (sec === 'penalties') {
                payload.penalties = parseInt(raw.penalties) || 0;
            } else {
                const cleaned = {};
                for (const [k, v] of Object.entries(raw)) {
                    const n = parseInt(v);
                    if (!isNaN(n) && n >= 0) {
                        cleaned[k] = n;
                    }
                }
                payload[submitKey] = cleaned;
            }
        }
        return payload;
    };

    const saveToServer = (data) => {
        const payload = buildPayload(data);
        fetch(`/admin/events/${event.slug}/scores/final-round`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify(payload),
        }).then(() => setSaveCount(c => c + 1)).catch(err => console.error('Auto-save gagal:', err));
    };

    const handleItemChange = (sectionKey) => (updatedValues) => {
        setFormData(prev => {
            const next = { ...prev, [sectionKey]: { ...updatedValues } };
            saveToServer(next);
            return next;
        });
    };

    const voteTop8 = useMemo(() =>
        [...catContingents].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0)).slice(0, 8),
    [catContingents]);

    const saveStateAndRefresh = () => {
        const s = stateRef.current;
        sessionStorage.setItem('finalState', JSON.stringify({
            cat: s.cat,
            expandedFinalist: s.expandedFinalist,
            selectedJuryIdx: s.selectedJuryIdx,
        }));
        router.reload();
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.key === '\\' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                saveStateAndRefresh();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [cat, expandedFinalist]);

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title={`The Final - ${event.name}`} />

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Recap Room / Ruang Rekap Nilai
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            THE <span className="text-gold-primary">FINAL</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <button type="button" onClick={saveStateAndRefresh}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold bg-white/5 text-bronze-muted hover:text-white hover:bg-white/10 transition-all border border-bronze-muted/20">
                            <RefreshCw size={12} /> Refresh
                        </button>
                        <a href={`/admin/events/${event.slug}/scores/final/export`}
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-all border border-emerald-500/20">
                            <Download size={12} /> Download Excel
                        </a>
                        <a href={`/admin/events/${event.slug}`} className="px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">
                            ← Platform
                        </a>
                        <a href={`/admin/events/${event.slug}/scores/rekap`} className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">
                            Rekap
                        </a>
                        <span className="px-3.5 py-1.5 rounded text-xs font-bold bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border border-accent-burgundy/40">
                            THE FINAL
                        </span>
                        <a href={`/admin/events/${event.slug}/scores/daftar-nilai`} className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">
                            Daftar Nilai
                        </a>
                        <a href={`/admin/events/${event.slug}/scores/daftar-juara`} className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">
                            Daftar Juara
                        </a>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 bg-deep-black/40 p-1 rounded border border-bronze-muted/10 max-w-md">
                    {['U16', 'U19'].map((c) => (
                        <button key={c} type="button" onClick={() => { setCat(c); setExpandedFinalist(null); }}
                            className={`flex-1 py-1.5 text-center rounded text-xs font-bold transition-all uppercase ${
                                cat === c ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white shadow font-black' : 'text-bronze-muted hover:text-white'
                            }`}>
                            {categoryLabels[c] || c}
                        </button>
                    ))}
                </div>

                {catContingents.length === 0 ? (
                    <div className="p-8 bg-deep-black/40 border border-bronze-muted/10 rounded text-center">
                        <ShieldAlert className="h-10 w-10 text-gold-primary mx-auto mb-2 opacity-50" />
                        <h3 className="font-bold text-white text-xs uppercase">Tidak Ada Kontingen</h3>
                        <p className="text-[11px] text-bronze-muted mt-1">Tidak ada kontingen untuk kategori ini.</p>
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* Final Round Section */}
                        {hasFinalRound && finalist1 && finalist2 && (
                            <>
                                {/* Finalist Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[finalist1, finalist2].map((finalist, fi) => {
                                        const rec = fi === 0 ? f1Rec : f2Rec;
                                        const total = rec ? Math.round(parseInt(rec.total_score)) : 0;
                                        const pbb = rec ? parseInt(rec.pbb_score) || 0 : 0;
                                        const danton = rec ? parseInt(rec.danton_score) || 0 : 0;
                                        const vafor = rec ? parseInt(rec.vafor_score) || 0 : 0;
                                        const p = rec ? parseInt(rec.penalties) || 0 : 0;
                                        return (
                                            <div key={finalist.id} className={`p-5 rounded border ${fi === 0 ? 'border-gold-primary/30' : 'border-accent-mahogany/30'} bg-deep-black/60`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-gold-primary bg-gold-primary/10 px-2 py-0.5 rounded border border-gold-primary/20 uppercase">
                                                            {fi === 0 ? '🏆 Finalis 1' : '🥈 Finalis 2'}
                                                        </span>
                                                        <h4 className="text-sm font-black text-white mt-1">{finalist.school_name}</h4>
                                                        <p className="text-[10px] text-text-muted">{finalist.region} • {finalist.category_type}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-text-muted block">Nilai Seleksi</span>
                                                        <span className="font-black text-gold-primary font-mono text-sm">{Math.round(finalist.selectionScore)}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                                    <div className="p-2 bg-deep-black rounded border border-bronze-muted/10">
                                                        <span className="text-[9px] text-text-muted block">PBB Final</span>
                                                        <span className="font-bold font-mono text-gold-bright">{Math.round(pbb)}</span>
                                                    </div>
                                                    <div className="p-2 bg-deep-black rounded border border-bronze-muted/10">
                                                        <span className="text-[9px] text-text-muted block">Danton Final</span>
                                                        <span className="font-bold font-mono text-gold-light">{Math.round(danton)}</span>
                                                    </div>
                                                    <div className="p-2 bg-deep-black rounded border border-bronze-muted/10">
                                                        <span className="text-[9px] text-text-muted block">Vafor Final</span>
                                                        <span className="font-bold font-mono text-sky-400">{Math.round(vafor)}</span>
                                                    </div>
                                                    <div className="p-2 bg-deep-black rounded border border-bronze-muted/10">
                                                        <span className="text-[9px] text-text-muted block">Penalti</span>
                                                        <span className="font-bold font-mono text-accent-mahogany">-{Math.round(p)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-bronze-muted/10">
                                                    <span className="text-xs font-bold text-white uppercase">Total Skor Final</span>
                                                    <span className="font-black text-gold-primary font-mono text-lg">{total}</span>
                                                </div>
                                                <button type="button" onClick={() => { setExpandedFinalist(expandedFinalist === finalist.id ? null : finalist.id); setFormData({}); }}
                                                    className="mt-3 w-full py-1.5 rounded text-[10px] font-bold transition-all border border-gold-primary/30 text-gold-light hover:bg-gold-primary/10 flex items-center justify-center gap-1">
                                                    {expandedFinalist === finalist.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                    {expandedFinalist === finalist.id ? 'Tutup Input Juri' : 'Input / Edit Nilai Juri'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Jury Input Section with ScoreGrid */}
                                {expandedFinalist && (
                                    <div className="premium-card border-gold-primary/20 overflow-hidden bg-deep-black/40">
                                        <div className="px-4 py-3 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                                            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                                <Star className="h-3.5 w-3.5 text-gold-primary" /> Input Nilai Juri — {contingents.find(c => c.id === expandedFinalist)?.school_name || ''}
                                                {saveCount > 0 && <span key={saveCount} className="text-emerald-400 text-[10px] font-normal animate-pulse ml-2">Tersimpan ✓</span>}
                                            </h3>
                                        </div>

                                        {/* Jury Tabs */}
                                        <div className="flex gap-1 p-3 border-b border-bronze-muted/10 overflow-x-auto items-center">
                                            {filteredJuryTabs.map((tab, idx) => (
                                                <button key={`${tab.type}-${tab.num}`} type="button"
                                                    onClick={() => { setLoadKey(k => k + 1); setSelectedJuryIdx(idx); setFormData({}); }}
                                                    className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
                                                        selectedJuryIdx === idx ? 'bg-accent-maroon text-white shadow' : 'bg-white/5 text-bronze-muted hover:text-white'
                                                    }`}>
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* ScoreGrid Sections */}
                                        <div className="p-4 space-y-6">
                                            {activeJury.parts.map(sec => (
                                                <div key={`${sec}-${expandedFinalist}-${activeJury.num}`}>
                                                    <h4 className="text-[11px] font-bold text-gold-light mb-2 uppercase tracking-wider">
                                                        {sectionLabels[sec]}
                                                    </h4>
                                                    <ScoreGrid
                                                        items={sectionItems[sec] || {}}
                                                        values={formData[sec] || {}}
                                                        onChange={handleItemChange(sec)}
                                                        disabled={isInputDisabled}
                                                        sectionLabel={sectionLabels[sec]}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Final Score Comparison */}
                                {f1Rec && f2Rec && (
                                    <div className="premium-card border-gold-primary/20 overflow-hidden bg-deep-black/40">
                                        <div className="px-4 py-3 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                                            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                                <Flame className="h-3.5 w-3.5 text-gold-primary" /> Rekap Nilai The Final
                                            </h3>
                                        </div>
                                        <div className="overflow-x-auto p-4">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-bronze-muted/10">
                                                        <th className="pb-2 font-bold text-text-muted uppercase tracking-wider text-[10px]">Komponen</th>
                                                        <th className="pb-2 text-center font-bold text-gold-light uppercase tracking-wider text-[10px]">{finalist1.school_name}</th>
                                                        <th className="pb-2 text-center font-bold text-accent-mahogany uppercase tracking-wider text-[10px]">{finalist2.school_name}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-bronze-muted/5">
                                                    {[
                                                        { label: 'PBB (3 Juri)', key: 'pbb_score', color: 'text-gold-bright' },
                                                        { label: 'Danton (3 Juri)', key: 'danton_score', color: 'text-gold-light' },
                                                        { label: 'Vafor (2 Juri)', key: 'vafor_score', color: 'text-sky-400' },
                                                        { label: 'Penalti', key: 'penalties', color: 'text-accent-mahogany' },
                                                    ].map(({ label, key, color }) => {
                                                        const v1 = key === 'penalties' ? -(parseInt(f1Rec[key]) || 0) : Math.round(parseInt(f1Rec[key]) || 0);
                                                        const v2 = key === 'penalties' ? -(parseInt(f2Rec[key]) || 0) : Math.round(parseInt(f2Rec[key]) || 0);
                                                        return (
                                                            <tr key={key} className="hover:bg-white/[0.01]">
                                                                <td className="py-3 pr-4 font-semibold text-text-primary/80">{label}</td>
                                                                <td className={`py-3 text-center font-mono font-bold ${color}`}>{v1}</td>
                                                                <td className={`py-3 text-center font-mono font-bold ${color}`}>{v2}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-gold-primary/30">
                                                        <td className="py-3 pr-4 font-extrabold text-white uppercase tracking-wider text-xs">TOTAL</td>
                                                        <td className="py-3 text-center font-black text-gold-primary font-mono text-sm">
                                                            {Math.round(parseInt(f1Rec.total_score))}
                                                        </td>
                                                        <td className="py-3 text-center font-black text-gold-primary font-mono text-sm">
                                                            {Math.round(parseInt(f2Rec.total_score))}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                        <div className="px-4 py-2 border-t border-bronze-muted/5 text-[9px] text-text-muted italic">
                                            Total Skor Final = PBB + Danton + Vafor − Penalti.
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* No Final Round Info */}
                        {!hasFinalRound && (
                            <div className="premium-card p-6 border-gold-primary/20 text-center space-y-3 bg-deep-black/40">
                                <Trophy className="h-10 w-10 text-gold-primary mx-auto mb-2 opacity-75" />
                                <h3 className="font-bold text-white text-xs uppercase">Tidak Ada Babak Final</h3>
                                <p className="text-[11px] text-bronze-muted mt-1 leading-relaxed max-w-md mx-auto">
                                    Kategori {categoryLabels[cat] || cat} tidak memiliki pertandingan Babak Final. Pemenang ditentukan langsung dari perolehan nilai pada Babak Rekap.
                                </p>
                            </div>
                        )}

                        {/* Selection Table */}
                        {selectionTop8.length > 0 && (
                            <div className="premium-card border-gold-primary/20 overflow-hidden bg-deep-black/40">
                                <div className="px-4 py-3 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <Trophy className="h-3.5 w-3.5 text-gold-primary" /> Daftar Nilai Seleksi Finalis (Top 8)
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px]">
                                        <thead>
                                            <tr className="border-b border-bronze-muted/10 text-text-muted uppercase tracking-wider">
                                                <th className="p-3 font-bold">Rank</th>
                                                <th className="p-3 font-bold">Sekolah</th>
                                                <th className="p-3 font-bold text-right">PBB</th>
                                                <th className="p-3 font-bold text-right">Danton</th>
                                                <th className="p-3 font-bold text-right">Vafor</th>
                                                <th className="p-3 font-bold text-right">Penalti</th>
                                                <th className="p-3 font-bold text-right">Bonus Poin</th>
                                                <th className="p-3 font-bold text-right">Nilai Seleksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bronze-muted/5">
                                            {selectionTop8.map((c, idx) => (
                                                <tr key={c.id} className={`hover:bg-white/[0.02] transition-colors ${isFinalist(c.id) ? 'bg-gold-primary/[0.05]' : ''}`}>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`font-black font-mono ${idx < 2 ? 'text-gold-primary' : 'text-text-muted'}`}>
                                                                {idx + 1}
                                                            </span>
                                                            {isFinalist(c.id) && (
                                                                <span className="text-[8px] bg-gold-primary/20 text-gold-light px-1 rounded font-bold">⭐ FINALIS</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-bold text-white">{c.school_name}{c.is_reguler ? ' *' : ''}</td>
                                                    <td className="p-3 text-right font-mono text-gold-bright font-semibold">{Math.round(c._pbb)}</td>
                                                    <td className="p-3 text-right font-mono text-gold-light font-semibold">{Math.round(c._danton)}</td>
                                                    <td className="p-3 text-right font-mono text-sky-400 font-semibold">{Math.round(c._vafor)}</td>
                                                    <td className="p-3 text-right font-mono text-accent-mahogany font-semibold">-{Math.round(c._penalties)}</td>
                                                    <td className="p-3 text-right font-mono text-emerald-400 font-semibold">+{Math.round(c._nilaiKontingen)}</td>
                                                    <td className="p-3 text-right font-mono font-extrabold text-gold-light">{Math.round(c.selectionScore)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-4 py-2 border-t border-bronze-muted/5 text-[9px] text-text-muted">
                                    Nilai Seleksi = PBB + Danton + Vafor + Bonus Poin − Penalti. ⭐ = Finalis (2 besar lolos ke babak final).
                                </div>
                            </div>
                        )}

                        {/* Voting Bonus Table */}
                        {voteTop8.length > 0 && (
                            <div className="premium-card border-gold-primary/20 overflow-hidden bg-deep-black/40">
                                <div className="px-4 py-3 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <BarChart2 className="h-3.5 w-3.5 text-gold-primary" /> Klasemen Vote & Bonus Kontingen (Informasi)
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px]">
                                        <thead>
                                            <tr className="border-b border-bronze-muted/10 text-text-muted uppercase tracking-wider">
                                                <th className="p-3 font-bold">Vote Rank</th>
                                                <th className="p-3 font-bold">Sekolah</th>
                                                <th className="p-3 font-bold text-center">Suara</th>
                                                <th className="p-3 font-bold text-right">(PBB + Danton)</th>
                                                <th className="p-3 font-bold text-right">Bonus %</th>
                                                <th className="p-3 font-bold text-right">Bonus Poin</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bronze-muted/5">
                                            {voteTop8.map((c, idx) => {
                                                const info = getVotingBonusInfo(c.id, contingents, scoresList, sortedByVotes);
                                                const pbbDantSum = (c.score?.pbb_score || 0) + (c.score?.danton_score || 0);
                                                return (
                                                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="p-3 font-black font-mono text-gold-primary">{info.rank}</td>
                                                        <td className="p-3 font-bold text-white">{c.school_name}{c.is_reguler ? ' *' : ''}</td>
                                                        <td className="p-3 text-center font-mono text-gold-bright font-bold">{c.votes_count || 0}</td>
                                                        <td className="p-3 text-right font-mono text-gold-light font-semibold">{Math.round(pbbDantSum)}</td>
                                                        <td className="p-3 text-right font-mono text-violet-400 font-semibold">{info.percentage.toFixed(1)}%</td>
                                                        <td className="p-3 text-right font-mono text-violet-400 font-semibold">+{info.calculatedBonus.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-4 py-2 border-t border-bronze-muted/5 text-[9px] text-text-muted">
                                    Voting Bonus = (PBB + Danton) × Bonus %. Digunakan dalam Nilai Kontingen untuk seleksi finalis, bukan skor final.
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
