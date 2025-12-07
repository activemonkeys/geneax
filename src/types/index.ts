// src/types/index.ts

import type { RecordType, PersonRole, HarvestStatus } from '@/generated/prisma/client';

// Re-export Prisma types
export type { RecordType, PersonRole, HarvestStatus };

// A2A XML Structure with namespace support
export interface A2AData {
    Source?: any;
    Person?: any;
    Relation?: any;
    Event?: any;
    'a2a:Source'?: any;
    'a2a:Person'?: any;
    'a2a:Relation'?: any;
    'a2a:Event'?: any;
    [key: string]: any;
}

export interface A2ASource {
    SourceType?: any;
    SourceDate?: any;
    SourcePlace?: any;
    SourceIndexDate?: any;
    'a2a:SourceType'?: any;
    'a2a:SourceDate'?: any;
    'a2a:SourcePlace'?: any;
    'a2a:SourceIndexDate'?: any;
    [key: string]: any;
}

export interface A2APerson {
    PersonName?: any;
    'a2a:PersonName'?: any;
    Age?: any;
    'a2a:Age'?: any;
    Occupation?: any;
    'a2a:Occupation'?: any;
    Residence?: any;
    'a2a:Residence'?: any;
    [key: string]: any;
}

export interface A2ARelation {
    RelationType?: any;
    'a2a:RelationType'?: any;
    Person?: any;
    'a2a:Person'?: any;
    [key: string]: any;
}

export interface A2AEvent {
    EventDate?: any;
    'a2a:EventDate'?: any;
    [key: string]: any;
}

// Parsed Record Structure
export interface ParsedRecord {
    externalId: string;
    sourceCode: string;
    setSpec: string;
    recordType: string;
    eventYear: number;
    eventDate?: string;
    eventPlace?: string;
    persons: Array<{
        role: string;
        givenName?: string;
        surname?: string;
        patronym?: string;
        prefix?: string;
        age?: number;
        occupation?: string;
        residence?: string;
    }>;
    rawData: any;
}

// OAI-PMH Types
export interface OAIResponse {
    'OAI-PMH'?: {
        responseDate?: string;
        request?: any;
        error?: {
            '@_code'?: string;
            '#text'?: string;
        };
        Identify?: {
            repositoryName?: string;
            baseURL?: string;
            protocolVersion?: string;
            adminEmail?: string;
        };
        ListRecords?: {
            record?: OAIRecord | OAIRecord[];
            resumptionToken?: OAIResumptionToken | string;
        };
        ListSets?: {
            set?: any;
        };
    };
}

export interface OAIRecord {
    header?: {
        identifier?: string;
        datestamp?: string;
        status?: string;
    };
    metadata?: {
        A2A?: A2AData;
        'a2a:A2A'?: A2AData;
        [key: string]: any;
    };
}

export interface OAIResumptionToken {
    '#text'?: string;
    '@_completeListSize'?: string;
    '@_cursor'?: string;
}

// Harvest Configuration
export interface HarvestConfig {
    sourceCode: string;
    setSpec: string;
    limit?: number;
    resumptionToken?: string;
}

export interface HarvestResult {
    success: boolean;
    filesCreated: number;
    recordsHarvested: number;
    resumptionToken?: string;
    error?: string;
}