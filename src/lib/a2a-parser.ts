// Bestand: src/lib/a2a-parser.ts

import type { RecordType, PersonRole } from '@/generated/prisma/client';
import type { A2AData, A2APerson, A2ARelation, ParsedRecord, ParsedPerson, A2ATextField } from '@/types/index';
import { getTextValue } from '@/types/index';
import logger from './logger';

const SET_TO_RECORD_TYPE: Record<string, RecordType> = {
    'bs_geboorte': 'BS_BIRTH',
    'bs_huwelijk': 'BS_MARRIAGE',
    'bs_overlijden': 'BS_DEATH',
    'bs_echtscheiding': 'BS_DIVORCE',
    'dtb_dopen': 'DTB_BAPTISM',
    'dtb_trouwen': 'DTB_MARRIAGE',
    'dtb_begraven': 'DTB_BURIAL',
    'dtb_doop': 'DTB_BAPTISM',
    'dtb_trouw': 'DTB_MARRIAGE',
    'dtb_begraaf': 'DTB_BURIAL',
    'genealogie': 'OTHER',
    'civil': 'OTHER',
};

const RELATION_TO_ROLE: Record<string, PersonRole> = {
    'vader': 'FATHER', 'moeder': 'MOTHER', 'kind': 'CHILD',
    'bruidegom': 'GROOM', 'bruid': 'BRIDE',
    'overledene': 'DECEASED', 'aangever': 'DECLARANT', 'getuige': 'WITNESS',
    'partner': 'PARTNER', 'echtgenoot': 'PARTNER', 'echtgenote': 'PARTNER',
    'weduwe': 'PARTNER', 'weduwnaar': 'PARTNER',
    'vader van de bruidegom': 'GROOM_FATHER', 'moeder van de bruidegom': 'GROOM_MOTHER',
    'vader bruidegom': 'GROOM_FATHER', 'moeder bruidegom': 'GROOM_MOTHER',
    'vader van de bruid': 'BRIDE_FATHER', 'moeder van de bruid': 'BRIDE_MOTHER',
    'vader bruid': 'BRIDE_FATHER', 'moeder bruid': 'BRIDE_MOTHER',
    'dopeling': 'BAPTIZED', 'gedoopte': 'BAPTIZED',
    'peter': 'GODFATHER', 'peetvader': 'GODFATHER',
    'meter': 'GODMOTHER', 'peetmoeder': 'GODMOTHER',
    'doopgetuige': 'WITNESS',
    'father': 'FATHER', 'mother': 'MOTHER', 'child': 'CHILD',
    'groom': 'GROOM', 'bride': 'BRIDE', 'deceased': 'DECEASED', 'witness': 'WITNESS',
};

export interface ParseOptions {
    sourceCode: string;
    setSpec: string;
    externalId: string;
}

export function parseA2ARecord(
    a2aData: A2AData | undefined,
    options: ParseOptions
): ParsedRecord | null {
    if (!a2aData) {
        logger.warn('Geen A2A data gevonden', { id: options.externalId });
        return null;
    }

    const { sourceCode, setSpec, externalId } = options;
    const recordType = determineRecordType(a2aData, setSpec);
    const { eventYear, eventDate } = extractEventDate(a2aData);
    const eventPlace = extractEventPlace(a2aData);

    const persons = extractPersons(a2aData, recordType);

    return {
        externalId,
        sourceCode,
        setSpec,
        recordType,
        eventYear: eventYear || 1800,
        eventDate,
        eventPlace,
        rawData: a2aData as Record<string, unknown>,
        persons,
    };
}

function determineRecordType(a2a: A2AData, setSpec: string): RecordType {
    const normalizedSet = setSpec.toLowerCase().replace(/[^a-z_]/g, '');
    if (SET_TO_RECORD_TYPE[normalizedSet]) {
        return SET_TO_RECORD_TYPE[normalizedSet];
    }

    const sourceType = getTextValue(a2a.Source?.SourceType)?.toLowerCase();
    if (sourceType) {
        if (sourceType.includes('geboorte') || sourceType.includes('birth')) return 'BS_BIRTH';
        if (sourceType.includes('huwelijk') || sourceType.includes('marriage')) return 'BS_MARRIAGE';
        if (sourceType.includes('overlij') || sourceType.includes('death')) return 'BS_DEATH';
        if (sourceType.includes('doop') || sourceType.includes('baptism')) return 'DTB_BAPTISM';
        if (sourceType.includes('trouw')) return 'DTB_MARRIAGE';
        if (sourceType.includes('begraaf') || sourceType.includes('burial')) return 'DTB_BURIAL';
    }

    return 'OTHER';
}

function extractEventDate(a2a: A2AData): { eventYear?: number; eventDate?: Date } {
    // SourceDate
    if (a2a.Source?.SourceDate) {
        const res = parseDateField(a2a.Source.SourceDate);
        if (res.eventYear) return res;
    }
    // EventDate
    if (a2a.Event?.EventDate) {
        const res = parseDateField(a2a.Event.EventDate);
        if (res.eventYear) return res;
    }
    // SourceIndexDate From
    const fromDate = getTextValue(a2a.Source?.SourceIndexDate?.From);
    if (fromDate) {
        const year = extractYearFromString(fromDate);
        if (year) return { eventYear: year };
    }
    return {};
}

