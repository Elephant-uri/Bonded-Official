import { supabase } from '../lib/supabase';
import { Logger } from './logger';

const QUEUE_FLUSH_INTERVAL = 30_000; // 30 seconds
const QUEUE_FLUSH_SIZE = 20;

let queue = [];
let flushTimer = null;

function startFlushTimer() {
    if (flushTimer) return;
    flushTimer = setInterval(flush, QUEUE_FLUSH_INTERVAL);
}

async function flush() {
    if (queue.length === 0) return;

    const batch = queue.splice(0, QUEUE_FLUSH_SIZE);
    try {
        const { error } = await supabase
            .from('analytics_events')
            .insert(batch);

        if (error) {
            Logger.warn('Analytics flush failed, re-queueing', error.message);
            queue.unshift(...batch);
        }
    } catch (err) {
        Logger.warn('Analytics flush exception', err);
        queue.unshift(...batch);
    }
}

/**
 * Track a user action or system event.
 *
 * @param {string} name  - Event name, e.g. 'screen_view', 'message_sent', 'event_created'
 * @param {object} [properties] - Arbitrary metadata for the event
 * @param {string} [userId] - Optionally override the current user
 */
export function track(name, properties = {}, userId = null) {
    const event = {
        event_name: name,
        properties,
        user_id: userId,
        created_at: new Date().toISOString(),
    };

    queue.push(event);
    Logger.debug(`[Analytics] ${name}`, properties);

    if (queue.length >= QUEUE_FLUSH_SIZE) {
        flush();
    } else {
        startFlushTimer();
    }
}

/**
 * Convenience: track a screen view.
 */
export function trackScreen(screenName, params = {}) {
    track('screen_view', { screen: screenName, ...params });
}

/**
 * Force flush any pending events (call on app background/close).
 */
export async function flushAnalytics() {
    await flush();
}
