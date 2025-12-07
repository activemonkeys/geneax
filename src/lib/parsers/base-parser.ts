// src/lib/parsers/base-parser.ts

import { Parser, ParserConfig, ParserMetadata } from '@/types/parser';

export abstract class BaseParser implements Parser {
    abstract metadata: ParserMetadata;

    validateConfig(config: ParserConfig): boolean {
        if (!this.metadata.requiredConfig) {
            return true;
        }

        for (const key of this.metadata.requiredConfig) {
            if (!(key in config)) {
                throw new Error(`Missing required config key: ${key}`);
            }
        }

        return true;
    }

    abstract parse(xml: string, config?: ParserConfig): any;

    protected parseDate(dateStr: string | undefined): {
        year?: number;
        month?: number;
        day?: number;
        precision: string;
        original?: string;
    } {
        if (!dateStr) {
            return { precision: 'unknown' };
        }

        const original = dateStr;
        const parts = dateStr.split('-');

        if (parts.length === 3) {
            return {
                year: parseInt(parts[0]),
                month: parseInt(parts[1]),
                day: parseInt(parts[2]),
                precision: 'day',
                original,
            };
        }

        if (parts.length === 2) {
            return {
                year: parseInt(parts[0]),
                month: parseInt(parts[1]),
                precision: 'month',
                original,
            };
        }

        if (parts.length === 1 && parts[0].length === 4) {
            return {
                year: parseInt(parts[0]),
                precision: 'year',
                original,
            };
        }

        return { precision: 'unknown', original };
    }
}