// src/lib/a2a-parser.ts

import type { A2AData, ParsedRecord } from '@/types/index';

export function parseA2ARecord(
    a2a: any,
    meta: { sourceCode: string; setSpec: string; externalId: string }
): ParsedRecord | null {
    if (!a2a) return null;

    // Handle both namespaced (a2a:) and non-namespaced fields
    const source = a2a.Source || a2a['a2a:Source'];
    const person = a2a.Person || a2a['a2a:Person'];
    const relation = a2a.Relation || a2a['a2a:Relation'];
    const event = a2a.Event || a2a['a2a:Event'];

    if (!source) return null;

    // Extract source type (handle namespace)
    const sourceType = source.SourceType?.['#text'] || source['a2a:SourceType'] || 'Unknown';
    const recordType = mapSourceType(sourceType);

    // Extract date (handle multiple date formats)
    const sourceDate = source.SourceDate || source['a2a:SourceDate'] || source.SourceIndexDate || source['a2a:SourceIndexDate'];
    let eventDate: string | undefined;
    let eventYear: number | undefined;

    if (sourceDate) {
        // Try Date field first
        const dateField = sourceDate.Date || sourceDate['a2a:Date'];
        if (dateField) {
            eventDate = dateField['#text'] || dateField;
        }
        // Try From field (for index dates)
        if (!eventDate && sourceDate.From) {
            eventDate = sourceDate.From['#text'] || sourceDate.From || sourceDate['a2a:From'];
        }
        if (!eventDate && sourceDate['a2a:From']) {
            eventDate = sourceDate['a2a:From'];
        }
    }

    // Extract year
    if (eventDate) {
        const yearMatch = eventDate.match(/(\d{4})/);
        if (yearMatch) eventYear = parseInt(yearMatch[1], 10);
    }

    // Fallback to event date if source date not found
    if (!eventYear && event) {
        const eventDateObj = event.EventDate || event['a2a:EventDate'];
        if (eventDateObj) {
            const year = eventDateObj.Year || eventDateObj['a2a:Year'];
            if (year) eventYear = typeof year === 'number' ? year : parseInt(year, 10);
        }
    }

    // Extract place
    const sourcePlaceObj = source.SourcePlace || source['a2a:SourcePlace'];
    const eventPlace = sourcePlaceObj?.Place?.['#text'] || sourcePlaceObj?.['a2a:Place'] || sourcePlaceObj?.Place || undefined;

    // Extract persons
    const persons: Array<{
        role: string;
        givenName?: string;
        surname?: string;
        patronym?: string;
        prefix?: string;
        age?: number;
        occupation?: string;
        residence?: string;
    }> = [];

    // Main person
    if (person) {
        const p = extractPerson(person, determineMainRole(recordType));
        if (p) persons.push(p);
    }

    // Relations
    if (relation) {
        const relations = Array.isArray(relation) ? relation : [relation];
        for (const rel of relations) {
            const relPerson = rel.Person || rel['a2a:Person'];
            const relType = rel.RelationType?.['#text'] || rel['a2a:RelationType'] || 'Unknown';
            const role = mapRelationType(relType);

            if (relPerson) {
                const p = extractPerson(relPerson, role);
                if (p) persons.push(p);
            }
        }
    }

    return {
        externalId: meta.externalId,
        sourceCode: meta.sourceCode,
        setSpec: meta.setSpec,
        recordType,
        eventYear: eventYear || 1800,
        eventDate,
        eventPlace,
        persons,
        rawData: a2a,
    };
}

function extractPerson(personData: any, role: string): {
    role: string;
    givenName?: string;
    surname?: string;
    patronym?: string;
    prefix?: string;
    age?: number;
    occupation?: string;
    residence?: string;
} | null {
    // Handle namespace
    const personName = personData.PersonName || personData['a2a:PersonName'];
    if (!personName) return null;

    const givenName = personName.PersonNameFirstName?.['#text'] ||
        personName.PersonNameFirstName ||
        personName['a2a:PersonNameFirstName'];

    const surname = personName.PersonNameLastName?.['#text'] ||
        personName.PersonNameLastName ||
        personName['a2a:PersonNameLastName'];

    const patronym = personName.PersonNamePatronym?.['#text'] ||
        personName.PersonNamePatronym ||
        personName['a2a:PersonNamePatronym'];

    const prefix = personName.PersonNamePrefixLastName?.['#text'] ||
        personName.PersonNamePrefixLastName ||
        personName['a2a:PersonNamePrefixLastName'];

    // Extract age
    let age: number | undefined;
    const ageField = personData.Age || personData['a2a:Age'];
    if (ageField) {
        const ageValue = ageField['#text'] || ageField;
        age = typeof ageValue === 'number' ? ageValue : parseInt(ageValue, 10);
        if (isNaN(age)) age = undefined;
    }

    // Extract occupation
    const occupation = personData.Occupation?.['#text'] ||
        personData.Occupation ||
        personData['a2a:Occupation'];

    // Extract residence
    const residenceObj = personData.Residence || personData['a2a:Residence'];
    const residence = residenceObj?.Place?.['#text'] ||
        residenceObj?.['a2a:Place'] ||
        residenceObj?.Place;

    return {
        role,
        givenName,
        surname,
        patronym,
        prefix,
        age,
        occupation,
        residence,
    };
}

function mapSourceType(sourceType: string): string {
    const lower = sourceType.toLowerCase();
    if (lower.includes('geboorte') || lower.includes('birth')) return 'BS_BIRTH';
    if (lower.includes('huwelijk') || lower.includes('marriage')) return 'BS_MARRIAGE';
    if (lower.includes('overlijden') || lower.includes('death')) return 'BS_DEATH';
    if (lower.includes('doop') || lower.includes('baptism')) return 'DTB_BAPTISM';
    if (lower.includes('trouw') || lower.includes('marriage')) return 'DTB_MARRIAGE';
    if (lower.includes('begraaf') || lower.includes('burial')) return 'DTB_BURIAL';
    if (lower.includes('bevolking') || lower.includes('population')) return 'POPULATION_REGISTER';
    return 'OTHER';
}

function mapRelationType(relationType: string): string {
    const lower = relationType.toLowerCase();
    if (lower.includes('vader') || lower.includes('father')) return 'FATHER';
    if (lower.includes('moeder') || lower.includes('mother')) return 'MOTHER';
    if (lower.includes('bruidegom') || lower.includes('groom')) return 'GROOM';
    if (lower.includes('bruid') || lower.includes('bride')) return 'BRIDE';
    if (lower.includes('getuige') || lower.includes('witness')) return 'WITNESS';
    if (lower.includes('kind') || lower.includes('child')) return 'CHILD';
    if (lower === 'geregistreerde') return 'REGISTRANT';
    return 'OTHER';
}

function determineMainRole(recordType: string): string {
    if (recordType === 'BS_BIRTH' || recordType === 'DTB_BAPTISM') return 'CHILD';
    if (recordType === 'BS_DEATH' || recordType === 'DTB_BURIAL') return 'DECEASED';
    if (recordType === 'BS_MARRIAGE' || recordType === 'DTB_MARRIAGE') return 'GROOM';
    if (recordType === 'POPULATION_REGISTER') return 'REGISTRANT';
    return 'OTHER';
}