// src/scripts/populate-registry.ts

import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface RegistryEntry {
    code: string;
    name: string;
    oaiUrl: string;
    website?: string;
    region?: string;
    city?: string;
    estimatedRecords?: number;
    coverage?: {
        dtb?: { from: number; to: number };
        bs?: { from: number; to: number };
    };
}

interface RegistryFile {
    version: string;
    lastUpdated: string;
    archives: RegistryEntry[];
}

async function populateRegistry() {
    const registryPath = join(process.cwd(), 'sources', 'registry.json');
    const content = await readFile(registryPath, 'utf-8');
    const registry: RegistryFile = JSON.parse(content);

    console.log(`Loading ${registry.archives.length} archives from registry.json...`);

    for (const archive of registry.archives) {
        console.log(`\n[${archive.code}] Processing ${archive.name}...`);

        try {
            const existing = await prisma.archiveRegistry.findUnique({
                where: { code: archive.code },
            });

            const data = {
                code: archive.code,
                name: archive.name,
                oaiUrl: archive.oaiUrl,
                website: archive.website,
                parserType: 'a2a_base',
                metadata: {
                    region: archive.region,
                    city: archive.city,
                    estimatedRecords: archive.estimatedRecords,
                    coverage: archive.coverage,
                },
            };

            if (existing) {
                await prisma.archiveRegistry.update({
                    where: { code: archive.code },
                    data,
                });
                console.log(`  ✓ Updated`);
            } else {
                await prisma.archiveRegistry.create({
                    data,
                });
                console.log(`  ✓ Created`);
            }
        } catch (error) {
            console.error(`  ✗ Error:`, error);
        }
    }

    const total = await prisma.archiveRegistry.count();
    console.log(`\n✓ Registry populated. Total archives: ${total}`);
}

populateRegistry()
    .catch(console.error)
    .finally(() => prisma.$disconnect());