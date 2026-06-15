import React from 'react';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Wallet, Ticket, Building2, Vote, Heart, ClipboardCheck, Users, Eye, Award, ShoppingBag, Music, BarChart3, Clock, Settings, Activity } from 'lucide-react';
import StatusBadge from '../../Components/StatusBadge';
import ScrollReveal from '../../Components/ScrollReveal';

export default function Recap({ event, revenue, orders, tickets, packageBreakdown, contingentStats, votes, supporters, scoring, users, totalLikes, recentOrders, eventSettings }) {
    const categoryLabels = { U12: 'SD (U12)', U16: 'SMP (U16)', U19: 'SMA (U19)', Purna: 'Purna' };

    const StatCard = ({ icon: Icon, label, value, sub, color = 'text-gold-primary' }) => (
        <div className="premium-card p-5 border border-bronze-muted/10">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">{label}</p>
                    <p className={`text-2xl font-black text-white mt-1 ${sub ? 'mb-0.5' : ''}`}>{value}</p>
                    {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
                </div>
                <Icon className={`h-5 w-5 ${color} shrink-0`} />
            </div>
        </div>
    );

    const statusBadge = (status) => {
        if (status === 'published') return <StatusBadge status="published" />;
        return <StatusBadge status="draft" />;
    };

    const votingBadge = (status) => {
        if (status === 'active') return <StatusBadge status="active" />;
        return <StatusBadge status="inactive" />;
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Rekapan Data - Super Admin" />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-bronze-muted/20 pb-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-accent-maroon/20 px-2 py-0.5 border border-gold-primary/20 rounded-full uppercase">
                            Super Admin / Rekapan Data
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2">
                            Rekapan <span className="text-gold-primary">Data Acara</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">{event.name} &bull; GARDA 55 VOL 20</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <a href={`/admin/events/${event.slug}/recap/export`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border bg-green-600/80 text-white border-green-500/30 hover:bg-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download Excel
                        </a>
                        <a href={`/admin/events/${event.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-bronze-muted border-transparent hover:text-white">
                            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
                        </a>
                    </div>
                </div>

                <ScrollReveal><div className="premium-card p-5 border border-bronze-muted/10">
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gold-primary" /> Konfigurasi Acara
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                        <div className="bg-deep-black/40 rounded p-3">
                            <p className="text-text-muted text-[10px] font-semibold mb-1">Leaderboard</p>
                            {statusBadge(eventSettings.leaderboard_status)}
                        </div>
                        <div className="bg-deep-black/40 rounded p-3">
                            <p className="text-text-muted text-[10px] font-semibold mb-1">Voting Day 1 (SMP/Purna)</p>
                            {votingBadge(eventSettings.voting_day_1_status)}
                        </div>
                        <div className="bg-deep-black/40 rounded p-3">
                            <p className="text-text-muted text-[10px] font-semibold mb-1">Voting Day 2 (SD/SMA)</p>
                            {votingBadge(eventSettings.voting_day_2_status)}
                        </div>
                        <div className="bg-deep-black/40 rounded p-3">
                            <p className="text-text-muted text-[10px] font-semibold mb-1">Limit Tiket Online</p>
                            <p className="text-white font-bold">{eventSettings.online_ticket_limit}</p>
                        </div>
                        <div className="bg-deep-black/40 rounded p-3">
                            <p className="text-text-muted text-[10px] font-semibold mb-1">Max Tiket/User</p>
                            <p className="text-white font-bold">{eventSettings.max_tickets_per_user}</p>
                        </div>
                    </div>
                </div></ScrollReveal>

                <ScrollReveal><div>
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Wallet className="h-4.5 w-4.5 text-gold-primary" /> Ringkasan Keuangan
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Wallet} label="Total Pendapatan" value={`Rp ${revenue.grand_total.toLocaleString('id-ID')}`} color="text-emerald-400" />
                        <StatCard icon={ShoppingBag} label="Pendapatan Tiket" value={`Rp ${revenue.total.toLocaleString('id-ID')}`} />
                        <StatCard icon={Award} label="Pendapatan Merch" value={`Rp ${revenue.merch.toLocaleString('id-ID')}`} color="text-amber-400" />
                        <StatCard icon={BarChart3} label="Status Pesanan" value={`${orders.paid} Paid / ${orders.pending} Pending`} color="text-sky-400" />
                    </div>
                </div></ScrollReveal>

                <ScrollReveal><div>
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Ticket className="h-4.5 w-4.5 text-gold-primary" /> Data Tiket
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Ticket} label="Tiket Online Terjual" value={tickets.online} sub={`Limit: ${tickets.online_limit}`} />
                        <StatCard icon={Ticket} label="Tiket OTS" value={tickets.ots} color="text-purple-400" />
                        <StatCard icon={Eye} label="Check-in" value={tickets.checked_in} sub={`${tickets.online > 0 ? Math.round(tickets.checked_in / tickets.online * 100) : 0}% dari online`} color="text-emerald-400" />
                        <StatCard icon={Users} label="Total Tiket Terbit" value={tickets.online + tickets.ots} color="text-amber-400" />
                    </div>

                    {packageBreakdown.length > 0 && (
                        <div className="mt-4 premium-card p-5 border border-bronze-muted/10">
                            <h3 className="text-xs font-bold text-white mb-3">Rincian Per Paket</h3>
                            <div className="overflow-x-auto scroll-smooth">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-bronze-muted/10 text-text-muted text-[10px] uppercase tracking-wider">
                                            <th className="text-left py-2 pr-4 font-semibold">Paket</th>
                                            <th className="text-left py-2 pr-4 font-semibold">Tipe</th>
                                            <th className="text-right py-2 pr-4 font-semibold">Harga</th>
                                            <th className="text-right py-2 pr-4 font-semibold">Terjual</th>
                                            <th className="text-right py-2 font-semibold">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packageBreakdown.map((pkg, i) => (
                                            <tr key={i} className="border-b border-bronze-muted/5 hover:bg-white/[0.02]">
                                                <td className="py-2.5 pr-4 text-white font-semibold">{pkg.name}</td>
                                                <td className="py-2.5 pr-4 text-text-muted">{pkg.type}</td>
                                                <td className="py-2.5 pr-4 text-right font-mono">Rp {pkg.price.toLocaleString('id-ID')}</td>
                                                <td className="py-2.5 pr-4 text-right font-bold text-white">{pkg.sold}</td>
                                                <td className="py-2.5 text-right font-mono text-gold-primary">Rp {pkg.revenue.toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div></ScrollReveal>

                <ScrollReveal><div>
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Building2 className="h-4.5 w-4.5 text-gold-primary" /> Data Kontingen
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Building2} label="Total Kontingen" value={contingentStats.total} color="text-emerald-400" />
                        <StatCard icon={Eye} label="Terverifikasi" value={contingentStats.verified} color="text-sky-400" />
                        {Object.entries(categoryLabels).map(([key, label]) => (
                            <StatCard key={key} icon={Building2} label={label} value={contingentStats.by_category?.[key] || 0} />
                        ))}
                    </div>
                </div></ScrollReveal>

                <ScrollReveal><div>
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Vote className="h-4.5 w-4.5 text-gold-primary" /> Data Voting
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-4">
                            <StatCard icon={Vote} label="Total Suara Masuk" value={votes.total} color="text-amber-400" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="premium-card p-3 border border-bronze-muted/10 text-center">
                                    <p className="text-[10px] text-text-muted font-semibold">Day 1 (SMP/Purna)</p>
                                    <p className="text-lg font-black text-white">{votes.day1}</p>
                                </div>
                                <div className="premium-card p-3 border border-bronze-muted/10 text-center">
                                    <p className="text-[10px] text-text-muted font-semibold">Day 2 (SD/SMA)</p>
                                    <p className="text-lg font-black text-white">{votes.day2}</p>
                                </div>
                            </div>
                        </div>
                        <div className="premium-card p-5 border border-bronze-muted/10">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-3">Top 5 Kontingen (Voting)</p>
                            <div className="space-y-2">
                                {votes.top5.map((v, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-white font-semibold flex items-center gap-2">
                                            <span className="text-gold-primary w-4 text-right">{i + 1}.</span>
                                            {v.school_name}
                                        </span>
                                        <span className="font-mono text-gold-primary">{v.total} suara</span>
                                    </div>
                                ))}
                                {votes.top5.length === 0 && (
                                    <p className="text-xs text-bronze-muted italic animate-fade-in">Belum ada suara masuk.</p>
                                )}
                            </div>
                        </div>
                        <div className="premium-card p-5 border border-bronze-muted/10">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-3">Top 5 Kontingen (Supporter)</p>
                            <div className="space-y-2">
                                {supporters.top5.map((v, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-white font-semibold flex items-center gap-2">
                                            <span className="text-rose-400 w-4 text-right">{i + 1}.</span>
                                            {v.school_name}
                                        </span>
                                        <span className="font-mono text-rose-400">{v.total} dukungan</span>
                                    </div>
                                ))}
                                {supporters.top5.length === 0 && (
                                    <p className="text-xs text-bronze-muted italic animate-fade-in">Belum ada dukungan.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div></ScrollReveal>

                <ScrollReveal><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <Heart className="h-4.5 w-4.5 text-gold-primary" /> Dukungan Sponsor
                        </h2>
                        <StatCard icon={Heart} label="Total Supporter Log" value={supporters.total} color="text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <Music className="h-4.5 w-4.5 text-gold-primary" /> Sosmed Likes
                        </h2>
                        <StatCard icon={Music} label="Total Likes (Reels + Posts)" value={totalLikes} color="text-pink-400" />
                    </div>
                </div></ScrollReveal>

                <ScrollReveal><div>
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <ClipboardCheck className="h-4.5 w-4.5 text-gold-primary" /> Progress Penilaian
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Object.entries(categoryLabels).map(([cat, label]) => {
                            const s = scoring[cat];
                            return (
                                <div key={cat} className="premium-card p-5 border border-bronze-muted/10">
                                    <p className="text-xs font-bold text-white mb-3">{label}</p>
                                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                                        <div className="bg-deep-black/40 rounded p-2.5">
                                            <p className="font-black text-white text-sm">{s?.total || 0}</p>
                                            <p className="text-text-muted font-semibold">Kontingen</p>
                                        </div>
                                        <div className="bg-deep-black/40 rounded p-2.5">
                                            <p className="font-black text-white text-sm">{s?.scored || 0}</p>
                                            <p className="text-text-muted font-semibold">Babak 1</p>
                                        </div>
                                        <div className="bg-deep-black/40 rounded p-2.5">
                                            <p className="font-black text-white text-sm">{s?.jury_entries || 0}</p>
                                            <p className="text-text-muted font-semibold">Entri Juri</p>
                                        </div>
                                        <div className="bg-deep-black/40 rounded p-2.5">
                                            <p className="font-black text-white text-sm">{s?.final_entered || 0}</p>
                                            <p className="text-text-muted font-semibold">Final</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div></ScrollReveal>

                <ScrollReveal><div>
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="h-4.5 w-4.5 text-gold-primary" /> Pesanan Terakhir (10)
                    </h2>
                    <div className="premium-card p-5 border border-bronze-muted/10">
                        {recentOrders.length > 0 ? (
                            <div className="space-y-2">
                                {recentOrders.map((o) => (
                                    <div key={o.id} className="flex items-center justify-between p-2.5 bg-deep-black/40 rounded border border-bronze-muted/10 text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="text-text-muted font-mono text-[10px]">{o.order_id}</span>
                                            <span className="text-white font-semibold">{o.buyer_name}</span>
                                            <span className="text-text-muted text-[10px]">{o.payment_method}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-white">Rp {o.total_price.toLocaleString('id-ID')}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                                o.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>{o.payment_status}</span>
                                            <span className="text-[9px] text-text-muted">{o.created_at}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-bronze-muted italic text-center py-6 animate-fade-in">Belum ada pesanan.</p>
                        )}
                    </div>
                </div></ScrollReveal>

                <ScrollReveal><div>
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-gold-primary" /> Data Pengguna
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Total User" value={users.total} color="text-emerald-400" />
                        {Object.entries(users.by_role || {}).map(([role, count]) => (
                            <StatCard key={role} icon={Users} label={role.replace('_', ' ')} value={count} />
                        ))}
                    </div>
                </div></ScrollReveal>

                {/* Footer */}
                <div className="text-center pb-8">
                    <p className="text-[9px] text-text-muted">
                        PASGARDA Platform &bull; Data rekapan ini bersifat live &bull; {new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                    </p>
                </div>
            </div>
        </div>
    );
}
