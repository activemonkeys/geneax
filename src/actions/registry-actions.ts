// src/actions/registry-actions.ts

'use server';

import { listArchives, getArchive, listDatasets } from '@/lib/archive-registry';

export async function getArchivesAction() {
    try {
        return await listArchives();
    } catch (error) {
        console.error('Error fetching archives:', error);
        throw new Error('Failed to fetch archives');
    }
}

export async function getArchiveAction(code: string) {
    try {
        const archive = await getArchive(code);
        if (!archive) {
            throw new Error('Archive not found');
        }
        return archive;
    } catch (error) {
        console.error('Error fetching archive:', error);
        throw new Error('Failed to fetch archive');
    }
}

export async function getDatasetsAction(archiveCode: string) {
    try {
        return await listDatasets(archiveCode);
    } catch (error) {
        console.error('Error fetching datasets:', error);
        throw new Error('Failed to fetch datasets');
    }
}