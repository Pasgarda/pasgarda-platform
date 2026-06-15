import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, ArrowLeft, Shield, Users as UsersIcon, ChevronDown } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

export default function Users({ users, search: initialSearch, roleFilter }) {
    const [searchTerm, setSearchTerm] = React.useState(initialSearch || '');
    const [searchTimeout, setSearchTimeout] = React.useState(null);

    const handleSearch = (val) => {
        setSearchTerm(val);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => {
            router.get(window.location.pathname, { search: val || null, role: roleFilter || null }, { preserveState: true, replace: true });
        }, 400));
    };

    const handleRoleFilter = (role) => {
        router.get(window.location.pathname, { search: searchTerm || null, role: role || null }, { preserveState: true, replace: true });
    };

    const roles = [
        { value: '', label: 'Semua Role' },
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'operator_gate', label: 'Operator Gate' },
        { value: 'operator_nilai', label: 'Operator Nilai' },
        { value: 'operator_produk', label: 'Operator Produk' },
        { value: 'coach', label: 'Pelatih' },
        { value: 'spectator', label: 'Pengunjung' },
    ];

    const roleColors = {
        super_admin: 'text-red-400 bg-red-500/10',
        admin: 'text-purple-400 bg-purple-500/10',
        operator_gate: 'text-blue-400 bg-blue-500/10',
        operator_nilai: 'text-cyan-400 bg-cyan-500/10',
        operator_produk: 'text-amber-400 bg-amber-500/10',
        coach: 'text-emerald-400 bg-emerald-500/10',
        spectator: 'text-text-muted bg-white/5',
    };

    return (
        <div className="min-h-screen bg-checkerboard">
            <Head title="Manajemen User" />

            {/* Nav */}
            <nav className="border-b border-bronze-muted/20 bg-deep-black/90 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 group">
                        <img src="/images/pasgarda.png" alt="PASGARDA" className="h-12 w-auto" />
                        <span className="text-xs text-text-muted font-normal">Admin</span>
                    </Link>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
                    </Link>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                            <UsersIcon className="h-5 w-5 text-gold-primary" /> Manajemen User
                        </h1>
                        <p className="text-xs text-text-muted mt-1">Kelola role pengguna platform PASGARDA.</p>
                    </div>
                </div>

                {/* Search + Filter */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Cari nama atau email..."
                            className="w-full pl-8 pr-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-xs"
                        />
                    </div>

                    <div className="flex gap-1">
                        {roles.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => handleRoleFilter(r.value)}
                                className={`px-3 py-2 rounded text-xs font-semibold transition-all ${
                                    (roleFilter || '') === r.value
                                        ? 'bg-gold-primary/20 text-gold-light border border-gold-primary/30'
                                        : 'bg-deep-black/60 text-text-muted border border-bronze-muted/20 hover:text-white'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <ScrollReveal>
                    <div className="premium-card overflow-hidden border border-bronze-muted/10">
                    <div className="overflow-x-auto scroll-smooth">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-bronze-muted/20 bg-deep-black/60">
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Nama</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Email</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Role</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px]">Terdaftar</th>
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bronze-muted/10">
                                {users.data.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.01]">
                                        <td className="p-3 font-semibold text-white">{u.name}</td>
                                        <td className="p-3 text-text-primary/70">{u.email}</td>
                                        <td className="p-3">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${roleColors[u.role] || roleColors.spectator}`}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-text-muted">{u.created_at}</td>
                                        <td className="p-3 text-right">
                                            <RoleDropdown userId={u.id} currentRole={u.role} userName={u.name} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {users.data.length === 0 && (
                        <p className="p-6 text-center text-xs text-text-muted">Tidak ada user ditemukan.</p>
                    )}

                    {/* Pagination */}
                    {users.links && (
                        <div className="flex items-center justify-center gap-1 p-4 border-t border-bronze-muted/10">
                            {users.links.filter(l => !isNaN(l.label)).map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => router.get(link.url, { search: searchTerm || null, role: roleFilter || null }, { preserveState: true, replace: true })}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                        link.active
                                            ? 'bg-gold-primary/20 text-gold-light border border-gold-primary/30'
                                            : 'bg-deep-black/60 text-text-muted border border-bronze-muted/20 hover:text-white'
                                    }`}
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                        )}
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
}

function RoleDropdown({ userId, currentRole, userName }) {
    const roles = [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'operator_gate', label: 'Operator Gate' },
        { value: 'operator_nilai', label: 'Operator Nilai' },
        { value: 'operator_produk', label: 'Operator Produk' },
        { value: 'coach', label: 'Pelatih' },
        { value: 'spectator', label: 'Pengunjung' },
    ];

    const changeRole = (role) => {
        if (role === currentRole) return;
        if (!confirm(`Apakah Anda yakin ingin mengubah role ${userName} menjadi ${role.replace('_', ' ')}?`)) return;
        router.post(`/admin/users/${userId}/role`, { role }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <div className="relative inline-block w-36">
            <select
                value={currentRole}
                onChange={(e) => changeRole(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-deep-black/60 border border-bronze-muted/30 rounded text-xs font-semibold text-text-muted hover:text-white focus:text-white transition-all cursor-pointer focus:outline-none focus:border-gold-primary/50 appearance-none text-left"
            >
                {roles.map((r) => (
                    <option key={r.value} value={r.value} className="bg-deep-black text-white">
                        {r.label}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-text-muted">
                <ChevronDown className="h-3 w-3" />
            </div>
        </div>
    );
}
