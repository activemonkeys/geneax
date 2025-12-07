export interface ParserConfig {
    [key: string]: any;
}

export interface ParserMetadata {
    name: string;
    version: string;
    description: string;
    supportedFormats: string[];
    requiredConfig?: string[];
}

export interface Parser {
    metadata: ParserMetadata;
    validateConfig(config: ParserConfig): boolean;
    parse(xml: string, config?: ParserConfig): any;
}

export type ParserType = 'a2a_base' | 'a2a_relationep' | 'a2a_v2.1';

export interface ParserRegistryEntry {
    type: ParserType;
    parser: Parser;
    metadata: ParserMetadata;
}