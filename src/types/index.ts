// Bestand: src/types/index.ts

import type { RecordType, PersonRole } from '@/generated/prisma/client';

export type { RecordType, PersonRole };

// ============================================
// PARSED DATA TYPES (Wat we opslaan)
// ============================================

export interface ParsedRecord {
    externalId: string;
    sourceCode: string;
    setSpec: string;
    recordType: RecordType;
    eventYear: number;
    eventDate?: Date;
    eventPlace?: string;
    // Gebruik 'unknown' in plaats van 'any' voor type safety
    rawData: Record<string, unknown>;
    persons: ParsedPerson[];
}

export interface ParsedPerson {
    role: PersonRole;
    givenName?: string;
    surname?: string;
    patronym?: string;
    prefix?: string;
    age?: number;
    birthYear?: number;
    occupation?: string;
    residence?: string;
}

// ============================================
// A2A XML TYPES (Wat we ontvangen)
// ============================================

export interface A2ARecord {
    A2A?: A2AData;
    'a2a:A2A'?: A2AData;
}

export interface A2AData {
    Source?: A2ASource;
    Person?: A2APerson | A2APerson[];
    Relation?: A2ARelation | A2ARelation[];
    Event?: A2AEvent;
}

export interface A2ASource {
    SourceType?: A2ATextField;
    SourceReference?: {
        DocumentNumber?: A2ATextField;
        RegistryNumber?: A2ATextField;
        Place?: A2ATextField;
        InstitutionName?: A2ATextField;
    };
    SourceDate?: {
        Date?: A2ATextField;
        Year?: A2ATextField;
        Month?: A2ATextField;
        Day?: A2ATextField;
    };
    SourcePlace?: {
        Place?: A2ATextField;
        Country?: A2ATextField;
    };
    RecordGUID?: A2ATextField;
    RecordIdentifier?: A2ATextField;
    SourceIndexDate?: {
        From?: A2ATextField;
        To?: A2ATextField;
    };
    SourceLastChangeDate?: A2ATextField;
    SourceDigitalOriginal?: A2ATextField;
    SourceAvailableScans?: {
        Scan?: A2AScan | A2AScan[];
    };
}

export interface A2APerson {
    '@_pid'?: string;
    PersonName?: A2APersonName;
    Gender?: A2ATextField;
    Age?: A2ATextField;
    BirthDate?: A2ADateField;
    BirthPlace?: A2ATextField;
    Residence?: A2ATextField;
    Occupation?: A2ATextField;
    PersonRemark?: A2ATextField;
}

export interface A2APersonName {
    PersonNameFirstName?: A2ATextField;
    PersonNameLastName?: A2ATextField;
    PersonNamePatronym?: A2ATextField;
    PersonNamePrefixLastName?: A2ATextField;
    PersonNameLiteral?: A2ATextField;
}

export interface A2ARelation {
    '@_pid'?: string;
    RelationType?: A2ATextField;
    PersonKeyRef?: {
        '@_PersonKeyRef'?: string;
    };
    Person?: A2APerson;
}

export interface A2AEvent {
    EventType?: A2ATextField;
    EventDate?: A2ADateField;
    EventPlace?: A2ATextField;
}

export interface A2AScan {
    Uri?: A2ATextField;
    UriViewer?: A2ATextField;
    OrderSequenceNumber?: A2ATextField;
}

export interface A2ATextField {
    '#text'?: string;
    '@_Value'?: string;
    [key: string]: unknown;
}

export interface A2ADateField {
    Date?: A2ATextField;
    Year?: A2ATextField;
    Month?: A2ATextField;
    Day?: A2ATextField;
}

// ============================================
// OAI-PMH TYPES
// ============================================

export interface OAIResponse {
    'OAI-PMH': {
        responseDate?: string;
        request?: unknown;
        ListRecords?: {
            record?: OAIRecord | OAIRecord[];
            resumptionToken?: OAIResumptionToken | string;
        };
        error?: {
            '@_code'?: string;
            '#text'?: string;
        };
        Identify?: {
            repositoryName?: string;
        };
        ListSets?: {
            set?: { setSpec?: string; setName?: string } | { setSpec?: string; setName?: string }[];
        };
    };
}

export interface OAIRecord {
    header: {
        identifier: string;
        datestamp?: string;
        setSpec?: string | string[];
        status?: string;
    };
    metadata?: A2ARecord;
}

export interface OAIResumptionToken {
    '#text'?: string;
    '@_completeListSize'?: string;
    '@_cursor'?: string;
    '@_expirationDate'?: string;
}

// ============================================
// HARVEST TYPES
// ============================================

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

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTextValue(field: A2ATextField | string | undefined): string | undefined {
    if (!field) return undefined;
    if (typeof field === 'string') return field;
    if (field['#text']) return String(field['#text']);
    if (field['@_Value']) return String(field['@_Value']);
    const firstValue = Object.values(field).find(v => typeof v === 'string');
    return firstValue as string | undefined;
}