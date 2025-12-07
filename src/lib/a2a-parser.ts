import { BaseParser, type ParserContext } from './base-parser';
import { parseDate } from './date-parser';
import type { A2AData, ParsedRecord, ParsedDate } from '@/types/index';

export class A2AParser extends BaseParser {
    parse(a2a: A2AData, context: ParserContext): ParsedRecord | null {
        if (!a2a) return null;

        const source = a2a.Source || a2a['a2a:Source'];
        const person = a2a.Person || a2a['a2a:Person'];
        const relation = a2a.Relation || a2a['a2a:Relation'];
        const relationEP = a2a.RelationEP || a2a['a2a:RelationEP'];
        const event = a2a.Event || a2a['a2a:Event'];

        if (!source) return null;

        const sourceType = this.extractValue(source, 'SourceType.#text', 'a2a:SourceType', 'SourceType') || 'Unknown';
        const recordType = this.mapRecordType(sourceType);

        const sourceDate = source.SourceDate || source['a2a:SourceDate'] || source.SourceIndexDate || source['a2a:SourceIndexDate'];
        let eventDate: ParsedDate;

        if (sourceDate) {
            eventDate = parseDate(sourceDate);
        } else if (event) {
            const eventDateObj = event.EventDate || event['a2a:EventDate'];
            eventDate = parseDate(eventDateObj);
        } else {
            eventDate = { year: 1800, precision: 'unknown' };
        }

        const sourcePlaceObj = source.SourcePlace || source['a2a:SourcePlace'];
        const eventPlace = this.extractValue(sourcePlaceObj, 'Place.#text', 'a2a:Place', 'Place');

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

        if (relationEP) {
            const personMap = new Map<string, any>();

            if (person) {
                const personList = Array.isArray(person) ? person : [person];
                for (const p of personList) {
                    const pid = p['@_pid'];
                    if (pid) {
                        personMap.set(pid, p);
                    }
                }
            }

            const relationEPList = Array.isArray(relationEP) ? relationEP : [relationEP];
            for (const rel of relationEPList) {
                const personKeyRef = rel.PersonKeyRef || rel['a2a:PersonKeyRef'];
                const relType = this.extractValue(rel, 'RelationType.#text', 'a2a:RelationType', 'RelationType') || 'Unknown';
                const role = this.mapPersonRole(relType);

                if (personKeyRef && personMap.has(personKeyRef)) {
                    const personData = personMap.get(personKeyRef);
                    const p = this.extractPerson(personData, role);
                    if (p) persons.push(p);
                }
            }
        } else if (person) {
            const p = this.extractPerson(person, this.determineMainRole(recordType));
            if (p) persons.push(p);
        }

        if (relation) {
            const relations = Array.isArray(relation) ? relation : [relation];
            for (const rel of relations) {
                const relPerson = rel.Person || rel['a2a:Person'];
                const relType = this.extractValue(rel, 'RelationType.#text', 'a2a:RelationType', 'RelationType') || 'Unknown';
                const role = this.mapPersonRole(relType);

                if (relPerson) {
                    const p = this.extractPerson(relPerson, role);
                    if (p) persons.push(p);
                }
            }
        }

        return {
            externalId: context.externalId,
            sourceCode: context.sourceCode,
            setSpec: context.setSpec,
            recordType,
            eventDate,
            eventPlace,
            persons,
            rawData: a2a,
        };
    }

    private extractPerson(personData: any, role: string): {
        role: string;
        givenName?: string;
        surname?: string;
        patronym?: string;
        prefix?: string;
        age?: number;
        occupation?: string;
        residence?: string;
    } | null {
        const personName = personData.PersonName || personData['a2a:PersonName'];
        if (!personName) return null;

        const givenName = this.extractValue(personName, 'PersonNameFirstName.#text', 'a2a:PersonNameFirstName', 'PersonNameFirstName');
        const surname = this.extractValue(personName, 'PersonNameLastName.#text', 'a2a:PersonNameLastName', 'PersonNameLastName');
        const patronym = this.extractValue(personName, 'PersonNamePatronym.#text', 'a2a:PersonNamePatronym', 'PersonNamePatronym');
        const prefix = this.extractValue(personName, 'PersonNamePrefixLastName.#text', 'a2a:PersonNamePrefixLastName', 'PersonNamePrefixLastName');

        let age: number | undefined;
        const ageField = personData.Age || personData['a2a:Age'];
        if (ageField) {
            const ageValue = ageField['#text'] || ageField;
            age = typeof ageValue === 'number' ? ageValue : parseInt(ageValue, 10);
            if (isNaN(age)) age = undefined;
        }

        const occupation = this.extractValue(personData, 'Occupation.#text', 'a2a:Occupation', 'Occupation');

        const residenceObj = personData.Residence || personData['a2a:Residence'];
        const residence = this.extractValue(residenceObj, 'Place.#text', 'a2a:Place', 'Place');

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
}