function parseDateField(dateField: { Date?: A2ATextField; Year?: A2ATextField; Month?: A2ATextField; Day?: A2ATextField }) {
    const dateStr = getTextValue(dateField.Date);
    if (dateStr) {
        const parsed = parseDate(dateStr);
        if (parsed) return { eventYear: parsed.getFullYear(), eventDate: parsed };
        const year = extractYearFromString(dateStr);
        if (year) return { eventYear: year };
    }
    const yearStr = getTextValue(dateField.Year);
    if (yearStr) {
        const year = parseInt(yearStr, 10);
        if (!isNaN(year) && year >= 1500 && year <= 2100) {
            const month = parseInt(getTextValue(dateField.Month) || '0', 10);
            const day = parseInt(getTextValue(dateField.Day) || '1', 10);
            if (month > 0 && day > 0) {
                return { eventYear: year, eventDate: new Date(year, month - 1, day) };
            }
            return { eventYear: year };
        }
    }
    return {};
}

function parseDate(dateStr: string): Date | undefined {
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));

    const nlMatch = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (nlMatch) return new Date(parseInt(nlMatch[3]), parseInt(nlMatch[2]) - 1, parseInt(nlMatch[1]));

    const yearOnly = extractYearFromString(dateStr);
    if (yearOnly) return new Date(yearOnly, 0, 1);
    return undefined;
}

function extractYearFromString(str: string): number | undefined {
    const match = str.match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
    return match ? parseInt(match[1], 10) : undefined;
}

function extractEventPlace(a2a: A2AData): string | undefined {
    return getTextValue(a2a.Source?.SourcePlace?.Place) ||
        getTextValue(a2a.Event?.EventPlace) ||
        getTextValue(a2a.Source?.SourceReference?.Place);
}

function extractPersons(a2a: A2AData, recordType: RecordType): ParsedPerson[] {
    const persons: ParsedPerson[] = [];

    const mainPersons = normalizeArray(a2a.Person);
    for (const p of mainPersons) {
        const parsed = parseA2APerson(p);
        if (parsed) {
            parsed.role = determineMainPersonRole(recordType);
            persons.push(parsed);
        }
    }

    const relations = normalizeArray(a2a.Relation);
    for (const r of relations) {
        const parsed = parseA2ARelation(r);
        if (parsed) persons.push(parsed);
    }

    return persons;
}

function parseA2APerson(person: A2APerson | undefined): ParsedPerson | null {
    if (!person || !person.PersonName) return null;

    const name = person.PersonName;
    const givenName = cleanName(getTextValue(name.PersonNameFirstName));
    const surname = cleanName(getTextValue(name.PersonNameLastName));
    const patronym = cleanName(getTextValue(name.PersonNamePatronym));
    const prefix = cleanName(getTextValue(name.PersonNamePrefixLastName));

    if (!givenName && !surname && !patronym) {
        const literal = getTextValue(name.PersonNameLiteral);
        if (literal) {
            const parts = literal.trim().split(/\s+/);
            return parts.length >= 2
                ? { role: 'OTHER', givenName: parts[0], surname: parts.slice(1).join(' ') }
                : { role: 'OTHER', givenName: literal };
        }
        return null;
    }

    const ageStr = getTextValue(person.Age);
    const age = ageStr ? parseInt(ageStr, 10) : undefined;

    return {
        role: 'OTHER',
        givenName: givenName || undefined,
        surname: surname || undefined,
        patronym: patronym || undefined,
        prefix: prefix || undefined,
        age: age && !isNaN(age) ? age : undefined,
        occupation: getTextValue(person.Occupation) || undefined,
        residence: getTextValue(person.Residence) || undefined,
    };
}

function parseA2ARelation(relation: A2ARelation): ParsedPerson | null {
    if (!relation.Person) return null;
    const parsed = parseA2APerson(relation.Person);
    if (!parsed) return null;

    const type = getTextValue(relation.RelationType)?.toLowerCase().trim();
    if (type) parsed.role = RELATION_TO_ROLE[type] || 'OTHER';
    return parsed;
}

function determineMainPersonRole(type: RecordType): PersonRole {
    switch (type) {
        case 'BS_BIRTH': return 'CHILD';
        case 'BS_DEATH': return 'DECEASED';
        case 'DTB_BAPTISM': return 'BAPTIZED';
        case 'DTB_BURIAL': return 'DECEASED';
        case 'BS_MARRIAGE':
        case 'DTB_MARRIAGE': return 'GROOM';
        default: return 'OTHER';
    }
}

function normalizeArray<T>(value: T | T[] | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function cleanName(name: string | undefined): string | undefined {
    if (!name) return undefined;
    const cleaned = name.replace(/\s+/g, ' ').trim();
    return (cleaned === '-' || cleaned === '?' || cleaned === 'N.N.') ? undefined : cleaned;
}

export default parseA2ARecord;