# Geneax - Quick Start Guide

## Wat zit er in dit project?

Een complete TypeScript/Prisma pipeline voor het harvesten van Nederlandse genealogische data via OAI-PMH.

### Structuur

geneax/
├── prisma/
│   ├── schema.prisma       # Database model (Source, Record, Person, HarvestLog)
│   └── migrations/
│       └── init.sql        # SQL voor partitioned tables
├── src/
│   ├── harvester/
│   │   └── harvest.ts      # Download XML van archieven
│   ├── processor/
│   │   └── process.ts      # Verwerk XML naar database
│   ├── lib/
│   │   ├── a2a-parser.ts   # A2A XML parser
│   │   ├── oai-client.ts   # OAI-PMH client
│   │   ├── prisma.ts       # Database client
│   │   ├── config.ts       # Configuratie
│   │   └── logger.ts       # Logging
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   └── scripts/
│       ├── add-source.ts   # Bronnen beheren
│       ├── test-parser.ts  # Test de A2A parser
│       └── test-oai.ts     # Test OAI-PMH endpoints
├── data/
│   ├── raw/                # Gedownloade XML bestanden
│   └── processed/          # Verwerkte bestanden
├── package.json
├── tsconfig.json
├── .env.example
└── README.md

```plaintext
geneax/
├── prisma/
│   ├── schema.prisma       # Database model (Source, Record, Person, HarvestLog)
│   └── migrations/
│       └── init.sql        # SQL voor partitioned tables
├── src/
│   ├── harvester/
│   │   └── harvest.ts      # Download XML van archieven
│   ├── processor/
│   │   └── process.ts      # Verwerk XML naar database
│   ├── lib/
│   │   ├── a2a-parser.ts   # A2A XML parser
│   │   ├── oai-client.ts   # OAI-PMH client
│   │   ├── prisma.ts       # Database client
│   │   ├── config.ts       # Configuratie
│   │   └── logger.ts       # Logging
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   └── scripts/
│       ├── add-source.ts   # Bronnen beheren
│       ├── test-parser.ts  # Test de A2A parser
│       └── test-oai.ts     # Test OAI-PMH endpoints
├── data/
│   ├── raw/                # Gedownloade XML bestanden
│   └── processed/          # Verwerkte bestanden
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Installatie

### 1. Vereisten

- Node.js 18+
- PostgreSQL 14+ (met een lege database genaamd 'geneax')
- pnpm (of npm)

### 2. Project setup

```bash
# Unzip het project
unzip geneax.zip
cd geneax

# Installeer dependencies
pnpm install
# of: npm install

# Kopieer environment file
cp .env.example .env
```

### 3. Database configuratie

Edit `.env` en zet je database URL:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/geneax"
```

### 4. Database initialisatie

**Belangrijk**: De Record tabel is gepartitioneerd. Dit moet je handmatig doen via SQL.

```bash
# Maak de database aan (als die nog niet bestaat)
createdb geneax

# Draai het init script
psql -d geneax -f prisma/migrations/init.sql
```

Dit script maakt:

- Alle tabellen (Source, Record, Person, HarvestLog)
- Partities voor Record (1500-2100, per periode)
- Indexen voor snelle queries
- Seed data met bekende archieven (BHIC, SAA, GA, WBA)

### 5. Prisma client genereren

```bash
pnpm prisma generate
# of: npx prisma generate
```

## Gebruik

### Stap 1: Test de parser

```bash
pnpm tsx src/scripts/test-parser.ts
```

Dit test de A2A parser met voorbeelddata.

### Stap 2: Bekijk beschikbare bronnen

```bash
pnpm tsx src/scripts/add-source.ts
```

Toont de bronnen in je database en voegt bekende archieven toe.

### Stap 3: Test een OAI-PMH endpoint

```bash
pnpm tsx src/scripts/test-oai.ts --url="https://api.bhic.nl/oai-pmh"
```

### Stap 4: Harvest data

```bash
# Download 100 geboorteaktes van BHIC (voor testen)
pnpm tsx src/harvester/harvest.ts --source=bhic --set=bs_geboorte --limit=100

# Download alles (kan lang duren!)
pnpm tsx src/harvester/harvest.ts --source=bhic --set=bs_geboorte
```

XML bestanden worden opgeslagen in `data/raw/bhic/bs_geboorte/`

### Stap 5: Verwerk de XML naar de database

```bash
# Dry run (alleen parsen, niet opslaan)
pnpm tsx src/processor/process.ts --dry-run

# Echt verwerken
pnpm tsx src/processor/process.ts
```

### Stap 6: Bekijk de data

```bash
# Via Prisma Studio (GUI)
pnpm prisma studio

# Of via psql
psql -d geneax -c "SELECT COUNT(*) FROM \"Record\";"
psql -d geneax -c "SELECT * FROM \"Person\" WHERE surname = 'Jansen' LIMIT 10;"
```

## Bekende OAI-PMH Endpoints

| Code | Archief | URL |
|------|---------|-----|
| BHIC | Brabants Historisch Informatie Centrum | <https://api.bhic.nl/oai-pmh> |
| SAA | Stadsarchief Amsterdam | <https://webservices.picturae.com/a2a/>... |
| GA | Gelders Archief | <https://www.geldersarchief.nl/oai> |
| WBA | West-Brabants Archief | <https://api.memorix.io/oai-pmh/v1/>... |

## Tips

1. **Begin klein**: Test eerst met `--limit=100` voordat je miljoenen records gaat downloaden.

2. **Resumption**: Als een harvest wordt onderbroken, kun je hervatten met `--resume`.

3. **Partitionering check**:

   ```sql
   SELECT tableoid::regclass, COUNT(*) 
   FROM "Record" 
   GROUP BY tableoid;
   ```

4. **Zoeken op naam**:

   ```sql
   SELECT r.*, p.* 
   FROM "Person" p 
   JOIN "Record" r ON p."recordId" = r.id AND p."recordYear" = r."eventYear"
   WHERE p.surname ILIKE 'jansen%'
   LIMIT 10;
   ```

## Volgende stappen

- [ ] Meer archieven toevoegen
- [ ] Full-text search met pg_trgm of Elasticsearch
- [ ] Web interface voor zoeken
- [ ] Deduplicatie van personen
