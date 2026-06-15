import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Trophy, Calendar, MapPin, Users, Ticket, BarChart3, Clock, AlertTriangle, Shield, CheckCircle, Link as LinkIcon, Star, Award, User, ShoppingBag, KeyRound } from 'lucide-react';
import Footer from '../../Components/Footer';
import LiveLeaderboard from '../../Components/LiveLeaderboard';
import ScrollReveal from '../../Components/ScrollReveal';

export default function Show({ event, categoriesList, schedule, registrationClosed, totalContingents, auth, eventContents }) {
    const [activeDay, setActiveDay] = useState('day_1');
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const eventSlider = eventContents?.event_slider || [];
    const [currentBgIdx, setCurrentBgIdx] = useState(0);

    useEffect(() => {
        if (!eventSlider || eventSlider.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentBgIdx(prev => (prev + 1) % eventSlider.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [eventSlider]);

    // Countdown target: event.date_start (2026-06-20)
    useEffect(() => {
        const targetDate = new Date(`${event.date_start}T08:00:00`).getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                clearInterval(timer);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft({ days, hours, minutes, seconds });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [event.date_start]);

    const eventStart = new Date(`${event.date_start}T08:00:00`).getTime();
    const eventEnd = new Date(`${event.date_end}T23:59:00`).getTime();
    const now = Date.now();
    const isBeforeEvent = now < eventStart;
    const isDuringEvent = now >= eventStart && now <= eventEnd;
    const todayStr = new Date().toISOString().split('T')[0];
    const isDay1 = todayStr === event.date_start;
    const isDay2 = todayStr === event.date_end;
    const eventDayLabel = isDay1 ? 'Hari ke-1' : isDay2 ? 'Hari ke-2' : '';
    const eventDayDate = isDay1
        ? new Date(event.date_start).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : isDay2
        ? new Date(event.date_end).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] font-sans selection:bg-gold-primary selection:text-black">
            <Head title={event.name} />

            {/* Sub-header — event-specific quick links */}
            <div className="border-b border-bronze-muted/10 bg-deep-black/60 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 md:gap-3 text-[9px] md:text-xs overflow-x-auto">
                    {event.ticket_sale_status !== 'closed' && (
                        <Link href={`/events/${event.slug}/tickets`}
                            className="px-2 md:px-3.5 py-1 md:py-1.5 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black rounded font-bold hover:brightness-110 transition-all flex items-center gap-1.5"
                        >
                            <Ticket className="h-3.5 w-3.5" /> Beli Tiket
                        </Link>
                    )}
                    <Link href={`/events/${event.slug}/merchandise`}
                        className="px-2 md:px-3.5 py-1 md:py-1.5 bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white rounded font-bold hover:brightness-110 transition-all flex items-center gap-1.5"
                    >
                        <ShoppingBag className="h-3.5 w-3.5" /> Beli Produk
                    </Link>
                    <a href="#leaderboard-section"
                        className="px-2 md:px-3.5 py-1 md:py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded font-semibold transition-all flex items-center gap-1.5"
                    >
                        <BarChart3 className="h-3.5 w-3.5 text-gold-light" /> Leaderboard
                    </a>
                    <Link href={`/events/${event.slug}/rekap`}
                        className="px-2 md:px-3.5 py-1 md:py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded font-semibold transition-all flex items-center gap-1.5"
                    >
                        <KeyRound className="h-3.5 w-3.5 text-gold-light" /> Lihat Rekap Nilai
                    </Link>
                </div>
            </div>

            {/* Event Header Banner */}
            <ScrollReveal>
                <header className="relative py-16 border-b border-bronze-muted/10 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {eventSlider && eventSlider.length > 0 ? (
                        eventSlider.map((imgUrl, idx) => (
                            <div
                                key={idx}
                                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                                    idx === currentBgIdx ? 'opacity-40' : 'opacity-0'
                                }`}
                                style={{ backgroundImage: `url(${imgUrl})` }}
                            />
                        ))
                    ) : (
                        <div className="absolute inset-0 bg-checkerboard opacity-20" />
                    )}
                    {/* Chequered pattern frame borders around the header */}
                    <div className="absolute top-0 left-0 right-0 h-2.5 bg-checkerboard opacity-90 z-25" />
                    <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-checkerboard opacity-90 z-25" />
                    <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-checkerboard opacity-90 z-25" />
                    <div className="absolute top-0 bottom-0 right-0 w-2.5 bg-checkerboard opacity-90 z-25" />
                    <div className="absolute inset-0 bg-gradient-to-b from-deep-black/20 via-[#2A1A0A]/30 to-deep-black z-10" />
                </div>

                <div className="max-w-5xl mx-auto px-4 relative z-20 text-center lg:text-left lg:flex items-center justify-between gap-8">
                    <div className="mb-8 lg:mb-0">
                        <img src="/images/fiveinone.webp" alt="Sponsor" className="h-12 md:h-16 mb-4 mx-auto lg:mx-0 object-contain" />
                        <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest text-gold-cream border border-gold-primary/30 rounded-full bg-accent-maroon/30 uppercase mb-4">
                            EVENT UTAMA KAMI
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                            {event.name}
                        </h1>
                        <p className="text-sm text-text-primary/75 max-w-xl mb-6">
                            {event.description || 'Kompetisi keterampilan baris-berbaris paling bergengsi tingkat provinsi. Menampilkan kreasi orisinil gerakan formasi dan variasi paskibra terbaik.'}
                        </p>
                        
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-xs text-text-muted font-medium">
                            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded border border-white/5">
                                <Calendar className="h-4 w-4 text-gold-light" /> {new Date(event.date_start).toLocaleDateString('id-ID', {day: 'numeric'})} - {new Date(event.date_end).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded border border-white/5">
                                <MapPin className="h-4 w-4 text-gold-light" /> {event.venue}
                            </span>
                        </div>
                    </div>

                    {/* Event Stats / Timers Widget Side — Sporty Mewah */}
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 justify-center items-stretch shrink-0 w-full md:w-auto max-w-md md:max-w-none mx-auto md:mx-0">
                        {/* Countdown Timer — Sporty Mewah */}
                        <div className="card p-5 flex-1 min-w-[260px] text-center">
                            {isBeforeEvent ? (
                                <>
                                    <h4 className="text-label mb-5 flex items-center justify-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" /> Hitung Mundur Acara
                                    </h4>
                                    <div className="flex items-baseline justify-center gap-1 sm:gap-2">
                                        <div className="text-center">
                                            <span className="text-4xl sm:text-5xl font-display text-gold-bright leading-none tracking-wide animate-glow-soft">{String(timeLeft.days).padStart(2, '0')}</span>
                                            <p className="text-label mt-1">Hari</p>
                                        </div>
                                        <span className="text-2xl sm:text-3xl font-display text-gold-primary/30 self-center mt-2">:</span>
                                        <div className="text-center">
                                            <span className="text-4xl sm:text-5xl font-display text-gold-bright leading-none tracking-wide">{String(timeLeft.hours).padStart(2, '0')}</span>
                                            <p className="text-label mt-1">Jam</p>
                                        </div>
                                        <span className="text-2xl sm:text-3xl font-display text-gold-primary/30 self-center mt-2">:</span>
                                        <div className="text-center">
                                            <span className="text-4xl sm:text-5xl font-display text-gold-bright leading-none tracking-wide">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                            <p className="text-label mt-1">Menit</p>
                                        </div>
                                        <span className="text-2xl sm:text-3xl font-display text-gold-primary/30 self-center mt-2">:</span>
                                        <div className="text-center">
                                            <span className="text-4xl sm:text-5xl font-display text-gold-bright leading-none tracking-wide">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                            <p className="text-label mt-1">Detik</p>
                                        </div>
                                    </div>
                                    <p className="text-label text-[11px] mt-5">Bersiap Menuju Lomba Baris-Berbaris PASGARDA Vol.20</p>
                                </>
                            ) : (
                                <>
                                    <h4 className="text-label mb-5 flex items-center justify-center gap-1.5">
                                        Acara Sedang Berlangsung
                                    </h4>
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">LIVE</span>
                                    </div>
                                    {isDuringEvent && (
                                        <>
                                            <p className="text-lg font-bold text-white">{eventDayLabel}</p>
                                            <p className="text-xs text-text-muted mt-1">{eventDayDate}</p>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Live Gate Attendance — Sporty Mewah */}
                        <div className="card p-5 flex-1 min-w-[260px] text-center relative overflow-hidden">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <h4 className="text-label">Scan Gate Hari Ini</h4>
                            </div>
                            
                            <div className="flex justify-center items-baseline gap-2 mb-3">
                                {String(event.visitor_today || 0).padStart(4, '0').split('').map((digit, idx) => (
                                    <span key={idx} className="inline-block w-10 sm:w-11 py-2.5 bg-deep-black/70 text-2xl sm:text-3xl font-display text-emerald-300 border border-emerald-500/15 rounded-lg shadow-inner shadow-black/40 text-center leading-none">
                                        {digit}
                                    </span>
                                ))}
                            </div>
                            
                            <p className="text-label text-[10px]">Pengunjung Ter-scan Masuk</p>
                            
                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-center gap-3">
                                <span className="stat-badge">Day 1: {event.visitor_day_1 ?? 0}</span>
                                <span className="stat-badge">Day 2: {event.visitor_day_2 ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            </ScrollReveal>

            {/* Quick Stats Grid */}
            <section className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="premium-card p-4 border border-bronze-muted/10 text-center">
                        <Users className="h-5 w-5 text-gold-primary mx-auto mb-2" />
                        <span className="text-xl font-bold text-white block">{totalContingents}</span>
                        <span className="text-xs text-text-muted">Kontingen Terverifikasi</span>
                    </div>
                    <div className="premium-card p-4 border border-bronze-muted/10 text-center">
                        <Trophy className="h-5 w-5 text-gold-primary mx-auto mb-2" />
                        <span className="text-xl font-bold text-white block">4 Kategori</span>
                        <span className="text-xs text-text-muted">SD, SMP, SMA, Purna</span>
                    </div>
                    <div className="premium-card p-4 border border-bronze-muted/10 text-center">
                        <Ticket className="h-5 w-5 text-gold-primary mx-auto mb-2" />
                        <span className="text-xl font-bold text-white block">3 Paket</span>
                        <span className="text-xs text-text-muted">Silver, Gold, Platinum</span>
                    </div>
                    <div className="premium-card p-4 border border-bronze-muted/10 text-center">
                        <CheckCircle className="h-5 w-5 text-gold-primary mx-auto mb-2" />
                        <span className="text-xl font-bold text-white block">Ratusan</span>
                        <span className="text-xs text-text-muted">Piala & Hadiah</span>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left/Middle Column (Schedule & Contingents) */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* Registration Closed Warning */}
                    {registrationClosed && (
                        <div className="p-4 bg-accent-maroon/20 border border-accent-maroon/40 rounded flex gap-3.5 items-start">
                            <AlertTriangle className="h-6 w-6 text-gold-light shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-white text-sm">Pendaftaran Kontingen Telah Ditutup</h4>
                                <p className="text-xs text-text-primary/80 mt-1 leading-relaxed">
                                    Pendaftaran kontingen sekolah untuk LOMBA BARIS GARDA 55 VOL 20 resmi ditutup pada tanggal 1 Juni 2026. 
                                    Bagi kontingen yang telah terdaftar dan terverifikasi, silakan lakukan daftar ulang fisik di hari H.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Schedule Matrix */}
                    <ScrollReveal>
                    <div>
                        <div className="flex items-center justify-between border-b border-bronze-muted/20 pb-4 mb-6">
                            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-gold-primary" /> Matriks Jadwal Acara
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveDay('day_1')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                        activeDay === 'day_1'
                                            ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40'
                                            : 'bg-white/5 text-bronze-muted border-transparent hover:text-white'
                                    }`}
                                >
                                    Hari ke-1 (20 Jun)
                                </button>
                                <button
                                    onClick={() => setActiveDay('day_2')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                        activeDay === 'day_2'
                                            ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40'
                                            : 'bg-white/5 text-bronze-muted border-transparent hover:text-white'
                                    }`}
                                >
                                    Hari ke-2 (21 Jun)
                                </button>
                            </div>
                        </div>

                        <div className="premium-card p-6 border-bronze-muted/10 space-y-6">
                            <div className="flex justify-between items-center text-xs border-b border-bronze-muted/10 pb-3">
                                <span className="font-bold text-gold-light uppercase tracking-wider">{schedule[activeDay].date}</span>
                                <span className="text-text-muted">Kategori: {schedule[activeDay].categories.join(', ')}</span>
                            </div>

                            <div className="relative border-l border-bronze-muted/20 ml-3 space-y-6 pl-5">
                                {schedule[activeDay].timeline.map((item, idx) => (
                                    <div key={idx} className="relative">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[26px] top-1 h-3.5 w-3.5 rounded-full bg-deep-black border-2 border-gold-primary flex items-center justify-center">
                                            <div className="h-1 w-1 bg-gold-cream rounded-full"></div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-6">
                                            <span className="font-mono text-xs font-semibold text-gold-bright shrink-0">{item.time}</span>
                                            <p className="text-sm font-medium text-white/95">{item.activity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    </ScrollReveal>

                    {/* Dewan Juri Section */}
                    {eventContents?.judges && eventContents.judges.length > 0 && (
                        <ScrollReveal>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 border-b border-bronze-muted/20 pb-4 mb-6">
                                <Users className="h-5 w-5 text-gold-primary" /> Dewan Juri
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {eventContents.judges.map((judge, i) => (
                                    <div key={i} className="premium-card p-4 border border-bronze-muted/10 flex items-center gap-4">
                                        {judge.image_url ? (
                                            <img src={judge.image_url} alt={judge.name} className="h-14 w-14 rounded-full object-cover border-2 border-gold-primary/30 shrink-0" />
                                        ) : (
                                            <div className="h-14 w-14 rounded-full bg-accent-maroon/30 border-2 border-gold-primary/30 flex items-center justify-center shrink-0">
                                                <User className="h-6 w-6 text-gold-light" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-sm text-white">{judge.name}</p>
                                            <p className="text-xs text-gold-light/80">{judge.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </ScrollReveal>
                    )}

                    {/* Banthal & Hadiah Section */}
                    {eventContents?.banthal_prize && eventContents.banthal_prize.length > 0 && (
                        <ScrollReveal>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 border-b border-bronze-muted/20 pb-4 mb-6">
                                <Award className="h-5 w-5 text-gold-primary" /> Banthal & Hadiah
                            </h2>
                            <div className="space-y-4">
                                {eventContents.banthal_prize.map((cat, i) => (
                                    <div key={i} className="premium-card p-4 border border-bronze-muted/10">
                                        <h3 className="text-sm font-bold text-gold-light mb-3 flex items-center gap-2">
                                            {cat.type === 'title' ? (
                                                <Star className="h-4 w-4 text-gold-primary" />
                                            ) : (
                                                <Trophy className="h-4 w-4 text-gold-bright" />
                                            )}
                                            {cat.label}
                                        </h3>
                                        {cat.items && cat.items.length > 0 && (
                                            <div className="space-y-2 pl-4 border-l border-gold-primary/20">
                                                {cat.items.map((item, si) => (
                                                    <div key={si} className="flex items-start gap-2 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="font-semibold text-white">{item.title}</span>
                                                            {item.description && <span className="text-text-muted"> — {item.description}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        </ScrollReveal>
                    )}

                    {/* Useful Links Section */}
                    {eventContents?.useful_links && eventContents.useful_links.length > 0 && (
                        <ScrollReveal>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 border-b border-bronze-muted/20 pb-4 mb-6">
                                <LinkIcon className="h-5 w-5 text-gold-primary" /> Link Penting
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {eventContents.useful_links.map((link, i) => (
                                    <a key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="premium-card p-3 border border-bronze-muted/10 flex items-center gap-3 hover:border-gold-primary/30 transition-all group"
                                    >
                                        <LinkIcon className="h-4 w-4 text-gold-light shrink-0 group-hover:rotate-12 transition-transform" />
                                        <span className="text-xs font-medium text-white group-hover:text-gold-light transition-colors">{link.label}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                        </ScrollReveal>
                    )}
                </div>

                {/* Right Column (Registered Contingents List) */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 border-b border-bronze-muted/20 pb-4 mb-2">
                        <Shield className="h-5 w-5 text-gold-primary" /> Daftar Sekolah
                    </h2>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scroll-smooth">
                        {Object.entries(categoriesList).map(([category, schools]) => (
                            <div key={category} className="space-y-2">
                                <h3 className="text-xs font-bold text-gold-cream uppercase tracking-wider bg-accent-maroon/20 border-l-2 border-gold-primary py-1 px-2">
                                    Kategori {category} ({schools.length})
                                </h3>

                                {schools.length > 0 ? (
                                    <div className="divide-y divide-bronze-muted/10 bg-deep-black/40 border border-bronze-muted/10 rounded overflow-hidden animate-fade-in">
                                        {schools.map((school, i) => (
                                            <ScrollReveal key={school.id} delay={i * 80}>
                                            <div className="p-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                                                <div className="h-8 w-8 bg-accent-maroon/15 border border-bronze-muted/20 rounded-full flex items-center justify-center text-[10px] font-bold text-gold-light uppercase overflow-hidden shrink-0">
                                                    {school.logo_path ? (
                                                        <img src={school.logo_path} alt="Logo" className="h-full w-full object-cover" />
                                                    ) : (
                                                        school.school_name.substring(0, 2)
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-white block">{school.school_name}</span>
                                                    <span className="text-[10px] text-text-muted uppercase font-medium">{school.region}</span>
                                                </div>
                                            </div>
                                            </ScrollReveal>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-text-muted italic py-1 pl-2 animate-fade-in">Belum ada sekolah terdaftar di kategori ini.</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Live Leaderboard Section */}
            <ScrollReveal>
            <section className="max-w-6xl mx-auto px-4 py-10">
                <LiveLeaderboard eventSlug={event.slug} leaderboardStatus={event.leaderboard_status} finalTabStatus={event.final_tab_status} />
            </section>
            </ScrollReveal>

            {/* Footer */}
            <Footer className="mt-10" />
        </div>
    );
}
