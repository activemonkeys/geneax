// Bestand: src/harvester/harvest.ts

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';
import logger from '@/lib/logger';
import type { HarvestConfig, HarvestResult } from '@/types/index';

function parseArguments(): HarvestConfig {
    const { values } = parseArgs({
        options: {
            source: { type: 'string', short: 's' },
            set: { type: 'string' },
            limit: { type: 'string', short: 'l' },
            resume: { type: 'boolean', short: 'r' },
            help: { type: 'boolean', short: 'h' },
        },
        allowPositionals: false,
    });

    if (values.help || !values.source || !values.set) {
        console.log(`
Usage: pnpm tsx src/harvester/harvest.ts --source=<code> --set=<setspec> [options]
Options:
  --limit, -l    Max records
  --resume, -r   Resume paused harvest
    `);
        process.exit(values.help ? 0 : 1);
    }

    return {
        sourceCode: values.source.toUpperCase(),
        setSpec: values.set,
        limit: values.limit ? parseInt(values.limit, 10) : undefined,
    };
}

async function harvest(cfg: HarvestConfig): Promise<HarvestResult> {
    const source = await prisma.source.findUnique({ where: { code: cfg.sourceCode } });
    if (!source || !source.isActive) {
        return { success: false, filesCreated: 0, recordsHarvested: 0, error: `Source invalid: ${cfg.sourceCode}` };
    }

    let harvestLog = await prisma.harvestLog.findUnique({
        where: { sourceId_setSpec: { sourceId: source.id, setSpec: cfg.setSpec } },
    });

    let resumptionToken = cfg.resumptionToken;

    if (harvestLog) {
        if (harvestLog.status === 'PAUSED' && harvestLog.resumptionToken) {
            resumptionToken = harvestLog.resumptionToken;
            logger.info('Resuming harvest', { token: resumptionToken });
        }
        await prisma.harvestLog.update({
            where: { id: harvestLog.id },
            data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });
    } else {
        harvestLog = await prisma.harvestLog.create({
            data: { sourceId: source.id, setSpec: cfg.setSpec, status: 'IN_PROGRESS' },
        });
    }

    const sourceDir = path.join(config.rawDir, cfg.sourceCode.toLowerCase(), cfg.setSpec);
    if (!fs.existsSync(sourceDir)) fs.mkdirSync(sourceDir, { recursive: true });

    let totalRecords = 0;
    let totalFiles = 0;
    let currentToken = resumptionToken;
    let hasMore = true;

    try {
        while (hasMore) {
            const url = new URL(source.oaiUrl);
            url.searchParams.set('verb', 'ListRecords');
            if (currentToken) {
                url.searchParams.set('resumptionToken', currentToken);
            } else {
                url.searchParams.set('metadataPrefix', 'oai_a2a');
                url.searchParams.set('set', cfg.setSpec);
            }

            const response = await axios.get(url.toString(), {
                timeout: config.harvest.timeout,
                responseType: 'text',
                headers: { 'User-Agent': 'Geneax/0.1.0' },
            });

            const recordCount = (response.data.match(/<record>/g) || []).length;
            totalRecords += recordCount;

            const filename = `batch_${Date.now()}_${totalFiles}.xml`;
            fs.writeFileSync(path.join(sourceDir, filename), response.data, 'utf-8');
            totalFiles++;

            logger.info(`Batch ${totalFiles}: ${recordCount} records`, { file: filename });

            const tokenMatch = response.data.match(/<resumptionToken[^>]*>([^<]+)<\/resumptionToken>/);
            currentToken = (tokenMatch && tokenMatch[1]) ? tokenMatch[1].trim() : undefined;

            if (!currentToken && response.data.includes('<resumptionToken') && response.data.includes('/>')) {
                currentToken = undefined;
            }

            if (!currentToken) hasMore = false;

            await prisma.harvestLog.update({
                where: { id: harvestLog.id },
                data: { recordsHarvested: totalRecords, filesCreated: totalFiles, resumptionToken: currentToken },
            });

            if (cfg.limit && totalRecords >= cfg.limit) {
                logger.info('Limit reached');
                hasMore = false;
                if (currentToken) {
                    await prisma.harvestLog.update({ where: { id: harvestLog.id }, data: { status: 'PAUSED' } });
                }
            }

            if (hasMore) await new Promise(r => setTimeout(r, config.harvest.requestDelay));
        }

        await prisma.harvestLog.update({
            where: { id: harvestLog.id },
            data: {
                status: currentToken ? 'PAUSED' : 'COMPLETED',
                completedAt: currentToken ? null : new Date(),
                resumptionToken: currentToken
            },
        });

        return { success: true, filesCreated: totalFiles, recordsHarvested: totalRecords, resumptionToken: currentToken };

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error('Harvest failed', { error: msg });
        await prisma.harvestLog.update({
            where: { id: harvestLog.id },
            data: { status: 'FAILED', lastError: msg, resumptionToken: currentToken },
        });
        return { success: false, filesCreated: totalFiles, recordsHarvested: totalRecords, error: msg };
    }
}

harvest(parseArguments())
    .then(res => {
        if (res.success) console.log('✅ Harvest complete/paused');
        else { console.error('❌ Harvest failed'); process.exit(1); }
    })
    .finally(() => prisma.$disconnect());