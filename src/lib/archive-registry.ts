// src/lib/archive-registry.ts

import { prisma } from '@/lib/prisma';
import {
    ArchiveRegistryCreate,
    ArchiveRegistryUpdate,
    ArchiveDatasetCreate,
    ArchiveDatasetUpdate,
} from '@/types/registry';

export async function createArchive(data: ArchiveRegistryCreate) {
    return prisma.archiveRegistry.create({
        data: {
            code: data.code,
            name: data.name,
            oaiUrl: data.oaiUrl,
            website: data.website,
            parserType: data.parserType,
            parserConfig: data.parserConfig,
            metadata: data.metadata,
        },
    });
}

export async function updateArchive(code: string, data: ArchiveRegistryUpdate) {
    return prisma.archiveRegistry.update({
        where: { code },
        data,
    });
}

export async function getArchive(code: string) {
    return prisma.archiveRegistry.findUnique({
        where: { code },
        include: {
            datasets: true,
        },
    });
}

export async function listArchives() {
    return prisma.archiveRegistry.findMany({
        include: {
            datasets: true,
        },
        orderBy: {
            name: 'asc',
        },
    });
}

export async function deleteArchive(code: string) {
    return prisma.archiveRegistry.delete({
        where: { code },
    });
}

export async function createDataset(data: ArchiveDatasetCreate) {
    return prisma.archiveDataset.create({
        data: {
            archiveCode: data.archiveCode,
            setSpec: data.setSpec,
            setName: data.setName,
            setDescription: data.setDescription,
            metadata: data.metadata,
        },
    });
}

export async function updateDataset(id: string, data: ArchiveDatasetUpdate) {
    return prisma.archiveDataset.update({
        where: { id },
        data,
    });
}

export async function getDataset(id: string) {
    return prisma.archiveDataset.findUnique({
        where: { id },
        include: {
            archive: true,
            harvestSessions: {
                orderBy: {
                    startedAt: 'desc',
                },
                take: 10,
            },
        },
    });
}

export async function listDatasets(archiveCode: string) {
    return prisma.archiveDataset.findMany({
        where: { archiveCode },
        orderBy: {
            setSpec: 'asc',
        },
    });
}

export async function deleteDataset(id: string) {
    return prisma.archiveDataset.delete({
        where: { id },
    });
}

export async function updateArchiveHealth(code: string, status: string) {
    return prisma.archiveRegistry.update({
        where: { code },
        data: {
            overallStatus: status,
            lastHealthCheck: new Date(),
        },
    });
}