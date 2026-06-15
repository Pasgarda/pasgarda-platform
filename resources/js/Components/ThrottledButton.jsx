import React, { useState, useCallback, useRef } from 'react';

export default function ThrottledButton({
    children,
    onClick,
    delay = 3000,
    className = '',
    disabled = false,
    ...props
}) {
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef(null);

    const handleClick = useCallback((e) => {
        if (loading || disabled) return;
        setLoading(true);
        const result = onClick?.(e);
        Promise.resolve(result).finally(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setLoading(false), delay);
        });
    }, [loading, disabled, onClick, delay]);

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading || disabled}
            className={`relative ${className} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            {...props}
        >
            {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                </span>
            )}
            <span className={loading ? 'invisible' : ''}>{children}</span>
        </button>
    );
}
