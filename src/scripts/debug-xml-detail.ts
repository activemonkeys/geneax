// src/scripts/debug-xml-detail.ts

import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (name) => ['record', 'Relation', 'Person'].includes(name),
});

async function debugStructure() {
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
        console.log('No records found');
        return;
    }

    const recList = Array.isArray(records) ? records : [records];

    // Analyze first record in detail
    const firstRecord = recList[0];
    const a2a = firstRecord.metadata?.A2A || firstRecord.metadata?.['a2a:A2A'];

    console.log('=== Complete A2A Structure ===\n');
    console.log(JSON.stringify(a2a, null, 2));

    console.log('\n\n=== Available Keys in A2A ===');
    console.log(Object.keys(a2a || {}));

    // Count different record types across all records
    console.log('\n\n=== Analyzing all 150 records ===');

    let withPerson = 0;
    let withRelation = 0;
    const sourceTypes = new Map<string, number>();

    for (const r of recList) {
        const a2aData = r.metadata?.A2A || r.metadata?.['a2a:A2A'];
        if (!a2aData) continue;

        if (a2aData.Person) withPerson++;
        if (a2aData.Relation) withRelation++;

        const sourceType = a2aData.Source?.SourceType?.['#text'] || 'Unknown';
        sourceTypes.set(sourceType, (sourceTypes.get(sourceType) || 0) + 1);
    }

    console.log(`Records with Person: ${withPerson}`);
    console.log(`Records with Relation: ${withRelation}`);
    console.log('\nSource Types distribution:');

    const sorted = Array.from(sourceTypes.entries()).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    // Find a record WITH person data
    console.log('\n\n=== Looking for a record with Person data ===');
    for (let i = 0; i < recList.length; i++) {
        const r = recList[i];
        const a2aData = r.metadata?.A2A || r.metadata?.['a2a:A2A'];

        if (a2aData?.Person) {
            console.log(`\nFound at index ${i}!`);
            console.log('Identifier:', r.header?.identifier);
            console.log('Source Type:', a2aData.Source?.SourceType?.['#text']);
            console.log('\nPerson data:');
            console.log(JSON.stringify(a2aData.Person, null, 2));

            if (a2aData.Relation) {
                console.log('\nRelation data:');
                console.log(JSON.stringify(a2aData.Relation, null, 2));
            }
            break;
        }
    }
}

debugStructure().catch(console.error);