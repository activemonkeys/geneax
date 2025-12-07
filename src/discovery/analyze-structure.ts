// src/discovery/analyze-structure.ts

import { writeFile } from 'fs/promises';
import { join } from 'path';

interface XMLStructure {
    namespaces: string[];
    hasRelationEP: boolean;
    recordTypes: Set<string>;
    personRoles: Set<string>;
    eventTypes: Set<string>;
    fields: Set<string>;
}

export function analyzeXMLStructure(records: any[]): XMLStructure {
    const structure: XMLStructure = {
        namespaces: [],
        hasRelationEP: false,
        recordTypes: new Set(),
        personRoles: new Set(),
        eventTypes: new Set(),
        fields: new Set(),
    };

    const namespaces = new Set<string>();

    for (const record of records) {
        const metadata = record.metadata;

        Object.keys(metadata).forEach((key) => {
            if (key.includes(':')) {
                const namespace = key.split(':')[0];
                namespaces.add(namespace);
            }
        });

        if (metadata['a2a:A2A']) {
            analyzeA2ARecord(metadata['a2a:A2A'][0], structure);
        }
    }

    structure.namespaces = Array.from(namespaces);

    return structure;
}

function analyzeA2ARecord(a2aData: any, structure: XMLStructure): void {
    if (!a2aData) return;

    if (a2aData.RelationEP) {
        structure.hasRelationEP = true;
    }

    const source = a2aData.Source?.[0];
    if (source?.SourceType?.[0]?._) {
        structure.recordTypes.add(source.SourceType[0]._);
    }

    const persons = a2aData.Person || [];
    persons.forEach((person: any) => {
        const personName = person.PersonName?.[0];
        if (personName) {
            if (personName.PersonNameFirstName) structure.fields.add('PersonNameFirstName');
            if (personName.PersonNameLastName) structure.fields.add('PersonNameLastName');
            if (personName.PersonNamePrefixLastName) structure.fields.add('PersonNamePrefixLastName');
        }

        if (person.BirthDate) structure.fields.add('BirthDate');
        if (person.BirthPlace) structure.fields.add('BirthPlace');
        if (person.DeathDate) structure.fields.add('DeathDate');
        if (person.DeathPlace) structure.fields.add('DeathPlace');
        if (person.Gender) structure.fields.add('Gender');
        if (person.Occupation) structure.fields.add('Occupation');
        if (person.Religion) structure.fields.add('Religion');
        if (person.Age) structure.fields.add('Age');
    });

    const relations = a2aData.RelationEP || a2aData.Relation || [];
    relations.forEach((relation: any) => {
        if (relation.RelationType?.[0]?._) {
            structure.personRoles.add(relation.RelationType[0]._);
        }
    });

    const events = a2aData.Event || [];
    events.forEach((event: any) => {
        if (event.EventType?.[0]?._) {
            structure.eventTypes.add(event.EventType[0]._);
        }
    });
}

export async function generateAnalysisReport(
    archiveCode: string,
    structure: XMLStructure
): Promise<void> {
    const report = `# XML Structure Analysis - ${archiveCode}

## Namespaces
${structure.namespaces.map((ns) => `- ${ns}`).join('\n')}

## Features
- RelationEP Support: ${structure.hasRelationEP ? 'Yes' : 'No'}

## Record Types
${Array.from(structure.recordTypes).map((type) => `- ${type}`).join('\n')}

## Person Roles
${Array.from(structure.personRoles).map((role) => `- ${role}`).join('\n')}

## Event Types
${Array.from(structure.eventTypes).map((type) => `- ${type}`).join('\n')}

## Available Fields
${Array.from(structure.fields).sort().map((field) => `- ${field}`).join('\n')}
`;

    const outputPath = join(process.cwd(), 'sources', archiveCode, 'analysis-report.md');
    await writeFile(outputPath, report);
    console.log(`Analysis report saved to: ${outputPath}`);
}