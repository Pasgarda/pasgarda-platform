import { useState, useMemo, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Award, ShieldAlert, ChevronDown, ChevronUp, CheckSquare, Trash2, Lock, Unlock, Download, RefreshCw } from 'lucide-react';
import { juryMembers as defaultJury } from '../../Utils/scoreUtils';
import ScoreGrid from '../../Components/ScoreGrid';
import ScrollReveal from '../../Components/ScrollReveal';

export default function ScoreRekap({
    event, contingents = [], scores = [], juryScores = [],
    pbbItems = {}, pbbU12Items = {}, dantonItems = {},
    variasiItems = {}, formasiItems = {}, dantonVaforItems = {},
    kostumItems = {}, makeupItems = {},
    juryMembers: juryMembersProp = {},
}) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const isAdmin = ['super_admin', 'admin'].includes(user?.role);
    const userJuryNum = user?.jury_number;
    const isFullOperator = user?.role === 'operator_nilai' && userJuryNum === null;
    const isPenaltyOnly = user?.email === 'nilai@pasgarda.com';

    const allowedTabs = useMemo(() => {
        if (isPenaltyOnly) return ['penalti'];
        if (isAdmin || isFullOperator) return ['pbb', 'vafor', 'makeup_kostum', 'penalti'];
        if (userJuryNum) return ['pbb', 'vafor', 'makeup_kostum'];
        return [];
    }, [isAdmin, isFullOperator, userJuryNum, isPenaltyOnly]);

    const canAccessJuryNum = (n) => {
        if (isAdmin || isFullOperator) return true;
        return userJuryNum === n;
    };

    const jm = useMemo(() => {
        if (juryMembersProp && Object.keys(juryMembersProp).length > 0) return juryMembersProp;
        return defaultJury;
    }, [juryMembersProp]);

    const saved = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('rekapState')) : null;
    const [cat, setCat] = useState(saved?.cat || 'U16');
    const [contingentId, setContingentId] = useState(saved?.contingentId || '');
    const [juryCat, setJuryCat] = useState(saved?.juryCat || 'pbb');
    const [juryNum, setJuryNum] = useState(saved?.juryNum || userJuryNum || 1);
    const [expandedSections, setExpandedSections] = useState({});

    useEffect(() => {
        sessionStorage.removeItem('rekapState');
    }, []);

    const [formData, setFormData] = useState({});
    const [saveCount, setSaveCount] = useState(0);
    const [loadKey, setLoadKey] = useState(0);
    const stateRef = useRef({ cat, contingentId, juryCat, juryNum });
    stateRef.current = { cat, contingentId, juryCat, juryNum };

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isExpanded = (key) => expandedSections[key] !== false;

    const pbbMap = cat === 'U12' && Object.keys(pbbU12Items).length > 0 ? pbbU12Items : pbbItems;

    const juryTypes = [
        { key: 'pbb', label: 'PBB', sections: ['pbb', 'danton'], numbers: 3 },
        { key: 'vafor', label: 'Vafor', sections: ['variasi', 'formasi', 'danton_vafor'], numbers: 2 },
        { key: 'makeup_kostum', label: 'Kostum & Makeup', sections: ['kostum', 'makeup'], numbers: 2 },
        { key: 'penalti', label: 'Penalti', sections: ['penalties'], numbers: 0 },
    ];

    const activeJury = juryTypes.find(j => j.key === juryCat);

    const penaltyItems = { penalty_score: 'Penalti Global', kostum_penalty: 'Penalti Kostum' };

    const sectionItems = {
        pbb: pbbMap,
        danton: dantonItems,
        variasi: variasiItems,
        formasi: formasiItems,
        danton_vafor: dantonVaforItems,
        kostum: kostumItems,
        makeup: makeupItems,
        penalties: penaltyItems,
    };

    const sectionLabels = {
        pbb: 'Materi PBB',
        danton: 'Materi Danton',
        variasi: 'Variasi (Vafor)',
        formasi: 'Formasi (Vafor)',
        danton_vafor: 'Danton Vafor',
        kostum: 'Materi Kostum',
        makeup: 'Materi Make Up',
        penalties: 'Penalti',
    };

    const sectionIcons = {
        pbb: '🏃',
        danton: '📢',
        variasi: '🔄',
        formasi: '🔲',
        danton_vafor: '🎯',
        kostum: '👔',
        makeup: '💄',
        penalties: '⚠️',
    };

    const sectionSubmitKeys = {
        pbb: 'pbb_details',
        danton: 'danton_details',
        variasi: 'variasi_details',
        formasi: 'formasi_details',
        danton_vafor: 'danton_vafor_details',
        kostum: 'kostum_details',
        makeup: 'makeup_details',
    };

    const juryName = jm[juryCat]?.[juryNum - 1]?.name || `Juri ${juryNum}`;

    const buildPayload = (data) => {
        const payload = {
            contingent_id: parseInt(contingentId),
            jury_type: juryCat,
            jury_number: juryNum,
        };
        const sections = activeJury?.sections || [];
        for (const sec of sections) {
            if (sec === 'penalties') continue;
            const submitKey = sectionSubmitKeys[sec];
            const raw = data[sec] || {};
            const cleaned = {};
            for (const [k, v] of Object.entries(raw)) {
                const n = parseInt(v);
                if (!isNaN(n) && n >= 0) {
                    cleaned[k] = n;
                }
            }
            payload[submitKey] = cleaned;
        }
        return payload;
    };

    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const saveToServer = (data) => {
        fetch(`/admin/events/${event.slug}/scores/jury`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify(buildPayload(data)),
        }).then(() => setSaveCount(c => c + 1)).catch(err => console.error('Auto-save gagal:', err));
    };

    const handleItemChange = (sectionKey) => (updatedValues) => {
        if (sectionKey === 'penalties') {
            setFormData(prev => {
                const next = { ...prev, penalties: { ...updatedValues } };
                setTimeout(() => savePenalties(next.penalties), 0);
                return next;
            });
            return;
        }
        setFormData(prev => {
            const next = { ...prev, [sectionKey]: { ...updatedValues } };
            saveToServer(next);
            return next;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveToServer(formData);
    };

    const selScore = scores.find(s => s.contingent_id === parseInt(contingentId));
    const selJuryScores = juryScores.filter(js =>
        js.contingent_id === parseInt(contingentId) &&
        js.jury_type === juryCat &&
        js.jury_number === juryNum
    );
    const existingJury = selJuryScores[0];

    const selContingent = contingents.find(c => c.id === parseInt(contingentId));

    const catContingents = contingents.filter(c => c.category_type === cat);

    const filteredScores = useMemo(() => {
        return [...scores]
            .filter(s => s.contingent?.category_type === cat)
            .sort((a, b) => parseInt(b.grand_total) - parseInt(a.grand_total));
    }, [scores, cat]);

    const loadExisting = () => {
        const loaded = {};
        const sections = juryTypes.find(j => j.key === juryCat)?.sections || [];
        for (const sec of sections) {
            if (sec === 'penalties') {
                loaded[sec] = {
                    penalty_score: selScore?.penalties_score?.toString() || '',
                    kostum_penalty: selScore?.kostum_penalty?.toString() || '',
                };
            } else {
                const detailsKey = sectionSubmitKeys[sec];
                const raw = existingJury?.[detailsKey];
                loaded[sec] = (raw && typeof raw === 'object') ? { ...raw } : {};
            }
        }
        setFormData(loaded);
    };

    useEffect(() => {
        loadExisting();
    }, [contingentId, juryCat, juryNum, loadKey]);

    const saveStateAndRefresh = () => {
        const s = stateRef.current;
        sessionStorage.setItem('rekapState', JSON.stringify({ cat: s.cat, contingentId: s.contingentId, juryCat: s.juryCat, juryNum: s.juryNum }));
        router.reload({ preserveScroll: true });
    };

    useEffect(() => {
        const handleKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === '\\') {
                e.preventDefault();
                saveStateAndRefresh();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [saveStateAndRefresh]);

    const savePenalties = (penaltyData) => {
        if (!contingentId) return;
        const p = penaltyData || {};
        const cid = parseInt(contingentId);
        const headers = { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' };
        const slug = event.slug;
        Promise.all([
            fetch(`/admin/events/${slug}/scores/penalty`, {
                method: 'POST', headers,
                body: JSON.stringify({ contingent_id: cid, penalties: parseInt(p.penalty_score) || 0 }),
            }),
            fetch(`/admin/events/${slug}/scores/kostum-penalty`, {
                method: 'POST', headers,
                body: JSON.stringify({ contingent_id: cid, kostum_penalty: parseInt(p.kostum_penalty) || 0 }),
            }),
        ]).then(() => setSaveCount(c => c + 1)).catch(err => console.error('Penalty save gagal:', err));
    };

    const isLocked = (selScore?.is_locked ?? false);

    const handleToggleLock = () => {
        if (!contingentId) return;
        router.post(`/admin/events/${event.slug}/scores/toggle-lock`, {
            contingent_id: parseInt(contingentId),
        }, { preserveScroll: true, preserveState: true });
    };

    const handleReset = () => {
        if (!contingentId) return;
        if (!confirm(`Hapus semua nilai rekap untuk ${selContingent?.school_name || 'kontingen ini'}?`)) return;
        router.post(`/admin/events/${event.slug}/scores/reset-contingent`, {
            contingent_id: parseInt(contingentId),
        }, { preserveScroll: true, preserveState: true });
    };

    const sectionEntries = activeJury?.sections || [];

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title={`Input Nilai - ${event.name}`} />

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Input Penilaian
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            <span className="text-gold-primary">Rekap</span> Nilai
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name}</p>
                    </div>
                     <div className="flex items-center gap-2 mt-4 md:mt-0 flex-wrap">
                         <a href={`/admin/events/${event.slug}`} className="px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">
                             ← Dashboard Event
                         </a>
                        <span className="px-3.5 py-1.5 rounded text-xs font-bold bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border border-accent-burgundy/40">
                            Rekap
                        </span>
                        <a href={`/admin/events/${event.slug}/scores/final`} className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">
                            THE FINAL
                        </a>
                        <a href={`/admin/events/${event.slug}/scores/daftar-nilai`} className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">
                            Daftar Nilai
                        </a>
                        <a href={`/admin/events/${event.slug}/scores/daftar-juara`} className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">
                            Daftar Juara
                        </a>
                    </div>
                </div>

                {/* Category & Contingent Picker */}
                <div className="premium-card border border-bronze-muted/20 bg-deep-black/60 rounded p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Kategori</label>
                            <div className="flex gap-1.5">
                                {['U12', 'U16', 'U19', 'Purna'].map(c => (
                                    <button key={c} type="button" onClick={() => { setLoadKey(k => k + 1); setCat(c); setContingentId(''); setFormData({}); }}
                                        className={`px-4 py-1.5 rounded text-xs font-bold transition-all border ${cat === c ? 'bg-gold-primary text-deep-black border-gold-primary' : 'bg-white/5 text-text-muted border-transparent hover:text-white hover:border-gold-primary/30'}`}>
                                        {c === 'U12' ? 'SD (U-12)' : c === 'U16' ? 'SMP (U-16)' : c === 'U19' ? 'SMA (U-19)' : 'Purna'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Kontingen</label>
                            <select value={contingentId} onChange={(e) => { setLoadKey(k => k + 1); setContingentId(e.target.value); setFormData({}); }}
                                className="w-full bg-deep-black border border-bronze-muted/20 rounded px-3 py-1.5 text-xs text-white font-mono focus:border-gold-primary/50 focus:outline-none">
                                <option value="">-- Pilih Kontingen --</option>
                                {catContingents.map(c => (
                                    <option key={c.id} value={c.id}>{c.school_name} — {c.region}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Rekap Scores Table */}
                <div className="premium-card overflow-hidden border border-bronze-muted/10">
                    <div className="p-3 bg-accent-maroon/5 border-b border-bronze-muted/10 space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white text-xs flex items-center gap-2">
                                Hasil Rekapitulasi Skor
                            </h3>
                             <div className="flex items-center gap-2">
                                <button type="button" onClick={saveStateAndRefresh} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold bg-white/5 text-bronze-muted hover:text-white hover:bg-white/10 transition-all border border-transparent">
                                    <RefreshCw className="h-3 w-3" /> Refresh
                                </button>
                                <a href={`/admin/events/${event.slug}/scores/rekap/export`}
                                   className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-all border border-emerald-500/20">
                                    <Download size={12} /> Download Excel
                                </a>
                            </div>
                        </div>
                        <div className="flex gap-3 text-[10px]">
                            {(() => {
                                const total = catContingents.length;
                                const scored = filteredScores.filter(s => parseInt(s.grand_total) > 0).length;
                                const inputted = filteredScores.length;
                                const remaining = total - inputted;
                                return (
                                    <>
                                        <span className="text-text-muted">Total: <strong className="text-white">{total}</strong> kontingen</span>
                                        <span className="text-text-muted">Diinput: <strong className="text-gold-light">{inputted}</strong></span>
                                        <span className="text-text-muted">Selesai Dinilai: <strong className="text-emerald-400">{scored}</strong></span>
                                        <span className={`${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            Kurang: <strong>{remaining}</strong> kontingen
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                    <div className="overflow-x-auto text-[10px] scroll-smooth">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                    <th className="p-2 text-text-muted font-bold uppercase">Kontingen</th>
                                    <th className="p-2 text-text-muted font-bold uppercase text-center">Kat</th>
                                    <th className="p-2 text-text-muted font-bold uppercase text-center">PBB</th>
                                    <th className="p-2 text-text-muted font-bold uppercase text-center">Danton</th>
                                    <th className="p-2 text-text-muted font-bold uppercase text-center">Vafor</th>
                                    <th className="p-2 text-text-muted font-bold uppercase text-center">Kostum</th>
                                    <th className="p-2 text-text-muted font-bold uppercase text-center">Peng.Kos</th>
                                    <th className="p-2 text-text-muted font-bold uppercase text-center">Makeup</th>
                                    <th className="p-2 text-text-muted font-bold uppercase text-center">Penalti</th>
                                    <th className="p-2 text-text-muted font-bold uppercase text-right">Grand Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bronze-muted/10 text-white/90">
                                {filteredScores.length > 0 ? (
                                    filteredScores.map((s) => (
                                        <tr key={s.id} className="hover:bg-white/[0.01] cursor-pointer" onClick={() => { setLoadKey(k => k + 1); setContingentId(String(s.contingent_id)); setFormData({}); }}>
                                            <td className="p-2 font-semibold text-white truncate max-w-40" onClick={(e) => { e.stopPropagation(); setLoadKey(k => k + 1); setContingentId(String(s.contingent_id)); setFormData({}); }}>
                                                {s.contingent?.school_name}{s.contingent?.is_reguler ? ' *' : ''}
                                            </td>
                                            <td className="p-2 text-text-muted font-bold text-center">{s.contingent?.category_type}</td>
                                            <td className="p-2 text-center font-mono cursor-pointer hover:text-gold-primary" onClick={(e) => { e.stopPropagation(); setLoadKey(k => k + 1); setContingentId(String(s.contingent_id)); setJuryCat('pbb'); setJuryNum(isAdmin || isFullOperator ? 1 : (userJuryNum || 1)); setFormData({}); }}>{parseInt(s.pbb_score)}</td>
                                            <td className="p-2 text-center font-mono cursor-pointer hover:text-gold-primary" onClick={(e) => { e.stopPropagation(); setLoadKey(k => k + 1); setContingentId(String(s.contingent_id)); setJuryCat('pbb'); setJuryNum(isAdmin || isFullOperator ? 1 : (userJuryNum || 1)); setFormData({}); }}>{parseInt(s.danton_score)}</td>
                                            <td className="p-2 text-center font-mono cursor-pointer hover:text-gold-primary" onClick={(e) => { e.stopPropagation(); setLoadKey(k => k + 1); setContingentId(String(s.contingent_id)); setJuryCat('vafor'); setJuryNum(isAdmin || isFullOperator ? 1 : (userJuryNum || 1)); setFormData({}); }}>{parseInt(s.vafor_score)}</td>
                                            <td className="p-2 text-center font-mono cursor-pointer hover:text-gold-primary" onClick={(e) => { e.stopPropagation(); setLoadKey(k => k + 1); setContingentId(String(s.contingent_id)); setJuryCat('makeup_kostum'); setJuryNum(isAdmin || isFullOperator ? 1 : (userJuryNum || 1)); setFormData({}); }}>{parseInt(s.kostum_score) - (parseInt(s.kostum_penalty) || 0)}</td>
                                            <td className="p-2 text-center font-mono text-amber-400 cursor-pointer hover:text-gold-primary" onClick={(e) => { e.stopPropagation(); setLoadKey(k => k + 1); setContingentId(String(s.contingent_id)); setJuryCat('penalti'); setJuryNum(1); setFormData({}); }}>{(parseInt(s.kostum_penalty) || 0) > 0 ? parseInt(s.kostum_penalty) : '-'}</td>
                                            <td className="p-2 text-center font-mono cursor-pointer hover:text-gold-primary" onClick={(e) => { e.stopPropagation(); setLoadKey(k => k + 1); setContingentId(String(s.contingent_id)); setJuryCat('makeup_kostum'); setJuryNum(isAdmin || isFullOperator ? 1 : (userJuryNum || 1)); setFormData({}); }}>{parseInt(s.makeup_score)}</td>
                                            <td className="p-2 text-center font-mono text-accent-mahogany font-bold cursor-pointer hover:text-gold-primary" onClick={(e) => { e.stopPropagation(); setLoadKey(k => k + 1); setContingentId(String(s.contingent_id)); setJuryCat('penalti'); setJuryNum(1); setFormData({}); }}>{parseInt(s.penalties_score) > 0 ? `-${parseInt(s.penalties_score)}` : '-'}</td>
                                            <td className="p-2 text-right font-extrabold text-gold-bright font-mono">{parseInt(s.grand_total)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={11} className="p-4 text-center text-bronze-muted italic">
                                            Belum ada skor untuk kategori {cat === 'U12' ? 'SD (U-12)' : cat === 'U16' ? 'SMP (U-16)' : cat === 'U19' ? 'SMA (U-19)' : 'Purna'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Jury Type & Number Tabs */}
                {contingentId && (
                    <div className="flex flex-wrap items-center gap-2">
                        {juryTypes.map(jt => {
                            if (!allowedTabs.includes(jt.key)) return null;
                            return (
                                <button key={jt.key} type="button" onClick={() => { setLoadKey(k => k + 1); setJuryCat(jt.key); setJuryNum(isAdmin || isFullOperator ? 1 : (userJuryNum || 1)); setFormData({}); }}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${juryCat === jt.key ? 'bg-accent-maroon text-white border-accent-maroon' : 'bg-white/5 text-text-muted border-transparent hover:text-white'}`}>
                                    {jt.label}
                                </button>
                            );
                        })}
                        {activeJury?.numbers > 0 && (
                            <span className="text-text-muted text-[10px] mx-1">|</span>
                        )}
                        {Array.from({ length: activeJury?.numbers || 0 }, (_, i) => i + 1).map(n => {
                            if (!canAccessJuryNum(n)) return null;
                            const nm = jm[juryCat]?.[n - 1]?.name || `Juri ${n}`;
                            return (
                                <button key={n} type="button" onClick={() => { setLoadKey(k => k + 1); setJuryNum(n); setFormData({}); }}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${juryNum === n ? 'bg-gold-primary text-deep-black border-gold-primary' : 'bg-white/5 text-text-muted border-transparent hover:text-white'}`}>
                                    {n}. {nm}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Main Content */}
                {contingentId && (
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* Left: Form Sections */}
                        <div className="flex-1 space-y-4">
                            <form onSubmit={handleSubmit}>
                                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''} />

                                {sectionEntries.map(sec => {
                                    const items = sectionItems[sec];
                                    const entries = Object.entries(items);
                                    if (entries.length === 0) return null;

                                    return (
                                        <div key={`${sec}-${contingentId}-${juryCat}-${juryNum}`} className="premium-card border border-bronze-muted/20 bg-deep-black/60 rounded overflow-hidden mb-4">
                                            <button type="button" onClick={() => toggleSection(sec)}
                                                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-accent-maroon/40 to-transparent border-b border-bronze-muted/10 hover:bg-accent-maroon/30 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{sectionIcons[sec]}</span>
                                                    <span className="text-xs font-bold text-gold-light uppercase tracking-wider">
                                                        {sectionLabels[sec]}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted font-mono">({entries.length} item)</span>
                                                </div>
                                                {isExpanded(sec) ? <ChevronUp className="h-3.5 w-3.5 text-text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-text-muted" />}
                                            </button>
                                            {isExpanded(sec) && (
                                                <div className="p-3">
                                                    <ScoreGrid
                                                        items={items}
                                                        values={formData[sec] || {}}
                                                        onChange={handleItemChange(sec)}
                                                        disabled={isLocked}
                                                        sectionLabel={sectionLabels[sec]}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Auto-save status */}
                                <div className="flex items-center gap-3 pt-2">
                                    {isLocked && (
                                        <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                                            <Lock className="h-3 w-3" /> Terkunci
                                        </span>
                                    )}
                                    {existingJury && (
                                        <span className="text-[10px] text-emerald-400 font-mono">
                                            Tersimpan — {juryName}
                                            {saveCount > 0 && <span key={saveCount} className="text-emerald-400 text-[10px] font-normal animate-pulse ml-2">✓</span>}
                                        </span>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Right: Summary Panel */}
                        <div className="w-full lg:w-80 shrink-0">
                            <div className="sticky top-6 space-y-4">

                                {/* Score Breakdown */}
                                <div className="premium-card border border-gold-primary/20 bg-deep-black/60 rounded overflow-hidden">
                                    <div className="p-3 bg-gradient-to-r from-accent-maroon/60 to-accent-burgundy/60 border-b border-bronze-muted/10">
                                        <h3 className="text-xs font-bold text-gold-light uppercase tracking-wider">Rekapitulasi</h3>
                                        <p className="text-[9px] text-text-muted mt-0.5 font-mono">{selContingent?.school_name || '-'}</p>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {[
                                            { key: 'pbb_score', label: 'PBB' },
                                            { key: 'danton_score', label: 'Danton' },
                                            { key: 'variasi_score', label: 'Variasi' },
                                            { key: 'formasi_score', label: 'Formasi' },
                                            { key: 'danton_vafor_score', label: 'Dn. Vafor' },
                                            { key: 'kostum_score', label: 'Kostum (Net)', display: (s) => parseInt(s.kostum_score) - (parseInt(s.kostum_penalty) || 0) },
                                            { key: 'makeup_score', label: 'Makeup' },
                                        ].map(({ key, label, display }) => {
                                            const v = display ? (selScore ? display(selScore) : 0) : (selScore ? parseInt(selScore[key]) || 0 : 0);
                                            return (
                                                <div key={key} className="flex justify-between items-center text-xs">
                                                    <span className="text-text-muted">{label}</span>
                                                    <span className="font-bold font-mono text-white">{v}</span>
                                                </div>
                                            );
                                        })}

                                        <hr className="border-bronze-muted/10 my-2" />

                                        {[
                                            { label: 'Kostum Penalty', key: 'kostum_penalty' },
                                        ].map(({ label, key }) => (
                                            <div key={key} className="flex justify-between items-center text-xs">
                                                <span className="text-text-muted">{label}</span>
                                                <span className="font-bold font-mono text-accent-mahogany">{selScore ? parseInt(selScore[key]) || 0 : 0}</span>
                                            </div>
                                        ))}

                                        <hr className="border-bronze-muted/10 my-2" />

                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-text-muted">Penalti Global</span>
                                            <span className="font-bold font-mono text-red-400">{selScore ? parseInt(selScore.penalties_score) || 0 : 0}</span>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t-2 border-gold-primary/30">
                                            <span className="text-sm font-bold text-white uppercase tracking-wider">GRAND TOTAL</span>
                                            <span className="text-xl font-black font-mono text-gold-primary">
                                                {selScore ? parseInt(selScore.grand_total) || 0 : 0}
                                            </span>
                                        </div>
                                        {contingentId && (
                                            <div className="flex gap-2 mt-2">
                                                <a href={`/admin/events/${event.slug}/scores/rekap/export/${contingentId}`}
                                                   className="flex-1 px-3 py-1.5 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25">
                                                    <Download size={12} /> Download Excel
                                                </a>
                                                <a href={`/admin/events/${event.slug}/scores/rekap/export/${contingentId}/pdf`}
                                                   className="flex-1 px-3 py-1.5 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/25">
                                                    <Download size={12} /> Download PDF
                                                </a>
                                            </div>
                                        )}
                                        {(isAdmin || isFullOperator) && (
                                            <button type="button" onClick={handleToggleLock}
                                                className={`w-full mt-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 border ${selScore?.is_locked ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25' : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'}`}>
                                                {selScore?.is_locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                                {selScore?.is_locked ? 'Buka Kunci' : 'Kunci Nilai'}
                                            </button>
                                        )}
                                        {(isAdmin || isFullOperator) && !selScore?.is_locked && (
                                            <button type="button" onClick={handleReset}
                                                className="w-full mt-2 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5">
                                                <Trash2 className="h-3 w-3" /> Hapus Nilai Kontingen
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Jury Breakdown */}
                                <div className="premium-card border border-bronze-muted/20 bg-deep-black/60 rounded overflow-hidden">
                                    <div className="w-full p-3 bg-gradient-to-r from-accent-maroon/40 to-transparent border-b border-bronze-muted/10 flex items-center justify-between gap-2">
                                        <button type="button" onClick={() => toggleSection('juryBreakdown')}
                                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                                            <h3 className="text-xs font-bold text-gold-light uppercase tracking-wider flex items-center gap-1.5">
                                                <ShieldAlert className="h-3 w-3 text-gold-primary" /> Breakdown Juri
                                            </h3>
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); saveStateAndRefresh(); }} className="p-1 rounded text-text-muted hover:text-white hover:bg-white/10 transition-all" title="Refresh Data">
                                                <RefreshCw className="h-3 w-3" />
                                            </button>
                                            <button type="button" onClick={() => toggleSection('juryBreakdown')}
                                                className="p-1 rounded text-text-muted hover:text-white hover:bg-white/10 transition-all">
                                                {isExpanded('juryBreakdown') ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                    {isExpanded('juryBreakdown') && (
                                        <div className="p-4 space-y-4 max-h-[30rem] overflow-y-auto">
                                            {juryTypes.map(jt => {
                                                const juryList = jm[jt.key] || [];
                                                return (
                                                    <div key={jt.key}>
                                                        <h4 className="text-sm font-bold text-gold-light uppercase tracking-wider mb-2 border-b border-bronze-muted/30 pb-1">{jt.label}</h4>
                                                        {juryList.map((juror, idx) => {
                                                            const js = juryScores.find(s =>
                                                                s.contingent_id === parseInt(contingentId) &&
                                                                s.jury_type === jt.key &&
                                                                s.jury_number === juror.id
                                                            );
                                                            if (!js) return (
                                                                <div key={juror.id} className="flex justify-between items-center text-xs py-1.5 border-b border-bronze-muted/20 last:border-0">
                                                                    <span className="text-text-muted">{juror.id}. {juror.name}</span>
                                                                    <span className="text-text-muted/50">—</span>
                                                                </div>
                                                            );
                                                            const sections = jt.sections || [];
                                                            const secLabels = {
                                                                pbb: 'PBB', danton: 'Danton',
                                                                variasi: 'Variasi', formasi: 'Formasi',
                                                                danton_vafor: 'Dn.Vafor',
                                                                kostum: 'Kostum', makeup: 'Makeup',
                                                            };
                                                            return (
                                                                <div key={juror.id} className="border-b border-bronze-muted/30 last:border-0 pb-2 mb-2">
                                                                    <div className="text-xs font-semibold text-gold-light mb-1.5">
                                                                        <span>{juror.id}. {juror.name}</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                                                                        {sections.map(sec => {
                                                                            const scoreKey = sec === 'danton_vafor' ? 'danton_vafor_score' : `${sec}_score`;
                                                                            const label = secLabels[sec] || sec;
                                                                            const val = parseInt(js[scoreKey]) || 0;
                                                                            const details = js[`${sec}_details`];
                                                                            const detailSum = details ? Object.values(details).reduce((s, v) => s + (parseInt(v) || 0), 0) : null;
                                                                            return (
                                                                                <div key={sec} className="flex justify-between text-xs">
                                                                                    <span className="text-text-muted">{label}</span>
                                                                                    <span className="font-mono text-white font-semibold">
                                                                                        {val}{detailSum !== null && detailSum !== val ? ` (${detailSum})` : ''}
                                                                                    </span>
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
                                    )}
                                </div>


                            </div>
                        </div>

                    </div>
                )}

                {/* Empty state */}
                {!contingentId && (
                    <div className="text-center py-20">
                        <Award className="h-12 w-12 text-text-muted/30 mx-auto mb-4" />
                        <p className="text-text-muted text-sm">Pilih kontingen untuk mulai input nilai</p>
                    </div>
                )}

            </div>
        </div>
    );
}
