import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const VARIANTS = {
    success: {
        icon: CheckCircle,
        container: 'bg-emerald-500/10 border-emerald-500/30',
        iconColor: 'text-emerald-400',
        titleColor: 'text-emerald-300',
        textColor: 'text-emerald-200/80',
        closeHover: 'hover:text-emerald-300',
    },
    error: {
        icon: XCircle,
        container: 'bg-red-500/10 border-red-500/30',
        iconColor: 'text-red-400',
        titleColor: 'text-red-300',
        textColor: 'text-red-200/80',
        closeHover: 'hover:text-red-300',
    },
    warning: {
        icon: AlertTriangle,
        container: 'bg-amber-500/10 border-amber-500/30',
        iconColor: 'text-amber-400',
        titleColor: 'text-amber-300',
        textColor: 'text-amber-200/80',
        closeHover: 'hover:text-amber-300',
    },
    info: {
        icon: Info,
        container: 'bg-sky-500/10 border-sky-500/30',
        iconColor: 'text-sky-400',
        titleColor: 'text-sky-300',
        textColor: 'text-sky-200/80',
        closeHover: 'hover:text-sky-300',
    },
};

/**
 * Reusable inline alert component for the Pasgarda design system.
 *
 * @param {'success'|'error'|'warning'|'info'} variant
 * @param {string} [title]         - Optional bold title above the message
 * @param {string|ReactNode} children - Alert body content
 * @param {boolean} [dismissible]  - Show close button
 * @param {() => void} [onDismiss] - Called when close button is clicked
 * @param {string} [className]     - Extra wrapper classes
 */
export default function Alert({
    variant = 'info',
    title,
    children,
    dismissible = false,
    onDismiss,
    className = '',
}) {
    const v = VARIANTS[variant] || VARIANTS.info;
    const Icon = v.icon;

    return (
        <div
            className={`relative p-3.5 sm:p-4 border rounded-lg flex items-start gap-2.5 animate-fade-in ${v.container} ${className}`}
            role="alert"
        >
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 ${v.iconColor}`} />
            <div className="flex-1 min-w-0">
                {title && (
                    <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 ${v.titleColor}`}>
                        {title}
                    </p>
                )}
                <div className={`text-[11px] sm:text-xs leading-relaxed font-medium ${v.textColor}`}>
                    {children}
                </div>
            </div>
            {dismissible && onDismiss && (
                <button
                    onClick={onDismiss}
                    className={`shrink-0 p-0.5 opacity-50 ${v.closeHover} hover:opacity-100 transition-all`}
                    aria-label="Tutup"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
