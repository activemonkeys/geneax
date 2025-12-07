# Geneax - Genealogische Data Pipeline

Een TypeScript-gebaseerde pipeline voor het harvesten, verwerken en opslaan van Nederlandse genealogische data via OAI-PMH (Open Archives Initiative Protocol for Metadata Harvesting).

## Doel

Geneax haalt genealogische data op van Nederlandse archieven (Burgerlijke Stand en DTB) via de A2A (Archives 2 All) standaard en slaat deze op in een gestructureerde PostgreSQL database.

## Architectuur

```html
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OAI-PMH       │     │   Raw XML       │     │   PostgreSQL    │
│   Endpoints     │────▶│   Storage       │────▶│   Database      │
│   (Archieven)   │     │   (./data/raw)  │     │   (Partitioned) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
   ┌────▼────┐            ┌─────▼─────┐          ┌──────▼──────┐
   │Harvester│            │ Processor │          │   Record    │
   │         │            │           │          │   Person    │
   │         │            │ A2A Parser│          │   Source    │
   └─────────┘            └───────────┘          └─────────────┘
```

### Componenten

1. **Harvester** (`src/harvester/`)
   - Verbindt met OAI-PMH endpoints van Nederlandse archieven
   - Downloadt XML batches en slaat deze op als bestanden
   - Ondersteunt incremental harvesting via resumptionToken
   - Logt voortgang in de database

2. **Processor** (`src/processor/`)
   - Leest opgeslagen XML bestanden
   - Parseert A2A XML naar gestructureerde data
   - Extraheert personen met hun rollen (Kind, Vader, Bruidegom, etc.)
   - Slaat records en personen op in PostgreSQL

3. **Database** (PostgreSQL + Prisma)
   - Gepartitioneerd op jaar voor optimale performance
   - `Source`: Metadata over archiefbronnen
   - `Record`: Aktes met volledige A2A data in JSONB
   - `Person`: Geëxtraheerde personen met rollen en namen
   - `HarvestLog`: Administratie van harvest-sessies

## Datamodel

### Source (Archiefbron)

Metadata over elk archief: naam, OAI-PMH URL, beschikbare sets.

### Record (Akte)

De container voor een akte. Bevat:

- Unieke identifier van het archief
- Type (BS_BIRTH, BS_MARRIAGE, BS_DEATH, DTB_BAPTISM, etc.)
- Datum en plaats van de gebeurtenis
- Volledige A2A data als JSON

### Person (Persoon)

Geëxtraheerde personen uit aktes:

- Rol (KIND, VADER, MOEDER, BRUIDEGOM, BRUID, GETUIGE, etc.)
- Voornaam, achternaam, patroniem, tussenvoegsel
- Leeftijd indien bekend

## Partitionering

De `Record` tabel is gepartitioneerd op `eventYear`:

- **1500-1600**: 1 partitie (weinig data)
- **1600-1700**: 1 partitie
- **1700-1750**: 1 partitie
- **1750-1800**: 1 partitie
- **1800-1810**: 1 partitie (transitieperiode)
- **1810-1820, 1820-1830, ...**: Per decennium (BS periode, veel data)

## Installatie

### Vereisten

- Node.js 18+
- PostgreSQL 14+
- pnpm (of npm/yarn)

### Setup

```bash
# 1. Clone en installeer dependencies
cd geneax
pnpm install

# 2. Configureer database
cp .env.example .env
# Edit .env met je DATABASE_URL

# 3. Maak database tabellen en partities
psql -d geneax -f prisma/migrations/init.sql

# 4. Genereer Prisma client
pnpm prisma generate

# 5. (Optioneel) Voeg een testbron toe
pnpm tsx src/scripts/add-source.ts
```

## Gebruik

### Harvesten van data

```bash
# Harvest één specifieke set van een bron
pnpm tsx src/harvester/harvest.ts --source=bhic --set=bs_geboorte

# Harvest met limiet (voor testen)
pnpm tsx src/harvester/harvest.ts --source=bhic --set=bs_geboorte --limit=100
```

### Verwerken van gedownloade XML

```bash
# Verwerk alle onverwerkte bestanden
pnpm tsx src/processor/process.ts

# Verwerk één specifiek bestand
pnpm tsx src/processor/process.ts --file=batch_1234567890.xml
```

### Database queries

```bash
# Interactieve Prisma Studio
pnpm prisma studio

# Of via psql
psql -d geneax -c "SELECT COUNT(*) FROM \"Record\";"
psql -d geneax -c "SELECT COUNT(*) FROM \"Person\" WHERE surname = 'Jansen';"
```

## A2A Standaard

De A2A (Archives 2 All) XML standaard wordt gebruikt door Nederlandse archieven. De structuur bevat:

- **Source**: Metadata over de akte (datum, plaats, type)
- **Person**: Hoofdpersoon (kind bij geboorte, overledene bij overlijden)
- **Relation**: Gerelateerde personen (ouders, partners, getuigen)

Geneax parseert deze structuur en extraheert alle personen met hun rollen.

## Bekende OAI-PMH Endpoints

| Archief | URL | Sets |
|---------|-----|------|
| BHIC (Brabant) | <https://api.bhic.nl/oai-pmh> | bs_geboorte, bs_huwelijk, bs_overlijden |
| Gelders Archief | <https://www.geldersarchief.nl/oai> | diverse |
| Tresoar (Friesland) | <https://www.tresoar.nl/oai> | diverse |

## Roadmap

- [ ] PoC: Basis harvester en processor
- [ ] A2A parser voor alle aktetypes
- [ ] Incremental harvesting (delta updates)
- [ ] Full-text search (Elasticsearch/Meilisearch)
- [ ] Web interface voor zoeken
- [ ] Deduplicatie van personen

## Licentie

MIT
