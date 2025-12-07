// src/discovery/scan-endpoint.ts

import { OAIClient } from './oai-client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface ScanResult {
    success: boolean;
    archiveCode: string;
    identify?: any;
    sets?: any[];
    sampleRecords?: any[];
    error?: string;
}

export async function scanEndpoint(
    oaiUrl: string,
    archiveCode: string,
    sampleSize: number = 10
): Promise<ScanResult> {
    try {
        const client = new OAIClient(oaiUrl);

        console.log(`[${archiveCode}] Scanning endpoint: ${oaiUrl}`);

        const identify = await client.identify();
        console.log(`[${archiveCode}] Repository: ${identify.repositoryName}`);

        const sets = await client.listSets();
        console.log(`[${archiveCode}] Found ${sets.length} sets`);

        const sampleRecords: any[] = [];
        if (sets.length > 0) {
            const firstSet = sets[0];
            console.log(`[${archiveCode}] Fetching ${sampleSize} sample records from set: ${firstSet.setSpec}`);

            try {
                const result = await client.listRecords('oai_a2a', firstSet.setSpec);
                sampleRecords.push(...result.records.slice(0, sampleSize));
            } catch (error) {
                console.warn(`[${archiveCode}] Could not fetch sample records:`, error);
            }
        }

        const outputDir = join(process.cwd(), 'sources', archiveCode);
        await mkdir(outputDir, { recursive: true });

        await writeFile(
            join(outputDir, 'identify.json'),
            JSON.stringify(identify, null, 2)
        );

        await writeFile(
            join(outputDir, 'sets.json'),
            JSON.stringify(sets, null, 2)
        );

        if (sampleRecords.length > 0) {
            await writeFile(
                join(outputDir, 'sample-records.json'),
                JSON.stringify(sampleRecords, null, 2)
            );
        }

        console.log(`[${archiveCode}] Scan complete. Files saved to: ${outputDir}`);

        return {
            success: true,
            archiveCode,
            identify,
            sets,
            sampleRecords,
        };
    } catch (error) {
        console.error(`[${archiveCode}] Scan failed:`, error);
        return {
            success: false,
            archiveCode,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}