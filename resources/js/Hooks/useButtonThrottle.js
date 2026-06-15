import { useState, useCallback, useRef } from 'react';

export function useButtonThrottle(delay = 3000) {
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef(null);
    const mountedRef = useRef(true);

    const throttledAction = useCallback((fn) => {
        if (loading) return;
        setLoading(true);
        Promise.resolve(fn()).finally(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                if (mountedRef.current) setLoading(false);
            }, delay);
        });
    }, [loading, delay]);

    return { loading, throttledAction };
}
