import { prisma } from '@/lib/prisma';
import oaiClient from '@/lib/oai-client';
import type { SourceConfig } from '@/types/index';

const KNOWN_SOURCES: SourceConfig[] = [
    {
        code: 'OPENARCH',
        name: 'Open Archieven (Aggregator)',
        oaiUrl: 'https://api.openarch.nl/oai-pmh/',
        sets: ['all'],
        parserType: 'a2a',
        parserConfig: {
            personRoleMapping: {
                'Geregistreerde': 'REGISTRANT',
            },
            recordTypeMapping: {
                'other:': 'OTHER',
                'other:Bevolkingsregister': 'POPULATION_REGISTER',
            },
        },
    },
    {
        code: 'BHIC',
        name: 'Brabants Historisch Informatie Centrum',
        oaiUrl: 'https://api.bhic.nl/oai-pmh',
        sets: ['bs_geboorte', 'bs_huwelijk', 'bs_overlijden'],
        parserType: 'a2a',
    },
];

async function main() {
    console.log('--- Managing Sources ---\n');

    const existing = await prisma.source.findMany();

    if (existing.length > 0) {
        console.log('Bestaande bronnen in database:');
        existing.forEach(s => console.log(`  ✓ ${s.code} (${s.isActive ? 'Active' : 'Inactive'}) - ${s.name}`));
        console.log();
    }

    for (const src of KNOWN_SOURCES) {
        if (existing.find(e => e.code === src.code)) {
            console.log(`⏭️  Skipping ${src.code}: already exists`);
            continue;
        }

        console.log(`🔍 Testing ${src.code} (${src.name})...`);
        console.log(`   URL: ${src.oaiUrl}`);

        const check = await oaiClient.identify(src.oaiUrl);

        if (check.valid) {
            await prisma.source.create({
                data: {
                    code: src.code,
                    name: src.name,
                    oaiUrl: src.oaiUrl,
                    availableSets: src.sets,
                    isActive: true,
                    parserType: src.parserType,
                    parserConfig: (src.parserConfig || {}) as any,
                },
            });
            console.log(`✅ Added ${src.code}`);
            if (check.repositoryName) {
                console.log(`   Repository: ${check.repositoryName}`);
            }
            console.log(`   Parser: ${src.parserType}`);
        } else {
            console.log(`❌ Failed ${src.code}: ${check.error}`);
            console.log(`   Tip: Deze bron wordt overgeslagen maar kan later handmatig toegevoegd worden.`);
        }
        console.log();
    }

    console.log('--- Summary ---');
    const final = await prisma.source.findMany();
    console.log(`Total sources in database: ${final.length}`);
    console.log(`Active sources: ${final.filter(s => s.isActive).length}`);
}

main()
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());