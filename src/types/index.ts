export interface A2AData {
    Source?: any;
    Person?: any;
    Relation?: any;
    Event?: any;
    'a2a:Source'?: any;
    'a2a:Person'?: any;
    'a2a:Relation'?: any;
    'a2a:Event'?: any;
    [key: string]: any;
}

export interface A2ASource {
    SourceType?: any;
    SourceDate?: any;
    SourcePlace?: any;
    SourceIndexDate?: any;
    'a2a:SourceType'?: any;
    'a2a:SourceDate'?: any;
    'a2a:SourcePlace'?: any;
    'a2a:SourceIndexDate'?: any;
    [key: string]: any;
}

export interface A2APerson {
    PersonName?: any;
    'a2a:PersonName'?: any;
    Age?: any;
    'a2a:Age'?: any;
    Occupation?: any;
    'a2a:Occupation'?: any;
    Residence?: any;
    'a2a:Residence'?: any;
    [key: string]: any;
}

export interface A2ARelation {
    RelationType?: any;
    'a2a:RelationType'?: any;
    Person?: any;
    'a2a:Person'?: any;
    [key: string]: any;
}

export interface A2AEvent {
    EventDate?: any;
    'a2a:EventDate'?: any;
    [key: string]: any;
}

export interface ParsedDate {
    year: number;
    month?: number;
    day?: number;
    precision: 'year' | 'month' | 'day' | 'circa' | 'range' | 'unknown';
    original?: string;
}

export interface ParsedRecord {
    externalId: string;
    sourceCode: string;
    setSpec: string;
    recordType: string;
    eventDate: ParsedDate;
    eventPlace?: string;
    persons: Array<{
        role: string;
        givenName?: string;
        surname?: string;
        patronym?: string;
        prefix?: string;
        age?: number;
        occupation?: string;
        residence?: string;
    }>;
    rawData: any;
}

export interface OAIResponse {
    'OAI-PMH'?: {
        responseDate?: string;
        request?: any;
        error?: {
            '@_code'?: string;
            '#text'?: string;
        };
        Identify?: {
            repositoryName?: string;
            baseURL?: string;
            protocolVersion?: string;
            adminEmail?: string;
        };
        ListRecords?: {
            record?: OAIRecord | OAIRecord[];
            resumptionToken?: OAIResumptionToken | string;
        };
        ListSets?: {
            set?: any;
        };
    };
}

export interface OAIRecord {
    header?: {
        identifier?: string;
        datestamp?: string;
        status?: string;
    };
    metadata?: {
        A2A?: A2AData;
        'a2a:A2A'?: A2AData;
        [key: string]: any;
    };
}

export interface OAIResumptionToken {
    '#text'?: string;
    '@_completeListSize'?: string;
    '@_cursor'?: string;
}

export interface HarvestConfig {
    sourceCode: string;
    setSpec: string;
    limit?: number;
    resumptionToken?: string;
}

export interface HarvestResult {
    success: boolean;
    filesCreated: number;
    recordsHarvested: number;
    resumptionToken?: string;
    error?: string;
}

export interface ParserConfig {
    personRoleMapping?: Record<string, string>;
    recordTypeMapping?: Record<string, string>;
    xmlPaths?: {
        person?: string[];
        relation?: string[];
        source?: string[];
        date?: string[];
    };
    customLogic?: string;
}

export interface SourceConfig {
    code: string;
    name: string;
    oaiUrl: string;
    sets: string[];
    parserType: string;
    parserConfig?: ParserConfig;
}