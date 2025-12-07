// src/lib/harvest-session.ts

import { prisma } from '@/lib/prisma';
import {
    HarvestSessionCreate,
    HarvestSessionUpdate,
    HarvestSessionStatus,
} from '@/types/harvest';

export async function createHarvestSession(data: HarvestSessionCreate) {
    return prisma.harvestSession.create({
        data: {
            datasetId: data.datasetId,
            recordsTotal: data.recordsTotal,
            status: 'pending',
        },
    });
}

export async function updateHarvestSession(id: string, data: HarvestSessionUpdate) {
    const updateData: any = { ...data };

    if (data.completedAt) {
        const session = await prisma.harvestSession.findUnique({
            where: { id },
            select: { startedAt: true },
        });

        if (session) {
            const duration = Math.floor(
                (data.completedAt.getTime() - session.startedAt.getTime()) / 1000
            );
            updateData.duration = duration;
        }
    }

    return prisma.harvestSession.update({
        where: { id },
        data: updateData,
    });
}

export async function getHarvestSession(id: string) {
    return prisma.harvestSession.findUnique({
        where: { id },
        include: {
            dataset: {
                include: {
                    archive: true,
                },
            },
        },
    });
}

export async function listHarvestSessions(datasetId?: string, status?: HarvestSessionStatus) {
    return prisma.harvestSession.findMany({
        where: {
            ...(datasetId && { datasetId }),
            ...(status && { status }),
        },
        include: {
            dataset: {
                include: {
                    archive: true,
                },
            },
        },
        orderBy: {
            startedAt: 'desc',
        },
    });
}

export async function startHarvestSession(id: string) {
    return prisma.harvestSession.update({
        where: { id },
        data: {
            status: 'running',
            startedAt: new Date(),
        },
    });
}

export async function completeHarvestSession(id: string, recordsProcessed: number) {
    const completedAt = new Date();

    const session = await prisma.harvestSession.findUnique({
        where: { id },
        select: { startedAt: true },
    });

    const duration = session
        ? Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000)
        : null;

    return prisma.harvestSession.update({
        where: { id },
        data: {
            status: 'completed',
            recordsProcessed,
            completedAt,
            duration,
        },
    });
}

export async function failHarvestSession(id: string, error: string) {
    return prisma.harvestSession.update({
        where: { id },
        data: {
            status: 'failed',
            completedAt: new Date(),
            errors: {
                timestamp: new Date().toISOString(),
                error,
            },
        },
    });
}