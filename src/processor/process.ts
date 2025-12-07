import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import { XMLParser } from 'fast-xml-parser';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';
import logger from '@/lib/logger';
import parserRegistry from '@/lib/parser-registry';
import type { OAIResponse, ParsedRecord } from '@/types/index';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (name) => ['record', 'Relation', 'Person'].includes(name),
});

interface ProcessConfig {
    dryRun: boolean;
    file?: string;
}

function parseArguments(): ProcessConfig {
    const { values } = parseArgs({
        options: {
            'dry-run': { type: 'boolean' },
            file: { type: 'string' },
        },
        allowPositionals: false,
    });

    return {
        dryRun: values['dry-run'] || false,
        file: values.file,
    };
}

function findXmlFiles(cfg: ProcessConfig): string[] {
    const files: string[] = [];

    if (cfg.file) {
        const fullPath = path.join(config.rawDir, cfg.file);
        if (fs.existsSync(fullPath)) {
            files.push(fullPath);
        }
        return files;
    }

    function walk(dir: string) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.xml')) {
                files.push(fullPath);
            }
        }
    }

    walk(config.rawDir);
    return files.sort();
}

async function processFile(filePath: string, dryRun: boolean): Promise<{ processed: number, created: number, errors: number }> {
    const parts = filePath.split(path.sep);
    const setSpec = parts[parts.length - 2] || 'unknown';
    const sourceCode = parts[parts.length - 3]?.toUpperCase() || 'UNKNOWN';

    const source = await prisma.source.findUnique({ where: { code: sourceCode } });
    if (!source) {
        logger.error(`Source not found: ${sourceCode}`);
        return { processed: 0, created: 0, errors: 1 };
    }

    const parserInstance = parserRegistry.get(source.parserType, source.parserConfig as any);
    if (!parserInstance) {
        logger.error(`Parser not found: ${source.parserType}`);
        return { processed: 0, created: 0, errors: 1 };
    }

    const xml = fs.readFileSync(filePath, 'utf-8');
    let parsed: OAIResponse;
    try {
        parsed = parser.parse(xml) as OAIResponse;
    } catch {
        return { processed: 0, created: 0, errors: 1 };
    }

    const records = parsed['OAI-PMH']?.ListRecords?.record;
    if (!records) return { processed: 0, created: 0, errors: 0 };

    const recList = Array.isArray(records) ? records : [records];
    const parsedRecs: ParsedRecord[] = [];

    for (const r of recList) {
        if (r.header?.status === 'deleted') continue;
        const extId = r.header?.identifier;
        if (!extId) continue;

        const a2a = r.metadata?.A2A || r.metadata?.['a2a:A2A'];
        if (!a2a) continue;

        const p = parserInstance.parse(a2a, { sourceCode, setSpec, externalId: extId, config: source.parserConfig as any });
        if (p) parsedRecs.push(p);
    }

    if (dryRun) {
        logger.info(`Dry run: parsed ${parsedRecs.length} records from ${path.basename(filePath)}`);
        return { processed: parsedRecs.length, created: 0, errors: 0 };
    }

    let created = 0;
    for (let i = 0; i < parsedRecs.length; i += config.processor.batchSize) {
        const batch = parsedRecs.slice(i, i + config.processor.batchSize);
        await prisma.$transaction(async (tx) => {
            for (const rec of batch) {
                const safeRawData = rec.rawData as any;

                await tx.record.upsert({
                    where: { id_eventYear: { id: rec.externalId, eventYear: rec.eventDate.year } },
                    create: {
                        id: rec.externalId,
                        sourceCode: rec.sourceCode,
                        setSpec: rec.setSpec,
                        recordType: rec.recordType,
                        eventYear: rec.eventDate.year,
                        eventMonth: rec.eventDate.month,
                        eventDay: rec.eventDate.day,
                        eventDatePrecision: rec.eventDate.precision,
                        eventDateOriginal: rec.eventDate.original,
                        eventPlace: rec.eventPlace,
                        rawData: safeRawData,
                    },
                    update: {
                        rawData: safeRawData,
                        eventMonth: rec.eventDate.month,
                        eventDay: rec.eventDate.day,
                        eventDatePrecision: rec.eventDate.precision,
                        eventDateOriginal: rec.eventDate.original,
                        eventPlace: rec.eventPlace
                    },
                });

                await tx.person.deleteMany({ where: { recordId: rec.externalId, recordYear: rec.eventDate.year } });

                if (rec.persons.length > 0) {
                    await tx.person.createMany({
                        data: rec.persons.map(p => ({
                            recordId: rec.externalId,
                            recordYear: rec.eventDate.year,
                            role: p.role,
                            givenName: p.givenName,
                            surname: p.surname,
                            patronym: p.patronym,
                            prefix: p.prefix,
                            age: p.age,
                            birthYear: (p.age && rec.eventDate.year) ? rec.eventDate.year - p.age : undefined,
                            occupation: p.occupation,
                            residence: p.residence,
                        })),
                    });
                }
            }
        });
        created += batch.length;
        logger.progress(Math.min(i + batch.length, parsedRecs.length), parsedRecs.length, `Saved ${created}`);
    }

    return { processed: parsedRecs.length, created, errors: 0 };
}

async function main() {
    const cfg = parseArguments();
    const files = findXmlFiles(cfg);

    if (files.length === 0) {
        console.log('No XML files found.');
        return;
    }

    console.log(`Found ${files.length} XML file(s) to process.`);
    if (cfg.dryRun) console.log('DRY RUN mode enabled.\n');

    let totalProcessed = 0;
    let totalCreated = 0;
    let totalErrors = 0;

    for (const file of files) {
        console.log(`Processing: ${path.basename(file)}`);
        const result = await processFile(file, cfg.dryRun);
        totalProcessed += result.processed;
        totalCreated += result.created;
        totalErrors += result.errors;
    }

    console.log(`\nSummary: ${totalProcessed} records processed, ${totalCreated} saved, ${totalErrors} errors.`);
}

main()
    .catch((err) => {
        console.error('Processing failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());