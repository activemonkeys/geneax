import { prisma } from '@/lib/prisma';
import { parseArgs } from 'util';

interface CleanOptions {
    all?: boolean;
    persons?: boolean;
    records?: boolean;
    harvests?: boolean;
    sources?: boolean;
    confirm?: boolean;
}

function parseArguments(): CleanOptions {
    const { values } = parseArgs({
        options: {
            all: { type: 'boolean' },
            persons: { type: 'boolean' },
            records: { type: 'boolean' },
            harvests: { type: 'boolean' },
            sources: { type: 'boolean' },
            confirm: { type: 'boolean', short: 'y' },
        },
        allowPositionals: false,
    });

    return {
        all: values.all,
        persons: values.persons,
        records: values.records,
        harvests: values.harvests,
        sources: values.sources,
        confirm: values.confirm,
    };
}

async function main() {
    const options = parseArguments();

    if (!options.all && !options.persons && !options.records && !options.harvests && !options.sources) {
        console.log(`
🗑️  Database Cleanup Tool

Usage:
  pnpm clean-db -- --all              # Delete everything
  pnpm clean-db -- --persons          # Delete only persons
  pnpm clean-db -- --records          # Delete records (and persons)
  pnpm clean-db -- --harvests         # Delete harvest logs
  pnpm clean-db -- --sources          # Delete sources (and all related data)
  
Options:
  -y, --confirm                       # Skip confirmation prompt

Examples:
  pnpm clean-db -- --all -y           # Delete everything without confirmation
  pnpm clean-db -- --persons --records  # Delete persons and records
        `);
        process.exit(0);
    }

    console.log('\n🗑️  Database Cleanup\n');

    const counts = {
        persons: await prisma.person.count(),
        records: await prisma.record.count(),
        harvests: await prisma.harvestLog.count(),
        sources: await prisma.source.count(),
    };

    console.log('Current database state:');
    console.log(`  Persons: ${counts.persons}`);
    console.log(`  Records: ${counts.records}`);
    console.log(`  Harvest Logs: ${counts.harvests}`);
    console.log(`  Sources: ${counts.sources}`);
    console.log();

    const toDelete: string[] = [];
    if (options.all) {
        toDelete.push('All data (Persons, Records, Harvest Logs, Sources)');
    } else {
        if (options.persons) toDelete.push('Persons');
        if (options.records) toDelete.push('Records (and Persons)');
        if (options.harvests) toDelete.push('Harvest Logs');
        if (options.sources) toDelete.push('Sources (and all related data)');
    }

    console.log('⚠️  Will delete:');
    toDelete.forEach(item => console.log(`  - ${item}`));
    console.log();

    if (!options.confirm) {
        console.log('❌ Cancelled. Use -y or --confirm to proceed.');
        return;
    }

    console.log('🔥 Deleting...\n');

    if (options.all || options.sources) {
        const deleted = await prisma.source.deleteMany();
        console.log(`✅ Deleted ${deleted.count} sources (cascade: all related data)`);
    } else {
        if (options.persons) {
            const deleted = await prisma.person.deleteMany();
            console.log(`✅ Deleted ${deleted.count} persons`);
        }

        if (options.records) {
            const deleted = await prisma.record.deleteMany();
            console.log(`✅ Deleted ${deleted.count} records (cascade: persons)`);
        }

        if (options.harvests) {
            const deleted = await prisma.harvestLog.deleteMany();
            console.log(`✅ Deleted ${deleted.count} harvest logs`);
        }
    }

    console.log('\n✅ Cleanup complete!\n');
}

main()
    .catch(err => {
        console.error('Cleanup failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());