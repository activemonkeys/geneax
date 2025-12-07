import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { A2AParser } from '@/lib/a2a-parser';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (name) => ['record', 'Relation', 'Person'].includes(name),
});

const a2aParser = new A2AParser();

async function debugFirstRecord() {
    const xmlDir = './data/raw/openarch/all';
    const files = fs.readdirSync(xmlDir).filter(f => f.endsWith('.xml'));

    if (files.length === 0) {
        console.log('No XML files found');
        return;
    }

    const xmlFile = path.join(xmlDir, files[0]);
    console.log(`Reading: ${xmlFile}\n`);

    const xml = fs.readFileSync(xmlFile, 'utf-8');
    const parsed = parser.parse(xml);

    const records = parsed['OAI-PMH']?.ListRecords?.record;
    if (!records) {
        console.log('No records found in XML');
        return;
    }

    const recList = Array.isArray(records) ? records : [records];
    console.log(`Total records in file: ${recList.length}\n`);

    for (let i = 0; i < Math.min(3, recList.length); i++) {
        const r = recList[i];

        console.log(`\n=== Record ${i + 1} ===`);
        console.log('Identifier:', r.header?.identifier);

        const a2a = r.metadata?.A2A || r.metadata?.['a2a:A2A'];

        if (!a2a) {
            console.log('❌ No A2A data found');
            console.log('Available metadata keys:', Object.keys(r.metadata || {}));
            continue;
        }

        console.log('✅ A2A data found');

        if (a2a.Source) {
            console.log('\nSource:');
            console.log('  Type:', a2a.Source.SourceType?.['#text']);
            console.log('  Date:', a2a.Source.SourceDate?.Date?.['#text']);
            console.log('  Place:', a2a.Source.SourcePlace?.Place?.['#text']);
        }

        if (a2a.Person) {
            const persons = Array.isArray(a2a.Person) ? a2a.Person : [a2a.Person];
            console.log(`\nPersons: ${persons.length}`);
            persons.forEach((p: any, idx: number) => {
                console.log(`  Person ${idx + 1}:`, p.PersonName?.PersonNameFirstName?.['#text'], p.PersonName?.PersonNameLastName?.['#text']);
            });
        } else {
            console.log('\n❌ No Person found');
        }

        if (a2a.Relation) {
            const relations = Array.isArray(a2a.Relation) ? a2a.Relation : [a2a.Relation];
            console.log(`\nRelations: ${relations.length}`);
            relations.forEach((rel: any, idx: number) => {
                console.log(`  Relation ${idx + 1}:`, rel.RelationType?.['#text']);
                if (rel.Person) {
                    console.log('    Name:', rel.Person.PersonName?.PersonNameFirstName?.['#text'], rel.Person.PersonName?.PersonNameLastName?.['#text']);
                }
            });
        } else {
            console.log('\n❌ No Relations found');
        }

        console.log('\n--- Parsing with A2A parser ---');
        const extId = r.header?.identifier || `record_${i}`;
        const parsedRec = a2aParser.parse(a2a, {
            sourceCode: 'OPENARCH',
            setSpec: 'all',
            externalId: extId
        });

        if (parsedRec) {
            console.log('✅ Parsed successfully');
            console.log('  Type:', parsedRec.recordType);
            console.log('  Year:', parsedRec.eventDate.year);
            console.log('  Persons extracted:', parsedRec.persons.length);
            parsedRec.persons.forEach((p: any) => {
                console.log(`    - ${p.role}: ${p.givenName} ${p.surname || ''}`);
            });
        } else {
            console.log('❌ Parser returned null');
        }
    }
}

debugFirstRecord().catch(console.error);