import { useCallback, useRef } from 'react';

export function useThrottle(fn, delay = 3000) {
    const lastRun = useRef(0);
    const timeout = useRef(null);

    return useCallback((...args) => {
        const now = Date.now();
        const elapsed = now - lastRun.current;

        if (elapsed >= delay) {
            lastRun.current = now;
            fn(...args);
        } else if (!timeout.current) {
            timeout.current = setTimeout(() => {
                lastRun.current = Date.now();
                timeout.current = null;
                fn(...args);
            }, delay - elapsed);
        }
    }, [fn, delay]);
}
