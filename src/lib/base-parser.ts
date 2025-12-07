import type { A2AData, ParsedRecord, ParserConfig } from '@/types/index';

export interface ParserContext {
    sourceCode: string;
    setSpec: string;
    externalId: string;
    config?: ParserConfig;
}

export abstract class BaseParser {
    protected config: ParserConfig;

    constructor(config?: ParserConfig) {
        this.config = config || {};
    }

    abstract parse(a2a: A2AData, context: ParserContext): ParsedRecord | null;

    protected mapRecordType(sourceType: string): string {
        if (this.config.recordTypeMapping && this.config.recordTypeMapping[sourceType]) {
            return this.config.recordTypeMapping[sourceType];
        }

        const lower = sourceType.toLowerCase();
        if (lower.includes('geboorte') || lower.includes('birth')) return 'BS_BIRTH';
        if (lower.includes('huwelijk') || lower.includes('marriage')) return 'BS_MARRIAGE';
        if (lower.includes('overlijden') || lower.includes('death')) return 'BS_DEATH';
        if (lower.includes('doop') || lower.includes('baptism')) return 'DTB_BAPTISM';
        if (lower.includes('trouw')) return 'DTB_MARRIAGE';
        if (lower.includes('begraaf') || lower.includes('burial')) return 'DTB_BURIAL';
        if (lower.includes('bevolking') || lower.includes('population')) return 'POPULATION_REGISTER';
        return 'OTHER';
    }

    protected mapPersonRole(relationType: string): string {
        if (this.config.personRoleMapping && this.config.personRoleMapping[relationType]) {
            return this.config.personRoleMapping[relationType];
        }

        const lower = relationType.toLowerCase();
        if (lower.includes('vader') || lower.includes('father')) return 'FATHER';
        if (lower.includes('moeder') || lower.includes('mother')) return 'MOTHER';
        if (lower.includes('bruidegom') || lower.includes('groom')) return 'GROOM';
        if (lower.includes('bruid') || lower.includes('bride')) return 'BRIDE';
        if (lower.includes('getuige') || lower.includes('witness')) return 'WITNESS';
        if (lower.includes('kind') || lower.includes('child')) return 'CHILD';
        if (lower === 'geregistreerde') return 'REGISTRANT';
        if (lower.includes('overledene') || lower.includes('deceased')) return 'DECEASED';
        return 'OTHER';
    }

    protected determineMainRole(recordType: string): string {
        if (recordType === 'BS_BIRTH' || recordType === 'DTB_BAPTISM') return 'CHILD';
        if (recordType === 'BS_DEATH' || recordType === 'DTB_BURIAL') return 'DECEASED';
        if (recordType === 'BS_MARRIAGE' || recordType === 'DTB_MARRIAGE') return 'GROOM';
        if (recordType === 'POPULATION_REGISTER') return 'REGISTRANT';
        return 'OTHER';
    }

    protected extractValue(obj: any, ...paths: string[]): string | undefined {
        for (const path of paths) {
            const parts = path.split('.');
            let current = obj;

            for (const part of parts) {
                if (!current) break;
                current = current[part];
            }

            if (current) {
                if (typeof current === 'string') return current;
                if (current['#text']) return current['#text'];
                return String(current);
            }
        }
        return undefined;
    }
}