import { BaseParser } from './base-parser';
import { A2AParser } from './a2a-parser';
import type { ParserConfig } from '@/types/index';

type ParserConstructor = new (config?: ParserConfig) => BaseParser;

class ParserRegistry {
    private parsers: Map<string, ParserConstructor> = new Map();

    register(type: string, parser: ParserConstructor): void {
        this.parsers.set(type, parser);
    }

    get(type: string, config?: ParserConfig): BaseParser | null {
        const ParserClass = this.parsers.get(type);
        if (!ParserClass) return null;
        return new ParserClass(config);
    }

    hasParser(type: string): boolean {
        return this.parsers.has(type);
    }
}

const registry = new ParserRegistry();

registry.register('a2a', A2AParser);

export default registry;