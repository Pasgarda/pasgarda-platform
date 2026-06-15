import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Reusable form-field validation error message.
 *
 * @param {string} message - The error message (if falsy, nothing renders)
 * @param {string} [className] - Extra classes
 */
export default function ValidationError({ message, className = '' }) {
    if (!message) return null;

    return (
        <p
            className={`flex items-start gap-1.5 text-[11px] sm:text-xs mt-1.5 font-medium text-accent-mahogany animate-fade-in ${className}`}
            role="alert"
        >
            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
            <span>{message}</span>
        </p>
    );
}
