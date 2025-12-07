export interface HarvestSessionStats {
    recordsProcessed: number;
    recordsTotal?: number;
    recordsSkipped?: number;
    recordsError?: number;
    filesCreated?: number;
    bytesProcessed?: number;
    startTime: string;
    endTime?: string;
    duration?: number;
}

export interface HarvestError {
    timestamp: string;
    error: string;
    recordId?: string;
    context?: Record<string, any>;
}

export interface HarvestSessionCreate {
    datasetId: string;
    recordsTotal?: number;
}

export interface HarvestSessionUpdate {
    status?: string;
    recordsProcessed?: number;
    recordsTotal?: number;
    errors?: HarvestError[];
    stats?: HarvestSessionStats;
    completedAt?: Date;
    duration?: number;
}

export type HarvestSessionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';