// src/scripts/stats.ts

import { prisma } from '@/lib/prisma';

async function main() {
    console.log('\n📊 Complete Database Statistics\n');

    // Records by type
    const byType = await prisma.record.groupBy({
        by: ['recordType'],
        _count: true,
    });

    console.log('Records by Type:');
    byType.forEach(r => {
        console.log(`  ${r.recordType}: ${r._count}`);
    });

    // Records by year range
    const yearStats = await prisma.$queryRaw<Array<{ year_range: string, count: bigint }>>`
        SELECT 
            CASE 
                WHEN "eventYear" < 1800 THEN 'Before 1800'
                WHEN "eventYear" >= 1800 AND "eventYear" < 1850 THEN '1800-1849'
                WHEN "eventYear" >= 1850 AND "eventYear" < 1900 THEN '1850-1899'
                WHEN "eventYear" >= 1900 AND "eventYear" < 1950 THEN '1900-1949'
                ELSE '1950+'
            END as year_range,
            COUNT(*) as count
        FROM "Record"
        GROUP BY year_range
        ORDER BY year_range
    `;

    console.log('\nRecords by Year Range:');
    yearStats.forEach(r => {
        console.log(`  ${r.year_range}: ${r.count}`);
    });

    // Top 10 plaatsen
    const topPlaces = await prisma.$queryRaw<Array<{ place: string, count: bigint }>>`
        SELECT "eventPlace" as place, COUNT(*) as count
        FROM "Record"
        WHERE "eventPlace" IS NOT NULL
        GROUP BY "eventPlace"
        ORDER BY count DESC
        LIMIT 10
    `;

    console.log('\nTop 10 Places:');
    topPlaces.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.place}: ${r.count}`);
    });

    // Top achternamen
    const topSurnames = await prisma.$queryRaw<Array<{ surname: string, count: bigint }>>`
        SELECT surname, COUNT(*) as count
        FROM "Person"
        WHERE surname IS NOT NULL
        GROUP BY surname
        ORDER BY count DESC
        LIMIT 10
    `;

    console.log('\nTop 10 Surnames:');
    topSurnames.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.surname}: ${r.count}`);
    });

    // Persons met leeftijd
    const withAge = await prisma.person.count({
        where: { age: { not: null } }
    });

    const withOccupation = await prisma.person.count({
        where: { occupation: { not: null } }
    });

    console.log('\nPerson Data Quality:');
    console.log(`  With age: ${withAge}`);
    console.log(`  With occupation: ${withOccupation}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());