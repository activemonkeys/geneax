// Bestand: src/lib/oai-client.ts (GEFIXTE VERSIE)

import axios, { AxiosError } from 'axios';
import https from 'https';
import { XMLParser } from 'fast-xml-parser';
import type { OAIResponse, OAIRecord, OAIResumptionToken } from '@/types/index';
import { config } from './config';
import logger from './logger';

// ⭐ FIX: Maak een HTTPS agent die self-signed certificates accepteert
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (name) => {
        return ['record', 'setSpec', 'set'].includes(name);
    },
});

// ⭐ FIX: Standaard axios configuratie met de HTTPS agent
const axiosConfig = {
    httpsAgent,
    timeout: config.harvest.timeout,
    headers: {
        'Accept': 'application/xml, text/xml',
        'User-Agent': 'Geneax/0.1.0',
    },
};

export interface ListRecordsOptions {
    baseUrl: string;
    metadataPrefix?: string;
    set?: string;
    resumptionToken?: string;
    from?: string;
    until?: string;
}

export interface ListRecordsResult {
    records: OAIRecord[];
    resumptionToken?: string;
    completeListSize?: number;
    cursor?: number;
    error?: string;
}

export async function listRecords(options: ListRecordsOptions): Promise<ListRecordsResult> {
    const { baseUrl, metadataPrefix = 'oai_a2a', set, resumptionToken, from, until } = options;

    const url = new URL(baseUrl);
    url.searchParams.set('verb', 'ListRecords');

    if (resumptionToken) {
        url.searchParams.set('resumptionToken', resumptionToken);
    } else {
        url.searchParams.set('metadataPrefix', metadataPrefix);
        if (set) url.searchParams.set('set', set);
        if (from) url.searchParams.set('from', from);
        if (until) url.searchParams.set('until', until);
    }

    logger.debug(`OAI-PMH request: ${url.toString()}`);

    try {
        // ⭐ FIX: Gebruik de nieuwe config met HTTPS agent
        const response = await axios.get(url.toString(), {
            ...axiosConfig,
            responseType: 'text',
        });

        const parsed = parser.parse(response.data) as OAIResponse;
        const oaiPmh = parsed['OAI-PMH'];

        if (!oaiPmh) {
            return { records: [], error: 'Invalid OAI-PMH response: missing root element' };
        }

        if (oaiPmh.error) {
            const errorCode = oaiPmh.error['@_code'] || 'unknown';
            const errorMsg = oaiPmh.error['#text'] || 'Unknown error';

            if (errorCode === 'noRecordsMatch') {
                logger.info('Geen records gevonden voor deze query');
                return { records: [] };
            }

            return { records: [], error: `OAI-PMH error [${errorCode}]: ${errorMsg}` };
        }

        const listRecords = oaiPmh.ListRecords;
        if (!listRecords) {
            return { records: [], error: 'No ListRecords in response' };
        }

        const records = normalizeRecords(listRecords.record);
        const tokenInfo = parseResumptionToken(listRecords.resumptionToken);

        return {
            records,
            resumptionToken: tokenInfo.token,
            completeListSize: tokenInfo.completeListSize,
            cursor: tokenInfo.cursor,
        };

    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.code === 'ECONNABORTED') return { records: [], error: 'Request timeout' };
            if (error.response) return { records: [], error: `HTTP ${error.response.status}` };
            return { records: [], error: `Network error: ${error.message}` };
        }
        return { records: [], error: `Unexpected error: ${error}` };
    }
}

export async function listSets(baseUrl: string): Promise<string[]> {
    const url = new URL(baseUrl);
    url.searchParams.set('verb', 'ListSets');

    try {
        // ⭐ FIX: Gebruik de nieuwe config
        const response = await axios.get(url.toString(), {
            ...axiosConfig,
            responseType: 'text',
        });

        const parsed = parser.parse(response.data);
        const sets = parsed['OAI-PMH']?.ListSets?.set;

        if (!sets) return [];

        const setList = Array.isArray(sets) ? sets : [sets];
        return setList.map((s: { setSpec?: string }) => s.setSpec).filter(Boolean) as string[];

    } catch (error) {
        logger.error('Failed to list sets', { baseUrl, error });
        return [];
    }
}

export async function identify(baseUrl: string): Promise<{ valid: boolean; repositoryName?: string; error?: string }> {
    const url = new URL(baseUrl);
    url.searchParams.set('verb', 'Identify');

    try {
        // ⭐ FIX: Gebruik de nieuwe config
        const response = await axios.get(url.toString(), {
            ...axiosConfig,
            responseType: 'text',
        });

        const parsed = parser.parse(response.data);
        const identify = parsed['OAI-PMH']?.Identify;

        if (!identify) {
            return { valid: false, error: 'Invalid Identify response' };
        }

        return {
            valid: true,
            repositoryName: identify.repositoryName,
        };

    } catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

function normalizeRecords(records: OAIRecord | OAIRecord[] | undefined): OAIRecord[] {
    if (!records) return [];
    return Array.isArray(records) ? records : [records];
}

interface TokenInfo {
    token?: string;
    completeListSize?: number;
    cursor?: number;
}

function parseResumptionToken(token: OAIResumptionToken | string | undefined): TokenInfo {
    if (!token) return {};
    if (typeof token === 'string') return { token: token || undefined };

    return {
        token: token['#text'] || undefined,
        completeListSize: token['@_completeListSize'] ? parseInt(token['@_completeListSize'], 10) : undefined,
        cursor: token['@_cursor'] ? parseInt(token['@_cursor'], 10) : undefined,
    };
}

const client = { listRecords, listSets, identify };
export default client;
