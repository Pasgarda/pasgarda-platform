import React, { useEffect } from 'react';
import {
    AlertTriangle,
    X,
    CheckCircle,
    Info,
    Trash2,
    ShieldAlert,
} from 'lucide-react';

const VARIANT_CONFIG = {
    default: {
        icon: AlertTriangle,
        iconBg: 'bg-accent-maroon/20',
        iconColor: 'text-gold-primary',
        confirmBtn:
            'bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black hover:brightness-110',
    },
    danger: {
        icon: Trash2,
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-400',
        confirmBtn: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    },
    warning: {
        icon: ShieldAlert,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-400',
        confirmBtn:
            'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30',
    },
    success: {
        icon: CheckCircle,
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-400',
        confirmBtn:
            'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30',
    },
    info: {
        icon: Info,
        iconBg: 'bg-sky-500/10',
        iconColor: 'text-sky-400',
        confirmBtn:
            'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30',
    },
};

/**
 * Premium confirmation dialog for the Pasgarda design system.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {() => void} onConfirm
 * @param {string} [title]
 * @param {string|ReactNode} [message]
 * @param {string} [confirmText]
 * @param {string} [cancelText]
 * @param {'default'|'danger'|'warning'|'success'|'info'} [variant]
 * @param {boolean} [loading]
 * @param {ReactNode} [icon] - Override the default icon
 */
export default function ConfirmationModal({
    open,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin?',
    confirmText = 'Ya',
    cancelText = 'Batal',
    variant = 'default',
    loading = false,
    icon: CustomIcon,
}) {
    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === 'Escape' && !loading) onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, loading, onClose]);

    if (!open) return null;

    const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.default;
    const Icon = CustomIcon || config.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-fadeIn"
                onClick={loading ? undefined : onClose}
            />

            {/* Dialog */}
            <div
                className="relative premium-card border border-bronze-muted/20 w-full max-w-sm overflow-hidden animate-popIn"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Top accent bar */}
                <div className="h-0.5 bg-gradient-to-r from-accent-maroon via-gold-primary to-accent-maroon" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-3.5 right-3.5 text-bronze-muted/50 hover:text-white transition-all disabled:opacity-30"
                    aria-label="Tutup"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="p-5 sm:p-6 text-center">
                    {/* Icon */}
                    <div
                        className={`inline-flex p-3.5 rounded-2xl mb-4 ${config.iconBg}`}
                    >
                        <Icon
                            className={`h-6 w-6 sm:h-7 sm:w-7 ${config.iconColor}`}
                            strokeWidth={1.5}
                        />
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-extrabold text-white mb-2 tracking-tight">
                        {title}
                    </h3>

                    {/* Message */}
                    <div className="text-xs sm:text-sm text-text-primary/60 mb-6 leading-relaxed max-w-xs mx-auto">
                        {message}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-2.5 sm:py-3 border border-bronze-muted/30 text-bronze-muted rounded-lg text-xs font-bold hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 py-2.5 sm:py-3 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${config.confirmBtn}`}
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Memproses...
                                </span>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}