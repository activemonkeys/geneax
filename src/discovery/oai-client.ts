// src/discovery/oai-client.ts

import { parseStringPromise } from 'xml2js';

export interface OAIIdentify {
    repositoryName: string;
    baseURL: string;
    protocolVersion: string;
    adminEmail: string[];
    earliestDatestamp: string;
    deletedRecord: string;
    granularity: string;
}

export interface OAISet {
    setSpec: string;
    setName: string;
    setDescription?: string;
}

export interface OAIRecord {
    header: {
        identifier: string;
        datestamp: string;
        setSpec?: string[];
    };
    metadata: any;
}

export class OAIClient {
    constructor(private baseUrl: string) { }

    async identify(): Promise<OAIIdentify> {
        const url = `${this.baseUrl}?verb=Identify`;
        const response = await fetch(url);
        const xml = await response.text();
        const parsed = await parseStringPromise(xml);

        const identify = parsed['OAI-PMH']?.Identify?.[0];
        if (!identify) {
            throw new Error('Invalid OAI-PMH Identify response');
        }

        return {
            repositoryName: identify.repositoryName?.[0] || '',
            baseURL: identify.baseURL?.[0] || this.baseUrl,
            protocolVersion: identify.protocolVersion?.[0] || '',
            adminEmail: identify.adminEmail || [],
            earliestDatestamp: identify.earliestDatestamp?.[0] || '',
            deletedRecord: identify.deletedRecord?.[0] || '',
            granularity: identify.granularity?.[0] || '',
        };
    }

    async listSets(): Promise<OAISet[]> {
        const url = `${this.baseUrl}?verb=ListSets`;
        const response = await fetch(url);
        const xml = await response.text();
        const parsed = await parseStringPromise(xml);

        const sets = parsed['OAI-PMH']?.ListSets?.[0]?.set || [];

        return sets.map((set: any) => ({
            setSpec: set.setSpec?.[0] || '',
            setName: set.setName?.[0] || '',
            setDescription: set.setDescription?.[0] || undefined,
        }));
    }

    async listRecords(
        metadataPrefix: string = 'oai_a2a',
        set?: string,
        from?: string,
        until?: string,
        resumptionToken?: string
    ): Promise<{
        records: OAIRecord[];
        resumptionToken?: string;
    }> {
        let url = `${this.baseUrl}?verb=ListRecords`;

        if (resumptionToken) {
            url += `&resumptionToken=${encodeURIComponent(resumptionToken)}`;
        } else {
            url += `&metadataPrefix=${metadataPrefix}`;
            if (set) url += `&set=${encodeURIComponent(set)}`;
            if (from) url += `&from=${from}`;
            if (until) url += `&until=${until}`;
        }

        const response = await fetch(url);
        const xml = await response.text();
        const parsed = await parseStringPromise(xml);

        const listRecords = parsed['OAI-PMH']?.ListRecords?.[0];
        if (!listRecords) {
            throw new Error('Invalid OAI-PMH ListRecords response');
        }

        const records = (listRecords.record || []).map((record: any) => ({
            header: {
                identifier: record.header?.[0]?.identifier?.[0] || '',
                datestamp: record.header?.[0]?.datestamp?.[0] || '',
                setSpec: record.header?.[0]?.setSpec || [],
            },
            metadata: record.metadata?.[0] || {},
        }));

        const newResumptionToken = listRecords.resumptionToken?.[0]?._ || undefined;

        return {
            records,
            resumptionToken: newResumptionToken,
        };
    }

    async getRecord(identifier: string, metadataPrefix: string = 'oai_a2a'): Promise<OAIRecord> {
        const url = `${this.baseUrl}?verb=GetRecord&identifier=${encodeURIComponent(
            identifier
        )}&metadataPrefix=${metadataPrefix}`;

        const response = await fetch(url);
        const xml = await response.text();
        const parsed = await parseStringPromise(xml);

        const record = parsed['OAI-PMH']?.GetRecord?.[0]?.record?.[0];
        if (!record) {
            throw new Error('Invalid OAI-PMH GetRecord response');
        }

        return {
            header: {
                identifier: record.header?.[0]?.identifier?.[0] || '',
                datestamp: record.header?.[0]?.datestamp?.[0] || '',
                setSpec: record.header?.[0]?.setSpec || [],
            },
            metadata: record.metadata?.[0] || {},
        };
    }
}