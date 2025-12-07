# Development

## Snapshot Generation

node snapshot.mjs full
node snapshot.mjs minimal
node snapshot.mjs database

## Prisma and PostgreSQL Setup

pnpm prisma migrate dev --name init_docker
pnpm prisma migrate dev --name add_population_register
pnpm prisma studio

npx prisma migrate reset // om de data te resetten, verwijder daarvoor alle migraties in de prisma folder
npx prisma migrate dev --name init

## Core Development

### Stap 1: Test de A2A parser (geen database nodig)

pnpm test:parser  

### Stap 2: Test de OAI-PMH endpoints (geen database nodig)

pnpm test:oai

### Stap 3: Voeg bronnen toe aan de database

pnpm add-source

### Stap 4: Harvest een kleine batch (100 records)

pnpm harvest -- --source=bhic --set=bs_geboorte --limit=100

### Stap 5: Verwerk de XML naar de database (dry-run eerst)

pnpm process -- --dry-run
pnpm process

### Stap 6: Bekijk de data

pnpm db:studio

## Tekst

Momenteel ben ik bezig om een nextjs project om te zetten naar een monorepo. Bijgaand de huidige code. Benieuwd wat je er al van vindt

ok.. laten we het als volgt doen... Geef de compleet bijgewerkte code van alle files die aangepast/nieuw gemaakt moeten worden, zonder weglatingen, zonder andere dingen aan te passen en zonder onnodig commentaar. Doe het in batches van 3 files, elke file heeft zijn eigen blok waardoor ik het in 1x kan kopieren. Aan het einde van elke batch geef je aan welke files er in de volgende batch zitten. Als alle batches klaar zijn, geef je aan welke files verwijderd kunnen worden. Zorg er graag voor dat elk bestand in een apart Markdown codeblok (drie backticks) staat, zodat de interface de kopieerknop per blok toont.
