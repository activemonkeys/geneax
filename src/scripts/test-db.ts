import { prisma } from '@/lib/prisma';

async function main() {
    console.log('Testing database connection...');
    try {
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Database connected!', result);
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();