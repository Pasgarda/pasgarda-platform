import React, { useRef, useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Trophy, Calendar, MapPin, Newspaper, Award, Star, Users } from 'lucide-react';
import ScrollReveal from '../Components/ScrollReveal';
import Footer from '../Components/Footer';

export default function Welcome({ activeEvent, hallOfFame, news, auth, testimonials, visitorCount, homeSlider }) {
    const scrollRef = useRef(null);
    const isPausedRef = useRef(false);
    const [currentBgIdx, setCurrentBgIdx] = useState(0);

    useEffect(() => {
        if (!homeSlider || homeSlider.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentBgIdx(prev => (prev + 1) % homeSlider.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [homeSlider]);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container || !testimonials || testimonials.length <= 1) return;

        const interval = setInterval(() => {
            if (isPausedRef.current) return;
            container.scrollLeft += 1;
            if (container.scrollLeft + container.clientWidth >= container.scrollWidth) {
                container.scrollLeft = 0;
            }
        }, 30);

        return () => clearInterval(interval);
    }, [testimonials]);

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] font-sans selection:bg-gold-primary selection:text-black">
            <Head title="Official Hub" />

            {/* Hero Section */}
            <ScrollReveal>
                <header className="relative py-24 border-b border-bronze-muted/10 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {homeSlider && homeSlider.length > 0 ? (
                        homeSlider.map((imgUrl, idx) => (
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
                    <div className="absolute inset-0 bg-gradient-to-b from-deep-black/30 via-[#2A1A0A]/40 to-deep-black z-10" />
                </div>
                
                <div className="max-w-4xl mx-auto px-4 text-center relative z-20">
                    <img src="/images/pasgarda.png" alt="PASGARDA" className="h-16 w-auto mx-auto mb-3" />
                    <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest text-gold-cream border border-gold-primary/30 rounded-full bg-accent-maroon/30 uppercase mb-4">
                        PASKIBRA SMA NEGERI 5 SAMARINDA
                    </span>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
                        Chequered <span className="text-gold-primary">Champions</span>
                    </h1>
                    <p className="text-lg text-text-primary/80 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Selamat datang di Platform Resmi Multi-Event PASGARDA. Pusat pendaftaran, penjualan tiket online/OTS, 
                        perolehan suara voting pendukung, dan rekapitulasi penilaian real-time.
                    </p>

                    {activeEvent ? (
                        <div className="inline-flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href={`/events/${activeEvent.slug}`}
                                className="px-8 py-3 bg-gradient-to-r from-accent-maroon to-accent-burgundy hover:brightness-110 text-white font-bold rounded shadow-lg border border-accent-burgundy/40 transition-all text-sm tracking-wide"
                            >
                                Kunjungi Event LOMBA BARIS GARDA 55 VOL 20
                            </Link>
                            <Link
                                href={`/events/${activeEvent.slug}/tickets`}
                                className="px-8 py-3 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-deep-black font-extrabold rounded shadow-lg border border-gold-light/40 transition-all text-sm tracking-wide"
                            >
                                Beli Tiket Masuk
                            </Link>
                        </div>
                    ) : (
                        <p className="text-bronze-muted font-medium italic">Tidak ada event kompetisi aktif saat ini.</p>
                    )}
                </div>
            </header>
            </ScrollReveal>

            <ScrollReveal>
            {/* Active Event Banner (If exists) */}
            {activeEvent && (
                <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
                    <div className="premium-card p-6 border border-gold-primary/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-accent-maroon/20 border border-accent-maroon/50 rounded-lg text-gold-primary shrink-0">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{activeEvent.name}</h3>
                                <p className="text-sm text-text-muted mt-1 flex items-center gap-3">
                                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {activeEvent.date_range}</span>
                                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {activeEvent.venue}</span>
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/events/${activeEvent.slug}`}
                            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded font-semibold text-xs tracking-wide text-center transition-all shrink-0"
                        >
                            Selengkapnya &rarr;
                        </Link>
                    </div>
                    </section>
                )}
            </ScrollReveal>

            {/* News & Announcements Portal */}
            <section className="max-w-6xl mx-auto px-4 py-20">
                <div className="flex items-center gap-2.5 mb-8">
                    <Newspaper className="h-6 w-6 text-gold-primary" />
                    <h2 className="text-2xl font-bold tracking-tight text-white">Berita & Pengumuman</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {news.map((item, i) => (
                        <ScrollReveal key={item.id} delay={i * 100}>
                            <Link href={`/news/${item.id}`} className="block premium-card overflow-hidden border border-bronze-muted/10 flex flex-col justify-between hover:border-gold-primary/30 transition-all duration-300 group">
                                {item.image_url && (
                                    <div className="h-48 w-full border-b border-bronze-muted/10 bg-deep-black/60 overflow-hidden">
                                        <img src={item.image_url} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mb-4 ${
                                            item.category === 'Announcement' ? 'bg-accent-mahogany/20 text-accent-mahogany border border-accent-mahogany/30' :
                                            item.category === 'Competition' ? 'bg-gold-primary/20 text-gold-light border border-gold-primary/30' :
                                            'bg-accent-maroon/20 text-white/90 border border-accent-maroon/30'
                                        }`}>
                                            {item.category}
                                        </span>
                                        <h3 className="font-bold text-white text-base mb-3 leading-snug group-hover:text-gold-light transition-all">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-text-primary/70 leading-relaxed mb-6">
                                            {item.summary}
                                        </p>
                                    </div>
                                    <span className="text-xs text-text-muted font-medium">{item.date}</span>
                                </div>
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>
            </section>

            {/* Testimonials Slider */}
            {testimonials && testimonials.length > 0 && (
                <section className="max-w-6xl mx-auto px-4 pb-24">
                    <div className="flex items-center gap-2.5 mb-8">
                        <Star className="h-6 w-6 text-gold-primary fill-gold-primary" />
                        <h2 className="text-2xl font-bold tracking-tight text-white">Kata Mereka</h2>
                    </div>

                    <div
                        ref={scrollRef}
                        className="flex gap-5 overflow-x-auto py-2 scrollbar-hide items-stretch"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {testimonials.map((t) => (
                            <div
                                key={t.id}
                                onMouseEnter={() => { isPausedRef.current = true }}
                                onMouseLeave={() => { isPausedRef.current = false }}
                                onTouchStart={() => { isPausedRef.current = true }}
                                onTouchEnd={() => { isPausedRef.current = false }}
                                className="premium-card p-5 sm:p-6 border border-bronze-muted/10 hover:border-gold-primary/20 transition-all w-[300px] sm:w-[340px] md:w-[380px] shrink-0 flex flex-col"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {t.user_avatar ? (
                                        <img src={`/storage/${t.user_avatar}`} alt="" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-bronze-muted/20" />
                                    ) : (
                                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-accent-maroon/30 flex items-center justify-center shrink-0">
                                            <Users className="h-4 w-4 text-bronze-muted" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-white text-sm truncate">{t.user_name}</p>
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`h-3 w-3 ${s <= t.rating ? 'fill-gold-primary text-gold-primary' : 'text-bronze-muted/30'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-text-primary/80 leading-relaxed flex-1">&ldquo;{t.message}&rdquo;</p>
                                <p className="text-[10px] text-text-muted mt-3 pt-3 border-t border-bronze-muted/10">{t.created_at}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <ScrollReveal>
            {/* Hall of Fame Historical Champions */}
            <section className="max-w-6xl mx-auto px-4 pb-24">
                <div className="flex items-center gap-2.5 mb-8">
                    <Award className="h-6 w-6 text-gold-primary" />
                    <h2 className="text-2xl font-bold tracking-tight text-white">Hall of Fame (Pemenang Historis)</h2>
                </div>

                <div className="premium-card overflow-hidden border border-bronze-muted/20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-bronze-muted/20 bg-accent-maroon/10">
                                    <th className="p-4 font-bold text-gold-light tracking-wide uppercase text-xs">Tahun / Event</th>
                                    <th className="p-4 font-bold text-gold-light tracking-wide uppercase text-xs">Juara Umum</th>
                                    <th className="p-4 font-bold text-gold-light tracking-wide uppercase text-xs">Runner Up</th>
                                    <th className="p-4 font-bold text-gold-light tracking-wide uppercase text-xs">Pelatih / Danton Terbaik</th>
                                    <th className="p-4 font-bold text-gold-light tracking-wide uppercase text-xs">Kontingen Terfavorit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bronze-muted/10">
                                {hallOfFame.map((winner, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <span className="font-bold text-white block">{winner.year}</span>
                                            <span className="text-xs text-text-muted">{winner.event_name}</span>
                                        </td>
                                        <td className="p-4 font-semibold text-white">{winner.champion}</td>
                                        <td className="p-4 text-text-primary/80">{winner.runner_up}</td>
                                        <td className="p-4 text-text-primary/80">{winner.best_commander}</td>
                                        <td className="p-4 text-gold-light/90">{winner.favorite}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            </ScrollReveal>

            {/* Footer */}
            <Footer className="mt-0" />
        </div>
    );
}
