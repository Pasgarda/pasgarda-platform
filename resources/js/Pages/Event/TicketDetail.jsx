import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Gift, QrCode, Calendar, MapPin, CheckCircle, Clock, ShieldAlert, Share2, Check, Crown, Star, Ticket } from 'lucide-react';

export default function TicketDetail({ ticket, event, isOwner = false }) {
    const [copied, setCopied] = useState(false);

    const pkg = (ticket.package_name || '').toLowerCase();
    const isPlatinum = pkg.includes('platinum');
    const isGold = pkg.includes('gold') || pkg.includes('emas');
    const isSilver = pkg.includes('silver') || pkg.includes('perak');

    const gradientClass = isPlatinum
        ? 'bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#0d2137] border-[#a855f7]/40'
        : isGold
            ? 'bg-gradient-to-br from-[#2a1f0a] via-[#3d2e15] to-[#1a1408] border-[#f59e0b]/40'
            : 'bg-gradient-to-br from-[#1a1b1e] via-[#2a2b2e] to-[#0d0d0f] border-[#9ca3af]/40';

    const badgeGradient = isPlatinum
        ? 'from-purple-500 via-pink-500 to-amber-400'
        : isGold
            ? 'from-yellow-500 to-amber-600'
            : 'from-gray-300 to-gray-400';

    const glowEffect = isPlatinum
        ? 'shadow-[0_0_30px_rgba(168,85,247,0.3)]'
        : isGold
            ? 'shadow-[0_0_30px_rgba(245,158,11,0.3)]'
            : 'shadow-[0_0_20px_rgba(156,163,175,0.2)]';

    const headerText = isPlatinum ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-400 to-cyan-300'
        : isGold ? 'text-yellow-400'
        : 'text-gray-300';

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = window.location.href;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Chequered background ornament */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)',
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
            }} />

            <Head title={`Tiket ${ticket.buyer_name} - ${ticket.package_name}`} />

            <div className={`w-full max-w-md premium-card p-6 md:p-8 ${gradientClass} ${glowEffect} relative overflow-hidden my-8`}>
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${badgeGradient}`} />

                {/* Package Crown Badge */}
                <div className="absolute -top-1 -right-1">
                    <div className={`px-3 py-1.5 bg-gradient-to-r ${badgeGradient} rounded-bl-xl shadow-lg flex items-center gap-1`}>
                        <Crown className="h-3.5 w-3.5 text-white" />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">{ticket.package_name}</span>
                    </div>
                </div>

                {/* QR Code */}
                <div className="text-center mb-6 mt-2">
                    <div className="p-2 bg-white rounded-lg inline-block shadow-lg mb-4 ring-2 ring-white/20">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`}
                            alt="QR Ticket"
                            className="h-36 w-36 object-contain mx-auto"
                        />
                    </div>

                    <button onClick={handleShare}
                        className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-bold text-text-muted hover:text-white transition-all flex items-center justify-center gap-1.5 mb-3"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                        {copied ? 'Link Disalin!' : 'Share Link Tiket'}
                    </button>

                    <h1 className={`text-xl font-extrabold ${headerText}`}>
                        Tiket {ticket.buyer_name}
                    </h1>
                    <p className="text-sm font-black text-white/80 mt-0.5 tracking-wide">Pesanan #{ticket.order_id} ({ticket.ticket_number})</p>
                    <p className="text-xs text-text-muted mt-1">{event.name}</p>
                </div>

                {/* Ticket Info */}
                <div className="space-y-4">
                    <div className="p-4 bg-black/40 rounded border border-white/5 space-y-3 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Nama Pemilik</span>
                            <span className="text-sm font-extrabold text-white text-right">{ticket.buyer_name}</span>
                        </div>
                        {ticket.buyer_email && (
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Email</span>
                                <span className="text-xs text-text-primary text-right">{ticket.buyer_email}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Paket</span>
                            <span className={`text-sm font-black ${isPlatinum ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-400 to-cyan-300' : isGold ? 'text-yellow-400' : 'text-gray-300'}`}>
                                {ticket.package_name}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Harga</span>
                            <span className="text-xs font-bold text-white">Rp {ticket.package_price.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-black/40 rounded border border-white/5 space-y-3 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Event
                            </span>
                            <span className="text-xs text-white text-right font-semibold">
                                {event.date_start} - {event.date_end}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Lokasi
                            </span>
                            <span className="text-xs text-white text-right font-semibold">{event.venue}</span>
                        </div>
                    </div>

                    {/* Ticket Status */}
                    <div className={`p-4 rounded border text-xs backdrop-blur-sm ${
                        ticket.days_remaining > 0
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-accent-mahogany/10 border-accent-mahogany/30'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            {ticket.days_remaining > 0 ? (
                                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                            ) : (
                                <ShieldAlert className="h-4 w-4 text-accent-mahogany shrink-0" />
                            )}
                            <span className={`font-bold ${ticket.days_remaining > 0 ? 'text-emerald-400' : 'text-accent-mahogany'}`}>
                                {ticket.days_remaining > 0 ? 'Tiket Aktif' : 'Tiket Habis'}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                            <div className={`p-2 rounded border ${ticket.days_remaining > 0 ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/10'}`}>
                                <Calendar className={`h-4 w-4 mx-auto mb-1 ${ticket.days_remaining > 0 ? 'text-sky-400' : 'text-text-muted'}`} />
                                <span className="text-text-muted block text-[9px] uppercase font-bold">Hari</span>
                                <span className={`font-black text-sm font-mono ${ticket.days_remaining > 0 ? 'text-white' : 'text-text-muted'}`}>{ticket.days_remaining}</span>
                                <span className={`block text-[8px] mt-0.5 ${ticket.days_remaining > 0 ? 'text-sky-400' : 'text-text-muted'}`}>{ticket.days_remaining > 0 ? 'Tersisa' : 'Habis'}</span>
                            </div>
                            <div className={`p-2 rounded border ${ticket.vote_tokens_remaining > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                                <Star className={`h-4 w-4 mx-auto mb-1 ${ticket.vote_tokens_remaining > 0 ? 'text-emerald-400' : 'text-text-muted'}`} />
                                <span className="text-text-muted block text-[9px] uppercase font-bold">Vote</span>
                                <span className={`font-black text-sm font-mono ${ticket.vote_tokens_remaining > 0 ? 'text-white' : 'text-text-muted'}`}>{ticket.vote_tokens_remaining}</span>
                                <span className={`block text-[8px] mt-0.5 ${ticket.vote_tokens_remaining > 0 ? 'text-emerald-400' : 'text-text-muted'}`}>{ticket.vote_tokens_remaining > 0 ? 'Tersisa' : 'Habis'}</span>
                            </div>
                            {ticket.package_type === 'ots' ? (
                                <div className={`p-2 rounded border ${ticket.coupon_tokens_remaining > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                                    <Ticket className={`h-4 w-4 mx-auto mb-1 ${ticket.coupon_tokens_remaining > 0 ? 'text-amber-400' : 'text-text-muted'}`} />
                                    <span className="text-text-muted block text-[9px] uppercase font-bold">Kupon</span>
                                    <span className={`font-black text-sm font-mono ${ticket.coupon_tokens_remaining > 0 ? 'text-white' : 'text-text-muted'}`}>{ticket.coupon_tokens_remaining}</span>
                                    <span className={`block text-[8px] mt-0.5 ${ticket.coupon_tokens_remaining > 0 ? 'text-amber-400' : 'text-text-muted'}`}>{ticket.coupon_tokens_remaining > 0 ? 'Tersisa' : 'Habis'}</span>
                                </div>
                            ) : (
                                <div className={`p-2 rounded border ${ticket.sharing_tokens_remaining > 0 ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/10'}`}>
                                    <Gift className={`h-4 w-4 mx-auto mb-1 ${ticket.sharing_tokens_remaining > 0 ? 'text-sky-400' : 'text-text-muted'}`} />
                                    <span className="text-text-muted block text-[9px] uppercase font-bold">Sharing</span>
                                    <span className={`font-black text-sm font-mono ${ticket.sharing_tokens_remaining > 0 ? 'text-white' : 'text-text-muted'}`}>{ticket.sharing_tokens_remaining}</span>
                                    <span className={`block text-[8px] mt-0.5 ${ticket.sharing_tokens_remaining > 0 ? 'text-sky-400' : 'text-text-muted'}`}>{ticket.sharing_tokens_remaining > 0 ? 'Tersisa' : 'Habis'}</span>
                                </div>
                            )}
                        </div>
                        {ticket.check_in_status && (
                            <p className="text-[9px] text-text-muted mt-3 text-center flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3" /> Check-In terakhir: {ticket.checked_in_at}
                            </p>
                        )}
                    </div>

                    {/* Premium Package Features */}
                    <div className="p-3 bg-black/30 rounded border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 justify-center">
                            <Star className={`h-4 w-4 ${isPlatinum ? 'text-purple-400' : isGold ? 'text-yellow-400' : 'text-gray-400'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isPlatinum ? 'text-purple-300' : isGold ? 'text-yellow-300' : 'text-gray-300'}`}>
                                {isPlatinum ? 'VIP Chequered Champions' : isGold ? 'Gold Chequered Champions' : 'Silver Chequered Champions'}
                            </span>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link
                            href={isOwner ? '/my-tickets' : `/events/${event.slug}`}
                            className="inline-flex items-center gap-1.5 text-[10px] text-text-muted hover:text-gold-light transition-all font-semibold"
                        >
                            ← {isOwner ? 'Kembali ke Tiket Saya' : 'Kembali ke Event'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
