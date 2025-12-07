import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('\n🔄 Complete Database Reset\n');

    console.log('Step 1: Delete all database records...');
    await prisma.person.deleteMany();
    await prisma.record.deleteMany();
    await prisma.harvestLog.deleteMany();
    await prisma.source.deleteMany();
    console.log('✅ Database cleared');

    console.log('\nStep 2: Delete XML files...');
    const rawDir = './data/raw';
    if (fs.existsSync(rawDir)) {
        const dirs = fs.readdirSync(rawDir);
        let fileCount = 0;

        for (const dir of dirs) {
            const fullPath = path.join(rawDir, dir);
            if (fs.statSync(fullPath).isDirectory()) {
                const files = fs.readdirSync(fullPath, { recursive: true });
                files.forEach(file => {
                    const filePath = path.join(fullPath, file as string);
                    if (fs.statSync(filePath).isFile() && filePath.endsWith('.xml')) {
                        fs.unlinkSync(filePath);
                        fileCount++;
                    }
                });
            }
        }
        console.log(`✅ Deleted ${fileCount} XML files`);
    } else {
        console.log('ℹ️  No XML files found');
    }

    console.log('\n✅ Complete reset finished!');
    console.log('\nNext steps:');
    console.log('  1. pnpm add-source');
    console.log('  2. pnpm harvest -- --source=openarch --set=all --limit=100');
    console.log('  3. pnpm process');
}

main()
    .catch(err => {
        console.error('Reset failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());