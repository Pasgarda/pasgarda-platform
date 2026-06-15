import React from 'react';
import axios from 'axios';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import SharedLayout from './Components/SharedLayout';
import Toast from './Components/Toast';
import ErrorBoundary from './Components/ErrorBoundary';
import NetworkStatus from './Components/NetworkStatus';

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const appName = import.meta.env.VITE_APP_NAME || 'PASGARDA';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => {
        const page = resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        );
        page.then((mod) => {
            const existingLayout = mod.default.layout;
            if (!name.startsWith('Admin/')) {
                mod.default.layout = (pageContent) => (
                    <ErrorBoundary>
                        {(existingLayout ? existingLayout(pageContent) : <SharedLayout children={pageContent} />)}
                        <Toast />
                        <NetworkStatus />
                    </ErrorBoundary>
                );
            } else {
                mod.default.layout = (pageContent) => (
                    <ErrorBoundary>
                        {existingLayout ? existingLayout(pageContent) : pageContent}
                        <Toast />
                        <NetworkStatus />
                    </ErrorBoundary>
                );
            }
        });
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#C8930A',
        showSpinner: false,
    },
});
