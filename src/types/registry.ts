export interface ArchiveRegistryMetadata {
    region?: string;
    city?: string;
    contact?: string;
    coverage?: {
        dtb?: {
            from: number;
            to: number;
        };
        bs?: {
            from: number;
            to: number;
        };
        [key: string]: any;
    };
    notes?: string;
    [key: string]: any;
}

export interface ArchiveRegistryCreate {
    code: string;
    name: string;
    oaiUrl: string;
    website?: string;
    parserType: string;
    parserConfig?: Record<string, any>;
    metadata?: ArchiveRegistryMetadata;
}

export interface ArchiveRegistryUpdate {
    name?: string;
    oaiUrl?: string;
    website?: string;
    parserType?: string;
    parserConfig?: Record<string, any>;
    metadata?: ArchiveRegistryMetadata;
    overallStatus?: string;
    lastHealthCheck?: Date;
}

export interface ArchiveDatasetMetadata {
    estimatedRecords?: number;
    dateRange?: {
        from?: string;
        to?: string;
    };
    recordTypes?: string[];
    [key: string]: any;
}

export interface ArchiveDatasetCreate {
    archiveCode: string;
    setSpec: string;
    setName?: string;
    setDescription?: string;
    metadata?: ArchiveDatasetMetadata;
}

export interface ArchiveDatasetUpdate {
    setName?: string;
    setDescription?: string;
    status?: string;
    recordCount?: number;
    lastHarvest?: Date;
    metadata?: ArchiveDatasetMetadata;
}

export type ArchiveStatus = 'online' | 'offline' | 'degraded' | 'unknown';
export type DatasetStatus = 'active' | 'harvesting' | 'paused' | 'error' | 'unknown';