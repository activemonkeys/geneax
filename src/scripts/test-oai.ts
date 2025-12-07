// Bestand: src/scripts/test-oai.ts

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
});

const ARCHIVES = [
    { name: 'WBA', url: 'https://api.memorix.io/oai-pmh/v1/79c56a5e-6c89-11e3-92e7-3cd92befe4f8' },
    { name: 'BHIC', url: 'https://api.bhic.nl/oai-pmh' },
];

async function testArchive(name: string, url: string) {
    console.log(`\nTesting: ${name} (${url})`);
    try {
        // Identify
        const idRes = await axios.get(`${url}?verb=Identify`, { timeout: 10000 });
        const idData = parser.parse(idRes.data);
        console.log(`✅ Identify: ${idData['OAI-PMH']?.Identify?.repositoryName || 'OK'}`);

        // ListSets
        const setRes = await axios.get(`${url}?verb=ListSets`, { timeout: 10000 });
        const setList = parser.parse(setRes.data)['OAI-PMH']?.ListSets?.set;
        const count = Array.isArray(setList) ? setList.length : (setList ? 1 : 0);
        console.log(`✅ ListSets: Found ${count} sets`);

        // ListRecords (Sample)
        const recRes = await axios.get(`${url}?verb=ListRecords&metadataPrefix=oai_a2a`, { timeout: 30000 });
        const recData = parser.parse(recRes.data);
        const error = recData['OAI-PMH']?.error;

        if (error) {
            console.log(`⚠️  OAI Error: ${error['@_code']}`);
        } else {
            const recs = recData['OAI-PMH']?.ListRecords?.record;
            const recCount = Array.isArray(recs) ? recs.length : (recs ? 1 : 0);
            console.log(`✅ ListRecords: Received ${recCount} records`);
        }
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`❌ Error: ${message}`);
        return false;
    }
}

async function main() {
    for (const archive of ARCHIVES) {
        await testArchive(archive.name, archive.url);
    }
}

main().catch(console.error);