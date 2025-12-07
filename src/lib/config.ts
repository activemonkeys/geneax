// Bestand: src/lib/config.ts

import path from 'path';

// Gebruik process.cwd() om de root van het Next.js project te vinden
const PROJECT_ROOT = process.cwd();

export const config = {
    // Directories
    dataDir: process.env.DATA_DIR || path.join(PROJECT_ROOT, 'data'),
    rawDir: path.join(process.env.DATA_DIR || path.join(PROJECT_ROOT, 'data'), 'raw'),
    processedDir: path.join(process.env.DATA_DIR || path.join(PROJECT_ROOT, 'data'), 'processed'),

    // Harvester settings
    harvest: {
        batchSize: 100,
        requestDelay: 1000,
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 5000,
    },

    // Processor settings
    processor: {
        batchSize: 500,
    },

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export default config;