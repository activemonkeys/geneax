// src/lib/parsers/registry.ts

import { Parser, ParserType, ParserRegistryEntry } from '@/types/parser';

class ParserRegistry {
    private parsers: Map<ParserType, ParserRegistryEntry> = new Map();

    register(entry: ParserRegistryEntry): void {
        this.parsers.set(entry.type, entry);
    }

    get(type: ParserType): Parser | undefined {
        return this.parsers.get(type)?.parser;
    }

    getMetadata(type: ParserType): ParserRegistryEntry | undefined {
        return this.parsers.get(type);
    }

    list(): ParserRegistryEntry[] {
        return Array.from(this.parsers.values());
    }

    has(type: ParserType): boolean {
        return this.parsers.has(type);
    }
}

export const parserRegistry = new ParserRegistry();

export function registerParser(entry: ParserRegistryEntry): void {
    parserRegistry.register(entry);
}

export function getParser(type: ParserType): Parser | undefined {
    return parserRegistry.get(type);
}

export function listParsers(): ParserRegistryEntry[] {
    return parserRegistry.list();
}