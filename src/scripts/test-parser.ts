// Bestand: src/scripts/test-parser.ts

import { parseA2ARecord } from '@/lib/a2a-parser';
import type { A2AData } from '@/types/index';

const sampleData: A2AData = {
    Source: {
        SourceType: { '#text': 'BS Geboorte' },
        SourceDate: { Date: { '#text': '1850-03-15' } },
        SourcePlace: { Place: { '#text': 'Eindhoven' } },
    },
    Person: [
        {
            PersonName: {
                PersonNameFirstName: { '#text': 'Johannes' },
                PersonNameLastName: { '#text': 'van den Berg' },
            },
        },
    ],
    Relation: [
        {
            RelationType: { '#text': 'Vader' },
            Person: {
                PersonName: { PersonNameFirstName: { '#text': 'Petrus' } },
            },
        },
    ],
};

function main() {
    console.log('Testing Parser...');
    const res = parseA2ARecord(sampleData, { sourceCode: 'TEST', setSpec: 'bs_geboorte', externalId: '1' });

    if (res) {
        console.log(`✅ Parsed Type: ${res.recordType}`);
        console.log(`✅ Year: ${res.eventYear}`);
        console.log(`✅ Persons found: ${res.persons.length}`);
        res.persons.forEach(p => console.log(`   - ${p.role}: ${p.givenName} ${p.surname || ''}`));
    } else {
        console.error('❌ Parse failed');
    }
}

main();