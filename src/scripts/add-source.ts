// Bestand: src/scripts/add-source.ts

import { prisma } from '@/lib/prisma';
import oaiClient from '@/lib/oai-client';

const KNOWN_SOURCES = [
    { code: 'BHIC', name: 'Brabants Historisch Informatie Centrum', oaiUrl: 'https://api.bhic.nl/oai-pmh', sets: ['bs_geboorte', 'bs_huwelijk', 'bs_overlijden'] },
    { code: 'SAA', name: 'Stadsarchief Amsterdam', oaiUrl: 'https://webservices.picturae.com/a2a/299ac5c6-51d4-4bab-9fd1-c0afc7a94fd6', sets: ['dtb_dopen', 'dtb_trouwen', 'dtb_begraven', 'bs_geboorte'] },
    { code: 'GA', name: 'Gelders Archief', oaiUrl: 'https://www.geldersarchief.nl/oai', sets: ['genealogie'] },
    { code: 'WBA', name: 'West-Brabants Archief', oaiUrl: 'https://api.memorix.io/oai-pmh/v1/79c56a5e-6c89-11e3-92e7-3cd92befe4f8', sets: ['bs_geboorte', 'bs_huwelijk'] },
];

async function main() {
    console.log('--- Managing Sources ---');

    const existing = await prisma.source.findMany();
    existing.forEach(s => console.log(`Existing: ${s.code} (${s.isActive ? 'Active' : 'Inactive'})`));

    for (const src of KNOWN_SOURCES) {
        if (existing.find(e => e.code === src.code)) continue;

        console.log(`Testing ${src.code}...`);
        const check = await oaiClient.identify(src.oaiUrl);

        if (check.valid) {
            await prisma.source.create({
                data: {
                    code: src.code, name: src.name, oaiUrl: src.oaiUrl,
                    availableSets: src.sets, isActive: true,
                },
            });
            console.log(`✅ Added ${src.code}`);
        } else {
            console.log(`❌ Failed ${src.code}: ${check.error}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());