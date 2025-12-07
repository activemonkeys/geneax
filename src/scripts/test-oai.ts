// src/scripts/test-oai.ts

/**
 * Kleine testscript om te controleren of de OAI-PMH endpoint bereikbaar is.
 * Voert een simpele `Identify`-call uit op elk archief in de ARCHIVES array.
 */

// Bovenaan toevoegen voor SSL fix (self-signed certificates toestaan bij testen)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

type Archive = {
    name: string;
    url: string;
};

// Gebruik alleen de Open Archieven endpoint
const ARCHIVES: Archive[] = [
    { name: 'Open Archieven', url: 'https://api.openarch.nl/oai-pmh/' },
];

/**
 * Bouw een OAI-PMH URL met de opgegeven parameters.
 */
function buildOaiUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
}

/**
 * Voer een eenvoudige OAI-PMH Identify call uit.
 */
async function testIdentify(archive: Archive): Promise<void> {
    const url = buildOaiUrl(archive.url, { verb: 'Identify' });

    console.log(`\n=== Test OAI-PMH: ${archive.name} ===`);
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url);

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error(`❌ Fout bij ophalen van Identify voor ${archive.name}`);
            return;
        }

        const text = await response.text();

        // Log alleen de eerste ~10 regels ter inspectie, zodat het niet te veel wordt
        const lines = text.split('\n').slice(0, 10);
        console.log('--- Eerste regels van response ---');
        console.log(lines.join('\n'));
        console.log('--- Einde voorbeeldresponse ---');

        console.log(`✅ Identify call gelukt voor ${archive.name}`);
    } catch (error) {
        console.error(`❌ Exception bij ophalen van Identify voor ${archive.name}:`);
        console.error(error);
    }
}

/**
 * Main entrypoint
 */
async function main() {
    console.log('Start OAI-PMH tests...\n');

    for (const archive of ARCHIVES) {
        await testIdentify(archive);
    }

    console.log('\nKlaar met OAI-PMH tests.');
}

// Alleen uitvoeren als dit script direct wordt aangeroepen (niet geïmporteerd)
void main();
