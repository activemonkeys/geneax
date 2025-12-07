// src/scripts/test-endpoint.ts

import { scanEndpoint } from '@/discovery/scan-endpoint';
import { generateConfig } from '@/discovery/generate-config';
import { analyzeXMLStructure, generateAnalysisReport } from '@/discovery/analyze-structure';

const testUrl = process.argv[2];
const testCode = process.argv[3];

if (!testUrl || !testCode) {
    console.error('Usage: tsx src/scripts/test-endpoint.ts <OAI_URL> <ARCHIVE_CODE>');
    console.error('Example: tsx src/scripts/test-endpoint.ts https://api.example.com/oai TEST_ARCHIVE');
    process.exit(1);
}

async function testEndpoint() {
    console.log(`Testing endpoint: ${testUrl}`);
    console.log(`Archive code: ${testCode}\n`);

    const result = await scanEndpoint(testUrl, testCode, 20);

    if (result.success && result.identify && result.sets && result.sampleRecords) {
        console.log('\n✓ Scan successful!');
        console.log(`\nRepository: ${result.identify.repositoryName}`);
        console.log(`Sets found: ${result.sets.length}`);
        console.log(`Sample records: ${result.sampleRecords.length}`);

        const config = await generateConfig(
            testCode,
            result.identify.repositoryName,
            testUrl,
            result.identify,
            result.sets,
            result.sampleRecords
        );

        console.log(`\nGenerated parser type: ${config.parserType}`);
        console.log(`Config saved to: sources/${testCode}/config.json`);

        const structure = analyzeXMLStructure(result.sampleRecords);
        await generateAnalysisReport(testCode, structure);

        console.log(`Analysis report saved to: sources/${testCode}/analysis-report.md`);
    } else {
        console.log('\n✗ Scan failed!');
        console.log(`Error: ${result.error}`);
    }
}

testEndpoint().catch(console.error);