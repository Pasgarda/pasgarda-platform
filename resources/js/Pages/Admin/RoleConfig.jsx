import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Shield, Save, ArrowLeft } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';

export default function RoleConfig({ event, modules, roles, roleLabels, permissions }) {
    const [form, setForm] = useState(permissions);
    const [saving, setSaving] = useState(false);

    const toggle = (module, role) => {
        setForm(prev => ({
            ...prev,
            [module]: {
                ...(prev[module] || {}),
                [role]: !((prev[module] || {})[role] ?? false),
            }
        }));
    };

    const handleSave = () => {
        setSaving(true);
        router.post(`/admin/events/${event.slug}/role-config`, {
            permissions: form,
        }, {
            onSuccess: () => setSaving(false),
            onError: () => setSaving(false),
        });
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Konfigurasi Role" />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/15 pb-6 mb-8">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-gold-light bg-white/5 px-2 py-0.5 border border-white/20 rounded-full uppercase">
                            Super Admin Room
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
                            <Shield className="h-7 w-7 text-gold-primary" /> Konfigurasi <span className="text-gold-primary">Role</span>
                        </h1>
                        <p className="text-xs text-text-muted mt-1">Atur akses role ke setiap modul operasional — {event.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <a
                            href={`/admin/events/${event.slug}`}
                            className="px-3 py-1.5 rounded text-xs font-bold transition-all border bg-white/5 text-text-muted border-white/10 hover:text-white flex items-center gap-1"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard Event
                        </a>
                    </div>
                </div>

                {/* Table */}
                <ScrollReveal>
                    <div className="bg-white/5 border border-white/10 rounded overflow-hidden mb-6">
                    <div className="overflow-x-auto scroll-smooth">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/40">
                                    <th className="p-3 text-text-muted font-bold uppercase text-[10px] min-w-[200px]">Modul</th>
                                    {roles.map(role => (
                                        <th key={role} className="p-3 text-text-muted font-bold uppercase text-[10px] text-center min-w-[100px]">
                                            {roleLabels[role]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Object.entries(modules).map(([moduleKey, moduleLabel]) => (
                                    <tr key={moduleKey} className="hover:bg-white/[0.01]">
                                        <td className="p-3 font-semibold text-white">{moduleLabel}</td>
                                        {roles.map(role => {
                                            const checked = (form[moduleKey] || {})[role] ?? false;
                                            return (
                                                <td key={role} className="p-3 text-center">
                                                    <label className="inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggle(moduleKey, role)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                            checked
                                                                ? 'bg-gold-primary border-gold-primary'
                                                                : 'bg-transparent border-white/20 hover:border-white/40'
                                                        }`}>
                                                            {checked && (
                                                                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </label>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Save */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-gold-primary to-gold-bright hover:brightness-110 text-black font-extrabold rounded text-xs tracking-wider uppercase shadow transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
