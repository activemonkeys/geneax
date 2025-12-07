import { prisma } from '@/lib/prisma';

async function main() {
    const recordCount = await prisma.record.count();
    const personCount = await prisma.person.count();

    console.log('\n📊 Database Statistics:');
    console.log('─────────────────────');
    console.log(`Records: ${recordCount}`);
    console.log(`Persons: ${personCount}`);

    if (personCount > 0) {
        const samples = await prisma.person.findMany({
            take: 5,
            select: {
                role: true,
                givenName: true,
                surname: true,
                residence: true,
            }
        });

        console.log('\n👤 Sample Persons:');
        samples.forEach((p, i) => {
            console.log(`${i + 1}. ${p.role}: ${p.givenName || '?'} ${p.surname || '?'} (${p.residence || 'unknown'})`);
        });

        const byRole = await prisma.person.groupBy({
            by: ['role'],
            _count: true,
        });

        console.log('\n📋 Persons by Role:');
        byRole.forEach(r => {
            console.log(`  ${r.role}: ${r._count}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());