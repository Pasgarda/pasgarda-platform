import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';

export default function Footer({ className = "mt-20" }) {
    const { props } = usePage();
    const visitorCount = props.visitorCount ?? 0;
    const sponsors = props.sponsors ?? [];

    return (
        <footer className={`border-t border-bronze-muted/10 py-12 bg-deep-black/60 text-center text-xs text-text-muted ${className}`}>
            <div className="max-w-6xl mx-auto px-4">
                {sponsors && sponsors.length > 0 && (
                    <div className="mb-8 border-b border-bronze-muted/10 pb-6">
                        <p className="text-[9px] text-bronze-muted uppercase font-bold tracking-widest mb-4">Supported By / Sponsor</p>
                        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                            {sponsors.map((url, idx) => (
                                <div key={idx} className="h-8 md:h-10 flex items-center justify-center">
                                    <img 
                                        src={url} 
                                        alt="" 
                                        className="max-h-full max-w-[120px] md:max-w-[140px] object-contain opacity-60 hover:opacity-100 transition-opacity duration-300" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <p className="font-bold text-text-primary/70 mb-2">Paskibra SMA Negeri 5 Samarinda</p>
                <p className="mb-2">Edisi Spesial LOMBA BARIS GARDA 55 VOL 20 "Chequered Champions" (2026)</p>
                <div className="mb-4 flex justify-center gap-4 text-[10px] text-bronze-muted uppercase font-bold tracking-wider flex-wrap">
                    <Link href="/" className="hover:text-gold-light">Beranda</Link>
                    <span>&bull;</span>
                    <Link href="/faq" className="hover:text-gold-light">FAQ</Link>
                    <span>&bull;</span>
                    <Link href="/testimonials" className="hover:text-gold-light">Testimoni</Link>
                </div>
                <div className="flex items-center justify-center gap-4 mb-3 text-[10px]">
                    <a href="https://www.instagram.com/pasgarda.official/" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-bronze-muted hover:text-gold-light transition-colors font-semibold"
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                        @pasgarda.official
                    </a>
                    <span className="text-bronze-muted/40">&bull;</span>
                    <a href="https://www.instagram.com/gardaevent.id/" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-bronze-muted hover:text-gold-light transition-colors font-semibold"
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                        @gardaevent.id
                    </a>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-bronze-muted mb-3">
                    <Users className="h-3 w-3" />
                    <span>{visitorCount} pengunjung telah hadir</span>
                </div>
                <p>&copy; 2026 PASGARDA. All rights reserved.</p>
                <div className="mt-4 pt-4 border-t border-bronze-muted/10 flex items-center justify-center gap-1.5 text-bronze-muted/60 text-[10px]">
                    <span>by</span>
                    <a
                        href="https://instagram.com/avaraweb"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-bronze-muted/80 hover:text-gold-light transition-colors font-semibold"
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                        @avaraweb
                    </a>
                </div>
            </div>
        </footer>
    );
}
