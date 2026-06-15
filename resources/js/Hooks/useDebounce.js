import { useEffect, useRef } from 'react';

export function useDebounce(callback, delay = 400) {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const debouncedFn = (...args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    };

    return debouncedFn;
}
