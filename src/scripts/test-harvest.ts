// src/scripts/test-harvest.ts

import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

async function testHarvest() {
    const baseUrl = 'https://api.openarch.nl/oai-pmh/';

    // Test 1: Identify
    console.log('\n=== Test 1: Identify ===');
    try {
        const identifyUrl = `${baseUrl}?verb=Identify`;
        const response = await axios.get(identifyUrl, { httpsAgent, timeout: 30000 });
        console.log('✅ Identify works');
    } catch (error) {
        console.log('❌ Identify failed:', error instanceof Error ? error.message : error);
    }

    // Test 2: ListSets
    console.log('\n=== Test 2: ListSets ===');
    try {
        const setsUrl = `${baseUrl}?verb=ListSets`;
        const response = await axios.get(setsUrl, { httpsAgent, timeout: 30000 });
        console.log('Response length:', response.data.length);

        // Extract set names
        const setMatches = response.data.match(/<setSpec>([^<]+)<\/setSpec>/g);
        if (setMatches) {
            const sets = setMatches.map((m: string) => m.replace(/<\/?setSpec>/g, ''));
            console.log('✅ Available sets:', sets.slice(0, 10)); // First 10
            console.log(`   Total sets found: ${sets.length}`);
        }
    } catch (error) {
        console.log('❌ ListSets failed:', error instanceof Error ? error.message : error);
    }

    // Test 3: ListRecords with different parameters
    console.log('\n=== Test 3: ListRecords (various attempts) ===');

    const testCases = [
        { metadataPrefix: 'oai_a2a', set: undefined, name: 'Just metadata prefix' },
        { metadataPrefix: 'oai_dc', set: undefined, name: 'Try Dublin Core' },
        { metadataPrefix: 'a2a', set: undefined, name: 'Try a2a without oai_' },
    ];

    for (const test of testCases) {
        console.log(`\nTrying: ${test.name}`);
        try {
            let url = `${baseUrl}?verb=ListRecords&metadataPrefix=${test.metadataPrefix}`;
            if (test.set) url += `&set=${test.set}`;

            console.log(`URL: ${url}`);
            const response = await axios.get(url, { httpsAgent, timeout: 30000 });

            // Check if we got records
            const recordCount = (response.data.match(/<record>/g) || []).length;
            console.log(`✅ Success! Got ${recordCount} records`);

            // Show first error if any
            const errorMatch = response.data.match(/<error code="([^"]+)">([^<]+)<\/error>/);
            if (errorMatch) {
                console.log(`⚠️  API returned error: [${errorMatch[1]}] ${errorMatch[2]}`);
            }

            break; // If successful, stop trying
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.log(`❌ HTTP ${error.response.status}`);

                // Try to extract error from response
                const errorMatch = error.response.data?.match(/<error code="([^"]+)">([^<]+)<\/error>/);
                if (errorMatch) {
                    console.log(`   Error: [${errorMatch[1]}] ${errorMatch[2]}`);
                }
            } else {
                console.log('❌ Failed:', error instanceof Error ? error.message : error);
            }
        }
    }
}

testHarvest().catch(console.error);