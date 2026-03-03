import * as Sentry from '@sentry/react-native';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

/**
 * Centralized Logger
 *
 * DEV  — all levels print to console.
 * PROD — debug/info suppressed; warn sends Sentry breadcrumb;
 *        error sends Sentry exception.
 */
class LoggerService {
    debug(...args) {
        if (isDev) console.debug('[DEBUG]', ...args);
    }

    info(...args) {
        if (isDev) console.info('[INFO]', ...args);
    }

    warn(message, ...args) {
        if (isDev) {
            console.warn('[WARN]', message, ...args);
        }
        if (!isDev) {
            try {
                Sentry.addBreadcrumb({
                    category: 'warning',
                    message: typeof message === 'string' ? message : JSON.stringify(message),
                    level: 'warning',
                });
            } catch (_) { /* Sentry may not be initialized */ }
        }
    }

    error(error, ...args) {
        if (isDev) {
            console.error('[ERROR]', error, ...args);
        }
        if (!isDev) {
            try {
                if (error instanceof Error) {
                    Sentry.captureException(error, { extra: { args } });
                } else {
                    Sentry.captureMessage(
                        typeof error === 'string' ? error : JSON.stringify(error),
                        { level: 'error', extra: { args } }
                    );
                }
            } catch (_) { /* Sentry may not be initialized */ }
        }
    }
}

export const Logger = new LoggerService();

/**
 * Silence noisy console methods in production builds.
 * Call once at app startup (after Sentry.init).
 */
export function silenceConsoleInProduction() {
    if (!isDev) {
        const noop = () => {};
        console.log = noop;
        console.debug = noop;
        console.info = noop;
    }
}
