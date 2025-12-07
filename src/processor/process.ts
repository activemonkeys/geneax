// Bestand: src/processor/process.ts

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import { XMLParser } from 'fast-xml-parser';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';
import logger from '@/lib/logger';
import { parseA2ARecord } from '@/lib/a2a-parser';
import type { OAIResponse, ParsedRecord } from '@/types/index';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (name) => ['record', 'Relation', 'Person'].includes(name),
});

interface ProcessConfig {
    sourceCode?: string;
    setSpec?: string;
    file?: string;
    dryRun?: boolean;
}

function parseArguments(): ProcessConfig {
    const { values } = parseArgs({
        options: {
            source: { type: 'string', short: 's' },
            set: { type: 'string' },
            file: { type: 'string', short: 'f' },
            'dry-run': { type: 'boolean', short: 'd' },
        },
        allowPositionals: false,
    });
    return {
        sourceCode: values.source?.toUpperCase(),
        setSpec: values.set,
        file: values.file,
        dryRun: values['dry-run'],
    };
}

function findXmlFiles(cfg: ProcessConfig): string[] {
    if (cfg.file) {
        const p = path.isAbsolute(cfg.file) ? cfg.file : path.join(process.cwd(), cfg.file);
        return fs.existsSync(p) ? [p] : [];
    }

    const files: string[] = [];
    if (!fs.existsSync(config.rawDir)) return [];

    const sources = cfg.sourceCode ? [cfg.sourceCode.toLowerCase()] : fs.readdirSync(config.rawDir);

    for (const source of sources) {
        const sDir = path.join(config.rawDir, source);
        if (!fs.existsSync(sDir) || !fs.statSync(sDir).isDirectory()) continue;

        const sets = cfg.setSpec ? [cfg.setSpec] : fs.readdirSync(sDir);
        for (const set of sets) {
            const setDir = path.join(sDir, set);
            if (!fs.existsSync(setDir) || !fs.statSync(setDir).isDirectory()) continue;

            files.push(...fs.readdirSync(setDir).filter(f => f.endsWith('.xml')).map(f => path.join(setDir, f)));
        }
    }
    return files.sort();
}

async function processFile(filePath: string, dryRun: boolean): Promise<{ processed: number, created: number, errors: number }> {
    const parts = filePath.split(path.sep);
    const setSpec = parts[parts.length - 2] || 'unknown';
    const sourceCode = parts[parts.length - 3]?.toUpperCase() || 'UNKNOWN';

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
        const p = parseA2ARecord(a2a, { sourceCode, setSpec, externalId: extId });
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const safeRawData = rec.rawData as any;

                await tx.record.upsert({
                    where: { id_eventYear: { id: rec.externalId, eventYear: rec.eventYear } },
                    create: {
                        id: rec.externalId,
                        sourceCode: rec.sourceCode,
                        setSpec: rec.setSpec,
                        recordType: rec.recordType,
                        eventYear: rec.eventYear,
                        eventDate: rec.eventDate,
                        eventPlace: rec.eventPlace,
                        rawData: safeRawData,
                    },
                    update: {
                        rawData: safeRawData,
                        eventDate: rec.eventDate,
                        eventPlace: rec.eventPlace
                    },
                });

                await tx.person.deleteMany({ where: { recordId: rec.externalId, recordYear: rec.eventYear } });

                if (rec.persons.length > 0) {
                    await tx.person.createMany({
                        data: rec.persons.map(p => ({
                            recordId: rec.externalId,
                            recordYear: rec.eventYear,
                            role: p.role,
                            givenName: p.givenName,
                            surname: p.surname,
                            patronym: p.patronym,
                            prefix: p.prefix,
                            age: p.age,
                            birthYear: (p.age && rec.eventYear) ? rec.eventYear - p.age : undefined,
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

    logger.info(`Found ${files.length} files`);

    const stats = { processed: 0, created: 0, errors: 0 };
    for (const file of files) {
        const res = await processFile(file, cfg.dryRun || false);
        stats.processed += res.processed;
        stats.created += res.created;
        stats.errors += res.errors;
    }

    console.log(`\nSummary: ${stats.processed} records processed, ${stats.created} saved, ${stats.errors} errors.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());