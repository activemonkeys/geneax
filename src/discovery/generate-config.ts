// src/discovery/generate-config.ts

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { analyzeXMLStructure } from './analyze-structure';

export interface ArchiveConfig {
    code: string;
    name: string;
    oaiUrl: string;
    website?: string;
    parserType: string;
    parserConfig: {
        namespace?: string;
        hasRelationEP?: boolean;
        metadataPrefix?: string;
        [key: string]: any;
    };
    metadata: {
        region?: string;
        city?: string;
        coverage?: any;
        [key: string]: any;
    };
}

export async function generateConfig(
    archiveCode: string,
    name: string,
    oaiUrl: string,
    identify: any,
    sets: any[],
    sampleRecords: any[]
): Promise<ArchiveConfig> {
    const structure = analyzeXMLStructure(sampleRecords);

    let parserType = 'a2a_base';
    if (structure.hasRelationEP) {
        parserType = 'a2a_relationep';
    }

    const config: ArchiveConfig = {
        code: archiveCode,
        name: name || identify.repositoryName,
        oaiUrl: oaiUrl,
        parserType: parserType,
        parserConfig: {
            metadataPrefix: 'oai_a2a',
            hasRelationEP: structure.hasRelationEP,
            namespace: structure.namespaces[0] || 'a2a',
        },
        metadata: {
            availableSets: sets.map((s) => ({
                setSpec: s.setSpec,
                setName: s.setName,
            })),
            recordTypes: Array.from(structure.recordTypes),
            earliestDatestamp: identify.earliestDatestamp,
        },
    };

    const outputPath = join(process.cwd(), 'sources', archiveCode, 'config.json');
    await writeFile(outputPath, JSON.stringify(config, null, 2));
    console.log(`Config generated: ${outputPath}`);

    return config;
}