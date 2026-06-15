import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_VARIANTS = {
    success: {
        icon: CheckCircle,
        bg: 'bg-emerald-900/95 border-emerald-500/30 text-emerald-100',
        iconColor: 'text-emerald-400',
        progress: 'bg-emerald-400',
    },
    error: {
        icon: XCircle,
        bg: 'bg-red-900/95 border-red-500/30 text-red-100',
        iconColor: 'text-red-400',
        progress: 'bg-red-400',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-900/95 border-amber-500/30 text-amber-100',
        iconColor: 'text-amber-400',
        progress: 'bg-amber-400',
    },
    info: {
        icon: Info,
        bg: 'bg-sky-900/95 border-sky-500/30 text-sky-100',
        iconColor: 'text-sky-400',
        progress: 'bg-sky-400',
    },
};

const DURATION = 4500;

/**
 * Global toast notification system.
 *
 * Listens to Inertia flash props (status, error, warning, info) and also
 * exposes a manual API via window.__toast(type, message).
 *
 * Stacks multiple toasts vertically with animation.
 */
export default function Toast() {
    const { props } = usePage();
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const addToast = useCallback((type, message) => {
        if (!message) return;
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, type, message, exiting: false }]);

        // Auto-dismiss
        setTimeout(() => {
            setToasts((prev) =>
                prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
            );
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 350);
        }, DURATION);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 350);
    }, []);

    // Listen to Inertia flash props
    useEffect(() => {
        const flash = props.flash;
        if (flash?.status) addToast('success', flash.status);
        if (flash?.error) addToast('error', flash.error);
        if (flash?.warning) addToast('warning', flash.warning);
        if (flash?.info) addToast('info', flash.info);
    }, [props.flash, addToast]);

    // Expose global toast API for imperative use
    useEffect(() => {
        window.__toast = addToast;
        return () => { delete window.__toast; };
    }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2.5 max-w-[min(380px,calc(100vw-2rem))]">
            {toasts.map((toast) => {
                const v = TOAST_VARIANTS[toast.type] || TOAST_VARIANTS.info;
                const Icon = v.icon;

                return (
                    <div
                        key={toast.id}
                        className={`relative flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md overflow-hidden transition-all duration-300 ${v.bg} ${
                            toast.exiting
                                ? 'opacity-0 translate-x-full'
                                : 'animate-slideIn'
                        }`}
                    >
                        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${v.iconColor}`} />
                        <p className="flex-1 text-xs font-medium leading-relaxed min-w-0 break-words">
                            {toast.message}
                        </p>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity p-0.5"
                            aria-label="Tutup"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>

                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                            <div
                                className={`h-full ${v.progress} rounded-full`}
                                style={{
                                    animation: `toast-progress ${DURATION}ms linear forwards`,
                                }}
                            />
                        </div>
                    </div>
                );
            })}

            <style>{`
                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
