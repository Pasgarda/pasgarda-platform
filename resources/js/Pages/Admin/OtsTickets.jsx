import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Ticket, User, Mail, MessageCircle, QrCode, Scan, ShieldAlert, CheckCircle, RefreshCcw, Camera, CameraOff, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import ScrollReveal from '../../Components/ScrollReveal';

export default function OtsTickets({ auth, event, packages, recentTickets, dailyCheckins, contingents, flash, search: initialSearch }) {

    const [deletingTicket, setDeletingTicket] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [dismissingOts, setDismissingOts] = useState(false);
    const [scanHash, setScanHash] = useState('');
    const [scanResult, setScanResult] = useState(() => {
        try { const s = sessionStorage.getItem('ots_scan_result'); return s ? JSON.parse(s) : null; } catch { return null; }
    });
    const [scanLoading, setScanLoading] = useState(false);
    const [checkedInHashes, setCheckedInHashes] = useState(() => {
        try { const s = sessionStorage.getItem('ots_checked_hashes'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
    });
    const persistCheckedHashes = (hashes) => {
        try { sessionStorage.setItem('ots_checked_hashes', JSON.stringify([...hashes])); } catch {}
    };
    const [bulkCheckingIn, setBulkCheckingIn] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const scannerRef = useRef(null);
    const scannerInstanceRef = useRef(null);
    const skipAutoStopRef = useRef(false);

    const [checkedIn, setCheckedIn] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimSuccess, setClaimSuccess] = useState(null);

    const [singleContingentId, setSingleContingentId] = useState('');
    const [allocLoading, setAllocLoading] = useState(false);
    const [allocSuccess, setAllocSuccess] = useState(null);

    const [voteContingentId, setVoteContingentId] = useState('');
    const [votesCount, setVotesCount] = useState('1');
    const [voteCategoryFilter, setVoteCategoryFilter] = useState('');
    const [voteSearch, setVoteSearch] = useState('');

    const [bulkVoteContingentId, setBulkVoteContingentId] = useState('');
    const [bulkVotesCount, setBulkVotesCount] = useState('1');
    const [bulkVoteCategoryFilter, setBulkVoteCategoryFilter] = useState('');
    const [bulkVoteSearch, setBulkVoteSearch] = useState('');
    const [bulkAllocLoading, setBulkAllocLoading] = useState(false);
    const [bulkAllocSuccess, setBulkAllocSuccess] = useState(null);

    const [bulkClaimProcessing, setBulkClaimProcessing] = useState(false);
    const [bulkClaimMessage, setBulkClaimMessage] = useState(null);

    const categoryLabels = { U12: 'SD', U16: 'SMP', U19: 'SMA', Purna: 'Purna' };

    const { data, setData, post, processing, errors, reset } = useForm({
        ticket_package_id: packages[0]?.id || '',
        buyer_name: '',
        buyer_email: '',
        quantity: 1,
        ots_payment_type: 'qris',
    });

    const handleIssueTicket = (e) => {
        e.preventDefault();
        post(`/admin/events/${event.slug}/ots/generate`, {
            onSuccess: () => {
                reset('buyer_name', 'buyer_email');
            }
        });
    };

    const handleDeleteTicket = () => {
        if (!deletingTicket || !deleteReason.trim()) return;
        setDeleteProcessing(true);
        router.post(`/admin/events/${event.slug}/ots/tickets/${deletingTicket.id}/delete`, {
            reason: deleteReason
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingTicket(null);
                setDeleteReason('');
                setDeleteProcessing(false);
            },
            onError: () => {
                setDeleteProcessing(false);
            }
        });
    };

    const handleDismissOts = () => {
        clearLastIssued();
    };

    const handleScanCheckIn = async (hash) => {
        const qrHash = hash || scanHash;
        if (!qrHash) return;

        setScanLoading(true);
        setScanResult(null);
        setCheckedIn(false);
        setSingleContingentId('');
        setAllocSuccess(null);
        setVoteContingentId('');
        setVotesCount('');
        setVoteCategoryFilter('');
        setVoteSearch('');

        try {
            const response = await axios.post('/api/tickets/scan', {
                qr_hash: qrHash
            });
            setScanResult({
                success: true,
                ...response.data
            });
        } catch (error) {
            setScanResult({
                success: false,
                message: error.response?.data?.message || 'Terjadi kesalahan sistem.'
            });
        } finally {
            setScanLoading(false);
        }
    };

    const handleConfirmCheckIn = async () => {
        const qrHash = scanHash;
        if (!qrHash) return;

        setCheckingIn(true);

        try {
            const response = await axios.post('/api/tickets/checkin', {
                qr_hash: qrHash
            });
            setScanResult(prev => ({
                ...prev,
                ...response.data,
            }));
            setCheckedIn(true);
        } catch (error) {
            setScanResult({
                success: false,
                message: error.response?.data?.message || 'Gagal check-in.',
            });
        } finally {
            setCheckingIn(false);
        }
    };

    const handleBulkCheckin = async () => {
        if (!lastIssuedTickets || lastIssuedTickets.length === 0) return;

        const unchecked = lastIssuedTickets.filter(t => !checkedInHashes.has(t.qr_hash));
        if (unchecked.length === 0) return;

        setBulkCheckingIn(true);

        try {
            const response = await axios.post('/api/tickets/bulk-checkin', {
                qr_hashes: unchecked.map(t => t.qr_hash)
            });

            const newChecked = new Set(checkedInHashes);
            let hasError = false;

            (response.data.results || []).forEach(r => {
                if (r.success) {
                    newChecked.add(r.qr_hash);
                } else {
                    hasError = true;
                }
            });

            setCheckedInHashes(newChecked);
            persistCheckedHashes(newChecked);

            setScanResult({
                success: true,
                message: response.data.message,
                bulk: true,
                success_count: response.data.success_count,
                fail_count: response.data.fail_count,
                total_vote_tokens: response.data.total_vote_tokens,
                total_coupon_tokens: response.data.total_coupon_tokens,
                total_sharing_tokens: response.data.total_sharing_tokens,
                ticket_count: response.data.ticket_count,
            });
        } catch (error) {
            setScanResult({
                success: false,
                message: error.response?.data?.message || 'Gagal check-in massal.',
            });
        } finally {
            setBulkCheckingIn(false);
        }
    };

    const handleBulkAllocateVotes = async () => {
        if (!lastIssuedTickets || lastIssuedTickets.length === 0) return;
        if (!bulkVoteContingentId) return;

        const votes = parseInt(bulkVotesCount);
        if (!votes || votes < 1) return;

        setBulkAllocLoading(true);
        setBulkAllocSuccess(null);

        try {
            const response = await axios.post('/api/tickets/bulk-allocate-votes', {
                qr_hashes: lastIssuedTickets.map(t => t.qr_hash),
                contingent_id: bulkVoteContingentId,
                votes,
            });

            setBulkAllocSuccess({ type: 'success', message: response.data.message });
            setScanResult(prev => ({
                ...prev,
                total_vote_tokens: response.data.total_vote_tokens,
            }));
            setBulkVotesCount('1');
        } catch (error) {
            setBulkAllocSuccess({
                type: 'error',
                message: error.response?.data?.message || 'Gagal mengalokasikan vote.',
            });
        } finally {
            setBulkAllocLoading(false);
        }
    };

    const handleBulkClaimCoupon = async () => {
        if (!lastIssuedTickets || lastIssuedTickets.length === 0) return;

        setBulkClaimProcessing(true);
        setBulkClaimMessage(null);

        try {
            const response = await axios.post('/api/tickets/bulk-claim-coupon', {
                qr_hashes: lastIssuedTickets.map(t => t.qr_hash),
            });

            setBulkClaimMessage({ type: 'success', message: response.data.message });
            setScanResult(prev => ({
                ...prev,
                total_coupon_tokens: response.data.total_coupon_tokens,
            }));
        } catch (error) {
            setBulkClaimMessage({
                type: 'error',
                message: error.response?.data?.message || 'Gagal mengklaim kupon.',
            });
        } finally {
            setBulkClaimProcessing(false);
        }
    };

    const handleClaimCoupon = async () => {
        const qrHash = scanHash;
        if (!qrHash) return;

        setClaimLoading(true);
        setClaimSuccess(null);

        try {
            const response = await axios.post('/api/tickets/claim-coupon', {
                qr_hash: qrHash
            });

            setClaimSuccess({ type: 'success', message: response.data.message });
            setScanResult(prev => ({
                ...prev,
                coupon_tokens: response.data.coupon_tokens_remaining,
                sharing_tokens: response.data.sharing_tokens_remaining,
            }));
        } catch (error) {
            setClaimSuccess({
                type: 'error',
                message: error.response?.data?.message || 'Gagal mengklaim kupon.',
            });
        } finally {
            setClaimLoading(false);
        }
    };

    const startCamera = async () => {
        setCameraActive(true);
        skipAutoStopRef.current = true;
        setTimeout(() => { skipAutoStopRef.current = false; }, 2000);

        try {
            const scanner = new Html5Qrcode('qr-scanner');
            scannerInstanceRef.current = scanner;
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    setScanHash(decodedText);
                    if (!skipAutoStopRef.current) {
                        stopCamera();
                    } else {
                        console.log('[Camera Debug] QR detected within 2s grace period — NOT stopping camera. decodedText:', decodedText);
                    }
                    handleScanCheckIn(decodedText);
                },
                () => {}
            );
        } catch (err) {
            setCameraActive(false);
            setScanResult({
                success: false,
                message: 'Gagal mengakses kamera: ' + (err?.message || 'Kamera tidak tersedia atau izin ditolak')
            });
        }
    };

    const stopCamera = async () => {
        console.log('[Camera Debug] stopCamera called');
        if (scannerInstanceRef.current) {
            try {
                await scannerInstanceRef.current.stop();
            } catch (e) {}
            scannerInstanceRef.current = null;
        }
        setCameraActive(false);
    };

    useEffect(() => {
        return () => {
            if (scannerInstanceRef.current) {
                try { scannerInstanceRef.current.stop(); } catch (e) {}
            }
        };
    }, []);

    const handleAllocateVotesSplit = async () => {
        if (!scanResult?.success || !voteContingentId) return;
        const votes = parseInt(votesCount);
        if (!votes || votes < 1) return;

        setAllocLoading(true);
        setAllocSuccess(null);

        try {
            const response = await axios.post('/api/tickets/allocate-votes', {
                qr_hash: scanHash || scanResult?.message,
                contingent_id: voteContingentId,
                votes: votes,
            });

            setAllocSuccess({ type: 'success', message: response.data.message });

            setScanResult(prev => ({
                ...prev,
                vote_tokens: response.data.vote_tokens_remaining,
            }));

            setVoteContingentId('');
            setVotesCount('');
            setVoteSearch('');
            setVoteCategoryFilter('');

        } catch (error) {
            setAllocSuccess({
                type: 'error',
                message: error.response?.data?.message || 'Gagal mengalokasikan vote.',
            });
        } finally {
            setAllocLoading(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [searchTimeout, setSearchTimeout] = useState(null);

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        const t = setTimeout(() => {
            router.get(`/admin/events/${event.slug}/ots`, { search: value || undefined }, { preserveState: true, replace: true });
        }, 400);
        setSearchTimeout(t);
    };

    const goToPage = (page) => {
        router.get(`/admin/events/${event.slug}/ots`, { page, search: searchTerm || undefined }, { preserveState: true, replace: true });
    };

    const [revealedHashes, setRevealedHashes] = useState(new Set());
    const toggleHash = (id) => {
        setRevealedHashes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const [historyModal, setHistoryModal] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchHistory = async (qrHash, buyerName) => {
        setHistoryModal(buyerName);
        setHistoryData(null);
        setHistoryLoading(true);
        try {
            const res = await axios.post('/api/tickets/scan', { qr_hash: qrHash });
            setHistoryData(res.data);
        } catch (e) {
            setHistoryData({ success: false, message: 'Gagal memuat riwayat.' });
        } finally {
            setHistoryLoading(false);
        }
    };


    const getPackageLabel = (pkg) => {
        const info = [
            `${pkg.vote_allowance} Vote`,
            `${pkg.validity_days} Hari`,
            pkg.coupon_allowance > 0 ? `${pkg.coupon_allowance} Kupon Doorprize` : null,
        ].filter(Boolean).join(', ');
        return `${pkg.name} - Rp ${parseFloat(pkg.price).toLocaleString('id-ID')} (${info})`;
    };

    // Persist last issued tickets across reloads using sessionStorage
    const [lastIssuedTickets, setLastIssuedTickets] = useState(() => {
        try {
            const saved = sessionStorage.getItem('ots_last_issued');
            const parsed = saved ? JSON.parse(saved) : null;
            return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : null);
        } catch { return null; }
    });

    useEffect(() => {
        const newTickets = flash?.last_issued_tickets;
        if (newTickets && Array.isArray(newTickets)) {
            setLastIssuedTickets(newTickets);
            try { sessionStorage.setItem('ots_last_issued', JSON.stringify(newTickets)); } catch {}
        }
    }, [flash?.last_issued_tickets]);

    const clearLastIssued = () => {
        setLastIssuedTickets(null);
        setCheckedInHashes(new Set());
        try { sessionStorage.removeItem('ots_last_issued'); } catch {}
        try { sessionStorage.removeItem('ots_checked_hashes'); } catch {}
    };

    const lastIssued = lastIssuedTickets?.[0] ?? null;

    useEffect(() => {
        if (scanResult === null) sessionStorage.removeItem('ots_scan_result');
        else sessionStorage.setItem('ots_scan_result', JSON.stringify(scanResult));
    }, [scanResult]);

        return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Kelola Tiket - Admin Panel" />

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <ScrollReveal>
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Panel Panitia & Operator Gate
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            Kelola <span className="text-gold-primary">Tiket</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; {event.venue}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <a
                            href={`/admin/events/${event.slug}`}
                            className="px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white"
                        >
                            ← Dashboard Event
                        </a>
                    </div>
                </div>
                <div className="flex gap-1.5 mt-4 border-b border-bronze-muted/20 pb-4">
                    <a
                        href={`/admin/events/${event.slug}/ots`}
                        className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40"
                    >
                        Panel Tiket
                    </a>
                    {auth?.user?.role !== 'operator_gate' || auth?.user?.email === 'gate@pasgarda.com' ? (
                        <a
                            href={`/admin/events/${event.slug}/payments`}
                            className="px-3.5 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white"
                        >
                            Pembayaran & Riwayat Tiket
                        </a>
                    ) : null}
                </div>
                </ScrollReveal>

                {/* 2-Column Layout: Scanner | OTS Issuance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ===== COLUMN 1: Gate Scanner & Check-In ===== */}
                    <ScrollReveal>
                    <div className="space-y-6">
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                <Scan className="h-5 w-5 text-gold-primary" /> Gate Scanner & Check-In
                            </h2>

                            {/* Camera Toggle */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => { if (!cameraActive) startCamera(); else stopCamera(); }}
                                    className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                                        cameraActive
                                            ? 'bg-accent-maroon border-accent-burgundy text-white'
                                            : 'bg-white/5 border-bronze-muted/20 text-bronze-muted hover:text-white'
                                    }`}
                                >
                                    {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                                    <span>{cameraActive ? 'Matikan Kamera' : 'Scan QR Kamera'}</span>
                                </button>
                            </div>

                            {/* Camera Viewport */}
                            <div className={`mb-4 rounded overflow-hidden border bg-black transition-all ${cameraActive ? 'border-gold-primary/30' : 'border-transparent max-h-0'}`}>
                                <div id="qr-scanner" className="w-full" style={{ minHeight: cameraActive ? '200px' : '0' }} />
                            </div>

                            {/* Manual Input */}
                            <form onSubmit={(e) => { e.preventDefault(); handleScanCheckIn(); }} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Kode Hash Tiket / QR Value (Manual)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={scanHash}
                                        onChange={(e) => setScanHash(e.target.value)}
                                        placeholder="Tempel / ketik kode unik tiket di sini..."
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-mono"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={scanLoading || cameraActive}
                                    className="w-full py-2.5 px-4 bg-gradient-to-r from-accent-maroon to-accent-burgundy hover:brightness-110 text-white font-semibold rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
                                >
                                    {scanLoading ? 'Memproses...' : 'Scan Tiket / Check-In'}
                                </button>
                            </form>
                        </div>

                        {scanResult && (
                            <div className={`premium-card p-6 border text-xs leading-relaxed ${
                                !scanResult.success
                                    ? 'bg-accent-mahogany/10 border-accent-mahogany/30 text-accent-mahogany'
                                    : scanResult.days_exhausted
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                        : (checkedIn || scanResult.bulk)
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                            }`}>
                                <div className="flex items-center gap-2 font-bold mb-1.5">
                                    {!scanResult.success ? (
                                        <ShieldAlert className="h-5 w-5 shrink-0" />
                                    ) : scanResult.days_exhausted ? (
                                        <ShieldAlert className="h-5 w-5 shrink-0" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 shrink-0" />
                                    )}
                                    <span className="flex-1">{!scanResult.success
                                        ? 'Gagal Check-In'
                                        : scanResult.days_exhausted
                                            ? 'Hari Kunjungan Habis'
                                            : (checkedIn || scanResult.bulk)
                                                ? 'Check-In Sukses'
                                                : 'Tiket Terdeteksi'
                                    }</span>
                                    <button type="button" onClick={() => setScanResult(null)}
                                        className="p-1 hover:bg-white/5 rounded text-text-muted hover:text-white transition-all"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <p className="mt-1">{scanResult.message}</p>
                                {scanResult.bulk && (
                                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 text-[11px] text-text-primary/80">
                                        <p className="font-bold text-gold-light text-xs mb-1.5">Ringkasan Tiket</p>
                                        <p>Total Tiket: <strong className="text-white">{scanResult.ticket_count}</strong></p>
                                        <p>Berhasil Check-In: <strong className="text-emerald-400">{scanResult.success_count}</strong></p>
                                        {scanResult.fail_count > 0 && (
                                            <p>Gagal: <strong className="text-accent-mahogany">{scanResult.fail_count}</strong></p>
                                        )}
                                        <div className="border-t border-white/5 pt-1.5 mt-1.5 space-y-1">
                                            <p>Total Vote Tokens: <strong className="text-white">{scanResult.total_vote_tokens}</strong></p>
                                            <p>Total Kupon: <strong className="text-white">{scanResult.total_coupon_tokens}</strong></p>
                                        </div>

                                        {scanResult.total_coupon_tokens > 0 && (
                                            <div className="pt-3 border-t border-white/5">
                                                <button
                                                    onClick={handleBulkClaimCoupon}
                                                    disabled={bulkClaimProcessing}
                                                    className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 font-extrabold rounded text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                >
                                                    {bulkClaimProcessing ? (
                                                        <><RefreshCcw className="h-3 w-3 animate-spin" /> Memproses...</>
                                                    ) : (
                                                        <><Ticket className="h-3 w-3" /> Serahkan Semua Kupon Doorprize ({scanResult.total_coupon_tokens} tersedia)</>
                                                    )}
                                                </button>
                                                {bulkClaimMessage && (
                                                    <div className={`mt-2 p-2 rounded text-[10px] ${
                                                        bulkClaimMessage.type === 'success'
                                                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                                            : 'bg-accent-mahogany/10 border border-accent-mahogany/30 text-accent-mahogany'
                                                    }`}>
                                                        {bulkClaimMessage.message}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {scanResult.bulk && scanResult.total_vote_tokens > 0 && (
                                    <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                                <CheckCircle className="h-3.5 w-3.5 text-gold-primary" /> Alokasi Vote Massal
                                            </h4>
                                            <span className="text-[9px] font-bold text-gold-light bg-gold-primary/10 px-2 py-0.5 rounded-full border border-gold-primary/20">
                                                {scanResult.total_vote_tokens} token tersisa
                                            </span>
                                        </div>

                                        {/* Category filter */}
                                        <div className="flex gap-1.5 flex-wrap">
                                            {Object.entries(categoryLabels).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setBulkVoteCategoryFilter(bulkVoteCategoryFilter === key ? '' : key)}
                                                    className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                                        bulkVoteCategoryFilter === key
                                                            ? 'bg-gold-primary/20 text-gold-light border-gold-primary/40'
                                                            : 'bg-white/5 text-text-muted border-bronze-muted/20 hover:text-white'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                            {bulkVoteCategoryFilter && (
                                                <button
                                                    type="button"
                                                    onClick={() => setBulkVoteCategoryFilter('')}
                                                    className="px-2 py-1 rounded text-[9px] text-accent-mahogany hover:text-white transition-all"
                                                >
                                                    <X className="h-3 w-3 inline" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Search input */}
                                        <input
                                            type="text"
                                            value={bulkVoteSearch}
                                            onChange={(e) => setBulkVoteSearch(e.target.value)}
                                            placeholder="Cari nama kontingen..."
                                            className="block w-full px-2 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-[10px]"
                                        />

                                        {/* Contingent dropdown */}
                                        <select
                                            value={bulkVoteContingentId}
                                            onChange={(e) => setBulkVoteContingentId(e.target.value)}
                                            className="block w-full px-2 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        >
                                            <option value="">— Pilih Kontingen —</option>
                                            {contingents
                                                .filter(c => !bulkVoteCategoryFilter || c.category_type === bulkVoteCategoryFilter)
                                                .filter(c => !bulkVoteSearch || c.school_name.toLowerCase().includes(bulkVoteSearch.toLowerCase()))
                                                .map((c) => (
                                                    <option key={c.id} value={c.id} className="bg-deep-black text-text-primary">
                                                        {c.school_name}{c.region ? ` - ${c.region}` : ''}
                                                    </option>
                                                ))}
                                        </select>

                                        {/* Vote count input */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                                Jumlah Suara (maks {scanResult.total_vote_tokens})
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={scanResult.total_vote_tokens}
                                                    value={bulkVotesCount}
                                                    onChange={(e) => setBulkVotesCount(Math.min(Math.max(1, parseInt(e.target.value) || 0), scanResult.total_vote_tokens).toString())}
                                                    placeholder="1"
                                                    className="block w-24 px-2 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs text-center"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setBulkVotesCount(scanResult.total_vote_tokens.toString())}
                                                    className="px-2.5 py-1 rounded text-[9px] font-bold bg-gold-primary/10 text-gold-light border border-gold-primary/20 hover:bg-gold-primary/20 transition-all"
                                                >
                                                    ALL-IN ({scanResult.total_vote_tokens})
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleBulkAllocateVotes}
                                            disabled={bulkAllocLoading || !bulkVoteContingentId || !bulkVotesCount || parseInt(bulkVotesCount) < 1}
                                            className="w-full py-2 px-4 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {bulkAllocLoading
                                                ? 'Memproses...'
                                                : `Alokasikan ${bulkVotesCount || '...'} Suara`}
                                        </button>

                                        {bulkAllocSuccess && (
                                            <div className={`p-2 rounded text-[10px] ${
                                                bulkAllocSuccess.type === 'success'
                                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                                    : 'bg-accent-mahogany/10 border border-accent-mahogany/30 text-accent-mahogany'
                                            }`}>
                                                {bulkAllocSuccess.message}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {scanResult.success && !scanResult.bulk && (
                                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1 text-[11px] text-text-primary/80">
                                        <p>Nama: <strong className="text-white">{scanResult.buyer_name}</strong></p>
                                        <p>Paket: <strong className="text-gold-light">{scanResult.package_name}</strong> <span className="text-text-muted">({scanResult.package_type === 'ots' ? 'OTS' : 'Online'})</span></p>
                                        {scanResult.ots_payment_type && (
                                            <p>Bayar: <strong className="text-white uppercase">{scanResult.ots_payment_type === 'qris' ? 'QRIS' : 'Tunai'}</strong></p>
                                        )}
                                        {scanResult.days_remaining !== undefined && (
                                            <p>Sisa Hari: <strong className="text-white">{scanResult.days_remaining} Hari</strong></p>
                                        )}
                                        {scanResult.vote_tokens !== undefined && (
                                            <p>Vote Tokens: <strong className="text-white">{scanResult.vote_tokens}</strong></p>
                                        )}
                                        {scanResult.coupon_tokens !== undefined && (
                                            <p className="flex items-center gap-2">
                                                <span>{scanResult.sumber === 'OTS' ? 'Kupon Doorprize' : 'Kupon Produk'}: <strong className="text-white">{scanResult.coupon_tokens}</strong></span>
                                                {scanResult.coupon_tokens > 0 && (
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={claimLoading}
                                                            onChange={(e) => {
                                                                if (e.target.checked) handleClaimCoupon();
                                                            }}
                                                            disabled={claimLoading}
                                                            className="h-3.5 w-3.5 accent-gold-primary rounded"
                                                        />
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${claimLoading ? 'text-gold-light' : 'text-text-muted hover:text-gold-light'} transition-all`}>
                                                            {claimLoading ? 'Mengklaim...' : 'Serahkan Kupon'}
                                                        </span>
                                                    </label>
                                                )}
                                            </p>
                                        )}
                                        {claimSuccess && (
                                            <div className={`mt-1 p-1.5 rounded text-[9px] ${
                                                claimSuccess.type === 'success'
                                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                                    : 'bg-accent-mahogany/10 border border-accent-mahogany/30 text-accent-mahogany'
                                            }`}>
                                                {claimSuccess.message}
                                            </div>
                                        )}

                                        {!checkedIn && !scanResult.days_exhausted && scanResult.days_remaining > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleConfirmCheckIn}
                                                disabled={checkingIn}
                                                className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                {checkingIn ? 'Memproses...' : 'Konfirmasi Check-In'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {scanResult.check_in_history?.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                                        <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Riwayat Check-In</p>
                                        {scanResult.check_in_history.map((entry, i) => (
                                            <p key={i} className="text-[10px] text-text-primary/80 ml-1">
                                                {new Date(entry.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {scanResult.success && scanResult.days_exhausted && (
                                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                                        <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Riwayat Vote</p>
                                        {scanResult.vote_history && Object.keys(scanResult.vote_history).length > 0 && (
                                            <div className="space-y-1.5">
                                                {Object.entries(scanResult.vote_history).map(([day, logs]) => (
                                                    <div key={day} className="text-[10px] bg-black/20 rounded p-2">
                                                        <p className="font-semibold text-white mb-1">Hari: {day}</p>
                                                        {logs.map((log, i) => (
                                                            <p key={i} className="text-text-primary/80 ml-2">
                                                                {log.time} → {log.contingent_name}: <strong className="text-white">{log.votes} vote</strong>
                                                            </p>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                        </div>
                    )}
                </div>
            )}

            {/* Vote Allocation */}
            {!scanResult?.bulk && (checkedIn || scanResult?.days_exhausted) && scanResult?.vote_tokens > 0 && (
                <div className="premium-card p-5 border border-gold-primary/30">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-gold-primary" /> Alokasi Vote
                        </h3>
                        <span className="text-[10px] font-bold text-gold-light bg-gold-primary/10 px-2 py-0.5 rounded-full border border-gold-primary/20">
                            {scanResult.vote_tokens} token tersisa
                        </span>
                    </div>

                    {/* Category filter */}
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                        {Object.entries(categoryLabels).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setVoteCategoryFilter(voteCategoryFilter === key ? '' : key)}
                                className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                    voteCategoryFilter === key
                                        ? 'bg-gold-primary/20 text-gold-light border-gold-primary/40'
                                        : 'bg-white/5 text-text-muted border-bronze-muted/20 hover:text-white'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                        {voteCategoryFilter && (
                            <button
                                type="button"
                                onClick={() => setVoteCategoryFilter('')}
                                className="px-2 py-1 rounded text-[9px] text-accent-mahogany hover:text-white transition-all"
                            >
                                <X className="h-3 w-3 inline" />
                            </button>
                        )}
                    </div>

                    {/* Search input */}
                    <input
                        type="text"
                        value={voteSearch}
                        onChange={(e) => setVoteSearch(e.target.value)}
                        placeholder="Cari nama kontingen..."
                        className="block w-full px-2 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-[10px] mb-2"
                    />

                    {/* Contingent dropdown */}
                    <select
                        value={voteContingentId}
                        onChange={(e) => setVoteContingentId(e.target.value)}
                        className="block w-full px-2 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                    >
                        <option value="">— Pilih Kontingen —</option>
                        {contingents
                            .filter(c => !voteCategoryFilter || c.category_type === voteCategoryFilter)
                            .filter(c => !voteSearch || c.school_name.toLowerCase().includes(voteSearch.toLowerCase()))
                            .map((c) => (
                                <option key={c.id} value={c.id} className="bg-deep-black text-text-primary">
                                    {c.school_name}{c.region ? ` - ${c.region}` : ''}
                                </option>
                            ))}
                    </select>

                    {/* Vote count input */}
                    <div className="mt-3">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                            Jumlah Suara (maks {scanResult.vote_tokens})
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min={1}
                                max={scanResult.vote_tokens}
                                value={votesCount}
                                onChange={(e) => setVotesCount(Math.min(Math.max(1, parseInt(e.target.value) || 0), scanResult.vote_tokens).toString())}
                                placeholder="1"
                                className="block w-24 px-2 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs text-center"
                            />
                            <button
                                type="button"
                                onClick={() => setVotesCount(scanResult.vote_tokens.toString())}
                                className="px-2.5 py-1 rounded text-[9px] font-bold bg-gold-primary/10 text-gold-light border border-gold-primary/20 hover:bg-gold-primary/20 transition-all"
                            >
                                ALL-IN ({scanResult.vote_tokens})
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAllocateVotesSplit}
                        disabled={allocLoading || !voteContingentId || !votesCount || parseInt(votesCount) < 1}
                        className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {allocLoading
                            ? 'Memproses...'
                            : `Alokasikan ${votesCount || '...'} Suara`}
                    </button>

                    {allocSuccess && (
                        <div className={`mt-3 p-2 rounded text-[10px] ${
                            allocSuccess.type === 'success'
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-accent-mahogany/10 border border-accent-mahogany/30 text-accent-mahogany'
                        }`}>
                            {allocSuccess.message}
                        </div>
                    )}
                </div>
                )}


                    </div>
                    </ScrollReveal>

                    {/* ===== COLUMN 2: Penerbitan Tiket OTS ===== */}
                    <div className="space-y-6">
                        <div className="premium-card p-6 border-bronze-muted/20">
                            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                <Ticket className="h-5 w-5 text-gold-primary" /> Terbitkan Tiket OTS
                            </h2>

                            <form onSubmit={handleIssueTicket} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Paket Tiket
                                    </label>
                                    <select
                                        value={data.ticket_package_id}
                                        onChange={(e) => setData('ticket_package_id', e.target.value)}
                                        className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                    >
                                        {packages.map((pkg) => (
                                            <option key={pkg.id} value={pkg.id} className="bg-deep-black text-text-primary">
                                                {getPackageLabel(pkg)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Nama Pembeli
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={data.buyer_name}
                                            onChange={(e) => setData('buyer_name', e.target.value)}
                                            placeholder="Nama Pembeli"
                                            className="block w-full pl-9 pr-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        />
                                    </div>
                                    {errors.buyer_name && <p className="text-accent-mahogany text-[10px] mt-1">{errors.buyer_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Email Pembeli (Opsional)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="email"
                                            value={data.buyer_email}
                                            onChange={(e) => setData('buyer_email', e.target.value)}
                                            placeholder="Email (Kosongkan jika beli tunai langsung)"
                                            className="block w-full pl-9 pr-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        />
                                    </div>
                                    {errors.buyer_email && <p className="text-accent-mahogany text-[10px] mt-1">{errors.buyer_email}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        WhatsApp (Opsional)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                                            <MessageCircle className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={data.phone || ''}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="6281234567890 (Auto Kirim WA)"
                                            className="block w-full pl-9 pr-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                                        />
                                    </div>
                                    <p className="text-[8px] text-text-muted mt-0.5">Nomor akan digunakan untuk mengirim tiket via WhatsApp otomatis.</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Metode Pembayaran
                                    </label>
                                    <div className="flex gap-3">
                                        <label className="flex items-center gap-2 px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded cursor-pointer transition-all has-[:checked]:border-gold-primary has-[:checked]:bg-gold-primary/10">
                                            <input
                                                type="radio"
                                                name="ots_payment_type"
                                                value="qris"
                                                checked={data.ots_payment_type === 'qris'}
                                                onChange={() => setData('ots_payment_type', 'qris')}
                                                className="accent-gold-primary"
                                            />
                                            <span className="text-[11px] text-text-primary font-semibold">QRIS</span>
                                        </label>
                                        <label className="flex items-center gap-2 px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded cursor-pointer transition-all has-[:checked]:border-gold-primary has-[:checked]:bg-gold-primary/10">
                                            <input
                                                type="radio"
                                                name="ots_payment_type"
                                                value="cash"
                                                checked={data.ots_payment_type === 'cash'}
                                                onChange={() => setData('ots_payment_type', 'cash')}
                                                className="accent-gold-primary"
                                            />
                                            <span className="text-[11px] text-text-primary font-semibold">Tunai</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                        Jumlah Tiket
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setData('quantity', Math.max(1, (data.quantity || 1) - 1))}
                                            className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-bronze-muted/40 rounded text-text-primary font-bold text-sm transition-all"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={data.quantity || 1}
                                            onChange={(e) => setData('quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-16 text-center px-2 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setData('quantity', Math.min(50, (data.quantity || 1) + 1))}
                                            className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-bronze-muted/40 rounded text-text-primary font-bold text-sm transition-all"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-2.5 px-4 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded text-xs tracking-wider uppercase shadow transition-all flex items-center justify-center gap-1.5"
                                >
                                    <span>Terbitkan {data.quantity > 1 ? `${data.quantity} ` : ''}Tiket OTS</span>
                                </button>
                            </form>
                        </div>

                        {/* QR Result */}
                        <div className="premium-card p-6 border-gold-primary/30 text-center min-h-[200px] flex flex-col justify-center items-center">
                            {lastIssuedTickets && lastIssuedTickets.length > 0 ? (
                                <div className="w-full relative">
                                    {/* Close button */}
                                    <button
                                        onClick={handleDismissOts}
                                        className="absolute top-0 right-0 p-1.5 text-bronze-muted hover:text-accent-mahogany hover:bg-accent-mahogany/10 rounded transition-all z-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <h3 className="text-xs font-bold text-gold-light uppercase tracking-wider mb-3">
                                        {lastIssuedTickets.length} Tiket OTS Diterbitkan
                                    </h3>

                                    <div className="w-full mb-3">
                                        {lastIssuedTickets.some(t => !checkedInHashes.has(t.qr_hash)) ? (
                                            <button
                                                onClick={handleBulkCheckin}
                                                disabled={bulkCheckingIn}
                                                className="w-full py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-extrabold rounded text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                            >
                                                {bulkCheckingIn ? (
                                                    <><RefreshCcw className="h-3 w-3 animate-spin" /> Memproses...</>
                                                ) : (
                                                    <><CheckCircle className="h-3 w-3" /> Check-In Semua ({lastIssuedTickets.length - checkedInHashes.size} Tiket)</>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="w-full py-2 px-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500/70 font-extrabold rounded text-[10px] uppercase tracking-wider flex items-center justify-center gap-2">
                                                <CheckCircle className="h-3 w-3" /> Semua Sudah Check-In
                                            </div>
                                        )}
                                    </div>

                                    {(() => {
                                        const phone = lastIssuedTickets[0]?.phone;
                                        const lines = lastIssuedTickets.map((t, i) => 
                                            `${i+1}. ${t.buyer_name} - ${t.package_name}\n   ${t.ticket_url}`
                                        );
                                        const text = `PASGARDA - ${lastIssuedTickets.length} Tiket OTS\n\n${lines.join('\n')}`;
                                        const waUrl = phone
                                            ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`
                                            : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                                        const allHashes = lastIssuedTickets.map(t => t.qr_hash);
                                        return (
                                            <div className="flex gap-2 mb-3">
                                                <a
                                                    href={waUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 py-2 px-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-extrabold rounded text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                >
                                                    <MessageCircle className="h-3 w-3" /> Chat Semua via WA
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        if (!confirm('Yakin ingin membatalkan pesanan ini? Semua tiket akan dihapus permanen.')) return;
                                                        axios.post('/api/tickets/cancel-ots-order', { qr_hashes: allHashes }).then(() => {
                                                            clearLastIssued();
                                                        }).catch((err) => {
                                                            alert(err.response?.data?.message || 'Gagal membatalkan pesanan.');
                                                        });
                                                    }}
                                                    className="py-2 px-3 bg-accent-mahogany/20 hover:bg-accent-mahogany/30 border border-accent-mahogany/40 text-accent-mahogany font-extrabold rounded text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 className="h-3 w-3" /> Batalkan
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                                        {lastIssuedTickets.map((t, idx) => {
                                            const isChecked = checkedInHashes.has(t.qr_hash);
                                            return (
                                            <div key={t.id} className={`border rounded p-3 flex items-center gap-3 text-left ${isChecked ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-bronze-muted/10 bg-deep-black/40'}`}>
                                                <span className="text-[10px] font-bold text-text-muted w-5 shrink-0">#{idx + 1}</span>
                                                <div className="p-1.5 bg-white rounded shrink-0">
                                                    <img src={t.qr_code_url} alt="QR" className="h-16 w-16 object-contain" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{t.buyer_name}</p>
                                                    <p className="text-[9px] text-text-muted">{t.package_name}</p>
                                                    {t.ots_payment_type && (
                                                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-gold-primary/10 text-gold-primary font-bold rounded text-[8px] uppercase leading-tight">
                                                            {t.ots_payment_type === 'qris' ? 'QRIS' : 'Tunai'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    {isChecked ? (
                                                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[9px] uppercase flex items-center gap-1">
                                                            <CheckCircle className="h-3 w-3" /> Check-In
                                                        </span>
                                                    ) : (
                                                        <>
                                                        <button
                                                            onClick={() => { setScanHash(t.qr_hash); handleScanCheckIn(t.qr_hash); }}
                                                            className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold rounded text-[9px] uppercase transition-all"
                                                            title="Scan & Check-In"
                                                        >
                                                            <Scan className="h-3 w-3" />
                                                        </button>
                                                        {t.whatsapp_url && (
                                                            <a href={t.whatsapp_url} target="_blank" rel="noopener noreferrer"
                                                                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold rounded text-[9px] uppercase transition-all"
                                                                title="Kirim WA"
                                                            >
                                                                <MessageCircle className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-3 p-2 bg-accent-maroon/20 border border-accent-maroon/40 rounded text-[10px] text-text-primary/95 leading-relaxed text-left">
                                        <span className="font-semibold text-gold-light">PENTING:</span> QR Code bisa difoto pembeli sebagai tiket fisik. Saat dipindai dengan kamera HP, akan membuka halaman detail tiket.
                                    </div>
                                </div>
                            ) : (
                                <div className="text-bronze-muted">
                                    <QrCode className="h-16 w-16 mx-auto opacity-30 mb-3" />
                                    <p className="text-xs font-medium">QR Code tiket OTS yang baru dibuat akan muncul di sini untuk difoto pembeli.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Riwayat Kunjungan Per Hari */}
                {dailyCheckins?.length > 0 && (
                    <ScrollReveal>
                    <div className="premium-card p-6 border-bronze-muted/10 mb-6">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                            <User className="h-4 w-4 text-sky-400" /> Pengunjung (Check-in) Per Hari
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dailyCheckins.map((day, idx) => (
                                <div key={idx} className="bg-deep-black/60 border border-bronze-muted/10 rounded p-4">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                                        <span className="font-bold text-gold-light text-xs">{day.date}</span>
                                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30">
                                            {day.count} Pengunjung
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Terbaru:</p>
                                        {day.latest?.length > 0 ? (
                                            <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                                                {day.latest.map((t, i) => (
                                                    <div key={i} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-white font-medium truncate pr-2 max-w-[120px]">{t.name}</span>
                                                        <div className="flex gap-2 items-center shrink-0">
                                                            <span className="font-mono text-gold-light/50">{t.hash}</span>
                                                            <span className="text-text-muted">{t.time}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-text-muted italic">Belum ada data terbaru.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    </ScrollReveal>
                )}

                {/* Riwayat Scan Tiket */}
                <ScrollReveal>
                <div className="premium-card overflow-hidden border border-bronze-muted/10">
                    <div className="p-4 bg-accent-maroon/5 border-b border-bronze-muted/10 flex flex-col sm:flex-row sm:items-center gap-3">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2 shrink-0">
                            <Scan className="h-4 w-4 text-gold-primary" /> Riwayat Scan Tiket
                        </h3>
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Cari nama atau kode tiket..."
                                className="flex-1 max-w-xs px-2.5 py-1.5 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-[10px]"
                            />
                            <a
                                href={`/admin/events/${event.slug}/tickets/scan-history`}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-bronze-muted/20 rounded text-[10px] font-semibold transition-all whitespace-nowrap"
                            >
                                Lihat Semua →
                            </a>
                        </div>
                    </div>
                    <div className="overflow-x-auto text-xs scroll-smooth">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Nama Pembeli</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Sumber</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Kode Tiket (QR Hash)</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Sisa Hari</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Vote</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Doorprize</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Produk</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Vote Untuk</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-center">Waktu</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bronze-muted/10">
                                {(recentTickets.data || recentTickets).map((t) => {
                                    const isOts = t.order?.payment_method?.startsWith?.('OTS');
                                    return (
                                    <tr key={t.id} className="hover:bg-white/[0.01]">
                                        <td className="p-3 font-semibold text-white">{t.buyer_name}</td>
                                        <td className="p-3">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                isOts
                                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                            }`}>
                                                                    {isOts ? 'OTS' : 'Online'}
                                                                </span>
                                                                {isOts && t.order?.payment_method?.startsWith?.('OTS-') && (
                                                                    <span className="px-1 py-0.5 bg-gold-primary/10 text-gold-primary font-bold rounded text-[8px] uppercase leading-tight">
                                                                        {t.order.payment_method.slice(4) === 'QRIS' ? 'QRIS' : 'Tunai'}
                                                                    </span>
                                                                )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-[10px] text-gold-light">
                                                    {revealedHashes.has(t.id) ? t.unique_qr_hash : t.unique_qr_hash.slice(0, 10) + '...'}
                                                </span>
                                                <button onClick={() => toggleHash(t.id)} className="p-0.5 text-text-muted hover:text-white transition-all shrink-0">
                                                    {revealedHashes.has(t.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${t.days_remaining > 0 ? 'text-emerald-400' : 'text-text-muted'}`}>
                                                {t.days_remaining || 0} Hari
                                            </span>
                                        </td>
                                        <td className="p-3 text-center text-text-primary/70">{t.vote_tokens_remaining}</td>
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${isOts && t.coupon_tokens_remaining > 0 ? 'text-white' : 'text-text-muted'}`}>
                                                {isOts ? t.coupon_tokens_remaining : '-'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${!isOts && t.coupon_tokens_remaining > 0 ? 'text-white' : 'text-text-muted'}`}>
                                                {!isOts ? t.coupon_tokens_remaining : '-'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-[10px]">
                                            {t.vote_logs?.length
                                                ? (() => {
                                                    const total = t.vote_logs.length;
                                                    const grouped = {};
                                                    t.vote_logs.forEach(v => {
                                                        const name = v.contingent?.school_name || 'Unknown';
                                                        grouped[name] = (grouped[name] || 0) + 1;
                                                    });
                                                    return (
                                                        <span>
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold mr-1">{total} Suara</span>
                                                            {Object.entries(grouped).map(([name, count]) =>
                                                                `${name} (${count}x)`
                                                            ).join(', ')}
                                                        </span>
                                                    );
                                                })()
                                                : <span className="text-text-muted italic">-</span>
                                            }
                                        </td>
                                        <td className="p-3 text-center text-text-muted text-[10px] whitespace-nowrap">
                                            {t.checked_in_at ? new Date(t.checked_in_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                        </td>
                                        <td className="p-3 text-right flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => { setScanHash(t.unique_qr_hash); if (cameraActive) stopCamera(); }}
                                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded font-semibold text-[10px] transition-all"
                                            >
                                                Scan
                                            </button>
                                            <button
                                                onClick={() => fetchHistory(t.unique_qr_hash, t.buyer_name)}
                                                className="px-2 py-1 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-light border border-gold-primary/20 rounded font-semibold text-[10px] transition-all"
                                            >
                                                QR
                                            </button>
                                            <button
                                                onClick={() => { setDeletingTicket(t); setDeleteReason(''); }}
                                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded font-semibold text-[10px] transition-all"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })}
                                {(recentTickets.data || recentTickets).length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="p-6 text-center text-bronze-muted italic animate-fade-in">Belum ada tiket yang discan atau diterbitkan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {recentTickets.last_page > 1 && (
                        <div className="p-3 border-t border-bronze-muted/10 flex items-center justify-between text-[10px] text-text-muted">
                            <span>
                                Halaman {recentTickets.current_page} dari {recentTickets.last_page} ({recentTickets.total} tiket)
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => goToPage(recentTickets.current_page - 1)}
                                    disabled={recentTickets.current_page === 1}
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-text-primary transition-all"
                                >
                                    ← Prev
                                </button>
                                {(() => {
                                    const pages = recentTickets.links?.filter(l => !isNaN(l.label)).map(l => Number(l.label)) || [];
                                    const current = recentTickets.current_page;
                                    const last = pages[pages.length - 1] || 1;
                                    const visible = new Set();
                                    [1, 2, 3].forEach(p => { if (p <= last) visible.add(p); });
                                    [current - 1, current, current + 1].forEach(p => { if (p >= 1 && p <= last) visible.add(p); });
                                    visible.add(last);
                                    const sorted = [...visible].sort((a, b) => a - b);
                                    const withEllipsis = [];
                                    for (let i = 0; i < sorted.length; i++) {
                                        if (i > 0 && sorted[i] - sorted[i - 1] > 1) withEllipsis.push('...');
                                        withEllipsis.push(sorted[i]);
                                    }
                                    return withEllipsis.map((item, i) =>
                                        item === '...' ? (
                                            <span key={`e${i}`} className="px-2 py-1 text-text-muted">...</span>
                                        ) : (
                                            <button key={item}
                                                onClick={() => goToPage(item)}
                                                className={`px-2 py-1 rounded transition-all ${
                                                    item === current
                                                        ? 'bg-gold-primary/20 text-gold-light border border-gold-primary/30'
                                                        : 'bg-white/5 hover:bg-white/10 text-text-primary'
                                                }`}
                                            >
                                                {item}
                                            </button>
                                        )
                                    );
                                })()}
                                <button
                                    onClick={() => goToPage(recentTickets.current_page + 1)}
                                    disabled={recentTickets.current_page === recentTickets.last_page}
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-text-primary transition-all"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                </ScrollReveal>
            </div>

            {/* Hapus Tiket Modal */}
            {deletingTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDeletingTicket(null)}>
                    <ScrollReveal>
                    <div className="bg-[#1A1814] border border-bronze-muted/20 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-bronze-muted/10">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Trash2 className="h-4 w-4 text-accent-mahogany" /> Hapus Tiket
                            </h3>
                            <button onClick={() => setDeletingTicket(null)} className="p-1 hover:bg-white/5 rounded text-text-muted hover:text-white transition-all">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-deep-black/60 rounded p-3 text-xs space-y-1">
                                <p><span className="text-text-muted">Pembeli:</span> <strong className="text-white">{deletingTicket.buyer_name}</strong></p>
                                <p><span className="text-text-muted">Kode Tiket:</span> <strong className="text-gold-light font-mono text-[10px]">{deletingTicket.unique_qr_hash}</strong></p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                    Alasan Penghapusan <span className="text-accent-mahogany">*</span>
                                </label>
                                <textarea
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="Contoh: Salah input nama, pembeli batal, dll."
                                    className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs resize-none"
                                    rows={3}
                                />
                            </div>

                            <p className="text-[10px] text-text-muted italic">
                                Tiket yang dihapus akan muncul di Riwayat Penghapusan beserta alasan.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingTicket(null)}
                                    className="flex-1 py-2 bg-white/5 border border-bronze-muted/20 text-text-muted hover:text-white rounded text-xs font-bold transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteTicket}
                                    disabled={deleteProcessing || !deleteReason.trim()}
                                    className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded text-xs tracking-wider uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {deleteProcessing ? 'Menghapus...' : 'Ya, Hapus Tiket'}
                                </button>
                            </div>
                        </div>
                    </div>
                    </ScrollReveal>
                </div>
            )}

            {/* QR + Riwayat Modal */}
            {historyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in" onClick={() => setHistoryModal(null)}>
                    <ScrollReveal>
                    <div className="bg-[#1A1814] border border-bronze-muted/20 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto scroll-smooth" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-bronze-muted/10">
                            <div className="flex items-center gap-2">
                                <QrCode className="h-4 w-4 text-gold-primary" />
                                <h3 className="text-sm font-bold text-white">{historyModal}</h3>
                            </div>
                            <button onClick={() => setHistoryModal(null)} className="p-1 hover:bg-white/5 rounded text-text-muted hover:text-white transition-all">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {historyLoading ? (
                                <p className="text-xs text-text-muted text-center py-4">Memuat riwayat...</p>
                            ) : historyData?.success ? (
                                <>
                                    {/* QR Code */}
                                    {historyData.buyer_name && (
                                        <div className="flex justify-center">
                                            <div className="p-2 bg-white rounded-lg inline-block">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/tickets/' + (historyData.qr_hash || ''))}`}
                                                    alt="QR"
                                                    className="h-40 w-40 object-contain"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Info Tiket */}
                                    <div className="bg-deep-black/40 rounded p-3 space-y-1 text-[11px] text-text-primary/80">
                                        <p>Paket: <strong className="text-gold-light">{historyData.package_name}</strong></p>
                                        <p>Sisa Hari: <strong className="text-white">{historyData.days_remaining}</strong></p>
                                        <p>Vote Tokens: <strong className="text-white">{historyData.vote_tokens}</strong></p>
                                        <p>{historyData.sumber === 'OTS' ? 'Kupon Doorprize' : 'Kupon Produk'}: <strong className="text-white">{historyData.coupon_tokens}</strong></p>
                                    </div>

                                    {/* Check-In History */}
                                    {historyData.check_in_history?.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Riwayat Check-In</p>
                                            {historyData.check_in_history.map((entry, i) => (
                                                <div key={i} className="bg-deep-black/40 rounded p-2 mb-1 text-[10px]">
                                                    {new Date(entry.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Vote History */}
                                    {historyData.vote_history && Object.keys(historyData.vote_history).length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Riwayat Vote</p>
                                            {Object.entries(historyData.vote_history).map(([day, logs]) => (
                                                <div key={day} className="bg-deep-black/40 rounded p-2 mb-1.5 text-[10px]">
                                                    <p className="font-semibold text-white mb-1 text-[11px]">{day}</p>
                                                    {logs.map((log, i) => (
                                                        <p key={i} className="text-text-primary/80 ml-1">
                                                            {log.time} → {log.contingent_name}: <strong className="text-white">{log.votes} vote</strong>
                                                        </p>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!historyData.vote_history && (
                                        <p className="text-[10px] text-text-muted text-center italic animate-fade-in">Belum ada aktivitas vote.</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-accent-mahogany text-center py-4">{historyData?.message || 'Gagal memuat data.'}</p>
                            )}
                        </div>
                    </div>
                    </ScrollReveal>
                </div>
            )}
        </div>
    );
}
