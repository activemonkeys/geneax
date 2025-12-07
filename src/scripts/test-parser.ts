import { A2AParser } from '@/lib/a2a-parser';
import type { A2AData } from '@/types/index';

const a2aParser = new A2AParser();

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
    const res = a2aParser.parse(sampleData, { sourceCode: 'TEST', setSpec: 'bs_geboorte', externalId: '1' });

    if (res) {
        console.log(`✅ Parsed Type: ${res.recordType}`);
        console.log(`✅ Year: ${res.eventDate.year}`);
        console.log(`✅ Persons found: ${res.persons.length}`);
        res.persons.forEach(p => console.log(`   - ${p.role}: ${p.givenName} ${p.surname || ''}`));
    } else {
        console.error('❌ Parse failed');
    }
}

main();