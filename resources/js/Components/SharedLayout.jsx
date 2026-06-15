import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Menu, X, LogIn, LogOut, LayoutDashboard, Ticket, Trophy, HelpCircle, User, Home } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function SharedLayout({ children }) {
    const { props } = usePage();
    const { auth, activeEvent } = props;
    const eventSlug = activeEvent?.slug || props.event?.slug;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showLogout, setShowLogout] = useState(false);
    const currentPath = window.location.pathname;

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const navLinks = [
        { href: '/', label: 'Beranda', icon: Home },
        { href: eventSlug ? `/events/${eventSlug}` : '/', label: 'Event', icon: Trophy },
        ...(auth?.user ? [
            { href: '/my-tickets', label: 'Tiket Saya', icon: Ticket },
            { href: '/profile', label: 'Profil Saya', icon: User }
        ] : []),
        { href: '/faq', label: 'FAQ', icon: HelpCircle },
    ];

    const closeMobile = () => setMobileOpen(false);

    return (
        <>
            <nav className="border-b border-bronze-muted/20 bg-deep-black/90 backdrop-blur sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group" onClick={closeMobile}>
                        <img src="/images/pasgarda.png" alt="PASGARDA" className="h-12 w-auto" />
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-4">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = currentPath === link.href;
                            return (
                                <Link key={`${link.href}-${link.label}`} href={link.href}
                                    className={`nav-link text-sm font-medium px-1 py-1 ${isActive ? 'nav-link--active' : ''}`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {link.label}
                                </Link>
                            );
                        })}
                        {auth?.user ? (
                            <div className="flex items-center gap-3">
                                {auth.user.role === 'coach' && eventSlug && (
                                    <Link href={`/events/${eventSlug}/myscore`}
                                        className="px-3 py-1.5 bg-accent-maroon/30 border border-accent-maroon/50 text-white rounded text-xs font-semibold hover:bg-accent-burgundy transition-all"
                                    >
                                        Portal Pelatih
                                    </Link>
                                )}
                                {['super_admin', 'admin', 'operator_gate', 'operator_nilai'].includes(auth.user.role) && (
                                    <Link href="/admin/dashboard"
                                        className="px-3.5 py-1.5 bg-accent-maroon/40 border border-accent-maroon/60 text-white rounded text-xs font-semibold hover:bg-accent-burgundy transition-all flex items-center gap-1.5"
                                    >
                                        <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard Admin
                                    </Link>
                                )}
                                <Link href="/profile"
                                    className="px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded text-xs font-semibold hover:bg-white/10 hover:border-gold-primary/30 transition-all flex items-center gap-1.5"
                                >
                                    {auth.user.avatar ? (
                                        <img src={`/storage/${auth.user.avatar}`} alt="" className="h-3.5 w-3.5 rounded-full object-cover border border-gold-primary/30" />
                                    ) : (
                                        <User className="h-3.5 w-3.5 text-gold-primary" />
                                    )}
                                    <span>Profil Saya</span>
                                </Link>
                                <button onClick={() => setShowLogout(true)}
                                    className="px-3.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded text-xs font-semibold transition-all flex items-center gap-1.5"
                                >
                                    <LogOut className="h-3.5 w-3.5" /> Keluar
                                </button>
                            </div>
                        ) : (
                            <Link href="/login"
                                className="px-4 py-1.5 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black rounded text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5"
                            >
                                <LogIn className="h-3.5 w-3.5" /> Masuk
                            </Link>
                        )}
                    </div>

                    {/* Mobile: profile + login/logout icon + hamburger */}
                    <div className="md:hidden flex items-center gap-1">
                        {auth?.user && (
                            <Link href="/profile"
                                className="p-2 text-gold-primary hover:text-gold-bright transition-all flex items-center"
                                aria-label="Profil Saya"
                                onClick={closeMobile}
                            >
                                {auth.user.avatar ? (
                                    <img src={`/storage/${auth.user.avatar}`} alt="" className="h-5 w-5 rounded-full object-cover border border-gold-primary/30" />
                                ) : (
                                    <User className="h-5 w-5" />
                                )}
                            </Link>
                        )}
                        {auth?.user ? (
                            <button onClick={() => setShowLogout(true)}
                                className="p-2 text-red-400 hover:text-red-300 transition-all"
                                aria-label="Keluar"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        ) : (
                            <Link href="/login"
                                className="p-2 text-gold-primary hover:text-gold-bright transition-all"
                                aria-label="Masuk"
                            >
                                <LogIn className="h-5 w-5" />
                            </Link>
                        )}
                        <button onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 text-white hover:text-gold-light transition-all"
                            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile drawer */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-bronze-muted/20 bg-deep-black/98 backdrop-blur">
                        <div className="px-4 py-4 space-y-2">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = currentPath === link.href;
                                return (
                                    <Link key={`${link.href}-${link.label}`} href={link.href} onClick={closeMobile}
                                        className={`nav-link block px-3 py-2 text-sm font-medium rounded !inline-flex ${isActive ? 'nav-link--active' : 'text-white'}`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {link.label}
                                    </Link>
                                );
                            })}
                            {auth?.user ? (
                                <>
                                    {auth.user.role === 'coach' && eventSlug && (
                                        <Link href={`/events/${eventSlug}/myscore`} onClick={closeMobile}
                                            className="block px-3 py-2 text-sm font-medium text-accent-maroon hover:text-white hover:bg-accent-maroon/20 rounded transition-all"
                                        >
                                            Portal Pelatih
                                        </Link>
                                    )}
                                    {['super_admin', 'admin', 'operator_gate', 'operator_nilai'].includes(auth.user.role) && (
                                        <Link href="/admin/dashboard" onClick={closeMobile}
                                            className="block px-3 py-2 text-sm font-medium text-accent-maroon hover:text-white hover:bg-accent-maroon/20 rounded transition-all"
                                        >
                                            <LayoutDashboard className="h-3.5 w-3.5 inline mr-1.5" /> Dashboard Admin
                                        </Link>
                                    )}

                                    <div className="pt-2 mt-2 border-t border-bronze-muted/20">
                                        <button onClick={() => { closeMobile(); setShowLogout(true); }}
                                            className="block w-full px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all text-left"
                                        >
                                            <LogOut className="h-3.5 w-3.5 inline mr-1.5" /> Keluar
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <Link href="/login" onClick={closeMobile}
                                    className="block px-3 py-2 text-sm font-bold text-gold-primary hover:text-white hover:bg-gold-primary/10 rounded transition-all"
                                >
                                    <LogIn className="h-3.5 w-3.5 inline mr-1.5" /> Masuk
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {children}

            <ConfirmationModal
                open={showLogout}
                onClose={() => setShowLogout(false)}
                onConfirm={() => { router.post('/auth/logout'); setShowLogout(false); }}
                title="Konfirmasi Log Out"
                message="Apakah Anda yakin ingin keluar?"
                confirmText="Ya, Log Out"
                cancelText="Batal"
                variant="danger"
            />
        </>
    );
}
