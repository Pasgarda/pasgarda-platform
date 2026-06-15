import React from 'react';

const STATUS_STYLES = {
    lunas:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    paid:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    active:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    published:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    enabled:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    verified:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    sudah:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',

    pending:     'bg-amber-500/15 text-amber-400 border-amber-500/25',
    draft:       'bg-amber-500/15 text-amber-400 border-amber-500/25',
    menunggu:    'bg-amber-500/15 text-amber-400 border-amber-500/25',
    belum:       'bg-amber-500/15 text-amber-400 border-amber-500/25',

    ditolak:     'bg-rose-500/15 text-rose-400 border-rose-500/25',
    failed:      'bg-rose-500/15 text-rose-400 border-rose-500/25',
    rejected:    'bg-rose-500/15 text-rose-400 border-rose-500/25',
    disabled:    'bg-rose-500/15 text-rose-400 border-rose-500/25',
    inactive:    'bg-rose-500/15 text-rose-400 border-rose-500/25',

    default:     'bg-white/5 text-text-muted border-bronze-muted/20',
};

const STATUS_ICONS = {
    lunas:       '✓',
    paid:        '✓',
    active:      '●',
    published:   '●',
    enabled:     '✓',
    verified:    '✓',
    sudah:       '✓',

    pending:     '◷',
    draft:       '○',
    menunggu:    '◷',
    belum:       '○',

    ditolak:     '✕',
    failed:      '✕',
    rejected:    '✕',
    disabled:    '✕',
    inactive:    '○',
};

function normalizeKey(status) {
    if (!status) return 'default';
    const s = status.toLowerCase().trim();
    for (const key of Object.keys(STATUS_STYLES)) {
        if (s === key || s.includes(key)) return key;
    }
    if (s.includes('lunas') || s === 'paid') return 'lunas';
    if (s.includes('pending') || s.includes('menunggu')) return 'pending';
    if (s.includes('ditolak') || s === 'failed' || s.includes('reject')) return 'ditolak';
    if (s === 'draft' || s === 'active') return s;
    if (s.includes('sudah') || s.includes('check')) return 'sudah';
    if (s.includes('belum')) return 'belum';
    if (s === 'verified' || s === 'enabled' || s === 'disabled') return s;
    return 'default';
}

export default function StatusBadge({ status, label, className = '', icon, pill = false }) {
    const key = normalizeKey(status);
    const style = STATUS_STYLES[key] || STATUS_STYLES.default;
    const defaultIcon = STATUS_ICONS[key] || '';
    const displayLabel = label || status || '-';

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${pill ? 'rounded-full' : 'rounded'} ${style} ${className}`}>
            {(icon ?? defaultIcon) && <span className="text-[8px]">{icon ?? defaultIcon}</span>}
            {displayLabel}
        </span>
    );
}
