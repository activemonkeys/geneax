// Bestand: src/lib/logger.ts

import { config } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const currentLevel = levels[config.logLevel as LogLevel] ?? levels.info;

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data !== undefined) {
        // Check if error object
        if (data instanceof Error) {
            return `${prefix} ${message} ${data.message}\n${data.stack}`;
        }
        return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
}

export const logger = {
    debug(message: string, data?: unknown) {
        if (currentLevel <= levels.debug) {
            console.log(formatMessage('debug', message, data));
        }
    },

    info(message: string, data?: unknown) {
        if (currentLevel <= levels.info) {
            console.log(formatMessage('info', message, data));
        }
    },

    warn(message: string, data?: unknown) {
        if (currentLevel <= levels.warn) {
            console.warn(formatMessage('warn', message, data));
        }
    },

    error(message: string, data?: unknown) {
        if (currentLevel <= levels.error) {
            console.error(formatMessage('error', message, data));
        }
    },

    progress(current: number, total: number, message?: string) {
        if (process.env.CI) return;
        const percentage = Math.round((current / total) * 100);
        const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
        const msg = message ? ` - ${message}` : '';
        process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total})${msg}`);
        if (current === total) {
            process.stdout.write('\n');
        }
    },
};

export default logger;