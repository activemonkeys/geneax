import { prisma } from '@/lib/prisma';

async function main() {
    console.log('🔄 Migrating existing data to flexible schema...\n');

    console.log('Step 1: Checking current data...');
    const recordCount = await prisma.record.count();
    const personCount = await prisma.person.count();

    console.log(`  Found ${recordCount} records and ${personCount} persons`);

    if (recordCount === 0) {
        console.log('\n✅ No data to migrate. Database is ready for new flexible schema.');
        return;
    }

    console.log('\nStep 2: Updating Sources with parser configuration...');
    const sources = await prisma.source.findMany();

    for (const source of sources) {
        if (!source.parserType) {
            await prisma.source.update({
                where: { id: source.id },
                data: {
                    parserType: 'a2a',
                    parserConfig: source.code === 'OPENARCH' ? {
                        personRoleMapping: {
                            'Geregistreerde': 'REGISTRANT',
                        },
                        recordTypeMapping: {
                            'other:': 'OTHER',
                            'other:Bevolkingsregister': 'POPULATION_REGISTER',
                        },
                    } : {},
                },
            });
            console.log(`  ✅ Updated source: ${source.code}`);
        }
    }

    console.log('\nStep 3: Checking for records without date precision...');
    const recordsWithoutPrecision = await prisma.record.count({
        where: { eventDatePrecision: null }
    });

    if (recordsWithoutPrecision > 0) {
        console.log(`  Found ${recordsWithoutPrecision} records without date precision`);
        console.log('  Setting default precision to "year"...');

        await prisma.record.updateMany({
            where: { eventDatePrecision: null },
            data: { eventDatePrecision: 'year' }
        });

        console.log('  ✅ Updated date precision');
    }

    console.log('\n✅ Migration complete!');
    console.log('\nDatabase is now using flexible schema:');
    console.log('  - RecordType: VARCHAR (was ENUM)');
    console.log('  - PersonRole: VARCHAR (was ENUM)');
    console.log('  - Date storage: year/month/day with precision');
    console.log('  - Source parser config: JSONB');
}

main()
    .catch(err => {
        console.error('Migration failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());