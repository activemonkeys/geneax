// src/scripts/scan-all.ts

import { prisma } from '@/lib/prisma';
import { scanEndpoint } from '@/discovery/scan-endpoint';
import { generateConfig } from '@/discovery/generate-config';
import { analyzeXMLStructure, generateAnalysisReport } from '@/discovery/analyze-structure';

async function scanAllArchives() {
    const archives = await prisma.archiveRegistry.findMany({
        orderBy: { name: 'asc' },
    });

    console.log(`Found ${archives.length} archives to scan\n`);

    for (const archive of archives) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Scanning: ${archive.name} (${archive.code})`);
        console.log(`${'='.repeat(60)}\n`);

        const result = await scanEndpoint(archive.oaiUrl, archive.code, 20);

        if (result.success && result.identify && result.sets && result.sampleRecords) {
            await prisma.archiveRegistry.update({
                where: { code: archive.code },
                data: {
                    overallStatus: 'online',
                    lastHealthCheck: new Date(),
                },
            });

            for (const set of result.sets) {
                const existing = await prisma.archiveDataset.findUnique({
                    where: {
                        archiveCode_setSpec: {
                            archiveCode: archive.code,
                            setSpec: set.setSpec,
                        },
                    },
                });

                if (!existing) {
                    await prisma.archiveDataset.create({
                        data: {
                            archiveCode: archive.code,
                            setSpec: set.setSpec,
                            setName: set.setName,
                            setDescription: set.setDescription,
                            status: 'active',
                        },
                    });
                    console.log(`  ✓ Created dataset: ${set.setSpec}`);
                }
            }

            const config = await generateConfig(
                archive.code,
                archive.name,
                archive.oaiUrl,
                result.identify,
                result.sets,
                result.sampleRecords
            );

            await prisma.archiveRegistry.update({
                where: { code: archive.code },
                data: {
                    parserType: config.parserType,
                    parserConfig: config.parserConfig,
                },
            });

            const structure = analyzeXMLStructure(result.sampleRecords);
            await generateAnalysisReport(archive.code, structure);

            console.log(`✓ ${archive.code} scan complete`);
        } else {
            await prisma.archiveRegistry.update({
                where: { code: archive.code },
                data: {
                    overallStatus: 'offline',
                    lastHealthCheck: new Date(),
                },
            });

            console.log(`✗ ${archive.code} scan failed: ${result.error}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log('\n\n✓ All archives scanned');
}

scanAllArchives()
    .catch(console.error)
    .finally(() => prisma.$disconnect());