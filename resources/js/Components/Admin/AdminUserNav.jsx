import { useState } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import { LogOut, Users, User } from 'lucide-react';

export default function AdminUserNav() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [showLogout, setShowLogout] = useState(false);

    if (!user) return null;

    return (
        <>
            <div className="flex items-center gap-2">
                <Link href="/profile"
                    className="p-1.5 border border-transparent hover:border-gold-primary/30 rounded-full hover:bg-gold-primary/10 transition-all"
                >
                    {user.avatar ? (
                        <img src={`/storage/${user.avatar}`} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                        <User className="h-4.5 w-4.5 text-gold-light" />
                    )}
                </Link>
                <button onClick={() => setShowLogout(true)}
                    className="px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border border-bronze-muted/30 text-bronze-muted hover:bg-white/5 hover:text-white flex items-center gap-1.5"
                >
                    <LogOut className="h-3.5 w-3.5" /> Log Out
                </button>
            </div>

            {showLogout && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowLogout(false)}>
                    <div className="premium-card max-w-sm w-full p-6 border border-gold-primary/30" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-sm font-extrabold text-white mb-2">Konfirmasi Log Out</h4>
                        <p className="text-xs text-text-primary/80 mb-4">Apakah Anda yakin ingin keluar?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setShowLogout(false)}
                                className="flex-1 py-2 bg-white/5 border border-bronze-muted/20 text-text-muted hover:text-white rounded text-xs font-bold transition-all"
                            >
                                Batal
                            </button>
                            <button onClick={() => { router.post('/auth/logout'); setShowLogout(false); }}
                                className="flex-1 py-2 bg-accent-mahogany hover:bg-accent-burgundy text-white font-bold rounded text-xs transition-all"
                            >
                                Ya, Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
